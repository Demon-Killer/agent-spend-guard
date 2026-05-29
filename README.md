# AgentSpendGuard

> Stop AI coding agents from burning your API budget.

AgentSpendGuard 是一个本地优先的 LLM Gateway（大模型网关），用于监控和限制 Codex、Claude Code、Cursor、Cline、RooCode、OpenCode 等 AI 编程工具的 API 花费。

它不是 OpenRouter 替代品，也不是 token 中转站。它的定位是：

> 面向 AI Coding 场景的本地 API 成本防火墙。

## 核心链路

```text
AI 编程工具
  -> AgentSpendGuard
  -> OpenAI / Anthropic / OpenRouter / Gemini
```

用户使用自己的上游 API Key。AgentSpendGuard 只负责：

- 创建本地 Virtual Key（虚拟 Key）。
- 按 Project（项目）统计请求和费用。
- 设置每日/月度预算。
- 设置每分钟请求限制。
- 超预算返回 `402`。
- 请求频率超限返回 `429`。
- 默认不保存 prompt 内容。

## 3 分钟本地试跑

不需要真实 API Key，直接跑内置 mock 测试：

```bash
node scripts/smoke-test.mjs
```

预期输出：

```text
smoke test passed
```

如果要跑真实 OpenRouter 测试：

```bash
OPENROUTER_API_KEY=你的真实Key node scripts/openrouter-test.mjs
```

可选指定模型：

```bash
OPENROUTER_API_KEY=你的真实Key OPENROUTER_MODEL=openai/gpt-4o-mini node scripts/openrouter-test.mjs
```

这个脚本会临时写入本地 `config.json`，结束后自动恢复；不会把真实 Key 提交到 Git。

测试会验证：

- mock provider 返回 OpenAI-compatible 响应。
- AgentSpendGuard 转发 `/v1/chat/completions`。
- AgentSpendGuard 提供 `/v1/models` 兼容接口，优先转发上游模型列表，必要时回退本地模型配置。
- Dashboard summary 统计请求和费用。
- 配置管理 API 可以新增 Provider、Project、Virtual Key。
- 用量 CSV 可以导出。
- 预算为 0 时返回 `402`。
- 每分钟请求数超限时返回 `429`。

## 真实运行

复制配置：

```bash
cp config.example.json config.json
```

编辑 `config.json`，把 provider 的 `apiKey` 替换为你的 OpenRouter/OpenAI-compatible API Key。

启动服务：

```bash
node apps/server/src/server.js
```

打开 Dashboard：

```text
http://127.0.0.1:8787
```

可选开启 Dashboard 和 `/api/*` 管理接口保护：

```json
"server": {
  "host": "127.0.0.1",
  "port": 8787,
  "adminToken": "replace-with-a-local-admin-token"
}
```

开启后访问 Dashboard：

```text
http://127.0.0.1:8787/?admin_token=replace-with-a-local-admin-token
```

AI 编程工具配置：

```text
base_url = http://127.0.0.1:8787/v1
api_key  = asg_demo_local_key
```

健康检查：

```bash
curl http://127.0.0.1:8787/health
```

导出用量 CSV：

```text
http://127.0.0.1:8787/api/usage.csv
```

## 当前功能

已实现：

- OpenAI-compatible `/v1/chat/completions` 代理。
- OpenAI-compatible `/v1/models` 模型列表。
- Virtual Key 校验。
- Provider、Project、Virtual Key 本地配置管理。
- 每日/月度预算限制。
- 每分钟请求数限制。
- 用量记录 JSONL。
- 最近用量 Dashboard。
- 最近事件 Dashboard。
- CSV 导出。
- 可选 Dashboard 和 `/api/*` 管理接口 Token 保护。
- Mock Provider。
- Smoke Test。

Dashboard 当前支持：

- 查看今日/本月花费。
- 查看最近用量和最近事件。
- 新增 Provider。
- 新增 Project。
- 新增 Virtual Key。
- 导出用量 CSV。

## 安全边界

AgentSpendGuard 当前是本地 MVP，请按以下方式使用：

- 只在本机或可信内网运行。
- 不要直接暴露到公网。
- 不要提交 `config.json`。
- Provider API Key 目前明文保存在本地 `config.json`。
- `GET /api/config` 会脱敏返回 Provider API Key。
- 如果配置 `server.adminToken` 或环境变量 `AGENT_SPEND_GUARD_ADMIN_TOKEN`，Dashboard 数据接口和 `/api/*` 管理接口必须携带 `x-admin-token` 或 `?admin_token=`。
- 默认不保存 prompt 和模型输出。

后续可以增加：

- 本地 API Key 加密存储。
- 只监听 `127.0.0.1` 的默认安全策略。

## 接入文档

- [本地运行手册](docs/technical/05-local-runbook.md)
- [OpenRouter 接入指南](docs/technical/06-openrouter-setup.md)
- [AI 编程工具接入指南](docs/technical/07-ai-coding-tool-setup.md)
- [真实 OpenRouter 验证清单](docs/technical/08-real-openrouter-test.md)

## 项目结构

```text
docs/
  requirements/    需求、痛点、范围
  product/         产品定位、规格、路线图
  technical/       架构、数据模型、API 设计、运行手册
  business/        商业模式、风险、定价
  go-to-market/    验证计划、增长计划
apps/
  server/          本地代理服务
  mock-provider/   本地测试用 mock provider
  web/             本地控制台占位目录
deploy/            Docker 和部署文件
scripts/           测试和开发脚本
research/          竞品和市场调研
```

## 当前限制

- 当前主要支持 `/v1/chat/completions` 和 `/v1/models`。
- 流式请求可以转发，但流式 token 费用暂时只能估算输入侧。
- 当前用 JSONL 文件记录用量，后续可替换为 SQLite。
- 当前没有登录系统，不适合公网部署。
