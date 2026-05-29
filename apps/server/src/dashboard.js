import { readBudgetEvents, readUsageRecords } from "./store.js";

export function dashboardHtml() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AgentSpendGuard</title>
  <style>
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f6f7f9; color: #15171a; }
    main { max-width: 1040px; margin: 0 auto; padding: 32px 20px; }
    h1 { font-size: 28px; margin: 0 0 8px; }
    p { color: #5d6673; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 24px 0; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
    .label { color: #6b7280; font-size: 13px; }
    .value { font-size: 24px; font-weight: 700; margin-top: 6px; }
    .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 28px; }
    .toolbar h2 { margin: 0; }
    .button { display: inline-flex; align-items: center; justify-content: center; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 10px; color: #111827; background: #fff; text-decoration: none; font-size: 13px; }
    .forms { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
    form { display: grid; gap: 8px; }
    input, select { width: 100%; box-sizing: border-box; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 9px; font-size: 13px; }
    button { border: 0; border-radius: 6px; padding: 9px 10px; background: #111827; color: #fff; font-size: 13px; cursor: pointer; }
    .muted { color: #6b7280; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #eef0f3; text-align: left; font-size: 13px; }
    th { color: #4b5563; background: #fafafa; }
    code { background: #eef0f3; padding: 2px 5px; border-radius: 4px; }
    h2 { margin-top: 28px; }
    @media (max-width: 900px) { .forms { grid-template-columns: 1fr; } }
    @media (max-width: 760px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  </style>
</head>
<body>
  <main>
    <h1>AgentSpendGuard</h1>
    <p>本地 AI Coding 成本防火墙。默认只记录用量元数据，不保存 prompt 内容。</p>
    <section class="grid" id="summary"></section>
    <h2>配置管理</h2>
    <p class="muted">这里会写入本地 <code>config.json</code>。Provider API Key 只在本机保存，列表中会脱敏显示。</p>
    <section class="forms">
      <div class="card">
        <h3>新增 Provider</h3>
        <form id="provider-form">
          <input name="id" placeholder="id，例如 openrouter">
          <input name="name" placeholder="名称，例如 OpenRouter">
          <input name="baseUrl" placeholder="Base URL，例如 https://openrouter.ai/api/v1">
          <input name="apiKey" placeholder="上游 API Key">
          <button type="submit">保存 Provider</button>
        </form>
      </div>
      <div class="card">
        <h3>新增 Project</h3>
        <form id="project-form">
          <input name="id" placeholder="id，例如 my-project">
          <input name="name" placeholder="项目名称">
          <select name="providerId" id="project-provider"></select>
          <input name="dailyBudgetUsd" type="number" step="0.01" placeholder="每日预算 USD">
          <input name="monthlyBudgetUsd" type="number" step="0.01" placeholder="月度预算 USD">
          <input name="maxRequestsPerMinute" type="number" placeholder="每分钟请求限制">
          <button type="submit">保存 Project</button>
        </form>
      </div>
      <div class="card">
        <h3>新增 Virtual Key</h3>
        <form id="key-form">
          <input name="id" placeholder="id，例如 my-project-key">
          <input name="name" placeholder="Key 名称">
          <select name="projectId" id="key-project"></select>
          <input name="key" placeholder="留空自动生成">
          <button type="submit">保存 Virtual Key</button>
        </form>
      </div>
      <div class="card">
        <h3>新增模型价格</h3>
        <form id="model-price-form">
          <input name="model" placeholder="模型 ID，例如 openai/gpt-4o-mini">
          <input name="inputPricePer1MTokens" type="number" step="0.000001" placeholder="输入价格 USD / 1M tokens">
          <input name="outputPricePer1MTokens" type="number" step="0.000001" placeholder="输出价格 USD / 1M tokens">
          <button type="submit">保存模型价格</button>
        </form>
      </div>
    </section>
    <h2>当前配置</h2>
    <table>
      <thead><tr><th>类型</th><th>ID</th><th>名称</th><th>关联</th><th>状态</th></tr></thead>
      <tbody id="config-list"></tbody>
    </table>
    <div class="toolbar">
      <h2>最近用量</h2>
      <a class="button" id="usage-export" href="/api/usage.csv">导出 CSV</a>
    </div>
    <table>
      <thead><tr><th>时间</th><th>项目</th><th>模型</th><th>费用</th><th>状态</th><th>延迟</th></tr></thead>
      <tbody id="usage"></tbody>
    </table>
    <h2>最近事件</h2>
    <table>
      <thead><tr><th>时间</th><th>项目</th><th>类型</th><th>当前值</th><th>限制值</th></tr></thead>
      <tbody id="events"></tbody>
    </table>
  </main>
  <script>
    const params = new URLSearchParams(location.search);
    const adminToken = params.get("admin_token") || localStorage.getItem("agentSpendGuardAdminToken") || "";
    if (params.get("admin_token")) {
      localStorage.setItem("agentSpendGuardAdminToken", params.get("admin_token"));
      history.replaceState(null, "", location.pathname);
    }
    function apiFetch(url, options = {}) {
      return fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          ...(adminToken ? { "x-admin-token": adminToken } : {})
        }
      });
    }
    const money = (n) => "$" + Number(n || 0).toFixed(6);
    async function load() {
      const summaryResponse = await apiFetch("/api/dashboard/summary");
      if (summaryResponse.status === 401) {
        document.getElementById("summary").innerHTML = '<div class="card"><div class="label">Admin Token</div><div class="value">Required</div><p class="muted">Open /?admin_token=your-token once.</p></div>';
        return;
      }
      const summary = await summaryResponse.json();
      document.getElementById("summary").innerHTML = [
        ["今日花费", money(summary.todaySpend)],
        ["本月花费", money(summary.monthSpend)],
        ["请求数", summary.requestCount],
        ["错误数", summary.errorCount]
      ].map(([label, value]) => '<div class="card"><div class="label">' + label + '</div><div class="value">' + value + '</div></div>').join("");

      const usage = await apiFetch("/api/usage").then(r => r.json());
      document.getElementById("usage").innerHTML = usage.records.slice(0, 50).map((r) =>
        "<tr><td>" + r.createdAt + "</td><td>" + r.projectId + "</td><td><code>" + r.model + "</code></td><td>" + money(r.estimatedCostUsd) + "</td><td>" + r.statusCode + "</td><td>" + r.latencyMs + "ms</td></tr>"
      ).join("");

      const events = await apiFetch("/api/events").then(r => r.json());
      document.getElementById("events").innerHTML = events.records.slice(0, 20).map((r) =>
        "<tr><td>" + r.createdAt + "</td><td>" + r.projectId + "</td><td><code>" + r.eventType + "</code></td><td>" + r.currentValueUsd + "</td><td>" + r.limitValueUsd + "</td></tr>"
      ).join("");

      const config = await apiFetch("/api/config").then(r => r.json());
      renderConfig(config);
      document.getElementById("usage-export").href = adminToken ? "/api/usage.csv?admin_token=" + encodeURIComponent(adminToken) : "/api/usage.csv";
    }
    function renderConfig(config) {
      const providerOptions = config.providers.map(p => '<option value="' + p.id + '">' + p.name + ' (' + p.id + ')</option>').join("");
      const projectOptions = config.projects.map(p => '<option value="' + p.id + '">' + p.name + ' (' + p.id + ')</option>').join("");
      document.getElementById("project-provider").innerHTML = providerOptions;
      document.getElementById("key-project").innerHTML = projectOptions;
      const rows = [
        ...config.providers.map(p => ["Provider", p.id, p.name, p.baseUrl, p.enabled ? "enabled" : "disabled"]),
        ...config.projects.map(p => ["Project", p.id, p.name, "provider=" + p.providerId + ", daily=" + p.dailyBudgetUsd + ", rpm=" + p.maxRequestsPerMinute, p.enabled ? "enabled" : "disabled"]),
        ...config.virtualKeys.map(k => ["Virtual Key", k.id, k.name, "project=" + k.projectId, k.enabled ? "enabled" : "disabled"]),
        ...(config.modelPrices || []).map(m => ["Model Price", m.model, m.model, "input=$" + m.inputPricePer1MTokens + "/1M, output=$" + m.outputPricePer1MTokens + "/1M", "active"])
      ];
      document.getElementById("config-list").innerHTML = rows.map(r =>
        "<tr><td>" + r[0] + "</td><td><code>" + r[1] + "</code></td><td>" + r[2] + "</td><td>" + r[3] + "</td><td>" + r[4] + "</td></tr>"
      ).join("");
    }
    function formData(form) {
      return Object.fromEntries(new FormData(form).entries());
    }
    async function postForm(form, url, transform = (x) => x) {
      const payload = transform(formData(form));
      const response = await apiFetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        alert(body.error?.message || "保存失败");
        return;
      }
      form.reset();
      await load();
    }
    document.getElementById("provider-form").addEventListener("submit", (event) => {
      event.preventDefault();
      postForm(event.currentTarget, "/api/providers");
    });
    document.getElementById("project-form").addEventListener("submit", (event) => {
      event.preventDefault();
      postForm(event.currentTarget, "/api/projects", (data) => ({
        ...data,
        dailyBudgetUsd: Number(data.dailyBudgetUsd || 0),
        monthlyBudgetUsd: Number(data.monthlyBudgetUsd || 0),
        maxRequestsPerMinute: Number(data.maxRequestsPerMinute || 0)
      }));
    });
    document.getElementById("key-form").addEventListener("submit", (event) => {
      event.preventDefault();
      postForm(event.currentTarget, "/api/virtual-keys");
    });
    document.getElementById("model-price-form").addEventListener("submit", (event) => {
      event.preventDefault();
      postForm(event.currentTarget, "/api/model-prices", (data) => ({
        ...data,
        inputPricePer1MTokens: Number(data.inputPricePer1MTokens || 0),
        outputPricePer1MTokens: Number(data.outputPricePer1MTokens || 0)
      }));
    });
    load();
    setInterval(load, 5000);
  </script>
</body>
</html>`;
}

export function dashboardSummary(config) {
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  let todaySpend = 0;
  let monthSpend = 0;
  let requestCount = 0;
  let errorCount = 0;

  for (const record of readUsageRecords()) {
    requestCount += 1;
    if (Number(record.statusCode || 0) >= 400) {
      errorCount += 1;
    }
    const cost = Number(record.estimatedCostUsd || 0);
    const createdAt = String(record.createdAt || "");
    if (createdAt.startsWith(today)) {
      todaySpend += cost;
    }
    if (createdAt.startsWith(month)) {
      monthSpend += cost;
    }
  }

  return {
    todaySpend,
    monthSpend,
    requestCount,
    errorCount,
    projectCount: config.projects.length,
    providerCount: config.providers.length,
    eventCount: readBudgetEvents().length
  };
}
