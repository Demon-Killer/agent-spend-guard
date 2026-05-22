import http from "node:http";
import { usageToCsv } from "./csv.js";
import { dashboardHtml, dashboardSummary } from "./dashboard.js";
import { ensureDataDir, loadConfig } from "./config.js";
import { sendHtml, sendJson, sendText } from "./http.js";
import { handleChatCompletions } from "./proxy.js";
import { readBudgetEvents, readUsageRecords } from "./store.js";

ensureDataDir();
const config = loadConfig();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
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

    if (req.method === "POST" && url.pathname === "/v1/chat/completions") {
      return handleChatCompletions(req, res, config);
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
  console.log(`AgentSpendGuard 已启动：http://${config.server.host}:${config.server.port}`);
});
