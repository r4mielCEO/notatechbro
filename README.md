<p align="center">
  <img src="docs/assets/notatechbro-icon.png" alt="NotATechBro icon" width="112" />
</p>

<h1 align="center">NotATechBro</h1>

<p align="center">
  Plain-English previews for agentic CLI commands before they run.
</p>

<p align="center">
  <a href="docs/quickstart.html">Quickstart</a>
  · <a href="docs/cli-adapters.html">Adapters</a>
  · <a href="docs/safety-and-ux.html">Safety wording</a>
  · <a href="docs/architecture.html">Architecture</a>
</p>

<p align="center">
  <img src="docs/assets/notatechbro-landing-preview.png" alt="NotATechBro landing page preview" width="900" />
</p>

NotATechBro is a small local CLI that explains agentic CLI tool calls before they run. It is built for people who are new to agentic coding and do not want to approve commands they cannot read.

Instead of showing only this:

```bash
rm -rf dist
```

it prints this:

```text
This will delete the `dist` folder.
```

The executable is still named `change-preview` so hook config stays short.

## Why it exists

Agentic coding tools often ask for permission with a raw command. That is fine for developers. It is not fine for everyone else.

NotATechBro adds a local explanation layer between the agent's request and the user's approval moment. It explains the likely impact in one sentence, then gets out of the way.

## What it does not do

- It does not block commands.
- It does not approve commands.
- It does not send commands, paths, or file contents to a server.
- It does not require an LLM at runtime.
- It does not claim that a command is safe.

## Supported MVP integrations

The CLI reads hook JSON on stdin and normalizes common payloads from:

- Claude Code `PreToolUse` command hooks
- Hermes `pre_tool_call` shell hooks
- Codex-style `shell` / `tool_call` payloads, currently treated permissively because Codex hook contracts vary by version
- generic tool payloads with `tool_name` and `tool_input`

Human preview text goes to stderr by default so stdout stays available for hook protocols.

## Install locally from this checkout

```bash
npm install
npm run build
npm link
```

Then test the executable:

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf dist"}}' | change-preview
```

Expected stderr:

```text
This will delete the `dist` folder.
```

If you do not want to link it globally, run from the checkout:

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"npm install"}}' | npm run dev
```

## JSON mode

Some hook systems expect structured stdout. Use `--json`:

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"git push"}}' | change-preview --json
```

Output:

```json
{"decision":"allow","preview":"This will upload your local commits to the remote repository.","confidence":"high","risk":"medium"}
```

`decision: "allow"` is only protocol compatibility. This MVP does not approve, deny, block, or mutate tool calls.

## Quiet mode

Suppress low-value read-only previews:

```bash
echo '{"tool_name":"read_file","tool_input":{"path":"README.md"}}' | change-preview --quiet
```

## Examples

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf build && npm install"}}' | change-preview
# This will delete the `build` folder, then install or update this project's JavaScript packages.

echo '{"hook_event_name":"pre_tool_call","tool_name":"terminal","tool_input":{"command":"git clean -fd"}}' | change-preview
# This may permanently delete untracked files from the project.

echo '{"tool_name":"Write","tool_input":{"file_path":"src/app.ts"}}' | change-preview
# This will write or overwrite `src/app.ts`.
```

## Website and docs

The static landing page lives at `docs/landing.html`.

The polished HTML docs are meant for normal users:

- `docs/quickstart.html`
- `docs/cli-adapters.html`
- `docs/safety-and-ux.html`
- `docs/architecture.html`

The Markdown files remain the source docs for GitHub:

- `README.md`
- `docs/cli-adapters.md`
- `docs/safety-and-ux.md`
- `docs/architecture.md`
- `docs/hook-verification.md`

## Hook verification status

This checkpoint includes adapter smoke tests against representative Claude Code, Hermes, and Codex-style payloads. See `docs/hook-verification.md` for the exact inputs, outputs, and remaining caveats.

Codex remains marked as candidate support until the hook contract is verified inside the exact Codex CLI version being targeted.

## Development

```bash
npm install
npm run test
npm run typecheck
npm run build
```

Project shape:

```text
src/
  adapters/         # Claude/Codex/Hermes/generic adapter entrypoints
  core/             # normalized action model, normalization, explanation entrypoint
  rules/            # shell and file-operation explanation rules
  cli.ts            # stdin/stdout/stderr executable
docs/
  landing.html      # static landing page
  *.html            # polished user-facing docs pages
  *.md              # GitHub/source docs
  assets/           # icon and website preview assets
examples/
  claude-code-settings.json
  hermes-config.yaml
  codex-config.toml
```

## Current verification

This checkpoint passes:

```bash
npm run test
npm run typecheck
npm run build
```

## Product direction

The core local preview tool should remain free/open-source. Paid features, if they ever exist, belong in team/governance layers: policy packs, audit logs, managed config, enterprise integrations, or optional private LLM summaries.
