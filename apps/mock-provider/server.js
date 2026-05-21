import http from "node:http";

const host = process.env.MOCK_PROVIDER_HOST || "127.0.0.1";
const port = Number(process.env.MOCK_PROVIDER_PORT || 8788);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === "GET" && url.pathname === "/health") {
    return sendJson(res, 200, { ok: true, service: "mock-provider" });
  }

  if (req.method === "POST" && url.pathname === "/v1/chat/completions") {
    const body = await readBody(req);
    let requestJson = {};
    try {
      requestJson = JSON.parse(body || "{}");
    } catch {
      return sendJson(res, 400, { error: { message: "invalid json" } });
    }

    if (requestJson.stream) {
      res.writeHead(200, {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-store"
      });
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: "mock" }, index: 0 }] })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    return sendJson(res, 200, {
      id: "chatcmpl_mock",
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: requestJson.model || "mock-model",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "mock response"
          },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: 1000,
        completion_tokens: 1000,
        total_tokens: 2000
      }
    });
  }

  return sendJson(res, 404, { error: { message: "not found" } });
});

server.listen(port, host, () => {
  console.log(`Mock provider 已启动：http://${host}:${port}`);
});

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}

