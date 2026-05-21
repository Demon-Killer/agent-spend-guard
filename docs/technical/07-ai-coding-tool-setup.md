# AI 编程工具接入指南

目标：

让 Codex、Claude Code、Cursor、Cline、RooCode、OpenCode 等 AI 编程工具的 API 请求先经过 AgentSpendGuard，再转发到上游模型服务。

## 通用接入方式

如果工具支持 OpenAI-compatible API，通常只需要配置两个值：

```text
base_url = http://127.0.0.1:8787/v1
api_key  = asg_demo_local_key
```

含义：

- `base_url`：把请求发到本地 AgentSpendGuard。
- `api_key`：使用 AgentSpendGuard 的虚拟 Key，不直接使用 OpenRouter/OpenAI Key。

## 推荐使用方式

每个项目一个虚拟 Key。

示例：

```text
project-a -> asg_project_a_key
project-b -> asg_project_b_key
```

这样 Dashboard 可以按项目统计费用，并对不同项目设置不同预算。

## Cursor

如果 Cursor 支持自定义 OpenAI-compatible endpoint：

```text
Base URL: http://127.0.0.1:8787/v1
API Key:  asg_demo_local_key
Model:    openai/gpt-4o-mini
```

具体入口可能随 Cursor 版本变化。原则是找到：

- OpenAI compatible
- Custom API base
- Custom model

## Cline / RooCode

这类 VS Code 插件通常支持 OpenAI-compatible provider。

配置：

```text
Provider: OpenAI Compatible
Base URL: http://127.0.0.1:8787/v1
API Key:  asg_demo_local_key
Model:    openai/gpt-4o-mini
```

## OpenCode

如果使用 OpenAI-compatible 配置：

```text
baseURL: http://127.0.0.1:8787/v1
apiKey:  asg_demo_local_key
model:   openai/gpt-4o-mini
```

## Claude Code / Codex

不同版本的官方工具对自定义 base URL 支持情况可能不同。

如果工具本身不支持自定义 OpenAI-compatible endpoint，可以先不强行适配。MVP 阶段优先验证支持自定义 API 的工具，例如 Cline、RooCode、OpenCode、Cursor。

## 验证是否接入成功

1. 启动 AgentSpendGuard。
2. 在 AI 编程工具里发起一次简单请求。
3. 打开 Dashboard：

```text
http://127.0.0.1:8787
```

如果请求数增加，说明接入成功。

## 预算策略建议

个人开发者：

```text
dailyBudgetUsd = 1
monthlyBudgetUsd = 20
```

高频 AI Coding 用户：

```text
dailyBudgetUsd = 5
monthlyBudgetUsd = 100
```

团队试用：

```text
每个项目单独 virtual key
每个项目单独 dailyBudgetUsd
```

## 当前限制

- 当前只实现 OpenAI-compatible `/v1/chat/completions`。
- 如果工具使用 Anthropic 原生接口，需要后续增加适配器。
- 流式响应可以转发，但 token 费用暂时只能粗略估算。

