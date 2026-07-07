import { explainFileTool } from "../rules/file-tools.js";
import { explainShellCommand } from "../rules/shell.js";
import type { ExplainOptions, Explanation, NormalizedAction } from "./types.js";

export function explainAction(action: NormalizedAction, options: ExplainOptions = {}): Explanation {
  if (action.kind === "shell") return explainShellCommand(action.command);

  const explanation = explainFileTool(action);
  if (options.quiet && action.kind === "file_read") {
    return { ...explanation, message: "" };
  }
  return explanation;
}
