---
name: material-component-migration
description: 'Use after a family implementation is complete to migrate all approved consumers to the canonical MD* API, remove replaced legacy ownership, prove product scenarios, and write MIGRATION.md without redesigning the component.'
---

# Material component migration

Migrate one completed Material family into the application and return control to the orchestrator.

This stage owns product-consumer adoption, legacy-owner removal, and migration-scoped proof. It does not own official research, architecture, component redesign, independent review, or final workflow verification.

## Input gate

Require mechanically valid and successful:

```text
components/<family>/DESIGN.md
components/<family>/ARCHITECTURE.md
components/<family>/IMPLEMENTATION.md
```

Design must be current and not refresh-due; architecture implementation-ready with current renderer revision and queue `none`; implementation complete with no deviations and migration readiness `ready`.

If an input is invalid, write or refresh `MIGRATION.md` as blocked, record the exact earliest return family and stage, and return without consumer edits.

## Worker boundary

Run in a fresh isolated worker context.

Use task-relevant readable workspace files, applicable rules, canonical artifacts, and documented project commands. Do not depend on Git history, diff, branch, worktree/index state, commit identifiers, pull-request metadata, or external checks.

Do not invent or revise public API, state, tokens, ownership, renderer strategy, gap strategy, or component behavior during migration.

## Mandatory preflight

Before consumer edits, run `implementation-preflight` using:

- current architecture migration inventory and pass order;
- complete implementation artifact;
- current direct and indirect consumers;
- accepted product scenarios and failure paths.

Preflight resolves exact consumers/files, ordered passes, migration-owned `TEST IMPACT`, focused verifier scopes, obsolete owners/exports, and any upstream blocker.

Do not use preflight to reopen architecture.

## Output

Migration may change approved consumers, consumer tests/stories/impact metadata, and obsolete imports, adapters, exports, tokens, tests, or compatibility code owned by the replaced surface.

Write exactly:

```text
src/shared/ui/material/components/<family>/MIGRATION.md
```

Control fields:

```text
Status: complete | partial | stale | blocked
DESIGN.md reference: <path>
ARCHITECTURE.md reference: <path>
IMPLEMENTATION.md reference: <path>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Review readiness: ready | blocked
```

Required headings:

```text
## Consumer inventory
## Migrated consumers
## Preserved scenarios and failure paths
## Legacy ownership removed
## Consumer and blast-radius proof
## Stage verification
## Remaining blockers
## Review readiness
```

Use every heading. Record explicit `none` or `not applicable` where appropriate.

## Migration rules

- Use only the canonical root-exported `MD*` API and supported public tokens.
- Keep renderer tags, imports, types, events, private CSS inputs, and renderer DOM out of consumers.
- Preserve product ownership of operation state, disabled guards, errors, status, persistence, routing, and business behavior.
- Do not move feature, entity, widget, or page responsibility into Material or shared UI.
- Follow architecture dependency and migration order.
- Remove replaced legacy ownership only after every consumer has a valid destination.
- Do not keep compatibility aliases by default for an unshipped or fully migrated internal API.
- Leave unrelated families and shared UI untouched.

## Consumer and blast-radius proof

For each materially distinct consumer path record:

- previous and canonical owner/API;
- preserved behavior and failure paths;
- contextual token or composition handoff;
- disabled, loading, error, mobile, overlay, form, or accessibility behavior when applicable;
- faithful proof owner.

Focused verifier-managed checks prove:

- every inventoried consumer compiles against canonical API;
- required scenarios and failure paths remain correct;
- no renderer/private token leak remains;
- no obsolete owner or duplicate export remains;
- contextual appearance is proven at real consumers where selected;
- impact metadata maps source and proof correctly.

A representative happy path is insufficient when consumers use distinct contracts.

Run migration-scoped focused checks only. The orchestrator runs final workflow verification after independent review.

## Semantic routing

If migration requires a new official fact, architecture decision, public contract, token, renderer workaround, dependency correction, or component behavior:

- do not patch locally;
- set the exact owning family (`self` or canonical dependency family);
- set the earliest owning stage;
- record the blocker;
- return.

Use `self/migration` for consumer, legacy-removal, product-scenario, impact-metadata, or migration-proof work owned here.

## Completion

Use `Status: complete` only when:

- every architecture-listed consumer is migrated or explicitly not applicable;
- all materially distinct scenarios and failure paths are proven;
- obsolete target ownership is removed;
- no renderer details leak to consumers;
- focused migration verification passes;
- every required heading exists;
- blockers are `none`;
- both return fields are `none`;
- review readiness is `ready`.

A current warning, missing proof, unknown consumer state, or failed focused check cannot produce complete migration.

The pending final workflow command is expected and does not affect migration status.

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
Required return family: none | self | <canonical-family>
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
- Omitting required handoff sections.
- Running independent review in this context.
- Running, deferring, or claiming final workflow verification.
- Depending on Git or PR state.
