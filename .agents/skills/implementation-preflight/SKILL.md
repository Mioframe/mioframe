---
name: implementation-preflight
description: 'Use before ordinary non-trivial code edits to convert a ready architecture handoff or deterministic workspace contract into a compact implementation plan with ownership, TEST IMPACT, and verification.'
---

# Implementation preflight

Run this before ordinary non-trivial production edits unless an applicable deterministic workflow explicitly owns a narrower equivalent implementation check.

Official Material standalone implementation and Material consumer migration are such deterministic exceptions: `material-component-implementation` and `material-component-migration` own their own scoped readiness/proof checks and must not invoke this generic preflight.

The preflight does not invent architecture. It consumes either:

- a ready `architect-handoff`; or
- a deterministic workspace-backed authoring contract whose applicable policy explicitly allows the handoff to be skipped.

## Stop conditions

Do not begin implementation when:

- the applicable handoff is missing or `not ready`;
- a deterministic workflow is unresolved or `blocked`;
- required behavior, ownership, source of truth, target state, public contract, dependency, agent-access boundary, or test ownership is unresolved;
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
- files/modules expected to change;
- implementation passes and pass order;
- consumer migration scope when applicable;
- required removal of replaced logic;
- `TEST IMPACT`;
- final verification.

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

Resolve:

- the stable contract/scenario being changed;
- the lowest faithful primary proof;
- additional proof required by cross-contract risk;
- affected existing tests/stories/snapshots/browser specs/consumer flows/performance evidence/mutation targets;
- new, moved, renamed, or removed proof files;
- required durable ownership/impact updates;
- applicable browser/mobile/accessibility/visual/release/data-safety/performance risks;
- exact metric/budget when making a performance claim.

Do not add explicit registry metadata when deterministic local ownership already expresses the relation. Do not list a proof merely because a lane exists.

## Consumer migration

When a public/shared owner changes, record:

- affected consumer inventory;
- current and canonical owner;
- compatibility decision;
- applicable edge cases;
- proof per materially distinct consumer path;
- obsolete target-owned implementation/exports to remove;
- unrelated modules that must remain unchanged.

Material consumer migration does not use this section; its dedicated Material migration skill owns the narrower deterministic checklist.

## Workflow routing

Use the domain workflow as the execution contract:

- official Material component: `material-component`;
- Material API contract: `material-component-api-contract`;
- Material token contract: `material-component-token-contract`;
- Material behavior contract: `material-component-behavior-contract`;
- Material standalone implementation: `material-component-implementation`;
- Material consumer migration: `material-component-migration`;
- project-specific/generic shared UI outside official Material targets: `shared-ui-implementation`;
- storage/service/worker/provider: applicable scoped rules and `crdt-storage`;
- diagnostics: `diagnostic-events`;
- ordinary Vue mechanics: `vue-component-implementation`.

Use testing skills according to selected proof: `unit-testing`, `component-contract-testing`, `ui-browser-behavior`, `visual-regression-testing`, `mutation-testing`, and `verification`.

## Breadth control

- Four or more independent domains require explicit passes and focused proof after risky passes.
- Keep behavior-preserving cleanup separate from functional change when practical.
- Do not start the next risky pass before the previous one has focused verification.
- Split the task when one independently valid prerequisite has materially wider blast radius than the selected target.

## Output

Keep the preflight implementation-oriented and concise. It should tell a coding worker exactly what to change, what must remain unchanged, how to prove it, and when to stop.
