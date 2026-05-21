# 技术架构

## 高层架构

```text
AI 编程工具
  -> HTTP 代理服务
  -> 请求鉴权
  -> 预算预检查
  -> Provider 适配器
  -> 上游模型服务商
  -> 响应用量统计
  -> 写入用量日志
  -> 返回给客户端
```

## 组件

| 组件 | 职责 |
| --- | --- |
| Proxy Server | 接收 OpenAI-compatible 请求 |
| Auth Layer | 校验虚拟 Key |
| Budget Engine | 检查并执行每日/月度预算限制 |
| Provider Adapter | 转发请求到上游 provider |
| Usage Meter | 提取 token 用量并估算费用 |
| Event Engine | 记录预算、失败、熔断事件 |
| Dashboard API | 提供本地 Dashboard 数据 |
| Web Dashboard | 本地配置和用量 UI |
| SQLite Store | 持久化配置、用量、事件 |

## 第一版支持的协议

OpenAI-compatible：

- `POST /v1/chat/completions`

流式响应：

- 保留上游 SSE streaming。
- 上游返回 usage 字段时记录用量。
- 如果流式响应没有 usage，则记录元数据，费用先标记为估算或未知。

## 第一版支持的 Provider

MVP：

- OpenAI-compatible 自定义 provider。
- OpenRouter 的 OpenAI-compatible API。

后续：

- OpenAI 原生。
- Anthropic 原生。
- Gemini 原生。

## 部署方式

本地 Docker：

```text
localhost:8787  代理 API
localhost:8787  Dashboard UI
```

最简单的部署方式是一个进程同时提供 API 和 Dashboard。

