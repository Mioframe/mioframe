---
name: implementation-preflight
description: 'Use before non-trivial code edits to convert a ready architecture handoff or deterministic repository authoring contract into a compact implementation plan with explicit ownership, passes, TEST IMPACT, and verification.'
---

# Implementation preflight

Run this before non-trivial production edits.

The preflight does not invent architecture. It consumes either:

- a ready `architect-handoff`; or
- a deterministic repository-backed authoring contract whose applicable policy explicitly allows the handoff to be skipped.

## Stop conditions

Do not begin implementation when:

- the applicable handoff is missing or `not ready`;
- a deterministic workflow is unresolved or `blocked`;
- required behavior, ownership, source of truth, target state, public contract, dependency, agent-access boundary, or test ownership is unresolved;
- the proposed passes expand scope beyond the accepted contract;
- task-specific `TEST IMPACT` is incomplete;
- the simplest viable implementation has not been compared with the proposed design.

Resolve the upstream contract first.

## Required preflight record

Record compactly:

- authoring source: ready handoff or named deterministic workflow and artifact;
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

Do not repeat repository-wide policy or the complete upstream contract.

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
  - Persistent impact metadata:
```

Follow `docs/testing/architecture.md`.

The record must resolve:

- the stable contract or scenario being changed;
- the lowest faithful primary proof;
- every additional proof type required because the change crosses multiple contracts;
- existing tests, stories, snapshots, browser specs, consumer flows, performance evidence, or mutation targets affected;
- new, moved, renamed, or removed proof files;
- required automatic impact metadata updates;
- browser, mobile, accessibility, visual, release, data-safety, and performance risks that apply;
- exact metric and budget when the task makes a performance or optimization claim.

Do not list proof merely because a lane exists. Every selected proof maps to a changed contract or risk.

## Consumer migration

When a public or shared owner changes, record:

- affected consumer inventory;
- current and canonical owner;
- compatibility decision;
- applicable edge cases;
- proof per materially distinct consumer path;
- obsolete target-owned implementation and exports to remove;
- unrelated legacy components or shared modules that must remain unchanged.

## Workflow routing

Use the domain workflow as the primary execution contract:

- official Material component target or proven inseparable family implementation, migration, or adapter change: `material-component-adapter`; use its ready family `README.md` as the deterministic authoring contract and escalate to `architect-handoff` only for unresolved cross-family, theme, renderer-strategy, or public-token architecture;
- project-specific or generic shared UI primitive outside official Material targets: `shared-ui-implementation`;
- storage/service/worker/provider: applicable scoped rules and `crdt-storage`;
- diagnostics: `diagnostic-events`;
- ordinary Vue implementation mechanics: `vue-component-implementation`.

Use testing skills according to the proof selected in `TEST IMPACT`: `unit-testing`, `component-contract-testing`, `ui-browser-behavior`, `visual-regression-testing`, `mutation-testing`, and `verification`.

The preflight records only task-specific owners, risks, pass order, proof, and metadata changes. It must not restate resolver implementation or general testing policy.

## Breadth control

- Four or more independent domains require explicit passes and focused proof after risky passes.
- Keep behavior-preserving cleanup separate from functional change when practical.
- Do not start the next risky pass before the previous one has focused verification.
- Split the task when one independently valid prerequisite has materially wider blast radius than the selected target.
- Do not split research, adapter implementation, target consumer migration, and target-owner removal into permanent independent work when one focused PR can safely complete them.

## Output

Keep the preflight implementation-oriented and concise. It should tell a coding agent exactly what to change, what must remain unchanged, how to prove it, and when to stop.
