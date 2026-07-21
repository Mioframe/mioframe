# Material library roadmap

This file records only the active family, current blocker, and one next action. It is not a registry, inventory, queue, audit, checklist, alignment map, or stage tracker.

## Current state

Last updated: 2026-07-21

Active family: `Button`

Intended mode: `align-existing`

Family alignment status: `blocked`

Blocker: PR #157 created a prospective canonical Button owner without closing the dependencies required by its supported surface. It still uses legacy Material state-layer/ripple and Progress Indicator owners, global legacy reference/system and motion routes, and unowned symbol/outline styling contracts. The previous workflow also consumed a full five-hour agent budget through repeated broad review while missing the concrete shape-transition defect and complete PR blockers. PR #155 must land focused agent ownership, bounded reviews, dependency closure, a separate complete PR review, concise current-state documentation, and automatic token-guard execution.

## Next action

After PR #157 is updated onto the latest PR #155 workflow, continue from valid repository progress; do not restart the family by default.

Run `material-component Button` with an explicit concern and dependency plan:

- semantics lane for PR-owned API/native/extension/consumer blockers and dependency classification;
- token lane for Button component tokens, required reference/system token groups, and rendered routing;
- Web lane for DOM/CSS ownership, shape transition, reduced motion, RTL, and browser proof;
- exact `material-foundation` prerequisites for required family-agnostic state-layer/ripple, token, motion, focus, or symbol contracts that still have legacy or missing owners;
- a ready canonical Progress Indicator family contract for loading, or defer/remove the loading extension until that family is ready;
- correction review for one approved unit;
- complete `material-pr-review` before merge readiness.

Do not migrate consumers or declare Button canonical/aligned while any required dependency remains `temporary-legacy-material`, missing, defective, privately imported, fallback-masked, or parallel-owned.

The orchestrator may run each review gate once and one substantive re-review at most. A second failure stops with consolidated blockers. Mechanical documentation corrections do not trigger another full source/audit pass.

The calibration succeeds only when the agent preserves independently confirmed work, closes or blocks every dependency required by Button's supported surface, detects the shape-transition property/easing defect without a user hint, keeps state selection out of token files, runs the token architecture guard through focused `pnpm verify`, and separates correction completion from complete PR merge readiness.

Do not select a second family until Button reaches a terminal `aligned` state.

## Update rule

Update this file only when active family, family alignment status, blocker, or one next action changes.
