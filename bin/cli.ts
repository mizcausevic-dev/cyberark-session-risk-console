#!/usr/bin/env node
import { loadConsole, renderMarkdown } from "../src/index.js";

const [, , inputPath, formatFlag, format] = process.argv;

if (!inputPath) {
  console.error("Usage: cyberark-session-risk-console <input.json> [--format markdown|json]");
  process.exit(1);
}

const sessionConsole = await loadConsole(inputPath);
console.log(formatFlag === "--format" && format === "json" ? JSON.stringify(sessionConsole, null, 2) : renderMarkdown(sessionConsole));
