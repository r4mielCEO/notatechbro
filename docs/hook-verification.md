# Hook verification

Current local CLI versions checked on 2026-07-07:

- Claude Code: `2.1.159`
- Codex CLI: `0.134.0`
- Hermes Agent: `0.18.0`

## What is verified in this checkpoint

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

### Hermes-style payload

Input:

```json
{"hook_event_name":"pre_tool_call","tool_name":"terminal","tool_input":{"command":"git clean -fd"},"cwd":"/repo"}
```

Output on stderr:

```text
This may permanently delete untracked files from the project.
```

### Codex-style candidate payload

Input:

```json
{"tool_call":{"name":"shell","input":{"command":"pytest"}}}
```

Output on stderr:

```text
This will run Python tests.
```

## What still needs real host verification

These smoke tests verify the NotATechBro parser and CLI behavior against representative payloads. They do not prove every live host hook contract is stable.

Before calling an integration fully verified, test inside the target host CLI with its actual hook config and a safe command such as `pwd` or `npm test`.

Known status:

- Claude Code: CLI installed locally; representative `PreToolUse` payload shape passes.
- Hermes: CLI installed locally; representative `pre_tool_call` payload shape passes.
- Codex: CLI installed locally; candidate `tool_call.name = shell` payload passes, but Codex hook config/contract should still be checked against the exact target version before claiming full support.
