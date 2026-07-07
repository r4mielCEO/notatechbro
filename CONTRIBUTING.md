# Contributing to NotATechBro

Thank you for wanting to make this better.

NotATechBro is intentionally small: it turns agent CLI hook payloads into plain-English previews before commands run. The best contributions make that approval moment clearer, calmer, and more useful for real people.

## Ways to contribute

You can help by:

- Adding new command explanation rules.
- Improving existing explanations so they are shorter or clearer.
- Adding adapters for more agent CLIs.
- Testing real hook payloads from Claude Code, Hermes, Codex, or other tools.
- Improving docs, examples, setup guides, and screenshots.
- Creating your own branch/fork with a different UX direction.
- Reporting confusing wording or commands that NotATechBro explains poorly.

Forks, experiments, and opinionated branches are welcome. If you have a better version, please build it.

## Project principles

Keep contributions aligned with the project mission:

- Plain English over shell jargon.
- Short output over long explanations.
- Local-first behavior.
- No runtime telemetry.
- No required LLM.
- Deterministic rules before complicated summarization.
- Honest wording: say “may” when parsing is approximate.
- Observer-only by default: do not approve, deny, block, or mutate tool calls unless an explicit future safety mode is designed.

## Development setup

```bash
npm install
npm run build
npm link
```

Try the main command:

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf dist"}}' | notatechbro
```

The old alias still works:

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf dist"}}' | change-preview
```

## Before opening a pull request

Run:

```bash
npm run test
npm run typecheck
npm run build
```

If you change docs or the landing page, also open the page locally and check the relevant section in a browser:

```bash
python3 -m http.server 4177
```

Then visit:

```text
http://127.0.0.1:4177/docs/landing.html
```

## Adding explanation rules

Good rule changes usually include:

1. A focused rule implementation.
2. Tests for common and risky examples.
3. Wording that a non-technical person can understand.
4. Fallback language when parsing is approximate.

Avoid adding broad rewrites that make many unrelated command explanations change at once.

## Adding adapter support

For a new agent CLI adapter, please include:

1. The real hook payload shape.
2. A small example config file when possible.
3. Tests in `tests/adapters.test.ts` or a new focused test file.
4. Docs explaining what is verified and what is still unknown.

If you cannot fully verify a host CLI, say so clearly in the docs instead of overstating support.

## Pull request style

Small PRs are easier to review. Good PRs usually do one thing:

- one new rule family
- one adapter improvement
- one docs improvement
- one UI polish pass

Please include:

- what changed
- why it helps users
- commands you ran
- any caveats or unverified behavior

## Code of conduct

Be kind, specific, and useful. This project is partly for people who do not consider themselves technical. Assume good intent, explain tradeoffs clearly, and do not shame people for not knowing shell commands.
