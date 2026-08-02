# Button migration

Artifact revision: 2026-08-02T15:08:21.455Z
Status: complete
IMPLEMENTATION.md reference: `src/shared/ui/material/components/button/IMPLEMENTATION.md`
IMPLEMENTATION.md revision: 2026-08-01T12:02:58.888Z
Revision summary: Corrected the migration record to distinguish preserved product contracts from intentional pending-presentation changes.
Remaining blockers: none
Required return family: none
Required return stage: none
Review readiness: ready

## Consumer inventory

All 22 application, shared-UI, and existing development source files importing `MDButton` outside the canonical family were re-inspected against the corrected architecture migration inventory and host-attribute boundary.

- Product consumers: `RepositoryExplorerWidget`, `PwaInstallWidget`, `DatabasePropertiesSheet`, `DatabaseViewsSheet`, `DiagnosticsErrorPrompt`, `DatabaseFilterAddButton`, `DatabaseItemSortingListSection`, `VfsActivityStatusChip`, `DatabaseExampleDocumentCreateSuccessCard`, `DatabaseViewAddForm`, `RelationValueInline`, and `AboutMioframePane`.
- Shared product-facing consumers: `DialogForm`, `MDSnackbar`, and `MDNavigationPathSegmentButton`.
- Overlay/menu target fixtures: `MDMenuPlayground`, `MDMenuWithSubmenuStory`, `OverlayLifecycleRegressionStory`, and `MDRichTooltipPlayground`.
- Existing development and visual fixtures: `BackNavigationPlayground`, `MDStateLayer.stories.ts`, and `MDCard.stories.ts`.

The migration proof adds `MDNavigationPath.stories.ts` as a test fixture, not as a product consumer. Every consumer imports the root `@shared/ui/material` entry point and uses only the selected props, icon slot, click emit, Vue component ref, or approved class forwarding. No consumer depends on an undeclared renderer attribute or event.

Repository-wide source inspection outside `src/shared/ui/material` found no direct `@m3e/web` Button import, raw `m3e-button`, private `--m3e-*` Button token, deep canonical-family import, legacy Button wrapper, provisional `hover`/`focus` Button token name, contextual Button icon token, or remaining `--md-button-horizontal-padding` declaration.

## Migrated consumers

All approved consumers use the canonical root-exported `MDButton`. `MDNavigationPathSegmentButton.vue` no longer declares the undefined `--md-button-horizontal-padding: 8px`; it uses the canonical text Button's default `small` geometry without a replacement prop, public compatibility token, private renderer variable, or descendant override.

`MDSnackbar.vue` continues to supply exactly the seven selected contextual text Button tokens for inverse-primary resting, hovered, focused, and pressed label/state-layer rendering. Its close action remains independently owned by Icon Button and was not migrated as part of Button.

## Preserved scenarios and failure paths

- Navigation Path retains its home action, segment selection, 4 px inter-item gap, non-wrapping labels, and owning horizontal-scroll container. Real-browser proof compares a segment with an explicit canonical small text Button and exercises a multi-segment long path through scrolling and final-segment activation.
- Dialog and database-view forms retain native submit behavior, cancel/apply guards, form busy ownership, and consumer-owned disabled/re-entry protection.
- Repository and VFS recovery retain feature-owned pending text, live-status semantics, disabled conflicting actions, retry/re-entry guards, result handling, and error/Snackbar paths; browser/provider waits do not use presentation-only Button loading.
- Diagnostics, PWA install, sheet/card, compact icon-leading, and example-document actions retain their action ownership and click paths.
- Overlay, menu, and tooltip triggers retain Vue-ref positioning/focus ownership through the single renderer-host root without renderer access.
- Snackbar retains callback behavior and inverse-primary label/state-layer rendering across resting, hover, keyboard focus, and press; message and close-action colors remain independently owned.
- Short indeterminate library loading remains presentation-only and does not infer or acquire disabled, operation, error, persistence, or re-entry state.

Action surfaces, interaction tiers, product state owners, failure paths, and mobile, overlay, form, and accessibility contracts remain preserved.

Pending presentation changed intentionally where the legacy Button spinner was not the correct owner. `DialogForm` now exposes form-level busy semantics and disables cancel/apply actions without placing a loading indicator inside the apply Button. Browser- and provider-controlled permission waits in repository and VFS recovery now use consumer-owned live status text and disabled conflicting actions. These user-visible copy and presentation changes implement the architecture's distinction between short library-owned loading presentation and externally controlled waits; they do not move operation ownership into Button or change result and error handling.

## Legacy ownership removed

Navigation Path's sole undefined Button padding declaration was removed without replacement. Earlier migrated Snackbar provisional token overrides and AppBar Button-color leakage remain absent. No compatibility alias, duplicate wrapper, deep import, raw renderer usage, unrestricted attribute reliance, or replaced consumer test/style remains. Native HTML and the separate Icon Button, FAB, navigation, and menu families remain untouched.

## Consumer and blast-radius proof

- `MDNavigationPath.test.ts` and the representative consumer component tests preserve segment/action wiring, repository recovery, dialog busy submit/cancel, diagnostics actions, VFS recovery/error actions, example-document dismissal, and About-pane action behavior.
- `navigationPath.spec.ts` uses a deterministic Storybook fixture and public rendered hosts to prove default `small` property mapping, matching normal small Button height and radius, non-wrapping overflow, actual horizontal scrolling, and activation of the final long-path segment.
- `colorOwnership.spec.ts` proves Snackbar message, action, and close colors plus the action's resting, hover, focus, and pressed routes with real browser input and rendered-anatomy assertions.
- `color-ownership.spec.ts` selected the verifier's full 219-reference visual fallback and passed without a baseline update; no expected/actual/diff artifacts required inspection.
- Persistent Storybook behavior impact metadata maps the Navigation Path source directory to its focused browser spec. Static inventory confirms root-export use, renderer privacy, supported host inputs, the seven-token Snackbar owner, and obsolete vocabulary removal.

Operator visual status: no-reported-defect. Automated proof does not claim subjective Material conformance or renderer-motion acceptance.

## Stage verification

Migration-scoped verifier-managed revalidation completed on 2026-08-01:

- `pnpm verify --only format --files src/shared/ui/material/components/button/MIGRATION.md` — passed.
- `pnpm verify --only unit-tests --files src/widgets/RepositoryExplorerWidget/RepositoryExplorerWidget.test.ts src/shared/ui/Dialog/DialogForm.test.ts src/features/diagnosticsErrorPrompt/DiagnosticsErrorPrompt.test.ts src/features/vfsActivityStatus/VfsActivityStatusChip.test.ts src/features/exampleDocumentsCreate/DatabaseExampleDocumentCreateSuccessCard.test.ts src/pages/AboutMioframePane/AboutMioframePane.test.ts src/shared/ui/NavigationPath/MDNavigationPath.test.ts` — passed.
- `pnpm verify --only unit-tests --files scripts/lib/storybookBehaviorRisk.mjs scripts/lib/storybookBehaviorRisk.test.mjs` — passed; behavior-impact registry validation selected.
- `pnpm verify --only storybook-behavior --files src/shared/ui/NavigationPath/MDNavigationPath.vue src/shared/ui/NavigationPath/MDNavigationPathSegmentButton.vue src/shared/ui/NavigationPath/MDNavigationPath.stories.ts tests/e2e/storybook/navigationPath.spec.ts` — passed.
- `pnpm verify --only storybook-behavior --files src/shared/ui/Snackbar/MDSnackbar.vue tests/e2e/storybook/colorOwnership.spec.ts` — passed.
- `pnpm verify --only visual --files src/shared/ui/Snackbar/MDSnackbar.vue tests/e2e/visual/shared-ui/color-ownership.spec.ts` — passed; full 219-reference visual lane, no baseline update.

This stage did not run independent review or the outer workflow's final verification.

## Remaining blockers

None.

## Review readiness

Ready. Every approved consumer is canonical; the intentional DialogForm and permission-recovery pending-presentation changes are recorded with ownership preserved; contextual Snackbar token ownership remains complete; Navigation Path's obsolete declaration is removed with faithful geometry/overflow proof; focused migration checks passed; and the route is `none/none`.
