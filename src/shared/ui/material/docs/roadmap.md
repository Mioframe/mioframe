# Material library roadmap

This file records only the active family, current blocker, and one next action. It is not a registry, inventory, queue, audit, checklist, alignment map, or stage tracker.

## Current state

Last updated: 2026-07-21

Active family: `Button`

Intended mode: `align-existing`

Family alignment status: `converging`

Blocker: the token-ownership/naming/dead-declaration-cleanup correction unit is complete. It went
through six independent contract-gate review rounds (revisions 1-6, each in a separate isolated
context — rounds 1-2 found real implementation-risk gaps, rounds 3-4 found real factual errors in
the target/current-state text from ungrounded sibling-style generalizations, round 5 found only
mechanical documentation staleness after a proactive full re-verification sweep), then passed, was
implemented, and passed an independent final-gate review (also flagging and triggering fixes for
two minor accuracy issues, both applied). Implementation revealed one new, pre-existing,
out-of-Button-scope finding: `--md-content-color`/`--md-symbol-size`/`--md-circular-progress-color`
in `MDButton.css` are the established public styling contract of `MDSymbol` and
`MDCircularProgressIndicator` (used identically across ~30 other files in `src/shared/ui`), not
Button-owned tokens, but they still fail the static token-architecture guard because
`docs/tokens.md`'s taxonomy has no accepted category for a generic cross-component contract.
Button is the first official family relocated into the Material root, so this is the first time
the guard has checked a file with this pre-existing pattern; it predates this branch's work
entirely (the file does not exist on `origin/develop`). This keeps final `pnpm verify` red and
blocks `aligned`, but does not reopen or invalidate the completed correction unit — see
`components/button/README.md`'s "New evidence found during implementation" and backlog item 7 for
full detail.

## Next action

Two independent tracks remain, neither of which is "select a different family" (Button has not
reached `aligned`):

1. **Foundation-level or repository-wide decision** (backlog item 7, priority category 2 by
   ownership but explicitly not a Button-family concern): decide how to classify the pre-existing
   `--md-content-color`/`--md-symbol-size`/`--md-circular-progress-color` generic ambient-styling
   contract — e.g. formally accept it as documented `--mio-sys-*` extensions, or add an explicit,
   documented guard allowance for consuming (not declaring new) established pre-Material generic
   contracts. This is required before Button (or any future Material family relocated into the
   root) can pass a fully clean `pnpm verify` and reach `aligned`. Route through `material-
foundation`, not `material-component Button`.
2. **Button's remaining 6-item backlog** (click-propagation rationale, the dangling
   `--md-state-outline-color` reference, the label-wrapping reversal, RTL browser proof, the
   spring-to-CSS motion mapping, and the loading-motion browser-proof gap): each requires its own
   future `material-component Button` pass through the full isolated target/audit/contract/
   contract-gate/implementation/final-gate sequence — do not bundle multiple backlog items into one
   correction unit.

Claude Code may use the project adapters under `.claude/agents/`. Codex may use the same portable role skills in separate agent threads or isolated worktrees. If delegation is unavailable, use fresh isolated sessions and keep every gate.

The calibration fails as a workflow defect if the agent:

- reads the current component implementation before the target is locked;
- hides a conflict between prose, diagrams, specs, accessibility guidance, or tokens;
- applies Android, iOS, or Web guidance to another platform without an explicit decision;
- omits API, propagation, accessibility, DOM, state, token, motion, extension, dependency, consumer, or proof concerns;
- treats passing tests, snapshots, consumers, declarations, or token-looking names as authority;
- accepts invented `--md-*` aliases, wrong token placement, invalid dependency direction, dead component tokens, or private routes as public API;
- builds styling or motion on a token graph that has not passed source, static, and rendered proof;
- misclassifies a legacy Material component as generic foundation;
- selects an easier lower-priority improvement around a blocking source, ownership, semantics, token, or dependency gap;
- places browser behavior assertions in visual proof;
- edits production before the contract gate passes;
- lets the implementation context approve its own contract or patch;
- leaves workflow state or roadmap inconsistent with the actual stage;
- rewrites the whole family when smaller owner corrections are sufficient;
- reports the family aligned while required gaps remain.

A fresh session resets reasoning, not repository progress. Do not reset PR #157 by default. Preserve only independently confirmed owners and completed valid correction units.

Do not select a second family until Button reaches a terminal `aligned` state.

## Update rule

Update this file only when active family, family alignment status, blocker, or one next action changes.
