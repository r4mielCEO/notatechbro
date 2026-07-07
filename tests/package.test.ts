import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("package metadata", () => {
  it("exposes notatechbro as the primary CLI and keeps change-preview as an alias", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));

    expect(pkg.bin).toMatchObject({
      notatechbro: "dist/src/cli.js",
      "change-preview": "dist/src/cli.js",
    });
    expect(Object.keys(pkg.bin)[0]).toBe("notatechbro");
  });
});
