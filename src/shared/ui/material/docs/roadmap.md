# Mioframe Material migration roadmap

This file is the only owner of current milestone order, status, blockers, and next action. Durable rules live in `component-workflow.md`, `design-document.md`, `architecture.md`, `component-adapter.md`, `component-tokens.md`, `token-api.md`, and `m3e-defects.md`.

## Current state

Last updated: 2026-07-30

Current milestone: `M0/M1 — restore staged Material workflow and revalidate Loading Indicator/Button pilot`

Status: `correction`

Owner: PR #162 / `refactor/material-docs-ownership`

Implementation ownership: `migrating`

## Accepted workflow

```text
material-component-design
  → components/<family>/DESIGN.md

material-component-architecture
  → components/<family>/ARCHITECTURE.md

material-component-implementation
  → code/tests/stories/tokens + IMPLEMENTATION.md

material-component-migration
  → consumers/legacy removal + MIGRATION.md

material-component-review
  → REVIEW.md
```

`material-component <name>` selects the earliest invalid stage, runs exactly one stage, writes its handoff artifact, and stops.

The five stages must not be recombined. Their separation is required so agents preserve focus and later agents can verify explicit upstream decisions rather than reconstructing them from code.

Family `README.md` is an index only. It is not a design, architecture, implementation, migration, or review artifact.

## Workflow correction completed

- Added `docs/component-workflow.md` as the stage state machine.
- Restored separate skills:
  - `material-component-design`;
  - `material-component-architecture`;
  - `material-component-implementation`;
  - `material-component-migration`;
  - `material-component-review`.
- Changed `material-component` into a one-stage router.
- Removed unified `material-component-adapter` and `material-component-completion` workflows.
- Updated Material boundary rules, architecture, token policy, implementation preflight, and generic architecture handoff to require `DESIGN.md` plus ready `ARCHITECTURE.md` before coding.
- Defined durable `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` handoffs.
- Preserved Material → Vue → private m3e ownership and demand-scoped runtime API.

## Existing implementation retained as evidence

The branch currently contains working pilot code and proof for:

- canonical `MDLoadingIndicator` and `MDButton` exports;
- m3e-backed renderer integration;
- Button loading composition and dependency handoff;
- selected tokens and token catalogue infrastructure;
- renderer-boundary enforcement;
- current consumer migration;
- shared color ownership corrections;
- unit, browser, Storybook, and visual proof;
- CI autofix complete-tree handling.

These artifacts are implementation evidence only. They do not bypass missing earlier stage artifacts and must be revalidated stage by stage.

## Primary blocker: pilot families have not passed the restored stages

The current families do not yet have the canonical chain:

```text
components/loadingIndicator/DESIGN.md
components/loadingIndicator/ARCHITECTURE.md
components/loadingIndicator/IMPLEMENTATION.md
components/loadingIndicator/MIGRATION.md
components/loadingIndicator/REVIEW.md

components/button/DESIGN.md
components/button/ARCHITECTURE.md
components/button/IMPLEMENTATION.md
components/button/MIGRATION.md
components/button/REVIEW.md
```

Their existing READMEs are provisional mixed records created by the abandoned unified workflow. They are not accepted handoffs and must be reduced to indexes after the staged artifacts are created.

Do not create placeholder artifacts. Each stage must independently satisfy its own gate.

## Known implementation finding awaiting staged resolution

The current Button runtime token pass is known to be incorrect:

- public `hover`/`focus` names were derived from m3e vocabulary instead of official Material `hovered`/`focused` paths;
- state-specific hovered/focused/pressed label tokens are missing, so Snackbar action text can fall back from inverse-primary to primary;
- a contextual icon token has no current consumer;
- browser proof does not prove rendered label color in each interaction state;
- affected Snackbar baselines cannot be treated as Material-correct acceptance evidence.

A provisional seven-token target was identified:

```text
--md-comp-button-text-label-text-color
--md-comp-button-text-hovered-label-text-color
--md-comp-button-text-focused-label-text-color
--md-comp-button-text-pressed-label-text-color
--md-comp-button-text-hovered-state-layer-color
--md-comp-button-text-focused-state-layer-color
--md-comp-button-text-pressed-state-layer-color
```

This is not yet an accepted architecture. The Button architecture stage must confirm or correct it against the complete `DESIGN.md`, current Snackbar scenario, and exact renderer fallback chain before implementation changes resume.

## Required staged recovery

### Loading Indicator dependency

1. Run `material-component Loading indicator` → create complete `DESIGN.md`; stop.
2. Run it again → create ready `ARCHITECTURE.md`; stop.
3. Run it again → audit/correct canonical code and component-owned proof; write `IMPLEMENTATION.md`; stop.
4. Run it again → confirm direct consumers/legacy scope and final verification responsibilities; write `MIGRATION.md`; stop.
5. Run it again → independent review and operator gate; write `REVIEW.md`; stop.

### Button parent

After Loading Indicator design/architecture/implementation closure:

1. create complete Button `DESIGN.md`;
2. create ready Button `ARCHITECTURE.md`, including dependency handoff and official token state traces;
3. correct/audit implementation and write `IMPLEMENTATION.md`;
4. revalidate every current Button consumer, remove remaining ineffective legacy ownership, run final verification, and write `MIGRATION.md`;
5. perform independent review and operator visual/motion acceptance; write `REVIEW.md`.

## Remaining code findings to resolve in their owning stages

- Confirm or replace the provisional Button token target in architecture.
- Implement the accepted state-complete Button token contract without pre-merge aliases.
- Prove Snackbar action-label computed color in resting, hovered, focused, and pressed states.
- Remove the ineffective `MDAppBar.__trailing-elements` content-color declaration unless architecture establishes a real context contract.
- Keep behavioral focus assertions in behavior tests; visual specs only prepare deterministic states and capture screenshots.
- Return `token-api.md` to normal supported-catalogue status only after declarations, architecture, and proof agree.
- Pass exact final current-head `pnpm verify:release` during migration after all code and consumer changes.
- Complete operator visual/motion review for Button, standalone/composed Loading Indicator, Snackbar states, and Rich Tooltip.

## Milestones

| ID  | Milestone                                     | Status       | Depends on | Exit gate                                                                                                                 |
| --- | --------------------------------------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| M0  | staged m3e architecture and token foundation  | `correction` | none       | staged skills/docs current; renderer boundary; canonical token owners; final verification                                 |
| M1a | `MDLoadingIndicator` staged dependency family | `correction` | M0         | five current family artifacts; accepted standalone/composed ownership; proof; operator review                             |
| M1  | `MDButton` staged action family               | `correction` | M1a        | five current family artifacts; migrated consumers; official contextual tokens; dependency handoff; proof; operator review |
| M2  | `MDSwitch` stateful pilot                     | `planned`    | M1         | complete five-stage workflow; controlled state/event order; renderer-gap ownership; verification                          |
| M3  | sequential component migration                | `planned`    | M2         | one family and one stage at a time; dependencies first; explicit ownership; independent review                            |

## Accepted family structure

```text
material/components/<family>/DESIGN.md
  → complete official Material contract

material/components/<family>/ARCHITECTURE.md
  → selected Mioframe/Vue/m3e implementation plan

material/components/<family>/IMPLEMENTATION.md
  → component implementation and proof handoff

material/components/<family>/MIGRATION.md
  → consumer migration and legacy removal

material/components/<family>/REVIEW.md
  → independent compliance and merge readiness

material/components/<family>/README.md
  → short navigation index

material/components/<family>/tokens.css
  → architecture-selected public tokens and private mappings
```

## Next action

Run:

```text
material-component Loading indicator
```

The router must select only the design stage, create a complete current `components/loadingIndicator/DESIGN.md`, report its result, and stop.

No exact dependency pin, renderer-version registry, direct Lit ownership, WebKit expansion, bundle-budget infrastructure, broad CSS selector scanner, or new reduced-motion contract is required by this milestone. Shared adapter extraction remains deferred until repeated implementation code—not repeated documentation structure—demonstrates a need.
