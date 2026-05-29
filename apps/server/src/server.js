import http from "node:http";
import { usageToCsv } from "./csv.js";
import { dashboardHtml, dashboardSummary } from "./dashboard.js";
import { addProject, addProvider, addVirtualKey, ensureDataDir, loadConfig, publicConfig, saveConfig, upsertModelPrice } from "./config.js";
import { readOptionalJsonBody, sendHtml, sendJson, sendText } from "./http.js";
import { handleChatCompletions, handleModels } from "./proxy.js";
import { readBudgetEvents, readUsageRecords } from "./store.js";

ensureDataDir();
const config = loadConfig();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (isAdminRoute(req, url) && !isAdminAllowed(req, url, config)) {
      return sendJson(res, 401, {
        error: {
          message: "Invalid AgentSpendGuard admin token",
          type: "auth_error",
          code: "invalid_admin_token"
        }
      });
    }

    if (req.method === "GET" && url.pathname === "/") {
      return sendHtml(res, dashboardHtml());
    }

    if (req.method === "GET" && url.pathname === "/health") {
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "GET" && url.pathname === "/api/dashboard/summary") {
      return sendJson(res, 200, dashboardSummary(config));
    }

    if (req.method === "GET" && url.pathname === "/api/usage") {
      const records = readUsageRecords().reverse();
      return sendJson(res, 200, { records });
    }

    if (req.method === "GET" && url.pathname === "/api/usage.csv") {
      const records = readUsageRecords().reverse();
      return sendText(res, 200, usageToCsv(records), "text/csv; charset=utf-8", {
        "content-disposition": "attachment; filename=\"agent-spend-guard-usage.csv\""
      });
    }

    if (req.method === "GET" && url.pathname === "/api/events") {
      const records = readBudgetEvents().reverse();
      return sendJson(res, 200, { records });
    }

    if (req.method === "GET" && url.pathname === "/api/config") {
      return sendJson(res, 200, publicConfig(config));
    }

    if (req.method === "POST" && url.pathname === "/api/providers") {
      const input = await readOptionalJsonBody(req);
      const provider = addProvider(config, input);
      saveConfig(config);
      return sendJson(res, 201, { provider: { ...provider, apiKey: provider.apiKey ? "********" : "" } });
    }

    if (req.method === "POST" && url.pathname === "/api/projects") {
      const input = await readOptionalJsonBody(req);
      const project = addProject(config, input);
      saveConfig(config);
      return sendJson(res, 201, { project });
    }

    if (req.method === "POST" && url.pathname === "/api/virtual-keys") {
      const input = await readOptionalJsonBody(req);
      const virtualKey = addVirtualKey(config, input);
      saveConfig(config);
      return sendJson(res, 201, { virtualKey });
    }

    if (req.method === "POST" && url.pathname === "/api/model-prices") {
      const input = await readOptionalJsonBody(req);
      const modelPrice = upsertModelPrice(config, input);
      saveConfig(config);
      return sendJson(res, 201, { modelPrice });
    }

    if (req.method === "POST" && url.pathname === "/v1/chat/completions") {
      return handleChatCompletions(req, res, config);
    }

    if (req.method === "GET" && url.pathname === "/v1/models") {
      return handleModels(req, res, config);
    }

    return sendJson(res, 404, {
      error: {
        message: "Not found",
        type: "not_found",
        code: "not_found"
      }
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: {
        message: error.message,
        type: "internal_error",
        code: "internal_error"
      }
    });
  }
});

server.listen(config.server.port, config.server.host, () => {
  console.log(`AgentSpendGuard started: http://${config.server.host}:${config.server.port}`);
  console.log("Security: keep this service on localhost or a trusted private network.");
  if (config.server.adminToken) {
    console.log("Admin API protection is enabled.");
  }
});

function isAdminRoute(req, url) {
  if (url.pathname === "/health") {
    return false;
  }
  return url.pathname.startsWith("/api/");
}

function isAdminAllowed(req, url, config) {
  const expected = String(process.env.AGENT_SPEND_GUARD_ADMIN_TOKEN || config.server.adminToken || "");
  if (!expected) {
    return true;
  }
  const headerValue = req.headers["x-admin-token"];
  const actual = Array.isArray(headerValue) ? headerValue[0] : headerValue || url.searchParams.get("admin_token") || "";
  return actual === expected;
}
