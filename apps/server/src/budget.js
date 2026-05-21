import { appendEvent, readUsageRecords } from "./store.js";

export function findVirtualKey(config, authHeader) {
  const token = parseBearerToken(authHeader);
  if (!token) {
    return null;
  }
  return config.virtualKeys.find((item) => item.enabled && item.key === token) || null;
}

export function parseBearerToken(authHeader) {
  if (!authHeader) {
    return "";
  }
  const value = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : value.trim();
}

export function resolveProject(config, virtualKey) {
  return config.projects.find((item) => item.enabled && item.id === virtualKey.projectId) || null;
}

export function resolveProvider(config, project) {
  return config.providers.find((item) => item.enabled && item.id === project.providerId) || null;
}

export function getSpendSummary(projectId) {
  const now = new Date();
  const todayKey = formatDateKey(now);
  const monthKey = todayKey.slice(0, 7);
  let todaySpend = 0;
  let monthSpend = 0;
  let requestCount = 0;
  let errorCount = 0;

  for (const record of readUsageRecords()) {
    if (record.projectId !== projectId) {
      continue;
    }
    const recordDate = String(record.createdAt || "");
    const cost = Number(record.estimatedCostUsd || 0);
    requestCount += 1;
    if (Number(record.statusCode || 0) >= 400) {
      errorCount += 1;
    }
    if (recordDate.startsWith(todayKey)) {
      todaySpend += cost;
    }
    if (recordDate.startsWith(monthKey)) {
      monthSpend += cost;
    }
  }

  return { todaySpend, monthSpend, requestCount, errorCount };
}

export function checkBudget(project, virtualKey) {
  const summary = getSpendSummary(project.id);
  if (summary.todaySpend >= Number(project.dailyBudgetUsd || 0)) {
    const event = createBudgetEvent(project, virtualKey, "daily_budget_exceeded", project.dailyBudgetUsd, summary.todaySpend);
    appendEvent(event);
    return { allowed: false, event, summary };
  }
  if (summary.monthSpend >= Number(project.monthlyBudgetUsd || 0)) {
    const event = createBudgetEvent(project, virtualKey, "monthly_budget_exceeded", project.monthlyBudgetUsd, summary.monthSpend);
    appendEvent(event);
    return { allowed: false, event, summary };
  }
  return { allowed: true, summary };
}

export function checkRequestRate(project, virtualKey) {
  const limit = Number(project.maxRequestsPerMinute || 0);
  if (!limit) {
    return { allowed: true, currentValue: 0, limit };
  }

  const since = Date.now() - 60_000;
  const currentValue = readUsageRecords().filter((record) => {
    if (record.projectId !== project.id) {
      return false;
    }
    const createdAt = Date.parse(record.createdAt || "");
    return Number.isFinite(createdAt) && createdAt >= since;
  }).length;

  if (currentValue >= limit) {
    const event = createBudgetEvent(project, virtualKey, "request_rate_exceeded", limit, currentValue);
    appendEvent(event);
    return { allowed: false, event, currentValue, limit };
  }

  return { allowed: true, currentValue, limit };
}

function createBudgetEvent(project, virtualKey, eventType, limitValueUsd, currentValueUsd) {
  return {
    id: crypto.randomUUID(),
    projectId: project.id,
    virtualKeyId: virtualKey.id,
    eventType,
    reason: eventType,
    limitValueUsd: Number(limitValueUsd || 0),
    currentValueUsd,
    createdAt: new Date().toISOString()
  };
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}
