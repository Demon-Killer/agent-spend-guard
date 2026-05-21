# Server

后端服务占位目录。

MVP 职责：

- OpenAI-compatible 代理。
- 虚拟 Key 校验。
- 预算执行。
- 用量记录。
- Dashboard API。

## 当前实现

当前 MVP 使用 Node.js 原生 HTTP/fetch 实现，不依赖 npm 包。

已实现：

- `POST /v1/chat/completions` 代理。
- 虚拟 Key 校验。
- 项目预算预检查。
- JSONL 用量记录。
- 超预算返回 `402`。
- 极简本地 Dashboard。

数据文件默认写入：

```text
data/usage-records.jsonl
data/budget-events.jsonl
```
