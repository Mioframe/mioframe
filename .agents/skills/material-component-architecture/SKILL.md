---
name: material-component-architecture
description: 'Use after a current complete family DESIGN.md exists to create or refresh the demand-scoped ARCHITECTURE.md without editing production code or migrating consumers.'
---

# Material component architecture

Resolve one deterministic implementation architecture from the current official design artifact and return control to the orchestrator.

This stage owns demand selection, public contract, ownership, dependencies, renderer strategy, proof ownership, and migration plan. It does not own production edits, migration execution, review, or final workflow verification.

## Input gate

Require:

```text
src/shared/ui/material/components/<family>/DESIGN.md
```

Design must satisfy its current success gate.

If design is invalid, write architecture as blocked when possible, record the current design revision, set the return target to `self/design`, and return.

## Worker boundary

Run in a fresh isolated worker context.

Use task-relevant readable workspace files, applicable rules, exact renderer package artifacts, and documented project commands. Do not depend on Git, PR, commit, or external-check state.

Treat existing code, tests, stories, and README files as implementation evidence, not architecture authority.

## Output

Write exactly:

```text
src/shared/ui/material/components/<family>/ARCHITECTURE.md
```

The artifact begins with:

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
Status: ready | stale | blocked
DESIGN.md reference: <path>
DESIGN.md revision: <exact Artifact revision>
Renderer revision: @m3e/web@<lockfile-resolved-version>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Implementation readiness: ready | awaiting-dependencies | blocked
Dependency families: none | <canonical-family>[; <canonical-family>...]
Dependency queue: none | <canonical-family>[; <canonical-family>...]
```

Use a new artifact revision whenever architecture content changes or is revalidated after dependencies or renderer updates.

Dependency names are exact family path segments, unique, ordered, and separated by `; `.

## Read first

- applicable `AGENTS.md` files;
- family `DESIGN.md`;
- Material architecture, workflow, adapter, and token rules;
- current approved scenarios and consumers;
- current implementation and proof where present;
- exact lockfile-resolved renderer public artifacts;
- relevant testing, defect, and verification rules.

## Scenario selection

Use confirmed product scenarios when consumers exist.

When no current consumer exists, the explicit `material-component <name>` invocation establishes one approved library scenario:

- implement the unambiguous official standalone default;
- expose only the minimum coherent public API needed to render, accessibly name, and control that default;
- include disabled behavior only when the official model supports it;
- include mandatory states, semantics, accessibility, and faithful proof;
- defer optional variants, sizes, shapes, and configurations;
- do not expose m3e capability merely because it exists;
- do not invent product scenarios or create a product consumer.

Block for operator input only when official sources define no standalone default or multiple materially different public models that cannot be resolved mechanically.

## Required decisions

Resolve:

1. goal and non-goals;
2. confirmed product scenarios or the approved no-consumer library scenario, including failure paths;
3. selected and deferred official surface with exact design references;
4. complete direct official dependency set and pending dependency queue;
5. ownership of parent composition, dependency behavior, feature state, renderer behavior, and gaps;
6. complete public Vue API: props, defaults, values, slots, emits, refs, native mappings, precedence, and restoration;
7. selected public component-token contract and exact official paths;
8. contextual state/part trace through renderer inputs and fallbacks;
9. renderer coverage: `direct`, `partial`, `missing`, `divergent`, or `not-applicable`;
10. one owner for every gap: wrapper correction, controlled workaround, renderer fix, or blocked;
11. deterministic implementation passes and expected files;
12. implementation-owned and migration-owned `TEST IMPACT`;
13. consumer inventory, obsolete owners, and migration pass order;
14. acceptance criteria, preserved behavior, risks, and forbidden approaches;
15. comparison with the simplest viable alternative;
16. implementation readiness.

No coding decision may remain for the implementation worker.

## Dependency rules

A required official dependency is a first-class family.

Record every direct dependency in `Dependency families`.

Record in `Dependency queue` every dependency that does not currently have a successful current independent review. Do not use stage gates.

When the queue is non-empty:

- use `Status: ready`;
- use `Implementation readiness: awaiting-dependencies`;
- keep blockers and return target `none`;
- return control so the orchestrator can run every queued dependency through its complete pipeline to current review.

After the queue is processed, architecture runs again. Revalidate public handoffs, preserve or recompute `Dependency families`, clear satisfied queue entries, and use readiness `ready` only when the queue is `none`.

Do not implement dependencies in this worker.

## Public boundary

- Derive public semantics from design, approved scenarios, and Vue mechanics.
- Do not derive public API or token names from renderer or legacy vocabulary.
- Select the minimum complete current surface.
- Keep renderer imports, tags, types, events, and CSS inputs private.
- Define precedence and restoration for every selected state combination.
- Do not add adjacent surface for symmetry or future flexibility.

For every contextual token record:

```text
DESIGN.md official path
  → public Mioframe token
  → renderer input
  → renderer fallback
  → expected rendered result
  → proof owner
```

## Proof ownership

Architecture assigns stage-scoped proof:

- implementation owns component, renderer-boundary, token, browser, visual, and component-risk proof;
- migration owns consumer, product-scenario, legacy-removal, and impact-metadata proof;
- review independently evaluates the complete result.

The outer orchestrator owns one final read-only workflow verification.

## Required sections

After control fields include:

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

Use implementation readiness `ready` only when design, renderer revision, scenarios, dependencies, owners, API, tokens, mappings, proof, and migration are explicit and the dependency queue is `none`.

Use `awaiting-dependencies` for a fully resolved parent architecture whose listed dependencies still require their complete pipelines.

If design must change, route to `self/design`. If architecture itself remains unresolved, route to `self/architecture`.

Return after writing the artifact. Do not execute implementation in this context.

## Report

```text
MATERIAL ARCHITECTURE RESULT
Input component:
Canonical family:
DESIGN.md revision:
ARCHITECTURE.md path:
Artifact revision:
Renderer revision:
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
Architecture status: ready | stale | blocked
Implementation readiness: ready | awaiting-dependencies | blocked
Status: complete | blocked
```

`awaiting-dependencies` is a complete architecture-stage result, not a blocker. The outer workflow continues with the queue.

## Forbidden

- Editing official design, production code, tests, stories, tokens, exports, or consumers.
- Leaving architecture choices to coding workers.
- Using dependency stage gates.
- Inventing product demand when no consumer exists.
- Copying the full renderer API for a new component.
- Assigning final workflow verification to a stage worker.
- Adding speculative APIs, abstractions, compatibility paths, or renderer exposure.
- Reusing an artifact revision after content changed.
- Depending on Git or PR state.
- Running implementation or migration in this context.