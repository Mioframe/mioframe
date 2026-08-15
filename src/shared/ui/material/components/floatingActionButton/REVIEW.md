# Floating action button review

Verdict: compliant-with-listed-risks
Required return family: none
Required return stage: none
Completion status: complete
Final workflow verification readiness: ready
Operator visual status: no-reported-defect
Blockers: none
Major issues: none
Minor issues: none
Accepted risks: The podman-backed `storybook-behavior` (`MDFab.browser.spec.ts`, including this invocation's new geometry test) and `visual` (`MDFab.visual.spec.ts`) Playwright lanes could not be executed in this review sandbox. This review independently re-derived the new geometry test's correctness from first principles rather than trusting any prior pass's claim (see "Implementation compliance"): direct inspection of the installed `@m3e/web@2.7.4` `node_modules/@m3e/web/dist/fab.js` render() output confirms the default slot is rendered as `<slot class="icon" aria-hidden="true" ...>` directly (not wrapped), that `fabStyle("medium")` sets `.base { min-height: 80px }` (density scale confirmed 0, no project override), medium `leadingSpace`/`trailingSpace` resolve to exactly `26px` each (`space325`, no override), and medium `iconSize` resolves to exactly `28px` (`space350`, no override) applied as `font-size`/`--m3e-icon-size` on the `.icon` slot itself, which a slotted `<svg>` without a `slot` attribute inherits via the shadow stylesheet's `::slotted(:not([slot])){font-size:inherit!important}` + `::slotted(svg:not([slot])){width:1em;height:1em}` rules — a publicly observable light-DOM measurement, not a shadow-DOM inspection. `playwright.storybook.config.ts` pins `deviceScaleFactor: 1` with no Storybook preview zoom/transform found, so 1dp = 1 rendered px holds. Independently reran `pnpm verify --only type-check`, `--only unit-tests`, and `--only storybook-build` against every touched file in this sandbox — all passed. Only the real-browser execution of the new geometry assertions themselves (and the four unchanged visual baselines) remains unrun here; this is recorded honestly as "not run in this sandbox," not "passed," and is deferred to exact-head GitHub CI. Given the exact numeric agreement between DESIGN.md's official medium-FAB geometry (80dp container, 28dp icon) and every value independently traced through the installed renderer's actual compiled CSS/token chain, this is assessed as genuinely low, bounded risk, not a coverage gap.

## Goal and scenarios reviewed

Reviewed the complete current family: the single selected no-consumer default scenario — a medium-size, primary-container-color `MDFab` rendering exactly one required icon (via the `icon` slot), a required accessible action label (`label` prop mapped to host `aria-label`), and native click/keyboard (Space/Enter) activation — plus the confirmed absence of any product consumer of the plain FAB and the confirmed unaffected `RepoExplorerPane.vue` Extended FAB usage. This pass additionally focused on independently verifying the one outstanding defect a prior independent review found: `ARCHITECTURE.md`'s `TEST IMPACT` previously omitted required browser-level numeric geometry proof for the selected default's fixed official medium-FAB geometry (80dp container, 28dp icon, `corner.large-increased` 20dp), and whether the architecture correction plus the resulting implementation-stage geometry test genuinely close that gap.

## Official design compliance

`DESIGN.md` remains a complete, source-cited normalization of the official FAB overview/specs/guidelines/accessibility routes plus the full FAB token resource. Its "Geometry and layout" table (medium: 80dp container, 28dp icon, `corner.large-increased` 20dp) is unchanged and is the basis for both the selected default and the geometry-proof requirement reviewed below. No factual error was found; it was not due for refresh and none was performed.

## Architecture compliance

`ARCHITECTURE.md`'s selected default, non-goals, dependency closure (`none`), host-attribute boundary, and zero-token decision are unchanged from the prior successful review and remain correctly derived from current `DESIGN.md`. The correction this pass verifies: `ARCHITECTURE.md` now contains a dedicated `TEST IMPACT` entry ("official medium FAB fixed geometry for the selected default") requiring a new browser-level numeric assertion in `MDFab.browser.spec.ts` against the rendered `m3e-fab` host and its rendered icon, a new "Implementation passes" step 6a with the exact required assertions, and a matching "Acceptance criteria" line. This entry correctly does not require asserting the 20dp corner radius; independent inspection of `node_modules/@m3e/web/dist/fab.js` confirms `border-radius` from `fabStyle()` is applied to `:host([size="medium"]) .base`, and `.base` is a shadow-private `<div>` (confirmed at the `render()` template, `<div class="base">...`), not observable on the public `m3e-fab` host's own computed style without private shadow-DOM inspection — which `src/shared/ui/material/AGENTS.md`'s "Renderer boundary" section forbids. The correction is the smallest complete fix: no public API, token, or renderer-mapping change is implied or made.

## Implementation compliance

`MDFab.vue`, `MDFab.test.ts` (12 tests, unchanged), `MDFab.browser.spec.ts` (4 tests — 3 unchanged, 1 new), `MDFab.visual.spec.ts` (4 tests + baselines, unchanged), `MDFab.stories.ts` (6 exports — 5 unchanged, 1 new `GeometryContract`), `components/floatingActionButton/index.ts`, the root `src/shared/ui/material/index.ts` barrel (confirms `export { MDFab } from './components/floatingActionButton/index'`), `src/shared/ui/material/m3eFab.d.ts`, and `config/vueCustomElements.ts`/`.test.ts` (repo-root `config/`, not under `material/` — `isM3eCustomElement('m3e-fab')` asserted `true`) were read directly and match every architecture-selected item. `MDFab.vue` is unchanged from the previously-reviewed compliant implementation.

**Independent re-derivation of the new geometry test**, not trusting `IMPLEMENTATION.md`'s prose:

- `node_modules/@m3e/web/package.json` confirms `"version": "2.7.4"` (unchanged, matches `ARCHITECTURE.md`'s recorded renderer revision).
- `M3eFabElement`'s `render()` (`fab.js`, the `html\`...\``literal) emits the default slot as`<slot class="icon" aria-hidden="true" @slotchange="...">`directly — not wrapped in an intermediate element — and its class-level JSDoc documents`@slot - Renders the icon of the button.`as the default slot, confirming the architecture's`direct` icon-slot mapping.
- `fabStyle("medium")` sets `:host([size="medium"]) .base { min-height: ${FabSizeToken.medium.containerHeight}; }`, where `containerHeight = calc(var(--m3e-fab-medium-container-height, var(--m3e-fab-container-height, 80px)) + DesignToken.density.calc(-3))`. `DensityToken.scale` defaults to `var(--md-sys-density-scale, 0)`; a repository-wide grep confirms no `--md-sys-density-scale` or `--m3e-fab(-medium)-container-height` override exists under `src`, so `density.calc(-3) = max(-3,0)*4px = 0px` and the height resolves to exactly `80px`.
- `fabStyle("medium")` sets `.wrapper` `padding-inline-start`/`-end` to `FabSizeToken.medium.leadingSpace`/`trailingSpace` = `calc(var(--m3e-fab-medium-leading-space, var(--m3e-fab-leading-space, space325)) + density.calcHalf(-3))`. `core.js`'s `space(unit)` helper confirms `space325 = 8*(325/100)px = 26px` literal fallback (`var(--md-sys-measurement-space325, 26px)`, no override found), and `density.calcHalf(-3) = 0px` by the same argument, so each side is exactly `26px`.
- The same rule sets `.icon { font-size: ${FabSizeToken.medium.iconSize}; --m3e-icon-size: ...; }`, where `iconSize = var(--m3e-fab-medium-icon-size, var(--m3e-fab-icon-size, space350))` and `space350 = 8*(350/100)px = 28px` (no override found). Because `.icon` **is** the `<slot>` element itself, and shadow-DOM CSS inheritance for slotted content follows the flattened tree, a slotted node without a `slot` attribute inherits this `28px` font-size via `FabStyle`'s `::slotted(:not([slot])) { font-size: inherit !important; flex: none; }`, and is then boxed to `1em × 1em` via `::slotted(svg:not([slot])) { width: 1em; height: 1em; }` — i.e. `28px × 28px`. This is a public light-DOM measurement of the consumer-supplied `<svg>` element itself, not a private shadow-DOM read.
- `26px + 28px + 26px = 80px`, matching the forced `80px` container height exactly — the square shape is an emergent, correctly-derived result of this exact padding/icon arithmetic, not asserted by fiat.
- `M3eFabElement.variant`/`.size` default to `"primary-container"`/`"medium"` (confirmed at `fab.js`'s constructor field initializers), matching `MDFab.vue`'s explicit private constants.
- `MDFab.stories.ts`'s new `GeometryContract` story supplies a real `<svg viewBox="0 0 24 24">` (not the other stories' bare `+` text, which has no fixed advance width) as `icon`-slot content, with `data-testid="geometry-fab"` on `MDFab` (reaching the host via the existing `data-*` allow-list) and `data-testid="geometry-fab-icon"` directly on the `<svg>`. `MDFab.browser.spec.ts`'s new test asserts `boundingBox()` on both testids against `{width:80,height:80}` and `{width:28,height:28}` respectively — an exact match to the derivation above and to `DESIGN.md`'s official values. `playwright.storybook.config.ts` pins `deviceScaleFactor: 1`; no zoom/transform scaling was found under `.storybook`, so 1dp = 1 rendered CSS px holds and no unit-conversion error is introduced.
- Corner radius (20dp) is correctly not asserted — see "Architecture compliance" above.

This derivation is independently sound and not a mere restatement of `IMPLEMENTATION.md`'s prose; every cited line/value was re-opened and re-computed from the installed artifact and project source during this review.

**Local re-execution** (this review's own focused checks, since the podman-backed browser/visual lanes are unavailable in this sandbox): `pnpm verify --only type-check --files MDFab.vue MDFab.stories.ts MDFab.browser.spec.ts MDFab.test.ts` passed; `pnpm verify --only unit-tests --files MDFab.vue MDFab.test.ts` passed (12/12 `MDFab.test.ts` tests); `pnpm verify --only storybook-build --files MDFab.stories.ts` passed (confirms the new `GeometryContract` story is valid, buildable Storybook configuration). The new browser test's actual real-browser pass/fail was not executed here (see Accepted risks).

## Migration and legacy removal

Independently repeated this pass: `src/shared/ui/material/index.ts` exports `MDFab`; `src/shared/ui/Button/index.ts`-referenced doc-comment in `FabContainer.vue` (line 22, illustrative prose only, not an import); a direct grep of `tests/e2e/storybook/focusIndicator.spec.ts` and `tests/e2e/visual/shared-ui/md-fab-family.spec.ts` for `MDFab` returns zero matches, confirming the legacy plain `MDFab` and its cross-owner proof remain fully removed with no reintroduced reference. `RepoExplorerPane.vue`'s Extended FAB usage is unaffected (not touched by this or any prior pass in this family). No product-layer consumer of the canonical `MDFab` exists.

## Proof and stage verification

Component-contract proof (`MDFab.test.ts`, 12 tests, independently re-executed and passing) and owner-local browser/visual proof (`MDFab.browser.spec.ts` 4 tests, `MDFab.visual.spec.ts` 4 tests) were read in full and correctly cover every selected contract, including — as of this pass — the previously-missing numeric geometry assertion. Proof placement (owner-local `src/shared/ui/material/components/floatingActionButton/`) matches `docs/testing/migration-plan.md`'s authorization for a canonical Material family to establish final owner-local Storybook browser/visual ownership directly in its own migration workflow.

## Blockers

None.

## Major issues

None. The prior review's sole major issue — `ARCHITECTURE.md`'s `TEST IMPACT` omitting required numeric browser-level geometry proof — is resolved: architecture now requires it, and implementation added a correctly-derived, correctly-scoped test and story fixture (see "Implementation compliance").

## Minor issues

None.

## Accepted risks

See the control-field summary above (podman-backed `storybook-behavior`/`visual` lanes, including this invocation's new geometry test, not executable in this review sandbox; independently re-derived as numerically sound from direct installed-artifact and project-source inspection and deferred to exact-head CI).

## Items not required

- Numeric geometry proof for any non-selected size/color (FAB regular, large, small-deprecated, or any non-primary-container color) — none of these are selected by `ARCHITECTURE.md`.
- Numeric proof of the 20dp corner radius — not observable at the public boundary without private shadow-DOM inspection (see "Architecture compliance"); correctly excluded from both `ARCHITECTURE.md`'s requirement and the implemented test.
- Extended FAB / FAB menu proof — explicitly out of this family's scope.
- Tooltip-on-hover/focus proof — deferred pending a canonical Material Tooltip family.
- Light/dark visual coverage — a documented repository-wide single-project visual-runner limitation, not FAB-specific.
- A component token catalogue (`components/floatingActionButton/tokens.css`) or `docs/token-api.md` entry — correctly absent; the zero-token decision remains current-version-confirmed and unchanged this pass.

## Routing evidence

No route. `ARCHITECTURE.md`, `IMPLEMENTATION.md`, and `MIGRATION.md` are current, complete, and mutually consistent; the sole defect the prior independent review found is closed with a correctly-scoped, independently re-derived, sound geometry proof. The family is ready for architect-owned PR creation and exact-head GitHub CI.
