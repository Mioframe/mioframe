# .project-memory

Inherits the rules from `/AGENTS.md`. Applies to `.project-memory` and its descendants.

## Contains

- Evidence-first memory records, lifecycle rules, and the local workflow for project-specific knowledge that is not yet best expressed as code, tests, or stable `AGENTS.md` guidance.

## Patterns

- Treat lifecycle as a validated contract: `drafts/ -> draft`, `verified/ -> verified`, `promoted/ -> promoted`, and `archive/ -> archived`.
- Start risky or memory-relevant work with `pnpm memory:task:start --scope <path> --term <keyword>`, not with ad hoc lookup alone. The entrypoint performs exact-scope, parent-subsystem, and task-term discovery and stores task state for the exit review.
- Repo-local Codex hooks in `.codex/` may preload relevant memory into developer context and can request one extra stop-time pass when lifecycle handling is missing, but `memory:task:start` and `memory:task:finish` remain the authoritative lifecycle boundary.
- Use `.project-memory/WORKFLOW.md` as the canonical `memory:task:start -> evaluate -> write/promote/archive -> memory:task:finish` sequence.
- Keep `supersedes` and `superseded-by` explicit when a record replaces, merges, or narrows another one.
- Promote rules into tests, guards, adapters, migrations, or `AGENTS.md` as soon as they are stable enough to enforce there.

## Anti-patterns

- Do not turn `.project-memory/` into broad architecture documentation.
- Do not keep duplicate entries for the same rule and scope when one merged record would do.
- Do not archive or promote records without updating the stronger artifact or replacement links in the same change.

## Constraints

- Run `pnpm memory:validate` after editing memory entries, templates, lifecycle docs, `.project-memory/WORKFLOW.md`, validator/lookup tooling, or the repo-local Codex hook config in `.codex/`.
- Finish risky tasks with `pnpm memory:task:finish`; it runs diff-aware review plus `pnpm memory:validate` and should fail loudly when touched memory scopes were not lifecycle-reviewed.
- Promoted records stay as structured breadcrumbs: keep the body short and pointer-like even though the validated frontmatter remains for search and tooling.
- Archived records with `archive-reason: superseded` or `archive-reason: merged` must keep reciprocal replacement links.
