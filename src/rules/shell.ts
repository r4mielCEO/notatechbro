import type { Explanation } from "../core/types.js";
import { inlineCode } from "../core/format.js";

export function explainShellCommand(command: string): Explanation {
  const trimmed = command.trim();
  if (!trimmed) {
    return explanation("This will run an empty terminal command.", "low", "low", ["shell", "empty"]);
  }

  const alternatives = splitOutsideQuotes(trimmed, "||");
  if (alternatives.length > 1) {
    const explained = alternatives.map(explainSingleCommand);
    const first = toClause(explained[0]?.message ?? "", 0);
    const rest = explained.slice(1).map((item) => toClause(item.message, 1)).join(", then ");
    return combine(explained, `${first}, or if that fails, ${rest}.`);
  }

  const pipeline = splitOutsideQuotes(trimmed, "|");
  if (pipeline.length > 1) {
    if (/^(?:curl|wget)\b/.test(pipeline[0] ?? "") && /^(?:sh|bash)\b/.test(pipeline.at(-1) ?? "")) {
      return explanation("This will download a script and run it immediately.", "high", "high", ["shell", "download", "dangerous"]);
    }
    const explained = pipeline.map(explainSingleCommand);
    const message = explained.map((item, index) => toClause(item.message, index)).join(", and then ");
    return combine(explained, `${message}.`);
  }

  const parts = splitCommandSequence(trimmed);
  if (parts.length > 1) {
    const explained = parts.map((part) => explainSingleCommand(part));
    const messages = explained.map((item, index) => toClause(item.message, index));
    return combine(explained, `${messages.join(", then ")}.`);
  }

  return explainSingleCommand(trimmed);
}

function explainSingleCommand(command: string): Explanation {
  const redirection = findRedirection(command);
  if (redirection) {
    const verb = redirection.operator === ">>" ? "append its output to" : "write its output to";
    const base = explainSingleCommand(redirection.command);
    const baseClause = base.tags?.includes("fallback") ? "This will run a command" : base.message.replace(/\.$/, "");
    return combine(
      [base, explanation("", "medium", "medium", ["shell", "redirection"])],
      `${baseClause} and ${verb} ${inlineCode(redirection.target)}.`,
    );
  }

  const tokens = unwrapCommandPrefix(tokenize(command));
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
      return explanation(`This will run a terminal command: ${inlineCode(command)}.`, "low", "medium", ["shell", "fallback"]);
  }
}

function explainDelete(args: string[]): Explanation {
  const targets = positionalArgs(args);
  const target = targets.at(-1);
  if (!target) return explanation("This may delete files or folders.", "low", "high", ["shell", "delete"]);
  const recursive = args.some((arg) => /^-[^-]*[rR]/.test(arg) || arg === "--recursive");
  const noun = recursive || looksLikeFolder(target) ? "folder" : "file or folder";
  return explanation(`This will delete the ${inlineCode(target)} ${noun}.`, "high", "high", ["shell", "delete"]);
}

function explainMove(args: string[]): Explanation {
  const targets = positionalArgs(args);
  const to = targets.at(-1);
  const sources = targets.slice(0, -1);
  if (sources.length === 1 && to) return explanation(`This will move or rename ${inlineCode(sources[0] ?? "")} to ${inlineCode(to)}.`, "high", "medium", ["shell", "move"]);
  if (sources.length > 1 && to) return explanation(`This will move ${sources.length} items to ${inlineCode(to)}.`, "high", "medium", ["shell", "move"]);
  return explanation("This may move or rename files.", "low", "medium", ["shell", "move"]);
}

function explainCopy(args: string[]): Explanation {
  const targets = positionalArgs(args);
  const to = targets.at(-1);
  const sources = targets.slice(0, -1);
  if (sources.length === 1 && to) return explanation(`This will copy ${inlineCode(sources[0] ?? "")} to ${inlineCode(to)}.`, "high", "low", ["shell", "copy"]);
  if (sources.length > 1 && to) return explanation(`This will copy ${sources.length} items to ${inlineCode(to)}.`, "high", "low", ["shell", "copy"]);
  return explanation("This may copy files or folders.", "low", "low", ["shell", "copy"]);
}

function explainMkdir(args: string[]): Explanation {
  const target = positionalArgs(args).at(-1);
  if (target) return explanation(`This will create the ${inlineCode(target)} folder.`, "high", "low", ["shell", "create-folder"]);
  return explanation("This will create one or more folders.", "medium", "low", ["shell", "create-folder"]);
}

function explainTouch(args: string[]): Explanation {
  const target = positionalArgs(args).at(-1);
  if (target) return explanation(`This will create or update the ${inlineCode(target)} file.`, "high", "low", ["shell", "touch"]);
  return explanation("This will create or update file timestamps.", "medium", "low", ["shell", "touch"]);
}

function explainJavaScriptPackageCommand(program: string, args: string[]): Explanation {
  const subcommand = args[0];
  if (subcommand === "install" || (program === "yarn" && !subcommand)) {
    const packages = positionalArgs(args.slice(subcommand === "install" ? 1 : 0));
    const global = args.some((arg) => arg === "-g" || arg === "--global");
    if (packages.length === 1) return explanation(`This will install the ${inlineCode(packages[0] ?? "")} JavaScript package${global ? " for all users on this computer" : ""}.`, "high", global ? "high" : "medium", ["shell", "install", ...(global ? ["global"] : [])]);
    if (packages.length > 1) return explanation(`This will install ${packages.length} JavaScript packages.`, "high", "medium", ["shell", "install"]);
    return explanation("This will install or update this project's JavaScript packages.", "high", "medium", ["shell", "install"]);
  }

  if (subcommand === "test" || (subcommand === "run" && args[1] === "test")) {
    return explanation("This will run this project's tests.", "high", "low", ["shell", "test"]);
  }

  return explanation(`This will run a ${program} package-manager command.`, "medium", "medium", ["shell", "package-manager"]);
}

function explainPip(args: string[]): Explanation {
  if (args[0] === "install") {
    const packages = positionalArgs(args.slice(1));
    if (packages.length === 1) return explanation(`This will install the ${inlineCode(packages[0] ?? "")} Python package.`, "high", "medium", ["shell", "install"]);
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

function unwrapCommandPrefix(tokens: string[]): string[] {
  let result = tokens;
  while (result[0] === "sudo" || result[0] === "command" || result[0] === "builtin" || result[0] === "nohup") {
    result = result.slice(1);
  }
  if (result[0] === "env") {
    result = result.slice(1);
    while (result[0]?.includes("=") && !result[0].startsWith("=")) result = result.slice(1);
  }
  return result;
}

function splitCommandSequence(command: string): string[] {
  const parts: string[] = [];
  let quote: "'" | "\"" | undefined;
  let escaped = false;
  let start = 0;

  for (let index = 0; index < command.length; index += 1) {
    const character = command[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\" && quote !== "'") {
      escaped = true;
      continue;
    }
    if (character === "'" || character === "\"") {
      quote = quote === character ? undefined : quote ?? character;
      continue;
    }
    if (!quote && (character === ";" || (character === "&" && command[index + 1] === "&"))) {
      const part = command.slice(start, index).trim();
      if (part) parts.push(part);
      if (character === "&") index += 1;
      start = index + 1;
    }
  }

  const finalPart = command.slice(start).trim();
  if (finalPart) parts.push(finalPart);
  return parts;
}

function splitOutsideQuotes(command: string, operator: "|" | "||"): string[] {
  const parts: string[] = [];
  let quote: "'" | "\"" | undefined;
  let escaped = false;
  let start = 0;

  for (let index = 0; index < command.length; index += 1) {
    const character = command[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\" && quote !== "'") {
      escaped = true;
      continue;
    }
    if (character === "'" || character === "\"") {
      quote = quote === character ? undefined : quote ?? character;
      continue;
    }
    if (quote || character !== "|") continue;
    const isDouble = command[index + 1] === "|";
    if ((operator === "||") !== isDouble) continue;
    const part = command.slice(start, index).trim();
    if (part) parts.push(part);
    if (isDouble) index += 1;
    start = index + 1;
  }

  const finalPart = command.slice(start).trim();
  if (finalPart) parts.push(finalPart);
  return parts;
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

function findRedirection(command: string): { operator: ">" | ">>"; target: string; command: string } | undefined {
  let quote: "'" | "\"" | undefined;
  let escaped = false;
  for (let index = 0; index < command.length; index += 1) {
    const character = command[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\" && quote !== "'") {
      escaped = true;
      continue;
    }
    if (character === "'" || character === "\"") {
      quote = quote === character ? undefined : quote ?? character;
      continue;
    }
    if (quote || character !== ">") continue;
    const operator = command[index + 1] === ">" ? ">>" : ">";
    const target = tokenize(command.slice(index + operator.length).trim())[0];
    const baseCommand = command.slice(0, index).trim();
    if (target && baseCommand) return { operator, target, command: baseCommand };
  }
  return undefined;
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

function combine(explanations: Explanation[], message: string): Explanation {
  return {
    message,
    confidence: minConfidence(explanations.map((item) => item.confidence)),
    risk: maxRisk(explanations.map((item) => item.risk)),
    tags: unique(explanations.flatMap((item) => item.tags ?? [])),
  };
}
