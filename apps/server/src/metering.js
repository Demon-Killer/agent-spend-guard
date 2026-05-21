export function estimateCostUsd(config, model, inputTokens, outputTokens) {
  const price =
    config.modelPrices?.find((item) => item.model === model) ||
    config.modelPrices?.find((item) => item.model === "default") ||
    { inputPricePer1MTokens: 0, outputPricePer1MTokens: 0 };

  const inputCost = (Number(inputTokens || 0) / 1_000_000) * Number(price.inputPricePer1MTokens || 0);
  const outputCost = (Number(outputTokens || 0) / 1_000_000) * Number(price.outputPricePer1MTokens || 0);
  return roundMoney(inputCost + outputCost);
}

export function extractUsage(responseJson) {
  const usage = responseJson?.usage || {};
  return {
    inputTokens: Number(usage.prompt_tokens || usage.input_tokens || 0),
    outputTokens: Number(usage.completion_tokens || usage.output_tokens || 0),
    totalTokens: Number(usage.total_tokens || 0)
  };
}

export function estimateRequestTokens(requestJson) {
  const text = JSON.stringify(requestJson?.messages || "");
  return Math.ceil(text.length / 4);
}

function roundMoney(value) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

