# AgentSpendGuard

AgentSpendGuard 是一个面向 AI 编程工具的本地优先 LLM Gateway（大模型网关）。

它的目标是帮助开发者和小团队防止 Codex、Claude Code、Cursor、Cline、RooCode、OpenCode 等 AI Agent 因循环调用、隐藏重试或项目成本不可见而烧掉 API 预算。

## 产品定位

AgentSpendGuard 不是 OpenRouter 替代品，也不是 token 中转/倒卖站。

它是：

> 面向 AI Coding 场景的自托管 API 成本防火墙。

核心链路：

```text
AI 编程工具
  -> AgentSpendGuard
  -> OpenAI / Anthropic / OpenRouter / Gemini
```

用户使用自己的上游 API Key。AgentSpendGuard 只提供虚拟 Key、项目级预算、调用记录、费用估算和超预算熔断。

## MVP 范围

第一版只做五件事：

1. 兼容 OpenAI 的 `/v1/chat/completions` 代理。
2. 按项目或工具创建虚拟 API Key。
3. 设置每日/月度预算。
4. 超预算或异常调用时自动熔断。
5. 本地 Dashboard 展示用量、费用、延迟和错误。

## 目录结构

```text
docs/
  requirements/    需求、痛点、范围
  product/         产品定位、规格、路线图
  technical/       架构、数据模型、API 设计
  business/        商业模式、风险、定价
  go-to-market/    验证计划、增长计划
apps/
  server/          后端服务占位目录
  web/             本地控制台占位目录
packages/          共享包占位目录
deploy/            Docker 和部署文件
scripts/           开发脚本
research/          竞品和市场调研
```

## 当前状态

MVP 骨架阶段。已完成产品文档、仓库骨架和一个零依赖 Node.js 本地代理服务。

## 本地运行

复制配置文件：

```bash
cp config.example.json config.json
```

编辑 `config.json`，把 provider 的 `apiKey` 替换为你自己的 OpenRouter/OpenAI-compatible API Key。

启动服务：

```bash
node apps/server/src/server.js
```

打开 Dashboard：

```text
http://127.0.0.1:8787
```

AI 编程工具接入：

```text
base_url = http://127.0.0.1:8787/v1
api_key  = asg_demo_local_key
```

测试健康检查：

```bash
curl http://127.0.0.1:8787/health
```

## 本地端到端测试

项目内置一个 mock provider，可以在没有真实上游 API Key 的情况下验证完整链路。

运行：

```bash
node scripts/smoke-test.mjs
```

测试会验证：

- mock provider 可以返回 OpenAI-compatible 响应。
- AgentSpendGuard 可以转发 `/v1/chat/completions`。
- 用量会写入本地记录。
- Dashboard summary 能统计请求和费用。
- 预算为 0 时会返回 `402`。

脚本会临时创建 `config.json`，如果你已有本地配置，会先备份为 `config.json.smoke-backup`，结束后恢复。

## 接入文档

- [OpenRouter 接入指南](docs/technical/06-openrouter-setup.md)
- [AI 编程工具接入指南](docs/technical/07-ai-coding-tool-setup.md)

## 当前限制

- 只支持 `/v1/chat/completions`。
- 流式请求可以转发，但流式 token 费用暂时只能估算输入侧。
- 当前用 JSONL 文件记录用量，后续替换为 SQLite。
- 默认不保存 prompt 内容。
