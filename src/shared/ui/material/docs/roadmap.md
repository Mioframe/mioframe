# Mioframe Material migration roadmap

This file is the only owner of current Material milestone status, family-stage status, technical blockers, latest pilot result, and next operator action. Durable workflow rules live in the other canonical documents.

## Current state

Last updated: 2026-08-12

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

The Switch family has no remaining design, architecture, implementation, migration, review, or verification finding. `REVIEW.md` remains compliant.

The branch is synchronized with current `develop` (`behind_by: 0`) and `package.json` is `0.3.6`, above the current `develop` version `0.3.5`.

The previously reproduced root-scanning Playwright workspace-isolation defect is corrected: both Storybook behavior and visual configs enable Git-ignore-aware discovery, `playwright.lanes.test.ts` guards that contract, and the durable verifier rule requires repository-root Playwright scanning to respect repository ignore policy rather than maintaining a second local-workspace exclusion registry.

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

## Verification state

The synchronized outer `material-component Switch` invocation mechanically revalidated the existing artifact chain and required no family-stage changes.

Its final workflow verification passed all required checks:

- agent-environment;
- format;
- oxlint;
- eslint;
- type-check;
- unit-tests;
- e2e;
- storybook-behavior;
- visual;
- storybook-build;
- mutation.

GitHub verification on the synchronized `0.3.6` merge candidate passed all merge gates, including `release-version`, full `verification`, and aggregate `verify`.

The first PR-preview deployment attempt hit a concurrent non-fast-forward push race in the Pages repository after both application and Storybook builds had succeeded. Retrying that deployment job succeeded without source changes, confirming an external publication race rather than a product or Material regression.

## Milestones

| ID  | Milestone                           | Status     | Exit gate                                                     |
| --- | ----------------------------------- | ---------- | ------------------------------------------------------------- |
| M0  | workflow architecture and rules     | `complete` | coherent staged workflow and corrected calibration invariants |
| M1a | Loading Indicator dependency family | `complete` | current artifacts and compliant review                        |
| M1  | Button action family                | `complete` | canonical m3e-backed action component migrated and merged     |
| M2  | Switch stateful pilot               | `complete` | family workflow completed without unresolved family findings  |
| M3  | sequential component migration      | `planned`  | begin after PR #186 is integrated into current `develop`      |

## Next operator action

PR #186 is functionally complete. Do not rebuild the Switch family unless a later source change invalidates its current artifact chain.

Require the ordinary GitHub merge gates to be green on the final head, then integrate PR #186 into `develop`.

After integration, M3 may begin with the next explicitly selected Material component family.
