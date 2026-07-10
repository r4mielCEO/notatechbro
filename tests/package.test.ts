import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as library from "../src/index.js";

describe("package metadata", () => {
  it("exposes notatechbro as the primary CLI and keeps change-preview as an alias", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));

    expect(pkg.bin).toMatchObject({
      notatechbro: "./dist/cli.js",
      "change-preview": "./dist/cli.js",
    });
    expect(Object.keys(pkg.bin)[0]).toBe("notatechbro");
    expect(pkg.scripts.lint).toBe("tsc --noEmit");
    expect(pkg.private).not.toBe(true);
    expect(pkg.version).toBe("0.1.0");
    expect(pkg.publishConfig.access).toBe("public");
  });

  it("exports each reusable adapter entrypoint from the package root", () => {
    expect(library.normalizeClaudePayload).toBeTypeOf("function");
    expect(library.normalizeCodexPayload).toBeTypeOf("function");
    expect(library.normalizeHermesPayload).toBeTypeOf("function");
    expect(library.normalizeGenericPayload).toBeTypeOf("function");
  });
});
