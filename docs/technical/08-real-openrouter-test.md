# 真实 OpenRouter 验证清单

这份清单用于确认 AgentSpendGuard 不只是在 mock 环境可用，也能真实转发到 OpenRouter。

## 前提

- 已有 OpenRouter API Key。
- OpenRouter 账户有可用余额。
- 本机已安装 Node.js。
- 当前项目目录是 `agent-spend-guard`。

## 1. 准备配置

```bash
cp config.example.json config.json
```

编辑 `config.json`：

```json
{
  "providers": [
    {
      "id": "openrouter",
      "name": "OpenRouter",
      "type": "openai-compatible",
      "baseUrl": "https://openrouter.ai/api/v1",
      "apiKey": "替换成真实 OpenRouter API Key",
      "enabled": true
    }
  ]
}
```

确认 project 使用这个 provider：

```json
{
  "providerId": "openrouter"
}
```

## 2. 启动服务

```bash
node apps/server/src/server.js
```

健康检查：

```bash
curl http://127.0.0.1:8787/health
```

预期：

```json
{
  "ok": true
}
```

## 3. 发送真实请求

```bash
curl http://127.0.0.1:8787/v1/chat/completions \
  -H "Authorization: Bearer asg_demo_local_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [
      { "role": "user", "content": "Reply with exactly: AgentSpendGuard works." }
    ]
  }'
```

如果模型不可用，请改成你 OpenRouter 后台可用的模型。

## 4. 验证 Dashboard

打开：

```text
http://127.0.0.1:8787
```

检查：

- 请求数是否增加。
- 最近用量是否出现新记录。
- 模型名是否正确。
- status code 是否为 `200`。
- estimated cost 是否大于或等于 0。

## 5. 验证 CSV

打开：

```text
http://127.0.0.1:8787/api/usage.csv
```

检查 CSV 是否包含刚才的模型调用记录。

## 6. 验证预算熔断

把 `config.json` 中项目预算改成：

```json
{
  "dailyBudgetUsd": 0,
  "monthlyBudgetUsd": 0
}
```

重启服务，再发送请求。

预期返回：

```text
HTTP 402
```

## 7. 验证请求频率限制

把 `config.json` 中项目请求限制改成：

```json
{
  "maxRequestsPerMinute": 1
}
```

连续发送两次请求。

预期：

- 第一次返回 `200`。
- 第二次返回 `429`。

## 8. 验证安全边界

确认：

- `config.json` 没有被 Git 跟踪。
- `GET /api/config` 返回的 provider `apiKey` 是脱敏值。
- Dashboard 没有展示明文 provider API Key。

