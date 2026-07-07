# CLI Adapters

This project supports multiple host CLIs by normalizing their hook payloads into one internal action model.

Human preview text should go to stderr by default. Stdout is reserved for host protocols that expect JSON.

## Claude Code

Claude Code command hooks such as `PreToolUse` receive JSON on stdin. Because stdout can be used by hook protocols for decisions, `notatechbro` prints the normal human sentence to stderr by default.

Example `.claude/settings.json` snippet:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Edit|MultiEdit|Write|Read",
        "hooks": [
          {
            "type": "command",
            "command": "notatechbro"
          }
        ]
      }
    ]
  }
}
```

Common payload shape supported by the MVP:

```json
{
  "tool_name": "Bash",
  "tool_input": { "command": "npm install" },
  "cwd": "/path/to/project"
}
```

Supported Claude tool names:

- `Bash` -> shell command
- `Write` -> file write/overwrite
- `Edit`, `MultiEdit` -> file edit
- `Read` -> file read, suppressible with `--quiet`

## Hermes CLI

Hermes shell hooks can call `notatechbro` from `pre_tool_call`. The MVP should remain observer-only: it explains but does not block.

Example config snippet:

```yaml
hooks:
  pre_tool_call:
    - command: "notatechbro"
      matcher: "terminal|bash|shell|write_file|read_file|patch"
```

Common payload shape supported by the MVP:

```json
{
  "hook_event_name": "pre_tool_call",
  "tool_name": "terminal",
  "tool_input": { "command": "git push" },
  "cwd": "/path/to/project"
}
```

Supported Hermes tool names:

- `terminal`, `bash`, `shell` -> shell command
- `write_file` -> file write/overwrite
- `patch`, `edit_file` -> file edit
- `read_file` -> file read, suppressible with `--quiet`

## Codex CLI

Codex CLI 0.134+ exposes Claude-style lifecycle hooks from `~/.codex/config.toml` when hooks are enabled. NotATechBro should run as an observer-only command hook: it writes the human preview to stderr and leaves stdout empty by default.

Candidate supported payloads:

```json
{
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": { "command": "pytest" },
  "cwd": "/path/to/project",
  "permission_mode": "default",
  "session_id": "...",
  "tool_use_id": "...",
  "transcript_path": null,
  "turn_id": "..."
}
```

```json
{
  "tool_name": "shell",
  "tool_input": { "command": "pytest" }
}
```

```json
{
  "tool_call": {
    "name": "shell",
    "input": { "command": "pytest" }
  }
}
```

Config pattern:

```toml
[features]
hooks = true

[[hooks.PreToolUse]]
matcher = "Bash"
hooks = [{ type = "command", command = "notatechbro", timeout = 5 }]
```

Do not use `notatechbro --json` for Codex yet. Codex has its own hook response schema for blocking or mutating tool calls; this project is currently explanation-only.

## Adapter implementation rules

1. Keep adapters tolerant: partial payloads should still produce a fallback preview.
2. Keep interpretation in shared rules, not host-specific adapters.
3. Do not send payload contents to external services.
4. Print human text to stderr by default.
5. Only use stdout in `--json` mode.
6. Do not claim approval or safety. `decision: "allow"` is protocol compatibility only.
