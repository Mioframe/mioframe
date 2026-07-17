---
name: implementation-preflight
description: 'Use before non-trivial implementation work to resolve owners, public entry points, minimum design, risks, passes, test impact, and verification before the first production edit.'
---

# Implementation preflight

Use before non-trivial code edits. Keep the artifact short and bounded. Do not repeat repository policy or copy complete domain contracts into the preflight.

## Activation

Use when work may change production code, tests, tooling, CI, configuration, storage semantics, diagnostics, browser behavior, performance, or user-visible UI.

Skip only for trivial typo, formatting, comment, or mechanical rename work with no ownership, behavior, test-impact, or verification decision.

## Required artifact

Record:

0. **Authoring source** — ready architecture handoff or named deterministic repository workflow and authoritative sources.
1. **Owner map** — source of truth, runtime owner, user-action owner, composition owner, error/recovery owner, and verification owner where applicable.
2. **Public entry points** — owning layer and APIs; no deep imports.
3. **Reuse** — existing helpers, components, configs, schemas, services, tests, and dependencies already owning nearby behavior.
4. **Minimum sufficient design** — every planned concept mapped to a current requirement or boundary; simpler alternative compared explicitly.
5. **Acceptance matrix** — only reachable happy, boundary, failure, cancellation, conflict, and recovery states required by the contract.
6. **Risk matrix** — only applicable browser, lifecycle, async, data, accessibility, visual, performance, CI, tooling, release, or platform risks.
7. **Breadth and passes** — independent domains and safe implementation order.
8. **TEST IMPACT** — exact changed contracts, proof paths, impact-resolution mode, projects, performance evidence, and mutation applicability using `docs/testing/architecture.md`.
9. **Verification** — focused proof for the highest risk plus final repository verification.

Proceed without a separate architecture handoff only when an applicable repository policy defines a deterministic authoring path and every required decision is resolved from authoritative sources.

Stop when:

- a required handoff is missing or not ready;
- the deterministic path remains `blocked`;
- ownership, source of truth, final state, compatibility, test ownership, performance evidence, or verification is unresolved;
- a narrower design satisfies the same acceptance criteria;
- a planned abstraction, extension, compatibility path, recovery mechanism, optimization, stronger guarantee, test framework, registry, benchmark framework, or helper lacks a current requirement.

Do not hide the same complexity by splitting it across more files.

## TEST IMPACT

For every non-trivial code, test, tooling, CI, or configuration change, include:

```text
TEST IMPACT
Changed contracts:
- <contract or scenario>

Required proof:
- unit-tests: <existing/new test paths | not applicable: reason>
- storybook-behavior: <spec paths | not applicable: reason>
- e2e: <spec paths | not applicable: reason>
- visual: <spec paths | not applicable: reason>
- release: <checks | not applicable: reason>
- performance: <metric/check/measurement | not applicable: reason>

Impact resolution:
- unit: related import graph | direct test | full-lane fallback
- Playwright: existing mapping | mapping update | justified standalone | full-lane fallback

Projects:
- canonical | canonical + mobile (<risk>)

Mutation:
- applicable: <source/test scope and risk>
  | not applicable: <reason>
```

Rules:

- one production file may require several proof types;
- name exact existing or new test/spec paths before production edits;
- update the owning Playwright mapping or justified standalone entry in the same change when a spec is added, moved, removed, or its stable source relation changes;
- use standalone only when no truthful stable source mapping exists, and record a concrete reason;
- select full-lane fallback for shared config/helpers, dynamic-import boundaries, or unknown impact rather than pretending scope is empty;
- name a representative metric, scenario/dataset, environment, and budget/baseline for any performance or optimization claim;
- do not create permanent benchmark infrastructure for one task;
- do not add tests solely because a production file changed;
- do not use a less faithful test type because it is easier to run;
- if implementation changes the planned contracts or impact, update preflight before continuing.

## Contract changes

For persisted formats, public APIs, shared UI, Material library/foundation, service/worker/provider, or cross-layer contracts also record:

- affected consumer inventory;
- current and canonical owner when migration applies;
- compatibility decision;
- applicable edge cases;
- proof per distinct consumer path.

## Workflow routing

Use the domain workflow as the primary execution contract:

- official public Material component family: `material-component-authoring`;
- Material foundation contract: `material-foundation`;
- project-specific or generic shared UI primitive: `shared-ui-implementation`;
- Material component choice, usage, composition, or product UI/UX: `material3-guidelines`;
- storage/service/worker/provider: applicable scoped rules and `crdt-storage`;
- diagnostics: `diagnostic-events`;
- ordinary Vue implementation mechanics: `vue-component-implementation`.

Use testing skills according to `TEST IMPACT`: `unit-testing`, `component-contract-testing`, `ui-browser-behavior`, `visual-regression-testing`, `mutation-testing`, and `verification`.

The preflight records only task-specific owners, risks, pass order, and proof. It must not restate a family blueprint, foundation registry schema, Material workflow, state-matrix rules, or resolver implementation.

### Material work

For Material component or foundation work, record only the selected workflow/blueprint, affected family or foundation domains, consumers, safe passes, highest-risk proof, canonical visual reference, operator gate, and unresolved blockers.

### Scoped rule application

Use nested `AGENTS.md` and domain skills as detailed policy.

- Storage/service/worker/provider: fact owner, public path, error/recovery owner, and forbidden UI reconstruction.
- FSD cross-layer: model/read/action/composition split and public APIs.
- Shared UI: consumer blast radius and applicable contract/browser/visual proof.
- Diagnostics: safe boundary and privacy contract.

A scoped-rule conflict is blocking.

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

Keep the written preflight usually within 10–20 short lines plus `TEST IMPACT`. Before completion, confirm the diff still matches the ready handoff or deterministic workflow and that owners, exports, impact mappings, tests, performance evidence, and review status remain consistent.
