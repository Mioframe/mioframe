---
name: implementation-preflight
description: 'Use before non-trivial code edits to convert a ready architecture handoff or deterministic workspace authoring contract into a compact implementation plan with explicit ownership, passes, TEST IMPACT, and verification.'
---

# Implementation preflight

Run this before non-trivial production edits.

The preflight does not invent architecture. It consumes either:

- a ready `architect-handoff`; or
- a deterministic workspace-backed authoring contract whose applicable policy explicitly allows the handoff to be skipped.

## Stop conditions

Do not begin implementation when:

- the applicable handoff is missing or `not ready`;
- a deterministic workflow is unresolved or `blocked`;
- required behavior, ownership, source of truth, target state, public contract, dependency, agent-access boundary, or test ownership is unresolved;
- an official Material family lacks complete API, token, or behavior contracts required by `src/shared/ui/material/docs/component-contract.md`;
- proposed passes expand scope beyond the accepted contract;
- task-specific `TEST IMPACT` is incomplete;
- the simplest viable implementation has not been compared with the proposed design.

Resolve the upstream technical contract first.

## Required preflight record

Record compactly:

- authoring source: ready handoff or named deterministic workflow and ready artifacts;
- goal and non-goals;
- confirmed current behavior and evidence;
- owners and public entry points;
- source of truth and state shape;
- minimum implementation design and simpler alternative;
- files and modules expected to change;
- implementation passes and pass order;
- consumer migration scope when applicable;
- required removal of replaced logic;
- `TEST IMPACT`;
- final verification.

For standalone Material component implementation, the authoring source is exactly:

```text
components/<family>/contract.ts
components/<family>/tokens.css
components/<family>/BEHAVIOR.md
```

These are fixed renderer-independent inputs. Family `README.md` guidance is independent and does not block standalone implementation. The standalone implementation preflight resolves only Vue/m3e mapping, component-owned proof, exports, and focused verification. It must not include application consumer migration.

For the later Material migration worker, run a separate focused preflight because it has a different owner/context. Migration requires the completed canonical component plus all four family definition artifacts, including `README.md`; it resolves only correct Material application from guidance, consumer inventory, product-behavior preservation, legacy removal, migration proof, and focused verification.

Do not repeat workspace-wide policy or the complete upstream definition.

## TEST IMPACT

For each materially changed contract or user scenario, record:

```text
TEST IMPACT
- Contract/scenario:
  - Primary proof owner:
  - Additional proof:
  - Existing proof:
  - New/updated proof:
  - Risk or platform matrix:
  - Durable ownership/impact updates:
```

Follow `docs/testing/architecture.md`. For Storybook-owned UI proof also follow `docs/testing/storybook.md` and current executable state from `docs/testing/migration-plan.md`.

The record must resolve:

- the stable contract or scenario being changed;
- the lowest faithful primary proof;
- every additional proof type required because the change crosses multiple contracts;
- existing tests, stories, snapshots, browser specs, consumer flows, performance evidence, or mutation targets affected;
- new, moved, renamed, or removed proof files;
- required durable automatic ownership changes: local convention, explicit/transitional mapping, snapshot ownership, standalone ownership, or full fallback as applicable;
- browser, mobile, accessibility, visual, release, data-safety, and performance risks that apply;
- exact metric and budget when the task makes a performance or optimization claim.

Do not add explicit registry metadata when a currently supported deterministic local owner convention already expresses the relation. Do not rely on target colocation before the owning runner supports it.

Do not list proof merely because a lane exists. Every selected proof maps to a changed contract or risk.

## Consumer migration

When a public or shared owner changes, migration preflight records:

- affected consumer inventory;
- current and canonical owner;
- canonical component/variant/configuration choice according to family `README.md`;
- compatibility decision;
- applicable edge cases;
- proof per materially distinct consumer path;
- obsolete target-owned implementation and exports to remove;
- unrelated legacy components or shared modules that must remain unchanged.

For Material, this preflight belongs to `material-component-migration` and runs only after standalone component implementation/proof and family guidance are complete. Consumer evidence must not feed back into canonical API/token/behavior/guidance selection.

## Workflow routing

Use the domain workflow as the execution contract:

- official Material component: `material-component` orchestrates three technical contracts, independent usage guidance, standalone implementation, separate migration, and independent review;
- Material API contract: `material-component-api-contract`;
- Material token contract: `material-component-token-contract`;
- Material behavior contract: `material-component-behavior-contract`;
- Material usage guidance: `material-component-guidance`;
- Material standalone implementation: `material-component-implementation`;
- Material consumer migration: `material-component-migration`;
- Material independent review: `material-component-review`;
- project-specific or generic shared UI outside official Material targets: `shared-ui-implementation`;
- storage, service, worker, or provider: applicable scoped rules and `crdt-storage`;
- diagnostics: `diagnostic-events`;
- ordinary Vue mechanics: `vue-component-implementation`.

Use testing skills according to proof selected in `TEST IMPACT`: `unit-testing`, `component-contract-testing`, `ui-browser-behavior`, `visual-regression-testing`, `mutation-testing`, and `verification`.

The preflight records only task-specific owners, risks, pass order, proof, and ownership/impact changes. It must not restate general workflow or testing policy.

## Breadth control

- Four or more independent domains require explicit passes and focused proof after risky passes.
- Keep behavior-preserving cleanup separate from functional change when practical.
- Do not start the next risky pass before the previous one has focused verification.
- Split the task when one independently valid prerequisite has materially wider blast radius than the selected target.
- Do not recombine Material definition extraction, standalone implementation, migration, and independent review into one worker context.

## Output

Keep the preflight implementation-oriented and concise. It should tell a coding worker exactly what to change, what must remain unchanged, how to prove it, and when to stop.
