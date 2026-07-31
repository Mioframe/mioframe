---
name: material-component-migration
description: 'Use after a family implementation is complete to migrate all approved consumers to the canonical MD* API, remove replaced legacy ownership, prove product scenarios, and write MIGRATION.md without redesigning the component.'
---

# Material component migration

Migrate one completed Material family into the application and return control to the orchestrator.

This stage owns product-consumer adoption, legacy-owner removal, and migration-scoped proof. It does not own official research, architecture, component redesign, independent review, or final workflow verification.

## Input gate

Require successful control fields in:

```text
components/<family>/DESIGN.md
components/<family>/ARCHITECTURE.md
components/<family>/IMPLEMENTATION.md
```

Design must be `current`; architecture `ready`; implementation `complete` with no deviations and migration readiness `ready`.

If an input is invalid, write or refresh `MIGRATION.md` as blocked, record the earliest `Required return stage`, and return without consumer edits.

## Worker boundary

Run in a fresh isolated worker context.

Use task-relevant readable workspace files, applicable rules, canonical artifacts, and documented project commands. Do not depend on Git history, diff, branch, worktree/index state, commit identifiers, pull-request metadata, or external checks.

Do not invent or revise public API, state, tokens, ownership, renderer strategy, gap strategy, or component behavior during migration.

## Mandatory preflight

Before consumer edits, run `implementation-preflight` using:

- the current architecture migration inventory and pass order;
- the complete implementation artifact;
- current direct and indirect consumers;
- accepted product scenarios and failure paths.

Preflight must resolve:

- exact consumers and files;
- ordered migration passes;
- migration-owned `TEST IMPACT`;
- focused verifier labels and scopes;
- obsolete owners and exports to remove;
- an upstream blocker, if one exists.

Do not use preflight to reopen architecture.

## Output

Migration may change:

- approved application consumers;
- consumer tests, stories, and impact metadata;
- obsolete imports, adapters, exports, tokens, tests, and compatibility code owned by the replaced surface.

Write exactly:

```text
src/shared/ui/material/components/<family>/MIGRATION.md
```

Its control fields are:

```text
Status: complete | partial | stale | blocked
DESIGN.md reference: <path>
ARCHITECTURE.md reference: <path>
IMPLEMENTATION.md reference: <path>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return stage: none | design | architecture | implementation | migration
Review readiness: ready | blocked
```

Do not append prose to enum values.

## Migration rules

- Use only the canonical root-exported `MD*` API and supported public tokens.
- Keep renderer tags, imports, types, events, private CSS inputs, and renderer DOM out of consumers.
- Preserve product ownership of operation state, disabled guards, errors, status, persistence, routing, and business behavior.
- Do not move feature, entity, widget, or page responsibility into Material or shared UI.
- Follow the architecture dependency and migration order.
- Remove replaced legacy ownership only after every consumer has a valid destination.
- Do not keep compatibility aliases by default for an unshipped or fully migrated internal API.
- Leave unrelated families and shared UI untouched.

## Consumer and blast-radius proof

For each materially distinct consumer path record:

- previous and canonical owner/API;
- behavior and failure paths that must remain unchanged;
- contextual token or composition handoff;
- relevant disabled, loading, error, mobile, overlay, form, or accessibility behavior;
- faithful proof owner.

Verify through focused verifier-managed checks:

- all listed consumers compile against the canonical API;
- required behavior and failure paths remain correct;
- no renderer/private token leak remains;
- no obsolete target owner or duplicate export remains;
- selected contextual appearance is proven at real consumers;
- impact metadata maps changed source and proof correctly.

A representative happy path is not sufficient when consumers use distinct contracts.

Run migration-scoped focused checks only. The orchestrator runs final workflow verification after independent review.

## Semantic routing

If migration requires a new official fact, architecture decision, public contract, token, renderer workaround, or component behavior:

- do not patch the consumer or component locally;
- set the earliest `Required return stage`;
- record the exact blocker;
- return.

Use return stage `migration` for a consumer, legacy-removal, product-scenario, impact-metadata, or migration-proof defect owned by this stage.

## Completion

Use `Status: complete` only when:

- every architecture-listed consumer is migrated or explicitly confirmed not applicable;
- all materially distinct scenarios and failure paths are proven;
- obsolete target ownership is removed;
- no renderer details leak to consumers;
- focused migration verification passes;
- `Remaining blockers: none`;
- `Required return stage: none`;
- `Review readiness: ready`.

A warning introduced by current work, missing proof, unknown consumer state, or failed focused check cannot be recorded as an accepted risk or complete migration.

The not-yet-run final workflow command is expected and does not affect migration status.

Operator visual/motion inspection is an external defect-reporting channel. Record `no-reported-defect`, `defect-reported`, or `not-applicable`; do not request or invent positive acceptance.

## Report

```text
MATERIAL MIGRATION RESULT
Input component:
Canonical family:
Input artifact statuses:
MIGRATION.md path:
Preflight result:
Consumers inventoried:
Consumers migrated:
Preserved scenarios and failure paths:
Legacy ownership removed:
Focused proof completed:
Migration-stage verification:
Operator visual status: no-reported-defect | defect-reported | not-applicable
Remaining blockers: none | <details>
Required return stage: none | design | architecture | implementation | migration
Review readiness: ready | blocked
Status: complete | blocked
```

## Forbidden

- Changing official design or accepted architecture.
- Adding consumer-specific hacks inside the component.
- Accessing raw renderer or private tokens from consumers.
- Migrating unrelated families for cleanup.
- Keeping replaced logic only to reduce work.
- Running independent review in this context.
- Running, deferring, or claiming ownership of final workflow verification.
- Recording the pending final command as a blocker, risk, or next action.
- Depending on Git or PR state.
