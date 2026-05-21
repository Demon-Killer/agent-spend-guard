import fs from "node:fs";
import { paths } from "./config.js";

export function appendUsage(record) {
  appendJsonLine(paths.usage, record);
}

export function appendEvent(record) {
  appendJsonLine(paths.events, record);
}

export function readUsageRecords() {
  return readJsonLines(paths.usage);
}

export function readBudgetEvents() {
  return readJsonLines(paths.events);
}

function appendJsonLine(filePath, record) {
  fs.appendFileSync(filePath, `${JSON.stringify(record)}\n`, "utf8");
}

function readJsonLines(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

