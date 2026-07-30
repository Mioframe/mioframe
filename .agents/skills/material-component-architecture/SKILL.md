---
name: material-component-architecture
description: 'Use after a current complete Material family DESIGN.md exists to create or refresh that family ARCHITECTURE.md as the demand-scoped Mioframe–Vue–m3e implementation plan, without editing production code or migrating consumers.'
---

# Material component architecture

Resolve one Material component implementation architecture from an accepted official design artifact.

This stage exists to keep research, architecture, coding, and migration separate. It produces a complete coding handoff and stops.

## Input contract

The only required input is the Material component name.

Resolve the canonical family and require:

```text
src/shared/ui/material/components/<family>/DESIGN.md
```

The design status must be `current`. If it is missing, stale, blocked, incomplete, demand-scoped, or renderer-shaped, stop and route to `material-component-design`.

## Output artifact

Write exactly one primary artifact:

```text
src/shared/ui/material/components/<family>/ARCHITECTURE.md
```

Do not edit production code, tests, stories, snapshots, public exports, tokens, consumers, or migration files in this stage.

## Read first

- applicable `AGENTS.md` files;
- `src/shared/ui/material/docs/design-document.md`;
- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/component-adapter.md`;
- `src/shared/ui/material/docs/component-tokens.md`;
- the current family `DESIGN.md`;
- current and legacy consumers;
- current implementation, tests, and stories when they exist;
- the exact lockfile-resolved m3e package entry point and public artifacts;
- relevant defect, token catalogue, testing, and verification rules.

Treat existing code and README files as implementation evidence, not architecture authority.

## Required architecture decisions

`ARCHITECTURE.md` must resolve:

1. goal and non-goals;
2. current product and approved library scenarios;
3. selected and deferred official surface, with exact `DESIGN.md` references;
4. required official dependencies and ordered dependency closure;
5. ownership of parent composition, dependency behavior, feature state, renderer behavior, and gaps;
6. complete public Vue API: props, defaults, values, slots, emits, refs, native mappings, state precedence, and restoration;
7. selected public component-token surface and exact official token paths;
8. contextual state/part trace through renderer input and fallback;
9. exact lockfile-resolved renderer coverage: `direct`, `partial`, `missing`, `divergent`, or `not-applicable`;
10. wrapper corrections, m3e fixes, blocked behavior, and controlled workaround decisions;
11. implementation passes and files/modules expected to change;
12. proof ownership and `TEST IMPACT`;
13. consumer migration inventory, obsolete owners to remove, and migration pass order;
14. acceptance criteria, preserved behavior, risks, and forbidden approaches;
15. implementation readiness: `ready` or `blocked`.

## Dependency gate

A parent architecture is not `ready` while a required official dependency lacks:

- a current complete `DESIGN.md`;
- a ready `ARCHITECTURE.md`;
- an explicit public handoff and ownership boundary.

Record the dependency queue and stop. Do not implement the dependency inside the parent architecture task and do not run another stage in the same invocation.

## Public API and token rules

- Derive public semantics only from `DESIGN.md`, current confirmed demand, and Vue mechanics.
- Do not derive public API or token names from m3e or legacy Mioframe vocabulary.
- Select the minimum complete surface for the confirmed scenarios, including every required state and rendered part.
- Do not add adjacent renderer/native/token surface merely for symmetry or hypothetical reuse.
- For every contextual token record:

```text
DESIGN.md official path
  → public Mioframe token
  → direct renderer input
  → renderer fallback
  → expected rendered consumer result
  → proof owner
```

- Separate standalone dependency defaults from parent-composed overrides.
- Keep all renderer imports, types, events, tags, and CSS inputs private.

## Gap routing

Choose one owner for each selected gap:

- `wrapper-correction`;
- `temporary-renderer-workaround` under the repository gate;
- `m3e-fix`;
- `blocked`.

Do not leave the coding agent to choose between unresolved approaches.

## Artifact structure

`ARCHITECTURE.md` must contain:

```text
# <Component> architecture

Status: ready | blocked | stale
DESIGN.md reference:
Design snapshot/revision:
Architecture date:

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

Every selected/deferred/restrictive decision references `DESIGN.md`. Every implementation pass is deterministic enough for a coding agent.

## Completion gate

Report `ready` only when:

- the complete design source is current;
- all product and library scenarios are confirmed;
- dependencies and owners are resolved;
- public API, tokens, renderer mapping, gaps, proof, and migration are explicit;
- the simplest viable design was compared and selected;
- no coding decision remains open.

Do not continue into implementation from this skill.

## Report

```text
MATERIAL ARCHITECTURE RESULT
Input artifact:
Resolved official component:
Canonical family:
DESIGN.md path and status:
ARCHITECTURE.md path:
Selected scenarios:
Selected Material surface:
Deferred surface:
Dependencies and stage statuses:
Public Vue API:
Selected public tokens:
Renderer coverage and gaps:
Implementation passes:
Migration scope:
Unresolved blockers: none | <details>
Architecture status: ready | blocked | stale
Status: complete | partial (<exact remainder>) | blocked (<exact reason>)
```

## Forbidden

- Editing `DESIGN.md` to fit current demand.
- Editing production code, tests, stories, snapshots, tokens, exports, or consumers.
- Mixing implementation progress or migration results into `ARCHITECTURE.md`.
- Leaving public API, ownership, renderer strategy, proof, or migration choices to the coding agent.
- Treating a family README or current code as the architecture artifact.
- Running the implementation or migration stage in the same invocation.