# 产品规格

## 目标

构建一个最小可用产品，让开发者可以把 AI 编程工具的请求转发到本地网关，通过 Dashboard 查看费用，并在项目预算超限或请求频率异常时自动阻断请求。

## MVP 范围

必须做：

1. 兼容 OpenAI 的 `/v1/chat/completions` 代理。
2. 至少支持一个 OpenAI-compatible 上游 provider。
3. 虚拟 Key 映射到项目。
4. 每日和月度预算限制。
5. 用量记录和费用估算。
6. 超预算硬阻断。
7. 每分钟请求数限制。
8. 本地 Dashboard。
9. Docker 本地部署。

已经支持：

- 请求数和延迟统计。
- 错误数和状态码统计。
- 基础模型价格配置。
- 用量记录 CSV 导出：`/api/usage.csv`。
- Dashboard 新增 Provider、Project、Virtual Key。
- 配置写入本地 `config.json`。

MVP 不做：

- 公共 SaaS 账号体系。
- 在线充值和钱包。
- 团队 RBAC 权限。
- 完整 Anthropic 原生 API 兼容。
- 可视化工作流编排。
- 模型市场。
- prompt 日志。
- prompt 回放。
- 企业 SSO。

## 用户流程

```text
1. 用户启动 AgentSpendGuard。
2. 打开本地 Dashboard。
3. 添加上游 provider API Key。
4. 创建一个项目。
5. 设置每日预算、月度预算和每分钟请求限制。
6. 创建虚拟 Key。
7. 配置 AI 编程工具：
   base_url = http://localhost:8787/v1
   api_key = 本地虚拟 Key
8. 正常使用 AI 编程工具。
9. AgentSpendGuard 记录用量元数据。
10. 超预算后返回 402 并阻断请求。
11. 请求频率超限后返回 429 并阻断请求。
```

## 核心页面

Dashboard：

- 今日花费。
- 本月花费。
- 请求数。
- 错误数。
- 最近用量。
- 最近事件。
- CSV 导出入口。

配置管理：

- 新增 provider。
- 新增 project。
- 新增 virtual key。
- 新增或覆盖模型价格。
- 查看当前 provider、project、virtual key、模型价格列表。
- Provider API Key 在公开配置中脱敏显示。

Projects：

- 创建项目。
- 设置每日预算。
- 设置月度预算。
- 设置每分钟请求数限制。
- 启用或停用项目。

Virtual Keys：

- 创建虚拟 Key。
- 绑定项目。
- 复制 Key。
- 撤销 Key。

Providers：

- 添加 provider。
- 设置 base URL。
- 设置上游 API Key。
- 启用或停用 provider。

Usage：

- 按项目过滤。
- 按模型过滤。
- 按日期过滤。
- 展示费用、token、延迟、状态码。
- 导出 CSV。

Events：

- 展示预算超限事件。
- 展示请求频率限流事件。
- 展示 provider 失败事件。
