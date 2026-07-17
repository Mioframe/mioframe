---
name: material-library-next
description: 'Use when the user wants the Material 3 Expressive library work to continue without naming a component. Resolve exactly one next family from the active roadmap milestone or the highest-priority unblocked queued inventory candidate, then run material-component end to end for that family.'
---

# Material library next

Use this as the no-name entrypoint for continuing the Material 3 Expressive library program.

This skill owns only next-family selection and workflow startup. It must not duplicate component implementation, review, testing, or completion rules owned by `material-component`, `material-component-authoring`, and `docs/material-3`.

## Required input

No component name is required.

Expected invocation:

```text
material-library-next
```

Do not ask the user to choose a family when repository evidence can select one.

## Read current program state

Read, in order:

1. `docs/material-3/library-roadmap.md`;
2. `docs/material-3/ui-library-inventory.md`;
3. `docs/material-3/component-registry.md` and `foundation-registry.md` only for candidate dependencies or alignment facts;
4. `src/shared/ui/material/README.md` for physical ownership;
5. `docs/material-3/audits/<family-slug>.md` for candidate audit state when present.

Treat each file only as the owner of the facts assigned to it. Correct a stale owning source during the implementation workflow rather than inventing a parallel queue.

## Select exactly one family

Use this order:

1. When the roadmap has one `active` component-family milestone, select that family and follow its single `Next action`.
2. When the active milestone names a focused prerequisite PR rather than component implementation, report that exact prerequisite as the selected next work; do not skip it or start another family.
3. After the pilot milestones, select one inventory row that:
   - is an `official-component` family;
   - has queue status `queued`;
   - has no named blocker;
   - has all recorded dependencies satisfied;
   - has the highest accepted priority, preferring `P0` over `P1`;
   - has the strongest evidence-backed consumer, workflow, leverage, risk, or consolidation value when priorities tie.
4. Do not treat `assessed`, `unclassified`, `blocked`, `migrated`, `retained`, or `removed` as executable component work.
5. Do not select a foundation row through this skill. When the selected family has a required cross-family foundation prerequisite, let `material-component` and `material-component-authoring` route that prerequisite through `material-foundation`.

Do not infer a complete priority order from an inventory that explicitly records incomplete population. During pilots, the roadmap is authoritative.

## Validate selection

Before starting implementation, confirm:

```text
Selected family:
Selection source: active roadmap milestone | queued inventory row
Priority: pilot | P0 | P1
Queue status:
Dependencies:
Blocker: none | <exact blocker>
Latest audit: none | current | stale | blocked
Next action:
```

Stop only when:

- the roadmap names a prerequisite that is not complete;
- no executable queued family exists after the pilots;
- candidate records conflict materially and the owning source cannot be corrected safely;
- every remaining family is blocked or already terminal;
- a genuine blocker defined by `material-component-authoring` applies.

When no executable family exists, report the exact records that must be assessed, queued, or unblocked. Do not choose from memory or component-name familiarity.

## Start the component workflow

After resolving one executable family, load and execute:

```text
material-component <resolved-family>
```

Complete exactly one cohesive family in the current run. Do not automatically begin a second family in the same PR or task.

The component workflow owns:

- source resolution;
- audit consumption;
- adaptive family contract;
- rule refinement;
- required foundation work;
- implementation and consumer migration;
- proportional proof;
- obsolete-owner removal;
- agent review and visual handoff;
- affected roadmap and inventory updates.

## Result

Finish with:

```text
MATERIAL LIBRARY NEXT RESULT
Selection source:
Selected family:
Reason:
Priority:
Dependencies:
Latest audit:
Workflow result: complete | blocked
Operator visual acceptance: not applicable | required | blocked
Roadmap update:
Inventory update:
Next candidate: none | <family>
Status: complete | blocked (<exact reason>)
```

`complete` means one selected family reached the completion state defined by `material-component-authoring`. Naming a second candidate is informational only and must not start another implementation cycle.