# .project-memory

Inherits the rules from `/AGENTS.md`. Applies to `.project-memory` and its descendants.

## Contains

- Evidence-first memory records, lifecycle rules, and the local workflow for project-specific knowledge that is not yet best expressed as code, tests, or stable `AGENTS.md` guidance.

## Patterns

- Treat lifecycle as a validated contract: `drafts/ -> draft`, `verified/ -> verified`, `promoted/ -> promoted`, and `archive/ -> archived`.
- ByteRover is the default memory path for agents right now. Start risky or memory-relevant work with `pnpm memory:task:start --scope <path> --term <keyword>` only when you intentionally use the local project-memory fallback instead of ByteRover.
- Repo-local Codex hooks in `.codex/` are currently suspended, so local project-memory discovery is manual unless hook wiring is explicitly re-enabled later.
- Use `.project-memory/WORKFLOW.md` as the canonical fallback sequence: `memory:task:start -> evaluate -> explicit learning decision -> write/promote/archive -> memory:task:finish`.
- Keep `supersedes` and `superseded-by` explicit when a record replaces, merges, or narrows another one.
- Promote rules into tests, guards, adapters, migrations, or `AGENTS.md` as soon as they are stable enough to enforce there.

## Anti-patterns

- Do not turn `.project-memory/` into broad architecture documentation.
- Do not keep duplicate entries for the same rule and scope when one merged record would do.
- Do not archive or promote records without updating the stronger artifact or replacement links in the same change.

## Constraints

- Run `pnpm memory:validate` after editing memory entries, templates, lifecycle docs, `.project-memory/WORKFLOW.md`, validator/lookup tooling, or the repo-local Codex hook config in `.codex/`. In suspended mode it should validate entries without requiring active hook wiring.
- Finish risky tasks with `pnpm memory:task:finish` whenever you chose the local fallback workflow; it runs strict diff-aware review plus `pnpm memory:validate`, clears active task state after writing a separate completion snapshot, and should fail loudly when touched memory scopes were not lifecycle-reviewed or when a confirmed lesson still lacks an explicit learning decision.
- Promoted records stay as structured breadcrumbs: keep the body short and pointer-like even though the validated frontmatter remains for search and tooling.
- Archived records with `archive-reason: superseded` or `archive-reason: merged` must keep reciprocal replacement links.
