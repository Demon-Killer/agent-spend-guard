import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

if (!apiKey) {
  console.log("OPENROUTER_API_KEY is not set; skipping real OpenRouter test.");
  process.exit(0);
}

const rootDir = process.cwd();
const configPath = path.join(rootDir, "config.json");
const backupPath = path.join(rootDir, "config.json.openrouter-backup");
const dataDir = path.join(rootDir, "data");

const appHost = "127.0.0.1";
const appPort = 18787;
const appBase = `http://${appHost}:${appPort}`;

let hadConfig = false;

async function main() {
  prepareConfig();
  resetData();

  const app = start("node", ["apps/server/src/server.js"]);

  try {
    await waitForHealth(`${appBase}/health`);

    const response = await fetch(`${appBase}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer asg_openrouter_test_key"
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: "Reply with exactly: AgentSpendGuard works."
          }
        ]
      })
    });

    const bodyText = await response.text();
    assert(response.status === 200, `expected 200, got ${response.status}: ${bodyText}`);

    const summary = await fetch(`${appBase}/api/dashboard/summary`).then((item) => item.json());
    assert(summary.requestCount === 1, `expected requestCount=1, got ${summary.requestCount}`);

    const csv = await fetch(`${appBase}/api/usage.csv`).then((item) => item.text());
    assert(csv.includes(model), `CSV is missing model record: ${model}`);

    console.log("real OpenRouter test passed");
  } finally {
    stop(app);
    restoreConfig();
  }
}

function prepareConfig() {
  if (fs.existsSync(configPath)) {
    fs.renameSync(configPath, backupPath);
    hadConfig = true;
  }

  const config = {
    server: {
      host: appHost,
      port: appPort
    },
    providers: [
      {
        id: "openrouter",
        name: "OpenRouter",
        type: "openai-compatible",
        baseUrl: "https://openrouter.ai/api/v1",
        apiKey,
        enabled: true
      }
    ],
    projects: [
      {
        id: "openrouter-test",
        name: "OpenRouter Test",
        providerId: "openrouter",
        dailyBudgetUsd: 1,
        monthlyBudgetUsd: 10,
        maxRequestsPerMinute: 10,
        enabled: true
      }
    ],
    virtualKeys: [
      {
        id: "openrouter-test-key",
        projectId: "openrouter-test",
        name: "OpenRouter Test Key",
        key: "asg_openrouter_test_key",
        enabled: true
      }
    ],
    modelPrices: [
      {
        model: "default",
        inputPricePer1MTokens: 1,
        outputPricePer1MTokens: 3
      }
    ]
  };

  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function restoreConfig() {
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
  if (hadConfig && fs.existsSync(backupPath)) {
    fs.renameSync(backupPath, configPath);
  }
  fs.rmSync(dataDir, { recursive: true, force: true });
}

function resetData() {
  fs.rmSync(dataDir, { recursive: true, force: true });
}

function start(command, args) {
  const child = spawn(command, args, {
    cwd: rootDir,
    stdio: "pipe",
    windowsHide: true
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

