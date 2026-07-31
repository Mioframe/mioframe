---
name: material-component-implementation
description: 'Use after current DESIGN.md and ready ARCHITECTURE.md exist to implement the canonical family component, tokens, tests, stories, exports, and renderer integration without migrating consumers or changing architecture.'
---

# Material component implementation

Implement one Material family strictly from its accepted architecture and return control to the orchestrator.

This stage owns canonical component code and component-owned focused proof. It does not own official research, architecture changes, product-consumer migration, independent review, or final workflow verification.

## Input gate

Require successful control fields in:

```text
src/shared/ui/material/components/<family>/DESIGN.md
src/shared/ui/material/components/<family>/ARCHITECTURE.md
```

Design must be `current`. Architecture must be `ready`, reference that design, have no blockers or return stage, and declare `Implementation readiness: ready`.

If an input is invalid, write or refresh `IMPLEMENTATION.md` as blocked, record the earliest `Required return stage`, and return without production edits.

## Worker boundary

Run in a fresh isolated worker context.

Use task-relevant readable workspace files, applicable rules, canonical upstream artifacts, exact renderer package artifacts, and documented project commands. Do not depend on Git history, diff, branch, worktree/index state, commit identifiers, pull-request metadata, or external checks.

Do not redesign the API, ownership, dependencies, token selection, renderer strategy, gap strategy, or proof ownership while coding.

## Mandatory preflight

Before production edits, run `implementation-preflight` using current `DESIGN.md` and ready `ARCHITECTURE.md` as the deterministic authoring contract.

Preflight must resolve:

- exact files and ordered implementation passes;
- implementation-owned `TEST IMPACT`;
- focused verifier labels and scopes;
- preserved public contracts and consumers that must not change;
- architecture or dependency blocker, if one exists.

Do not use preflight to reopen accepted architecture.

## Output

Primary output may include:

- canonical Vue adapter code;
- family-local renderer typing and mappings;
- selected family tokens and public catalogue entries;
- component tests, stories, browser/visual proof, and defect records;
- canonical exports;
- removal of obsolete code owned by the same family.

Write exactly one implementation handoff:

```text
src/shared/ui/material/components/<family>/IMPLEMENTATION.md
```

Its control fields are:

```text
Status: complete | partial | stale | blocked
DESIGN.md reference: <path>
ARCHITECTURE.md reference: <path>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return stage: none | design | architecture | implementation
Architecture deviations: none | <exact deviations>
Migration readiness: ready | blocked
```

Do not append prose to enum values.

## Implementation rules

- Implement only the selected architecture surface.
- Use official Material terminology and Vue mechanics specified by architecture.
- Keep public types independent from the renderer.
- Derive private glue from package-exported renderer types.
- Keep renderer imports, tags, events, types, and private CSS inputs inside the owning family.
- Use only architecture-approved wrapper corrections and controlled workarounds.
- Do not access private shadow DOM or recreate renderer-owned state, ripple, focus, geometry, accessibility, elevation, or motion.
- Implement every selected state precedence and restoration path.
- Complete official dependencies independently before parent composition.
- Add no compatibility alias unless architecture explicitly requires it.

When the only root is a raw `m3e-*` custom element:

- set `inheritAttrs: false`;
- forward exactly the architecture-approved positive allow-list;
- do not mutate Vue `$attrs`;
- do not forward undeclared `on*` listeners;
- ensure adapter-owned properties win over consumer conflicts.

## Token rules

- Implement only tokens selected by architecture from the complete design catalogue.
- Keep one family owner and update `docs/token-api.md` atomically with declarations.
- Preserve exact official state/part naming.
- Implement every required renderer input and fallback.
- Do not publish unconsumed parts or mirror renderer defaults for completeness.
- Prove computed rendered results where architecture selects contextual appearance.

## Focused proof

Implement the implementation-owned `TEST IMPACT` through the lowest faithful owners, which may include:

- colocated Vue contract tests;
- package-derived type-check;
- browser native/accessibility behavior;
- component-owned visual baselines;
- renderer-boundary and token agreement checks;
- dependency standalone and parent-handoff proof;
- risk-specific tests selected by architecture.

Visual tests capture deterministic presentation; behavior tests own interaction success criteria.

Run only verifier-managed focused implementation checks. Do not run or defer the top-level final workflow verification.

## Semantic routing

If implementation evidence invalidates official design or accepted architecture:

- do not patch around it;
- set the earliest `Required return stage` to `design` or `architecture`;
- record the exact blocker;
- stop production edits and return.

If a component-owned implementation or proof issue remains, use return stage `implementation`.

## Completion

Use `Status: complete` only when:

- every architecture implementation pass is complete;
- code, tokens, mappings, defects, tests, stories, and exports agree;
- focused implementation verification passes;
- `Architecture deviations: none`;
- `Remaining blockers: none`;
- `Required return stage: none`;
- `Migration readiness: ready`.

A warning introduced by current work, missing required proof, or failed focused check is not an accepted risk and cannot produce `complete`.

Do not migrate product consumers in this stage.

## Report

```text
MATERIAL IMPLEMENTATION RESULT
Input component:
Canonical family:
Input artifact statuses:
IMPLEMENTATION.md path:
Preflight result:
Implemented passes:
Public API implemented:
Tokens and mappings implemented:
Dependencies completed:
Focused proof completed:
Implementation-stage verification:
Architecture deviations: none | <details>
Remaining blockers: none | <details>
Required return stage: none | design | architecture | implementation
Migration readiness: ready | blocked
Status: complete | blocked
```

## Forbidden

- Changing architecture while coding.
- Migrating product consumers or removing consumer-facing legacy ownership.
- Expanding API, tokens, abstractions, or renderer support beyond architecture.
- Updating visual baselines without inspection.
- Running migration or review in this context.
- Running, deferring, or claiming ownership of final workflow verification.
- Recording the pending final command as a blocker, risk, or next action.
- Depending on Git or PR state.
