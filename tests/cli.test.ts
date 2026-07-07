import { spawn } from "node:child_process";
import { describe, expect, it } from "vitest";

async function runCli(args: string[], stdin: string) {
  return new Promise<{ stdout: string; stderr: string; code: number | null }>((resolve, reject) => {
    const child = spawn("node", ["--import", "tsx", "src/cli.ts", ...args], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ stdout, stderr, code }));
    child.stdin.end(stdin);
  });
}

describe("CLI", () => {
  it("prints human previews to stderr by default", async () => {
    const result = await runCli([], JSON.stringify({ tool_name: "Bash", tool_input: { command: "rm -rf dist" } }));
    expect(result.code).toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr.trim()).toBe("This will delete the `dist` folder.");
  });

  it("prints structured JSON to stdout in --json mode", async () => {
    const result = await runCli(["--json"], JSON.stringify({ tool_name: "Bash", tool_input: { command: "git push" } }));
    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({
      decision: "allow",
      preview: "This will upload your local commits to the remote repository.",
      risk: "medium",
    });
  });

  it("handles malformed JSON without blocking hooks", async () => {
    const result = await runCli([], "{not-json");
    expect(result.code).toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr.trim()).toBe("This could not be previewed because the hook payload was not valid JSON.");
  });

  it("supports quiet mode for read-only actions", async () => {
    const payload = JSON.stringify({ hook_event_name: "pre_tool_call", tool_name: "read_file", tool_input: { path: "README.md" } });
    const result = await runCli(["--quiet"], payload);
    expect(result.code).toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
  });
});
