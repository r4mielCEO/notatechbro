# Connect Your Agent

Install NotATechBro first:

```bash
npm install --global notatechbro
notatechbro --check
```

Then choose Claude Code or Codex below. Start a new agent session after changing the configuration.

## Claude Code CLI

Create `.claude/settings.json` in your project and add:

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

If the file already contains settings, keep them and add the `hooks` section alongside them.

Start a new Claude Code session and ask it to run `npm test`. The expected preview is:

```text
This will run this project's tests.
```

## Codex CLI

Open `~/.codex/config.toml` and add:

```toml
[features]
hooks = true

[[hooks.PreToolUse]]
matcher = "Bash"
hooks = [{ type = "command", command = "notatechbro", timeout = 5 }]
```

If `[features]` already exists, add `hooks = true` to that section instead of creating a second one. Start a new Codex session and review the hook-trust prompt if one appears.

Ask Codex to run `npm test`. The expected preview is the same one-sentence explanation shown above.

## Troubleshooting

- If `notatechbro` is not found, run `notatechbro --check` and reinstall the package if needed.
- If no preview appears, start a new agent session and confirm the configuration is in the correct file.
- For Codex, confirm hooks are enabled and the hook has been trusted.
- Do not use `notatechbro --json` as a Codex hook response. The project is explanation-only.

## Advanced: Hermes CLI

Hermes can call NotATechBro from a `pre_tool_call` hook:

```yaml
hooks:
  pre_tool_call:
    - command: "notatechbro"
      matcher: "terminal|bash|shell|write_file|read_file|patch"
```

Configuration placement can differ by Hermes version. Verify it against the installed Hermes documentation before treating the integration as complete.

## Advanced: Supported Payloads

NotATechBro normalizes host-specific hook payloads into one internal action model. Human preview text goes to stderr by default; stdout is used only in explicit JSON mode.

### Claude Code payload

```json
{
  "tool_name": "Bash",
  "tool_input": { "command": "npm install" },
  "cwd": "/path/to/project"
}
```

Supported Claude tool names include `Bash`, `Write`, `Edit`, `MultiEdit`, and `Read`.

### Codex payloads

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

The tolerant Codex adapter also accepts `shell`, `shell_command`, and `exec_command`, including object or serialized-JSON arguments:

```json
{
  "tool_call": {
    "name": "exec_command",
    "arguments": "{\"cmd\":\"pytest\"}"
  }
}
```

### Hermes payload

```json
{
  "hook_event_name": "pre_tool_call",
  "tool_name": "terminal",
  "tool_input": { "command": "git push" },
  "cwd": "/path/to/project"
}
```

## Adapter Rules

1. Partial or unfamiliar payloads should still produce an honest fallback.
2. Interpretation belongs in shared rules, not host-specific adapters.
3. Payload contents must not be sent to external services.
4. Human text goes to stderr by default.
5. JSON mode contains explanation metadata, not an approval decision.
