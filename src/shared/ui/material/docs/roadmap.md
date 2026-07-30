# Mioframe Material migration roadmap

This file is the only owner of current milestone order, status, blockers, and next operator action. Durable rules live in `component-workflow.md`, `design-document.md`, `architecture.md`, `component-adapter.md`, `component-tokens.md`, `token-api.md`, and `m3e-defects.md`.

## Current state

Last updated: 2026-07-30

Current milestone: `M0/M1 — restore autonomous staged Material workflow and revalidate Loading Indicator/Button pilot`

Status: `correction`

Owner: PR #162 / `refactor/material-docs-ownership`

Implementation ownership: `migrating`

## Accepted operator workflow

The operator runs exactly one command with only a component name:

```text
material-component <name>
```

The command autonomously orchestrates isolated internal stages:

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

The stages must not be recombined into one reasoning task. Each stage has one focus and one durable handoff. However, successful completion of a stage returns control to the outer orchestrator, which immediately starts the next internally actionable stage in the same operator invocation.

The operator must not relaunch the command after each stage. Dependencies are processed automatically as first-class families and the parent resumes when their required gates are complete.

Family `README.md` is an index only. It does not own mutable stage status or next action.

## Workflow correction completed

- Restored separate design, architecture, implementation, migration, and review skills.
- Changed `material-component` from a one-stage router into an autonomous staged orchestrator.
- Defined the distinction between one operator invocation and one internal stage scope.
- Removed the requirement for repeated operator commands.
- Added automatic dependency processing and backward correction routing.
- Added genuine external stop conditions.
- Updated Material boundary rules, source lifecycle, token policy, implementation preflight, and architecture handoff.
- Defined durable `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` handoffs.
- Kept Material → Vue → private m3e ownership and demand-scoped runtime API.
- Removed mutable stage-status tables from family README indexes.

## Source lifecycle correction

A cache freshness threshold triggers refresh but does not automatically invalidate a complete source snapshot.

- `current` requires complete newest successfully acquired official content and no evidence of a newer material revision.
- `stale` requires affirmative evidence that official content or revision changed.
- `blocked` requires genuinely missing or incomplete content after all available fallbacks.

A failed refresh helper is not a blocker when complete official pages and token resources remain available and no newer source revision is known.

## Loading Indicator stage state

`components/loadingIndicator/DESIGN.md` now exists and is `current`.

It contains:

- all official Overview, Specs, Guidelines, and Accessibility content;
- contained and uncontained configurations;
- complete geometry and usage guidance;
- accessibility requirements;
- the complete eight-row official component-token catalogue;
- source conflicts and refresh limitations without mixing Mioframe or m3e decisions.

The next internally invalid stage is Loading Indicator architecture. The outer orchestrator must continue from architecture through implementation, migration, and review without asking the operator to rerun the command between stages.

## Existing implementation retained as evidence

The branch currently contains implementation evidence for:

- canonical `MDLoadingIndicator` and `MDButton` exports;
- m3e-backed renderer integration;
- Button loading composition and dependency handoff;
- selected tokens and token catalogue infrastructure;
- renderer-boundary enforcement;
- current consumer migration;
- shared color ownership corrections;
- unit, browser, Storybook, and visual proof;
- CI autofix complete-tree handling.

This evidence does not bypass stage gates. Architecture and implementation stages must audit and either accept, correct, or remove it.

## Known Button finding awaiting staged resolution

The current Button runtime token pass is known to be incorrect:

- public `hover`/`focus` names were derived from m3e vocabulary instead of official Material `hovered`/`focused` paths;
- state-specific hovered/focused/pressed label tokens are missing, so Snackbar action text can fall back from inverse-primary to primary;
- a contextual icon token has no current consumer;
- browser proof does not prove rendered label color in each interaction state;
- affected Snackbar baselines cannot be treated as Material-correct acceptance evidence.

A provisional seven-token candidate was identified:

```text
--md-comp-button-text-label-text-color
--md-comp-button-text-hovered-label-text-color
--md-comp-button-text-focused-label-text-color
--md-comp-button-text-pressed-label-text-color
--md-comp-button-text-hovered-state-layer-color
--md-comp-button-text-focused-state-layer-color
--md-comp-button-text-pressed-state-layer-color
```

This is not yet accepted architecture. Button `DESIGN.md` must capture the complete official token catalogue, and Button `ARCHITECTURE.md` must confirm or correct the selected subset and renderer fallback trace before implementation changes.

## Autonomous recovery sequence

### Loading Indicator dependency

One invocation of:

```text
material-component Loading indicator
```

must:

1. recognize the current complete `DESIGN.md`;
2. create ready `ARCHITECTURE.md`;
3. audit/correct canonical code and component-owned proof, then write `IMPLEMENTATION.md`;
4. migrate/validate consumers, remove obsolete ownership, run required final verification, then write `MIGRATION.md`;
5. perform independent review and write `REVIEW.md`;
6. stop only for a genuine external blocker or required operator visual/motion acceptance.

### Button parent

After required Loading Indicator dependency closure, one invocation of:

```text
material-component Button
```

must automatically perform the complete Button design, architecture, implementation, migration, and review sequence, including dependency validation and correction of the token contract.

## Remaining implementation findings to resolve in their owning stages

- Confirm or replace the provisional Button token target in architecture.
- Implement the accepted state-complete Button token contract without pre-merge aliases.
- Prove Snackbar action-label computed color in resting, hovered, focused, and pressed states.
- Remove the ineffective `MDAppBar.__trailing-elements` content-color declaration unless architecture establishes a real context contract.
- Keep behavioral focus assertions in behavior tests; visual specs only prepare deterministic states and capture screenshots.
- Return `token-api.md` to normal supported-catalogue status only after declarations, architecture, and proof agree.
- Pass exact final current-head `pnpm verify:release` during migration after all code and consumer changes.
- Complete operator visual/motion review for Button, standalone/composed Loading Indicator, Snackbar states, and Rich Tooltip.

## Milestones

| ID  | Milestone                                      | Status       | Depends on | Exit gate                                                                                                                 |
| --- | ---------------------------------------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| M0  | autonomous staged m3e workflow and foundation | `correction` | none       | autonomous orchestration; staged skills/docs current; renderer boundary; canonical token owners; final verification      |
| M1a | `MDLoadingIndicator` staged dependency family | `correction` | M0         | five current family artifacts; accepted standalone/composed ownership; proof; operator review                             |
| M1  | `MDButton` staged action family               | `correction` | M1a        | five current family artifacts; migrated consumers; official contextual tokens; dependency handoff; proof; operator review |
| M2  | `MDSwitch` stateful pilot                     | `planned`    | M1         | complete autonomous staged workflow; controlled state/event order; renderer-gap ownership; verification                  |
| M3  | sequential component migration               | `planned`    | M2         | one family with internally isolated stages; dependencies first; explicit ownership; independent review                   |

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
  → static navigation index

material/components/<family>/tokens.css
  → architecture-selected public tokens and private mappings
```

## Next operator action

Run once:

```text
material-component Loading indicator
```

The command must continue automatically from architecture through all internally actionable stages. A report that only repeats design status or asks for another identical invocation is a workflow failure.

No exact dependency pin, renderer-version registry, direct Lit ownership, WebKit expansion, bundle-budget infrastructure, broad CSS selector scanner, or new reduced-motion contract is required by this milestone. Shared adapter extraction remains deferred until repeated implementation code—not repeated documentation structure—demonstrates a need.