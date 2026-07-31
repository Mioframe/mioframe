# Mioframe Material migration roadmap

This file owns current milestone order, component-stage status, technical blockers, and next operator action. Durable rules live in `component-workflow.md`, `design-document.md`, `architecture.md`, `component-adapter.md`, `component-tokens.md`, `token-api.md`, and `m3e-defects.md`.

## Current state

Last updated: 2026-07-31

Current milestone: `M0/M1 — stabilize the autonomous staged workflow and close the Loading Indicator/Button pilot`

Status: `in-progress`

Implementation ownership: `complete`

Workflow architecture ownership: `corrected`; current family artifacts must be refreshed through their owning stages before the pilot is complete.

## Accepted operator workflow

The operator runs one command with only a component name:

```text
material-component <name>
```

The command autonomously orchestrates:

```text
fresh design worker
  → DESIGN.md
fresh architecture worker
  → ARCHITECTURE.md
fresh implementation worker
  → code/tests/stories/tokens + IMPLEMENTATION.md
fresh migration worker
  → consumers/legacy removal + MIGRATION.md
fresh independent review worker
  → REVIEW.md
orchestrator
  → one final read-only workflow verification
```

Each reasoning worker owns one stage and one durable handoff, then terminates. The thin orchestrator selects the earliest invalid stage, launches the next fresh worker, validates workspace outputs, processes dependencies, routes corrections backward, and continues the same operator invocation until completion or a genuine blocker.

The operator does not repeat the command between successful stages. Dependencies pass through the same five artifact stages as first-class families and are processed automatically before the parent resumes.

If a fresh worker cannot be created, the workflow is blocked on orchestration capability. Running all stages in one context is not an accepted fallback.

Family `README.md` files are static indexes only. They do not own mutable stage status or next action.

## Verification ownership

Stage workers run only verifier-managed focused proof for their owned changes:

- implementation owns component and renderer-boundary proof;
- migration owns consumer, scenario, legacy-removal, and impact-metadata proof;
- review independently evaluates the full result and stage evidence.

After every affected family has a current independent `REVIEW.md`, the `material-component` orchestrator runs exactly one final read-only workflow gate.

For ordinary Material component work:

```text
pnpm verify
```

`pnpm verify:release` is used only when the task itself changes release-sensitive infrastructure and the project verification rules classify it accordingly. Component code is not release-sensitive merely because it will eventually be merged or released.

A pending top-level final command is not a family blocker, accepted risk, deferred migration/review action, or next operator action. A final-verification failure is routed to the earliest owning stage; any workspace correction requires a fresh independent review before the same final command is rerun.

## Operator visual/motion channel

Operator visual/motion inspection is an external defect-reporting channel, not a positive-acknowledgement completion gate.

- Absence of an operator-reported defect does not block completion.
- No explicit positive confirmation is required.
- A concrete reported defect is a real blocker and routes to its owning stage through the same correction loop.

## Loading Indicator state

Current recorded artifacts:

```text
components/loadingIndicator/DESIGN.md          current
components/loadingIndicator/ARCHITECTURE.md    ready
components/loadingIndicator/IMPLEMENTATION.md  complete
components/loadingIndicator/MIGRATION.md       stale
components/loadingIndicator/REVIEW.md          stale
```

Runtime implementation and focused proof are complete. The attrs-projection correction uses render-time allow-listed `$attrs` projection without cached `computed()` dependency, and the scoped-CSS explanation has been corrected.

`MIGRATION.md` and `REVIEW.md` still contain the superseded model that assigns a final current-head command to migration/review and records its absence as a family risk. They must be refreshed through fresh migration and independent review workers under the corrected workflow rules. No runtime redesign is required.

Operator visual status: `no-reported-defect`.

## Button state

Current recorded artifacts:

```text
components/button/DESIGN.md          current
components/button/ARCHITECTURE.md    ready
components/button/IMPLEMENTATION.md  complete
components/button/MIGRATION.md       complete
components/button/REVIEW.md          stale
```

Runtime implementation and focused proof are complete. The attrs-projection correction uses render-time allow-listed `$attrs` projection, and the dynamic add/remove/re-add test now reuses one module-level `DynamicAttrsWrapper`, removing the review-reported `vue/one-component-per-file` warnings.

The current `REVIEW.md` predates that final test correction and still records the resolved warning as a minor issue with a return stage. A fresh independent review must inspect the complete current family and replace the stale record.

Operator visual status: `no-reported-defect`.

## Required autonomous closure

One invocation must be sufficient:

```text
material-component Button
```

The orchestrator must:

1. process the Loading Indicator dependency's stale migration record;
2. run a fresh independent Loading Indicator review;
3. resume Button;
4. run a fresh independent Button review on the current test code;
5. run one final `pnpm verify` after all affected reviews are current;
6. route any real verifier failure to its owning stage and repeat correction, review, and final verification without another operator command;
7. finish with no remaining blocker when all gates pass.

If the command stops merely because one stage completed, leaves a stale review current, asks for a repeated operator invocation, delegates the final workflow command to migration/review, or records the pending final command as a family risk, that is a workflow defect rather than expected operator work.

## Milestones

| ID  | Milestone                                      | Status        | Depends on | Exit gate                                                                                                                                     |
| --- | ---------------------------------------------- | ------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | autonomous staged renderer workflow/foundation | `implemented` | none       | thin orchestrator; isolated stage ownership; dependency queue; correction routing; one post-review final workflow verification                |
| M1a | `MDLoadingIndicator` staged dependency family  | `stale`       | M0         | five current family artifacts; accepted standalone/composed ownership; required stage proof; no unresolved operator-reported defect           |
| M1  | `MDButton` staged action family                | `stale`       | M1a        | five current family artifacts; accepted tokens and consumers; independent review; no unresolved operator-reported defect; final verify passes |
| M2  | `MDSwitch` stateful pilot                      | `planned`     | M1         | complete autonomous workflow; controlled state/event order; renderer-gap ownership; verification                                              |
| M3  | sequential component migration                 | `planned`     | M2         | dependencies first; explicit ownership; isolated stages; independent review                                                                   |

## Next operator action

Run:

```text
material-component Button
```

No separate Loading Indicator command, manual artifact patch, positive visual acknowledgement, local `verify:release`, dependency pin, renderer-version registry, shared adapter abstraction, or repeated stage command is required.
