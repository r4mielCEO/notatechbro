import { describe, expect, it } from "vitest";
import { normalizePayload } from "../src/core/normalize.js";

describe("adapter normalization", () => {
  it("normalizes Claude Code Bash payloads", () => {
    expect(normalizePayload({ tool_name: "Bash", tool_input: { command: "npm test" }, cwd: "/repo" })).toMatchObject({
      kind: "shell",
      command: "npm test",
      cwd: "/repo",
      source: "claude",
    });
  });

  it("normalizes Claude Code file write payloads", () => {
    expect(normalizePayload({ tool_name: "Write", tool_input: { file_path: "src/app.ts" } })).toMatchObject({
      kind: "file_write",
      path: "src/app.ts",
      source: "claude",
    });
  });

  it("normalizes Hermes terminal and file payloads", () => {
    expect(
      normalizePayload({
        hook_event_name: "pre_tool_call",
        tool_name: "terminal",
        tool_input: { command: "git push" },
        cwd: "/repo",
      }),
    ).toMatchObject({ kind: "shell", command: "git push", source: "hermes", cwd: "/repo" });

    expect(
      normalizePayload({ hook_event_name: "pre_tool_call", tool_name: "write_file", tool_input: { path: "README.md" } }),
    ).toMatchObject({ kind: "file_write", path: "README.md", source: "hermes" });
  });

  it("normalizes Codex candidate shell payload shapes", () => {
    expect(normalizePayload({ tool_name: "shell", tool_input: { command: "pytest" } })).toMatchObject({
      kind: "shell",
      command: "pytest",
      source: "codex",
    });

    expect(normalizePayload({ tool_call: { name: "shell", input: { command: "pytest" } } })).toMatchObject({
      kind: "shell",
      command: "pytest",
      source: "codex",
    });

    expect(
      normalizePayload({
        cwd: "/repo",
        hook_event_name: "PreToolUse",
        model: "gpt-5.5",
        permission_mode: "default",
        session_id: "session",
        tool_input: { command: "npm test" },
        tool_name: "Bash",
        tool_use_id: "tool-use",
        transcript_path: null,
        turn_id: "turn",
      }),
    ).toMatchObject({ kind: "shell", command: "npm test", source: "codex", cwd: "/repo" });
  });

  it("keeps unknown payloads explainable", () => {
    expect(normalizePayload({ tool_name: "Something", tool_input: { a: 1 } })).toMatchObject({
      kind: "unknown_tool",
      toolName: "Something",
      source: "generic",
    });
  });
});
