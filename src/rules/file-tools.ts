import type { Explanation, FileToolAction } from "../core/types.js";

export function explainFileTool(action: FileToolAction): Explanation {
  switch (action.kind) {
    case "file_write":
      return message(action.path ? `This will write or overwrite \`${action.path}\`.` : "This will write or overwrite a file.", "high", "high", ["file", "write"]);
    case "file_edit":
      return message(explainEditPath(action), "high", "medium", ["file", "edit"]);
    case "file_delete":
      return message(action.path ? `This will delete \`${action.path}\`.` : "This may delete one or more files.", "high", "high", ["file", "delete"]);
    case "file_read":
      return message(action.path ? `This will read \`${action.path}\`.` : "This will read a file.", "high", "low", ["file", "read"]);
    case "unknown_tool":
      return message(`This will run the \`${action.toolName}\` tool.`, "low", "medium", ["tool", "fallback"]);
  }
}

function explainEditPath(action: FileToolAction): string {
  if (action.paths && action.paths.length > 0) {
    if (action.paths.length === 1) return `This will edit \`${action.paths[0]}\`.`;
    return `This will edit ${action.paths.length} files: ${formatList(action.paths)}.`;
  }
  if (action.path) return `This will edit \`${action.path}\`.`;
  return "This may edit one or more files.";
}

function formatList(paths: string[]): string {
  const quoted = paths.map((path) => `\`${path}\``);
  if (quoted.length === 1) return quoted[0] ?? "";
  if (quoted.length === 2) return `${quoted[0]} and ${quoted[1]}`;
  return `${quoted.slice(0, -1).join(", ")}, and ${quoted.at(-1)}`;
}

function message(message: string, confidence: Explanation["confidence"], risk: Explanation["risk"], tags: string[]): Explanation {
  return { message, confidence, risk, tags };
}
