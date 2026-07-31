---
name: material-component-architecture
description: 'Use after a current complete family DESIGN.md exists to create or refresh the demand-scoped ARCHITECTURE.md without editing production code or migrating consumers.'
---

# Material component architecture

Resolve one deterministic implementation architecture from the accepted official design artifact and return control to the orchestrator.

This stage owns demand selection, public contract, ownership, renderer strategy, proof ownership, and migration plan. It does not own production edits, migration execution, review, or final workflow verification.

## Input gate

Require:

```text
src/shared/ui/material/components/<family>/DESIGN.md
```

The design artifact must contain all required control fields and satisfy its `current` success gate.

If official design is missing, stale, blocked, incomplete, demand-scoped, or renderer-shaped, write the architecture artifact as blocked when possible, set `Required return stage: design`, and return.

## Worker boundary

Run in a fresh isolated worker context.

Use task-relevant readable workspace files, applicable rules, exact renderer package artifacts, and documented project commands. Do not depend on Git history, diff, branch, worktree/index state, commit identifiers, pull-request metadata, or external checks.

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
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return stage: none | design | architecture
Implementation readiness: ready | blocked
Dependency queue: none | <ordered family and required gate entries>
```

Do not append prose to enum values.

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
3. selected and deferred official surface with exact `DESIGN.md` references;
4. official dependency closure and ordered `Dependency queue`;
5. ownership of parent composition, dependency behavior, feature state, renderer behavior, and gaps;
6. complete public Vue API: props, defaults, values, slots, emits, refs, native mappings, precedence, and restoration;
7. selected public component-token contract and exact official paths;
8. contextual state/part trace through renderer inputs and fallbacks;
9. renderer coverage: `direct`, `partial`, `missing`, `divergent`, or `not-applicable`;
10. one owner for every gap: wrapper correction, controlled renderer workaround, renderer fix, or blocked;
11. deterministic implementation passes and expected files;
12. `TEST IMPACT`, split into implementation-owned and migration-owned proof;
13. complete consumer inventory, obsolete owners, and migration pass order;
14. acceptance criteria, preserved behavior, risks, and forbidden approaches;
15. comparison with the simplest viable alternative;
16. implementation readiness.

No coding decision may remain for the implementation worker.

## Dependency rules

A required official dependency is a first-class family.

Record each dependency in `Dependency queue` with the exact gate the parent requires. Do not implement the dependency in this worker.

A parent architecture cannot be `ready` until required dependency design and architecture are ready and the public handoff is explicit.

## Public boundary

- Derive public semantics from `DESIGN.md`, confirmed demand, and Vue mechanics.
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

Architecture assigns only stage-scoped proof:

- implementation owns component, renderer-boundary, token, browser, visual, and component-risk proof;
- migration owns consumer, product-scenario, legacy-removal, and impact-metadata proof;
- review independently evaluates the complete result and stage evidence.

The top-level `material-component` orchestrator owns the one final read-only workflow verification after current review. Do not assign it to implementation, migration, review, a dependency, or an unspecified later stage.

For ordinary component work, the expected outer command is `pnpm verify`. Select `pnpm verify:release` only when the task itself changes release-sensitive infrastructure under the verification skill.

## Required sections

After the control fields include:

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

Use `Status: ready` only when:

- design is current and complete;
- scenarios, dependencies, owners, API, tokens, renderer mapping, gaps, proof, and migration are explicit;
- the simplest viable design is selected;
- final workflow verification ownership remains with the orchestrator;
- no implementation decision remains open;
- `Remaining blockers: none`;
- `Required return stage: none`;
- `Implementation readiness: ready`.

If design must change, set return stage `design`. If architecture itself is unresolved, set return stage `architecture`.

Return to the orchestrator after writing the artifact. Do not execute implementation in the same context.

## Report

```text
MATERIAL ARCHITECTURE RESULT
Input component:
Canonical family:
DESIGN.md status:
ARCHITECTURE.md path:
Selected and deferred surface:
Dependencies and required gates:
Public Vue API:
Selected public tokens:
Renderer coverage and gaps:
Implementation passes:
Migration scope:
Stage proof ownership:
Remaining blockers: none | <details>
Required return stage: none | design | architecture
Architecture status: ready | stale | blocked
Implementation readiness: ready | blocked
Status: complete | blocked
```

## Forbidden

- Editing official design, production code, tests, stories, tokens, exports, or consumers.
- Leaving architecture choices to coding workers.
- Assigning final workflow verification to a stage worker.
- Adding speculative APIs, abstractions, compatibility paths, or renderer exposure.
- Depending on Git or PR state.
- Running implementation or migration in this context.
