# Agent Instructions

You are building **Agentic CLI Change Preview**.

## Mission

Create a reusable hook/plugin system that lets agentic CLIs explain proposed tool calls and shell commands in normal English before they run.

Primary users are non-technical people. The wording should help them understand impact, not teach them shell syntax.

## Initial deliverables

1. A shared explanation engine.
2. A CLI entrypoint that reads hook JSON from stdin.
3. Adapters/examples for:
   - Claude Code CLI
   - Codex CLI
   - Hermes CLI
4. Tests for common command/file-operation explanations.
5. Clear install/config docs.

## Do not overbuild early

Start with deterministic rules before adding LLM summarization.

Good first version:

- Detect deletes, moves, copies, installs, git operations, package manager commands, file writes, file edits, test runs.
- Display one concise sentence.
- If unsure, fall back to: `This will run a terminal command: ...`

Avoid early complexity:

- No daemon required.
- No database required.
- No cloud service required.
- No user accounts required.
- No mandatory LLM required.

## Architecture preference

Use a core/adapters split:

- `core`: normalized action model and explanation rules
- `adapters`: convert Claude/Codex/Hermes hook payloads into the normalized model
- `cli`: stdin/stdout/stderr behavior and flags

## UX rules

- Keep output short.
- Use plain English.
- Mention paths/files when known.
- Mention irreversible or risky effects clearly.
- Do not claim certainty when parsing is approximate.
- Do not approve, deny, or mutate the tool call unless a future explicit safety mode is implemented.

## Testing expectations

Add tests for:

- shell command parsing
- file write/edit tool payloads
- Claude Code hook payloads
- Codex hook payloads
- Hermes hook payloads
- unknown commands
- malformed JSON

## Suggested commands after setup

These will depend on the chosen package manager, but a typical TypeScript setup should support:

```bash
npm install
npm run test
npm run lint
npm run build
```

## Documentation expectations

Keep these files current:

- `README.md`: what the project is and quickstart
- `docs/architecture.md`: how the system works
- `docs/cli-adapters.md`: host CLI integration details
- `docs/implementation-plan.md`: milestones and TODOs
- `docs/safety-and-ux.md`: language and risk guidance
