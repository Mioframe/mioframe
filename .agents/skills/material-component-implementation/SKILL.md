---
name: material-component-implementation
description: 'Use only after a current family DESIGN.md and ready ARCHITECTURE.md exist to implement the canonical MD* adapter, family tokens, tests, stories, exports, and renderer integration without migrating product consumers or changing architecture.'
---

# Material component implementation

Implement one Material family strictly from its accepted architecture handoff.

This stage owns canonical component code and component-owned proof. It does not own official research, architecture invention, or product-consumer migration.

## Input gate

Require:

```text
src/shared/ui/material/components/<family>/DESIGN.md
src/shared/ui/material/components/<family>/ARCHITECTURE.md
```

The design status must be `current`; the architecture status must be `ready` and reference that design revision.

Stop and route backward when:

- `DESIGN.md` is missing, stale, blocked, or incomplete;
- `ARCHITECTURE.md` is missing, stale, blocked, inconsistent with design, or leaves a coding decision open;
- a required dependency implementation is incomplete;
- implementation evidence invalidates an architecture assumption.

Do not silently revise architecture while coding.

## Output

Primary implementation result:

- canonical Vue adapter code;
- family-local renderer typing and mappings;
- selected family tokens and catalogue entries;
- family-owned tests, stories, browser/visual proof, and defect records;
- canonical exports;
- removal of obsolete code owned by the same family only;
- one durable record:

```text
src/shared/ui/material/components/<family>/IMPLEMENTATION.md
```

Do not migrate application consumers or remove legacy consumer-facing owners in this stage. That belongs to `material-component-migration`.

## Read first

- applicable `AGENTS.md` files;
- family `DESIGN.md` and `ARCHITECTURE.md`;
- Material token, renderer-boundary, testing, and verification rules;
- exact lockfile-resolved renderer public artifacts;
- existing family code, tests, stories, tokens, exports, and defect records;
- required dependency implementation records.

The coding worker must not reselect demand, redesign the API, change ownership, or choose another gap strategy.

## Workspace boundary

Use only readable files, file-oriented tools, and documented project commands.

Do not inspect hidden workspace metadata or unrelated environment internals. If a project command fails before reaching its relevant check, complete otherwise safe implementation work and record the exact command failure as remaining verification.

## Implementation rules

- Implement only the selected surface in `ARCHITECTURE.md`.
- Use official Material terminology and Vue mechanics exactly as specified.
- Keep public types independent from the renderer and derive private glue from package-exported types.
- Keep renderer imports, tags, events, types, and CSS inputs inside the canonical family.
- Use only approved wrapper corrections and exact-version workarounds.
- Do not access private shadow DOM or recreate renderer-owned state, ripple, focus, geometry, accessibility, elevation, or motion systems.
- Implement all selected state precedence and restoration paths.
- Complete official dependencies independently before parent composition.
- Add no compatibility alias unless the architecture explicitly requires one.

## Token implementation

- Implement only tokens selected by `ARCHITECTURE.md` from the complete `DESIGN.md` catalogue.
- Keep one family owner and update `docs/token-api.md` atomically with declarations.
- Preserve exact official state/part naming.
- Implement every renderer input and fallback required by the accepted state/part trace.
- Do not publish unconsumed parts or mirror renderer defaults for completeness.
- Prove computed rendered results where the architecture requires contextual appearance.

## Proof ownership

Implement the `TEST IMPACT` from `ARCHITECTURE.md` through faithful owners:

- colocated Vue contract tests;
- package-derived type-check;
- browser native/accessibility behavior;
- component-owned visual baselines for stable presentation;
- renderer-boundary and token agreement checks;
- dependency standalone proof and parent handoff proof;
- risk-specific tests explicitly selected by architecture.

Visual tests may prepare deterministic states and capture pixels, but behavioral success criteria remain in behavior tests.

## Implementation record

`IMPLEMENTATION.md` is a concise handoff, not duplicated architecture or code documentation:

```text
# <Component> implementation

Status: complete | partial | blocked | stale
DESIGN.md reference:
ARCHITECTURE.md reference:
Implementation workspace state: <canonical files and artifact statuses reviewed>

## Implemented passes
## Public API implemented
## Tokens and renderer mappings implemented
## Dependencies completed
## Proof completed
## Verification performed
## Architecture deviations
## Remaining implementation blockers
## Migration readiness
```

`Architecture deviations` must be `none` for a complete result. If a deviation is required, stop and return to `material-component-architecture`.

## Verification

Run focused feedback during implementation and the exact implementation-stage scope required by root verification policy.

Do not claim full component completion: product migration, final verification, operator visual acceptance, and independent review belong to later stages.

## Completion gate

Implementation is `complete` only when:

- every architecture implementation pass is done;
- family and dependency code is canonical and exported;
- selected tokens, mappings, defects, tests, stories, and proof agree;
- no architecture deviation exists;
- focused verification passes, or its exact project-command blocker is recorded after implementation work is complete;
- the public component is ready for consumer migration.

## Report

```text
MATERIAL IMPLEMENTATION RESULT
Input artifact:
Resolved component/family:
DESIGN.md status:
ARCHITECTURE.md status:
IMPLEMENTATION.md path:
Implemented passes:
Public API implemented:
Tokens and mappings implemented:
Dependencies completed:
Proof completed:
Verification:
Architecture deviations: none | <details>
Migration readiness: ready | blocked
Status: complete | partial (<exact remainder>) | blocked (<exact reason>)
```

## Forbidden

- Researching or rewriting the official design contract.
- Inventing or changing architecture during implementation.
- Migrating product consumers or deleting consumer-facing legacy ownership.
- Expanding API, tokens, abstractions, or renderer support beyond `ARCHITECTURE.md`.
- Updating visual baselines without inspection.
- Treating automated checks as migration or review completion.
- Running the migration or review stage in the same worker context.
- Inspecting hidden workspace metadata or unrelated environment internals.
