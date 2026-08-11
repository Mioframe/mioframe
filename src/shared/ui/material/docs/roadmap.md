# Mioframe Material migration roadmap

This file is the only owner of current Material milestone status, family-stage status, technical blockers, latest pilot result, and next operator action. Durable workflow rules live in the other canonical documents.

## Current state

Last updated: 2026-08-11

Current milestone: `M2 — Switch stateful pilot`

Status: `complete`

The Switch family calibration workflow is complete:

```text
DESIGN.md          current
ARCHITECTURE.md    ready
IMPLEMENTATION.md  complete
MIGRATION.md       complete
REVIEW.md          compliant
```

The Switch family itself has no remaining design, implementation, migration, or review finding. `REVIEW.md` remains compliant.

The previously reproduced root-scanning Playwright workspace-isolation defect is corrected on the branch: both Storybook behavior and visual configs enable Git-ignore-aware discovery, and `playwright.lanes.test.ts` guards that contract. The durable verifier rule now also requires repository-root Playwright scanning to respect repository ignore policy rather than maintaining a second hard-coded local-workspace exclusion list.

The PR is not yet merge-ready because `develop` advanced again after that correction.

## Calibration result

Switch established the stateful Material adapter invariants now recorded in the canonical rules:

1. `selected` is the sole controlled-state source of truth; renderer mutation is prevented at the cancelable pre-mutation intent boundary.
2. Rejected controlled intent cannot leave renderer state divergent from the public prop.
3. Ordinary component-owned browser proof uses owner-local `*.browser.spec.ts` ownership.
4. Renderer-specific non-browser test shims stay at the narrowest truthful owner.
5. Decorative `presentation` composition proves both child suppression and positive input handoff to the real action owner.
6. Independent review rechecks current renderer lifecycle, proof ownership, test-environment blast radius, and composition ownership rather than trusting family prose.
7. Root-scanning Playwright lanes respect repository ignore policy so ignored nested/local workspaces cannot contribute tests.

No generic m3e adapter framework, duplicate state manager, compatibility layer, new registry abstraction, or duplicated local-workspace exclusion registry was introduced.

## Current PR integration blocker

Current `develop` is `a05306852d7574e5bcfe7e4855a4a12f4cf2e84a`, which completed Chips visual ownership migration and advanced the executable Storybook visual-migration state.

PR #186 is currently one commit behind that base. Its merge base remains `ca0bcd6194cf8cb7465b3006345f085a1238fbac`.

The new `develop` commit does not introduce a Switch-family architecture defect, but it does change the shared visual-testing state and raises `package.json` to `0.3.5`. The Switch branch is also `0.3.5`, so after synchronization the PR version must be raised again according to the release-version policy.

Required integration work:

1. synchronize `refactor/material-switch-m3e` with current `develop`;
2. raise the PR version above current `develop` `0.3.5` according to `docs/release.md`;
3. re-run the outer `material-component Switch` workflow so it mechanically revalidates the current family chain against the synchronized workspace;
4. require the final read-only verifier on that merge candidate;
5. require GitHub CI, including `release-version`, to be fully green.

Do not rewrite Switch family artifacts unless the synchronized workspace actually invalidates a family-owned contract. The current compliant review is not invalid merely because `develop` advanced.

## Verification state

The Playwright workspace-isolation correction itself is implemented as:

- `playwright.storybook.config.ts`: `respectGitIgnore: true`;
- `playwright.visual.config.ts`: `respectGitIgnore: true`;
- `playwright.lanes.test.ts`: explicit regression proof for both root-scanning lanes.

A GitHub verification run started on that corrected head, but the PR head moved again when the durable verifier rule was added. That earlier run is therefore not final merge evidence.

The final verifier and GitHub CI must run on the synchronized, correctly versioned final head.

## Milestones

| ID  | Milestone                           | Status     | Exit gate                                                     |
| --- | ----------------------------------- | ---------- | ------------------------------------------------------------- |
| M0  | workflow architecture and rules     | `complete` | coherent staged workflow and corrected calibration invariants |
| M1a | Loading Indicator dependency family | `complete` | current artifacts and compliant review                        |
| M1  | Button action family                | `complete` | canonical m3e-backed action component migrated and merged     |
| M2  | Switch stateful pilot               | `complete` | family workflow completed without unresolved family findings  |
| M3  | sequential component migration      | `planned`  | begin after PR #186 is integrated into current `develop`      |

## Next operator action

Do not start M3 yet.

Synchronize PR #186 with current `develop`, update the release version, then invoke:

```text
material-component Switch
```

If the synchronized workflow finds no new family-owned defect, keep the existing architecture and implementation and proceed to its final verifier. Merge only after that final gate and GitHub CI are fully green.
