# scripts/project-memory

Inherits the rules from `/AGENTS.md`. Applies to `scripts/project-memory` and its descendants.

## Contains

- Automation tooling for project-memory lookup, task entry/exit, diff-aware review, and lifecycle validation.
- The repo-local Codex hook driver that adds project-memory context and stop-time review through documented hook events.

## Patterns

- Keep task-loop behavior centralized here: `memory:task:start` performs lookup and writes the task state, `memory:task:review` inspects the diff, and `memory:task:finish` runs review plus validation.
- Keep Codex hook behavior centralized here as well: repo-local hooks should call these scripts or their exported helpers instead of copying lifecycle logic into `.codex/hooks.json`.
- Treat `.project-memory/.task-state/current-task.json` as ephemeral task state. It exists to carry lookup context through a task, not as a committed artifact.
- Keep diff-aware review deterministic from committed or working-tree state. Hard failures should be reproducible from the diff itself; local-only explicit keep decisions are for task finish, not for CI.
- When adding lifecycle heuristics, bias toward blocking touched existing memory scopes and risky known zones, but keep “create a brand-new record” as a warning unless the evidence is already concrete and reproducible from the diff.

## Constraints

- Update `.project-memory/WORKFLOW.md`, `.project-memory/README.md`, and the root `AGENTS.md` together when changing task-loop commands or lifecycle expectations.
- Run `pnpm memory:validate` and the relevant `memory:task:*` or Codex hook smoke checks after editing this directory.
