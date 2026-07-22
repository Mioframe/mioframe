# Material library roadmap

## Current state

Active root: `Button`

Alignment status: `blocked`

Continuation stack: `none`

Checkpoint reason: `none`

External blocker: `pnpm verify` unit-tests lane fails its blocking-log-signal check on a pre-existing `[Vue warn]: Missing required prop: "modelValue"` from `MDSwitchStub` in `src/widgets/SettingsSections/SettingsSections.test.ts`, unrelated to Button or `foundation/tokens` (all 212 unit tests still pass; confirmed pre-existing via `git stash` of the token-relocation diff).

## Next action

Fix the unrelated `SettingsSections`/`MDSwitchStub` verify failure (outside Button's dependency closure), then resume `material-component Button` to confirm final `pnpm verify` passes and close the family.

## Update rule

Keep only the active root, alignment status, one continuation stack, one checkpoint reason, exact external blocker, and one next action.
