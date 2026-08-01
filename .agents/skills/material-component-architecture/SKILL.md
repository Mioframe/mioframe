---
name: material-component-architecture
description: 'Use after a current complete family DESIGN.md exists to create or refresh the demand-scoped ARCHITECTURE.md without editing production code or migrating consumers.'
---

# Material component architecture

Resolve one deterministic implementation architecture from the accepted official design artifact and return control to the orchestrator.

This stage owns demand selection, public contract, ownership, dependency queue, renderer revision and strategy, proof ownership, and migration plan. It does not own production edits, migration execution, review, or final workflow verification.

## Input gate

Require a mechanically valid and successful:

```text
src/shared/ui/material/components/<family>/DESIGN.md
```

The design must be `current`, not refresh-due, complete, and contain every required field and heading.

If design is invalid, write architecture as blocked when possible and set:

```text
Required return family: self
Required return stage: design
```

## Worker boundary

Run in a fresh isolated worker context.

Use task-relevant readable workspace files, applicable rules, exact renderer package artifacts, root `pnpm-lock.yaml`, and documented project commands. Do not depend on Git history, diff, branch, worktree/index state, commit identifiers, pull-request metadata, or external checks.

Treat existing code, tests, stories, and README files as implementation evidence, not architecture authority.

## Output

Write exactly:

```text
src/shared/ui/material/components/<family>/ARCHITECTURE.md
```

The artifact begins with exact control fields:

```text
Status: ready | stale | blocked
DESIGN.md reference: <path and source revision>
Renderer revision: @m3e/web@<lockfile-resolved-version>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Implementation readiness: ready | awaiting-dependencies | blocked
Dependency queue: none | <canonical-family>@<gate>[; <canonical-family>@<gate>...]
```

Do not append prose to enum, routing, renderer, or queue values.

Resolve `Renderer revision` from the root lockfile importer entry and strip peer-resolution suffixes. Example:

```text
Renderer revision: @m3e/web@2.6.3
```

Allowed dependency gates:

```text
design | architecture | implementation | migration | review
```

Queue entries are exact canonical family path segments, unique, and separated by `; `.

## Read first

- applicable `AGENTS.md` files;
- family `DESIGN.md`;
- `docs/architecture.md`;
- `docs/component-workflow.md`;
- `docs/component-adapter.md`;
- `docs/component-tokens.md`;
- current scenarios and consumers;
- current implementation and proof where present;
- exact lockfile-resolved renderer public artifacts;
- relevant testing, defect, and verification rules.

## Required decisions

Resolve:

1. goal and non-goals;
2. confirmed product and approved library scenarios, including failure paths;
3. selected and deferred official surface with exact design references;
4. official dependency closure and ordered queue;
5. ownership of parent composition, dependency behavior, feature state, renderer behavior, and gaps;
6. complete public Vue API: props, defaults, values, slots, emits, refs, native mappings, precedence, and restoration;
7. selected public component-token contract and exact official paths;
8. contextual state/part trace through renderer inputs and fallbacks;
9. renderer coverage: `direct`, `partial`, `missing`, `divergent`, or `not-applicable`;
10. one owner for every gap: wrapper correction, controlled renderer workaround, renderer fix, or blocked;
11. revalidation of every affected `M3E-*` record and workaround against the recorded renderer revision;
12. deterministic implementation passes and expected files;
13. `TEST IMPACT`, split into implementation-owned and migration-owned proof;
14. complete consumer inventory, obsolete owners, and migration order;
15. acceptance criteria, preserved behavior, risks, and forbidden approaches;
16. comparison with the simplest viable alternative;
17. implementation readiness.

No coding decision may remain for the implementation worker.

## Dependency rules

A required official dependency is a first-class family. Do not implement it in this worker.

Write only dependencies whose required gate is not currently satisfied. Example:

```text
Dependency queue: loadingIndicator@architecture; iconButton@implementation
```

When pending dependencies exist and the parent architecture itself is resolved, write:

```text
Status: ready
Remaining blockers: none
Required return family: none
Required return stage: none
Implementation readiness: awaiting-dependencies
```

Pending dependencies are not architecture blockers. The orchestrator pauses the parent, processes the queue left to right, then reruns this worker.

On the rerun:

- inspect the completed dependency artifacts and public handoffs;
- remove satisfied entries;
- add any newly proven required entries;
- set `Dependency queue: none` and `Implementation readiness: ready` only when dependency closure is complete.

Do not set `Required return stage: architecture` merely because a dependency is pending. That would create a parent retry loop.

## Renderer revision changes

When the lockfile-resolved renderer revision differs from the previous architecture record:

- inspect the exact current public renderer artifacts;
- reclassify selected coverage and mappings;
- revalidate all affected defect records and workarounds;
- remove obsolete workarounds or preserve them with current evidence;
- update `Renderer revision`;
- ensure implementation, migration, and review rerun downstream.

This records the version against which the decision was made; it does not pin the dependency.

## Public boundary

- Derive public semantics from design, confirmed demand, and Vue mechanics.
- Do not derive public API or token names from renderer or legacy vocabulary.
- Select the minimum complete surface for current scenarios.
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
- review independently evaluates the complete result and stage evidence.

The outer orchestrator owns the one final read-only workflow verification. Do not assign it to a stage or dependency.

## Required sections

After control fields include exactly:

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

Use `Status: ready` when architecture itself is fully resolved.

Two valid ready states exist:

1. pending dependency closure:
   - non-empty valid queue;
   - readiness `awaiting-dependencies`;
   - no blockers or return target;
2. implementation-ready:
   - queue `none`;
   - readiness `ready`;
   - no blockers or return target.

Use `blocked` only for a genuine unresolved design or architecture decision, not for a queued dependency.

If a finding belongs to another family, set its exact canonical family in `Required return family`. Otherwise use `self`.

Return to the orchestrator after writing the artifact. Do not execute implementation in the same context.

## Report

```text
MATERIAL ARCHITECTURE RESULT
Input component:
Canonical family:
DESIGN.md status:
ARCHITECTURE.md path:
Renderer revision:
Selected and deferred surface:
Dependency queue:
Public Vue API:
Selected public tokens:
Renderer coverage and gaps:
Implementation passes:
Migration scope:
Stage proof ownership:
Remaining blockers: none | <details>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Architecture status: ready | stale | blocked
Implementation readiness: ready | awaiting-dependencies | blocked
Status: complete | blocked
```

## Forbidden

- Editing official design, production code, tests, stories, tokens, exports, or consumers.
- Leaving architecture choices to coding workers.
- Treating pending dependencies as a parent architecture blocker.
- Writing free-form dependency queue entries.
- Assigning final workflow verification to a stage worker.
- Adding speculative APIs, abstractions, compatibility paths, or renderer exposure.
- Depending on Git or PR state.
- Running implementation or migration in this context.
