# Mioframe Material migration roadmap

This file is the only owner of current Material milestone status, family-stage status, technical blockers, latest pilot result, and next operator action. Durable workflow rules live in the other canonical documents.

## Current state

Last updated: 2026-08-11

Current milestone: `M2 — Switch stateful pilot`

Status: `complete`

The Switch family itself completed its calibration workflow on the branch: `DESIGN.md` is current, `ARCHITECTURE.md` is ready, `IMPLEMENTATION.md` and `MIGRATION.md` are complete, the fresh independent `REVIEW.md` is `compliant`, and the post-review local `pnpm verify` passed all 11 checks.

PR integration is not yet complete. After that family result, `develop` advanced to `ca0bcd6194cf8cb7465b3006345f085a1238fbac` via PR #187 (Storybook S3 visual discovery pilot) and raised `package.json` from `0.3.3` to `0.3.4`. The Switch branch still has `0.3.3`; GitHub CI `release-version` therefore fails because every PR must increase the version relative to current `develop`.

The new S3 state does not itself migrate Switch visual proof: Loading Indicator is the only owner-local visual pilot and every other visual owner, including Switch, remains in the central `tests/e2e/visual` location until S4. Nevertheless, the Switch branch must synchronize with current `develop` and rerun its durable Material validation against that current testing state before merge.

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

No remaining Switch-family design or implementation blocker is known on the reviewed revision.

PR integration blockers:

1. synchronize the branch with current `develop` (`ca0bcd6194cf8cb7465b3006345f085a1238fbac`) so the family is validated against the current S3 testing architecture;
2. bump the PR version above current `develop` `0.3.4` according to `docs/release.md`; current branch `0.3.3` is rejected by `release-version`;
3. resume `material-component Switch` after synchronization/version update so current artifacts are revalidated as required and a new final verification runs on the actual merge candidate;
4. require GitHub CI to be green on that final head.

## Milestones

| ID  | Milestone                           | Status     | Exit gate                                                       |
| --- | ----------------------------------- | ---------- | --------------------------------------------------------------- |
| M0  | workflow architecture and rules     | `complete` | coherent staged workflow and corrected calibration invariants   |
| M1a | Loading Indicator dependency family | `complete` | current artifacts and compliant review                          |
| M1  | Button action family                | `complete` | canonical m3e-backed action component migrated and merged       |
| M2  | Switch stateful pilot               | `complete` | family workflow completed without systemic state/ownership gaps |
| M3  | sequential component migration      | `planned`  | begin after PR #186 is integrated into current `develop`        |

## Next operator action

Do not start M3 yet. First synchronize PR #186 with current `develop`, raise the package version above `0.3.4`, then invoke `material-component Switch` once more so the durable chain and final verification are current for the actual merge candidate. Merge only after GitHub CI is fully green.
