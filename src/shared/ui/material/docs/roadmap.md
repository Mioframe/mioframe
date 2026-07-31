# Mioframe Material migration roadmap

This file owns current milestone order, component-stage status, technical blockers, and next operator action. Durable rules live in `component-workflow.md`, `design-document.md`, `architecture.md`, `component-adapter.md`, `component-tokens.md`, `token-api.md`, and `m3e-defects.md`.

## Current state

Last updated: 2026-07-31

Current milestone: `M0/M1 — stabilize the autonomous staged workflow and close the Loading Indicator/Button pilot`

Status: `in-progress`

Runtime implementation ownership: `complete`; no runtime redesign is currently required.

Workflow architecture ownership: `corrected`; both pilot families' architecture and downstream artifacts predate the corrected verification ownership and must be refreshed through their owning stages.

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

- architecture selects implementation-scoped and migration-scoped proof owners;
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

An `ARCHITECTURE.md` that assigns the top-level command to migration, review, a dependency, “whichever stage closes the family”, or a release gate without release-sensitive infrastructure is stale. Every downstream artifact that relies on that architecture is stale as well, even when runtime code remains correct.

## Operator visual/motion channel

Operator visual/motion inspection is an external defect-reporting channel, not a positive-acknowledgement completion gate.

- Absence of an operator-reported defect does not block completion.
- No explicit positive confirmation is required.
- A concrete reported defect is a real blocker and routes to its owning stage through the same correction loop.

## Loading Indicator state

Current recorded artifacts under the corrected rules:

```text
components/loadingIndicator/DESIGN.md          current
components/loadingIndicator/ARCHITECTURE.md    stale
components/loadingIndicator/IMPLEMENTATION.md  stale
components/loadingIndicator/MIGRATION.md       stale
components/loadingIndicator/REVIEW.md          stale
```

Runtime implementation and focused proof are complete. The attrs-projection correction uses render-time allow-listed `$attrs` projection without cached `computed()` dependency, and the scoped-CSS explanation has been corrected.

`ARCHITECTURE.md` still assigns the single final current-head command to migration. `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` rely on that superseded ownership, and migration/review record the command's absence as family work or risk. A fresh architecture worker must correct only verification ownership and stage proof assignment; downstream workers must then revalidate and refresh their artifacts. No public API, token, renderer mapping, or runtime behavior change is expected.

Operator visual status: `no-reported-defect`.

## Button state

Current recorded artifacts under the corrected rules:

```text
components/button/DESIGN.md          current
components/button/ARCHITECTURE.md    stale
components/button/IMPLEMENTATION.md  stale
components/button/MIGRATION.md       stale
components/button/REVIEW.md          stale
```

Runtime implementation and focused proof are complete. The attrs-projection correction uses render-time allow-listed `$attrs` projection, and the dynamic add/remove/re-add test now reuses one module-level `DynamicAttrsWrapper`, removing the review-reported `vue/one-component-per-file` warnings.

`ARCHITECTURE.md` still assigns the top-level final gate to migration and incorrectly selects `pnpm verify:release` for ordinary component work. Its downstream artifacts therefore require refresh. The current `REVIEW.md` also predates the final test-harness correction and still records the resolved warning as a minor issue. No public API, seven-token contract, renderer mapping, or runtime behavior change is expected.

Operator visual status: `no-reported-defect`.

## Required autonomous closure

One invocation must be sufficient:

```text
material-component Button
```

The orchestrator must:

1. process the Loading Indicator dependency from its stale architecture stage;
2. refresh Loading Indicator implementation and migration handoffs against the corrected architecture, without changing runtime code unless a real discrepancy is found;
3. run a fresh independent Loading Indicator review;
4. resume Button from its stale architecture stage;
5. refresh Button implementation and migration handoffs against the corrected architecture, without changing runtime code unless a real discrepancy is found;
6. run a fresh independent Button review on the current test code;
7. run one final `pnpm verify` after all affected reviews are current;
8. route any real verifier failure to its owning stage and repeat correction, review, and final verification without another operator command;
9. finish with no remaining blocker when all gates pass.

If the command skips an architecture artifact that conflicts with current workflow rules, stops merely because one stage completed, leaves a downstream artifact current after its upstream architecture changed, asks for a repeated operator invocation, delegates the final workflow command to migration/review, or records the pending final command as a family risk, that is a workflow defect rather than expected operator work.

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

No separate Loading Indicator command, manual family-artifact patch, positive visual acknowledgement, local `verify:release`, dependency pin, renderer-version registry, shared adapter abstraction, or repeated stage command is required.
