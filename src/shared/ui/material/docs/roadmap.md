# Mioframe Material migration roadmap

This file is the only owner of current milestone order, status, blockers, and next operator action. Durable rules live in `component-workflow.md`, `design-document.md`, `architecture.md`, `component-adapter.md`, `component-tokens.md`, `token-api.md`, and `m3e-defects.md`.

## Current state

Last updated: 2026-07-30

Current milestone: `M0/M1 — complete autonomous staged workflow and finish Loading Indicator/Button pilot`

Status: `correction`

Owner: PR #162 / `refactor/material-docs-ownership`

Implementation ownership: `migrating`

## Accepted operator workflow

The operator runs one command with only a component name:

```text
material-component <name>
```

The command autonomously orchestrates physically isolated internal stages:

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
```

Each worker owns one reasoning focus and one durable handoff, then terminates. The thin orchestrator selects the earliest invalid stage, launches the next worker, validates repository outputs, routes backward when required, and continues the same operator invocation until completion or a genuine external blocker.

The orchestrator does not perform stage-owned research, architecture, code, migration, or review. The operator does not repeat the command between successful stages. Dependencies pass through the same staged workflow as first-class families.

If fresh-worker orchestration is unavailable, the workflow is blocked on orchestration infrastructure. Running all stages in one context is not an accepted fallback.

Family `README.md` files are static indexes only. They do not own mutable stage status or next action.

## Workflow state

The staged workflow architecture is restored and has been exercised for both pilot families:

- separate design, architecture, implementation, migration, and review skills exist;
- one operator invocation can continue across internally actionable stages;
- each stage has a distinct artifact and ownership boundary;
- dependency processing and backward correction routing are defined;
- review is independent and read-only;
- current code and previous worker conclusions are evidence, not substitutes for stage artifacts;
- genuine external stop conditions include operator visual/motion acceptance.

No additional worker-ID registry, artifact digest infrastructure, or duplicate local verification framework is required. Repository artifacts, stage gates, the resulting diff, fresh review, and final GitHub CI are the accepted proof.

## Loading Indicator state

The Loading Indicator family has all five stage artifacts:

```text
components/loadingIndicator/DESIGN.md          current
components/loadingIndicator/ARCHITECTURE.md    ready
components/loadingIndicator/IMPLEMENTATION.md  complete
components/loadingIndicator/MIGRATION.md       complete
components/loadingIndicator/REVIEW.md          blocked on operator review
```

The selected uncontained implementation, public size/color API, Button composition boundary, renderer workarounds M3E-001/M3E-002, automated proof, and consumer inventory are complete. No technical correction is currently required.

Remaining Loading Indicator gate: operator visual/motion acceptance, followed by fresh review of the then-current head.

## Button state

The Button family has all five stage artifacts:

```text
components/button/DESIGN.md          current
components/button/ARCHITECTURE.md    ready
components/button/IMPLEMENTATION.md  complete, correction required
components/button/MIGRATION.md       complete, correction required
components/button/REVIEW.md          blocked, return stage implementation
```

The accepted public Button token surface is exactly:

```text
--md-comp-button-text-label-text-color
--md-comp-button-text-hovered-label-text-color
--md-comp-button-text-focused-label-text-color
--md-comp-button-text-pressed-label-text-color
--md-comp-button-text-hovered-state-layer-color
--md-comp-button-text-focused-state-layer-color
--md-comp-button-text-pressed-state-layer-color
```

The runtime declarations, private m3e mappings, Snackbar inverse-primary overrides, rendered label proof, and populated `token-api.md` catalogue now use these official paths. The old renderer-derived `hover`/`focus` names, contextual icon token, and five-token provisional surface are removed without aliases.

## Current correction findings

The architect follow-up found two completion issues that the previous independent review missed:

1. **Implementation:** Button visual specs still assert `toBeFocused()`. Focus success belongs to Storybook behavior tests; visual specs should establish the deterministic focus state and capture screenshots only.
2. **Migration:** `MDAppBar.__trailing-elements` still declares ineffective legacy `--md-content-color` without an accepted contextual contract. Remove the declaration without replacing it with a descendant color bridge.

These findings do not invalidate `DESIGN.md`, `ARCHITECTURE.md`, the public Button API, the accepted seven-token contract, or the current token catalogue.

## Required correction sequence

One invocation of:

```text
material-component Button
```

must now:

1. recognize `REVIEW.md` return stage `implementation`;
2. launch a fresh implementation worker to remove behavior assertions from the visual lane while retaining behavior coverage;
3. launch a fresh migration worker to remove the AppBar legacy declaration and refresh downstream stage records;
4. run the exact required final verification for the resulting head;
5. launch a new independent review worker;
6. stop only at the operator visual/motion gate if no additional findings remain.

The orchestrator must not repeat design or architecture unless a correction worker discovers evidence that invalidates those artifacts.

## Milestones

| ID  | Milestone                                     | Status            | Depends on | Exit gate                                                                                                                       |
| --- | --------------------------------------------- | ----------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| M0  | autonomous staged m3e workflow and foundation | `implemented`     | none       | thin orchestrator; isolated stage ownership; staged skills/docs; renderer boundary; canonical foundation/token ownership        |
| M1a | `MDLoadingIndicator` staged dependency family | `operator-review` | M0         | five family artifacts; accepted standalone/composed ownership; automated proof; operator visual/motion acceptance; fresh review |
| M1  | `MDButton` staged action family               | `correction`      | M1a        | two correction findings resolved; final CI; operator visual/motion acceptance; fresh independent review                         |
| M2  | `MDSwitch` stateful pilot                     | `planned`         | M1         | complete staged workflow; controlled state/event order; renderer-gap ownership; verification                                    |
| M3  | sequential component migration                | `planned`         | M2         | dependencies first; explicit ownership; isolated stages; independent review                                                     |

## Remaining merge gates

1. Run the Button correction sequence once.
2. Obtain green GitHub CI on the resulting final head.
3. Complete operator visual/motion acceptance for Button, standalone and Button-composed Loading Indicator, Snackbar interaction states, Rich Tooltip, and other affected color-ownership surfaces.
4. Run fresh independent family review after operator acceptance.
5. Review the complete PR result, update PR metadata, and resolve any remaining review threads.

## Next operator action

Run once:

```text
material-component Button
```

A correct result starts from implementation correction, continues automatically through migration and fresh review, and stops at operator visual/motion acceptance when no further technical findings remain.

No exact dependency pin, renderer-version registry, direct Lit ownership, WebKit expansion, bundle-budget infrastructure, broad CSS selector scanner, new reduced-motion contract, or shared adapter abstraction is required by this milestone.
