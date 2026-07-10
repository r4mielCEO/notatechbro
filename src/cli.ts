#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { explainAction } from "./core/explain.js";
import { normalizePayload } from "./core/normalize.js";

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const jsonMode = args.has("--json");
const quiet = args.has("--quiet");
const version = readVersion();

const malformedPreview = "This could not be previewed because the hook payload was not valid JSON.";

async function main(): Promise<void> {
  if (args.has("--help") || args.has("-h")) {
    process.stdout.write(helpText());
    return;
  }
  if (args.has("--version") || args.has("-v")) {
    process.stdout.write(`${version}\n`);
    return;
  }
  if (args.has("--check") || args.has("check")) {
    process.stdout.write(`NotATechBro ${version} is installed and ready.\nExample: This will run this project's tests.\n`);
    return;
  }

  const unknownArgs = rawArgs.filter((arg) => !["--json", "--quiet"].includes(arg));
  if (unknownArgs.length > 0) {
    process.stderr.write(`Unknown option: ${unknownArgs.join(" ")}\nRun notatechbro --help for usage.\n`);
    process.exitCode = 2;
    return;
  }

  if (process.stdin.isTTY) {
    process.stdout.write(helpText());
    return;
  }

  const input = await readStdin();
  let payload: unknown;

  try {
    payload = input.trim() ? JSON.parse(input) : {};
  } catch {
    emit({ preview: malformedPreview, confidence: "low", risk: "medium" });
    return;
  }

  const action = normalizePayload(payload);
  const explanation = explainAction(action, { quiet });
  emit({ preview: explanation.message, confidence: explanation.confidence, risk: explanation.risk });
}

function helpText(): string {
  return `NotATechBro ${version}\n\nExplain agentic CLI tool calls in plain English before they run.\n\nUsage:\n  command-producing-json | notatechbro [options]\n  notatechbro --check\n\nOptions:\n  --json       Print structured JSON to stdout\n  --quiet      Hide read-only file previews\n  --check      Confirm the installation is ready\n  -h, --help   Show this help\n  -v, --version\n               Show the installed version\n\nDocs: https://r4mielceo.github.io/notatechbro/\n`;
}

function readVersion(): string {
  try {
    const metadata = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version?: unknown };
    return typeof metadata.version === "string" ? metadata.version : "unknown";
  } catch {
    return "unknown";
  }
}

function emit(result: { preview: string; confidence: string; risk?: string }): void {
  if (jsonMode) {
    const payload: Record<string, unknown> = {
      preview: result.preview,
      confidence: result.confidence,
    };
    if (result.risk) payload["risk"] = result.risk;
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }

  if (result.preview) process.stderr.write(`${result.preview}\n`);
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  if (jsonMode) {
    process.stdout.write(`${JSON.stringify({ preview: `This could not be previewed: ${message}`, confidence: "low" })}\n`);
  } else {
    process.stderr.write(`This could not be previewed: ${message}\n`);
  }
});
