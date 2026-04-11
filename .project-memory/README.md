# Project Memory

`.project-memory/` is a small, evidence-first memory layer for project knowledge that is useful across future tasks but does not yet belong in `AGENTS.md` or another stronger artifact.

It is intentionally narrower than general documentation:

- `AGENTS.md` keeps stable rules, ownership, and boundaries.
- Tests, guards, adapters, migrations, and code keep enforceable behavior.
- `.project-memory/` keeps project-specific lessons, tricky semantics, and review-grade pitfalls that are confirmed enough to be useful, but still need active review, promotion, merging, or removal.

## Layout

- `templates/entry.md`: the only write template.
- `drafts/`: fresh observations with evidence that are not stable enough yet.
- `verified/`: confirmed, reusable knowledge that future agents should consult.
- `promoted/`: short pointer records for knowledge already lifted into a stronger artifact.
- `archive/`: obsolete, disputed, or superseded records.

The directory is the primary lifecycle signal. The frontmatter `status` must match the directory in the same change.

## What Belongs Here

- Project-local helper or library semantics whose runtime behavior is easy to misread from types alone.
- Repeated pitfalls confirmed by tests, bug fixes, review feedback, or official library/source references.
- Local invariants that are important but still too narrow or too unstable for `AGENTS.md`.
- Runtime-only behavior gaps where a future agent must verify real behavior, not just rely on typing.

## What Does Not

- Guesses, hunches, or unverified “probably works this way” notes.
- Anything without both `scope` and `evidence`.
- Generic coding advice with no Beaver-specific consequence.
- One-off debugging scraps that have not repeated and are unlikely to repeat.
- Facts already expressed more clearly and durably in tests, types, linters, guards, code, or stable `AGENTS.md` rules.

When a stronger artifact is the better answer, write that artifact first and either skip memory entirely or leave only a short promoted pointer.

## Entry Contract

Every record is one Markdown file with YAML frontmatter and these required fields:

- `scope`: directories, modules, subsystems, or libraries the rule applies to.
- `kind`: one of `lesson`, `library-semantics`, `review-finding`, `pattern`, `pitfall`.
- `rule`: the concise rule future agents should act on.
- `why`: the consequence or failure mode.
- `evidence`: concrete proof such as file paths, tests, commits, issues, PRs, or official docs/source.
- `status`: `draft`, `verified`, `promoted`, or `obsolete`.
- `confidence`: `low`, `medium`, or `high`.
- `promotion-target`: the stronger artifact this should become when confirmed enough.
- `review-trigger`: the condition that should force a re-check.
- `last-verified-at`: ISO date of the latest confirmation.

File names should be `YYYY-MM-DD-short-slug.md`.

## Status Rules

- `draft`: has at least one solid evidence item, but is still scoped to the observed case and not yet strong enough to generalize broadly.
- `verified`: is confirmed by either a focused test, multiple independent evidence items, or a code path plus an authoritative source. It is reusable and project-relevant.
- `promoted`: now lives in a stronger artifact. The memory record should shrink to a breadcrumb, not restate the full rule.
- `obsolete`: should live in `archive/` and must not guide new work without re-verification.

## Write Rules

- Never add a record without `scope`, `evidence`, and `review-trigger`.
- Phrase `rule` no stronger than the evidence supports.
- Prefer merging evidence into an existing record over opening a near-duplicate.
- If the same lesson is already enforced in code or tests and easy to discover there, do not duplicate it here.
- If a note cannot survive the next cleanup pass, do not save it.

## Promotion Rules

Promote a record out of memory when one of these becomes true:

- The rule is stable enough to become a cross-cutting instruction in `AGENTS.md`.
- The behavior can be enforced by a test, guard, adapter, migration, schema, or lintable contract.
- The same problem has been confirmed again in a bug fix, review, or second subsystem.
- A future agent would be safer discovering the rule from code than from memory prose.

After promotion:

1. Update or add the stronger artifact.
2. Move the record to `promoted/`.
3. Replace any long explanation with a short pointer to the new artifact.
4. Delete the promoted record later if the stronger artifact is now obvious enough on its own.

## Cleanup Procedure

Run a memory cleanup pass whenever one of these happens:

- You touched a scope that already has memory entries.
- A bug fix or review confirms or disproves an existing record.
- A promotion target was added.
- A record reaches its `review-trigger`.

During cleanup:

1. Merge duplicates that express the same rule for the same scope.
2. Broaden scope only when the evidence really spans the wider area.
3. Promote repeated verified knowledge into a stronger artifact when possible.
4. Archive records whose evidence is contradicted, whose dependency semantics changed, or whose stronger artifact made the record unnecessary.
5. Delete stale drafts that never earned a second confirmation and no longer improve future work.

A record is stale by default when its `review-trigger` has happened and nobody refreshed `last-verified-at` in the same line of work.

## Beaver Priorities

This memory is most useful here:

- third-party and helper semantics where types hide real runtime behavior;
- Automerge and CRDT mutation constraints;
- virtual filesystem and persisted handle invariants;
- service and UI boundary lessons that are too local for `AGENTS.md`;
- schema, migration, and effective-value consistency;
- repeated review findings that are still too specific for a stable rule;
- places where runtime checks matter more than static types.

## Search

Use `rg` against frontmatter instead of maintaining a second index. Examples:

```sh
rg -n "scope:|kind:|status:" .project-memory
rg -n "src/shared/service/fileSystem" .project-memory
rg -n "kind: library-semantics" .project-memory
```
