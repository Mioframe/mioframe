---
name: material-component-implementation
description: 'Use after current DESIGN.md and implementation-ready ARCHITECTURE.md exist to implement the canonical family component, tokens, tests, stories, exports, and renderer integration without migrating consumers or changing architecture.'
---

# Material component implementation

Implement one Material family strictly from its accepted architecture and return control to the orchestrator.

This stage owns canonical component code and component-owned focused proof. It does not own official research, architecture changes, product-consumer migration, independent review, or final workflow verification.

## Input gate

Require mechanically valid and successful:

```text
src/shared/ui/material/components/<family>/DESIGN.md
src/shared/ui/material/components/<family>/ARCHITECTURE.md
```

Design must be `current` and not refresh-due. Architecture must be `ready`, reference that design, record the current lockfile-resolved renderer revision, have queue `none`, no blockers or return target, and declare `Implementation readiness: ready`.

If an input is invalid, write or refresh `IMPLEMENTATION.md` as blocked, record the exact earliest return family and stage, and return without production edits.

## Worker boundary

Run in a fresh isolated worker context.

Use task-relevant readable workspace files, applicable rules, canonical upstream artifacts, exact renderer package artifacts, and documented project commands. Do not depend on Git history, diff, branch, worktree/index state, commit identifiers, pull-request metadata, or external checks.

Do not redesign API, ownership, dependencies, token selection, renderer strategy, gap strategy, or proof ownership while coding.

## Mandatory preflight

Before production edits, run `implementation-preflight` using current design and implementation-ready architecture as the deterministic contract.

Preflight resolves:

- exact files and ordered implementation passes;
- implementation-owned `TEST IMPACT`;
- focused verifier labels and scopes;
- preserved public contracts and consumers that must not change;
- architecture or dependency blocker, if one exists.

Do not use preflight to reopen accepted architecture.

## Output

Primary output may include canonical Vue adapter code, family-local renderer typing and mappings, selected family tokens, component tests/stories/browser or visual proof, defect records, exports, and removal of obsolete code owned by the same family.

Write exactly:

```text
src/shared/ui/material/components/<family>/IMPLEMENTATION.md
```

Control fields:

```text
Status: complete | partial | stale | blocked
DESIGN.md reference: <path>
ARCHITECTURE.md reference: <path>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Architecture deviations: none | <exact deviations>
Migration readiness: ready | blocked
```

Required headings:

```text
## Implemented passes
## Public API implemented
## Tokens and renderer mappings
## Dependencies
## Component-owned proof
## Stage verification
## Architecture deviations
## Remaining blockers
## Migration readiness
```

Use every heading. Record explicit `none` where applicable.

## Implementation rules

- Implement only the selected architecture surface.
- Use official Material terminology and Vue mechanics specified by architecture.
- Keep public types independent from renderer.
- Derive private glue from package-exported renderer types.
- Keep renderer imports, tags, events, types, and private CSS inputs inside the owner.
- Use only approved wrapper corrections and controlled workarounds.
- Revalidate implementation against the architecture renderer revision.
- Do not access private shadow DOM or recreate renderer-owned state, ripple, focus, geometry, accessibility, elevation, or motion.
- Implement every selected precedence and restoration path.
- Compose dependencies only through their completed public API.
- Add no compatibility alias unless architecture requires it.

When the only root is a raw `m3e-*` element:

- set `inheritAttrs: false`;
- forward exactly the architecture-approved positive allow-list;
- do not mutate Vue `$attrs`;
- do not forward undeclared `on*` listeners;
- ensure adapter-owned properties win over consumer conflicts.

## Token rules

- Implement only architecture-selected tokens from the complete design catalogue.
- Keep one family owner and update `docs/token-api.md` atomically with declarations.
- Preserve exact official state/part naming.
- Implement every required renderer input and fallback.
- Do not publish unconsumed parts or mirror renderer defaults.
- Prove computed rendered results for selected contextual appearance.

## Focused proof

Implement the implementation-owned `TEST IMPACT` through the lowest faithful owners, which may include:

- colocated Vue contract tests;
- package-derived type-check;
- browser native/accessibility behavior;
- component-owned visual baselines;
- renderer-boundary and token agreement checks;
- dependency standalone and parent-handoff proof;
- risk-specific tests selected by architecture.

Run only verifier-managed focused implementation checks. Do not run or defer top-level final workflow verification.

## Semantic routing

When evidence invalidates design, architecture, or a dependency:

- do not patch around it;
- set the exact owning family (`self` or canonical dependency family);
- set the earliest owning stage;
- record the blocker;
- stop production edits and return.

Use `self/implementation` for remaining component-owned implementation or proof work.

## Completion

Use `Status: complete` only when:

- every architecture pass is complete;
- code, tokens, mappings, defects, tests, stories, and exports agree;
- focused verification passes;
- every required heading exists;
- architecture deviations and blockers are `none`;
- both return fields are `none`;
- migration readiness is `ready`.

A current warning, missing proof, failed check, or renderer-revision uncertainty cannot produce `complete`.

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
Focused proof completed:
Implementation-stage verification:
Architecture deviations: none | <details>
Remaining blockers: none | <details>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Migration readiness: ready | blocked
Status: complete | blocked
```

## Forbidden

- Changing architecture while coding.
- Migrating product consumers or removing consumer-facing legacy ownership.
- Expanding API, tokens, abstractions, or renderer support beyond architecture.
- Updating visual baselines without inspection.
- Omitting required handoff sections.
- Running migration or review in this context.
- Running, deferring, or claiming final workflow verification.
- Depending on Git or PR state.
