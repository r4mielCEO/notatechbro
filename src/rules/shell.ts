import type { Explanation } from "../core/types.js";

const COMMAND_SEPARATORS = /\s+(?:&&|;)\s+/;

export function explainShellCommand(command: string): Explanation {
  const trimmed = command.trim();
  if (!trimmed) {
    return explanation("This will run an empty terminal command.", "low", "low", ["shell", "empty"]);
  }

  const parts = trimmed.split(COMMAND_SEPARATORS).filter(Boolean);
  if (parts.length > 1) {
    const explained = parts.map((part) => explainSingleCommand(part));
    const messages = explained.map((item, index) => toClause(item.message, index));
    return {
      message: `${messages.join(", then ")}.`,
      confidence: minConfidence(explained.map((item) => item.confidence)),
      risk: maxRisk(explained.map((item) => item.risk)),
      tags: unique(explained.flatMap((item) => item.tags ?? [])),
    };
  }

  return explainSingleCommand(trimmed);
}

function explainSingleCommand(command: string): Explanation {
  const redirection = findRedirection(command);
  if (redirection) {
    const verb = redirection.operator === ">>" ? "append its output to" : "write its output to";
    return explanation(`This will run a command and ${verb} \`${redirection.target}\`.`, "medium", "medium", ["shell", "redirection"]);
  }

  const tokens = tokenize(command);
  const program = basename(tokens[0] ?? "");
  const args = tokens.slice(1);

  switch (program) {
    case "rm":
    case "trash":
      return explainDelete(args);
    case "mv":
      return explainMove(args);
    case "cp":
      return explainCopy(args);
    case "mkdir":
      return explainMkdir(args);
    case "touch":
      return explainTouch(args);
    case "npm":
    case "pnpm":
    case "yarn":
      return explainJavaScriptPackageCommand(program, args);
    case "pip":
    case "pip3":
      return explainPip(args);
    case "git":
      return explainGit(args);
    case "pytest":
      return explanation("This will run Python tests.", "high", "low", ["shell", "test"]);
    case "vitest":
    case "jest":
      return explanation("This will run JavaScript tests.", "high", "low", ["shell", "test"]);
    case "apply_patch":
    case "patch":
      return explanation("This may modify files using a patch.", "medium", "medium", ["shell", "patch"]);
    default:
      return explanation(`This will run a terminal command: \`${command}\`.`, "low", "medium", ["shell", "fallback"]);
  }
}

function explainDelete(args: string[]): Explanation {
  const targets = positionalArgs(args);
  const target = targets.at(-1);
  if (!target) return explanation("This may delete files or folders.", "low", "high", ["shell", "delete"]);
  const recursive = args.some((arg) => arg.includes("r") || arg.includes("R"));
  const noun = recursive || looksLikeFolder(target) ? "folder" : "file or folder";
  return explanation(`This will delete the \`${target}\` ${noun}.`, "high", "high", ["shell", "delete"]);
}

function explainMove(args: string[]): Explanation {
  const [from, to] = positionalArgs(args);
  if (from && to) return explanation(`This will move or rename \`${from}\` to \`${to}\`.`, "high", "medium", ["shell", "move"]);
  return explanation("This may move or rename files.", "low", "medium", ["shell", "move"]);
}

function explainCopy(args: string[]): Explanation {
  const [from, to] = positionalArgs(args);
  if (from && to) return explanation(`This will copy \`${from}\` to \`${to}\`.`, "high", "low", ["shell", "copy"]);
  return explanation("This may copy files or folders.", "low", "low", ["shell", "copy"]);
}

function explainMkdir(args: string[]): Explanation {
  const target = positionalArgs(args).at(-1);
  if (target) return explanation(`This will create the \`${target}\` folder.`, "high", "low", ["shell", "create-folder"]);
  return explanation("This will create one or more folders.", "medium", "low", ["shell", "create-folder"]);
}

function explainTouch(args: string[]): Explanation {
  const target = positionalArgs(args).at(-1);
  if (target) return explanation(`This will create or update the \`${target}\` file.`, "high", "low", ["shell", "touch"]);
  return explanation("This will create or update file timestamps.", "medium", "low", ["shell", "touch"]);
}

function explainJavaScriptPackageCommand(program: string, args: string[]): Explanation {
  const subcommand = args[0];
  if (subcommand === "install" || (program === "yarn" && !subcommand)) {
    const packages = positionalArgs(args.slice(subcommand === "install" ? 1 : 0));
    if (packages.length === 1) return explanation(`This will install the \`${packages[0]}\` JavaScript package.`, "high", "medium", ["shell", "install"]);
    if (packages.length > 1) return explanation(`This will install ${packages.length} JavaScript packages.`, "high", "medium", ["shell", "install"]);
    return explanation("This will install or update this project's JavaScript packages.", "high", "medium", ["shell", "install"]);
  }

  if ((program === "npm" && subcommand === "test") || (program === "npm" && subcommand === "run" && args[1] === "test")) {
    return explanation("This will run this project's tests.", "high", "low", ["shell", "test"]);
  }

  return explanation(`This will run a ${program} package-manager command.`, "medium", "medium", ["shell", "package-manager"]);
}

function explainPip(args: string[]): Explanation {
  if (args[0] === "install") {
    const packages = positionalArgs(args.slice(1));
    if (packages.length === 1) return explanation(`This will install the \`${packages[0]}\` Python package.`, "high", "medium", ["shell", "install"]);
    if (packages.length > 1) return explanation(`This will install ${packages.length} Python packages.`, "high", "medium", ["shell", "install"]);
    return explanation("This will install Python packages.", "high", "medium", ["shell", "install"]);
  }
  return explanation("This will run a Python package-manager command.", "medium", "medium", ["shell", "package-manager"]);
}

function explainGit(args: string[]): Explanation {
  const subcommand = args[0];
  switch (subcommand) {
    case "push":
      return explanation("This will upload your local commits to the remote repository.", "high", "medium", ["shell", "git"]);
    case "pull":
      return explanation("This will download remote changes and merge them into this project.", "high", "medium", ["shell", "git"]);
    case "reset":
      if (args.includes("--hard")) return explanation("This may discard local code changes and move the project back to another git version.", "high", "high", ["shell", "git", "dangerous"]);
      return explanation("This will move the current git branch to another version.", "medium", "medium", ["shell", "git"]);
    case "clean":
      return explanation("This may permanently delete untracked files from the project.", "high", "high", ["shell", "git", "dangerous"]);
    case "commit":
      return explanation("This will save the staged project changes as a local git commit.", "high", "low", ["shell", "git"]);
    case "checkout":
    case "switch":
      return explanation("This will switch the project to another git branch or version.", "high", "medium", ["shell", "git"]);
    default:
      return explanation("This will run a git command.", "medium", "medium", ["shell", "git"]);
  }
}

function tokenize(command: string): string[] {
  const matches = command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
  return matches.map((token) => token.replace(/^(["'])(.*)\1$/, "$2"));
}

function positionalArgs(args: string[]): string[] {
  return args.filter((arg) => !arg.startsWith("-"));
}

function basename(program: string): string {
  return program.split("/").at(-1) ?? program;
}

function looksLikeFolder(path: string): boolean {
  return path.endsWith("/") || !path.split("/").at(-1)?.includes(".");
}

function findRedirection(command: string): { operator: ">" | ">>"; target: string } | undefined {
  const match = command.match(/(?:^|\s)(>>|>)\s*([^\s]+)/);
  if (!match?.[1] || !match[2]) return undefined;
  return { operator: match[1] as ">" | ">>", target: match[2].replace(/^(["'])(.*)\1$/, "$2") };
}

function explanation(message: string, confidence: Explanation["confidence"], risk: Explanation["risk"], tags: string[]): Explanation {
  return { message, confidence, risk, tags };
}

function toClause(message: string, index: number): string {
  const withoutPeriod = message.replace(/\.$/, "");
  if (index === 0) return withoutPeriod;
  return withoutPeriod.replace(/^This will /, "").replace(/^This may /, "may ");
}

function minConfidence(confidences: Explanation["confidence"][]): Explanation["confidence"] {
  if (confidences.includes("low")) return "low";
  if (confidences.includes("medium")) return "medium";
  return "high";
}

function maxRisk(risks: Explanation["risk"][]): Explanation["risk"] {
  if (risks.includes("high")) return "high";
  if (risks.includes("medium")) return "medium";
  return "low";
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
