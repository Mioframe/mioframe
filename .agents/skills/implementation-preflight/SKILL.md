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

- Resolve implementation details from the ready handoff, current workspace, applicable rules, project history already represented in readable repository sources, code, tests, and documented project commands before asking the operator anything.
- Coding and test-author contexts follow root `AGENTS.md` Git ownership: do not run direct `git ...` commands, including read-only status/diff/log/show/branch/worktree inspection. Git/GitHub state and baseline comparison that require direct Git are architect/integration-owner responsibilities.
- Project-owned commands may use Git internally as an implementation detail. That does not transfer Git ownership to the coding/test context.
- Do not ask the operator to choose between implementation options, provide a baseline, or confirm a repository fact when authoritative readable workspace evidence or an assigned architect-provided baseline already resolves it.
- Ask only when a required product/architecture decision or external input is genuinely unavailable from the accepted contract and readable sources. If a required baseline cannot be established without architect-owned Git access, report that exact remaining validation instead of substituting a guess.

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

When the accepted task requires a bounded audit, the preflight must additionally record:

- the closed audit population: exact roots/file classes/searchable relation being inspected;
- the completion criterion that proves that population was exhausted;
- representative known examples as examples only, never as the audit boundary;
- what evidence distinguishes “needs explicit ownership/mapping” from “already represented by an existing project mechanism”.

Do not begin the implementation pass if “audit the relevant files” is still open-ended.

### Impact/selection planner preflight

When the task changes an impact planner, dependency selector, test selector, release selector, ownership mapper, or similar mechanism that decides which proof/consumer runs, the preflight must describe **ownership mechanisms**, not only example paths.

Record a compact acceptance matrix containing, for every materially distinct current mechanism:

- source/input population;
- truthful owner or delegated resolver;
- how ownership is expressed: import graph, exact external relation, bounded scan/set relation, runtime/tool discovery, status/global fallback, or another verified mechanism;
- representative current repository case;
- the wrong omission/over-selection it must reject;
- whether a real delegated resolver/tool probe is required in addition to pure planner assertions.

If the planner consumes status-aware changed paths, the acceptance matrix must also cover every status transition that can change ownership semantics: `added`, `modified`, `deleted`, and both old/new sides of `renamed`. In particular, a surviving external owner must not disappear merely because its source path was deleted or renamed and no longer exists in the current tree. Use focused exact ownership when the historical relation is still deterministic; use the existing fail-closed fallback only when it is not.

For every bounded scan/set ownership rule, verify both a representative path inside the actual scanned population and a nearby negative path outside it. The planner predicate must mirror the owning scan's real population, not reuse a broader adjacent category simply because that is convenient.

A path list or grep pattern is not a substitute for this matrix. Search expressions are discovery aids only.

If the planner delegates ownership to another mechanism such as `vitest related`, Playwright discovery, a release consumer chain, or another project-owned resolver, pure planner tests prove only the planner output. At least one representative case for each newly introduced or materially changed delegated mechanism must be checked through the real resolver/tool semantics when that is practical and deterministic. Do not make the planner test and implementation agree on an unverified assumption about what the delegated resolver will select.

When current tests observe repository state outside an import graph — for example direct file reads, runtime config discovery, directory scans, or existence/absence checks — classify those as external ownership explicitly instead of silently excluding them because they do not fit an exact-file mapping.

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
  - Task-specific measurements:
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
- task-specific measurements that cannot be automated yet;
- exact metric/budget and representative environment when making a performance claim.

For a bounded audit, `Must reject` must include at least one omission outside the initial example set when that is a realistic failure mode. Proof should demonstrate that completion follows the declared population/ownership rule rather than from matching a hand-written list of examples.

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

Keep the preflight implementation-oriented and concise. It should tell a coding worker exactly what to change, what must remain unchanged, how proof is authored independently, what plausible wrong outcome it must reject, and when to stop. For bounded audits, it must also make the audit population and completion criterion explicit enough that examples cannot be mistaken for the complete scope. For impact/selection planners, it must also state the ownership-mechanism acceptance matrix and any real delegated-resolver probes required to validate it.