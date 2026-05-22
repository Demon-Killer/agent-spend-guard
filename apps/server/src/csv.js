const usageHeaders = [
  "createdAt",
  "projectId",
  "virtualKeyId",
  "providerId",
  "model",
  "requestType",
  "inputTokens",
  "outputTokens",
  "estimatedCostUsd",
  "latencyMs",
  "statusCode",
  "errorCode",
  "stream"
];

export function usageToCsv(records) {
  const lines = [usageHeaders.join(",")];
  for (const record of records) {
    lines.push(usageHeaders.map((key) => csvCell(record[key])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function csvCell(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}
