# CLI Adapters

This project supports multiple host CLIs by normalizing their hook payloads into one internal action model.

Human preview text should go to stderr by default. Stdout is reserved for host protocols that expect JSON.

## Claude Code

Claude Code command hooks such as `PreToolUse` receive JSON on stdin. Because stdout can be used by hook protocols for decisions, `change-preview` prints the normal human sentence to stderr by default.

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
            "command": "change-preview"
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

Hermes shell hooks can call `change-preview` from `pre_tool_call`. The MVP should remain observer-only: it explains but does not block.

Example config snippet:

```yaml
hooks:
  pre_tool_call:
    - command: "change-preview"
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

Codex hook support and config shape can vary by version, so the MVP uses permissive normalization for likely payloads. Treat the Codex config example as experimental until verified against the exact Codex version being targeted.

Candidate supported payloads:

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

Possible config pattern, to verify for the target Codex version:

```toml
[[hooks.pre_tool_call]]
command = "change-preview"
```

If the host requires JSON stdout:

```toml
[[hooks.pre_tool_call]]
command = "change-preview --json"
```

## Adapter implementation rules

1. Keep adapters tolerant: partial payloads should still produce a fallback preview.
2. Keep interpretation in shared rules, not host-specific adapters.
3. Do not send payload contents to external services.
4. Print human text to stderr by default.
5. Only use stdout in `--json` mode.
6. Do not claim approval or safety. `decision: "allow"` is protocol compatibility only.
