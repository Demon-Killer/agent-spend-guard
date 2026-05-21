# Mock Provider

本地测试用的 OpenAI-compatible mock provider。

用途：

- 不需要真实 OpenRouter/OpenAI Key。
- 验证 AgentSpendGuard 的转发、用量记录和预算熔断。

启动：

```bash
node apps/mock-provider/server.js
```

默认地址：

```text
http://127.0.0.1:8788
```

支持接口：

- `GET /health`
- `POST /v1/chat/completions`

