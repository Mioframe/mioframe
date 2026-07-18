# Material library implementation roadmap

This document tracks the current Material-library milestone, blocker, and single next action.

Durable architecture lives in the policy documents and skills. Detailed component state lives beside implementation in each family `README.md` and `AUDIT.md`.

## Program outcome

The program is complete when every in-scope shared UI artifact is:

- implemented as a canonical Material component, foundation, or style owner;
- explicitly retained as project-specific or generic UI outside Material;
- removed or consolidated.

A completed visible component also requires an independent technical audit and operator visual acceptance when applicable.

## Milestone statuses

- `planned` — accepted but not started;
- `active` — current implementation focus;
- `blocked` — cannot continue until the named blocker is resolved;
- `done` — exit gate passed;
- `skipped` — proved unnecessary, with the reason recorded.

Only one milestone should normally be active.

## Current state

Last updated: 2026-07-18

Current milestone: `M1 — Buttons end-to-end pilot`

Current status: `active`

Current implementation documentation:

```text
src/shared/ui/material/components/buttons/README.md
```

Current audit:

```text
src/shared/ui/material/components/buttons/AUDIT.md
```

Current blocker: the latest independent audit is `partially-compliant`, and operator visual acceptance remains outstanding. The prior rendering-affecting motion, elevation, and loading-zero findings are resolved; the remaining audit findings are documentation accuracy corrections addressed by the current authoring pass.

Single next action: rerun `material-component-review Button` to replace the stale audit after the documentation corrections, then prepare the existing canonical Button visual evidence for operator acceptance if the review is compliant.

Current progress:

- `MDButton` lives under the official documentation slug `material/components/buttons`;
- the curated root export exists;
- direct consumers are migrated;
- the legacy MDButton owner and export are removed;
- implementation alignment is not complete while the local audit remains `partially-compliant` and operator visual acceptance is outstanding.

## Milestones

| ID  | Milestone                        | Status    | Exit gate                                                                                                                                                                                      |
| --- | -------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | Architecture and operating model | `done`    | Official source hierarchy, documentation-shaped library navigation, authoring/review skills, roadmap, and inventory ownership are defined.                                                     |
| M1  | Buttons end-to-end pilot         | `active`  | Canonical Button owner, truthful README, compliant independent audit, migrated consumers, no obsolete owner, applicable local verification, and accepted visual review.                        |
| M2  | Independent stateful pilot       | `planned` | One materially different stateful family validates controlled state, input/cancellation, accessibility, multiple anatomy owners, truthful documentation, independent audit, and visual review. |
| M3  | Sequential migration             | `planned` | Each selected family follows the same implementation/documentation/review loop until the inventory has no unresolved Material-owned artifact.                                                  |

## M1 — Buttons pilot

The pilot must demonstrate:

- official documentation path resolves the canonical directory;
- authoring documentation is written beside implementation;
- implemented and unsupported surfaces are explicit;
- known defects and missing verification are not hidden;
- required foundation/style changes remain narrowly owned;
- consumers and exports migrate end to end;
- proof remains proportional;
- an independent reviewer updates only the colocated `AUDIT.md`;
- visual review occurs only after technical findings are sufficiently resolved.

## M2 — Independent stateful pilot

`MDSwitch` is the default candidate unless current inventory evidence identifies a better stateful family.

It should validate:

- controlled semantic state;
- disabled and presentation modes;
- keyboard and pointer/touch paths that differ materially;
- cancellation and cleanup;
- anatomy and accessibility ownership;
- state, motion, shape, color, focus, and target-area dependencies;
- documentation and audit behavior without Button-specific assumptions.

## M3 — Sequential migration

After the pilots:

1. select one unblocked queued official component family by accepted priority;
2. resolve its official documentation slug;
3. create or update its README;
4. implement or migrate the minimum complete supported surface;
5. record every omitted, defective, provisional, or unverified item;
6. add proportional proof and run local verification;
7. run the independent review to update `AUDIT.md`;
8. complete visual review when required;
9. update the inventory and choose the next family in a new run.

One run owns one family. Do not start a second family automatically.

## Rule refinement

When real implementation exposes an inaccurate or unnecessarily complex rule:

- identify the concrete case;
- correct the owning source with the smallest evidence-backed change;
- update only directly affected instructions;
- do not create a family-specific exception.

## Automation policy

Add automation only when repeated real work proves a stable, precise, inexpensive check. Do not create validators that claim to infer architecture, source interpretation, documentation completeness, or visual correctness.

## Update protocol

Update this roadmap only when the current milestone, blocker, next action, or exit gate changes. Detailed findings remain in the family README and AUDIT rather than being duplicated here.
