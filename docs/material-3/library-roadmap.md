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

Current milestone: `M1 — Buttons end-to-end workflow calibration pilot`

Current status: `active`

Current implementation documentation:

```text
src/shared/ui/material/components/buttons/README.md
```

Current audit:

```text
src/shared/ui/material/components/buttons/AUDIT.md
```

Current blocker: the calibrated instruction tree has changed but has not yet been regenerated and verified locally. The Button implementation has not yet been rerun through the new contract reconstruction → diagnosis → repair/restructure/replace → objective gate workflow. Its latest independent audit remains non-compliant and operator visual status remains rejected.

Single next action: run `pnpm verify --fix` to regenerate compatibility instructions, run final `pnpm verify`, then execute `material Button` from contract reconstruction without Button-defect-specific hints. The authoring run must report its diagnosis, strategy, objective gate, and exact remaining defects before a fresh independent review.

Current progress:

- universal routing sends components directly to `material-component-authoring` and keeps `material-component` as a compatibility alias;
- component and foundation authoring reconstruct the contract, diagnose defects, and select repair, restructure, or replace;
- authoring uses an evidence-backed objective gate;
- real input and forced-state evidence have separate responsibilities;
- independent review actively searches for contradictions across production, README, stories, tests, verification, and operator feedback;
- healthy current-run Material MCP reads are working current evidence; capture age alone is not a blocker;
- Button remains the calibration specimen and is not ready for merge.

## Milestones

| ID  | Milestone                               | Status    | Exit gate                                                                                                                                                                                                                 |
| --- | --------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | Architecture and operating model        | `done`    | Official ownership hierarchy, documentation-shaped navigation, source model, authoring/review/operator ownership, roadmap, and inventory ownership are defined.                                                           |
| M1  | Buttons end-to-end workflow calibration | `active`  | Calibrated rules pass verification; Button authoring independently diagnoses and corrects or replaces the implementation; objective gate passes; audit is compliant; operator explicitly accepts required visible output. |
| M2  | Independent stateful/foundation pilot   | `planned` | A materially different stateful family or foundation validates controlled state, shared lifecycle ownership, cancellation, accessibility, real-input proof, independent review, and operator visual review.               |
| M3  | Sequential migration                    | `planned` | Each selected owner follows the calibrated implementation/documentation/objective-gate/audit/operator-review loop until the inventory has no unresolved Material-owned artifact.                                          |

## M1 — Buttons calibration pilot

The pilot must demonstrate:

- current-run official sources resolve the canonical contract and directory;
- authoring reconstructs the contract before preserving legacy structure;
- each defect is classified by type and actual owner;
- repair, restructure, or replace is chosen explicitly;
- repeated correction does not preserve parallel ownership models or workarounds;
- implemented, absent, invalid, optional, unresolved, and out-of-family surfaces are classified correctly;
- required foundation/style changes remain narrowly owned and have representative proof;
- forced states prove stable appearance only and real input proves lifecycle;
- production, README, stories, tests, and verification contain no unresolved contradiction;
- consumers and exports migrate end to end and obsolete ownership is removed;
- the objective authoring gate closes before independent review;
- independent review changes only AUDIT and actively seeks contradictions;
- operator feedback is persisted without being weakened or replaced by green tests.

## M2 — Independent stateful/foundation pilot

`MDSwitch` is the default component candidate, while an interaction foundation such as State Layer is a valid alternative when current inventory identifies a more valuable independent risk class.

It should validate:

- controlled semantic state or shared state-input ownership;
- disabled and simultaneous-state behavior;
- keyboard and pointer/touch paths that differ materially;
- acquisition, release, interruption, cancellation, and cleanup;
- anatomy, accessibility, bounds, clipping, and final rendered ownership;
- state, motion, shape, color, focus, and target-area dependencies;
- representative blast-radius proof for shared owners;
- the same README/AUDIT and operator-feedback model without Button-specific assumptions.

## M3 — Sequential migration

After the pilots:

1. select one unblocked queued official owner by accepted priority;
2. execute the calibrated source → contract → diagnosis → strategy → implementation → proof → objective gate loop;
3. remove obsolete ownership and contradictions;
4. run local verification;
5. run independent review to update AUDIT;
6. complete operator visual review through explicit user feedback when required;
7. update inventory and choose the next owner in a new run.

One run owns one component family or one foundation/style artifact. Do not start a second target automatically.

## Rule refinement

When real implementation exposes a possible rule defect:

- determine whether the universal rule is missing or the agent ignored an existing rule;
- add shared policy only for a real cross-artifact gap;
- update the narrowest owning source and only directly affected instructions;
- keep concrete symptoms and fixes in owner-local documentation;
- do not create a family-specific exception.

## Automation policy

Add automation only when repeated real work proves a stable, precise, inexpensive check. Do not create validators that claim to infer architecture, source interpretation, documentation completeness, or visual correctness.

## Update protocol

Update this roadmap only when the current milestone, blocker, next action, or exit gate changes. Detailed findings remain in owner-local documents rather than being duplicated here.
