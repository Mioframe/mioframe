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

## Source-resolution discipline

- Resolve implementation details from the ready handoff, current workspace, applicable rules, project history available in the repository, code, tests, and documented project commands before asking the operator anything.
- Read-only repository inspection is ordinary source reading and does not require operator confirmation merely because it uses Git. Use narrow read-only commands such as `git status`, `git diff`, `git log`, `git show`, `git rev-parse`, `git merge-base`, and `git ls-files` when they are the simplest way to establish the current or pre-change source state.
- Read-only inspection must not modify refs, index, working tree, configuration, hooks, remotes, or repository state. Repository-mutating Git operations remain outside this rule and require the task/workflow to authorize them.
- Do not ask the operator to choose between implementation options, provide a baseline, or confirm a repository fact when authoritative workspace evidence can resolve it.
- Ask only when a required product/architecture decision or external input is genuinely unavailable from the accepted contract and readable sources. If an execution environment actually rejects a read-only inspection command, use another available read mechanism where practical and report the concrete blocker rather than asking for speculative permission.

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
  - Oracle source:
  - Must reject:
  - Test author: dedicated test agent/session | existing proof only
  - Red phase: required | not applicable — <reason>
  - Additional proof:
  - Existing proof:
  - New/updated proof:
  - Risk or platform matrix:
  - Durable ownership/impact updates:
```

Follow `docs/testing/architecture.md`. Whenever automated behavioral proof is added or materially changed, also follow `test-first` and `test-authoring`: the expected result must come from independent accepted contract/evidence, the proof must be authored in a fresh test-agent/session separate from production implementation, and the selected proof type must satisfy its quality rules rather than exist for coverage/count alone.

For Storybook-owned UI proof also follow `docs/testing/storybook.md` and current executable state from `docs/testing/migration-plan.md`.

Resolve:

- the stable contract/scenario being changed;
- the lowest faithful primary proof;
- the independent oracle for the expected result;
- at least one plausible incorrect observable result that the selected proof must reject;
- whether the task needs a dedicated test-author pass or existing proof is already sufficient and unchanged;
- whether a meaningful focused red check can and should fail against the pre-change implementation;
- additional proof required by cross-contract risk;
- affected existing tests/stories/snapshots/browser specs/consumer flows/performance evidence/mutation targets;
- new, moved, renamed, or removed proof files;
- required durable ownership/impact updates;
- applicable browser/mobile/accessibility/visual/release/data-safety/performance risks;
- exact metric/budget when making a performance claim.

The `Must reject` item is a proof-sensitivity check, not an instruction to enumerate every theoretical error. It exists because a coding agent can otherwise make implementation and test agree while both encode the same mistake.

Do not add explicit registry metadata when deterministic local ownership already expresses the relation. Do not list a proof merely because a lane exists.

Do not begin a behavior-changing production pass while new/materially changed behavioral proof still belongs to the same implementation context. Run the dedicated test-author pass first. If the oracle is unresolved, return to the upstream architecture/product decision.

When accepted proof is handed to the implementation agent, test expectations/assertions are implementation constraints. If the implementer believes the proof is wrong, it must stop and return that conflict to the test owner/architect rather than edit the proof opportunistically.

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

Use `test-first` whenever automated behavioral proof is added or materially changed. It owns dedicated test-author routing, proof independence, failure sensitivity, and the focused red/green cycle when meaningful. The dedicated test-author context then uses `test-authoring` plus the proof-type skill selected by `TEST IMPACT`: `unit-testing`, `component-contract-testing`, `ui-browser-behavior`, `visual-regression-testing`, `mutation-testing`, and `verification`.

## Breadth control

- Four or more independent domains require explicit passes and focused proof after risky passes.
- Keep behavior-preserving cleanup separate from functional change when practical.
- Do not start the next risky pass before the previous one has focused verification.
- Split the task when one independently valid prerequisite has materially wider blast radius than the selected target.

## Output

Keep the preflight implementation-oriented and concise. It should tell a coding worker exactly what to change, what must remain unchanged, how proof is authored independently, what plausible wrong outcome it must reject, and when to stop.
