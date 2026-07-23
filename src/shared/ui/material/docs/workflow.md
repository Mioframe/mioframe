# Material library development workflow

This document owns the development and review stages for official Mioframe Material component families and shared Material foundations.

The workflow is:

```text
approved architecture and ready contract
→ implementation
→ independent technical review
→ operator visual acceptance when required
→ merge
```

No coding context may define the contract, implement it, and approve its own result.

## Roles

### Architect and specification owner

The architect owns decisions that may change:

- goals and non-goals;
- required product scenarios;
- official source snapshot and supported Material surface;
- family and foundation ownership;
- public API and native semantics;
- state shape and source of truth;
- compatibility and consumer migration;
- acceptance criteria and verification ownership;
- intentional deviations;
- merge recommendation.

The architect creates or approves the family `README.md` contract and marks it `Readiness: ready` only when every implementation-affecting decision is resolved.

### Coding agent

The coding agent implements an approved contract. Before production edits it reads:

1. the applicable `AGENTS.md` files;
2. the ready family or foundation contract;
3. the explicit implementation task;
4. current code, consumers, tests, stories, and affected foundation owners;
5. applicable Material and testing policies.

The coding agent owns:

- task-specific implementation preflight;
- production implementation;
- consumer migration;
- tests and Storybook evidence required by the approved contract;
- obsolete-owner removal;
- focused and final repository verification;
- a completion report mapping acceptance criteria to evidence.

The coding agent must not:

- select a different family or broaden the supported surface;
- change ownership, public API, state source of truth, compatibility, or required foundation contracts without approval;
- silently rewrite repository policy to make implementation easier;
- weaken or bypass verification;
- perform the independent technical review;
- claim merge readiness.

When implementation evidence invalidates the approved contract, stop the affected work and report:

```text
CONTRACT BLOCKER
Confirmed evidence:
Invalidated decision:
Impact:
Required architect decision:
Safe work that may continue:
```

A local implementation detail may be resolved without escalation only when it does not change the approved contract or ownership.

### Independent technical reviewer

The reviewer must not be the context that implemented the change. The reviewer inspects the complete resulting PR, not only the latest correction patch.

The reviewer owns:

- conformance to goals, non-goals, scenarios, and the ready contract;
- official Material source interpretation;
- ownership and dependency direction;
- public API, native semantics, accessibility, state, lifecycle, and browser behavior;
- foundation use and shared UI blast radius;
- consumer migration and obsolete-path removal;
- proportional tests and visual evidence;
- repository verification and risk-specific proof;
- simplicity and absence of workaround architecture;
- the durable family audit;
- merge recommendation.

Findings are consolidated as:

- blockers;
- major issues;
- minor issues;
- not required for this PR.

The reviewer returns exactly one merge recommendation:

- `can merge`;
- `can merge with listed risks`;
- `should not merge until blockers are fixed`;
- `not enough information to decide`.

### Operator visual acceptance

The operator reviews prepared visible evidence only after every technical gate passes.

The implementation/review package provides applicable:

- canonical Storybook story;
- bounded screenshots and visual diff;
- named official documentation snapshot;
- Design Kit reference when required;
- intended matches and explicit deviations;
- confirmation that technical review passed.

The operator checks visible fidelity and motion appearance. Architecture, semantics, accessibility, token ownership, behavior, migration completeness, and test sufficiency are not delegated to visual acceptance.

## Stage gates

### 1. Contract ready

Production edits are allowed only when the family `README.md` or approved foundation handoff records:

- goal and non-goals;
- required scenarios;
- official sources and snapshot;
- supported and unsupported surface;
- current and canonical owner;
- public API and semantics;
- applicable foundations;
- affected consumers and compatibility decision;
- acceptance criteria and proof owners;
- unresolved decisions as `none`;
- `Readiness: ready`.

### 2. Implementation complete

Implementation is complete only when:

- code matches the ready contract;
- affected consumers and exports are migrated;
- obsolete owners are removed unless temporary compatibility was explicitly approved;
- required tests and evidence exist;
- focused checks and final `pnpm verify` pass;
- the completion report names remaining limitations honestly.

Implementation completion is not architecture approval or merge readiness.

### 3. Independent review complete

Review is complete only when the full PR has been checked against the ready contract and official evidence, the family audit is current, and a merge recommendation is stated.

### 4. Visual acceptance complete

Required visual acceptance must be `accepted` before merge. A visual rejection returns named visible mismatches for correction. It reopens architecture only when the mismatch proves the approved contract is wrong.

## Corrections

Use one consolidated correction task per review round. Preserve all unresolved findings from earlier rounds.

After correction, review the complete PR again.

If two correction rounds still reveal ownership errors, missing scenarios, unstable public contracts, mixed responsibilities, architectural drift, or growing workaround logic, stop patching and redo the architecture decision.

## Durable artifacts

- `src/shared/ui/material/docs/workflow.md` — stage and role ownership;
- family `README.md` — approved family contract;
- `src/shared/ui/material/docs/foundation-registry.md` — current foundation ownership and gaps;
- `src/shared/ui/material/docs/audits/<family>.md` — latest independent family review;
- `src/shared/ui/material/docs/library-roadmap.md` — current program milestone, blocker, and next action;
- `src/shared/ui/material/docs/ui-library-inventory.md` — classification, priority, dependencies, and terminal outcome;
- `.agents/skills/material-component-implementation/SKILL.md` — coding procedure;
- `.agents/skills/material-component-review/SKILL.md` — independent review procedure.

Do not create execution ledgers, owner stacks, manager agents, context state machines, duplicate registries, or persistent review histories.
