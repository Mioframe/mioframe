---
name: material-component-migration
description: 'Use only after a Material family implementation is complete to migrate all approved Mioframe consumers to the canonical MD* API, remove replaced legacy ownership, verify product scenarios, and write MIGRATION.md without redesigning the component.'
---

# Material component migration

Migrate one completed Material family into the application.

This stage owns product-consumer adoption, removal of replaced legacy ownership, and migration-scoped proof. It does not own official research, architecture, component API redesign, independent review, or the top-level final workflow verification.

## Input gate

Require current accepted artifacts:

```text
components/<family>/DESIGN.md
components/<family>/ARCHITECTURE.md
components/<family>/IMPLEMENTATION.md
```

Required statuses:

- `DESIGN.md`: `current`;
- `ARCHITECTURE.md`: `ready` and references the current design;
- `IMPLEMENTATION.md`: `complete`, no architecture deviations, migration readiness `ready`.

Stop and route backward if migration requires a new public API, token, state, owner, renderer workaround, or component behavior not already resolved by architecture and implementation.

## Output

- migrate every consumer listed by `ARCHITECTURE.md`;
- preserve each confirmed user scenario and failure path;
- remove obsolete imports, adapters, exports, tokens, tests, stories, and compatibility code owned by the replaced legacy surface;
- update affected consumer tests and impact metadata;
- write:

```text
src/shared/ui/material/components/<family>/MIGRATION.md
```

Do not modify `DESIGN.md`. Do not redesign `ARCHITECTURE.md` or component internals to make migration easier.

## Read first

- applicable `AGENTS.md` files;
- family design, architecture, and implementation artifacts;
- architecture migration inventory and pass order;
- current direct and indirect consumers;
- legacy implementation and exports;
- affected product tests, Storybook stories, visual baselines, and verification metadata;
- shared-UI and testing rules.

## Migration rules

- Use only the canonical root-exported `MD*` API and selected public tokens.
- Keep renderer imports, tags, types, events, CSS inputs, and renderer DOM out of consumers.
- Preserve product ownership of operation state, disabled guards, errors, status, persistence, routing, and business behavior.
- Do not move feature, entity, widget, or page responsibility into Material or shared UI.
- Migrate dependencies before parents and parents before consumers when architecture defines that order.
- Remove replaced legacy ownership only after every consumer has a valid destination.
- Do not preserve compatibility aliases by default for an unshipped or fully migrated internal API.
- Leave unrelated legacy components and shared UI untouched.

## Shared UI blast radius

For every materially distinct consumer path record:

- previous owner and API;
- canonical owner and API;
- behavior that must remain unchanged;
- contextual token or composition handoff;
- relevant error, disabled, loading, mobile, overlay, or accessibility path;
- proof owner.

A representative happy-path migration is not sufficient when consumers use different contracts.

## Proof

Verify through focused verifier-managed checks appropriate to the migration-owned changes:

- all listed consumers compile against the canonical API;
- product behavior and failure paths remain correct;
- no raw renderer or private token leaks outside Material;
- no obsolete target owner or duplicate export remains;
- contextual appearance is proven at real consumers where selected;
- affected browser, visual, accessibility, mobile, and release risks are covered according to architecture;
- impact metadata maps changed source and proof correctly.

Run only migration-scoped focused proof in this worker. The top-level `material-component` orchestrator runs the single final read-only workflow gate after an up-to-date independent `REVIEW.md` exists.

Absence of the top-level final workflow verification is not a migration blocker, finding, accepted risk, or deferred migration action.

## Migration record

```text
# <Component> migration

Status: complete | partial | blocked | stale
DESIGN.md reference:
ARCHITECTURE.md reference:
IMPLEMENTATION.md reference:
Migration workspace state: <consumer/runtime/artifact state reviewed>

## Consumer inventory
## Migrated consumers
## Preserved scenarios and failure paths
## Legacy ownership removed
## Proof completed
## Migration-stage verification
## Remaining migration blockers
## Review readiness
```

## Completion gate

Migration is `complete` only when:

- every architecture-listed consumer is migrated or explicitly confirmed not applicable;
- all materially distinct scenarios and failure paths are verified;
- obsolete target ownership is removed without aliases unless architecture requires them;
- no renderer detail leaks into consumers;
- migration-scoped focused verification passes, or its exact project-command blocker is recorded and migration remains blocked only on that stage-owned proof;
- the resulting family is ready for independent review.

Do not keep migration `partial` or `blocked` merely because the orchestrator has not yet run the final workflow verification.

Operator visual/motion status is an external defect-reporting channel, not a positive-acknowledgement gate owned by migration; record the actual status without fabricating a report that was not made.

## Report

```text
MATERIAL MIGRATION RESULT
Input artifact:
Resolved component/family:
Prerequisite statuses:
MIGRATION.md path:
Consumers inventoried:
Consumers migrated:
Preserved scenarios:
Legacy ownership removed:
Proof completed:
Migration-stage verification:
Operator visual status: no-reported-defect | defect-reported | not-applicable
Review readiness: ready | blocked
Status: complete | partial (<exact remainder>) | blocked (<exact reason>)
```

## Forbidden

- Changing the official design artifact.
- Inventing or revising public API, ownership, token selection, or renderer strategy.
- Adding consumer-specific hacks inside the canonical component.
- Accessing raw renderer or private tokens from consumers.
- Migrating unrelated Material families for cleanup.
- Keeping replaced logic only to reduce migration work.
- Running independent review in the same worker context.
- Running, deferring, or claiming ownership of the top-level final workflow verification.
- Recording a not-yet-run top-level final gate as a migration blocker, finding, risk, or next action.
