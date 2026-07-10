import { z } from "zod";
import type { ActionSource, NormalizedAction } from "./types.js";

const HookPayloadSchema = z
  .object({
    hook_event_name: z.string().optional(),
    agent_type: z.string().optional(),
    permission_mode: z.string().optional(),
    turn_id: z.string().optional(),
    tool_name: z.string().optional(),
    tool_input: z.unknown().optional(),
    cwd: z.string().optional(),
    tool_call: z
      .object({
        name: z.string().optional(),
        input: z.unknown().optional(),
        arguments: z.unknown().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export function normalizePayload(payload: unknown): NormalizedAction {
  const parsed = HookPayloadSchema.safeParse(payload);
  if (!parsed.success) return unknownTool("unknown", "generic", payload);

  const data = parsed.data;
  const toolName = data.tool_call?.name ?? data.tool_name ?? "unknown";
  const input = parseSerializedInput(data.tool_call?.input ?? data.tool_call?.arguments ?? data.tool_input);
  const source = detectSource(data, toolName, data.tool_call !== undefined);
  const cwd = data.cwd;
  const command = getString(input, ["command", "cmd", "script"]);

  if (isShellTool(toolName) && command) {
    return withOptional({ kind: "shell", command, source, toolName, input }, { cwd });
  }

  const path = getString(input, ["path", "file_path", "filepath", "target_file", "targetPath"]);
  const explicitPaths = getStringArray(input, ["paths", "file_paths", "files"]);
  const paths = explicitPaths.length > 0 ? explicitPaths : getPatchPaths(input);
  const maybePath = path ?? paths[0];
  const lowerTool = toolName.toLowerCase();

  if (isWriteTool(lowerTool)) return withOptional({ kind: "file_write", toolName, source, input }, { path: maybePath, paths, cwd });
  if (isEditTool(lowerTool)) return withOptional({ kind: "file_edit", toolName, source, input }, { path: maybePath, paths, cwd });
  if (isDeleteTool(lowerTool)) return withOptional({ kind: "file_delete", toolName, source, input }, { path: maybePath, paths, cwd });
  if (isReadTool(lowerTool)) return withOptional({ kind: "file_read", toolName, source, input }, { path: maybePath, paths, cwd });

  return withOptional(unknownTool(toolName, source, input), { cwd });
}

function detectSource(data: z.infer<typeof HookPayloadSchema>, toolName: string, hasToolCall: boolean): ActionSource {
  const hookEventName = data.hook_event_name;
  if (hookEventName?.startsWith("pre_tool_call") || hookEventName === "pre_tool_call") return "hermes";
  if (
    hookEventName === "PreToolUse" &&
    (data.agent_type?.toLowerCase().includes("codex") || data.turn_id !== undefined || data.permission_mode !== undefined)
  ) {
    return "codex";
  }
  if (["Bash", "Write", "Edit", "MultiEdit", "Read"].includes(toolName)) return "claude";
  if (hasToolCall || ["shell", "shell_command", "exec_command", "apply_patch"].includes(toolName.toLowerCase())) return "codex";
  if (["terminal", "bash", "write_file", "read_file", "patch"].includes(toolName)) return "hermes";
  return "generic";
}

function isShellTool(toolName: string): boolean {
  return ["bash", "terminal", "shell", "exec_command", "shell_command"].includes(toolName.toLowerCase());
}

function isWriteTool(lowerTool: string): boolean {
  return ["write", "write_file", "create_file"].includes(lowerTool);
}

function isEditTool(lowerTool: string): boolean {
  return ["edit", "multiedit", "edit_file", "patch", "apply_patch", "str_replace", "replace"].includes(lowerTool);
}

function isDeleteTool(lowerTool: string): boolean {
  return ["delete", "delete_file", "remove_file"].includes(lowerTool);
}

function isReadTool(lowerTool: string): boolean {
  return ["read", "read_file", "view", "open_file"].includes(lowerTool);
}

function getString(input: unknown, keys: string[]): string | undefined {
  if (!isRecord(input)) return undefined;
  for (const key of keys) {
    const value = input[key];
    if (typeof value === "string" && value.length > 0) return value;
    if (Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string")) {
      return value.join(" ");
    }
  }
  return undefined;
}

function parseSerializedInput(input: unknown): unknown {
  if (typeof input !== "string") return input;
  try {
    return JSON.parse(input) as unknown;
  } catch {
    return input;
  }
}

function getStringArray(input: unknown, keys: string[]): string[] {
  if (!isRecord(input)) return [];
  for (const key of keys) {
    const value = input[key];
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  }

  const edits = input["edits"];
  if (Array.isArray(edits)) {
    return edits
      .map((edit) => (isRecord(edit) && typeof edit["file_path"] === "string" ? edit["file_path"] : undefined))
      .filter((item): item is string => typeof item === "string");
  }

  return [];
}

function getPatchPaths(input: unknown): string[] {
  const patch =
    typeof input === "string"
      ? input
      : isRecord(input)
        ? getString(input, ["patch", "diff", "content"])
        : undefined;
  if (!patch) return [];

  const paths = [...patch.matchAll(/^\*\*\* (?:Add|Update|Delete) File:\s*(.+)$/gm), ...patch.matchAll(/^\+\+\+ b\/(.+)$/gm)]
    .map((match) => match[1]?.trim())
    .filter((path): path is string => Boolean(path) && path !== "/dev/null");
  return [...new Set(paths)];
}

function unknownTool(toolName: string, source: ActionSource, input: unknown): NormalizedAction {
  return { kind: "unknown_tool", toolName, source, input };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function withOptional<T extends object>(
  base: T,
  optional: { path?: string | undefined; paths?: string[] | undefined; cwd?: string | undefined },
): T {
  const result = { ...base } as Record<string, unknown>;
  if (optional.path) result["path"] = optional.path;
  if (optional.paths && optional.paths.length > 0) result["paths"] = optional.paths;
  if (optional.cwd) result["cwd"] = optional.cwd;
  return result as T;
}
