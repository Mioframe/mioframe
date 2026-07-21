# Material library roadmap

This file records only the active family, current blocker, and one next action. It is not a registry, inventory, queue, audit, checklist, alignment map, or stage tracker.

## Current state

Last updated: 2026-07-21

Active family: `Button`

Intended mode: `align-existing`

Family alignment status: `blocked`

Blocker: PR #157 showed two workflow failures. One broad audit/review context consumed a full five-hour agent budget through repeated full-family re-derivation and six contract-review rounds, while still missing the concrete shape-transition defect and complete PR merge blockers. PR #155 must land concern-scoped agent ownership, bounded review retries, a separate complete PR review, concise current-state documentation, and automatic token-guard execution in focused verification.

## Next action

After PR #157 is updated onto the latest PR #155 workflow, continue from valid repository progress; do not restart the family by default.

Run `material-component Button` with an explicit concern plan:

- semantics lane for PR-owned API/native/extension/consumer blockers;
- token lane for Button and cross-component styling contracts;
- Web lane for DOM/CSS ownership, shape transition, reduced motion, RTL, and browser proof;
- correction review for one approved unit;
- complete `material-pr-review` before merge readiness.

The orchestrator may run each review gate once and one substantive re-review at most. A second failure stops with consolidated blockers. Mechanical documentation corrections do not trigger another full source/audit pass.

The calibration succeeds only when the agent preserves independently confirmed work, fixes or blocks every PR-owned required concern, detects the shape-transition property/easing defect without a user hint, keeps state selection out of token files, runs the token architecture guard through focused `pnpm verify`, and separates correction completion from complete PR merge readiness.

Do not select a second family until Button reaches a terminal `aligned` state.

## Update rule

Update this file only when active family, family alignment status, blocker, or one next action changes.
