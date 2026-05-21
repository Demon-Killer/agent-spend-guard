import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const configPath = path.join(rootDir, "config.json");
const backupPath = path.join(rootDir, "config.json.smoke-backup");
const dataDir = path.join(rootDir, "data");

let hadConfig = false;
let ownsConfig = false;

async function main() {
  prepareConfig("config.mock.json");
  resetData();

  const mock = start("node", ["apps/mock-provider/server.js"]);
  const app = start("node", ["apps/server/src/server.js"]);

  try {
    await waitForHealth("http://127.0.0.1:8788/health");
    await waitForHealth("http://127.0.0.1:8787/health");

    const response = await fetch("http://127.0.0.1:8787/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer asg_demo_local_key"
      },
      body: JSON.stringify({
        model: "mock-model",
        messages: [{ role: "user", content: "hello" }]
      })
    });
    assert(response.status === 200, `期望代理返回 200，实际 ${response.status}`);
    const body = await response.json();
    assert(body.choices?.[0]?.message?.content === "mock response", "代理响应内容不符合预期");

    const summary = await fetch("http://127.0.0.1:8787/api/dashboard/summary").then((item) => item.json());
    assert(summary.requestCount === 1, `期望 requestCount=1，实际 ${summary.requestCount}`);
    assert(summary.todaySpend > 0, `期望 todaySpend > 0，实际 ${summary.todaySpend}`);
  } finally {
    stop(app);
    stop(mock);
  }

  prepareConfig("config.mock-low-budget.json");
  resetData();

  const mock2 = start("node", ["apps/mock-provider/server.js"]);
  const app2 = start("node", ["apps/server/src/server.js"]);

  try {
    await waitForHealth("http://127.0.0.1:8788/health");
    await waitForHealth("http://127.0.0.1:8787/health");

    const response = await fetch("http://127.0.0.1:8787/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer asg_demo_local_key"
      },
      body: JSON.stringify({
        model: "mock-model",
        messages: [{ role: "user", content: "hello" }]
      })
    });
    assert(response.status === 402, `期望预算熔断返回 402，实际 ${response.status}`);
  } finally {
    stop(app2);
    stop(mock2);
    restoreConfig();
  }

  console.log("smoke test 通过");
}

function prepareConfig(sourceFile) {
  if (!ownsConfig && fs.existsSync(configPath) && !fs.existsSync(backupPath)) {
    fs.renameSync(configPath, backupPath);
    hadConfig = true;
  }
  if (ownsConfig && fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
  fs.copyFileSync(path.join(rootDir, sourceFile), configPath);
  ownsConfig = true;
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
  throw new Error(`等待健康检查超时：${url}`);
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
