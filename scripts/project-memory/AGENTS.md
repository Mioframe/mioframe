# scripts/project-memory

Inherits the rules from `/AGENTS.md`. Applies to `scripts/project-memory` and its descendants.

## Contains

- Automation tooling for project-memory lookup, task entry/exit, diff-aware review, and lifecycle validation.
- The repo-local Codex hook driver that adds project-memory context and stop-time review through documented hook events.

## Patterns

- Keep task-loop behavior centralized here: `memory:task:start` performs lookup and writes the task state, `memory:task:review` inspects the diff, and `memory:task:finish` runs review plus validation.
- Keep Codex hook behavior centralized here as well: repo-local hooks should call these scripts or their exported helpers instead of copying lifecycle logic into `.codex/hooks.json`.
- Treat `.project-memory/.task-state/current-task.json` as active-only task state. It exists only while discovery is active; completion snapshots belong in separate finish metadata and must not satisfy a future task start.
- Keep diff-aware review deterministic from committed or working-tree state. Hard failures should be reproducible from the diff itself and should happen in `memory:task:finish`; hooks and pre-commit are earlier guidance and repo-local rechecks.
- When adding lifecycle heuristics, bias toward requiring one explicit learning decision at task finish rather than surprising the agent at commit or push time.
- Treat `SessionStart`, `UserPromptSubmit`, and `Stop` as additive hooks that may soft-fallback on internal errors, but treat `PreToolUse` as a guard hook that must not exit `0` when its own logic breaks.

## Constraints

- Update `.project-memory/WORKFLOW.md`, `.project-memory/README.md`, and the root `AGENTS.md` together when changing task-loop commands or lifecycle expectations.
- Run `pnpm memory:validate` and the relevant `memory:task:*` or Codex hook smoke checks after editing this directory.
