# API 设计

## 代理 API

### POST /v1/chat/completions

兼容 OpenAI 的透传接口。

请求：

- 与 OpenAI-compatible chat completions 保持一致。
- Authorization header 使用 AgentSpendGuard 的虚拟 Key。

响应：

- 允许请求时，尽量保持上游 provider 的响应格式。
- 预算或限流超限时返回错误。

预算超限响应：

```json
{
  "error": {
    "message": "Project daily budget exceeded",
    "type": "budget_exceeded",
    "code": "daily_budget_exceeded"
  }
}
```

建议 HTTP 状态码：

- `402 Payment Required`：预算超限。
- `429 Too Many Requests`：限流。
- `401 Unauthorized`：虚拟 Key 无效。

限流响应：

```json
{
  "error": {
    "message": "Project request rate exceeded",
    "type": "rate_limit_exceeded",
    "code": "request_rate_exceeded"
  }
}
```

### GET /v1/models

兼容 OpenAI 的模型列表接口。

请求：
- Authorization header 使用 AgentSpendGuard 的虚拟 Key。

响应：
- 上游 provider 支持 `/models` 时，优先透传上游响应。
- 上游返回 `404` 或 `405` 时，回退到本地 `modelPrices` 配置生成模型列表。
- 上游返回 `401`、`403`、`429`、`5xx` 等错误时，保留上游错误，避免掩盖 provider 认证或服务问题。

回退响应示例：
```json
{
  "object": "list",
  "data": [
    {
      "id": "openai/gpt-4o-mini",
      "object": "model",
      "created": 0,
      "owned_by": "openrouter"
    }
  ]
}
```

## Dashboard API

如果配置了 `server.adminToken` 或环境变量 `AGENT_SPEND_GUARD_ADMIN_TOKEN`，所有 `/api/*` 管理接口都必须携带管理 Token。

支持两种传递方式：
- Header：`x-admin-token: your-admin-token`
- Query：`?admin_token=your-admin-token`

未开启管理 Token 时，保持本地快速试用体验，不额外拦截 `/api/*`。

### GET /api/dashboard/summary

返回：

- 今日花费。
- 本月花费。
- 请求数。
- 错误数。
- 活跃项目数。

### GET /api/projects

查询项目列表。

### POST /api/projects

创建项目。

### PATCH /api/projects/:id

更新预算或启用状态。

### GET /api/virtual-keys

查询虚拟 Key 列表。

### POST /api/virtual-keys

创建虚拟 Key。

### POST /api/virtual-keys/:id/revoke

撤销虚拟 Key。

### GET /api/providers

查询 provider 列表。

### POST /api/providers

创建 provider。

### GET /api/usage

查询用量记录。

支持过滤条件：

- project_id
- model
- provider_id
- date_from
- date_to

### GET /api/usage.csv

导出用量记录 CSV。

响应：

- `content-type: text/csv`
- 文件名：`agent-spend-guard-usage.csv`

CSV 字段：

```text
createdAt,projectId,virtualKeyId,providerId,model,requestType,inputTokens,outputTokens,estimatedCostUsd,latencyMs,statusCode,errorCode,stream
```

### GET /api/events

查询预算和熔断事件。

### GET /api/config

查询当前本地配置。

注意：

- Provider API Key 会脱敏返回。
- 明文 Key 只保存在本地 `config.json`。

### POST /api/providers

新增 provider。

请求示例：

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "type": "openai-compatible",
  "baseUrl": "https://openrouter.ai/api/v1",
  "apiKey": "your-provider-key"
}
```

### POST /api/projects

新增 project。

请求示例：

```json
{
  "id": "my-project",
  "name": "My Project",
  "providerId": "openrouter",
  "dailyBudgetUsd": 1,
  "monthlyBudgetUsd": 20,
  "maxRequestsPerMinute": 30
}
```

### POST /api/virtual-keys

新增 virtual key。

请求示例：

```json
{
  "id": "my-project-key",
  "name": "My Project Key",
  "projectId": "my-project"
}
```

如果不传 `key`，系统会自动生成一个 `asg_` 开头的虚拟 Key。
