# Hook verification

Current local CLI versions checked on 2026-07-07:

- Claude Code: `2.1.159`
- Codex CLI: `0.134.0`
- Hermes Agent: `0.18.0`

## Command verification

The package now exposes two bin names that point at the same local CLI entrypoint:

- Primary: `notatechbro`
- Backwards-compatible alias: `change-preview`

Verified after `npm run build` and `npm link` with the npm global bin directory on `PATH`:

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf dist"}}' | notatechbro
# This will delete the `dist` folder.

echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf dist"}}' | change-preview
# This will delete the `dist` folder.

echo '{"tool_name":"Bash","tool_input":{"command":"git push"}}' | notatechbro --json
# {"decision":"allow","preview":"This will upload your local commits to the remote repository.","confidence":"high","risk":"medium"}
```

## Adapter payload smoke tests

The shared adapter normalizer and CLI executable were smoke-tested with representative payloads for each host family.

### Claude Code-style payload

Input:

```json
{"tool_name":"Bash","tool_input":{"command":"rm -rf dist"},"cwd":"/repo"}
```

Output on stderr:

```text
This will delete the `dist` folder.
```

Claude Code local evidence:

- `claude --version` returns `2.1.159 (Claude Code)`.
- `claude --help` includes hook-related flags such as `--include-hook-events`, `--debug ... hooks`, `--settings`, and settings-source controls.
- The documented `.claude/settings.json` `PreToolUse` command hook shape remains the integration target.

### Hermes-style payload

Input:

```json
{"hook_event_name":"pre_tool_call","tool_name":"terminal","tool_input":{"command":"git clean -fd"},"cwd":"/repo"}
```

Output on stderr:

```text
This may permanently delete untracked files from the project.
```

Hermes local evidence:

- `hermes --version` returns `Hermes Agent v0.18.0`.
- `hermes hooks --help` confirms hook management commands: `list`, `test`, `doctor`, and allowlist management.
- Hermes can test configured hooks against synthetic payloads, which is the next step once a project hook is installed in the user's Hermes config.

### Codex PreToolUse payload

Input:

```json
{"cwd":"/repo","hook_event_name":"PreToolUse","model":"gpt-5.5","permission_mode":"default","session_id":"session","tool_input":{"command":"npm test"},"tool_name":"Bash","tool_use_id":"tool-use","transcript_path":null,"turn_id":"turn"}
```

Output on stderr:

```text
This will run this project's test suite.
```

Codex local evidence:

- `codex --version` returns `codex-cli 0.134.0`.
- `codex --help` includes hook-related trust controls such as `--dangerously-bypass-hook-trust` and config overrides.
- `codex doctor` passes overall (`0 fail`) for the local installation.
- OpenAI Codex source defines hook events under `hooks.PreToolUse` in TOML and the PreToolUse command input schema requires `cwd`, `hook_event_name: "PreToolUse"`, `model`, `permission_mode`, `session_id`, `tool_input`, `tool_name`, `tool_use_id`, `transcript_path`, and `turn_id`.
- A strict-config probe accepted this config shape for the installed Codex CLI:

```toml
[features]
hooks = true

[[hooks.PreToolUse]]
matcher = "Bash"
hooks = [{ type = "command", command = "notatechbro", timeout = 5 }]
```

## Current status

- Claude Code: installed locally; representative `PreToolUse` payload passes; docs now use `notatechbro`.
- Hermes: installed locally; representative `pre_tool_call` payload passes; `hermes hooks` subcommands are available for a configured-hook test.
- Codex: installed locally and healthy; exact `PreToolUse` payload/config shape for Codex CLI 0.134+ is documented and covered by adapter tests. A full interactive Codex run with hook trust accepted is still the final end-to-end check.

## Next verification step

Install the project hook config in each host CLI and run a safe command such as `pwd` or `npm test`. Record the actual payload emitted by the host and add it to the adapter tests before calling that host fully verified.
