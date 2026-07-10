import type { Explanation, FileToolAction } from "../core/types.js";
import { inlineCode } from "../core/format.js";

export function explainFileTool(action: FileToolAction): Explanation {
  switch (action.kind) {
    case "file_write":
      return message(explainPaths(action, "write or overwrite", "a file"), action.path || action.paths?.length ? "high" : "medium", "high", ["file", "write"]);
    case "file_edit":
      return message(explainEditPath(action), action.path || action.paths?.length ? "high" : "low", "medium", ["file", "edit"]);
    case "file_delete":
      return message(explainPaths(action, "delete", "one or more files", true), action.path || action.paths?.length ? "high" : "low", "high", ["file", "delete"]);
    case "file_read":
      return message(explainPaths(action, "read", "a file"), action.path || action.paths?.length ? "high" : "medium", "low", ["file", "read"]);
    case "unknown_tool":
      return message(`This will run the ${inlineCode(action.toolName)} tool.`, "low", "medium", ["tool", "fallback"]);
  }
}

function explainEditPath(action: FileToolAction): string {
  if (action.paths && action.paths.length > 0) {
    if (action.paths.length === 1) return `This will edit ${inlineCode(action.paths[0] ?? "")}.`;
    return `This will edit ${action.paths.length} files: ${formatList(action.paths)}.`;
  }
  if (action.path) return `This will edit ${inlineCode(action.path)}.`;
  return "This may edit one or more files.";
}

function formatList(paths: string[]): string {
  const quoted = paths.map(inlineCode);
  if (quoted.length === 1) return quoted[0] ?? "";
  if (quoted.length === 2) return `${quoted[0]} and ${quoted[1]}`;
  return `${quoted.slice(0, -1).join(", ")}, and ${quoted.at(-1)}`;
}

function explainPaths(action: FileToolAction, verb: string, fallback: string, uncertain = false): string {
  const paths = action.paths?.length ? action.paths : action.path ? [action.path] : [];
  if (paths.length === 1) return `This will ${verb} ${inlineCode(paths[0] ?? "")}.`;
  if (paths.length > 1) return `This will ${verb} ${paths.length} files: ${formatList(paths)}.`;
  return `This ${uncertain ? "may" : "will"} ${verb} ${fallback}.`;
}

function message(message: string, confidence: Explanation["confidence"], risk: Explanation["risk"], tags: string[]): Explanation {
  return { message, confidence, risk, tags };
}
