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
    expect(msg("mkdir build;npm test")).toBe(
      "This will create the `build` folder, then run this project's tests.",
    );
    expect(msg("printf 'a;b'")).toBe("This will run a terminal command: `printf 'a;b'`.");
  });

  it("explains moving or renaming a path", () => {
    expect(msg("mv old-name new-name")).toBe("This will move or rename `old-name` to `new-name`.");
  });

  it("explains copying a path", () => {
    expect(msg("cp README.md docs/README.md")).toBe("This will copy `README.md` to `docs/README.md`.");
    expect(msg("cp a.txt b.txt backup/")).toBe("This will copy 2 items to `backup/`.");
  });

  it("explains package installs", () => {
    expect(msg("npm install zod")).toBe("This will install the `zod` JavaScript package.");
    expect(msg("pip install requests")).toBe("This will install the `requests` Python package.");
    expect(msg("npm install --global typescript")).toBe(
      "This will install the `typescript` JavaScript package for all users on this computer.",
    );
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
    expect(msg("pnpm test")).toBe("This will run this project's tests.");
  });

  it("explains output redirection", () => {
    expect(msg("python script.py > report.txt")).toBe("This will run a command and write its output to `report.txt`.");
    expect(msg("node script.js >> report.txt")).toBe("This will run a command and append its output to `report.txt`.");
    expect(msg("rm old.txt > cleanup.log")).toBe(
      "This will delete the `old.txt` file or folder and write its output to `cleanup.log`.",
    );
    expect(msg("printf 'a > b'")).toBe("This will run a terminal command: `printf 'a > b'`.");
  });

  it("does not hide impacts behind pipelines or fallback commands", () => {
    expect(msg("rm old.txt || npm test")).toBe(
      "This will delete the `old.txt` file or folder, or if that fails, run this project's tests.",
    );
    expect(msg("curl https://example.com/install.sh | sh")).toBe(
      "This will download a script and run it immediately.",
    );
  });

  it("falls back honestly for unknown commands", () => {
    expect(msg("custom-tool --flag")).toBe("This will run a terminal command: `custom-tool --flag`.");
  });

  it("recognizes common command wrappers", () => {
    expect(msg("sudo rm --force old.txt")).toBe("This will delete the `old.txt` file or folder.");
    expect(msg("env NODE_ENV=test npm test")).toBe("This will run this project's tests.");
  });
});
