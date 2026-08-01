---
name: material-component-implementation
description: 'Use after current DESIGN.md and ready ARCHITECTURE.md exist to implement the canonical family component, tokens, proof, stories, exports, and renderer integration without migrating consumers or changing architecture.'
---

# Material component implementation

Implement one Material family strictly from its current architecture and return control to the orchestrator.

This stage owns canonical component code and component-owned focused proof. It does not own official research, architecture, product-consumer migration, independent review, or final workflow verification.

## Input gate

Require successful current artifacts:

```text
src/shared/ui/material/components/<family>/DESIGN.md
src/shared/ui/material/components/<family>/ARCHITECTURE.md
```

Architecture must reference the exact current design revision, match the lockfile-resolved renderer revision, have dependency queue `none`, and declare implementation readiness `ready`.

If an input is invalid, write implementation as blocked, record the current architecture revision when available, set the exact earliest return family and stage, and return without production edits.

## Worker boundary

Run in a fresh isolated worker context.

Use task-relevant readable workspace files, applicable rules, canonical upstream artifacts, exact renderer package artifacts, and documented project commands. Do not depend on Git, PR, commit, or external-check state.

Do not redesign API, ownership, dependencies, token selection, renderer strategy, gap strategy, or proof ownership while coding.

## Mandatory preflight

Before production edits, run `implementation-preflight` using current design and architecture as the deterministic authoring contract.

Preflight resolves:

- exact files and ordered implementation passes;
- implementation-owned `TEST IMPACT`;
- focused verifier labels and scopes;
- preserved public contracts and consumers that must not change;
- an upstream or dependency blocker, if one exists.

Do not use preflight to reopen accepted architecture.

## Output

Primary output may include canonical Vue adapter code, family-local renderer typing and mappings, selected tokens and catalogue entries, component proof, stories, exports, defect records, and removal of obsolete code owned by the same family.

Write exactly:

```text
src/shared/ui/material/components/<family>/IMPLEMENTATION.md
```

Control fields:

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
Status: complete | partial | stale | blocked
ARCHITECTURE.md reference: <path>
ARCHITECTURE.md revision: <exact Artifact revision>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Architecture deviations: none | <exact deviations>
Migration readiness: ready | blocked
```

Use a new artifact revision whenever implementation content or its proof record changes. Record the exact architecture revision used for the implementation.

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

## Implementation rules

- Implement only the selected architecture surface.
- Keep public terminology and types independent from the renderer.
- Derive private glue from package-exported renderer types.
- Keep renderer details inside the owning family.
- Use only architecture-approved wrapper corrections and controlled workarounds.
- Do not inspect private shadow DOM or recreate renderer-owned state, ripple, focus, geometry, accessibility, elevation, or motion.
- Implement selected precedence and restoration paths.
- Consume official dependencies only through their current canonical public APIs.
- Add no compatibility alias unless architecture requires it.

When the only root is a raw `m3e-*` element:

- set `inheritAttrs: false`;
- forward only the architecture-approved positive allow-list;
- do not mutate Vue `$attrs`;
- do not forward undeclared `on*` listeners;
- ensure adapter-owned bindings win over consumer conflicts.

## Token rules

- Implement only tokens selected from design by architecture.
- Keep one family owner and update `docs/token-api.md` atomically with declarations.
- Preserve exact official state/part naming.
- Implement required renderer inputs and fallbacks.
- Do not publish unconsumed parts or mirror renderer defaults for completeness.
- Prove computed rendered results where architecture selects contextual appearance.

## Focused proof

Implement the component-owned `TEST IMPACT` through the lowest faithful owners, including contract, package-derived type, browser/accessibility, visual, renderer-boundary, token, dependency-composition, and risk-specific proof as applicable.

Run verifier-managed focused implementation checks only. Do not run or defer final workflow verification.

## Semantic routing

If evidence invalidates official design, architecture, or a dependency family:

- do not patch around it;
- set the exact earliest return family and stage;
- record the blocker;
- stop production edits and return.

Use `self/implementation` for remaining component-owned implementation or proof defects.

## Completion

Use status `complete` only when:

- `ARCHITECTURE.md revision` equals the current architecture artifact revision;
- every implementation pass is complete;
- code, tokens, mappings, defects, proof, stories, and exports agree;
- focused verification passes;
- architecture deviations and blockers are `none`;
- return target is `none`;
- migration readiness is `ready`;
- every required heading exists.

Do not migrate product consumers in this stage.

## Report

```text
MATERIAL IMPLEMENTATION RESULT
Input component:
Canonical family:
ARCHITECTURE.md revision:
IMPLEMENTATION.md path:
Artifact revision:
Preflight result:
Implemented passes:
Public API implemented:
Tokens and mappings implemented:
Dependencies consumed:
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
- Migrating product consumers.
- Expanding API, tokens, abstractions, or renderer support beyond architecture.
- Updating visual baselines without inspection.
- Running migration or review in this context.
- Running or claiming final workflow verification.
- Reusing an artifact revision after content changed.
- Recording the pending final command as a blocker or risk.
- Depending on Git or PR state.
