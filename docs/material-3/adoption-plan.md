# Material 3 adoption plan

## Principle

Adopt Material incrementally through real component migrations.

Do not build a complete validation framework, exhaustive migration database, generic test DSL, or mass source-tree migration before the first canonical families prove what is actually needed.

Every in-scope shared UI artifact must eventually reach one accepted terminal outcome:

- canonical official Material component, pattern, or foundation owner;
- explicitly retained project-specific or generic UI owner outside Material;
- removed or consolidated obsolete or duplicate owner.

The operating model, source hierarchy, ownership rules, blueprint contract, testing layers, agent evidence review, and operator visual acceptance were established by PR #149. Later work should use those contracts rather than add another preparatory architecture phase.

## Default migration loop

Each family migration follows one practical loop:

1. inspect the current owner, public API, consumers, user flows, tests, stories, and known defects;
2. resolve the current official Material 3 Expressive contract and the minimum supported surface;
3. audit only the foundation domains required by that family;
4. make focused foundation changes only when the migration proves they are necessary;
5. implement the canonical family and migrate consumers;
6. align the family with the accepted Expressive contract;
7. update tests, Storybook evidence, snapshots, registries, inventory rows, risk registration, and migration maps that are actually affected;
8. complete agent evidence review;
9. hand prepared visual evidence to the operator when visual acceptance is required;
10. record process lessons and add automation only when a stable repeated need has been demonstrated.

The default unit of work is one cohesive family end to end. Split work into separate PRs only when a broad foundation blast radius, reviewability, or the need for a safe independently valid intermediate state justifies it.

## Phase 0: operating model

Status: complete.

PR #149 established:

- the canonical Material 3 Expressive source hierarchy;
- the `src/shared/ui/material` ownership target;
- component and foundation contracts;
- the family blueprint and testing model;
- agent evidence review and operator-only visual acceptance;
- registries, inventory ownership, migration-map ownership, and scoped agent instructions.

No additional validator or full-library inventory gate is required before the first pilot.

## Phase 1: first end-to-end pilot — `MDButton`

Use Button as the first pilot unless current consumer evidence proves another family is a materially better starting point.

The pilot includes, in one milestone:

- current implementation and consumer audit;
- exact supported Material 3 Expressive surface;
- only the foundation readiness work required by Button;
- canonical Button family ownership;
- API, native semantics, accessibility, interaction, token, state, anatomy, and DOM ownership;
- consumer migration;
- Material alignment;
- contract, browser, pure, consumer, and visual proof as applicable;
- removal of obsolete Button owners and exports;
- agent evidence review and operator visual acceptance.

Focused preparatory or foundation PRs are allowed, but they do not become permanent roadmap phases and do not complete the pilot by themselves.

At the end of the pilot, record which rules were useful, which documents duplicated work, and which defects could have been prevented by a small precise check.

## Phase 2: independent stateful pilot

Migrate a high-priority stateful family with a materially different interaction model. `MDSwitch` is the default candidate unless current evidence identifies a stronger alternative.

The second pilot must challenge the process with:

- controlled state without hidden copies;
- keyboard and pointer/touch behavior;
- cancellation and cleanup where applicable;
- disabled and presentation contracts;
- multiple anatomy or DOM owners;
- property-specific coexistence;
- focus, ripple, motion, shape, color, accessibility, and target-area dependencies;
- separation of visual-state proof from real browser behavior.

After two pilots, consolidate only the workflow and automation that both migrations prove to be stable and valuable.

## Phase 3: priority queue and continuous migration

After the pilots, maintain a short evidence-backed `P0`/`P1` queue rather than requiring exhaustive classification before work begins.

Priority considers:

- consumer reach;
- critical repeated workflows;
- interaction frequency;
- Material and foundation leverage;
- current correctness or maintenance risk;
- dependency readiness;
- migration blast radius;
- whether removal or consolidation is more valuable than migration.

Inventory work is just in time:

- fully inspect and update the family selected for the next migration;
- keep directly affected rows current;
- add newly discovered shared UI owners as they become relevant;
- progressively classify the remaining library without blocking high-value migrations.

The continuous migration loop remains:

```text
discovery → accepted contract → required foundation work → implementation →
consumer migration → proof → agent review → operator visual acceptance → lessons
```

A genuinely new component without a legacy owner is implemented when the product needs it. It is not a gate before normal migration can continue.

## Evidence-driven automation

Automation is a consequence of migration evidence, not a prerequisite for migration.

Add a guard only when all of the following are true:

- it protects a stable accepted contract demonstrated by real work;
- the failure is repeated or has a clearly material regression risk;
- the check is precise and has a low false-positive rate;
- existing repository tooling can express it without a parallel architecture system;
- maintenance cost is lower than the review burden it removes.

Do not add automation merely because a future mistake is imaginable.

Static or structured checks may be introduced inside a migration or follow-up PR when these conditions are met. They do not require their own roadmap milestone.

## Foundation changes

Audit foundation domains only for the selected family.

Reuse an existing owner when it is sufficient and remains the single accepted owner. Create a focused foundation PR when a correction, replacement, relocation, or additive extension has wider consumer impact than the component migration can safely review.

Do not relocate every foundation owner in advance and do not split a cohesive legacy owner merely to match the target directory structure.

## Program completion

The program is complete when every in-scope shared UI artifact has a terminal outcome and every Material-owned artifact has one canonical current owner.

Exhaustive inventory is therefore a completion requirement, not a prerequisite for starting useful migrations.

The program does not require implementing every optional component or capability published by Material.
