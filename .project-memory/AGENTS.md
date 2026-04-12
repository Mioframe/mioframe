# .project-memory

Inherits the rules from `/AGENTS.md`. Applies to `.project-memory` and its descendants.

## Contains

- Evidence-first memory records, lifecycle rules, and the local workflow for project-specific knowledge that is not yet best expressed as code, tests, or stable `AGENTS.md` guidance.

## Patterns

- Treat lifecycle as a validated contract: `drafts/ -> draft`, `verified/ -> verified`, `promoted/ -> promoted`, and `archive/ -> archived`.
- Search memory before changing significant scopes by exact scope, parent subsystem, and task keywords. Use `pnpm memory:lookup` unless the relevant entry is already open.
- Use `.project-memory/WORKFLOW.md` as the canonical lookup -> evaluate -> write/promote/archive -> validate sequence.
- Keep `supersedes` and `superseded-by` explicit when a record replaces, merges, or narrows another one.
- Promote rules into tests, guards, adapters, migrations, or `AGENTS.md` as soon as they are stable enough to enforce there.

## Anti-patterns

- Do not turn `.project-memory/` into broad architecture documentation.
- Do not keep duplicate entries for the same rule and scope when one merged record would do.
- Do not archive or promote records without updating the stronger artifact or replacement links in the same change.

## Constraints

- Run `pnpm memory:validate` after editing memory entries, templates, lifecycle docs, `.project-memory/WORKFLOW.md`, or validator/lookup tooling.
- Promoted records stay as short breadcrumbs, not duplicate rule dumps.
- Archived records with `archive-reason: superseded` or `archive-reason: merged` must keep reciprocal replacement links.
