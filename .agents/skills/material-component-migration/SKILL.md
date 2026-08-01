---
name: material-component-migration
description: 'Use after a family implementation is complete to migrate approved consumers, remove replaced legacy ownership, prove product scenarios, and write MIGRATION.md without redesigning the component.'
---

# Material component migration

Migrate one completed Material family into the application and return control to the orchestrator.

This stage owns product-consumer adoption, legacy-owner removal, and migration-scoped proof. It does not own official research, architecture, component redesign, independent review, or final workflow verification.

## Input gate

Require successful current design, architecture, and implementation artifacts.

Implementation must reference the exact current architecture revision, be complete with no deviations, and declare migration readiness `ready`.

If an input is invalid, write migration as blocked, set the exact earlier-stage or other-family route, and return without consumer edits.

## Worker boundary

Run in a fresh isolated context.

Use task-relevant workspace files, applicable rules, canonical artifacts, and documented commands. Do not depend on Git, PR, commit, or external-check state.

Do not invent or revise public API, state, tokens, ownership, renderer strategy, gap strategy, or component behavior during migration.

## Mandatory preflight

Before consumer edits, run `implementation-preflight` using the current architecture migration inventory, implementation artifact, consumers, scenarios, and failure paths.

Preflight resolves exact files, pass order, migration-owned `TEST IMPACT`, focused verifier scopes, obsolete owners, and upstream blockers. It does not reopen architecture.

## Output

Write exactly:

```text
src/shared/ui/material/components/<family>/MIGRATION.md
```

Control fields:

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
Status: complete | stale | blocked
IMPLEMENTATION.md reference: <path>
IMPLEMENTATION.md revision: <exact Artifact revision>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Review readiness: ready | blocked
```

`stale` is an external pre-run marker. This worker may finish only with `complete` or `blocked`.

Use a new artifact revision whenever migration content or proof changes.

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

## No-consumer case

When architecture records the approved standalone library scenario and no consumer or legacy owner exists, record:

```text
Consumer inventory: none
Migrated consumers: none
Legacy ownership removed: not applicable
```

Do not create a product consumer merely to make migration non-empty.

## Migration rules

- Use only the root-exported canonical `MD*` API and supported public tokens.
- Keep renderer details out of consumers.
- Preserve product ownership of state, disabled guards, errors, persistence, routing, and business behavior.
- Do not move feature, entity, widget, or page responsibility into Material.
- Follow architecture dependency and migration order.
- Remove replaced legacy ownership only after every consumer has a valid destination.
- Do not keep compatibility aliases by default for an unshipped or fully migrated internal API.
- Leave unrelated families and shared UI untouched.

## Consumer and blast-radius proof

For each materially distinct consumer path record previous and canonical ownership/API, preserved behavior and failure paths, token or composition handoff, relevant loading/disabled/error/mobile/overlay/form/accessibility behavior, and faithful proof owner.

Run focused verifier-managed checks proving consumers compile, scenarios remain correct, no renderer leak remains, obsolete ownership is removed, contextual appearance is proven where required, and impact metadata maps changed source and proof.

Run migration-scoped checks only. The orchestrator runs final verification after independent review.

## Terminal-state rules

### Success

Return `Status: complete` only when every consumer is migrated or the no-consumer case is proven, legacy ownership is removed or not applicable, focused checks pass, blockers and route are `none`, and review readiness is `ready`.

### Earlier-stage or cross-family correction

Return `Status: blocked` with an exact route only when correction belongs to:

- `self/design`;
- `self/architecture`;
- `self/implementation`; or
- another family’s design, architecture, implementation, or migration stage.

### Current-stage defect

A consumer, legacy-removal, product-scenario, impact-metadata, or migration-proof defect must be corrected in this worker.

If it remains impossible after available migration mechanisms are exhausted, return:

```text
Status: blocked
Remaining blockers: <exact blocker>
Required return family: none
Required return stage: none
Review readiness: blocked
```

Do not return `self/migration` and do not return `partial`.

The not-yet-run final workflow command does not affect migration status.

Operator visual/motion inspection is an external defect-reporting channel. Do not request or invent positive acceptance.

## Report

```text
MATERIAL MIGRATION RESULT
Input component:
Canonical family:
IMPLEMENTATION.md revision:
MIGRATION.md path:
Artifact revision:
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

- Returning `partial` or terminal `stale`.
- Returning `self/migration`.
- Leaving a current-stage fixable defect unresolved.
- Changing official design or architecture.
- Adding consumer-specific hacks inside the component.
- Accessing raw renderer details from consumers.
- Creating a product consumer when none is required.
- Migrating unrelated families for cleanup.
- Keeping replaced logic only to reduce work.
- Running independent review or final workflow verification.
- Recording the pending final command as a blocker or risk.
- Depending on Git or PR state.