---
name: material-component-architecture
description: 'Use after a current complete family DESIGN.md exists to create or refresh the demand-scoped ARCHITECTURE.md without editing production code or migrating consumers.'
---

# Material component architecture

Resolve one deterministic implementation architecture from the current official design contract and return control to the orchestrator.

This stage owns demand selection, public contract, ownership, dependencies, renderer strategy, proof ownership, and migration plan. It does not own production edits, migration execution, review, or final workflow verification.

## Input gate

Require current successful `DESIGN.md` with a non-`none` design contract revision.

If design is invalid, write architecture as blocked when possible, record the current design contract revision, route to `self/design`, and return.

## Worker boundary

Run in a fresh isolated context. Use task-relevant workspace files, applicable rules, exact renderer package artifacts, active dependency path when provided, and documented commands. Do not depend on Git, PR, commit, or external-check state.

Treat code, tests, stories, and README files as implementation evidence, not architecture authority.

## Output

Write exactly:

```text
src/shared/ui/material/components/<family>/ARCHITECTURE.md
```

Control fields:

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
Status: ready | stale | blocked
DESIGN.md reference: <path>
DESIGN.md contract revision: <exact Design contract revision>
Renderer revision: @m3e/web@<lockfile-resolved-version>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Implementation readiness: ready | awaiting-dependencies | blocked
Dependency families: none | <canonical-family>[; <canonical-family>...]
Dependency queue: none | <canonical-family>[; <canonical-family>...]
Dependency review revisions: none | <canonical-family>=<REVIEW Artifact revision>[; <canonical-family>=<REVIEW Artifact revision>...]
```

Use a new artifact revision whenever architecture changes or is revalidated after a design-contract, dependency, or renderer change.

A metadata-only design refresh with unchanged design contract revision does not require architecture rewrite.

Dependency entries are exact family path segments, unique, ordered, and separated by `; `.

## Scenario selection

Use confirmed product scenarios when consumers exist.

When no current consumer exists, the explicit invocation establishes one approved library scenario:

- implement the unambiguous official standalone default;
- expose only the API required to render and accessibly operate that default;
- expose only mandatory official controllable state belonging to the selected default;
- do not add `v-model`, selection, toggle, value, or open-state contracts unless that state is part of the selected official default;
- include disabled behavior only when official Material supports it for that default;
- include mandatory semantics, accessibility, states, and proof;
- defer optional variants, sizes, shapes, configurations, and state models;
- do not expose m3e capability merely because it exists;
- do not invent product scenarios or create a product consumer.

Ask the operator only when official sources define no standalone default or multiple materially different public models.

## Required decisions

Resolve:

1. goal and non-goals;
2. confirmed product scenarios or approved no-consumer library scenario;
3. selected and deferred official surface;
4. complete direct dependency set, pending queue, and current dependency review revisions;
5. ownership of parent composition, dependency behavior, product state, renderer behavior, and gaps;
6. complete public Vue API and precedence/restoration;
7. selected public token contract;
8. renderer mapping, fallbacks, and coverage;
9. one owner for every renderer gap;
10. deterministic implementation passes;
11. implementation and migration `TEST IMPACT`;
12. consumer inventory and migration pass order;
13. acceptance criteria, risks, forbidden approaches, and simplest viable alternative;
14. implementation readiness.

No coding decision may remain for implementation.

## Dependency rules

A required official dependency is a first-class family.

Record every direct dependency in `Dependency families`.

For each dependency:

- if it lacks successful current independent review, put it in `Dependency queue`;
- otherwise record its exact current `REVIEW.md` artifact revision in `Dependency review revisions`.

Queue and revision entries must be disjoint and their union must equal dependency families.

Do not use dependency stage gates.

Self-dependency is forbidden.

When an active dependency path is provided, every dependency already present in that path is forbidden. Do not emit a dependency that closes a cycle.

If the orchestrator provides a detected path such as:

```text
button → loadingIndicator → button
```

inspect the family that emitted the repeated dependency and correct dependency ownership or composition. If the cycle cannot be removed without an unresolved architecture decision, use status `blocked`, route to `self/architecture`, and record the exact cycle and decision.

Do not route to another family merely to continue traversing the same cycle.

When queue is non-empty:

- use status `ready`;
- use readiness `awaiting-dependencies`;
- keep blockers and return target `none`;
- return so the orchestrator can run every queued dependency through its complete pipeline.

After dependencies are current, architecture runs again. Revalidate public handoffs, preserve or recompute dependency families, clear or recompute the queue, and record exact review revisions.

A later change to any recorded dependency review revision invalidates parent architecture mechanically.

## Public boundary

- Derive public semantics from design, approved scenarios, and Vue mechanics.
- Do not derive public API or token names from renderer or legacy vocabulary.
- Select the minimum complete current surface.
- Keep renderer details private.
- Define precedence and restoration for selected state combinations.
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

Implementation owns component, renderer-boundary, token, browser, visual, and risk proof.

Migration owns consumers, product scenarios or explicit no-consumer proof, legacy removal, and impact metadata.

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

## Completion

Use readiness `ready` only when design contract and renderer revisions are current, all decisions are explicit, dependency queue is `none`, every dependency review revision is recorded and current, dependency graph is acyclic for the active path, and no implementation decision remains.

Use `awaiting-dependencies` for a fully resolved parent checkpoint whose dependencies still require complete pipelines.

If design contract must change, route to `self/design`. If architecture remains unresolved, route to `self/architecture`.

Return after writing the artifact. Do not implement in this context.

## Report

```text
MATERIAL ARCHITECTURE RESULT
Input component:
Canonical family:
DESIGN.md contract revision:
ARCHITECTURE.md path:
Artifact revision:
Renderer revision:
Active dependency path: none | <path>
Detected dependency cycle: none | <path>
Selected and deferred surface:
Dependency families:
Dependency queue:
Dependency review revisions:
Public Vue API:
Selected public tokens:
Renderer coverage and gaps:
Implementation passes:
Migration scope:
Remaining blockers: none | <details>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Architecture status: ready | stale | blocked
Implementation readiness: ready | awaiting-dependencies | blocked
Status: complete | blocked
```

`awaiting-dependencies` is a complete architecture-stage result, not a blocker.

## Forbidden

- Editing official design, production code, proof, exports, or consumers.
- Leaving architecture choices to coding workers.
- Using dependency stage gates.
- Emitting self-dependencies or dependencies already present in the active path.
- Omitting or inventing dependency review revisions.
- Inventing product demand when no consumer exists.
- Adding `v-model` or controllable-state APIs not required by the selected official default.
- Copying the full renderer API.
- Assigning final verification to a stage worker.
- Adding speculative APIs, abstractions, compatibility paths, or renderer exposure.
- Reusing an artifact revision after content changed.
- Rewriting architecture for metadata-only design refresh.
- Depending on Git or PR state.
