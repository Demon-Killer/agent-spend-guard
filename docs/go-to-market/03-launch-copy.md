# 发布文案

目标：

> 让目标用户在 30 秒内理解 AgentSpendGuard 解决什么问题，并愿意本地试用。

## Hacker News: Show HN

标题：

```text
Show HN: AgentSpendGuard – local API budget firewall for AI coding agents
```

正文：

```text
Hi HN,

I built AgentSpendGuard, a local-first LLM gateway for developers using AI coding agents.

The problem: tools like Cursor, Cline, RooCode, OpenCode, Codex-style agents, and custom coding agents can make many API calls quickly. When a loop or retry storm happens, it is often hard to see which project caused the spend until the provider bill shows it.

AgentSpendGuard sits between your AI coding tool and your model provider:

AI coding tool -> AgentSpendGuard -> OpenAI/OpenRouter/etc.

Current features:
- OpenAI-compatible /v1/chat/completions proxy
- virtual keys per project
- daily/monthly budget limits
- request-per-minute limits
- local dashboard
- usage CSV export
- no prompt storage by default
- mock provider and smoke tests

It is not an OpenRouter alternative and not a token resale service. You bring your own provider key; the tool only adds local visibility and guardrails.

Repo:
https://github.com/Demon-Killer/agent-spend-guard

I am looking for feedback from people using AI coding tools heavily:
- Would you add a local proxy for budget protection?
- What cost-control feature is missing?
- Which tool should I support first?
```

## Reddit

适合社区：

- `r/ClaudeAI`
- `r/OpenAI`
- `r/LocalLLaMA`
- `r/SideProject`
- `r/selfhosted`
- `r/programming`

标题：

```text
I built a local API budget firewall for AI coding agents
```

正文：

```text
I have been using AI coding tools more often, and one concern keeps coming up: runaway API spend.

So I built a small local-first tool called AgentSpendGuard.

It runs locally and proxies OpenAI-compatible API calls:

AI coding tool -> AgentSpendGuard -> OpenRouter/OpenAI/etc.

It can:
- create virtual keys per project
- set daily/monthly budgets
- block requests after budget is exceeded
- limit requests per minute
- show local usage/cost dashboard
- export usage CSV
- avoid storing prompt content by default

This is not a token proxy or model marketplace. You bring your own provider key.

Repo:
https://github.com/Demon-Killer/agent-spend-guard

I am looking for early feedback:
1. Would this fit your AI coding workflow?
2. Which tools should I document first: Cline, RooCode, Cursor, OpenCode?
3. What would make this worth paying for?
```

## X / Twitter

短版本：

```text
I built AgentSpendGuard: a local API budget firewall for AI coding agents.

It sits between Cursor/Cline/RooCode/OpenCode and OpenAI/OpenRouter:

- virtual keys per project
- daily/monthly budgets
- request rate limits
- local dashboard
- CSV export
- no prompt storage by default

Repo:
https://github.com/Demon-Killer/agent-spend-guard
```

更短版本：

```text
AI coding agents can burn API budget fast.

I built AgentSpendGuard, a local-first LLM gateway that adds:
- project budgets
- rate limits
- usage dashboard
- CSV export

BYOK, self-hosted, no prompt storage by default.

https://github.com/Demon-Killer/agent-spend-guard
```

## Product Hunt 草稿

Tagline：

```text
Local API budget firewall for AI coding agents
```

Description：

```text
AgentSpendGuard is a local-first LLM gateway that helps developers monitor and limit API spend from AI coding tools. Bring your own provider key, create virtual keys per project, set budgets and rate limits, and track usage locally.
```

## 中文介绍

```text
AgentSpendGuard 是一个本地优先的大模型网关，用来防止 AI 编程工具失控消耗 API 预算。

它不卖 token，也不是 OpenRouter 替代品。

用户使用自己的 OpenAI/OpenRouter Key，AgentSpendGuard 只做：

- 项目级虚拟 Key
- 每日/月度预算
- 每分钟请求限制
- 本地用量 Dashboard
- CSV 导出
- 默认不保存 prompt 内容

适合重度使用 Cursor、Cline、RooCode、OpenCode 或自研 Agent 的开发者。
```

