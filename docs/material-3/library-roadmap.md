# Material library implementation roadmap

This document tracks the current Material-library milestone, blocker, and single next action.

Durable architecture lives in policy documents and skills. Detailed family state lives beside implementation in `README.md`, `AUDIT.md`, and optional operator-owned `VISUAL_REVIEW.md`.

## Program outcome

The program is complete when every in-scope shared UI artifact is:

- implemented as a canonical Material component, foundation, or style owner;
- explicitly retained as project-specific or generic UI outside Material;
- removed or consolidated.

A completed visible component also requires an independent technical audit and accepted operator visual review when applicable.

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

Current operator visual review:

```text
src/shared/ui/material/components/buttons/VISUAL_REVIEW.md
```

Current blocker: the operator visual review is `rejected` for the current pressed-shape motion. The README and latest audit became stale when they described that behavior as resolved or merely awaiting review. A shared elevation evidence gap also remains for the current MDCard and MDSwitch override routes, and the README classifications for text-toggle and optional rapid-click guidance require correction.

Single next action: run `material-component Button`. The authoring pass must read `VISUAL_REVIEW.md`, change the production pressed-shape motion behavior, correct README classification and elevation evidence, run local verification, and leave AUDIT/VISUAL_REVIEW unchanged. Then run `material-component-review Button` and present new evidence for operator review.

Current progress:

- `MDButton` lives under the official documentation slug `material/components/buttons`;
- the curated root export exists;
- direct consumers are migrated;
- the legacy MDButton owner and export are removed;
- source evidence is snapshot-complete but stale, so current official coverage remains unresolved;
- the family cannot complete while VISUAL_REVIEW is rejected.

## Milestones

| ID  | Milestone                        | Status    | Exit gate                                                                                                                                                                                                 |
| --- | -------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | Architecture and operating model | `done`    | Official source hierarchy, documentation-shaped navigation, authoring/review/operator ownership, roadmap, and inventory ownership are defined.                                                          |
| M1  | Buttons end-to-end pilot         | `active`  | Canonical owner, truthful README, compliant AUDIT, migrated consumers, no obsolete owner, applicable local verification, no unresolved shared-route blocker, and accepted VISUAL_REVIEW.                  |
| M2  | Independent stateful pilot       | `planned` | One materially different stateful family validates controlled state, input/cancellation, accessibility, multiple anatomy owners, truthful documentation, independent audit, and operator visual review. |
| M3  | Sequential migration             | `planned` | Each selected family follows the same implementation/documentation/audit/operator-review loop until the inventory has no unresolved Material-owned artifact.                                             |

## M1 — Buttons pilot

The pilot must demonstrate:

- official documentation path resolves the canonical directory;
- authoring documentation is written beside implementation;
- implemented, absent, invalid, optional, unresolved, and out-of-family surfaces are classified correctly;
- known defects and missing verification are not hidden;
- required foundation/style changes remain narrowly owned and have representative proof;
- consumers and exports migrate end to end;
- proof remains proportional;
- an independent reviewer updates only `AUDIT.md`;
- the operator alone creates or replaces `VISUAL_REVIEW.md`;
- authoring and review cannot erase a rejected operator result.

## M2 — Independent stateful pilot

`MDSwitch` is the default candidate unless current inventory evidence identifies a better stateful family.

It should validate:

- controlled semantic state;
- disabled and presentation modes;
- keyboard and pointer/touch paths that differ materially;
- cancellation and cleanup;
- anatomy and accessibility ownership;
- state, motion, shape, color, focus, and target-area dependencies;
- the same README/AUDIT/VISUAL_REVIEW ownership model without Button-specific assumptions.

## M3 — Sequential migration

After the pilots:

1. select one unblocked queued official component family by accepted priority;
2. resolve its official documentation slug;
3. create or update its README;
4. implement or migrate the minimum complete supported surface;
5. record every omitted, defective, provisional, invalid, optional, or unverified item accurately;
6. add proportional proof and run local verification;
7. run the independent review to update AUDIT;
8. complete operator visual review in VISUAL_REVIEW when required;
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

Update this roadmap only when the current milestone, blocker, next action, or exit gate changes. Detailed findings remain in family-local documents rather than being duplicated here.