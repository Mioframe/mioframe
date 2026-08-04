---
name: material-component-implementation
description: 'Use after current DESIGN.md and ready ARCHITECTURE.md exist to implement the canonical family component, tokens, proof, stories, exports, and renderer integration without migrating consumers or changing architecture.'
---

# Material component implementation

Implement one Material family strictly from its current architecture and return control to the orchestrator.

This stage owns canonical component code and component-owned focused proof. It does not own official research, architecture, consumer migration, independent review, or final workflow verification.

## Input gate

Require successful current design and architecture artifacts.

Architecture must reference the exact current design contract revision, match the lockfile-resolved renderer revision, have dependency queue `none`, current dependency review revisions, and readiness `ready`.

If an input is invalid, write implementation as blocked, set the exact earlier-stage or other-family route, and return without production edits.

## Worker boundary

Run in a fresh isolated context.

Use task-relevant workspace files, applicable rules, canonical artifacts, exact renderer package artifacts, and documented commands. Do not depend on Git, PR, commit, or external-check state.

Do not redesign API, ownership, dependencies, token selection, renderer strategy, gap strategy, or proof ownership while coding.

## Mandatory preflight

Before production edits, run `implementation-preflight` using current design and architecture.

Preflight resolves exact files, ordered passes, implementation-owned `TEST IMPACT`, focused verifier scopes, preserved contracts, and upstream blockers. It does not reopen architecture.

## Output

Write exactly:

```text
src/shared/ui/material/components/<family>/IMPLEMENTATION.md
```

Control fields:

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
Status: complete | stale | blocked
ARCHITECTURE.md reference: <path>
ARCHITECTURE.md revision: <exact Artifact revision>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Architecture deviations: none | <exact deviations>
Migration readiness: ready | blocked
```

`stale` is an external pre-run marker. This worker may finish only with `complete` or `blocked`.

Use a new artifact revision whenever implementation content or its proof record changes.

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
- Consume dependencies only through current canonical public APIs.
- Add no compatibility alias unless architecture requires it.

When the only root is a raw `m3e-*` element:

- set `inheritAttrs: false`;
- forward only the approved positive allow-list;
- do not mutate Vue `$attrs`;
- do not forward undeclared `on*` listeners;
- ensure adapter-owned bindings win over consumer conflicts.

## Token rules

- Implement only tokens selected by architecture.
- Keep one family owner and update `docs/token-api.md` atomically with declarations.
- Preserve exact official state/part naming.
- Implement required renderer inputs and fallbacks.
- Do not publish unconsumed parts or mirror renderer defaults for completeness.
- Prove computed rendered results where contextual appearance is selected.

## Focused proof

Complete implementation-owned `TEST IMPACT` through faithful contract, type, browser/accessibility, visual, renderer-boundary, token, dependency-composition, and risk-specific proof as applicable.

Run verifier-managed focused implementation checks only. Do not run or defer final workflow verification.

## Terminal-state rules

### Success

Return `Status: complete` only when every implementation pass and focused check is complete, the architecture revision is current, deviations and blockers are `none`, route is `none/none`, and migration readiness is `ready`.

### Earlier-stage or cross-family correction

Return `Status: blocked` with an exact route only when correction belongs to:

- `self/design`;
- `self/architecture`; or
- another family’s design, architecture, implementation, or migration stage.

### Current-stage defect

A component-owned implementation, token, mapping, export, story, test, or focused-proof defect must be corrected in this worker.

If it remains impossible after available implementation mechanisms are exhausted, return:

```text
Status: blocked
Remaining blockers: <exact blocker>
Required return family: none
Required return stage: none
Migration readiness: blocked
```

Do not return `self/implementation` and do not return `partial`.

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

- Returning `partial` or terminal `stale`.
- Returning `self/implementation`.
- Leaving a current-stage fixable defect unresolved.
- Changing architecture while coding.
- Migrating product consumers.
- Expanding API, tokens, abstractions, or renderer support beyond architecture.
- Updating visual baselines without inspection.
- Running migration, review, or final workflow verification.
- Recording the pending final command as a blocker or risk.
- Depending on Git or PR state.
