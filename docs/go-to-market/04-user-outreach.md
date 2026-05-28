# 用户触达模板

目标：

找到 5 个真实 AI Coding 用户，让他们愿意本地试用。

## 目标用户画像

优先找：

- Cline 用户。
- RooCode 用户。
- Cursor 自定义 API 用户。
- OpenCode 用户。
- OpenRouter 重度用户。
- 自研 coding agent 的开发者。
- 在社交平台讨论过 API bill、runaway agent、rate limit、OpenRouter spend 的用户。

## 私信模板：英文

```text
Hi, I saw your post about using AI coding tools.

I am building a small local-first tool called AgentSpendGuard. It sits between AI coding tools and OpenAI/OpenRouter, then adds project-level budgets, request rate limits, and local usage tracking.

It is BYOK and self-hosted. No prompt storage by default.

Would you be open to trying it for 10 minutes and telling me whether the workflow makes sense?

Repo:
https://github.com/Demon-Killer/agent-spend-guard
```

## 私信模板：更短

```text
I built a local budget firewall for AI coding agents:
https://github.com/Demon-Killer/agent-spend-guard

It adds project budgets and rate limits in front of OpenAI/OpenRouter.

Would you be willing to try it and tell me what is missing?
```

## 中文私信模板

```text
你好，我在做一个本地 AI 编程成本防火墙 AgentSpendGuard。

它放在 Cursor/Cline/RooCode/OpenCode 和 OpenAI/OpenRouter 中间，用来做项目级预算、请求限流、本地用量统计。

不卖 token，用户自带 key，默认不保存 prompt。

你愿意花 10 分钟试一下，并告诉我这个流程有没有价值吗？

仓库：
https://github.com/Demon-Killer/agent-spend-guard
```

## 公开回复模板

当看到有人讨论 AI coding 成本时：

```text
This is exactly the problem I am trying to solve with a small local tool:
https://github.com/Demon-Killer/agent-spend-guard

It adds project-level budget limits and request rate limits in front of OpenAI-compatible APIs.

Would love feedback if this matches your workflow.
```

## 触达记录字段

记录在反馈日志里：

- 用户来源。
- 使用的 AI coding 工具。
- 是否愿意试用。
- 是否成功跑通。
- 最大阻力。
- 是否有付费意愿。

