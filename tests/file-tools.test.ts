import { describe, expect, it } from "vitest";
import { explainAction } from "../src/core/explain.js";
import type { NormalizedAction } from "../src/core/types.js";

const explain = (action: NormalizedAction) => explainAction(action).message;

describe("file tool explanations", () => {
  it("explains file writes without claiming safety", () => {
    expect(
      explain({ kind: "file_write", source: "claude", toolName: "Write", path: "src/app.ts" }),
    ).toBe("This will write or overwrite `src/app.ts`.");

    expect(
      explain({ kind: "file_write", source: "generic", toolName: "write_file", paths: ["a.txt", "b.txt"] }),
    ).toBe("This will write or overwrite 2 files: `a.txt` and `b.txt`.");
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

  it("keeps hook-controlled names and paths on one terminal line", () => {
    expect(explain({ kind: "file_edit", source: "generic", toolName: "edit", path: "safe\nspoofed.ts" })).toBe(
      "This will edit `safe spoofed.ts`.",
    );
    expect(explain({ kind: "unknown_tool", source: "generic", toolName: "bad\u001b[31mtool" })).toBe(
      "This will run the `bad [31mtool` tool.",
    );
  });
});
