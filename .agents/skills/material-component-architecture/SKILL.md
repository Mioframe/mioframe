---
name: material-component-architecture
description: 'Use after a current complete family DESIGN.md exists to create or refresh demand-scoped ARCHITECTURE.md without editing production code or migrating consumers.'
---

# Material component architecture

Resolve one deterministic implementation architecture from the current official design contract and return control to the orchestrator.

This stage owns demand selection, public contract, ownership, dependencies, renderer strategy, proof ownership, and migration plan. It does not own production edits, migration execution, review, or final workflow verification.

## Input gate

Require current successful `DESIGN.md` with a non-`none` design contract revision.

If the design artifact is mechanically invalid or its contract must be corrected, write architecture as blocked when possible and route to `self/design`. Do not repair design in this worker.

## Worker boundary

Run in a fresh isolated context. Use task-relevant workspace files, applicable rules, exact renderer package artifacts, active dependency path when provided, and documented commands. Do not depend on Git, PR, commit, or external-check state.

Treat code, tests, stories, and README files as implementation evidence, not architecture authority.

Before selecting proof placement or impact ownership, read the current `docs/testing/migration-plan.md`; do not copy an older family’s transitional test location or registry pattern when the executable testing architecture has advanced.

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
Dependency review revisions: none | <family>=<review revision>[; <family>=<review revision>...]
```

`stale` is an external pre-run marker. This worker may finish only with `ready` or `blocked`.

Use a new artifact revision whenever architecture changes or is revalidated after a design-contract, dependency-review, or renderer change. A metadata-only design refresh does not require architecture rewrite.

## Scenario selection

Use confirmed product scenarios when consumers exist.

When no consumer exists, the invocation establishes one approved library scenario:

- implement the unambiguous official standalone default;
- expose only the API required to render and accessibly operate that default;
- expose only mandatory controllable state belonging to the selected default;
- do not add `v-model`, selection, toggle, value, or open-state contracts unless required by that default;
- include disabled behavior only when official Material supports it for that default;
- include mandatory semantics, accessibility, states, and proof;
- defer optional variants, sizes, shapes, configurations, and state models;
- do not expose m3e capability merely because it exists;
- do not invent product scenarios or create a product consumer.

Ask the operator only when official sources define no standalone default or multiple materially different public models.

## Required decisions

Resolve:

1. goal and non-goals;
2. product or approved no-consumer scenarios and failure paths;
3. selected and deferred official surface;
4. complete direct dependency set, queue, and dependency review revisions;
5. ownership of composition, dependency behavior, product state, renderer behavior, and gaps;
6. complete public Vue API and state precedence/restoration;
7. for every controlled renderer-backed state, the exact transition timeline required by `docs/component-adapter.md`: public source of truth, mapped renderer property, pre/post mutation events, cancelability, next-value owner, accepted intent, rejected intent, and suppressed-state behavior;
8. selected public token contract;
9. renderer mappings, fallbacks, and coverage;
10. one owner for every renderer gap;
11. deterministic implementation passes;
12. implementation and migration `TEST IMPACT`, using the current executable testing ownership rather than copied historical placement;
13. consumer inventory and migration order, including classification of existing legacy Storybook/browser/visual proof as retained-and-rehomed, replaced by canonical proof, or obsolete-and-removed;
14. acceptance criteria, risks, forbidden approaches, and simplest viable alternative;
15. implementation readiness.

No coding decision may remain for implementation.

## Dependency rules

Record every direct dependency in `Dependency families`.

For each dependency:

- if it lacks current successful independent review, put it in `Dependency queue`;
- otherwise record its exact current review artifact revision.

Queue and review-revision entries must be disjoint and their union must equal dependency families.

Self-dependency, dependency gates, and dependencies already present in the active path are forbidden.

When the orchestrator provides a detected cycle, correct ownership or dependency closure in this worker. Do not route to `self/architecture`.

When queue is non-empty, use:

```text
Status: ready
Implementation readiness: awaiting-dependencies
Remaining blockers: none
Required return family: none
Required return stage: none
```

After dependencies become current, revalidate handoffs, clear or recompute the queue, and record exact review revisions.

## Public and renderer boundary

- Derive public semantics from design, approved scenarios, and Vue mechanics.
- Do not derive public API or token names from renderer or legacy vocabulary.
- Select the minimum complete current surface.
- Keep renderer details private.
- Define precedence and restoration for every selected state combination.
- For mutable renderer-backed state, inspect the exact installed renderer event lifecycle before calling the public mapping controlled. Prefer a documented cancelable pre-mutation intent seam when it exists; a post-mutation `change`/`input` emit alone is insufficient if rejected intent can leave renderer state divergent from the controlling prop.
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

When the current testing architecture can execute owner-local Storybook browser or visual proof for the canonical family, that owner-local location is the final target. Do not design a temporary central or legacy proof location that requires a later Storybook ownership migration. Existing legacy proof that survives the component migration must move to the canonical family in the same Material workflow; proof for contracts removed by the canonical renderer-backed implementation must be deleted rather than relocated.

For controlled state, implementation proof must include rejected intent; for decorative/presentation composition, browser proof must cover both child suppression and positive handoff to the actual action owner.

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

- Use readiness `awaiting-dependencies` only for a valid non-empty dependency queue.
- Use readiness `ready` only when queue is `none` and all dependency review revisions are current.
- Keep blockers and route `none`.

### Earlier-stage or cross-family correction

Use `Status: blocked` with an exact route only when correction belongs to:

- `self/design`; or
- another family’s design, architecture, implementation, or migration stage.

### Genuine blocker

If an architecture decision owned by this stage remains unresolved after all available evidence and mechanisms are exhausted, return:

```text
Status: blocked
Implementation readiness: blocked
Remaining blockers: <exact unresolved decision>
Required return family: none
Required return stage: none
```

This includes an unresolvable dependency cycle. Do not return `self/architecture`.

A fixable architecture omission, dependency error, route error, or document-format defect must be corrected before returning.

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
Architecture status: ready | blocked
Implementation readiness: ready | awaiting-dependencies | blocked
Status: complete | blocked
```

## Forbidden

- Returning terminal `stale`.
- Returning `self/architecture`.
- Leaving a current-stage fixable architecture defect unresolved.
- Editing official design, production code, proof, exports, or consumers.
- Leaving coding decisions to implementation.
- Using dependency gates or cyclic dependencies.
- Inventing product demand or renderer-derived APIs.
- Calling post-mutation renderer state controlled without proving rejected intent cannot drift from the public source of truth.
- Copying obsolete test-placement or impact-registry patterns from older family artifacts instead of the current testing policy.
- Planning a temporary central/legacy Storybook proof destination when the canonical family can own executable proof directly.
- Adding speculative APIs, abstractions, compatibility paths, or renderer exposure.
- Rewriting architecture for metadata-only design refresh.
- Depending on Git or PR state.
