export type ActionSource = "claude" | "codex" | "hermes" | "generic";

export type ActionRisk = "low" | "medium" | "high";
export type ExplanationConfidence = "high" | "medium" | "low";

export type ShellAction = {
  kind: "shell";
  command: string;
  cwd?: string;
  source: ActionSource;
  toolName?: string;
  input?: unknown;
};

export type FileToolAction = {
  kind: "file_write" | "file_edit" | "file_delete" | "file_read" | "unknown_tool";
  toolName: string;
  path?: string;
  paths?: string[];
  cwd?: string;
  source: ActionSource;
  input?: unknown;
};

export type NormalizedAction = ShellAction | FileToolAction;

export type Explanation = {
  message: string;
  confidence: ExplanationConfidence;
  risk: ActionRisk;
  tags?: string[];
};

export type ExplainOptions = {
  quiet?: boolean;
};
