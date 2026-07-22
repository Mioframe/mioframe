# Material library roadmap

## Current state

Active root: `Button`

Alignment status: `converging`

Continuation stack: `Button > foundation/tokens`

Checkpoint reason: `none`

External blocker: none

## Next action

Resume `material-component Button`; validate the continuation stack against current code and continue from the deepest unfinished owner until aligned, externally blocked, or a real physical session boundary.

## Update rule

Keep only the active root, alignment status, one continuation stack, one checkpoint reason, exact external blocker, and one next action.
