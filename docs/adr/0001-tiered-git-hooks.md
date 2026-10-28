# Tiered git hooks: fast checks on commit, E2E on push

## Status

Accepted

## Context

Agents and humans both commit to this repo, and the Web Store release needs a clean build. The full E2E suite takes about 4 minutes and launches a real browser with the extension loaded, so running everything on every commit would push people toward `--no-verify`, which defeats the gate.

## Decision

- **pre-commit** runs only fast checks: lint-staged (ESLint and Prettier on staged files) and the Jest suite, plus `release:check` when the content of `manifest.json` changes.
- **pre-push** runs the headless Playwright suite, and only when runtime files changed in the pushed range.
- CI repeats the same checks and is the final authority.
- A Claude Code `PreToolUse` hook rejects `--no-verify`, `HUSKY=0` and `core.hooksPath` changes, since a git hook alone cannot stop an agent from skipping it.

## Consequences

- Commits stay under about 30 seconds, so the hooks are not worth bypassing.
- A commit can reach the local branch with a broken E2E test; it is caught at push, not commit.
- Docs-only or test-only pushes skip E2E unless they touch `test/e2e/`.
- Hook logic lives in `scripts/` and `.husky/`, and has to be kept in step with `package.json` scripts and the CI workflow.
