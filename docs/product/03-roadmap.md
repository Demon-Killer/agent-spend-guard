# 产品路线图

## Phase 0：规划阶段

状态：当前阶段。

交付物：

- 产品规格。
- 技术架构。
- 验证计划。
- 仓库骨架。

## Phase 1：MVP Demo

目标：

让 OpenAI-compatible 的 AI 编程请求经过 AgentSpendGuard，并在每日预算超限时阻断请求。

交付物：

- 本地代理。
- SQLite 用量记录。
- 一个 provider。
- 一个项目。
- 每日预算硬阻断。
- 最小 Dashboard。
- Docker Compose。

退出标准：

- 用户能在 5 分钟内接入一个 AI 编程工具。
- Dashboard 能显示今日花费和请求数。
- 超预算请求返回 `402`。

## Phase 2：真实用户试用

目标：

让 5 个真实用户愿意把自己的 API Key 接入工具试用。

交付物：

- OpenRouter、OpenAI-compatible provider 和至少一个 AI 编程工具的接入文档。
- 能解释配置错误的错误提示。
- 基础模型价格表。

退出标准：

- 5 个用户完成试用。
- 3 个用户给出具体反馈。
- 1 个用户主动询问 Pro 或团队功能。

## Phase 3：Pro 功能

目标：

做出值得付费的功能。

候选功能：

- 多项目。
- 月度预算。
- CSV 导出。
- 请求频率异常检测。
- Slack/Discord 告警。
- 团队自托管授权。

## Phase 4：托管版本

只在自托管 MVP 验证成功后再考虑。

候选功能：

- 托管 Dashboard。
- 本地 Relay。
- 团队邀请。
- 账单。
- License 管理。

