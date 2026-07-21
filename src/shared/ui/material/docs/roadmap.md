# Material library roadmap

This file records only the active family, current blocker, and one next action. It is not a registry, inventory, queue, audit, checklist, alignment map, or stage tracker.

## Current state

Last updated: 2026-07-21

Active family: `Button`

Intended invocation scope: `full-family`

Family alignment status: `blocked`

Blocker: the previous calibration terminated in an internal `converging` state after bounded corrections even though required dependency closure, family review, and final verification were incomplete. Persisted Button workflow state is therefore not authoritative and must be normalized from current code before another correction is selected.

## Next action

Run `material-component Button` after updating the Button branch with this workflow.

The orchestrator must:

- treat the family-only invocation as `full-family`;
- reconstruct canonical ownership, public exports, actual imports, consumers, legacy-owner state, and dependency closure from code;
- preserve independently confirmed target/behavior facts but discard stale scope, alignment, next-action, and review-history conclusions;
- execute exact foundation or official-family prerequisites inside the same orchestration;
- continue successive correction units without restarting accepted research;
- stop only at `aligned` or an exact external blocker;
- require independent family review, Material boundary/token guards, operator evidence when applicable, and final verification.

Calibration is successful only when the agent independently finds the current highest-priority architecture and behavior gaps instead of following a defect list from this roadmap.

Do not select a second family until Button reaches a terminal `aligned` state.

## Update rule

Update this file only when the active family, alignment status, blocker, or one next action changes.
