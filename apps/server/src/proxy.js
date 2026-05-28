import { appendUsage } from "./store.js";
import { checkBudget, checkRequestRate, findVirtualKey, resolveProject, resolveProvider } from "./budget.js";
import { estimateCostUsd, estimateRequestTokens, extractUsage } from "./metering.js";
import { readJsonBody, sendJson } from "./http.js";

export async function handleModels(req, res, config) {
  const auth = authenticateRequest(config, req.headers.authorization);
  if (auth.error) {
    return sendJson(res, auth.error.status, auth.error.body);
  }

  const upstreamUrl = `${auth.provider.baseUrl.replace(/\/+$/, "")}/models`;
  try {
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        authorization: `Bearer ${auth.provider.apiKey}`
      }
    });
    if (upstream.ok) {
      const contentType = upstream.headers.get("content-type") || "application/json";
      const raw = await upstream.text();
      res.writeHead(upstream.status, {
        "content-type": contentType,
        "cache-control": "no-store"
      });
      res.end(raw);
      return;
    }
    if (![404, 405].includes(upstream.status)) {
      const contentType = upstream.headers.get("content-type") || "application/json";
      const raw = await upstream.text();
      res.writeHead(upstream.status, {
        "content-type": contentType,
        "cache-control": "no-store"
      });
      res.end(raw);
      return;
    }
  } catch {
    // Fall back to locally configured model prices when the upstream has no models endpoint.
  }

  return sendJson(res, 200, localModels(config, auth.provider));
}

export async function handleChatCompletions(req, res, config) {
  const startedAt = Date.now();
  const auth = authenticateRequest(config, req.headers.authorization);
  if (auth.error) {
    return sendJson(res, auth.error.status, auth.error.body);
  }
  const { virtualKey, project, provider } = auth;

  const budget = checkBudget(project, virtualKey);
  if (!budget.allowed) {
    return sendJson(res, 402, {
      error: {
        message: "Project budget exceeded",
        type: "budget_exceeded",
        code: budget.event.eventType
      }
    });
  }

  const requestRate = checkRequestRate(project, virtualKey);
  if (!requestRate.allowed) {
    return sendJson(res, 429, {
      error: {
        message: "Project request rate exceeded",
        type: "rate_limit_exceeded",
        code: requestRate.event.eventType
      }
    });
  }

  let requestJson;
  try {
    requestJson = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, {
      error: {
        message: "Invalid JSON body",
        type: "bad_request",
        code: "invalid_json"
      }
    });
  }

  const upstreamUrl = `${provider.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const model = requestJson.model || "unknown";

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify(requestJson)
    });

    const contentType = upstream.headers.get("content-type") || "application/json";
    res.writeHead(upstream.status, {
      "content-type": contentType,
      "cache-control": "no-store"
    });

    if (requestJson.stream) {
      await pipeStream(upstream, res);
      recordUsage(config, {
        project,
        virtualKey,
        provider,
        model,
        statusCode: upstream.status,
        latencyMs: Date.now() - startedAt,
        inputTokens: estimateRequestTokens(requestJson),
        outputTokens: 0,
        stream: true
      });
      return;
    }

    const raw = await upstream.text();
    res.end(raw);

    let responseJson = {};
    try {
      responseJson = JSON.parse(raw);
    } catch {
      responseJson = {};
    }
    const usage = extractUsage(responseJson);
    recordUsage(config, {
      project,
      virtualKey,
      provider,
      model,
      statusCode: upstream.status,
      latencyMs: Date.now() - startedAt,
      inputTokens: usage.inputTokens || estimateRequestTokens(requestJson),
      outputTokens: usage.outputTokens,
      stream: false
    });
  } catch (error) {
    recordUsage(config, {
      project,
      virtualKey,
      provider,
      model,
      statusCode: 502,
      latencyMs: Date.now() - startedAt,
      inputTokens: estimateRequestTokens(requestJson),
      outputTokens: 0,
      stream: Boolean(requestJson.stream),
      errorCode: "upstream_error"
    });
    return sendJson(res, 502, {
      error: {
        message: error.message,
        type: "upstream_error",
        code: "upstream_error"
      }
    });
  }
}

async function pipeStream(upstream, res) {
  if (!upstream.body) {
    res.end();
    return;
  }
  for await (const chunk of upstream.body) {
    res.write(chunk);
  }
  res.end();
}

function recordUsage(config, data) {
  const estimatedCostUsd = estimateCostUsd(config, data.model, data.inputTokens, data.outputTokens);
  appendUsage({
    id: crypto.randomUUID(),
    projectId: data.project.id,
    virtualKeyId: data.virtualKey.id,
    providerId: data.provider.id,
    providerType: data.provider.type,
    model: data.model,
    requestType: "chat.completions",
    inputTokens: data.inputTokens,
    outputTokens: data.outputTokens,
    estimatedCostUsd,
    latencyMs: data.latencyMs,
    statusCode: data.statusCode,
    errorCode: data.errorCode || "",
    stream: data.stream,
    createdAt: new Date().toISOString()
  });
}

function authenticateRequest(config, authorization) {
  const virtualKey = findVirtualKey(config, authorization);
  if (!virtualKey) {
    return {
      error: {
        status: 401,
        body: {
          error: {
            message: "Invalid AgentSpendGuard virtual key",
            type: "auth_error",
            code: "invalid_virtual_key"
          }
        }
      }
    };
  }

  const project = resolveProject(config, virtualKey);
  if (!project) {
    return {
      error: {
        status: 403,
        body: {
          error: {
            message: "Project disabled or not found",
            type: "project_error",
            code: "project_disabled"
          }
        }
      }
    };
  }

  const provider = resolveProvider(config, project);
  if (!provider) {
    return {
      error: {
        status: 503,
        body: {
          error: {
            message: "Provider disabled or not found",
            type: "provider_error",
            code: "provider_disabled"
          }
        }
      }
    };
  }

  return { virtualKey, project, provider };
}

function localModels(config, provider) {
  const models = (config.modelPrices || [])
    .map((item) => String(item.model || "").trim())
    .filter(Boolean);
  const uniqueModels = [...new Set(models.length ? models : ["default"])];
  return {
    object: "list",
    data: uniqueModels.map((model) => ({
      id: model,
      object: "model",
      created: 0,
      owned_by: provider.id
    }))
  };
}
