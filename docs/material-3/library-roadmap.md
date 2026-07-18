# Material library implementation roadmap

This document tracks the current Material-library milestone, blocker, and single next action.

Durable architecture lives in policy documents and skills. Detailed family state lives beside implementation in `README.md` and `AUDIT.md`.

## Program outcome

The program is complete when every in-scope shared UI artifact is:

- implemented as a canonical Material component, foundation, or style owner;
- explicitly retained as project-specific or generic UI outside Material;
- removed or consolidated.

A completed visible component also requires an independent technical audit and explicit operator visual acceptance when applicable.

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

Current blocker: README records `Status: rejected` for the current pressed-shape motion. The production motion behavior must change before another visual review. A shared elevation evidence gap also remains for MDCard and MDSwitch override routes.

Single next action: send the visual problem directly with `material-component Button`. The authoring pass must preserve the feedback in README, change production pressed-shape motion, update implementation documentation, run local verification, and leave AUDIT unchanged. Then run `material-component-review Button` and ask the user to review the new evidence.

Current progress:

- `MDButton` lives under the official documentation slug `material/components/buttons`;
- the curated root export exists;
- direct consumers are migrated;
- the legacy MDButton owner and export are removed;
- source evidence is snapshot-complete but stale, so current official coverage remains unresolved;
- the family cannot complete while README visual status is `rejected` or `awaiting re-review`.

## Milestones

| ID  | Milestone                        | Status    | Exit gate                                                                                                                                                                                              |
| --- | -------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M0  | Architecture and operating model | `done`    | Official source hierarchy, documentation-shaped navigation, authoring/review/operator ownership, roadmap, and inventory ownership are defined.                                                       |
| M1  | Buttons end-to-end pilot         | `active`  | Canonical owner, truthful README, compliant AUDIT, migrated consumers, no obsolete owner, applicable local verification, no unresolved shared-route blocker, and explicit operator acceptance.         |
| M2  | Independent stateful pilot       | `planned` | One materially different stateful family validates controlled state, input/cancellation, accessibility, multiple anatomy owners, truthful documentation, independent audit, and operator visual review. |
| M3  | Sequential migration             | `planned` | Each selected family follows the same implementation/documentation/audit/message-based-operator-review loop until the inventory has no unresolved Material-owned artifact.                            |

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
- operator feedback is supplied in normal user messages and persisted in README;
- authoring and review cannot erase a rejected operator result or invent acceptance.

## M2 — Independent stateful pilot

`MDSwitch` is the default candidate unless current inventory evidence identifies a better stateful family.

It should validate:

- controlled semantic state;
- disabled and presentation modes;
- keyboard and pointer/touch paths that differ materially;
- cancellation and cleanup;
- anatomy and accessibility ownership;
- state, motion, shape, color, focus, and target-area dependencies;
- the same README/AUDIT plus message-based operator-feedback model without Button-specific assumptions.

## M3 — Sequential migration

After the pilots:

1. select one unblocked queued official component family by accepted priority;
2. resolve its official documentation slug;
3. create or update its README;
4. implement or migrate the minimum complete supported surface;
5. record every omitted, defective, provisional, invalid, optional, or unverified item accurately;
6. add proportional proof and run local verification;
7. run the independent review to update AUDIT;
8. complete operator visual review through explicit user feedback when required;
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