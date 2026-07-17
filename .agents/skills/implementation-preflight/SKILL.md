---
name: implementation-preflight
description: 'Use before non-trivial implementation work to resolve owners, public entry points, minimum design, risks, passes, and verification before the first production edit.'
---

# Implementation preflight

Use before non-trivial code edits. Keep the artifact short and bounded. Do not repeat scoped repository policy or copy complete domain contracts into the preflight.

## Activation

Use when work may change production code, tests, tooling, CI, configuration, storage semantics, diagnostics, browser behavior, or user-visible UI.

Skip only for trivial typo, formatting, comment, or mechanical rename work with no ownership or behavior decision.

## Required artifact

Record:

0. **Authoring source** — ready architecture handoff or named deterministic repository workflow and authoritative sources.
1. **Owner map** — source of truth, runtime owner, user-action owner, composition owner, error/recovery owner, and verification owner where applicable.
2. **Public entry points** — owning layer and APIs; no deep imports.
3. **Reuse** — existing helpers, components, configs, schemas, services, tests, and dependencies already owning nearby behavior.
4. **Minimum sufficient design** — every planned concept mapped to a current requirement or boundary; simpler alternative compared explicitly.
5. **Acceptance matrix** — only reachable happy and failure/cancellation states required by the current contract.
6. **Risk matrix** — only applicable browser, lifecycle, async, data, accessibility, visual, CI, or tooling risks.
7. **Breadth and passes** — independent domains and safe implementation order.
8. **Verification** — focused proof for the highest risk plus final repository verification.

Proceed without a separate architecture handoff only when an applicable repository policy defines a deterministic authoring path and every required decision is resolved from authoritative sources.

Stop when:

- a required handoff is missing or not ready;
- the deterministic path remains `blocked`;
- ownership, source of truth, final state, compatibility, or verification is unresolved;
- a narrower design satisfies the same acceptance criteria;
- a planned abstraction, extension, compatibility path, recovery mechanism, optimization, stronger guarantee, or testing framework lacks a current requirement.

Do not hide the same complexity by splitting it across more files.

## Contract changes

For persisted formats, public APIs, shared UI, Material library/foundation, service/worker/provider, or cross-layer contracts also record:

- affected consumer inventory;
- current and canonical owner when migration applies;
- compatibility decision;
- applicable edge cases;
- verification per distinct consumer path.

## Workflow routing

Use the domain workflow as the primary execution contract:

- official public Material component family: `material-component-authoring`;
- Material foundation contract: `material-foundation`;
- project-specific or generic shared UI primitive: `shared-ui-implementation`;
- Material component choice, usage, composition, or product UI/UX: `material3-guidelines`;
- storage/service/worker/provider: applicable scoped rules and `crdt-storage`;
- diagnostics: `diagnostic-events`;
- ordinary Vue implementation mechanics: `vue-component-implementation`.

The preflight records only task-specific owners, risks, pass order, and proof. It must not restate a family blueprint, foundation registry schema, Material migration workflow, state-matrix rules, or validator checklist.

### Material component work

When `material-component-authoring` applies, record only:

- selected authoring and component change mode;
- canonical family blueprint path and readiness;
- affected family, foundation domains, exports, and consumers;
- safe implementation passes;
- highest-risk contract/browser/visual proof;
- unresolved blockers and review gates.

Do not reconstruct the Material workflow here. A ready family blueprint and `material-component-authoring` define it.

### Material foundation work

When `material-foundation` applies, record only:

- registry domain/status/snapshot;
- current/canonical owner and migration status;
- public/private/testing contract delta;
- selected change mode;
- consumers and representative verification.

Physical relocation must not hide a correction or replacement.

## Scoped rule application

Use nested `AGENTS.md` and domain skills as detailed policy.

- Storage/service/worker/provider work: record fact owner, public path, error/recovery owner, and forbidden UI reconstruction.
- FSD cross-layer work: record model/read/action/composition split and public APIs.
- Shared UI: record consumer blast radius and applicable contract/browser/visual proof.
- Diagnostics: record only the safe boundary and privacy contract.

A scoped-rule conflict is blocking.

## Wide UI/refactor gate

For non-trivial UI or cross-layer refactors record:

- preserved user scenarios;
- owner and public entry point for each changed behavior;
- persisted settings/preferences/flags affected;
- shared UI, Material foundation, and visual surfaces affected;
- browser, visual, Storybook, e2e, mutation, unit, and manual review that applies.

If implementation changes a scenario, invariant, owner, public API, Material path, foundation dependency, architecture decision, or verification decision, update the upstream contract before completion.

## Breadth control

Count independent domains before editing.

- Four or more domains require explicit passes and focused proof after risky passes.
- Keep behavior-preserving cleanup separate from functional change when practical.
- Do not start the next risky pass before the previous one has focused verification.
- If repeated correction rounds add concepts or workarounds, stop and redo the architecture/preflight.

## Feature-flow guardrails

For multi-step flows:

- include only reachable cancellation, unsupported API, permission, invalid input, conflict, race, partial failure, rollback, and recovery states;
- separate intents with different invariants or recovery contracts;
- keep domain/storage invariants below UI;
- refuse invalid targets instead of accepting broadly and compensating later;
- keep typed outcomes local;
- delete obsolete owners with their replacement unless compatibility is explicit;
- prefer pure/domain tests before component wiring; use browser/visual proof for layout, focus, gestures, overlays, adaptivity, and appearance.

## Bounded reuse search

Search only enough to identify the current owner and reusable mechanism. Do not perform broad exploration to justify a generic abstraction.

## Output discipline

Keep the written preflight usually within 8–15 short lines plus verification. Before completion, confirm the diff still matches the ready handoff or deterministic workflow and that owners, exports, registry/map records, tests, and review status remain consistent.
