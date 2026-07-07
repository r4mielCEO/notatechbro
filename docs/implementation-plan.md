# Implementation Plan

## Phase 0 — Confirm scope

Decide the first package shape:

- Recommended: npm package named `notatechbro` with bin `notatechbro` and backwards-compatible alias `change-preview`.
- Keep the core library separate from CLI glue internally.

Definition of done:

- `notatechbro` can be run locally and accepts JSON on stdin.

## Phase 1 — Project setup

Suggested setup:

```bash
npm init -y
npm install zod
npm install -D typescript tsx vitest @types/node
```

Add scripts:

```json
{
  "scripts": {
    "dev": "tsx src/cli.ts",
    "test": "vitest run",
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit"
  },
  "bin": {
    "notatechbro": "dist/src/cli.js",
    "change-preview": "dist/src/cli.js"
  }
}
```

## Phase 2 — Core action model

Create:

```text
src/core/types.ts
src/core/normalize.ts
src/core/explain.ts
```

Implement:

- normalized action types
- explanation result type
- `explainAction(action)`

## Phase 3 — Shell command rules

Create:

```text
src/rules/shell.ts
```

Handle at least:

- `rm`, `trash` → delete
- `mv` → move/rename
- `cp` → copy
- `mkdir` → create folder
- `touch` → create/update file timestamp
- `npm install`, `pnpm install`, `yarn install` → install JS dependencies
- `pip install` → install Python packages
- `git push`, `git pull`, `git reset`, `git clean`, `git commit`, `git checkout` → git actions
- `pytest`, `vitest`, `jest`, `npm test` → tests
- `apply_patch`, `patch` → file changes via patch
- shell redirection `>` / `>>` → write/append output to file

## Phase 4 — File tool rules

Create:

```text
src/rules/file-tools.ts
```

Handle common tool names:

- Claude: `Write`, `Edit`, `MultiEdit`, `Bash`
- Hermes: `write_file`, `edit_file`, `terminal`, `bash`
- Codex: `shell`, `apply_patch`, possible file edit tools

## Phase 5 — Adapters

Create:

```text
src/adapters/generic.ts
src/adapters/claude.ts
src/adapters/codex.ts
src/adapters/hermes.ts
```

Keep each adapter small. Prefer tolerant parsing with Zod schemas.

## Phase 6 — CLI entrypoint

Create:

```text
src/cli.ts
```

Features:

- read stdin
- parse JSON safely
- detect/normalize payload
- explain action
- print preview
- support `--json`
- support `--quiet` for no output on read-only actions
- exit `0` unless the program itself fails

## Phase 7 — Tests

Add fixtures:

```text
tests/fixtures/claude-bash.json
tests/fixtures/hermes-terminal.json
tests/fixtures/codex-tool-call.json
```

Test:

- parsing
- explanation text
- malformed JSON fallback
- unknown command fallback
- no output for read-only tools if that behavior is desired

## Phase 8 — Docs and examples

Fill out:

- `examples/claude-code-settings.json`
- `examples/codex-config.toml`
- `examples/hermes-config.yaml`
- README quickstart

## Phase 9 — Optional advanced features

Only after MVP works:

- risk labels
- configurable verbosity
- custom user rules
- optional LLM summarization
- localization
- terminal UI formatting
- plugin package for Hermes
- npm publishing / Homebrew formula

## Non-goals for MVP

- Blocking dangerous commands
- Full shell interpretation
- Security sandboxing
- Cloud service
- Account system
