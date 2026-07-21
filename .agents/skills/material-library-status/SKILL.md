---
name: material-library-status
description: 'Use for a concise read-only Material library convergence, correction-gate, PR-readiness, and verification status report.'
---

# Material library status

Read only:

1. `src/shared/ui/material/docs/roadmap.md`;
2. the active family workflow-state block and current durable contract sections;
3. current PR base/head, PR review, and verification state when available.

Report:

- active family, mode, objective, and selected concern lanes;
- current stage and target slices requiring work;
- semantics/token/Web audit status for selected lanes;
- correction contract-gate status;
- current correction unit and proof lane;
- implementation and conditional adoption status;
- correction-final review status;
- complete PR-review verdict;
- token guard, browser evidence, operator visual status, and repository verification;
- family alignment: `aligned`, `converging`, or `blocked`;
- exact blocker and one next action.

Do not equate correction completion with family alignment or complete PR merge readiness. Do not treat green CI, stable snapshots, relocation, consumer migration, declaration presence, feature-branch history, or same-context review as correctness.

Do not modify files, infer unrecorded progress, execute stages, or create inventories, audits, review histories, checklists, scorecards, stage trackers, or parallel status records.