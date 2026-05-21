import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

export const paths = {
  config: path.join(rootDir, "config.json"),
  configExample: path.join(rootDir, "config.example.json"),
  dataDir: path.join(rootDir, "data"),
  usage: path.join(rootDir, "data", "usage-records.jsonl"),
  events: path.join(rootDir, "data", "budget-events.jsonl")
};

export function ensureDataDir() {
  fs.mkdirSync(paths.dataDir, { recursive: true });
}

export function loadConfig() {
  const configPath = fs.existsSync(paths.config) ? paths.config : paths.configExample;
  const raw = fs.readFileSync(configPath, "utf8");
  const config = JSON.parse(raw);
  validateConfig(config, configPath);
  return config;
}

function validateConfig(config, configPath) {
  if (!config.server || !Number.isInteger(config.server.port)) {
    throw new Error(`配置文件无效：${configPath} 缺少 server.port`);
  }
  if (!Array.isArray(config.providers) || config.providers.length === 0) {
    throw new Error(`配置文件无效：${configPath} 至少需要一个 provider`);
  }
  if (!Array.isArray(config.projects) || config.projects.length === 0) {
    throw new Error(`配置文件无效：${configPath} 至少需要一个 project`);
  }
  if (!Array.isArray(config.virtualKeys) || config.virtualKeys.length === 0) {
    throw new Error(`配置文件无效：${configPath} 至少需要一个 virtual key`);
  }
}

