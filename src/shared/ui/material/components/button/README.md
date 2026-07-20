# Button

Canonical owner of the official Material 3 Expressive **Buttons** family (`components/buttons/*`
on `m3.material.io`): elevated, filled, filled tonal, outlined, and text buttons, including the
`toggle` (selection) variant.

Canonical library rules:

- [`../../docs/architecture.md`](../../docs/architecture.md)
- [`../../docs/sources.md`](../../docs/sources.md)
- [`../../docs/component-development.md`](../../docs/component-development.md)

```text
MATERIAL COMPONENT CONTRACT

Change mode: end-to-end-migration
Family: Button (official Material "Buttons" family — common buttons)
Components: MDButton
Objective: Migrate the official Material 3 Expressive common-buttons implementation from the
  legacy src/shared/ui/Button root into the canonical src/shared/ui/material/components/button
  boundary, decomposed per docs/architecture.md, with every existing consumer migrated to the
  curated @shared/ui/material public entry point and the legacy owner removed.
Required scenarios:
  - Render elevated/filled/tonal/outlined/text color styles at all five sizes (extra-small,
    small, medium, large, extra-large) and both shapes (round, square).
  - Stateless (`default`) action button: native click, hover/focus/pressed visuals, disabled.
  - Controlled two-state (`toggle`) button driven by consumer-owned `selected`; shape morphs
    between resting/selected/pressed per size; `aria-pressed` reflects `selected`.
  - Optional leading icon via the `icon` slot.
  - Project loading-state extension (see Extensions) used by existing dialog/action consumers.
  - Preserve every existing consumer's current button surface, label, and action semantics
    (see Affected consumers) through an import-path-only migration; no consumer-visible prop or
    behavior change is in scope.
Non-goals:
  - Icon Button (`md.comp.icon-button`), Button groups (`components/button-groups`, formerly
    "segmented buttons"), and FAB (`md.comp.fab`, `md.comp.extended-fab`) are separate official
    Material families. They remain legacy under src/shared/ui/Button
    (MDIconButton.vue, MDSegmentedButtons.vue, MDFab.vue, MDExtendedFab.vue, FabContainer.vue) and
    are explicitly out of scope for this task; each requires its own future
    `material-component` run.
  - src/shared/ui/ButtonGrid, src/shared/ui/ButtonGroup, and src/shared/ui/ButtonsBar are generic
    non-Material layout/legacy wrappers (Bulma-style `.buttons.has-addons`, a raw grid, and a
    non-token toolbar-style bar). They do not implement `md.comp.button` and are out of scope.
  - No public API change to `MDButton` (props/emits/slots stay exactly as documented below);
    this migration is relocation and decomposition, not a redesign.
Current owner: src/shared/ui/Button/{MDButton.vue, MDButton.stories.ts, MDButton.test.ts,
  MDButtonTargetHitVisualStory.vue}
Canonical owner: src/shared/ui/material/components/button/
Public export: `MDButton` from `@shared/ui/material` (root barrel curated for the first time by
  this migration) and from the family-local `src/shared/ui/material/components/button/index.ts`.
Affected consumers (import-path migration only; verified by repository grep scoped to the
  literal `MDButton` identifier, not merely any import from `@shared/ui/Button`, 2026-07-20):
  src/entities/databaseRelation/RelationValueInline.vue;
  src/features/databaseFilterEdit/DatabaseFilterAddButton.vue;
  src/features/databaseItemSorting/DatabaseItemSortingListSection.vue;
  src/features/databaseViewCreate/DatabaseViewAddForm.vue;
  src/features/diagnosticsErrorPrompt/DiagnosticsErrorPrompt.vue;
  src/features/exampleDocumentsCreate/DatabaseExampleDocumentCreateSuccessCard.vue;
  src/features/vfsActivityStatus/VfsActivityStatusChip.vue (+ .test.ts);
  src/pages/AboutMioframePane/AboutMioframePane.vue (+ .test.ts);
  src/shared/lib/onBackNavigation/BackNavigationPlayground.vue;
  src/shared/ui/Card/MDCard.stories.ts;
  src/shared/ui/Dialog/DialogForm.vue;
  src/shared/ui/Menu/MDMenuPlayground.vue, stories/MDMenuWithSubmenuStory.vue;
  src/shared/ui/NavigationPath/MDNavigationPathSegmentButton.vue;
  src/shared/ui/Overlay/stories/OverlayLifecycleRegressionStory.vue;
  src/shared/ui/Snackbar/MDSnackbar.vue;
  src/shared/ui/State/MDStateLayer.stories.ts;
  src/shared/ui/Tooltips/MDRichTooltipPlayground.vue;
  src/widgets/DocumentView/Database/DatabasePropertiesSheet.vue, DatabaseViewsSheet.vue;
  src/widgets/PwaInstallWidget/PwaInstallWidget.vue;
  src/widgets/RepositoryExplorerWidget/RepositoryExplorerWidget.vue (+ .test.ts).
  Files that only import other `@shared/ui/Button` exports (`MDIconButton`, `MDExtendedFab`,
  `FabContainer`) — e.g. DatabaseQueryFilterForm.vue, StarterExamplesDismissButton.vue,
  DocumentViewPane.vue, RepoExplorerPane.vue, MDChipBase.vue, MDDialog.vue, MDSplitLayout.vue,
  MDContextMenuButton.vue, MDNavigationPath.vue, MDToolbarPlayground.vue, DatabaseToolbar.vue,
  LocalFSDeviceFileListItem.vue, RepositoryExplorerDocumentsSection.vue,
  StorageSettingsSection.vue, StarterExamplesWidget.vue, the document-action dialogs under
  src/features/{documentRemove,documentCreate,directoryCreate,entryRemove,entryRename,importZip,
  exportZip,databaseViewRename,databaseItemEdit,mioframeSpacePick,documentRename} — never used
  `MDButton` and are correctly out of this migration's scope.
Representative consumer: src/shared/ui/Dialog/DialogForm.vue — a generic dialog action-bar
  composition root already exercising `label`, `color="text"`, `loading`, and
  `native-type="submit"` in real parent-owned layout, with existing consumer tests
  (`src/shared/ui/Dialog/*.test.ts` if present) to catch wiring regressions.
Official sources and snapshot: `material3` MCP cache, `capturedAt: 2026-06-30T05:53:04.916Z`,
  source `m3.material.io`, routes verified: `components/buttons/overview`,
  `components/buttons/accessibility`, and token sets `md.comp.button.{filled,elevated,tonal,
  outlined,text}` and `md.comp.button.{xsmall,small,medium,large,xlarge}` (via
  `get_component_tokens`). `md.comp.text-button`, `md.comp.filled-button`,
  `md.comp.outlined-button`, `md.comp.elevated-button`, `md.comp.filled-tonal-button` token sets
  are the deprecated pre-Expressive naming and are not used.
Supported Material surface:
  - Colors: `elevated`, `filled`, `tonal`, `outlined`, `text` (official: five color options).
  - Sizes: `extra-small`, `small`, `medium`, `large`, `extra-large` (official token sets
    `md.comp.button.xsmall/small/medium/large/xlarge`).
  - Shapes: `round`, `square`, with pressed-shape and selected-shape morph per size (official
    M3 Expressive update: "shape morphs when pressed" / "shape morphs when selected").
  - Variants: `default` (stateless) and `toggle` (controlled `selected`, `aria-pressed`).
  - Optional leading icon via slot; label required and used as accessible name.
  - Interaction states: hover, focus-visible, pressed, disabled — routed through the existing
    `@shared/ui/State` state-layer/ripple/focus foundation.
  - Native `disabled`; native `type="button"|"submit"|"reset"`.
Unsupported Material surface:
  - `color="text"` + `variant="toggle"`: verified in `md.comp.button.text` tokens — that set
    publishes no `selected`/`unselected` entries (20 tokens total vs. 51–52 for the other four
    color styles). Normalizes to `variant="default"`; `selected` has no effect; dev warning.
    This is confirmed official absence, not an implementation gap.
  - Any color/size/shape combination beyond the documented five colors × five sizes × two
    shapes matrix.
Public API (unchanged from legacy `MDButton`):
  Props — `label: string` (required); `color?: 'elevated'|'filled'|'tonal'|'outlined'|'text'`
  (default `filled`); `size?: 'extra-small'|'small'|'medium'|'large'|'extra-large'` (default
  `small`); `shape?: 'round'|'square'` (default `round`); `variant?: 'default'|'toggle'`
  (default `default`); `selected?: boolean`; `disabled?: boolean`; `nativeType?:
  'button'|'submit'|'reset'` (default `button`); `loading?: number|boolean` (project
  extension, see Extensions).
  Emits — `click: [event: MouseEvent]` (native click, not synthesized).
  Slots — `icon()`.
Native semantics and accessibility:
  - Root is a native `<button>`; `aria-label` mirrors `label` (accessible name always matches
    visible label per official accessibility guidance); `aria-pressed` present only for the
    applied `toggle` variant.
  - Keyboard: native `Tab` to reach, native `Space`/`Enter` to activate — no synthesized
    keyboard handling (official: "Tab" / "Space or Enter").
  - `disabled` uses native `disabled` (blocks click, focus, hover, pressed).
  - Loading does not disable the control or change its accessible name (existing regression
    test: click still activates exactly once while loading).
Anatomy and DOM ownership:
  - `button` → non-layout `__target` hit-area span (48dp minimum touch target for extra-small/
    small sizes) → `MDStateLayer` → `__content` (optional `__icon` slot, `__label-text`,
    optional `MDCircularProgressIndicator`).
  - No nested interactive elements; no extra wrapper `div`s (existing regression test asserts
    button content is free of nested `button`/`div`).
State ownership and lifecycle:
  - `selected` is fully consumer-controlled; the component holds no hidden selection copy
    (existing regression test verifies this explicitly).
  - hover/focus-visible/pressed come from the existing `useStateLayer`/`useRipple` composables
    in `@shared/ui/State`; Button does not reimplement state-layer or ripple lifecycle.
  - `loading` is a plain prop; `0`, a positive number, and `true` are all active loading states,
    `false`/`undefined` are not (existing regression tests cover all four cases).
Token and rendered-property routing:
  - Every `--md-comp-button-<color>-*` custom property name is the exact official token path
    (`md.comp.button.<color>.*`) unshortened. Configuration (color/size/shape) selects source
    tokens into private `--md-private-button-*` slots; state selectors (hover/focus/pressed/
    disabled/selected) resolve the applicable `--md-private-button-rendered-*` value; the
    template/style only ever reads the `rendered` slot. This three-stage route already exists
    in the legacy stylesheet and is carried forward unchanged.
  - `md.comp.button.<size>.label-text` is a composite token with no decomposed
    `--md-comp-*` path; it continues to be rendered via the shared `MD_TYPESCALE` label/title/
    headline classes rather than invented font fragments (documented size→class mapping
    unchanged: xsmall/small→label-large, medium→title-medium, large→headline-small,
    xlarge→headline-large).
  - `MDStateLayer` continues to consume only the generic `--md-private-state-*` contract; it
    does not read Button-specific tokens.
Required foundation dependencies: none. `useStateLayer`, `useRipple`, `MDStateLayer` (from
  `@shared/ui/State`), `MDCircularProgressIndicator` (from `@shared/ui/ProgressIndicators`), and
  `MD_TYPESCALE` (from `@shared/lib/md`) are existing, correctly-owned, family-agnostic generic
  shared infrastructure already used by multiple legacy Material components. Per
  `docs/architecture.md`, `@shared/ui/material` may import correctly-owned generic shared/lib
  infrastructure directly; migrating Button does not require first relocating these modules
  into `material/foundation`, and none of them are Button-specific enough to justify a new
  foundation domain now.

IMPLEMENTATION DECOMPOSITION
Public composition root: `MDButton.vue` — props/emits/slots declaration, native `<button>`
  host, required anatomy (target span, state layer, content, optional icon/progress), wires
  `useStateLayer`/`useRipple`, and composes the normalization module's computed values into
  class bindings and `aria-*` attributes. No token or CSS logic lives here.
API normalization and invalid combinations: `resolveButtonPresentation.ts` — pure functions
  taking plain prop values (not reactive refs) and returning the applied variant, applied
  selected, whether the text+toggle combination is unsupported, and the size→typescale class.
  `MDButton.vue` wraps each function in a local `computed()`. Independently unit-testable
  without mounting a component.
Native host and anatomy: owned by `MDButton.vue` template (see Anatomy above); no separate
  file — the anatomy is small, linear, and has no independent proof owner beyond the
  composition root's own contract tests.
Semantic state resolution: `resolveButtonPresentation.ts` (applied variant/selected/typescale
  are the complete semantic-state precedence surface for this family).
Interaction lifecycle: reused as-is from `@shared/ui/State` (`useStateLayer`, `useRipple`); no
  Button-owned lifecycle composable — there is no Button-specific reactive lifecycle beyond
  what those composables already provide. The dev-only invalid-combination warnings
  (`onMounted`/`watchEffect`) stay inline in the composition root: they are a thin side effect
  over predicates already proved at the `resolveButtonPresentation` unit-test layer, not an
  independent contract.
Token selection / Style owner / Rendered-property application: `MDButton.css` — a family-local,
  BEM-namespaced (`.md-button`) stylesheet loaded via `<style scoped src="./MDButton.css">` in
  the composition root, carrying forward the existing configuration → state →
  rendered-property CSS custom-property route verbatim out of the current inline
  `<style scoped>` block. `scoped` is required, not optional: dropping it lowers these rules'
  specificity below unrelated same-named custom-property declarations inside child components
  (`MDCircularProgressIndicator`'s own scoped default color, and a motion-duration rule),
  breaking token override routing into those children — confirmed by two real visual-regression
  failures (`tests/e2e/visual/shared-ui/md-button.spec.ts`) during implementation, fixed by
  keeping `scoped` on the externalized file. Extracted into its own file (not left inline)
  because the visual contract has 5 colors × 5 sizes × 2 shapes × 5 interaction states × toggle
  selected/unselected — squarely the "non-trivial visual contract" case in
  `docs/architecture.md` requiring a separate owner-local stylesheet.
Foundation integrations: direct imports of `useStateLayer`/`useRipple`/`MDStateLayer` from
  `@shared/ui/State`, `MDCircularProgressIndicator` from `@shared/ui/ProgressIndicators`, and
  `MD_TYPESCALE` from `@shared/lib/md`. No new foundation code.
Stories and fixtures: `MDButton.stories.ts` and `MDButtonTargetHitVisualStory.vue`, migrated
  with updated relative imports (`@shared/ui/State/testing`, `useFocusIndicator` stay as
  absolute `@shared/ui/State/*` imports so they survive the directory move unchanged).
Co-location decisions: `resolveButtonPresentation.ts`/`.test.ts` and `MDButton.css` are
  colocated with `MDButton.vue` (not nested further) because Button is a single component, not
  a multi-component family like List — one extra directory level would not clarify ownership.

PROOF MAP
Observable contract → primary proof owner:
  - Prop defaults, required `label`, native attribute reflection (`type`, `disabled`),
    `aria-label`, `aria-pressed` presence/value, anatomy (no nested button/div, target span),
    click emission, disabled-blocks-click, loading state classes/indicator for `0`/number/
    `true`/`false`/absent, toggle selected has no hidden copy → component contract tests
    (`MDButton.test.ts`, component-contract-testing lane).
  - Applied-variant/selected normalization, text+toggle unsupported detection, size→typescale
    mapping → pure unit tests (`resolveButtonPresentation.test.ts`, unit-testing lane).
  - Visual color/size/shape/state/toggle-shape-morph/token-routing matrices → Storybook
    `visual`-tagged stories already present (`VisualStates`, `VisualInteractionStates`,
    `SizeGeometryMatrix`, `ToggleShapes`, `ToggleInteractionStates`,
    `DisabledSelectedOutlinedAndText`, `TokenRoutingMatrix`, `ToggleTokenRoutingMatrix`,
    `DefaultRoleMatrix`, `DefaultToggleRoleMatrix`) migrated as-is (visual-regression-testing
    lane; bounded screenshots only, not correctness proof by themselves).
  - Representative-consumer wiring (`DialogForm.vue`) → existing consumer tests plus focused
    manual/browser verification during Checkpoint D.
Initial failing proof: `resolveButtonPresentation.test.ts` does not exist yet — creating it
  before extracting the pure module is the applicable initial failing proof for this
  migration's one new architectural boundary. The full existing `MDButton.test.ts` suite
  (24 cases) already passes against current legacy behavior and is carried over as regression
  proof, not treated as new initial-failing proof.
Browser scenarios prepared before implementation: none beyond the existing Storybook
  interaction/visual stories; no new real-browser (Playwright) scenario is required — Button's
  hover/focus/pressed/ripple behavior is already proved at the `@shared/ui/State` foundation
  layer and exercised visually here.
Visual acceptance surface: the migrated Storybook stories at `Material 3/Components/Buttons/
  MDButton`, unchanged in content; operator compares only if any pixel output changes as a
  side effect of the CSS-file extraction (rendered output must not change — the CSS text
  itself is relocated, not rewritten).
Consumer proof: DialogForm.vue (representative) plus existing consumer-level tests already
  covering call sites (`VfsActivityStatusChip.test.ts`, `AboutMioframePane.test.ts`,
  `RepositoryExplorerWidget.test.ts`, `MDNavigationPath.test.ts`) re-run after the import-path
  migration.

Implementation order:
  1. `resolveButtonPresentation.ts` + failing-then-passing unit tests.
  2. `MDButton.css` (verbatim-content extraction from the current `<style scoped>` block).
  3. `MDButton.vue` composition root at the canonical path, wired to 1–2.
  4. Migrate `MDButton.test.ts`, `MDButton.stories.ts`, `MDButtonTargetHitVisualStory.vue`.
  5. Add family-local `index.ts`; add/extend the root `src/shared/ui/material/index.ts` public
     barrel to export `MDButton` for the first time.
  6. Validate the primary slice in the representative consumer (`DialogForm.vue`).
  7. Migrate all remaining listed consumers to `@shared/ui/material`.
  8. Remove `src/shared/ui/Button/{MDButton.vue,MDButton.stories.ts,MDButton.test.ts,
     MDButtonTargetHitVisualStory.vue}` and the commented-out `MDButton` re-export line from the
     legacy `index.ts` only if still present; leave the rest of the legacy directory (Icon
     Button, FAB, the empty Segmented-buttons stub) untouched.
Consumer migration: import-path only (`@shared/ui/Button` → `@shared/ui/material`), across the
  Affected consumers list above; no prop or template usage changes expected.
Extensions or deviations:
  - `loading?: number | boolean` has no official Material Button counterpart. Retained as a
    project extension because 19+ existing consumers (dialog/action buttons across
    features/widgets/pages) depend on it for async-action affordance; composes the existing
    `MDCircularProgressIndicator` foundation rather than inventing new visual language. Owner:
    `MDButton` family; must be preserved unchanged through this migration.
  - `color="text"` + `variant="toggle"` unsupported-combination normalization is a confirmed
    official absence (see Unsupported Material surface), not a project deviation.
Unresolved: none.
Readiness: ready.
```
