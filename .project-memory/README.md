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
- `archive/`: archived records that are obsolete, contradicted, merged away, or superseded.

Directory and status are both canonical, but they are not compared by raw spelling. The validator enforces this lifecycle mapping:

- `drafts/` -> `status: draft`
- `verified/` -> `status: verified`
- `promoted/` -> `status: promoted`
- `archive/` -> `status: archived`

Archived records must also declare `archive-reason`, so `obsolete` becomes an archive reason instead of a lifecycle status.

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
- `status`: `draft`, `verified`, `promoted`, or `archived`.
- `confidence`: `low`, `medium`, or `high`.
- `promotion-target`: the stronger artifact this should become when confirmed enough.
- `review-trigger`: the condition that should force a re-check.
- `last-verified-at`: ISO date of the latest confirmation.

Optional but formalized fields:

- `supersedes`: `.project-memory/`-relative record paths this record replaces or narrows.
- `superseded-by`: `.project-memory/`-relative record paths that replace this record.
- `archive-reason`: one of `obsolete`, `superseded`, `merged`, `contradicted`, `redundant`. Required when `status: archived`.

File names should be `YYYY-MM-DD-short-slug.md`.

## Status Rules

- `draft`: has at least one solid evidence item, but is still scoped to the observed case and not yet strong enough to generalize broadly.
- `verified`: is confirmed by either a focused test, multiple independent evidence items, or a code path plus an authoritative source. It is reusable and project-relevant.
- `promoted`: now lives in a stronger artifact. The memory record should shrink to a breadcrumb, not restate the full rule.
- `archived`: no longer guides new work without re-verification. Use `archive-reason` to say whether it became obsolete, was contradicted, merged into another record, or was superseded.

## Required Discovery Workflow

Before editing a significant scope, search memory in three passes:

1. Search by the exact touched scope and its parent subsystem.
2. Search by bug, review, helper, library, or regression keywords from the task.
3. Search adjacent subsystems when the change crosses a boundary such as service <-> entity, helper <-> caller, or provider <-> runtime integration.

Use `pnpm memory:lookup` for the repeatable path:

```sh
pnpm memory:lookup --scope src/shared/service/fileSystem --term reread --term handle
pnpm memory:lookup --scope src/shared/lib/changeObject --scope src/shared/service/databaseDocument --term deepPatchJsonObject
```

Discovery is mandatory before non-trivial changes in shared infrastructure, CRDT paths, VFS/filesystem flows, schemas or migrations, helper semantics, and any scope that already has matching memory.

## Write Rules

- Never add a record without `scope`, `evidence`, and `review-trigger`.
- Phrase `rule` no stronger than the evidence supports.
- Prefer merging evidence into an existing record over opening a near-duplicate.
- If the same lesson is already enforced in code or tests and easy to discover there, do not duplicate it here.
- If a note cannot survive the next cleanup pass, do not save it.

Write or update memory in these cases:

- Refresh an existing entry when a bug fix, review, or repro gives new evidence for the same rule.
- Open a new `draft` only when the evidence is concrete enough to help the next agent, even if the rule is still narrow.
- Promote repeated or now-enforceable knowledge in the same change that adds the stronger artifact.
- Archive a record when the rule is contradicted, replaced, merged into another entry, or made unnecessary by a clearly discoverable stronger artifact.

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

Leave a promoted breadcrumb when future agents are still likely to search memory first for that scope or keyword. Delete the breadcrumb only after the stronger artifact is directly discoverable in the touched scope and two later scope touches no longer needed the memory pointer.

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

A `draft` is stale by default when `last-verified-at` is older than 90 days and it still has only its original line of evidence.

A `verified` or `promoted` record is stale when current work touches one of its scopes or hits its `review-trigger`, but the same change does not refresh `last-verified-at` or archive it.

An archived record can be deleted only when no live entry points to it through `supersedes` or `superseded-by`, and the replacement or stronger artifact is already obvious without the breadcrumb.

## Conflict And Merge Rules

- Use `supersedes` and `superseded-by` as reciprocal links between related records.
- If two `verified` records partially conflict, do not leave both broad and ambiguous. Narrow the scope or rule until both are independently true, or archive the weaker record as `contradicted` or `superseded`.
- If two records express the same rule for the same scope, keep the older or richer record, merge the evidence, and archive the duplicate with `archive-reason: merged` plus a `superseded-by` link to the kept file.
- If a record is replaced by a stronger, more accurate one, archive the old record with `archive-reason: superseded` and point it at the replacement.

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

Use `pnpm memory:lookup` for the default workflow and `rg` for ad hoc follow-up. Examples:

```sh
pnpm memory:lookup --scope src/shared/service/fileSystem --term reread
pnpm memory:lookup --scope src/shared/lib/typeGuards --term FileSystemDirectoryHandle
```

Raw `rg` remains useful when you already know what you are hunting:

```sh
rg -n "scope:|kind:|status:" .project-memory
rg -n "src/shared/service/fileSystem" .project-memory
rg -n "kind: library-semantics" .project-memory
```

## Validation

Run `pnpm memory:validate` whenever you touch `.project-memory/`, lifecycle docs, `.project-memory/WORKFLOW.md`, or memory lookup/validator tooling.

The same validation is wired into pre-commit for memory-related changes and into CI through `.github/workflows/project-memory.yml`, so lifecycle drift and malformed entries fail loudly instead of relying on careful manual review.
