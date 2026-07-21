# Material library roadmap

This file records only the active family, alignment status, exact external blocker, and one next action. It is not execution memory, a backlog, audit, checklist, or stage tracker.

## Current state

Last updated: 2026-07-21

Active family: `Button`

Intended invocation scope: `full-family`

Family alignment status: `blocked`

Blocker: the Button calibration branch has premature canonical export/adoption with unresolved dependency closure, and its owner README contains forbidden persisted execution state. These are internal workflow defects to correct, not operator decisions.

## Next action

Update the Button branch with this workflow and run `material-component Button`.

The orchestrator must reconstruct current truth from code, remove execution history from the owner README, close or safely roll back premature canonicalization, execute exact prerequisites inside the same orchestration, and continue until `aligned` or an exact external blocker.

Calibration succeeds only when the agent independently selects the highest-priority current work rather than following a persisted defect list.

Do not select a second family until Button reaches `aligned`.

## Update rule

Update this file only when the active family, alignment status, external blocker, or one next action changes.