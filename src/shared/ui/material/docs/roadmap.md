# Mioframe Material migration roadmap

This file is the only owner of current Material milestone status, family-stage status, technical blockers, latest pilot result, and next operator action. Durable workflow rules live in the other canonical documents.

## Current state

Last updated: 2026-08-11

Current milestone: `M2 — Switch stateful pilot`

Status: `complete`

The Switch family itself completed its calibration workflow on the branch: `DESIGN.md` is current, `ARCHITECTURE.md` is ready, `IMPLEMENTATION.md` and `MIGRATION.md` are complete, the fresh independent `REVIEW.md` is `compliant`.

The branch has since synchronized with `develop` (merge commit `aff46718`, merging `ca0bcd6194cf8cb7465b3006345f085a1238fbac` / PR #187, Storybook S3 visual discovery pilot) and raised `package.json` to `0.3.5` (commit `336c0a8f`), above current `develop`'s `0.3.4`. The prior PR-sync and version blockers are resolved.

A fresh outer `material-component Switch` final verification (`pnpm verify --base origin/develop --profile local`) was run against this synchronized state: 8 of 11 checks passed (agent-environment, format, oxlint, eslint, type-check, unit-tests, e2e, storybook-behavior, storybook-build); `mutation` was skipped after a prior failure. The `visual` check (`pnpm test:visual`) failed with container exit 255. A fresh independent `material-component-review` worker in final-verifier-routing mode classified this as an **external-workspace-blocker**: `playwright.visual.config.ts`'s `testMatch: ['tests/e2e/visual/**/*.spec.ts', ...]` has no `testIgnore` excluding nested `.claude/worktrees/**` checkouts, so the container swept in and executed a stale, pre-migration `MDSwitch drag` test physically present only inside the sibling `.claude/worktrees/dnd-kit-reorder-fix` worktree — not this repository's own `tests/e2e/visual/shared-ui.spec.ts`, which (per this family's own `MIGRATION.md`) no longer contains any MDSwitch drag test. No Switch family artifact required correction; `REVIEW.md` is unchanged.

The new S3 state does not itself migrate Switch visual proof: Loading Indicator is the only owner-local visual pilot and every other visual owner, including Switch, remains in the central `tests/e2e/visual` location until S4.

Switch remains the calibration family: durable gaps found during this migration have been corrected in their canonical docs/skills rather than hidden in one-family workarounds.

## Current family state

### Loading Indicator

```text
DESIGN.md          current
ARCHITECTURE.md    ready
IMPLEMENTATION.md  complete
MIGRATION.md       complete
REVIEW.md          compliant
```

No current family blocker.

### Button

Runtime migration to the canonical m3e-backed Material library is complete and merged. Historical Button artifact cleanup is not a Switch blocker.

### Switch

```text
DESIGN.md          current
ARCHITECTURE.md    ready
IMPLEMENTATION.md  complete
MIGRATION.md       complete
REVIEW.md          compliant
```

Current pre-sync revisions:

- DESIGN contract: `2026-08-10T19:28:25.068Z`;
- ARCHITECTURE: `2026-08-11T13:30:00.000Z`;
- IMPLEMENTATION: `2026-08-11T13:45:00.000Z`;
- MIGRATION: `2026-08-11T13:47:00.000Z`;
- REVIEW: `2026-08-11T14:15:00.000Z` — `compliant`, route `none/none`.

The recorded final workflow verification passed on the previous base. It remains valid evidence for that exact family revision, but it is not PR merge evidence after `develop` advanced.

## Calibration result so far

The systemic findings exposed by Switch are corrected:

1. **Controlled-state ownership.** `selected` is the sole source of truth. The adapter intercepts the exact installed renderer's cancelable pre-mutation `beforeinput`, calls `preventDefault()`, emits the requested next `selected`, and never permits a rejected intent to leave renderer `checked` divergent.
2. **Browser-proof ownership.** Switch-owned Storybook behavior is colocated as `src/shared/ui/material/components/switch/MDSwitch.browser.spec.ts`; the obsolete central Switch behavior registry relation is removed.
3. **Test-environment blast radius.** The Switch-only `ElementInternals` shim is local to `MDSwitch.testUtils.ts`, installed only around the owning unit suite and restored afterward.
4. **Decorative composition ownership.** Browser proof verifies both that `presentation` is not independently interactive and that real pointer input on its visible region reaches the enclosing action owner, whose state then flows back into renderer `checked`.
5. **Testing workflow rules.** Canonical adapter, architecture, component-contract, browser-behavior, and independent-review rules were strengthened so these stateful-adapter failures cannot be accepted as compliant in later families.

No generic m3e adapter framework, state manager, workflow database, new registry layer, or compatibility API was introduced.

## Current blocker

No remaining Switch-family design or implementation blocker is known on the reviewed revision. The branch is synchronized with `develop` and its version (`0.3.5`) already exceeds `develop`'s `0.3.4`, so the prior PR-sync and version blockers are resolved.

Outer invocation blocker (external workspace, not owned by any Material family):

1. `playwright.visual.config.ts`'s visual `testMatch` glob recurses into nested `.claude/worktrees/**` checkouts and has no `testIgnore` excluding them, so a sibling worktree's stale test suite can be swept into this repository's `pnpm test:visual` run and fail it;
2. the fix belongs to shared verifier/Playwright tooling configuration, not to the Switch family or any other Material family;
3. after the external owner adds the missing `testIgnore` exclusion (or an equivalent scoping fix), rerun `pnpm verify --only visual` followed by the original final gate `pnpm verify --base origin/develop --profile local`, without rebuilding current Switch family artifacts (no durable revision mismatch was found);
4. require GitHub CI to be green on the final head before merge.

## Milestones

| ID  | Milestone                           | Status     | Exit gate                                                       |
| --- | ----------------------------------- | ---------- | --------------------------------------------------------------- |
| M0  | workflow architecture and rules     | `complete` | coherent staged workflow and corrected calibration invariants   |
| M1a | Loading Indicator dependency family | `complete` | current artifacts and compliant review                          |
| M1  | Button action family                | `complete` | canonical m3e-backed action component migrated and merged       |
| M2  | Switch stateful pilot               | `complete` | family workflow completed without systemic state/ownership gaps |
| M3  | sequential component migration      | `planned`  | begin after PR #186 is integrated into current `develop`        |

## Next operator action

Do not start M3 yet. The Switch family artifacts are current and compliant, and the branch is already synchronized with `develop` at a higher version (`0.3.5`). Fix the shared visual Playwright config's nested-worktree test-discovery scoping gap (add a `testIgnore` for `.claude/worktrees/**` or equivalent), then rerun `pnpm verify --only visual` followed by `pnpm verify --base origin/develop --profile local` as the final gate. No family artifact rebuild is required unless that fix reveals a genuine Switch-owned visual regression. Merge only after GitHub CI is fully green.
