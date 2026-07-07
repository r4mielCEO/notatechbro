# Security Policy

## Supported versions

NotATechBro is early-stage. Security fixes are made on the `main` branch.

## Reporting a vulnerability

Please do not open a public issue for a vulnerability that could put users at risk.

Use GitHub's private vulnerability reporting if it is available on this repository, or contact the maintainer privately through GitHub.

Helpful reports include:

- what command or payload triggers the issue
- what you expected to happen
- what actually happened
- whether private data, command contents, or file paths were exposed
- your OS, Node.js version, and NotATechBro commit/version

## Scope

NotATechBro is an explanation layer, not a sandbox or security boundary.

It currently does not:

- block commands
- approve commands
- deny commands
- mutate tool calls
- guarantee that a command is safe

Security-sensitive issues still matter, especially if they involve:

- leaking command contents or paths to a network service
- executing commands unexpectedly
- corrupting hook protocol output
- misleading users about destructive actions

## Privacy expectation

The runtime should remain local-first. It should not send commands, paths, file contents, or hook payloads to a server unless a future feature makes that behavior explicit and opt-in.
