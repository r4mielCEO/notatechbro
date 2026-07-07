# Architecture

## High-level flow

```text
Agent CLI hook payload
        ↓
Adapter-compatible normalizer
        ↓
NormalizedAction
        ↓
Deterministic rule engine
        ↓
One plain-English preview sentence
```

## Design goals

- Local-first and private by default.
- Helpful for non-technical users.
- Short, honest wording.
- Deterministic rules before any optional LLM mode.
- No command approval, blocking, or mutation in the MVP.
- Compatible with Claude Code, Codex-style payloads, Hermes, and generic tool payloads.

## Core model

The project converts host-specific payloads into `NormalizedAction`:

```ts
type NormalizedAction =
  | {
      kind: "shell";
      command: string;
      cwd?: string;
      source: "claude" | "codex" | "hermes" | "generic";
    }
  | {
      kind: "file_write" | "file_edit" | "file_delete" | "file_read" | "unknown_tool";
      toolName: string;
      path?: string;
      paths?: string[];
      cwd?: string;
      source: "claude" | "codex" | "hermes" | "generic";
    };
```

The explanation engine returns:

```ts
type Explanation = {
  message: string;
  confidence: "high" | "medium" | "low";
  risk: "low" | "medium" | "high";
  tags?: string[];
};
```

The default CLI only prints `message`. Confidence/risk are exposed in `--json` mode for hosts or future integrations that need structured metadata.

## Source layout

```text
src/
  cli.ts                  # executable stdin/stdout/stderr behavior
  index.ts                # library exports
  core/
    types.ts              # NormalizedAction and Explanation types
    normalize.ts          # permissive adapter-compatible normalization
    explain.ts            # shared explanation entrypoint
  rules/
    shell.ts              # deterministic shell command explanations
    file-tools.ts         # deterministic file tool explanations
  adapters/
    claude.ts             # Claude adapter entrypoint
    codex.ts              # Codex adapter entrypoint
    hermes.ts             # Hermes adapter entrypoint
    generic.ts            # generic adapter entrypoint
```

## Rule engine

The MVP supports deterministic rules for:

- deletes: `rm`, `trash`
- moves/renames: `mv`
- copies: `cp`
- folders/files: `mkdir`, `touch`
- JavaScript installs/tests: `npm`, `pnpm`, `yarn`, `vitest`, `jest`
- Python installs/tests: `pip`, `pytest`
- git operations: `push`, `pull`, `reset`, `clean`, `commit`, `checkout`, `switch`
- patches: `patch`, `apply_patch`
- shell output redirection: `>` and `>>`
- direct file tools: write, edit, delete, read
- unknown command/tool fallback

The parser is intentionally shallow. It does not attempt full shell interpretation of variables, aliases, command substitution, or scripts. If parsing is approximate, wording should use “may” or fall back honestly.

## CLI behavior

Default mode:

- Read JSON from stdin.
- Print the human preview to stderr.
- Exit 0 for hook compatibility.
- Do not block or approve the tool call.

JSON mode:

```json
{
  "decision": "allow",
  "preview": "This will delete the `dist` folder.",
  "confidence": "high",
  "risk": "high"
}
```

`decision: "allow"` exists only for host protocol compatibility. The MVP does not make a safety decision.

Quiet mode:

- Suppresses read-only previews such as file reads.
- Still emits previews for writes, edits, deletes, shell commands, and unknown tools.

## Security/privacy posture

- No network calls.
- No LLM calls.
- No telemetry.
- No shell execution.
- No file reads based on hook payload paths.
- Payloads are parsed only to classify action type and path/command strings.

## Future optional LLM mode

Only consider after deterministic rules are useful and well-tested.

Constraints for any future LLM mode:

- off by default
- explicit user opt-in
- clear privacy warning
- secret/path redaction
- local-only option where possible
- never required for basic previews
