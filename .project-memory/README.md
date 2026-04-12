# Project Memory

`.project-memory/` is a small, evidence-first memory layer for project knowledge that is useful across future tasks but does not yet belong in `AGENTS.md` or another stronger artifact.

The default operating mode is now task-driven rather than reminder-driven:

- start risky work with `pnpm memory:task:start`;
- let repo-local Codex hooks preload prompt-matched memory when the project is opened in trusted mode;
- read the matched memory before changing behavior;
- finish with `pnpm memory:task:finish`;
- let `memory:task:review`, pre-commit, and CI catch risky diffs that skipped lifecycle handling.

It is intentionally narrower than general documentation:

- `AGENTS.md` keeps stable rules, ownership, and boundaries.
- Tests, guards, adapters, migrations, and code keep enforceable behavior.
- `.project-memory/` keeps project-specific lessons, tricky semantics, and review-grade pitfalls that are confirmed enough to be useful, but still need active review, promotion, merging, or removal.
- Repo-local Codex hooks preload context and help with stop-time review, but canonical discovery state still comes from `pnpm memory:task:start`.

## Layout

- `templates/entry.md`: the only write template.
- `drafts/`: fresh observations with evidence that are not stable enough yet.
- `verified/`: confirmed, reusable knowledge that future agents should consult.
- `promoted/`: structured breadcrumb records for knowledge already lifted into a stronger artifact.
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

When a stronger artifact is the better answer, write that artifact first and either skip memory entirely or leave only a promoted record whose body is a short pointer.

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
- `promoted`: now lives in a stronger artifact. The record keeps structured metadata for search and validation, but the body should shrink to a breadcrumb instead of restating the full rule in prose.
- `archived`: no longer guides new work without re-verification. Use `archive-reason` to say whether it became obsolete, was contradicted, merged into another record, or was superseded.

## Required Discovery Workflow

Before editing a significant scope, start the task through the mandatory entrypoint:

```sh
pnpm memory:task:start --scope src/shared/service/fileSystem --term reread --term handle
pnpm memory:task:start --scope src/shared/lib/changeObject --scope src/shared/service/databaseDocument --term deepPatchJsonObject
```

The entrypoint performs discovery in three passes:

1. Search by the exact touched scope and its parent subsystem.
2. Search by bug, review, helper, library, or regression keywords from the task.
3. Search adjacent subsystems when the change crosses a boundary such as service <-> entity, helper <-> caller, or provider <-> runtime integration.

Use raw `pnpm memory:lookup` only as a follow-up query after the task has already started.

Discovery is mandatory before non-trivial changes in shared infrastructure, CRDT paths, VFS/filesystem flows, schemas or migrations, helper semantics, and any scope that already has matching memory.

## Codex Automation Layer

This repo also ships a Codex-oriented automation layer in `.codex/`:

- `.codex/config.toml` enables the documented `codex_hooks` feature.
- `.codex/hooks.json` wires the documented `SessionStart`, `UserPromptSubmit`, `PreToolUse`, and `Stop` events.
- `scripts/project-memory/codexHooks.mjs` reuses the same lookup and diff-review logic as the CLI scripts, so hooks do not invent a second memory lifecycle model.

What the hook layer does:

- preload relevant memory into developer context from the prompt, active task state, and existing boundary-linked entries;
- remind the agent to run `pnpm memory:task:start` before risky edits when no task state exists;
- block a narrow set of risky Bash writes or `git commit` / `git push` if lifecycle handling is still missing;
- request one extra pass at stop-time via `Stop` `decision: "block"` when risky diff review still fails, then stop with a warning if the follow-up still fails.

What it does not do:

- it does not replace `pnpm memory:task:start` or `pnpm memory:task:finish`;
- it does not fully intercept non-shell tools, because current Codex documents `PreToolUse` / `PostToolUse` as Bash-only and incomplete;
- it does not force a brand-new memory record when the diff only justifies a warning.

Failure policy is split intentionally:

- `SessionStart` and `UserPromptSubmit` soft-fallback on internal errors because they only add context.
- `PreToolUse` and `Stop` exit non-zero on internal errors because silent success would mask enforcement failure.

## Write Rules

- Never add a record without `scope`, `evidence`, and `review-trigger`.
- Phrase `rule` no stronger than the evidence supports.
- Prefer merging evidence into an existing record over opening a near-duplicate.
- If the same lesson is already enforced in code or tests and easy to discover there, do not duplicate it here.
- If a note cannot survive the next cleanup pass, do not save it.

Write or update memory in these cases:

- Refresh an existing entry when a bug fix, review, or repro gives new evidence for the same rule.
- Open a new `draft` only when the diff carries concrete evidence that will help the next agent, even if the rule is still narrow. Good triggers are focused tests, bug fixes, review findings, reproducible runtime behavior, or authoritative source confirmation.
- Promote repeated or now-enforceable knowledge in the same change that adds the stronger artifact.
- Archive a record when the rule is contradicted, replaced, merged into another entry, or made unnecessary by a clearly discoverable stronger artifact.
- Do not create a new prose record when the relevant knowledge is already discoverable in code, tests, guards, adapters, migrations, schemas, or stable `AGENTS.md` guidance.

## Promotion Rules

Promote a record out of memory when one of these becomes true:

- The rule is stable enough to become a cross-cutting instruction in `AGENTS.md`.
- The behavior can be enforced by a test, guard, adapter, migration, schema, or lintable contract.
- The same problem has been confirmed again in a bug fix, review, or second subsystem.
- A future agent would be safer discovering the rule from code than from memory prose.

After promotion:

1. Update or add the stronger artifact.
2. Move the record to `promoted/`.
3. Replace any long body text with a short pointer to the new artifact while keeping the structured frontmatter needed for search and validation.
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

Use the task loop for the default workflow and `rg` for ad hoc follow-up. Examples:

```sh
pnpm memory:task:start --scope src/shared/service/fileSystem --term reread
pnpm memory:task:review
pnpm memory:task:finish
```

Raw `rg` remains useful when you already know what you are hunting:

```sh
rg -n "scope:|kind:|status:" .project-memory
rg -n "src/shared/service/fileSystem" .project-memory
rg -n "kind: library-semantics" .project-memory
```

## Validation

Run `pnpm memory:validate` whenever you touch `.project-memory/`, lifecycle docs, `.project-memory/WORKFLOW.md`, `.codex/`, or memory lookup/validator tooling.

The same validation is wired into pre-commit for memory-related changes and into CI through `.github/workflows/project-memory.yml`.

Diff-aware review is also part of the automation contour:

- `pnpm memory:task:review --staged` runs from pre-commit and blocks staged risky diffs that touched existing memory scopes without lifecycle handling.
- CI runs `pnpm memory:task:review --base <base-sha>` so risky pull-request diffs do not pass quietly.
- `pnpm memory:task:finish` runs the same diff-aware review plus `pnpm memory:validate` before the agent should consider the task complete.
- The Codex `Stop` hook runs the same review logic and can request one remediation pass when risky lifecycle handling is still unresolved.

Hard failures are reserved for reproducible lifecycle misses:

- risky work skipped `memory:task:start`;
- a touched existing memory scope was not refreshed, promoted, archived, or explicitly kept during local task finish;
- a live updated record did not refresh `last-verified-at`;
- memory validation failed.

Warnings are used when automation cannot safely infer intent without creating noise:

- a risky diff touched a new area with no existing memory record;
- a stronger artifact changed and a related record might now be ready for promotion;
- a promoted breadcrumb is getting too verbose or its promotion target is not clearly discoverable.

Hook-internal failures are never treated as silent success for enforcement hooks:

- `SessionStart` and `UserPromptSubmit` log a warning and continue without extra context.
- `PreToolUse` and `Stop` fail loud with a non-zero exit so the runtime can see that enforcement logic broke.
