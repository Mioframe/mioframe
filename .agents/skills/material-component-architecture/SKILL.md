---
name: material-component-architecture
description: 'Use after a current complete family DESIGN.md exists to create or refresh demand-scoped ARCHITECTURE.md without editing production code or migrating consumers.'
---

# Material component architecture

Resolve one deterministic implementation architecture from the current official design contract and return control to the orchestrator.

This stage owns demand selection, public contract, ownership, dependencies, renderer strategy, proof ownership, and migration plan. It does not own production edits, migration execution, review, or final workflow verification.

## Input gate

Require current successful `DESIGN.md`.

Read the current design directly. Do not require or compare a design-contract revision identity.

If DESIGN is incomplete or mechanically invalid, write architecture as blocked when possible and route to `self/design`. Do not repair design in this worker.

## Worker boundary

Run in a fresh isolated context. Use task-relevant workspace files, applicable rules, exact renderer package artifacts, active dependency path when provided, and documented commands. Do not depend on Git, PR, commit, or external-check state.

Treat code, tests, stories, and README files as implementation evidence, not architecture authority.

Before selecting proof placement or impact ownership, read current `docs/testing/migration-plan.md`.

## Output

Write exactly:

```text
src/shared/ui/material/components/<family>/ARCHITECTURE.md
```

Control fields:

```text
Status: ready | blocked
DESIGN.md reference: <path>
Renderer revision: @m3e/web@<lockfile-resolved-version>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Implementation readiness: ready | awaiting-dependencies | blocked
Dependency families: none | <canonical-family>[; <canonical-family>...]
Dependency queue: none | <canonical-family>[; <canonical-family>...]
```

Do not create artifact timestamps, hashes, dependency-review revision identities, or other persistent freshness bookkeeping.

Legacy revision fields in an existing ARCHITECTURE are ignored and removed when this stage rewrites the file.

This architecture stage always executes fresh for the current Material invocation.

## Scenario selection

Use confirmed product scenarios when consumers exist.

When no consumer exists, establish one approved library scenario:

- implement the unambiguous official standalone default;
- expose only API required to render and accessibly operate it;
- expose only mandatory controllable state belonging to that default;
- do not add selection/value/open-state contracts unless required by the selected default;
- include disabled behavior only when official Material supports it for that default;
- defer optional variants, sizes, shapes, configurations, and state models;
- do not expose renderer capability merely because it exists;
- do not invent product scenarios or create a product consumer.

Ask the operator only when official sources define no standalone default or multiple materially different public models.

## Required decisions

Resolve completely:

1. goal and non-goals;
2. product or approved no-consumer scenarios and failure paths;
3. selected and deferred official surface;
4. direct dependency set and current-invocation dependency queue;
5. ownership of composition, product state, renderer behavior, and gaps;
6. complete public Vue API and state precedence/restoration;
7. for every controlled renderer-backed state, exact transition timeline from `docs/component-adapter.md` including accepted and rejected intent;
8. selected public token contract;
9. renderer mappings, fallbacks, and coverage;
10. one owner for every renderer gap;
11. deterministic implementation passes;
12. implementation and migration `TEST IMPACT` using current executable testing ownership;
13. consumer inventory, migration order, legacy proof disposition, and every legacy-to-canonical semantic translation including capability/configuration versus current-state meaning and defaults/fallbacks;
14. acceptance criteria, risks, forbidden approaches, and simplest viable alternative;
15. implementation readiness.

No coding decision may remain for implementation.

## Dependency rules

Record every direct dependency in `Dependency families`.

Put a dependency in `Dependency queue` when it must be processed through the Material pipeline before parent implementation can proceed in the current invocation.

Do not persist dependency review revision identities. After queued dependencies complete through independent review, the orchestrator reruns parent architecture fresh and the worker validates current dependency public contracts directly.

Self-dependency and dependencies already present in the active path are forbidden.

When queue is non-empty, use:

```text
Status: ready
Implementation readiness: awaiting-dependencies
Remaining blockers: none
Required return family: none
Required return stage: none
```

When queue is empty and architecture is complete, use readiness `ready`.

## Public and renderer boundary

- Derive public semantics from design, approved scenarios, and Vue mechanics.
- Do not derive public API or token names from renderer or legacy vocabulary.
- Select the minimum complete current surface.
- Keep renderer details private.
- Define precedence and restoration for every selected state combination.
- Inspect exact installed renderer lifecycle for mutable state; post-mutation emit alone is insufficient when rejected intent can drift.
- Do not infer legacy/canonical equivalence from prop-name similarity.
- When effective consumer state includes defaults/fallbacks, define translation from effective value.
- Do not add adjacent surface for symmetry or future flexibility.

For contextual tokens record:

```text
DESIGN.md official path
  → public Mioframe token
  → renderer input
  → renderer fallback
  → expected result
  → proof owner
```

## Proof ownership

Implementation owns component, renderer-boundary, token, browser, visual, and component-risk proof.

Migration owns consumers, product scenarios or explicit no-consumer proof, legacy removal, and impact metadata.

For controlled state, implementation proof must include rejected intent. For presentation composition, browser proof must cover child suppression and positive handoff to the actual action owner.

For semantic consumer translations, migration proof must cover boundary combinations that distinguish old and canonical meaning, including defaults/fallbacks where applicable.

Review independently evaluates the complete result. The outer orchestrator owns final verification.

## Required sections

```text
## Goal
## Non-goals
## Current scenarios
## Selected and deferred Material surface
## Dependency closure
## Ownership
## Public Vue API
## Public token contract
## Renderer mapping and gaps
## State precedence and restoration
## Implementation passes
## TEST IMPACT
## Migration plan
## Acceptance criteria
## Risks
## Forbidden
## Implementation readiness
```

## Terminal-state rules

### Success

Return `Status: ready` only when architecture is fully resolved.

- readiness `awaiting-dependencies` requires a non-empty queue;
- readiness `ready` requires queue `none`;
- blockers and route are `none`.

### Earlier-stage or cross-family correction

Use `Status: blocked` with an exact route only when correction belongs to `self/design` or another family/stage.

### Genuine blocker

If an architecture decision owned by this stage remains unresolved after available evidence is exhausted, return:

```text
Status: blocked
Implementation readiness: blocked
Remaining blockers: <exact unresolved decision>
Required return family: none
Required return stage: none
```

Do not return `self/architecture`.

A fixable architecture omission, dependency error, route error, or document-format defect must be corrected before returning.

Return after writing the artifact. Do not implement in this context.

## Report

```text
MATERIAL ARCHITECTURE RESULT
Input component:
Canonical family:
ARCHITECTURE.md path:
Renderer revision:
Active dependency path: none | <path>
Detected dependency cycle: none | <path>
Selected and deferred surface:
Dependency families:
Dependency queue:
Public Vue API:
Selected public tokens:
Renderer coverage and gaps:
Implementation passes:
Migration scope:
Remaining blockers: none | <details>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Architecture status: ready | blocked
Implementation readiness: ready | awaiting-dependencies | blocked
Status: complete | blocked
```

## Forbidden

- Returning `self/architecture`.
- Leaving a current-stage fixable architecture defect unresolved.
- Editing official design, production code, proof, exports, or consumers.
- Leaving coding decisions to implementation.
- Using dependency gates or cyclic dependencies.
- Persisting dependency-review revision identities.
- Inventing product demand or renderer-derived APIs.
- Calling post-mutation renderer state controlled without proving rejected intent cannot drift.
- Mapping legacy consumer state by prop-name similarity.
- Copying obsolete test-placement patterns.
- Adding speculative APIs, abstractions, compatibility paths, workflow hashes, timestamps, or renderer exposure.
- Depending on Git or PR state.
