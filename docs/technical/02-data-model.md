# 数据模型

## providers

上游模型服务商配置。

```text
id
name
type
base_url
api_key_encrypted
enabled
created_at
updated_at
```

## projects

项目配置。

```text
id
name
daily_budget_usd
monthly_budget_usd
enabled
created_at
updated_at
```

## virtual_keys

本地虚拟 Key。

```text
id
project_id
name
key_hash
prefix
enabled
created_at
last_used_at
```

## model_prices

模型价格表。

```text
id
provider_type
model
input_price_per_1m_tokens
output_price_per_1m_tokens
created_at
updated_at
```

## usage_records

调用用量记录。

```text
id
project_id
virtual_key_id
provider_id
provider_type
model
request_type
input_tokens
output_tokens
estimated_cost_usd
latency_ms
status_code
error_code
stream
created_at
```

## budget_events

预算和熔断事件。

```text
id
project_id
virtual_key_id
event_type
reason
limit_value_usd
current_value_usd
created_at
```

## settings

全局设置。

```text
key
value
updated_at
```

## Prompt 存储策略

MVP 默认：

- 不保存请求 messages。
- 不保存模型输出内容。
- 只保存用量元数据。

这不仅是隐私措施，也是产品卖点。

