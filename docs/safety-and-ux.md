# Safety and UX Guidance

NotATechBro explains the likely impact of a command. It does not run, approve, block, or change the command. The user's coding agent keeps its normal approval controls.

## Main UX goal

Help people understand what the agent is about to do.

Bad:

> Running `rm -rf dist`.

Better:

> This will delete the `dist` folder.

Best when context is available:

> This will delete the generated `dist` build folder. It can usually be recreated by building the project again.

## Language rules

Use:

- “This will…”
- “This may…” when uncertain
- “folder” instead of “directory”
- “delete” instead of “remove recursively”
- “install packages” instead of “resolve dependencies”

Avoid:

- jargon
- scary wording for normal actions
- false reassurance
- long paragraphs

## Risk wording

High-risk examples:

- deleting files
- overwriting files
- `git reset --hard`
- `git clean -fd`
- writing outside the project folder
- changing permissions
- installing global packages
- running downloaded scripts

Example wording:

> This may permanently delete untracked files from the project.

Do not say:

> This is safe.

Instead say:

> This is a common cleanup command, but it can delete files that are not tracked by git.

## Output length

Default preview should be one sentence.

Verbose mode can include:

- affected files/folders
- command category
- risk note
- confidence

## Output channels

Prefer stderr for human preview so stdout can remain available for hook protocol JSON.

Modes:

- default: human preview to stderr
- `--json`: structured response to stdout
- `--quiet`: suppress low-value messages

## Privacy

The current release explains commands locally. It does not send command contents, file contents, or paths to an external LLM.

If optional LLM mode is added:

- make it opt-in
- redact secrets
- document what leaves the machine
- allow local-only mode

## Accessibility

Plain text first. Colors should be optional.

Avoid relying only on color to communicate risk.

## Examples

```text
rm -rf dist
→ This will delete the `dist` folder.
```

```text
npm install
→ This will install or update this project's JavaScript packages.
```

```text
git push
→ This will upload your local commits to the remote repository.
```

```text
python script.py > report.txt
→ This will run a Python script and write its output to `report.txt`.
```
