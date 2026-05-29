import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const configPath = path.join(rootDir, "config.json");
const backupPath = path.join(rootDir, "config.json.smoke-backup");
const dataDir = path.join(rootDir, "data");

const appHost = "127.0.0.1";
const appPort = 18787;
const mockHost = "127.0.0.1";
const mockPort = 18788;
const appBase = `http://${appHost}:${appPort}`;
const mockBase = `http://${mockHost}:${mockPort}`;
const adminToken = "smoke-admin-token";

let hadConfig = false;
let ownsConfig = false;

async function main() {
  await withServers("config.mock.json", async () => {
    const response = await chat();
    assert(response.status === 200, `expected proxy 200, got ${response.status}`);
    const body = await response.json();
    assert(body.choices?.[0]?.message?.content === "mock response", "unexpected proxy response");

    const models = await fetch(`${appBase}/v1/models`, {
      headers: { authorization: "Bearer asg_demo_local_key" }
    }).then((item) => item.json());
    assert(models.object === "list", "unexpected models response object");
    assert(models.data.some((item) => item.id === "mock-model"), "models response is missing mock-model");

    const blockedSummary = await fetch(`${appBase}/api/dashboard/summary`);
    assert(blockedSummary.status === 401, `expected admin 401, got ${blockedSummary.status}`);

    const summary = await adminFetch(`${appBase}/api/dashboard/summary`).then((item) => item.json());
    assert(summary.requestCount === 1, `expected requestCount=1, got ${summary.requestCount}`);
    assert(summary.todaySpend > 0, `expected todaySpend > 0, got ${summary.todaySpend}`);

    const csv = await adminFetch(`${appBase}/api/usage.csv`).then((item) => item.text());
    assert(csv.includes("createdAt,projectId,virtualKeyId"), "unexpected CSV header");
    assert(csv.includes("mock-model"), "CSV is missing mock-model record");

    const createdProvider = await postJson(`${appBase}/api/providers`, {
      id: "mock-extra",
      name: "Mock Extra",
      baseUrl: `${mockBase}/v1`,
      apiKey: "extra-secret-key"
    });
    assert(createdProvider.provider.id === "mock-extra", "failed to create provider");

    const createdProject = await postJson(`${appBase}/api/projects`, {
      id: "extra-project",
      name: "Extra Project",
      providerId: "mock-extra",
      dailyBudgetUsd: 2,
      monthlyBudgetUsd: 20,
      maxRequestsPerMinute: 10
    });
    assert(createdProject.project.id === "extra-project", "failed to create project");

    const createdKey = await postJson(`${appBase}/api/virtual-keys`, {
      id: "extra-key",
      name: "Extra Key",
      projectId: "extra-project"
    });
    assert(createdKey.virtualKey.key.startsWith("asg_"), "failed to auto-generate virtual key");

    const createdModelPrice = await postJson(`${appBase}/api/model-prices`, {
      model: "new-priced-model",
      inputPricePer1MTokens: 2,
      outputPricePer1MTokens: 4
    });
    assert(createdModelPrice.modelPrice.model === "new-priced-model", "failed to create model price");

    const pricedResponse = await chat("new-priced-model", createdKey.virtualKey.key);
    assert(pricedResponse.status === 200, `expected priced model request 200, got ${pricedResponse.status}`);

    const config = await adminFetch(`${appBase}/api/config`).then((item) => item.json());
    const extraProvider = config.providers.find((item) => item.id === "mock-extra");
    assert(extraProvider, "public config is missing new provider");
    assert(extraProvider.apiKey !== "extra-secret-key", "public config must not expose plain API key");
    assert(config.modelPrices.some((item) => item.model === "new-priced-model"), "public config is missing new model price");

    const updatedUsage = await adminFetch(`${appBase}/api/usage`).then((item) => item.json());
    const pricedRecord = updatedUsage.records.find((item) => item.model === "new-priced-model");
    assert(pricedRecord, "usage is missing new-priced-model record");
    assert(pricedRecord.estimatedCostUsd === 0.006, `expected priced model cost 0.006, got ${pricedRecord.estimatedCostUsd}`);
  });

  await withServers("config.mock-low-budget.json", async () => {
    const response = await chat();
    assert(response.status === 402, `expected budget 402, got ${response.status}`);
  });

  await withServers("config.mock-low-rate.json", async () => {
    const first = await chat();
    assert(first.status === 200, `expected first request 200, got ${first.status}`);

    const second = await chat();
    assert(second.status === 429, `expected rate limit 429, got ${second.status}`);
  });

  restoreConfig();
  console.log("smoke test passed");
}

async function withServers(sourceFile, fn) {
  prepareConfig(sourceFile);
  resetData();

  const mock = start("node", ["apps/mock-provider/server.js"], {
    MOCK_PROVIDER_HOST: mockHost,
    MOCK_PROVIDER_PORT: String(mockPort)
  });
  const app = start("node", ["apps/server/src/server.js"]);

  try {
    await waitForHealth(`${mockBase}/health`);
    await waitForHealth(`${appBase}/health`);
    await fn();
  } finally {
    stop(app);
    stop(mock);
  }
}

function chat(model = "mock-model", token = "asg_demo_local_key") {
  return fetch(`${appBase}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "hello" }]
    })
  });
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-admin-token": adminToken },
    body: JSON.stringify(payload)
  });
  const body = await response.json();
  assert(response.ok, `POST ${url} failed: ${JSON.stringify(body)}`);
  return body;
}

function prepareConfig(sourceFile) {
  if (!ownsConfig && fs.existsSync(configPath) && !fs.existsSync(backupPath)) {
    fs.renameSync(configPath, backupPath);
    hadConfig = true;
  }
  if (ownsConfig && fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
  const config = JSON.parse(fs.readFileSync(path.join(rootDir, sourceFile), "utf8"));
  config.server.host = appHost;
  config.server.port = appPort;
  config.server.adminToken = adminToken;
  for (const provider of config.providers) {
    if (provider.id === "mock") {
      provider.baseUrl = `${mockBase}/v1`;
    }
  }
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  ownsConfig = true;
}

function adminFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "x-admin-token": adminToken
    }
  });
}

function restoreConfig() {
  if (ownsConfig && fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
  if (hadConfig && fs.existsSync(backupPath)) {
    fs.renameSync(backupPath, configPath);
  }
  fs.rmSync(dataDir, { recursive: true, force: true });
  ownsConfig = false;
}

function resetData() {
  fs.rmSync(dataDir, { recursive: true, force: true });
}

function start(command, args, env = {}) {
  const child = spawn(command, args, {
    cwd: rootDir,
    stdio: "pipe",
    windowsHide: true,
    env: { ...process.env, ...env }
  });
  child.stdout.on("data", () => {});
  child.stderr.on("data", (data) => {
    process.stderr.write(data);
  });
  return child;
}

function stop(child) {
  if (!child.killed) {
    child.kill();
  }
}

async function waitForHealth(url) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      await sleep(100);
    }
  }
  throw new Error(`health check timeout: ${url}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  restoreConfig();
  console.error(error);
  process.exit(1);
});
