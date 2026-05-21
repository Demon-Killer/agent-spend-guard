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

## Dashboard API

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

### GET /api/events

查询预算和熔断事件。

