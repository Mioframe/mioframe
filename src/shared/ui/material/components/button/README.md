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

Mode: align-existing
Family: Button (official Material "Buttons" family — common buttons)
Components: MDButton
Current objective: Independently resolve the canonical Material 3 Expressive common-buttons
  contract from official sources (not from the prior README or legacy code), classify the
  already-relocated `src/shared/ui/material/components/button` implementation and its proof
  against that target, correct evidence that was previously mis-cited, and record the resulting
  alignment map and correction units. This objective is documentation/assessment only; no
  production code changed in this pass.
Required scenarios:
  - Render elevated/filled/tonal/outlined/text color styles at all five sizes (extra-small,
    small, medium, large, extra-large) and both shapes (round, square).
  - Stateless (`default`) action button: native click, hover/focus/pressed visuals, disabled.
  - Controlled two-state (`toggle`) button driven by consumer-owned `selected`; shape morphs
    between resting/selected/pressed per size; `aria-pressed` reflects `selected`.
  - Optional leading icon via the `icon` slot.
  - Project loading-state extension (see Extensions) used by existing dialog/action consumers.
Non-goals:
  - Icon Button (`md.comp.icon-button`), Button groups (`components/button-groups`, formerly
    "segmented buttons"), and FAB (`md.comp.fab`, `md.comp.extended-fab`) are separate official
    Material families. They remain legacy under src/shared/ui/Button
    (MDIconButton.vue, MDSegmentedButtons.vue, MDFab.vue, MDExtendedFab.vue, FabContainer.vue) and
    are explicitly out of scope for this task; each requires its own future
    `material-component` run.
  - src/shared/ui/ButtonGrid, src/shared/ui/ButtonGroup, and src/shared/ui/ButtonsBar are generic
    non-Material layout/legacy wrappers. They do not implement `md.comp.button` and are out of
    scope.
  - No public API change to `MDButton` in this pass (props/emits/slots stay exactly as
    documented below).
Current owner: src/shared/ui/material/components/button/ (already the sole owner — the legacy
  `src/shared/ui/Button/{MDButton.vue,MDButton.stories.ts,MDButton.test.ts,
  MDButtonTargetHitVisualStory.vue}` files no longer exist; a prior, pre-convergence pass already
  physically relocated the family before this independent assessment ran — see Alignment map,
  "Workflow-history" concern, for why that relocation is treated as current-state evidence here
  rather than as this objective's own action).
Canonical owner: src/shared/ui/material/components/button/
Public export: `MDButton` from `@shared/ui/material` (root barrel, `src/shared/ui/material/index.ts`)
  and from the family-local `src/shared/ui/material/components/button/index.ts`.
Affected consumers: verified by repository grep on the literal `MDButton` identifier (2026-07-20)
  — every consumer already imports from `@shared/ui/material`, none remain on the legacy
  `@shared/ui/Button` path:
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
  Files importing only other `@shared/ui/Button` exports (`MDIconButton`, `MDExtendedFab`,
  `FabContainer`, etc.) never used `MDButton` and remain correctly out of this family's scope.
Representative consumers: src/shared/ui/Dialog/DialogForm.vue — a generic dialog action-bar
  composition root exercising `label`, `color="text"`, `loading`, and `native-type="submit"` in
  real parent-owned layout.
Official sources and snapshot: `material3` MCP server, cache `capturedAt: 2026-06-30T05:53:04.916Z`
  (this contract pass re-read the cache on 2026-07-20; cache `isFresh: false`, age past the 7-day
  TTL, `coverageHealth: partial` — 81/206 accepted routes, 0 suspicious/short/duplicate pages). A
  refresh was attempted during this pass (`refresh_material_docs`) and failed with a connection
  error from the MCP server; the existing cache was used as-is. Routes read directly for this
  objective: `components/buttons/overview`, `components/buttons/specs` (docs-cache capture of this
  page is truncated after the Elevated color table — Tonal/Outlined/Text color tables were not in
  the docs capture and were sourced from the token-set data instead), `components/buttons/guidelines`,
  `components/buttons/accessibility`, `foundations/designing/structure` (general touch/pointer
  target guidance), and the full `md.comp.button.*` token sets (`filled`, `elevated`, `tonal`,
  `outlined`, `text`, and the five size sets `xsmall/small/medium/large/xlarge`) via
  `get_component_tokens`. The deprecated pre-Expressive token-set names
  (`md.comp.text-button`, `md.comp.filled-button`, `md.comp.outlined-button`,
  `md.comp.elevated-button`, `md.comp.filled-tonal-button`) were inspected only to confirm they are
  superseded and are not used as canonical evidence.
Supported Material surface:
  - Colors: `elevated`, `filled`, `tonal`, `outlined`, `text` (official: five color
    "configurations" per the M3 Expressive framing on the Overview page).
  - Sizes: `extra-small`, `small`, `medium`, `large`, `extra-large` (official token sets
    `md.comp.button.xsmall/small/medium/large/xlarge`; size variety beyond the single legacy
    default size is an Expressive-only addition).
  - Shapes: `round`, `square`, with a pressed-shape morph (both shapes move one step toward a
    less-rounded corner via a spring, same spring constants at every size) and a selected-shape
    morph (round↔square swap: a round button's selected corner equals the square default corner,
    and vice versa) — official Guidelines: "toggle buttons change from round to square when
    selected."
  - Variants: `default` (stateless) and `toggle` (controlled `selected`; Expressive-only —
    official Specs Variants table marks Toggle as unavailable in baseline M3).
  - Optional leading icon via slot; label required and used as accessible name.
  - Interaction states: hover, focus-visible, pressed, disabled — routed through the existing
    `@shared/ui/State` state-layer/ripple/focus foundation (state-layer is not one of the three
    named official anatomy parts, but every color style publishes hover/focus/pressed state-layer
    tokens, so the foundation-owned state layer is the correct implementation of that token
    surface).
Unsupported Material surface:
  - `color="text"` + `variant="toggle"`: independently re-verified against the official token
    table — `md.comp.button.text` publishes 20 base-state tokens and zero `selected`/`unselected`
    tokens, versus 24–52 toggle-specific tokens for each of the other four color styles. This is
    confirmed official absence, not an implementation gap. Normalizes to `variant="default"`;
    `selected` has no effect; dev warning.
  - Any color/size/shape combination beyond the documented five colors × five sizes × two shapes
    matrix.
Canonical public API (unchanged from the prior contract; independently re-checked against current
  `MDButton.vue` and matches):
  Props — `label: string` (required); `color?: 'elevated'|'filled'|'tonal'|'outlined'|'text'`
  (default `filled`); `size?: 'extra-small'|'small'|'medium'|'large'|'extra-large'` (default
  `small`); `shape?: 'round'|'square'` (default `round`); `variant?: 'default'|'toggle'`
  (default `default`); `selected?: boolean`; `disabled?: boolean`; `nativeType?:
  'button'|'submit'|'reset'` (default `button`); `loading?: number|boolean` (project extension,
  see Extensions).
  Emits — `click: [event: MouseEvent]` (native click, not synthesized).
  Slots — `icon()`.
Native semantics and accessibility:
  - Root is a native `<button>`; official accessibility guidance: "the accessibility label for a
    button should match the visible label text." An explicit `aria-label` mirroring `label` is
    used (rather than relying on the browser's accessible-name-from-content algorithm) so the
    accessible name stays exactly the label regardless of icon-slot content or the loading
    indicator's DOM presence.
  - Keyboard: native `Tab` to reach, native `Space`/`Enter` to activate — matches the official
    Accessibility page's keyboard table exactly; no synthesized keyboard handling.
  - `disabled` uses native `disabled` (blocks click, focus, hover, pressed).
  - `aria-pressed` is applied only for the applied `toggle` variant and mirrors `selected`. The
    official Buttons docs (Overview/Specs/Guidelines/Accessibility) contain zero mentions of any
    `aria-*` attribute for the toggle state — this is not an official requirement, but it is not
    contradicted either; `aria-pressed` is the standard native/ARIA mechanism for a two-state
    toggle button and is required for the control to be programmatically identifiable as
    pressed/unpressed to assistive technology, so it is kept as a necessary implementation detail
    of the officially-documented toggle behavior rather than a deviation.
  - Loading does not disable the control or change its accessible name (regression-tested: click
    still activates exactly once while loading).
Canonical anatomy and DOM ownership:
  - Official anatomy (Guidelines page, "Anatomy") is exactly three named parts: label text,
    container, icon (optional). No formal "state layer" anatomy part is named, even though
    hover/focus/pressed state-layer tokens exist for every color style.
  - Current DOM: `button` (container) → non-layout `__target` hit-area span → `MDStateLayer` →
    `__content` (optional `__icon` slot, `__label-text`, optional loading
    `MDCircularProgressIndicator`). No nested interactive elements; no extra wrapper `div`s
    (regression-tested).
  - The `__target` span is additional-to-anatomy DOM, not itself an official anatomy part. The
    prior README cited the standalone Buttons Accessibility page as its source for a "48dp minimum
    touch target" — that citation was wrong: the standalone Buttons Accessibility page has zero
    touch-target language (verified directly this pass); the 48×48dp target language in the
    corpus belongs only to the separate Button Groups pages. The correct official source is the
    general foundational guidance at `foundations/designing/structure.md` ("Target sizes... For
    most platforms, consider making touch targets at least 48 x 48dp"), which applies across
    Material components generically. Since the extra-small (32dp) and small (40dp) container
    heights are both below that general 48dp guidance, the `__target` span expanding the
    click/tap area to 48dp for those two sizes is a correct application of that general
    guidance, not a fabricated addition — the implementation is unchanged, only the cited source
    is corrected.
Canonical state ownership and lifecycle:
  - `selected` is fully consumer-controlled; the component holds no hidden selection copy
    (regression-tested).
  - hover/focus-visible/pressed come from the existing `useStateLayer`/`useRipple` composables in
    `@shared/ui/State`; Button does not reimplement state-layer or ripple lifecycle. This is
    foundation-owned, family-agnostic behavior; its own correctness is proved once by its owner,
    not re-proved here.
  - `loading` is a plain prop; `0`, a positive number, and `true` are all active loading states,
    `false`/`undefined` are not (regression-tested for all four cases).
Canonical token, style, motion, and rendered-property routing:
  - Every `--md-comp-button-<color>-*` and `--md-comp-button-<size>-*` custom-property name is the
    exact official token path (`md.comp.button.<color>.*` / `md.comp.button.<size>.*`)
    unshortened. Spot-checked against the token table this pass: Filled `container.color` →
    `md.sys.color.primary` (`#6750a4` light / `#d0bcff` dark) and `label-text.color` →
    `md.sys.color.on-primary` match exactly; every size's `container-height`
    (32/40/56/96/136dp for xs/small/medium/large/xlarge), `icon-size` (20/20/24/32/40dp),
    `outlined-outline-width` (1/1/1/2/3dp), default/pressed/selected corner values, and the
    pressed-shape spring constants (`--md-sys-motion-spring-fast-spatial-stiffness: 800`,
    `-damping: 0.6`, defined once in `src/shared/lib/md/tokens.css` and correctly referenced, not
    duplicated) all match the independently-read official token data exactly.
  - Configuration (color/size/shape) selects source tokens into private
    `--md-private-button-*` slots; state selectors (hover/focus/pressed/disabled/selected)
    resolve the applicable `--md-private-button-rendered-*` value; the template/style only ever
    reads the `rendered` slot. This three-stage route is carried forward from the prior
    implementation unchanged and matches the token table's per-state token structure.
  - `md.comp.button.<size>.label-text` is a composite official token with no decomposed
    `--md-comp-*` path; rendered via the shared `MD_TYPESCALE` classes
    (xsmall/small→label-large, medium→title-medium, large→headline-small, xlarge→headline-large),
    matching the official per-size typescale (Roboto Flex weight/size/line-height) exactly.
  - `MDStateLayer` continues to consume only the generic `--md-private-state-*` contract; it does
    not read Button-specific tokens.
Required foundation dependencies: none new. `useStateLayer`, `useRipple`, `MDStateLayer` (from
  `@shared/ui/State`), `MDCircularProgressIndicator` (from `@shared/ui/ProgressIndicators`),
  `MD_TYPESCALE` (from `@shared/lib/md`), and the system motion spring tokens in
  `src/shared/lib/md/tokens.css` are existing, correctly-owned, family-agnostic generic shared
  infrastructure already used by multiple Material components (including the still-legacy
  `MDIconButton.vue`, which references the identical spring tokens). Per `docs/architecture.md`,
  `@shared/ui/material` may import correctly-owned generic shared/lib infrastructure directly.

CURRENT IMPLEMENTATION ASSESSMENT

Concern: Physical ownership location and consumer migration
Canonical target: one canonical owner at `src/shared/ui/material/components/button/`; consumers
  use `@shared/ui/material`.
Current behavior: relocation and consumer migration are already complete (verified this pass by
  grep — see Affected consumers); legacy `MDButton.*` files no longer exist.
Classification: confirmed-compliant
Implementation owner: `material-component-adoption` (already executed in a prior pass)
Primary proof: repository grep for `MDButton` import specifiers (this pass, 2026-07-20)
Required correction: none

Concern: Family README contract format and evidence provenance
Canonical target: the README independently resolves the canonical target before assessing
  current implementation, per `docs/component-development.md`.
Current behavior (prior to this pass): the README was authored as an "end-to-end-migration" plan
  that used legacy `MDButton` behavior as the effective target and cited the standalone Buttons
  Accessibility page for the 48dp touch target (a citation that does not hold up — see Canonical
  anatomy above).
Classification: misaligned (corrected by this pass)
Implementation owner: `material-component-contract`
Primary proof: this README
Required correction: none remaining — this document replaces the prior one with an independently
  resolved target, the corrected touch-target citation, and a proper alignment map.

Concern: Color styles, sizes, shapes, and shape/selection morph
Canonical target: five colors, five sizes, two shapes, pressed/selected corner morphs with
  documented spring constants (see Canonical token routing above).
Current behavior: `MDButton.vue`/`MDButton.css` implement exactly this matrix; values
  cross-checked line-for-line against the token table this pass (heights, icon sizes, outline
  widths, corner tokens, spring constants all match).
Classification: confirmed-compliant
Implementation owner: `MDButton.vue` (props/anatomy) + `MDButton.css` (token/geometry/motion
  routing)
Primary proof: `MDButton.test.ts` (native attributes/anatomy), Storybook `SizeGeometryMatrix`,
  `ToggleShapes`, `TokenRoutingMatrix`, `ToggleTokenRoutingMatrix` (visual-regression lane)
Required correction: none

Concern: `color="text"` + `variant="toggle"` unsupported combination
Canonical target: no official toggle token route for the text color style.
Current behavior: `resolveButtonPresentation.ts` normalizes to `variant="default"` with a dev
  warning; independently re-verified this pass against the token table (0 of 20 text tokens are
  selected/unselected, vs. 24–52 for the other four styles).
Classification: confirmed-compliant
Implementation owner: `resolveButtonPresentation.ts`
Primary proof: `resolveButtonPresentation.test.ts`, `MDButton.test.ts`
Required correction: none

Concern: Toggle `aria-pressed`
Canonical target: official docs specify no ARIA attribute for toggle buttons at all.
Current behavior: `aria-pressed` is set to `appliedSelected` only when the applied variant is
  `toggle`.
Classification: confirmed-compliant (official silence, not conflict; standard native/ARIA
  mechanism for a documented two-state control)
Implementation owner: `MDButton.vue`
Primary proof: `MDButton.test.ts` ("exposes aria-pressed only for variant=\"toggle\"...")
Required correction: none

Concern: Native anatomy, no nested interactive elements, click/disabled/loading semantics
Canonical target: native `<button>`, three anatomy parts + optional icon, native
  keyboard/disabled semantics, accessible name matches visible label.
Current behavior: matches; `MDButton.test.ts` has direct regression coverage for nested-element
  absence, click emission, disabled blocking click, and all four loading-state combinations.
Classification: confirmed-compliant
Implementation owner: `MDButton.vue`
Primary proof: `MDButton.test.ts`
Required correction: none

Concern: `__target` hit-area span and its cited authority
Canonical target: no standalone-Button touch-target minimum in the official Buttons pages; a
  general 48×48dp guidance exists at `foundations/designing/structure.md`.
Current behavior: a non-layout, `aria-hidden` 48dp `__target` span is rendered for the
  extra-small/small sizes (both below 48dp container height).
Classification: confirmed-compliant (behavior unchanged; only the cited source was wrong and is
  corrected above)
Implementation owner: `MDButton.vue` (anatomy) + `MDButton.css` (`--md-button-target-size`)
Primary proof: `MDButton.test.ts` ("renders a non-layout target layer as a direct child..."),
  `MDButtonTargetHitVisualStory.vue`
Required correction: none (citation fixed in this README)

Concern: Label-text reflow at 200% text scaling
Canonical target: official Accessibility page — "labels should fit within two lines after 200%
  text size[ scaling]; if truncated, provide an alternative way to access the full content in a
  single tap."
Current behavior: `.md-button` now uses `min-height` instead of a fixed `height`, and
  `__label-text` uses `white-space: normal; overflow-wrap: anywhere; text-align: center;` instead
  of unconditional `nowrap`. The label wraps (and the button grows to contain it) whenever a
  parent-owned layout constrains available width — e.g. under 200% text scaling, or a narrow
  dialog action bar — instead of overflowing. No hard 2-line clamp or truncation was added: the
  official guidance's binding accessibility requirement is "if truncated, provide access to the
  full content," so not truncating at all (letting the label wrap to as many lines as the content
  needs) trivially satisfies it without inventing a new tap-to-expand interaction the family has
  no other place for. "Should fit within two lines" is content-authoring guidance for the label
  text chosen by the consumer, not a hard component-enforced cap.
Classification: confirmed-compliant
Implementation owner: `MDButton.css` (`.md-button` height, `__label-text` wrap/align rules)
Primary proof: new Storybook story `LabelReflow` (width-constrained fixtures at `small` and
  `medium` size) and a new Playwright test in `tests/e2e/visual/shared-ui/md-button.spec.ts`
  ("MDButton label wraps across two lines under a narrowed containing block instead of
  overflowing") asserting non-`nowrap` computed style, button height growing beyond the
  single-line nominal height, and the full label text present with no `text-overflow: ellipsis`.
  The full existing visual suite (225 specs, including every pre-existing Button baseline
  screenshot) was run and passed with zero diffs, confirming the fix does not change rendered
  output for any existing short-label fixture.
Required correction: none

Concern: `loading?: number | boolean` project extension
Canonical target: no official Material Button counterpart.
Current behavior: composes the existing `MDCircularProgressIndicator` foundation; used by 19+
  existing consumers for async-action affordance.
Classification: project-extension
Implementation owner: `MDButton.vue` (composition) + `resolveButtonPresentation` (n/a — loading is
  not part of color/variant normalization)
Primary proof: `MDButton.test.ts` (four loading-state cases)
Required correction: none — preserve unchanged

Concern: Cache freshness of the official evidence used in this pass
Canonical target: `docs/sources.md` requires verifying stale/suspicious/contradictory cached
  evidence directly when direct access is available.
Current behavior: the `material3` MCP docs cache is `isFresh: false` (captured
  2026-06-30, ~20 days before this 2026-07-20 pass, past its 7-day TTL) with partial route
  coverage (81/206), but zero suspicious/short/duplicate pages, and every fact used here was
  independently cross-checked against precise current implementation values (colors, sizes,
  spring constants) with exact matches. A refresh was attempted this pass and failed
  (MCP connection closed).
Classification: unresolved (residual, non-blocking for this objective)
Implementation owner: none — evidence-access concern, not an implementation owner
Primary proof: n/a
Required correction: none required for the current objective (no contradiction or missing fact
  was found); a future Button pass should retry `refresh_material_docs` or verify the live Specs
  page directly for the Tonal/Outlined/Text color tables that the docs-page capture itself never
  reached, to fully close this residual risk.

IMPLEMENTATION DECOMPOSITION
Public composition root: `MDButton.vue` — props/emits/slots declaration, native `<button>` host,
  required anatomy (target span, state layer, content, optional icon/progress), wires
  `useStateLayer`/`useRipple`, and composes the normalization module's computed values into class
  bindings and `aria-*` attributes. No token or CSS logic lives here.
API normalization and invalid combinations: `resolveButtonPresentation.ts` — pure functions taking
  plain prop values and returning the applied variant, applied selected, whether the text+toggle
  combination is unsupported, and the size→typescale class. Independently unit-testable without
  mounting a component.
Native host and anatomy: owned by `MDButton.vue` template; no separate file — anatomy is small,
  linear, and has no independent proof owner beyond the composition root's own contract tests.
Semantic state resolution: `resolveButtonPresentation.ts`.
Interaction lifecycle: reused as-is from `@shared/ui/State` (`useStateLayer`, `useRipple`); no
  Button-owned lifecycle composable. Dev-only invalid-combination warnings stay inline in the
  composition root as a thin side effect over predicates already proved at the
  `resolveButtonPresentation` unit-test layer.
Token selection / Style owner / Rendered-property application / Motion owner: `MDButton.css` — a
  family-local, BEM-namespaced (`.md-button`) stylesheet loaded via
  `<style scoped src="./MDButton.css">`, carrying the configuration → state → rendered-property
  CSS custom-property route and the pressed/selected shape-morph spring routing. `scoped` is
  required: dropping it lowers these rules' specificity below unrelated same-named custom-property
  declarations inside child components, breaking token override routing into those children.
Foundation integrations: direct imports of `useStateLayer`/`useRipple`/`MDStateLayer` from
  `@shared/ui/State`, `MDCircularProgressIndicator` from `@shared/ui/ProgressIndicators`,
  `MD_TYPESCALE` from `@shared/lib/md`, and the system motion spring tokens from
  `src/shared/lib/md/tokens.css`. No new foundation code.
Stories and fixtures: `MDButton.stories.ts` and `MDButtonTargetHitVisualStory.vue`.
Co-location decisions: `resolveButtonPresentation.ts`/`.test.ts` and `MDButton.css` are colocated
  with `MDButton.vue` (not nested further) because Button is a single component, not a
  multi-component family.

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
    `visual`-tagged stories (`VisualStates`, `VisualInteractionStates`, `SizeGeometryMatrix`,
    `ToggleShapes`, `ToggleInteractionStates`, `DisabledSelectedOutlinedAndText`,
    `TokenRoutingMatrix`, `ToggleTokenRoutingMatrix`, `DefaultRoleMatrix`,
    `DefaultToggleRoleMatrix`) (visual-regression-testing lane; bounded screenshots only, not
    correctness proof by themselves).
  - Representative-consumer wiring (`DialogForm.vue`) → existing consumer-level tests at that
    call site.
Existing-proof classification: `MDButton.test.ts` and `resolveButtonPresentation.test.ts` are
  reclassified this pass from unassessed carried-over tests to `canonical-proof` — every case
  title was checked against the independently-resolved target above (native semantics, anatomy,
  toggle/text unsupported detection, loading states, aria-pressed) and each one asserts behavior
  that matches that target, not a legacy defect. The `visual`-tagged Storybook stories are
  `canonical-proof` for the token/geometry/shape-morph matrices they cover, and
  `implementation-detail-test` only insofar as they also incidentally exercise the
  not-yet-corrected `nowrap` label behavior (see Correction units) — they do not currently cover
  200%-scaled text at all, so they are not proof for that concern either way.
Initial failing or prepared proof: not applicable to this pass (documentation/assessment only).
  The next correction unit (label reflow) needs a new browser-behavior or visual story that
  renders a long label under 200% simulated text scaling before that fix lands.
Browser scenarios prepared before implementation: none new this pass.
Visual acceptance surface: `Material 3/Components/Buttons/MDButton` in Storybook, unchanged by
  this pass (no rendered output was modified).
Consumer proof: unchanged from the already-completed migration; representative consumer
  (`DialogForm.vue`) and the listed consumer-level tests remain valid.

CORRECTION UNITS
Current correction units: none open. The one unit identified in this pass — label-text reflow at
  200% text scaling — is complete: `MDButton.css` now uses `min-height` on `.md-button` and
  wrapping (`white-space: normal; overflow-wrap: anywhere; text-align: center;`) on
  `__label-text` instead of a fixed `height`/`nowrap`. Proved by the new `LabelReflow` story and
  its Playwright test (see alignment map); the full existing visual suite passed with zero
  screenshot diffs, so no compatibility impact on any existing consumer or fixture.
Implementation order: n/a — no open unit.
Consumer migration: none required — already complete.
Obsolete-owner removal: none — the legacy `MDButton` files are already removed; nothing else in
  `src/shared/ui/Button` belongs to this family.
Extensions or deviations: `loading?: number | boolean` project extension, preserved unchanged
  (see alignment map). `color="text"` + `variant="toggle"` unsupported-combination normalization
  is confirmed official absence, not a project deviation.
Required unresolved decisions: none blocking. The docs-cache freshness concern (see alignment map)
  is a residual evidence-access risk, not a decision required by the current supported surface —
  every fact actually needed for this family's colors/sizes/shapes/toggle/tokens was independently
  resolved and cross-checked, several against exact current implementation values.
Remaining known gaps: the docs-cache freshness residual noted in the alignment map (retry
  `refresh_material_docs`, or verify the live Specs page directly for the Tonal/Outlined/Text
  color tables the docs-page capture never reached) is the only remaining known gap. It is
  non-blocking for the current supported surface.
Current objective readiness: ready
Family alignment status: converging
```
