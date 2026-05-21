# OpenRouter 接入指南

OpenRouter 是一个公共 AI 模型聚合平台，提供兼容 OpenAI 的 API。AgentSpendGuard 可以把 OpenRouter 当作上游 provider 使用。

## 1. 获取 OpenRouter API Key

进入 OpenRouter 后台创建 API Key。

注意：

- API Key 只写入你本地的 `config.json`。
- 不要把真实 API Key 提交到 Git。
- 当前项目的 `.gitignore` 已忽略 `config.json`。

## 2. 配置 config.json

复制配置：

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
      "apiKey": "替换成你的 OpenRouter API Key",
      "enabled": true
    }
  ]
}
```

项目配置示例：

```json
{
  "projects": [
    {
      "id": "demo",
      "name": "Demo Project",
      "providerId": "openrouter",
      "dailyBudgetUsd": 1,
      "monthlyBudgetUsd": 10,
      "enabled": true
    }
  ]
}
```

虚拟 Key 示例：

```json
{
  "virtualKeys": [
    {
      "id": "demo-key",
      "projectId": "demo",
      "name": "Demo Virtual Key",
      "key": "asg_demo_local_key",
      "enabled": true
    }
  ]
}
```

## 3. 启动 AgentSpendGuard

```bash
node apps/server/src/server.js
```

确认健康检查：

```bash
curl http://127.0.0.1:8787/health
```

## 4. 发送测试请求

```bash
curl http://127.0.0.1:8787/v1/chat/completions \
  -H "Authorization: Bearer asg_demo_local_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [
      { "role": "user", "content": "Say hello in one sentence." }
    ]
  }'
```

## 5. 查看 Dashboard

打开：

```text
http://127.0.0.1:8787
```

可以看到：

- 今日花费。
- 本月花费。
- 请求数。
- 错误数。
- 最近用量。

## 6. 常见问题

### 返回 401

说明 AgentSpendGuard 虚拟 Key 不正确。

检查请求 header：

```text
Authorization: Bearer asg_demo_local_key
```

### 返回 402

说明项目预算已经超限。

检查 `dailyBudgetUsd` 或 `monthlyBudgetUsd`。

### 返回 502

说明上游 provider 调用失败。

检查：

- OpenRouter API Key 是否正确。
- `baseUrl` 是否是 `https://openrouter.ai/api/v1`。
- OpenRouter 账户是否有余额。
- 模型名是否可用。

