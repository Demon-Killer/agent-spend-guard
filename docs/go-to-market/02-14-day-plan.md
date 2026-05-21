# 14 天执行计划

## Day 1

- 创建仓库。
- 写 README。
- 写 landing page 文案。
- 明确 MVP 范围。

问 AI：

- “请 review 这个 MVP 范围，删除 7 天 demo 不需要的功能。”

避免：

- 技术栈争论超过 1 小时。

## Day 2

- 实现 OpenAI-compatible 请求代理。
- Demo 阶段先硬编码一个 provider 配置。

问 AI：

- “生成最小代理实现，并覆盖 streaming 和非 streaming 调用的测试。”

避免：

- 太早抽象 provider 框架。

## Day 3

- 增加 SQLite。
- 存储项目、虚拟 Key、用量记录。

问 AI：

- “为虚拟 Key 和用量记录设计最简单的 SQLite schema。”

避免：

- 做完整管理后台。

## Day 4

- 增加每日预算检查。
- 超预算返回 402。

问 AI：

- “review 预算检查逻辑，找出并发和边界问题。”

避免：

- 在每日预算未跑通前做月度预算。

## Day 5

- 增加本地 Dashboard summary。
- 展示今日花费和请求数。

问 AI：

- “为本地开发者工具设计一个最小 Dashboard 布局。”

避免：

- 过度打磨 UI。

## Day 6

- 增加 Dockerfile 和 Docker Compose。
- 增加安装文档。

问 AI：

- “写一份面向 Claude Code/Cursor 用户的 5 分钟接入指南。”

避免：

- Kubernetes、云部署、多节点设计。

## Day 7

- 发布 v0.1 demo。
- 录制短 GIF 或视频。
- 找 10 个目标用户要反馈。

问 AI：

- “写 Show HN 和 Reddit 发布文案，要求直接、克制、不营销腔。”

避免：

- 在找用户前继续加功能。

## Day 8-10

- 修复 onboarding 问题。
- 增加 OpenRouter 接入指南。
- 增加模型价格配置。
- 如果用户要求，增加 CSV 导出。

## Day 11-12

- 增加月度预算。
- 增加异常请求频率规则。
- 增加熔断事件列表。

## Day 13

- 写第一篇 SEO 文章：
  - “How to stop AI coding agents from running up your OpenAI API bill”

## Day 14

做决策：

- 如果至少 5 个用户试用，继续。
- 如果用户喜欢工具但不理解定位，调整文案。
- 如果没有真实痛点，暂停或换方向。

