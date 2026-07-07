import { describe, expect, it } from "vitest";
import { explainShellCommand } from "../src/rules/shell.js";

const msg = (command: string) => explainShellCommand(command).message;

describe("shell command explanations", () => {
  it("explains deleting a build folder", () => {
    expect(msg("rm -rf dist")).toBe("This will delete the `dist` folder.");
  });

  it("explains chained commands in one sentence", () => {
    expect(msg("rm -rf build && npm install")).toBe(
      "This will delete the `build` folder, then install or update this project's JavaScript packages.",
    );
  });

  it("explains moving or renaming a path", () => {
    expect(msg("mv old-name new-name")).toBe("This will move or rename `old-name` to `new-name`.");
  });

  it("explains copying a path", () => {
    expect(msg("cp README.md docs/README.md")).toBe("This will copy `README.md` to `docs/README.md`.");
  });

  it("explains package installs", () => {
    expect(msg("npm install zod")).toBe("This will install the `zod` JavaScript package.");
    expect(msg("pip install requests")).toBe("This will install the `requests` Python package.");
  });

  it("explains git operations with risk-aware wording", () => {
    expect(msg("git push")).toBe("This will upload your local commits to the remote repository.");
    expect(msg("git reset --hard HEAD~1")).toBe(
      "This may discard local code changes and move the project back to another git version.",
    );
    expect(msg("git clean -fd")).toBe("This may permanently delete untracked files from the project.");
  });

  it("explains test commands", () => {
    expect(msg("npm test")).toBe("This will run this project's tests.");
    expect(msg("pytest tests/")).toBe("This will run Python tests.");
  });

  it("explains output redirection", () => {
    expect(msg("python script.py > report.txt")).toBe("This will run a command and write its output to `report.txt`.");
    expect(msg("node script.js >> report.txt")).toBe("This will run a command and append its output to `report.txt`.");
  });

  it("falls back honestly for unknown commands", () => {
    expect(msg("custom-tool --flag")).toBe("This will run a terminal command: `custom-tool --flag`.");
  });
});
