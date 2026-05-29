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

export function saveConfig(config) {
  validateConfig(config, paths.config);
  fs.writeFileSync(paths.config, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function validateConfig(config, configPath) {
  if (!config.server || !Number.isInteger(config.server.port)) {
    throw new Error(`Invalid config ${configPath}: missing server.port`);
  }
  if (config.server.adminToken !== undefined && typeof config.server.adminToken !== "string") {
    throw new Error(`Invalid config ${configPath}: server.adminToken must be a string`);
  }
  if (!Array.isArray(config.providers)) {
    throw new Error(`Invalid config ${configPath}: providers must be an array`);
  }
  if (!Array.isArray(config.projects)) {
    throw new Error(`Invalid config ${configPath}: projects must be an array`);
  }
  if (!Array.isArray(config.virtualKeys)) {
    throw new Error(`Invalid config ${configPath}: virtualKeys must be an array`);
  }
}

export function publicConfig(config) {
  return {
    ...config,
    server: {
      ...config.server,
      adminToken: config.server.adminToken ? maskSecret(config.server.adminToken) : ""
    },
    providers: config.providers.map((provider) => ({
      ...provider,
      apiKey: provider.apiKey ? maskSecret(provider.apiKey) : ""
    }))
  };
}

export function addProvider(config, input) {
  const provider = {
    id: normalizeId(input.id || input.name || `provider-${Date.now()}`),
    name: String(input.name || input.id || "Provider"),
    type: input.type || "openai-compatible",
    baseUrl: String(input.baseUrl || "").replace(/\/+$/, ""),
    apiKey: String(input.apiKey || ""),
    enabled: input.enabled !== false
  };
  if (!provider.baseUrl || !provider.apiKey) {
    throw new Error("baseUrl and apiKey are required");
  }
  ensureUnique(config.providers, provider.id, "provider");
  config.providers.push(provider);
  return provider;
}

export function addProject(config, input) {
  const project = {
    id: normalizeId(input.id || input.name || `project-${Date.now()}`),
    name: String(input.name || input.id || "Project"),
    providerId: String(input.providerId || ""),
    dailyBudgetUsd: Number(input.dailyBudgetUsd || 0),
    monthlyBudgetUsd: Number(input.monthlyBudgetUsd || 0),
    maxRequestsPerMinute: Number(input.maxRequestsPerMinute || 0),
    enabled: input.enabled !== false
  };
  if (!project.providerId) {
    throw new Error("providerId is required");
  }
  if (!config.providers.some((provider) => provider.id === project.providerId)) {
    throw new Error(`provider not found: ${project.providerId}`);
  }
  ensureUnique(config.projects, project.id, "project");
  config.projects.push(project);
  return project;
}

export function addVirtualKey(config, input) {
  const virtualKey = {
    id: normalizeId(input.id || input.name || `key-${Date.now()}`),
    projectId: String(input.projectId || ""),
    name: String(input.name || input.id || "Virtual Key"),
    key: String(input.key || generateVirtualKey()),
    enabled: input.enabled !== false
  };
  if (!virtualKey.projectId) {
    throw new Error("projectId is required");
  }
  if (!config.projects.some((project) => project.id === virtualKey.projectId)) {
    throw new Error(`project not found: ${virtualKey.projectId}`);
  }
  ensureUnique(config.virtualKeys, virtualKey.id, "virtual key");
  config.virtualKeys.push(virtualKey);
  return virtualKey;
}

function normalizeId(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || `id-${Date.now()}`;
}

function ensureUnique(list, id, label) {
  if (list.some((item) => item.id === id)) {
    throw new Error(`${label} already exists: ${id}`);
  }
}

function generateVirtualKey() {
  return `asg_${crypto.randomUUID().replaceAll("-", "")}`;
}

function maskSecret(value) {
  if (value.length <= 10) {
    return "********";
  }
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
