# Button migration

Status: complete
DESIGN.md reference: `./DESIGN.md` (`Status: current`, official tabs snapshot 2026-07-20)
ARCHITECTURE.md reference: `./ARCHITECTURE.md` (`Status: ready`, architecture date 2026-07-31, host-attribute boundary correction)
IMPLEMENTATION.md reference: `./IMPLEMENTATION.md` (`Status: complete`, host-attribute-boundary correction implemented, no architecture deviations)
Migration workspace state: this pass re-audits every current `MDButton` consumer against the corrected `## Host-attribute boundary` allow-list (`class`, `style`, `id`, `title`, `data-*`, `aria-controls`, `aria-describedby`, `aria-expanded`, `aria-haspopup`) now that `MDButton.vue` sets `inheritAttrs: false` and no longer spreads `$attrs` onto `m3e-button`. This is a correction re-audit of the same consumer set recorded by the prior migration round (seven-token Snackbar contract, AppBar cleanup), which remains valid and is carried forward below. No consumer source file required a change.

## Consumer inventory

Every source file importing the root-exported `MDButton` (`grep -rl "MDButton" src`, cross-checked against `<MDButton` usage sites) was inspected line-by-line for non-prop bindings. Confirmed consumers, grouped by layer:

- **Widgets**: `RepositoryExplorerWidget.vue` (local-directory and Google Drive recovery actions, "Return home"), `PwaInstallWidget.vue` (install/dismiss), `DocumentView/Database/DatabasePropertiesSheet.vue` ("add property"), `DocumentView/Database/DatabaseViewsSheet.vue` ("add view").
- **Features**: `diagnosticsErrorPrompt/DiagnosticsErrorPrompt.vue` (dismiss/enable), `databaseFilterEdit/DatabaseFilterAddButton.vue` (add filter, menu target `ref`), `databaseItemSorting/DatabaseItemSortingListSection.vue` (add sorting, menu target `ref`), `vfsActivityStatus/VfsActivityStatusChip.vue` (grant access/dismiss/close/copy details), `exampleDocumentsCreate/DatabaseExampleDocumentCreateSuccessCard.vue` ("Got it"), `databaseViewCreate/DatabaseViewAddForm.vue` (Add/Cancel, `submit` form action).
- **Entities**: `databaseRelation/RelationValueInline.vue` (show/hide sub-relation, overlay target `ref`).
- **Pages**: `AboutMioframePane/AboutMioframePane.vue` ("Copy diagnostics").
- **Shared UI (product-facing)**: `Dialog/DialogForm.vue` (cancel/apply, `submit`), `Snackbar/MDSnackbar.vue` (action button with contextual token `class`), `NavigationPath/MDNavigationPathSegmentButton.vue` (segment action with local `class`).
- **Shared UI (overlay/menu targets, `ref`-only composition)**: `Menu/MDMenuPlayground.vue`, `Menu/stories/MDMenuWithSubmenuStory.vue`, `Overlay/stories/OverlayLifecycleRegressionStory.vue`, `Tooltips/MDRichTooltipPlayground.vue`.
- **Shared UI (dev/story playgrounds, no product runtime path)**: `onBackNavigation/BackNavigationPlayground.vue`, `State/MDStateLayer.stories.ts`, `Card/MDCard.stories.ts`.
- **Consumer tests** (drive existing behavior, do not assert on `m3e-button` internals or forwarded attrs): `RepositoryExplorerWidget.test.ts`, `DialogForm.test.ts`, `DiagnosticsErrorPrompt.test.ts`, `VfsActivityStatusChip.test.ts`, `MDNavigationPath.test.ts`, `DatabaseExampleDocumentCreateSuccessCard.test.ts`, `AboutMioframePane.test.ts` — confirmed by grep for `m3e-button`/renderer-private vocabulary in each: no matches.
- `src/shared/ui/ButtonsBar/index.ts` is a false positive (re-exports `MDButtonsBar`, an unrelated component whose name contains the substring `MDButton`); `MDButtonsBar.vue` does not use `MDButton`.
- `src/shared/ui/material/components/button/MDButtonTargetHitVisualStory.vue` and `MDButton.stories.ts` are family-owned proof artifacts, not product/library consumers; audited separately as part of implementation-stage proof, not here.

## Host-attribute allow-list audit (this correction)

Every consumer usage above was inspected for non-declared-prop bindings. Findings against the exact allow-list in `ARCHITECTURE.md`'s `## Host-attribute boundary`:

| Binding found                                                                                                                                                                                                  | Consumers                                                                                                                                               | Allow-list fit                                            | Disposition                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`, `color`, `size`, `nativeType` (`native-type`), `disabled`, `loading`                                                                                                                                  | all                                                                                                                                                     | declared props, not `$attrs`                              | unaffected by this correction                                                                                                                                                                                                                                    |
| `icon` slot                                                                                                                                                                                                    | `DatabaseFilterAddButton.vue`, `DatabaseItemSortingListSection.vue`, `DatabaseViewsSheet.vue`, `DatabasePropertiesSheet.vue`, `RelationValueInline.vue` | declared slot                                             | unaffected                                                                                                                                                                                                                                                       |
| `@click`                                                                                                                                                                                                       | all (product actions)                                                                                                                                   | declared emit                                             | unaffected                                                                                                                                                                                                                                                       |
| `ref="..."` (e.g. `MDMenuPlayground.vue`, `MDMenuWithSubmenuStory.vue`, `DatabaseFilterAddButton.vue`, `DatabaseItemSortingListSection.vue`, `OverlayLifecycleRegressionStory.vue`, `RelationValueInline.vue`) | overlay/menu/tooltip target scenarios (Current scenarios item 7)                                                                                        | Vue component ref, not `$attrs`/host-attribute forwarding | unaffected — the ref resolves through the single `m3e-button` root exactly as before; this mechanism does not go through `useAttrs()`/`inheritAttrs` at all                                                                                                      |
| `class="md-snackbar__action"`                                                                                                                                                                                  | `MDSnackbar.vue`                                                                                                                                        | **fits** (`class`, merged)                                | preserved — seven contextual `--md-comp-button-text-*` custom properties are set on this class selector and reach `m3e-button` via the merged `class`, independent of any attribute/listener filtering                                                           |
| `class="md-navigation-path-segment-button"`                                                                                                                                                                    | `MDNavigationPathSegmentButton.vue`                                                                                                                     | **fits** (`class`, merged)                                | preserved — class reaches the host; the `--md-button-horizontal-padding` declaration under it is a pre-existing, not-currently-cataloged custom property unrelated to this correction (unchanged before/after; out of scope for a host-attribute-boundary audit) |

No consumer passes `style`, `id`, `title`, `data-*`, `aria-controls`, `aria-describedby`, `aria-expanded`, `aria-haspopup`, `role`, `tabindex`, `aria-label`, `aria-busy`, `aria-disabled`, `aria-pressed`, renderer-private vocabulary (`toggle`, `selected`, `shape`, `variant`, `contained`), or any listener other than `click`. A repository-wide grep for these tokens directly adjacent to `<MDButton` usages (excluding the button family itself) returned no matches outside the one unrelated `aria-label` on a sibling `MDMenu` element.

**Confirmation: no current consumer depends on leaked `m3e-button` properties, attributes, or events.** Tightening `$attrs` fallthrough to the accepted allow-list changes no observed consumer behavior. There is no genuine blocked consumer scenario.

## Migrated consumers

No consumer required a code change for this correction. Every current usage already fits the accepted allow-list (or uses only declared props/slots/emits/refs, which were never part of `$attrs` forwarding). Carried forward from the prior migration round (unchanged by this correction):

- Existing Button instances already consumed the canonical root-exported `MDButton`; no adapter or prop migration was required.
- `src/shared/ui/Snackbar/MDSnackbar.vue` uses the seven selected official contextual text Button tokens (label-text resting/hovered/focused/pressed, state-layer hovered/focused/pressed) for inverse-primary rendering; its separately owned Icon Button remains on the Icon Button token contract.

## Preserved scenarios and failure paths

- Dialog submit/cancel semantics, loading-owned disabled guards, and native submit behavior are unchanged.
- Repository recovery retains feature-owned pending text, disabled conflicting actions, re-entry protection, and live status.
- Diagnostics, PWA install, sheet/card, navigation/overlay, Snackbar callback, compact icon-leading, and short library-operation scenarios retain their product owners and action paths.
- Overlay/menu/tooltip trigger targeting (`ref`-based positioning in `DatabaseFilterAddButton.vue`, `DatabaseItemSortingListSection.vue`, `RelationValueInline.vue`, `MDMenuPlayground.vue`, `MDMenuWithSubmenuStory.vue`, `OverlayLifecycleRegressionStory.vue`) is unaffected: refs resolve through the component root exactly as before, independent of the attrs allow-list.
- Snackbar action label/state-layer contextual color and NavigationPath segment padding are unaffected: both rely only on `class`, which remains forwarded and merged with the adapter-owned `md-button` class.
- No consumer scenario, action, or failure path regressed as a result of the host-attribute-boundary correction.

## Legacy ownership removed

No new removal in this pass; no consumer relied on unrestricted `$attrs` fallthrough, so there is nothing obsolete to remove from consumers. Carried forward from the prior migration round (unchanged by this correction):

- Removed Snackbar's obsolete provisional Button token overrides (prior round).
- Removed the ineffective `--md-content-color` declaration from `MDAppBar.vue`'s `&__trailing-elements` rule (prior round; unrelated to Button host-attributes).
- No compatibility aliases, raw renderer details, duplicate Button wrappers, deep imports, or obsolete Button exports remain outside the canonical family.

## Proof completed

- This pass: full consumer-source audit (grep-driven inventory plus line-by-line inspection of every `<MDButton` usage site and every consumer test file) against the exact allow-list in `ARCHITECTURE.md`'s `## Host-attribute boundary`. No consumer file changed, so no new consumer-level test was needed.
- The host-attribute-boundary correction itself is proven at the component-contract and Storybook-behavior level by `IMPLEMENTATION.md` (`MDButton.test.ts` host-attribute-boundary suite; `tests/e2e/storybook/md-button-family.spec.ts`'s `'MDButton drops undeclared dynamic attrs and never exposes their renderer state'` test) — both already passing, per `IMPLEMENTATION.md`'s "Verification performed".
- Prior-round proof (seven-token Snackbar contextual states, AppBar cleanup) remains valid and unaffected by this correction.

## Final verification

No consumer source file changed in this pass, so no focused consumer verification command was run (per task scope: focused checks apply only to touched consumer files, and none were touched).

The host-attribute-boundary correction's own verification was already completed and recorded in `IMPLEMENTATION.md`:

- `pnpm verify --only format --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.test.ts src/shared/ui/material/components/button/MDButton.stories.ts tests/e2e/storybook/md-button-family.spec.ts` — passed.
- `pnpm verify --only eslint --files ...` (same file set) — passed.
- `pnpm verify --only type-check` — passed.
- `pnpm verify --only unit-tests --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.test.ts` — passed, 13 tests.
- `pnpm verify --only storybook-behavior --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.stories.ts tests/e2e/storybook/md-button-family.spec.ts` — passed.

The prior migration round's full-project gate (`pnpm verify`, all 10 checks passed, 2026-07-30T19:20:11Z) remains the last full-project verification of record; it predates this correction. This audit-only pass found zero consumer changes, so it does not itself require re-running the full release gate; the next full `pnpm verify`/`pnpm verify:release` invocation (owned by whichever stage runs it next, e.g. review) will naturally re-cover the corrected `MDButton.vue` and its tests since they are already committed.

## Remaining migration blockers

None. The host-attribute-boundary correction is a breaking change in principle (per `ARCHITECTURE.md`) but breaks no actual current consumer: every consumer usage was already confined to declared props/slots/emits, refs, or the now-explicit allow-list (`class`).

## Review readiness

Ready for a fresh independent review worker. This correction re-audit found no genuine blocked consumer scenario and required no consumer code change. Operator visual/motion acceptance remains a separate, later review gate not owned by this stage.
