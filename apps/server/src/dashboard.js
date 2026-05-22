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
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #eef0f3; text-align: left; font-size: 13px; }
    th { color: #4b5563; background: #fafafa; }
    code { background: #eef0f3; padding: 2px 5px; border-radius: 4px; }
    h2 { margin-top: 28px; }
    @media (max-width: 760px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  </style>
</head>
<body>
  <main>
    <h1>AgentSpendGuard</h1>
    <p>本地 AI Coding 成本防火墙。默认只记录用量元数据，不保存 prompt 内容。</p>
    <section class="grid" id="summary"></section>
    <div class="toolbar">
      <h2>最近用量</h2>
      <a class="button" href="/api/usage.csv">导出 CSV</a>
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
    const money = (n) => "$" + Number(n || 0).toFixed(6);
    async function load() {
      const summary = await fetch("/api/dashboard/summary").then(r => r.json());
      document.getElementById("summary").innerHTML = [
        ["今日花费", money(summary.todaySpend)],
        ["本月花费", money(summary.monthSpend)],
        ["请求数", summary.requestCount],
        ["错误数", summary.errorCount]
      ].map(([label, value]) => '<div class="card"><div class="label">' + label + '</div><div class="value">' + value + '</div></div>').join("");

      const usage = await fetch("/api/usage").then(r => r.json());
      document.getElementById("usage").innerHTML = usage.records.slice(0, 50).map((r) =>
        "<tr><td>" + r.createdAt + "</td><td>" + r.projectId + "</td><td><code>" + r.model + "</code></td><td>" + money(r.estimatedCostUsd) + "</td><td>" + r.statusCode + "</td><td>" + r.latencyMs + "ms</td></tr>"
      ).join("");

      const events = await fetch("/api/events").then(r => r.json());
      document.getElementById("events").innerHTML = events.records.slice(0, 20).map((r) =>
        "<tr><td>" + r.createdAt + "</td><td>" + r.projectId + "</td><td><code>" + r.eventType + "</code></td><td>" + r.currentValueUsd + "</td><td>" + r.limitValueUsd + "</td></tr>"
      ).join("");
    }
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
