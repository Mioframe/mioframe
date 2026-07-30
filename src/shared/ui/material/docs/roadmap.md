# Mioframe Material migration roadmap

This file owns current milestone order, component-stage status, technical blockers, and next operator action. Durable rules live in `component-workflow.md`, `design-document.md`, `architecture.md`, `component-adapter.md`, `component-tokens.md`, `token-api.md`, and `m3e-defects.md`.

## Current state

Last updated: 2026-07-31

Current milestone: `M0/M1 — complete autonomous staged workflow and finish Loading Indicator/Button pilot`

Status: `operator-review`

Implementation ownership: `complete`

## Accepted operator workflow

The operator runs one command with only a component name:

```text
material-component <name>
```

The command autonomously orchestrates isolated internal stages:

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

Each worker owns one reasoning focus and one durable handoff, then terminates. The thin orchestrator selects the earliest invalid stage, launches the next worker, validates workspace outputs, routes backward when required, and continues the same operator invocation until completion or a genuine external blocker.

The orchestrator does not perform stage-owned research, architecture, code, migration, or review. The operator does not repeat the command between successful stages. Dependencies pass through the same staged workflow as first-class families.

If fresh-worker orchestration is unavailable, the workflow is blocked on orchestration capability. Running all stages in one context is not an accepted fallback.

Family `README.md` files are static indexes only. They do not own mutable stage status or next action.

## Agent workspace boundary

Stage workers use only readable workspace files, canonical artifacts, official source tools, and documented project commands.

They do not inspect hidden workspace metadata or unrelated execution-environment internals and do not ask the operator to choose repair procedures. A project command failure is recorded as verification evidence only after otherwise safe stage-owned edits are complete.

No worker-ID registry, artifact digest infrastructure, or duplicate verification framework is required. Canonical artifacts, observable workspace state, isolated review, project verification, and operator visual assessment are sufficient.

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

Remaining Loading Indicator gate: operator visual/motion acceptance.

## Button state

The Button family has all five stage artifacts:

```text
components/button/DESIGN.md          current
components/button/ARCHITECTURE.md    ready
components/button/IMPLEMENTATION.md  complete
components/button/MIGRATION.md       complete
components/button/REVIEW.md          compliant-with-listed-risks; operator review required
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

The runtime declarations, private renderer mappings, Snackbar inverse-primary overrides, rendered label proof, and populated `token-api.md` catalogue use these official paths. The old renderer-derived `hover`/`focus` names, contextual icon token, and five-token provisional surface are removed without aliases.

## Completed correction round

The two findings from the previous independent review are resolved and independently re-reviewed:

1. Button visual specs no longer assert focus success. They establish deterministic focus state and capture screenshots; Storybook behavior owns `toBeFocused()` assertions.
2. `MDAppBar.__trailing-elements` no longer declares the ineffective legacy `--md-content-color`. No replacement descendant color bridge was introduced, and current trailing consumers retain their own color ownership.

The resulting workspace passed the required project verification. The fresh independent Button review found no remaining technical issue and returned `compliant-with-listed-risks`, with operator visual/motion acceptance as the only family gate.

These corrections did not change `DESIGN.md`, `ARCHITECTURE.md`, the public Button API, the accepted seven-token contract, or the current token catalogue.

## Milestones

| ID  | Milestone                                      | Status            | Depends on | Exit gate                                                                                                                         |
| --- | ---------------------------------------------- | ----------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| M0  | autonomous staged renderer workflow/foundation | `implemented`     | none       | thin orchestrator; isolated stage ownership; staged skills/docs; renderer boundary; canonical foundation/token ownership          |
| M1a | `MDLoadingIndicator` staged dependency family  | `operator-review` | M0         | five family artifacts; accepted standalone/composed ownership; automated proof; operator visual/motion acceptance                 |
| M1  | `MDButton` staged action family                | `operator-review` | M1a        | five family artifacts; accepted tokens and consumers; project verification; independent review; operator visual/motion acceptance |
| M2  | `MDSwitch` stateful pilot                      | `planned`         | M1         | complete staged workflow; controlled state/event order; renderer-gap ownership; verification                                      |
| M3  | sequential component migration                 | `planned`         | M2         | dependencies first; explicit ownership; isolated stages; independent review                                                       |

## Remaining pilot gates

1. Complete operator visual/motion acceptance for Button, standalone and Button-composed Loading Indicator, Snackbar interaction states, Rich Tooltip, and other affected color-ownership surfaces.
2. Record the operator result in the family review artifacts.
3. Perform the final full pilot review and remove any remaining false or obsolete workspace claims.

## Next operator action

Visually inspect the pilot surfaces. Report any defect found. If no defect is found, confirm acceptance; no additional `material-component Button` invocation is required.

No exact dependency pin, renderer-version registry, direct Lit ownership, WebKit expansion, bundle-budget infrastructure, broad CSS selector scanner, new reduced-motion contract, or shared adapter abstraction is required by this milestone.
