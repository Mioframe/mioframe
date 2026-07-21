# Material library roadmap

This file records only the active family, current blocker, and one next action. It is not a registry, inventory, queue, audit, checklist, alignment map, or stage tracker.

## Current state

Last updated: 2026-07-21

Active family: `Button`

Intended mode: `align-existing`

Family alignment status: `converging`

Blocker: four correction units are complete and independently reviewed (see
`components/button/README.md`): token ownership/naming/dead-declaration cleanup; the
click-propagation `@click.stop` rationale and ancestor-listener proof; the dangling
`--md-state-outline-color` reference removal; and the Web label-text-wrapping revert to the
official single-line rule. Directly re-run this pass
(`pnpm exec vitest run scripts/materialTokenArchitecture.test.mjs`) confirms the guard still
reports exactly the same 3 residual, pre-existing, out-of-Button-scope errors the README
documents — `--md-content-color`/`--md-symbol-size`/`--md-circular-progress-color`, the
established public styling contract of `MDSymbol`/`MDCircularProgressIndicator`, not Button-owned
tokens. This keeps final `pnpm verify` red and blocks `aligned`, but does not reopen any completed
correction unit.

## Next action

Two independent tracks remain (Button has not reached `aligned`):

1. Foundation-level or repository-wide decision (backlog item 4 in the README, priority category
   2 by ownership but explicitly not a Button-family concern) on how to classify the pre-existing
   ambient-styling contract above. Route through `material-foundation`, not `material-component
Button`.
2. Button's remaining 3-item backlog (RTL icon-mirroring browser proof, the spring-to-CSS motion
   mapping, the loading-motion browser-proof gap) — each requires its own `material-component
Button` pass through the full isolated sequence; do not bundle items.

Do not select a second family until Button reaches a terminal `aligned` state.

## Update rule

Update this file only when the active family, family alignment status, blocker, or one next action changes.
