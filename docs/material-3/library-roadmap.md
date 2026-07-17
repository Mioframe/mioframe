# Material library implementation roadmap

This document is the operational progress tracker for incrementally building `src/shared/ui/material` and resolving the complete shared UI surface.

It answers four questions for a new session:

1. What has been completed?
2. What is active now?
3. What blocks the active work?
4. What is the single next action?

Durable architecture and workflow rules remain in the canonical Material policy documents and skills. This roadmap owns only current sequence, milestone state, blockers, outcomes, and the next action.

## Sources of truth

- `adoption-plan.md` owns the rollout rationale and pilot-first migration loop.
- `source-of-truth.md` owns the current canonical Material 3 Expressive target and source hierarchy.
- `autonomous-review.md` owns agent evidence review, operator visual acceptance, and the review merge gate.
- `ui-library-inventory.md` owns shared-UI classification, evidence-backed priority, queue state, and completion evidence.
- `foundation-registry.md` owns foundation status, evidence, contracts, owners, gaps, and verification.
- `component-registry.md` owns official Material surface alignment and verification status.
- `src/shared/ui/material/README.md` owns the physical migration map.
- family `README.md` files own accepted component blueprints.
- this roadmap owns milestone status, dependencies, blockers, completed outcomes, and the single next action.

When these documents disagree, update the stale progress record rather than redefining architecture from this roadmap.

## Program outcome

The program does not require moving every shared UI artifact into `src/shared/ui/material`.

It is complete when every in-scope artifact reaches one accepted terminal outcome:

- canonical current Material 3 Expressive component, pattern, or foundation owner;
- explicitly retained project-specific or generic shared UI owner outside Material;
- removed or consolidated obsolete or duplicate owner.

For an official component, completion additionally requires source-backed agent review of every non-visual contract and operator acceptance of prepared visual evidence when visual acceptance is required.

Migration begins with real pilots. Inventory, foundation work, documentation, and automation are expanded from confirmed migration needs rather than completed as universal prerequisites.

## Status model

Use exactly one status per milestone:

- `planned` — accepted sequence, work not started;
- `active` — current implementation focus;
- `blocked` — cannot continue until the named blocker is resolved;
- `done` — exit gate passed and the completing PR is merged into `develop`;
- `skipped` — milestone proved unnecessary, with evidence recorded.

Only one milestone should normally be `active`. Focused PRs may contribute to an active milestone without becoming permanent roadmap milestones of their own.

## Current state

Last updated: 2026-07-17

Current milestone: `M1 — MDButton end-to-end pilot`

Current status: `active`

Current blocker: none.

Next action: complete and merge the focused Button contract work in PR #150, then start the canonical end-to-end Button migration from current `develop`; do not add a validator or require exhaustive inventory first.

## Milestone overview

| ID  | Milestone                                      | Status    | Depends on | Exit gate                                                                                                                                                                                                                                             |
| --- | ---------------------------------------------- | --------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | Architecture and operating model               | `done`    | none       | PR #149 merged; canonical Expressive source target, ownership, authoring, testing, review, registry, migration-map, inventory, and scoped agent contracts are available from `develop`                                                                |
| M1  | `MDButton` end-to-end pilot                    | `active`  | M0         | Button family has one canonical Material owner, accepted Expressive alignment, required foundation gaps only, migrated consumers and proof artifacts, removed legacy ownership, passed agent evidence review, and recorded operator visual acceptance |
| M2  | Independent stateful pilot                     | `planned` | M1         | one high-priority stateful family validates controlled state, interaction and cancellation, multiple anatomy owners, accessibility, browser proof, agent review, and operator visual acceptance without bespoke architecture                          |
| M3  | Priority-driven incremental library population | `planned` | M2         | a maintained evidence-backed `P0`/`P1` queue drives repeated family migrations until every inventory row reaches `migrated`, `retained`, or `removed` and every Material artifact has one canonical owner                                             |

## Milestone details

### M0 — Architecture and operating model

Completed by PR #149.

Available contracts include:

- canonical Material 3 Expressive source hierarchy;
- Material library, foundation, component, testing, and migration policies;
- agent evidence review and operator-only visual acceptance;
- scoped `AGENTS.md` routing and execution skills;
- foundation and component registries;
- physical migration map;
- family blueprint and standard proof layers;
- inventory ownership and priority model.

M0 does not require a validator, full inventory population, or production migration.

### M1 — `MDButton` end-to-end pilot

Use Button as the first pilot unless current consumer evidence proves a materially better starting family.

The milestone includes:

1. inspect the current Button family, API, consumers, workflows, stories, tests, tokens, and known defects;
2. resolve the exact supported Material 3 Expressive surface;
3. audit only foundation domains required by Button;
4. make separate foundation changes only when their blast radius requires independent review;
5. implement the canonical Button family;
6. migrate consumers and remove obsolete owners and exports;
7. align the implementation with the accepted Expressive contract;
8. update affected blueprint, registry, inventory, map, stories, tests, snapshots, and risk registration;
9. pass agent evidence review;
10. complete operator visual acceptance.

The default is one end-to-end milestone. Architecture migration and visual alignment may use separate focused PRs only when they preserve a valid intermediate state and materially improve reviewability. They are not permanent sequential milestones.

PR #150 contributes focused current-contract evidence but does not by itself complete M1.

M1 also records process evidence:

- which documents were necessary;
- which steps duplicated work;
- which foundation gaps were real;
- which defects repeated;
- whether any small precise automation is justified.

### M2 — Independent stateful pilot

Use a high-priority stateful family with a materially different interaction model. `MDSwitch` is the default candidate unless current evidence identifies a stronger alternative.

The pilot must prove:

- controlled state without hidden copies;
- disabled and presentation contracts;
- keyboard and pointer/touch behavior;
- cancellation and cleanup where applicable;
- multiple anatomy or DOM owners;
- property-specific coexistence;
- focus, ripple, motion, shape, color, accessibility, and target-area dependencies;
- separation of visual-state evidence from real browser behavior;
- agent closure of non-visual gates;
- operator-only visual acceptance.

After M1 and M2, consolidate only workflow and automation that both pilots demonstrate to be stable and valuable. Do not introduce shared helpers merely because two implementations look similar.

### M3 — Priority-driven incremental library population

After the pilots, maintain a short evidence-backed `P0`/`P1` queue in `ui-library-inventory.md`.

Select work by:

- consumer reach;
- critical repeated workflows;
- interaction frequency;
- Material and foundation leverage;
- current correctness and maintenance risk;
- dependency readiness;
- migration blast radius;
- removal or consolidation value.

Inventory is updated just in time:

- fully inspect the family selected for the next migration;
- update directly affected rows atomically with the migration;
- add newly discovered owners when they become relevant;
- progressively classify the rest of the library without blocking high-value work.

Each migration repeats one loop:

```text
discovery → accepted contract → required foundation work → implementation →
consumer migration → proof → agent review → operator visual acceptance → lessons
```

Rules:

- migrate one cohesive family or foundation domain per focused PR;
- create patterns only after the official-pattern gate passes;
- update only affected contracts, owners, exports, consumers, stories, tests, snapshots, registrations, registries, inventory rows, and maps;
- remove old owners instead of accumulating permanent compatibility layers;
- retain project-specific and generic UI outside Material explicitly;
- remove or consolidate low-value duplicates when that is better than canonicalizing them;
- implement a genuinely new component only when product demand requires it, not as a gate for continued migration.

M3 remains active until every in-scope inventory row has a terminal status. Exhaustive inventory is a program completion requirement, not a prerequisite for starting migrations.

## Automation policy

There is no standalone validation milestone.

Add a guard only when real migration evidence shows that it protects a stable contract, materially reduces repeated review risk, has a low false-positive rate, and can use existing repository tooling without creating a parallel architecture system.

Do not automate hypothetical future mistakes. A migration may introduce a focused check in the same PR or a follow-up PR when the need is proven.

## Progress log

Add one row only when a milestone changes status or its exit gate materially changes.

| Date       | Milestone | Change                                                                                                                                                                    | Evidence |
| ---------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 2026-07-16 | M0        | Architecture and operating model completed                                                                                                                                | PR #149  |
| 2026-07-17 | M1        | Replaced validator-first and exhaustive-preparation gates with a real end-to-end Button pilot; foundation, inventory, and automation now follow confirmed migration needs | PR #152  |

## Update protocol

Every PR that starts, completes, blocks, skips, or materially reslices a roadmap milestone must update this file in the same PR.

Every PR that changes a shared UI artifact's classification, priority, owner, dependencies, or migration state must also update `ui-library-inventory.md`.

Update only:

1. `Current state`;
2. the affected milestone status or exit gate;
3. the single `Next action`;
4. one concise progress-log row;
5. dependencies only when new evidence changes them.

Before starting a new Material session:

1. read `Current state` and `Next action`;
2. confirm the active milestone against merged repository state;
3. inspect only the documents owned by that milestone;
4. do not create preparatory infrastructure without evidence from the active migration;
5. update this roadmap when the session changes progress.