# Material library roadmap

## Current state

Active root: `Button`

Alignment status: `blocked`

Continuation stack: `none`

Checkpoint reason: `none`

External blocker: the prior unit-tests `MDSwitchStub` blocker is resolved (212/212 unit tests pass, no blocking-log-signal). Final `pnpm verify` now fails at the `storybook-behavior` lane: `tests/e2e/storybook/md-button-family.spec.ts` MDIconButton/MDFab/MDExtendedFab cases (expanded-target-hit-area, dense-toolbar-interaction, focus-indicator-target) fail reproducibly, while every MDButton case in the same spec passes. Icon Button, FAB, and Extended FAB are explicitly out of the canonical `Button` README's scope (legacy under `src/shared/ui/Button`, each requiring its own future `material-component` run). The spec file, the relocated shared state foundation (`@shared/ui/material/foundation/state`), and the legacy owners' only branch diff (import-path renames, no behavior change) confirm this is a pre-existing legacy defect, not caused by or fixable inside Button's dependency closure. `pnpm verify` skips `visual`/`mutation` once `storybook-behavior` fails, so final verify cannot pass until the unrelated legacy lane is fixed.

## Next action

Run `material-component icon-button` and `material-component fab` (separate root operations, outside this stack) to correct the legacy Icon Button/FAB behavior regressions, then resume `material-component Button` only to reconfirm final `pnpm verify`.

## Update rule

Keep only the active root, alignment status, one continuation stack, one checkpoint reason, exact external blocker, and one next action.
