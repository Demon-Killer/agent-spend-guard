# 本地运行手册

## 环境要求

- Node.js 18+，建议 Node.js 24。
- 不需要 npm install，因为当前 MVP 不依赖第三方包。

## 启动步骤

复制配置：

```bash
cp config.example.json config.json
```

修改 `config.json`：

```json
{
  "providers": [
    {
      "id": "openrouter",
      "baseUrl": "https://openrouter.ai/api/v1",
      "apiKey": "替换成你的上游 API Key"
    }
  ]
}
```

启动：

```bash
node apps/server/src/server.js
```

访问：

```text
http://127.0.0.1:8787
```

Dashboard 当前可以：

- 查看用量。
- 查看熔断/限流事件。
- 新增 Provider。
- 新增 Project。
- 新增 Virtual Key。
- 导出 CSV。

导出用量 CSV：

```text
http://127.0.0.1:8787/api/usage.csv
```

## 请求示例

```bash
curl http://127.0.0.1:8787/v1/chat/completions \
  -H "Authorization: Bearer asg_demo_local_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [
      { "role": "user", "content": "hello" }
    ]
  }'
```

## 预算测试

在 `config.json` 中把项目每日预算调低：

```json
{
  "dailyBudgetUsd": 0
}
```

再次请求时应返回：

```json
{
  "error": {
    "message": "Project budget exceeded",
    "type": "budget_exceeded",
    "code": "daily_budget_exceeded"
  }
}
```

HTTP 状态码为 `402`。

## 请求频率限制测试

项目配置支持：

```json
{
  "maxRequestsPerMinute": 30
}
```

含义：

> 当前项目最近 60 秒最多允许 30 次请求。

超过后返回：

```json
{
  "error": {
    "message": "Project request rate exceeded",
    "type": "rate_limit_exceeded",
    "code": "request_rate_exceeded"
  }
}
```

HTTP 状态码为 `429`。

这个能力用于防止 AI Agent 因循环或隐藏重试在短时间内连续调用模型。

## 数据文件

```text
data/usage-records.jsonl
data/budget-events.jsonl
```

当前只记录元数据，不保存 prompt 和模型输出。

## 导出用量 CSV

打开：

```text
http://127.0.0.1:8787/api/usage.csv
```

或在 Dashboard 点击“导出 CSV”。

CSV 当前字段：

```text
createdAt,projectId,virtualKeyId,providerId,model,requestType,inputTokens,outputTokens,estimatedCostUsd,latencyMs,statusCode,errorCode,stream
```

## 无真实 Key 的 smoke test

如果你没有 OpenRouter/OpenAI Key，可以使用内置 mock provider 测试完整链路：

```bash
node scripts/smoke-test.mjs
```

测试内容：

- 启动 mock provider：`http://127.0.0.1:8788`
- 启动 AgentSpendGuard：`http://127.0.0.1:8787`
- 发送一次 `/v1/chat/completions`
- 检查 Dashboard summary
- 检查 `/api/usage.csv`
- 检查配置管理 API 新增 Provider/Project/Virtual Key
- 使用 0 预算配置验证 `402` 熔断
- 使用低请求频率配置验证 `429` 限流

注意：

- 测试脚本会临时写入 `config.json`。
- 如果已有 `config.json`，脚本会备份并在结束后恢复。
