import { describe, expect, it } from "vitest";
import { explainAction } from "../src/core/explain.js";
import type { NormalizedAction } from "../src/core/types.js";

const explain = (action: NormalizedAction) => explainAction(action).message;

describe("file tool explanations", () => {
  it("explains file writes without claiming safety", () => {
    expect(
      explain({ kind: "file_write", source: "claude", toolName: "Write", path: "src/app.ts" }),
    ).toBe("This will write or overwrite `src/app.ts`.");
  });

  it("explains file edits and multi-edits", () => {
    expect(
      explain({ kind: "file_edit", source: "hermes", toolName: "patch", path: "README.md" }),
    ).toBe("This will edit `README.md`.");

    expect(
      explain({
        kind: "file_edit",
        source: "claude",
        toolName: "MultiEdit",
        paths: ["src/a.ts", "src/b.ts"],
      }),
    ).toBe("This will edit 2 files: `src/a.ts` and `src/b.ts`.");
  });

  it("can suppress read-only actions", () => {
    const action: NormalizedAction = { kind: "file_read", source: "hermes", toolName: "read_file", path: "README.md" };
    expect(explainAction(action).message).toBe("This will read `README.md`.");
    expect(explainAction(action, { quiet: true }).message).toBe("");
  });

  it("explains unknown tools without overclaiming", () => {
    expect(explain({ kind: "unknown_tool", source: "generic", toolName: "MysteryTool" })).toBe(
      "This will run the `MysteryTool` tool.",
    );
  });
});
