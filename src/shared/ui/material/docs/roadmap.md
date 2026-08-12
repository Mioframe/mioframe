# Mioframe Material migration roadmap

This file is the only owner of current Material milestone status, family-stage status, technical blockers, latest pilot result, and next operator action. Durable workflow rules live in the other canonical documents.

## Current state

Last updated: 2026-08-13

Current milestone: `M3 — sequential component migration (checkbox)`

Status: `complete`

The Checkbox family workflow has completed design, architecture, implementation, migration, and independent review, and the outer workflow's final `pnpm verify` gate has passed on the synchronized workspace:

```text
DESIGN.md          current
ARCHITECTURE.md    ready
IMPLEMENTATION.md  complete
MIGRATION.md       complete
REVIEW.md          compliant-with-listed-risks
```

Migration replaced every consumer of the legacy `src/shared/ui/Checkbox/MDCheckbox.vue` with the canonical `MDCheckbox` (`src/shared/ui/material/components/checkbox/`): `SettingsCheckboxListItem.vue`, `DatabaseViewsSheet.vue`, `RelationValueFieldData.vue`, `BooleanValueInline.vue` (whose bundled tooltip moved to an externally composed `MDPlainTooltip`), `MDCheckboxField.vue`'s internal composition (which now translates its own `boolean | undefined` tri-state vocabulary onto the canonical `checked`/`indeterminate` pair and forwards its `label` as an `aria-label` accessible-name backstop per `M3E-005`), and one additional Storybook-only consumer discovered during migration blast-radius review, `src/shared/ui/Lists/stories/MDListItemConsumerPatternsStory.vue`. The legacy `MDCheckbox.vue`, `MDCheckboxPlayground.vue`, and their owner-local proof/stories/baselines are removed with no compatibility alias. `MDCheckboxField.vue`, `src/shared/ui/Checkbox/index.ts`, and `toggleBoolean.ts` remain as the distinct non-Material `src/shared/ui/Checkbox` shared-UI family. `docs/testing/migration-plan.md`'s Stage S2-A and S4-B records for the now-removed legacy owner-local proof are annotated as historical, pointing to the canonical family's own current proof locations.

Independent review (`material-component-review`) completed for the `checkbox` family with verdict `compliant-with-listed-risks` (`REVIEW.md`, artifact revision `2026-08-13T01:15:00.000Z`). The single accepted risk is this file's own bookkeeping lag (now resolved by this update), which is explicitly outside the family's four stage artifacts and does not affect family compliance. Along the way, review caught and routed two defects that were each corrected through a fresh isolated worker at the owning stage: an implementation-stage worker had improperly hand-edited `ARCHITECTURE.md`'s content in place (corrected by a fresh architecture-stage re-authorship, `2026-08-12T22:00:00.000Z`, no substantive content change); a subsequent implementation revalidation contained a false claim that `config/vueCustomElements.ts` does not exist (corrected, documentation-only, `2026-08-12T23:55:00.000Z`); and the outer final `pnpm verify` gate first failed on a `format`-check issue in `DESIGN.md`, corrected via a metadata-only design refresh (`2026-08-13T01:00:00.000Z`) that preserved the exact design contract revision.

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

The Switch family (`M2`) workflow previously completed with `REVIEW.md` compliant and final workflow verification passing; it has no remaining design, architecture, implementation, migration, or review finding, and is not revisited here unless a later workspace change invalidates a durable family revision link.

For the Checkbox family: implementation-stage focused verification (`pnpm verify --only type-check`, `unit-tests`, `storybook-build`, `storybook-behavior`, `visual`) passed as recorded in `IMPLEMENTATION.md`. Migration-stage focused verification (`type-check`, `unit-tests`, `eslint`, `oxlint`, `format`, `visual`, `e2e`, `storybook-build`) passed as recorded in `MIGRATION.md`. The outer workflow's final `pnpm verify` gate passed on the synchronized workspace (11 checks run, 11 passed: `agent-environment`, `format`, `oxlint`, `eslint`, `type-check`, `unit-tests`, `e2e`, `storybook-behavior`, `visual`, `storybook-build`, `mutation`).

## Milestones

| ID  | Milestone                           | Status     | Exit gate                                                      |
| --- | ----------------------------------- | ---------- | -------------------------------------------------------------- |
| M0  | workflow architecture and rules     | `complete` | coherent staged workflow and corrected calibration invariants  |
| M1a | Loading Indicator dependency family | `complete` | current artifacts and compliant review                         |
| M1  | Button action family                | `complete` | canonical m3e-backed action component migrated and merged      |
| M2  | Switch stateful pilot               | `complete` | family workflow completed without unresolved family findings   |
| M3  | sequential component migration      | `complete` | Checkbox family workflow completed without unresolved findings |

## Next operator action

Do not rebuild or rewrite Switch family artifacts unless a later workspace change actually invalidates a family-owned contract or durable revision link.

Checkbox's family workflow is complete with no unresolved findings. Require the ordinary GitHub merge gates to be green before integrating the Checkbox migration into `develop`.

M3 may continue with the next explicitly selected Material component family.
