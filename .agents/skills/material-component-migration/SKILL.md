---
name: material-component-migration
description: 'Use after a family implementation is complete to migrate approved consumers to the canonical MD* API, remove replaced legacy ownership, prove product scenarios, and write MIGRATION.md without redesigning the component.'
---

# Material component migration

Migrate one completed Material family into the application and return control to the orchestrator.

This stage owns product-consumer adoption, legacy-owner removal, and migration-scoped proof. It does not own official research, architecture, component redesign, independent review, or final workflow verification.

## Input gate

Require successful current design, architecture, and implementation artifacts.

Implementation must reference the exact current architecture revision, be complete with no deviations, and declare migration readiness `ready`.

If an input is invalid, write migration as blocked, record the current implementation revision when available, set the exact earliest return family and stage, and return without consumer edits.

## Worker boundary

Run in a fresh isolated worker context.

Use task-relevant readable workspace files, applicable rules, canonical artifacts, and documented project commands. Do not depend on Git, PR, commit, or external-check state.

Do not invent or revise public API, state, tokens, ownership, renderer strategy, gap strategy, or component behavior during migration.

## Mandatory preflight

Before consumer edits, run `implementation-preflight` using:

- the current architecture migration inventory and pass order;
- the current implementation artifact;
- current direct and indirect consumers;
- accepted product scenarios and failure paths.

Preflight resolves exact consumers and files, ordered migration passes, migration-owned `TEST IMPACT`, focused verifier scopes, obsolete owners and exports, and upstream blockers.

Do not use preflight to reopen architecture.

## Output

Migration may change approved consumers, consumer proof and impact metadata, and obsolete imports, adapters, exports, tokens, tests, or compatibility code owned by the replaced surface.

Write exactly:

```text
src/shared/ui/material/components/<family>/MIGRATION.md
```

Control fields:

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
Status: complete | partial | stale | blocked
IMPLEMENTATION.md reference: <path>
IMPLEMENTATION.md revision: <exact Artifact revision>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Review readiness: ready | blocked
```

Use a new artifact revision whenever migration content or its proof record changes. Record the exact implementation revision used for migration.

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

When architecture records the approved standalone library scenario and no current consumer or legacy owner exists, record explicitly:

```text
Consumer inventory: none
Migrated consumers: none
Legacy ownership removed: not applicable
```

Do not create a product consumer merely to make migration non-empty. Prove only that no current consumer or legacy owner exists and that the canonical family remains independently usable through its component-owned proof.

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

For each materially distinct consumer path record its previous and canonical owner/API, preserved behavior and failure paths, token or composition handoff, relevant loading/disabled/error/mobile/overlay/form/accessibility behavior, and faithful proof owner.

Run focused verifier-managed checks proving consumers compile, scenarios remain correct, no renderer leak remains, obsolete ownership is removed, contextual appearance is proven where required, and impact metadata maps changed source and proof.

Run migration-scoped focused checks only. The orchestrator runs final verification after independent review.

## Semantic routing

If migration requires a new official fact, architecture decision, public contract, token, renderer workaround, component behavior, or dependency correction:

- do not patch locally;
- set the exact earliest return family and stage;
- record the blocker;
- return.

Use `self/migration` for consumer, legacy-removal, product-scenario, impact-metadata, or migration-proof defects.

## Completion

Use status `complete` only when:

- `IMPLEMENTATION.md revision` equals the current implementation revision;
- every listed consumer is migrated or the no-consumer case is explicitly proven;
- materially distinct scenarios and failure paths are proven;
- obsolete ownership is removed or marked not applicable;
- no renderer details leak to consumers;
- focused verification passes;
- blockers and return target are `none`;
- review readiness is `ready`;
- every required heading exists.

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

- Changing official design or architecture.
- Adding consumer-specific hacks inside the component.
- Accessing raw renderer details from consumers.
- Creating a product consumer when none is required.
- Migrating unrelated families for cleanup.
- Keeping replaced logic only to reduce work.
- Running independent review in this context.
- Running or claiming final workflow verification.
- Reusing an artifact revision after content changed.
- Recording the pending final command as a blocker or risk.
- Depending on Git or PR state.
