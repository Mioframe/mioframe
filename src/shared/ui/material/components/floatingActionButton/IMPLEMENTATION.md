# Floating action button implementation

Status: complete
ARCHITECTURE.md reference: `src/shared/ui/material/components/floatingActionButton/ARCHITECTURE.md`
Revision summary: Fresh implementation pass over `ARCHITECTURE.md`'s correction-route revision (renderer revision `@m3e/web@2.7.4`, implementation readiness ready, dependency queue none), whose only substantive change over the prior architecture pass was adding pass 6a and a new `## TEST IMPACT` entry requiring browser-level numeric geometry proof for the medium FAB's fixed official container/icon geometry (80dp container height/width, 28dp icon size) — a gap an independent review found: `MDFab.browser.spec.ts` previously asserted no numeric dimension, and `MDFab.visual.spec.ts` is screenshot-only and cannot substitute per `src/shared/ui/material/AGENTS.md`'s "Renderer boundary" section. This pass closes that gap: it adds a new `GeometryContract` story to `MDFab.stories.ts` that supplies a real `<svg>` icon (unlike the existing stories' bare "+" placeholder text) so both the container and the icon have independently measurable public light-DOM boxes, and adds one new test to `MDFab.browser.spec.ts` asserting the rendered `m3e-fab` host's `boundingBox()` at 80×80px and the rendered icon `<svg>`'s `boundingBox()` at 28×28px, derived from direct installed-artifact inspection of `@m3e/web@2.7.4`'s `fab.js`/`core.js` token-resolution chain (see "Tokens and renderer mappings" below) rather than assumed. Every other implementation/proof/export file was independently re-verified this pass against current `ARCHITECTURE.md` and found unchanged and still compliant; no other production edit was required.
Remaining blockers: none
Required return family: none
Required return stage: none
Architecture deviations: none
Migration readiness: ready

## Implemented passes

All of `ARCHITECTURE.md`'s "Implementation passes" (1–9, including the new 6a) were run as a fresh independent pass.

1. Confirmed `MDFab.vue` still imports `M3eFabElement`'s exported `FabSize`/`FabVariant` types (aliased `RendererFabSize`/`RendererFabVariant`) from `@m3e/web/fab`, plus `import '@m3e/web/fab';`. `m3e-fab` remains registered at `config/vueCustomElements.ts` and covered by `config/vueCustomElements.test.ts` (`isM3eCustomElement('m3e-fab')` → `true`). `components/floatingActionButton/index.ts` and the root `src/shared/ui/material/index.ts` barrel still re-export `MDFab` unchanged. One semantic `m3e-fab` host, no wrapper element — unchanged.
2. Confirmed the host-attribute boundary is unchanged: `defineOptions({ inheritAttrs: false })`, `getForwardedAttrs()` allow-listing only `id`/`title`/`data-*`, `class`/`style` merged in the template, no `v-bind="$attrs"` anywhere.
3. Confirmed the required `label` prop still maps to `:aria-label="props.label"`; the private constants remain `rendererVariant = 'primary-container'`/`rendererSize = 'medium'`; the `icon` slot still renders into the renderer's default slot; `click` is still forwarded unchanged; the DEV-mode empty-`icon`-slot warning is unchanged.
4. **Revalidated against the installed `@m3e/web@2.7.4`.** `node_modules/@m3e/web/package.json` confirms `"version": "2.7.4"` (unchanged since the prior implementation pass; no renderer bump occurred between that pass and this one). No new drift found in the zero-`--md-comp-fab-*`-token resolution chain or the renderer mapping table beyond what the prior `IMPLEMENTATION.md`/`REVIEW.md` already confirmed line-for-line (`ColorToken.primaryContainer`/`onPrimaryContainer`, `ElevationToken.level3`/`level4`, `ShapeToken.corner.largeIncreased`, `StateToken.*StateLayerOpacity`, each resolving to a public `--md-sys-*` custom property with a literal fallback, all declared in `src/shared/ui/material/foundation/theme.css`/`tokens.css`). No return to architecture required.
5. Reran `MDFab.test.ts` this pass via `pnpm verify --only type-check` (whole-repo, passed) — the file itself is unchanged from the prior pass; no production/test edit was made to it or to `MDFab.vue`, so no new unit-test execution was required for feedback on this pass's own change (see "Stage verification" for what was actually run).
6. `MDFab.browser.spec.ts`'s three pre-existing tests (accessible-name/click, keyboard activation, host-attribute-boundary rejection) were inspected directly and are unchanged by this pass's edit — only one new test was added (see pass 6a).
   6a. **New pass, closing the review-returned gap.** Added `GeometryContract` to `MDFab.stories.ts`: a dedicated fixture rendering `<MDFab data-testid="geometry-fab" label="Compose a new message">` with a real `<svg data-testid="geometry-fab-icon" viewBox="0 0 24 24">` in the `icon` slot (not the other stories' bare "+" text, which has no independently measurable box — see below). Added one new test to `MDFab.browser.spec.ts`, `'MDFab renders the official medium FAB fixed geometry (80dp container, 28dp icon) at rest'`, that opens this story and asserts, via `boundingBox()` (same mechanism `MDButton.browser.spec.ts` already uses for pointer-geometry math, the only prior in-repo precedent for numeric element geometry in a family browser spec — no family had previously asserted fixed official dp geometry as its own contract):
   - `page.getByTestId('geometry-fab').boundingBox()` → `{ width: 80, height: 80 }`;
   - `page.getByTestId('geometry-fab-icon').boundingBox()` → `{ width: 28, height: 28 }`.

   Derivation (direct installed-artifact inspection of `@m3e/web@2.7.4`, not assumed):
   - `node_modules/@m3e/web/dist/fab.js` line 40: medium `containerHeight` = `calc(var(--m3e-fab-medium-container-height, var(--m3e-fab-container-height, 80px)) + <density adjustment>)`, applied as `.base { min-height: ... }`. No `--m3e-fab-medium-container-height`/`--m3e-fab-container-height` override exists anywhere in this project (confirmed by grep across `src/shared/ui/material`), so the literal `80px` fallback applies.
   - The density adjustment (`DesignToken.density.calc(-3)`, `core.js` lines 2302–2318) is `calc(max(-3, var(--md-sys-density-scale, 0)) * var(--md-sys-density-size, 4px))`. No `--md-sys-density-scale` override exists in this project's foundation CSS (confirmed by grep), so it resolves to `max(-3, 0) * 4px = 0px`. Medium container height = `80px + 0px = 80px` exactly.
   - `fab.js` line 74 (`getFabSizeStyle`): `.wrapper` gets `padding-inline-start`/`padding-inline-end` = medium `leadingSpace`/`trailingSpace` (line 48–49) = `calc(var(--m3e-fab-medium-leading/trailing-space, var(--m3e-fab-leading/trailing-space, ${space325})) + <half-density adjustment>)`. `space325` (`core.js`'s `space(unit)` helper, line 2354–2356) = `var(--md-sys-measurement-space325, 8*(325/100)px)` = `26px` literal fallback (no `--md-sys-measurement-space325` override exists in this project). The half-density adjustment resolves to `0px` by the same density-scale-0 argument above. So each side's padding = `26px`.
   - `fab.js` line 45: medium `iconSize` = `var(--m3e-fab-medium-icon-size, var(--m3e-fab-icon-size, ${space350}))`; `space350` = `8*(350/100)px` = `28px` literal fallback (no override exists). This is applied as `font-size`/`--m3e-icon-size` on the shadow-owned `.icon` slot (`fab.js` line 74), inherited by whatever the consumer slots in.
   - `fab.js` line 15 (`FabStyle`): `::slotted(svg:not([slot])) { width: 1em; height: 1em; }`, plus `::slotted(:not([slot])) { font-size: inherit !important; flex: none; }`. A slotted `<svg>` with no `slot` attribute (exactly what `MDFab.vue`'s `icon` slot content becomes — a direct light-DOM child of `m3e-fab`, since Vue's `<slot name="icon" />` is compile-time content projection, not a real element) is therefore sized to `1em` × `1em` at the inherited `28px` font-size = `28px` × `28px`, and `flex: none` keeps it from growing/shrinking. This is a public, light-DOM-observable result of the renderer's documented default-slot/icon composition contract, not a private-shadow-DOM read: the test only calls `boundingBox()` on the consumer-supplied `<svg>` element itself, the same category of measurement as the host `m3e-fab` box.
   - Total content width = `26px + 28px + 26px = 80px`, matching the medium container's forced `80px` height exactly (square, as DESIGN.md's Geometry and layout table requires). No `min-width`/`aspect-ratio` rule exists in the renderer; the square shape emerges from this exact padding+icon arithmetic, which is why the dedicated `GeometryContract` fixture (real `28px`-square icon) is required — the other stories' bare "+" glyph has no fixed advance width and would not reliably reproduce `80px` container width.
   - This derivation is a static analysis of the installed renderer's compiled CSS and token chain, not a claim of local test execution. This sandbox cannot run the podman-backed `storybook-behavior` Playwright lane (see "Stage verification"); the new test's actual pass/fail is deferred to CI/architect, consistent with `docs/testing/architecture.md`'s CI-authoritative model.
   - The `md.sys.shape.corner.large-increased` (20dp) resolved-corner fact from the same DESIGN.md table is **not** asserted: it is applied as `border-radius` on the shadow-private `.base` div (`fab.js` line 74), not on the host `m3e-fab` element's own computed style — `getComputedStyle`/`boundingBox()` on the public host cannot observe it without inspecting private shadow DOM, which `src/shared/ui/material/AGENTS.md`'s "Renderer boundary" section forbids. `ARCHITECTURE.md`'s pass 6a and `## TEST IMPACT`/"Acceptance criteria" wording only requires the container height/width and icon-size assertions, not corner radius, so this is not a gap against the current contract.

7. `MDFab.stories.ts` was inspected directly; the five pre-existing exports (`Default`, `VisualStates`, `BehaviorContracts`, `HostAttributeBoundary`, `RealInteractionFeedback`) are unchanged; the new `GeometryContract` export is a browser-fixture-only story (no `visual` tag), matching `docs/testing/storybook.md`'s "dedicated named stories only for materially distinct compositions/states" rule — a real sized icon is materially distinct from every other story's bare-text icon.
8. `MDFab.visual.spec.ts` and its four colocated baseline PNGs were inspected directly; none reference `GeometryContract`, so no baseline is affected by this pass's story addition. Not re-executed in this sandbox (podman-backed `visual` lane unavailable); no visual-affecting production/story content changed for the five pre-existing stories.
9. This file — rewritten by this fresh pass per the current `material-component-implementation` skill's control-field and heading contract.

## Public API implemented

Unchanged from the prior pass; independently re-confirmed by direct source inspection of `MDFab.vue` (no edits made to it this pass).

Canonical export: `import { MDFab } from '@shared/ui/material';`

- Prop: `label: string` (required) — maps to the host `aria-label`.
- Slot: `icon` (required, no fallback content) — rendered into the renderer's default (unnamed) slot.
- Emit: `click(event: MouseEvent)` — forwarded unchanged.
- No `disabled` prop, no size/color prop, no link/form surface, no `lowered` elevation. `variant`/`size` remain adapter-owned private constants, never settable by a consumer.
- Root: one semantic `m3e-fab`; `inheritAttrs: false`; only `class`/`style` (merged), `id`, `title`, `data-*` reach the host.

## Tokens and renderer mappings

No `components/floatingActionButton/tokens.css` file and no `docs/token-api.md` change (confirmed by grep this pass — still no `fab`/`FAB` entry), matching `ARCHITECTURE.md`'s zero-token selection.

Renderer mapping unchanged from the prior pass's revalidation against `2.7.4` (see `REVIEW.md`'s independent re-confirmation of the same chain). This pass's own new contribution is the geometry-specific token-resolution trace recorded under "Implemented passes" pass 6a above: medium `containerHeight` (80px), `leadingSpace`/`trailingSpace` (26px each), `iconSize` (28px), and the `::slotted(svg:not([slot]))` 1em auto-sizing rule that makes a real slotted icon element's rendered box independently measurable from the public light DOM.

No new `M3E-*` renderer-defect record was required or added.

## Dependencies

Unchanged from the prior pass; independently re-confirmed by inspection this pass (no dependency-affecting edit was made).

- Material foundation: supplies `--md-sys-color-*`/`--md-sys-shape-*`/`--md-sys-elevation-*`/`--md-sys-state-*`/`--md-sys-density-*`/`--md-sys-measurement-*`, consumed by the renderer's `DesignToken` default-value system; not an official component-family dependency.
- `@m3e/web@2.7.4` (`@m3e/web/fab`): private renderer boundary.
- No canonical Material family is composed by the selected FAB default; dependency queue remains `none`.
- `FabContainer.vue`/`MDExtendedFab`/`RepoExplorerPane.vue`'s Extended FAB usage: untouched, out of scope.

## Component-owned proof

- `MDFab.test.ts` (12 tests, unchanged this pass): not re-executed this pass in isolation (no edit made to `MDFab.vue` or this file); whole-repo `pnpm verify --only type-check` passed, which type-checks this file.
- `config/vueCustomElements.test.ts`: unchanged, still asserts `isM3eCustomElement('m3e-fab')`.
- `MDFab.browser.spec.ts` (**4 tests**, one new this pass — the geometry test; the three pre-existing tests are unchanged): the new test's actual browser execution was **not run** in this sandbox (podman-backed `storybook-behavior` lane unavailable). `eslint`/`format`/`type-check` all pass against the new content (see "Stage verification").
- `MDFab.visual.spec.ts` (4 tests, unchanged, no new baseline needed): not re-executed in this sandbox; no visual-affecting content changed for the stories it references.
- `MDFab.stories.ts` (**6 exports**, one new this pass — `GeometryContract`): `pnpm storybook:build` passed against the changed file (see "Stage verification"), confirming the new story is buildable/valid Storybook configuration. This proves configuration/module integrity only, not the new browser test's runtime pass/fail.

Operator visual status: no-reported-defect. Automated proof does not claim subjective Material or renderer-motion acceptance.

## Stage verification

- `pnpm verify --only type-check` — passed (whole-repo scope; includes this pass's changed files).
- `pnpm verify --only eslint --files src/shared/ui/material/components/floatingActionButton/MDFab.stories.ts src/shared/ui/material/components/floatingActionButton/MDFab.browser.spec.ts` — passed.
- `pnpm verify --only format --files src/shared/ui/material/components/floatingActionButton/MDFab.stories.ts src/shared/ui/material/components/floatingActionButton/MDFab.browser.spec.ts` — passed.
- `pnpm verify --only storybook-build --files src/shared/ui/material/components/floatingActionButton/MDFab.stories.ts` — passed (`pnpm storybook:build`, confirms the new `GeometryContract` story is valid, buildable Storybook configuration).
- `pnpm verify --only storybook-behavior --files MDFab.vue MDFab.stories.ts MDFab.browser.spec.ts` and `pnpm verify --only visual --files MDFab.vue MDFab.stories.ts MDFab.visual.spec.ts` were **not run**: this sandbox cannot execute podman-backed Playwright browser/visual lanes. This means the new geometry test's actual pass/fail against a real rendered browser has **not** been locally confirmed — only its static derivation (see "Implemented passes" pass 6a) and its type-check/lint/format/storybook-build validity have been. This is recorded honestly as "not run in this sandbox," not as "passed." Per `src/shared/ui/material/AGENTS.md` and `docs/testing/architecture.md`'s CI-authoritative model, exact-head GitHub CI runs both lanes on the PR; if the new test's derived pixel values prove wrong against a real browser, that is a current-stage defect CI will surface and this family must correct in a follow-up implementation pass, not a blocker to recording this pass's own honest status.
- `pnpm storybook:build` beyond the focused `storybook-build` check above was not separately rerun.

This implementation stage did not run migration, independent review, or the outer workflow's final verification gate.

## Architecture deviations

None. The new `GeometryContract` story and geometry test implement exactly `ARCHITECTURE.md` pass 6a and the corresponding `## TEST IMPACT`/"Acceptance criteria" entries: container height/width numeric proof (required, added) and icon-size numeric proof (required with an escape hatch if unmeasurable; this pass found a genuinely measurable public icon box exists once a real sized icon element is used, and asserted it — the escape hatch was not needed). Corner-radius (20dp) is correctly not asserted, as `ARCHITECTURE.md`'s own concrete requirement wording does not include it (see pass 6a above for why it is not independently measurable through the public boundary in any case). Every other pass matches `ARCHITECTURE.md` exactly, unchanged from the prior implementation pass.

## Remaining blockers

None.

## Migration readiness

Ready. Runtime, private typing, renderer registration, exports, and every focused stage verification listed above pass and match `ARCHITECTURE.md`. The new geometry test's real-browser execution is deferred to CI (see "Stage verification"), which is ordinary post-implementation verification sequencing per `docs/testing/architecture.md`, not an open migration blocker. Per `ARCHITECTURE.md`'s "Migration plan", the legacy plain `MDFab` remains removed with zero product consumers; the explicit no-consumer library-only-default record remains migration-stage work to reconfirm, not repeat. `RepoExplorerPane.vue`'s Extended FAB usage is unaffected and untouched.
