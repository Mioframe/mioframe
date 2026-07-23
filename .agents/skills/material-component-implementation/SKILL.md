---
name: material-component-implementation
description: 'Use to implement one official Material component family after an architect-approved family contract is marked ready. Owns coding, consumer migration, proportional proof, cleanup, and verification, but not architecture approval, independent review, or merge readiness.'
paths:
  - 'src/shared/ui/material/components/**'
---

# Material component implementation

Use this skill only for one resolved official Material family with:

- an approved family `README.md` contract;
- `Readiness: ready`;
- an explicit implementation task;
- resolved ownership, supported surface, public API, compatibility, acceptance criteria, and verification ownership.

Do not use this skill to select a family, invent architecture, perform a general Material audit, or approve a PR.

## Required inputs

Before production edits, read:

1. root and applicable nested `AGENTS.md` files;
2. `src/shared/ui/material/docs/workflow.md`;
3. `src/shared/ui/material/docs/component-architecture.md`;
4. the ready family contract;
5. the explicit implementation task;
6. current implementation, exports, direct consumers, tests, stories, and affected foundation owners;
7. applicable testing skills and `verification`.

Stop when the family contract is missing, blocked, stale against the task, or does not resolve a decision required for implementation.

## Implementation preflight

Record a short task-specific preflight containing:

- problem and cause;
- expected final state;
- current and canonical owner;
- public entry points;
- affected consumers;
- minimum sufficient design and simpler alternative comparison;
- acceptance and risk matrix;
- `TEST IMPACT`;
- implementation passes;
- focused and final verification.

The preflight must implement the approved contract rather than redefine it.

## Implementation rules

- Keep changes inside the approved family, explicitly approved foundations, consumers, tests, stories, exports, and directly affected records.
- Prefer native HTML semantics and existing repository mechanisms.
- Keep controlled semantic state consumer-owned.
- Keep component transient state limited to owned gesture, overlay, animation, or native coordination.
- Use exact verified official token paths and the shortest route to the rendered property owner.
- Create helpers, contexts, files, or abstractions only when a current contract requires them and total complexity decreases.
- Preserve accepted product behavior except for named approved deltas.
- Remove obsolete owners, exports, tests, and compatibility paths when their replacement lands.
- Use temporary compatibility only when the ready contract explicitly names consumers, forbids new use, and defines removal.

## Contract boundary

The coding agent must not independently change:

- goal or non-goals;
- required scenarios;
- family or foundation ownership;
- supported or unsupported Material surface;
- public API or native semantics;
- state source of truth;
- compatibility decision;
- acceptance criteria or proof ownership;
- intentional deviations;
- repository workflow policy.

When evidence invalidates one of these decisions, return:

```text
CONTRACT BLOCKER
Confirmed evidence:
Invalidated decision:
Impact:
Required architect decision:
Safe work that may continue:
```

Do not hide a contract defect behind a local workaround, compatibility alias, broader abstraction, or weakened test.

## Implementation passes

Use the minimum safe order required by the ready contract, typically:

1. contract-consistent production owner and public entry point;
2. required foundation wiring already approved by the task;
3. semantics, state, token, anatomy, and browser behavior;
4. consumer migration;
5. component-contract, pure, browser, consumer, and visual proof as applicable;
6. obsolete-owner removal;
7. directly affected records and documentation;
8. final verification.

Run focused verify-managed checks after risky passes. Do not run duplicate expensive verification.

## Proof

Every new or migrated public component requires a colocated component-contract test.

Add only proof owned by the changed contract:

- pure tests for extracted deterministic logic;
- browser tests for real focus, keyboard, pointer, touch, overlay, cancellation, cleanup, and motion behavior;
- consumer tests when a materially distinct consumer path changed;
- one canonical visual story for visible output;
- `StateMatrix` only when multiple distinct component-owned visual routes exist;
- bounded visual regression when stable rendered regression protection is material.

Forced state proves appearance only. Do not test framework internals or create a generic test DSL.

## Completion

Before returning implementation complete:

- map every acceptance criterion to implementation and proof;
- confirm consumers and exports use the canonical owner;
- remove obsolete ownership and unapproved compatibility;
- run applicable focused checks;
- run final read-only `pnpm verify`;
- report remaining limitations and visual evidence required for the reviewer/operator.

Finish with:

```text
MATERIAL IMPLEMENTATION RESULT
Family:
Contract readiness: ready
Implemented scope:
Consumers migrated:
Foundation changes: none | <approved changes>
Obsolete ownership removed: not applicable | complete | blocked
Acceptance evidence:
Focused verification:
Final verification:
Contract blockers: none | <exact blocker>
Remaining limitations: none | <limitations>
Status: implementation complete | blocked
```

`implementation complete` does not mean technically approved, visually accepted, or ready to merge.

## Forbidden

- family selection or autonomous queue continuation;
- architecture invention or approval;
- changing a ready contract without architect approval;
- silent repository-rule refinement;
- self-review as the independent merge gate;
- merge recommendation;
- manager agents, recursive owner stacks, execution ledgers, dependency databases, or context state machines;
- weakening checks, increasing timeouts to hide failures, or testing third-party framework behavior;
- production changes outside the approved scope.
