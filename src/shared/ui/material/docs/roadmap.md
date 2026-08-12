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

The Switch family has no remaining design, architecture, implementation, migration, or review finding. `REVIEW.md` remains compliant.

The branch is synchronized with current `develop` (`4cceda3ced310a613052df17a8044225eb89b433`, `behind_by: 0`) and `package.json` is `0.3.7`, above the current `develop` version `0.3.6`.

The S4-B MDCheckbox visual-ownership migration from `develop` is preserved. The `tests/e2e/visual/shared-ui.spec.ts` conflict was resolved semantically: neither already-migrated Switch nor MDCheckbox visual proof remains in the central file, while the remaining central MDCard, MDStateLayer, and MarkdownContent owners are preserved. MDCheckbox remains owner-local under `src/shared/ui/Checkbox/`; Switch keeps its PR-owned visual spec and baseline.

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

Before the latest `develop` synchronization, the completed `material-component Switch` workflow mechanically revalidated the existing artifact chain and its final workflow verification passed all required checks. GitHub verification on that earlier merge candidate also passed all merge gates.

The latest `develop` synchronization changed only integration/testing ownership state and release metadata; it did not change or invalidate the Switch family contract or any durable family revision link. Therefore the Material family workflow does not need to be run again solely because the base advanced.

Fresh final read-only verification (`pnpm verify`) and GitHub merge gates are required on the current head because the merge candidate changed to integrate `develop` S4-B, resolve the visual ownership conflict, remove stale central MDCheckbox baselines, and bump the release version to `0.3.7`.

GitHub verification for the current head is currently in progress.

## Milestones

| ID  | Milestone                           | Status     | Exit gate                                                     |
| --- | ----------------------------------- | ---------- | ------------------------------------------------------------- |
| M0  | workflow architecture and rules     | `complete` | coherent staged workflow and corrected calibration invariants |
| M1a | Loading Indicator dependency family | `complete` | current artifacts and compliant review                        |
| M1  | Button action family                | `complete` | canonical m3e-backed action component migrated and merged     |
| M2  | Switch stateful pilot               | `complete` | family workflow completed without unresolved family findings  |
| M3  | sequential component migration      | `planned`  | begin after PR #186 is integrated into current `develop`      |

## Next operator action

Do not rebuild or rewrite Switch family artifacts unless a later workspace change actually invalidates a family-owned contract or durable revision link.

Run fresh final read-only verification with `pnpm verify` on the synchronized current workspace and require the ordinary GitHub merge gates to be green on that same final head before integrating PR #186 into `develop`.

After integration, M3 may begin with the next explicitly selected Material component family.
