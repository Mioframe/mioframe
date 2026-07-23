---
name: implementation-preflight
description: 'Use before non-trivial implementation work to resolve owners, public entry points, minimum design, risks, passes, test design, impact metadata, and verification before the first production edit.'
---

# Implementation preflight

Use before non-trivial code edits. Keep the artifact short and task-specific. Do not restate repository policy or copy complete domain contracts.

## Activation

Use when work may change production code, tests, tooling, CI, configuration, storage semantics, diagnostics, browser behavior, performance, release behavior, or user-visible UI.

Skip only for a trivial typo, formatting-only edit, comment, or mechanical rename with no ownership, behavior, test-design, impact-metadata, or verification decision.

## Required artifact

Record:

0. **Authoring source** — ready architecture handoff or named deterministic repository workflow and authoritative sources.
1. **Owner map** — source of truth, runtime owner, user-action owner, composition owner, error/recovery owner, and verification owner where applicable.
2. **Public entry points** — owning layer and APIs; no deep imports.
3. **Reuse** — existing helpers, components, configs, schemas, services, tests, and dependencies already owning nearby behavior.
4. **Minimum sufficient design** — every planned concept mapped to a current requirement or boundary; simpler alternative compared explicitly.
5. **Acceptance matrix** — only reachable happy, boundary, failure, cancellation, conflict, and recovery states required by the contract.
6. **Risk matrix** — only applicable browser, lifecycle, async, data, accessibility, visual, performance, CI, tooling, release, and platform risks.
7. **Breadth and passes** — independent domains and safe implementation order.
8. **TEST IMPACT** — task-specific proof design and required repository impact-metadata maintenance.
9. **Verification** — focused feedback for the highest risks plus final repository verification.

Proceed without a separate architecture handoff only when an applicable repository policy defines a deterministic authoring path and every required decision is resolved from authoritative sources.

Stop when:

- a required handoff is missing or not ready;
- the deterministic path remains blocked;
- ownership, source of truth, final state, compatibility, test ownership, or verification is unresolved;
- a narrower design satisfies the same acceptance criteria;
- a planned abstraction, extension, compatibility path, recovery mechanism, optimization, stronger guarantee, test framework, registry, benchmark framework, or helper lacks a current requirement.

Do not hide the same complexity by splitting it across more files.

## TEST IMPACT

Follow `docs/testing/architecture.md`. Record only task-specific decisions:

```text
TEST IMPACT
Changed contracts:
Risks:
Proof owners:
Existing proof:
New or changed tests:
Repository impact metadata updates:
Task-specific measurements:
```

Rules:

- identify the lowest faithful proof for each changed contract;
- name exact existing or planned tests/specs;
- do not list every execution lane with ceremonial `not applicable` entries;
- update source-to-spec mappings, standalone records, snapshot ownership conventions, project metadata, mutation targets, or persistent performance checks when their durable repository relation changes;
- a new, moved, renamed, or removed Playwright spec updates its owning registry in the same change;
- production, story, fixture, or owned support paths may be source mappings; spec paths must not be used as source prefixes to group tests;
- use full owning-lane fallback when an impact relation is unknown or cross-cutting;
- name a representative metric, scenario/dataset, environment, and budget/baseline for a performance or optimization claim;
- do not create permanent benchmark infrastructure for one task;
- update the preflight when implementation changes the planned contracts, proof, or repository impact metadata;
- `TEST IMPACT` is a reviewable plan only; `verify` never parses or consumes it.

## Contract changes

For persisted formats, public APIs, shared UI, Material library/foundation, service/worker/provider, or cross-layer contracts also record:

- affected consumer inventory;
- current and canonical owner when migration applies;
- compatibility decision;
- applicable edge cases;
- proof per materially distinct consumer path.

## Workflow routing

Use the domain workflow as the primary execution contract:

- official Material design document: `material-component-design`; this stage writes only `DESIGN.md` and does not authorize production edits;
- official Material component, foundation, API, or migration implementation: ready `architect-handoff` plus applicable Vue and testing skills;
- project-specific or generic shared UI primitive: `shared-ui-implementation`;
- storage/service/worker/provider: applicable scoped rules and `crdt-storage`;
- diagnostics: `diagnostic-events`;
- ordinary Vue implementation mechanics: `vue-component-implementation`.

Use testing skills according to the proof selected in `TEST IMPACT`: `unit-testing`, `component-contract-testing`, `ui-browser-behavior`, `visual-regression-testing`, `mutation-testing`, and `verification`.

The preflight records only task-specific owners, risks, pass order, proof, and metadata changes. It must not restate resolver implementation or general testing policy.

## Breadth control

- Four or more independent domains require explicit passes and focused proof after risky passes.
- Keep behavior-preserving cleanup separate from functional change when practical.
- Do not start the next risky pass before the previous one has focused verification.
- If repeated correction rounds add concepts or workarounds, stop and redo architecture/preflight.

## Feature-flow guardrails

For multi-step flows:

- include only reachable cancellation, unsupported API, permission, invalid input, conflict, race, partial failure, rollback, and recovery states;
- separate intents with different invariants or recovery contracts;
- keep domain/storage invariants below UI;
- refuse invalid targets instead of accepting broadly and compensating later;
- keep typed outcomes local;
- delete obsolete owners with their replacement unless compatibility is explicit.

## Bounded reuse search

Search only enough to identify the current owner, existing proof, and reusable mechanism. Do not perform broad exploration to justify a generic abstraction.

## Output discipline

Keep the written preflight usually within 10–20 short lines plus `TEST IMPACT`. Before completion, confirm the diff still matches the ready handoff or deterministic workflow and that owners, exports, tests, repository impact metadata, measurements, and review status remain consistent.