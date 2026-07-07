#!/usr/bin/env node
import { explainAction } from "./core/explain.js";
import { normalizePayload } from "./core/normalize.js";

const args = new Set(process.argv.slice(2));
const jsonMode = args.has("--json");
const quiet = args.has("--quiet");

const malformedPreview = "This could not be previewed because the hook payload was not valid JSON.";

async function main(): Promise<void> {
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

function emit(result: { preview: string; confidence: string; risk?: string }): void {
  if (jsonMode) {
    const payload: Record<string, unknown> = {
      decision: "allow",
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
    process.stdout.write(JSON.stringify({ decision: "allow", preview: `This could not be previewed: ${message}`, confidence: "low" }));
  } else {
    process.stderr.write(`This could not be previewed: ${message}\n`);
  }
});
