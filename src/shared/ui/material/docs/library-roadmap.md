# Material library roadmap

This document owns only the current Material-library milestone, blocker, completed outcomes, and one next action.

Durable architecture and workflow rules live in:

- `src/shared/ui/material/docs/workflow.md`;
- `src/shared/ui/material/docs/source-of-truth.md`;
- `src/shared/ui/material/docs/library-architecture.md`;
- `src/shared/ui/material/docs/component-architecture.md`;
- `src/shared/ui/material/docs/foundation-architecture.md`;
- `src/shared/ui/material/docs/component-testing.md`.

Program records have distinct owners:

- `ui-library-inventory.md` — classification, priority, dependencies, queue state, and terminal outcomes;
- `foundation-registry.md` — foundation ownership, readiness, gaps, and verification;
- family `README.md` — approved family contract;
- `audits/<family>.md` — latest independent technical review;
- `src/shared/ui/material/README.md` — physical migration map.

Do not duplicate those facts here.

## Status model

Use one status per milestone:

- `planned` — accepted sequence, not started;
- `active` — current focus;
- `blocked` — cannot continue until the named blocker is resolved;
- `done` — exit gate passed and completing PR merged into `develop`;
- `skipped` — proved unnecessary, with evidence recorded.

Only one milestone should normally be active.

## Current state

Last updated: 2026-07-23

Current milestone: `M0 — contract-first workflow reset`

Current status: `active`

Current blocker: none.

Next action: complete and merge PR #162, then reconstruct and approve the Button family contract against current `develop` before assigning implementation.

## Milestones

| ID  | Milestone                            | Status    | Depends on | Exit gate                                                                                                                                                                                                      |
| --- | ------------------------------------ | --------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | Contract-first workflow reset        | `active`  | none       | Material documentation is library-owned; autonomous orchestration is removed; implementation requires an approved ready contract; independent review owns merge recommendation; repository verification passes |
| M1  | Button pilot                         | `planned` | M0         | architect-approved Button contract; one canonical owner; consumers migrated; required proof passes; independent technical review passes; required operator visual acceptance is recorded                       |
| M2  | Independent stateful pilot           | `planned` | M1         | one stateful family validates controlled state, browser interaction, cancellation/cleanup, accessibility, foundation use, independent review, and visual acceptance without bespoke workflow                   |
| M3  | Sequential contract-driven migration | `planned` | M2         | families are selected by the architect from current roadmap/inventory evidence and completed one at a time through ready contract, implementation, independent review, and visual acceptance                   |

## M0 — contract-first workflow reset

PR #162 must:

- keep all Material-library documentation under `src/shared/ui/material/docs`;
- make `workflow.md` the single owner of stage and role separation;
- remove autonomous family-selection and self-approving implementation skills;
- require `Readiness: ready` before production edits;
- separate coding from independent full-PR review;
- keep operator responsibility limited to prepared visual evidence;
- preserve Material production behavior;
- remove stale process references and pass final repository verification.

## M1 — Button pilot

After M0 merges:

1. inspect current Button implementation, exports, consumers, tests, stories, known defects, and active PR state;
2. resolve current official Material 3 Expressive evidence;
3. choose the smallest cohesive Button family boundary;
4. approve goal, non-goals, supported surface, public API, state ownership, foundations, consumers, acceptance criteria, and proof owners;
5. mark the family contract `Readiness: ready`;
6. create one explicit implementation task;
7. implement through `material-component-implementation`;
8. review the complete PR through `material-component-review`;
9. complete operator visual acceptance when required;
10. merge only after the independent recommendation permits it.

The pilot records only evidence-backed workflow improvements. Do not add automation or abstractions merely because a future mistake is imaginable.

## M2 — independent stateful pilot

Use a high-priority stateful family, normally Switch unless current evidence identifies a better candidate.

The pilot must challenge:

- controlled state without hidden copies;
- native keyboard and pointer/touch behavior;
- disabled and presentation contracts;
- cancellation and cleanup where applicable;
- anatomy and DOM ownership;
- focus, ripple, motion, shape, color, accessibility, and target-area dependencies;
- separation of browser behavior proof from forced visual state;
- correction rounds without architecture drift.

After M1 and M2, retain only workflow and automation that both pilots prove useful.

## M3 — sequential contract-driven migration

After both pilots:

- the architect selects one family using current consumer value, correctness risk, foundation leverage, dependency readiness, and blast radius;
- the architect approves one ready family contract and implementation task;
- the coding agent completes only that family;
- an independent reviewer checks the complete PR and writes the family audit;
- required visual acceptance is completed;
- roadmap and inventory are updated;
- the next family starts only through a new architecture decision.

There is no autonomous queue runner, manager agent, recursive owner stack, execution ledger, or automatic continuation to another family.

## Correction policy

Use one consolidated correction task per review round. Preserve all earlier unresolved findings.

After correction, review the complete PR again.

If two correction rounds still reveal ownership errors, missing scenarios, unstable public contracts, mixed responsibilities, architectural drift, or growing workaround logic, stop patching and redo the architecture decision.

## Automation policy

Add a guard only when real pilot or migration evidence demonstrates a stable repeated and precisely detectable need with low false-positive risk.

Automation proves deterministic repository facts only. It does not approve architecture, Material interpretation, scenario sufficiency, or visual correctness.

## Update protocol

Update this file only when:

- the active milestone changes;
- its status or blocker changes;
- its exit gate materially changes;
- the single next action changes.

Do not add session logs, completed-task narratives, agent context, correction history, or a second queue.
