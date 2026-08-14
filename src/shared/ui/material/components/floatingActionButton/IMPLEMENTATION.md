# Floating action button implementation

Status: complete
ARCHITECTURE.md reference: `src/shared/ui/material/components/floatingActionButton/ARCHITECTURE.md`
Revision summary: First implementation of the canonical `MDFab` family — a single-host adapter over `m3e-fab` fixed at the medium/primary-container default, with the required `label`/`icon` contract, host-attribute boundary, renderer registration, and full component/browser/visual/story proof. No public `--md-comp-fab-*` token is added; installed-artifact inspection confirms the renderer's default color, shape, elevation, and state-layer opacity all resolve from Mioframe's public `--md-sys-*` foundation tokens.
Remaining blockers: none
Required return family: none
Required return stage: none
Architecture deviations: none
Migration readiness: ready

## Implemented passes

All nine `ARCHITECTURE.md` "Implementation passes" are complete:

1. Created `MDFab.vue`, importing `M3eFabElement`'s exported `FabSize`/`FabVariant` types from `@m3e/web/fab` for private typed constants, plus an explicit `import '@m3e/web/fab';` side-effect import (neither type is used as a runtime value, unlike Switch/Checkbox, so the renderer module must be imported explicitly, matching Button's precedent). Registered `m3e-fab` in `config/vueCustomElements.ts` and its test. Added `components/floatingActionButton/index.ts` and the root `@shared/ui/material` barrel export. One semantic `m3e-fab` host, no wrapper element.
2. Host-attribute boundary: `inheritAttrs: false`, explicit `getForwardedAttrs()` allow-listing only `id`, `title`, and `data-*` (plus separately merged `class`/`style`); every other attribute/listener (`disabled`, `disabled-interactive`, `variant`, `size`, `lowered`, `extended`, `href`/`download`/`target`/`rel`, `name`/`value`/`type`, and undeclared listeners such as `beforeinput`) is dropped.
3. Mapped required `label` prop directly to the host `aria-label`; set adapter-owned private constants `variant: RendererFabVariant = 'primary-container'` and `size: RendererFabSize = 'medium'` (typed against the exported renderer unions so a renderer rename fails type-check); rendered the `icon` slot into the renderer's default (unnamed) slot; forwarded `click` unchanged. Added a DEV-mode `onMounted` + `useSlots()` warning when the `icon` slot is empty, mirroring the legacy `MDFab`'s existing warning convention (using `useSlots()`, not the `defineSlots()` return, because `defineSlots()`'s typed return is non-optional and triggers `@typescript-eslint/no-unnecessary-condition` on a truthiness check).
4. Confirmed by direct installed-artifact inspection of `@m3e/web@2.6.3`'s compiled `core.js`/`fab.js` (not by analogy): `ColorToken.primaryContainer` → `var(--md-sys-color-primary-container, ...)`; `ShapeToken.corner.largeIncreased` (medium FAB shape) → `var(--md-sys-shape-corner-large-increased, ...)`; `ElevationToken.level3`/`level4` → `var(--md-sys-elevation-level3/4, ...)`; `StateToken.hover/focus/pressedStateLayerOpacity` → `var(--md-sys-state-*-state-layer-opacity, ...)`. All four already-public Mioframe foundation tokens are consumed directly with literal Material-spec fallbacks — no resolution gap, so no family `tokens.css` or `docs/token-api.md` change was needed.
5. Wrote `MDFab.test.ts`: renderer-constant immutability, `label` → `aria-label`, icon-slot rendering (into the renderer's unnamed default slot, no `slot` attribute), DEV-mode empty-slot warning (present/absent), `click` forwarding, and the complete host-attribute allow-list/rejection matrix (including reactive add/remove/re-add and rejection of `disabled`/`disabled-interactive`/`lowered`/`extended`/link/form attributes/`variant`/`size`/an unknown attribute/an undeclared listener).
6. Wrote owner-local `MDFab.browser.spec.ts`: accessible-name resolution from `label`, native click, Space and Enter keyboard activation each producing exactly one `click`, and host-attribute-boundary rejection at the actual rendered element (reactive across dynamic updates).
7. Added `MDFab.stories.ts` covering exactly the selected single default (`Default`, args-driven with `label` + `icon` slot template), plus `VisualStates`, `BehaviorContracts`, `HostAttributeBoundary`, and `RealInteractionFeedback` fixtures. No size/color Controls matrix, since none is exposed.
8. Added owner-local `MDFab.visual.spec.ts` with colocated `MDFab.visual.spec.ts-snapshots/`: resting state (`md-fab-states.png`) plus real pointer-hover, real keyboard-focus, and real pointer-press screenshots (`md-fab-hover.png`, `md-fab-focus.png`, `md-fab-pressed.png`), matching the Button/Checkbox/Switch `RealInteractionFeedback` precedent. Light/dark coverage was not added: the current `playwright.visual.config.ts` runs one fixed `colorScheme: 'light'` desktop-Chrome project only (no dark/mobile/theme projects exist yet for any current family, including Button/Checkbox/Switch), so per `ARCHITECTURE.md` pass 8 this documents the gap rather than fabricating unsupported coverage; it is a repository-wide visual-runner gap, not FAB-specific.
9. This file.

## Public API implemented

Canonical export: `import { MDFab } from '@shared/ui/material';`

- Prop: `label: string` (required) — maps to the host `aria-label`; not rendered as visible text.
- Slot: `icon` (required, no fallback content) — rendered into the renderer's default (unnamed) slot.
- Emit: `click(event: MouseEvent)` — the renderer host's native click, forwarded unchanged.
- No `disabled` prop, no size/color prop, no link/form surface, no `lowered` elevation, no compatibility alias. `variant`/`size` are adapter-owned private constants (`"primary-container"`/`"medium"`), never settable by a consumer.
- Root: one semantic `m3e-fab`; `inheritAttrs: false`; no `v-bind="$attrs"` anywhere. Only `class`/`style` (merged with `md-fab`), `id`, `title`, and `data-*` reach the host.

## Tokens and renderer mappings

No `components/floatingActionButton/tokens.css` file and no `docs/token-api.md` change, matching `ARCHITECTURE.md`'s zero-token selection.

Renderer mapping implemented exactly as `ARCHITECTURE.md`'s "Renderer mapping and gaps" table selects:

- `variant="primary-container"` / `size="medium"` — adapter-owned private constants, typed against exported `FabVariant`/`FabSize`; these already match the renderer's own documented defaults (`M3eFabElement.variant`/`size` default to the same values), confirmed directly from the installed `.d.ts`.
- Required icon → renderer's default (unnamed) slot, documented as "Renders the icon of the button."
- Required accessible label → global `aria-label` attribute reflection from `label`.
- Native click / Space / Enter activation → renderer's internal native button-equivalent semantics (`KeyboardClick` mixin composition); no wrapper-owned keyboard handling.
- Disabled state → not mapped or forwarded (official guidance forbids disabling a FAB; no disabled token set is published).
- Extended anatomy, lowered elevation, link/form fields, other sizes/colors → not exposed, deliberately out of scope.
- Hover/focus/press state layer, elevation transitions, shape → renderer-owned, confirmed against Mioframe's public foundation tokens (see "Implemented passes" #4) and directly observed correct in the accepted visual baselines.

No new `M3E-*` renderer-defect record was required; no divergence from documented renderer behavior was observed during implementation.

## Dependencies

- Material foundation: supplies `--md-sys-color-*`/`--md-sys-shape-*`/`--md-sys-elevation-*`/`--md-sys-state-*`, confirmed by direct installed-artifact inspection to be consumed by the renderer's own `DesignToken` default-value system for the selected medium/primary-container default; not an official component-family dependency.
- `@m3e/web@2.6.3` (`@m3e/web/fab`): private renderer boundary; `M3eFabElement`/`FabVariant`/`FabSize` provide package-derived typing for the private constants.
- No canonical Material family (Button, Loading Indicator, Checkbox, Switch) is composed by the selected FAB default — matches `ARCHITECTURE.md`'s "Dependency closure": dependency queue is `none`.
- `FabContainer.vue` and `MDExtendedFab`/`RepoExplorerPane.vue`'s Extended FAB usage are untouched — out of this family's scope.

## Component-owned proof

- `MDFab.test.ts` (12 tests, passing): renderer-constant immutability; `label` → `aria-label`; icon-slot rendering into the renderer's unnamed default slot; DEV-mode empty-slot warning present/absent; `click` forwarding; host-attribute allow-list (`class`/`style`/`id`/`title`/`data-*`, merged not replaced, reactive across add/remove/re-add); rejection of `disabled`/`disabled-interactive`/`lowered`/`extended`/link/form attributes/`variant`/`size`/an unknown attribute/an undeclared listener, including under dynamic updates.
- `config/vueCustomElements.test.ts` / `eslint.config.test.ts`: extended with `m3e-fab` alongside the existing selected-element coverage.
- `MDFab.browser.spec.ts` (3 tests, passing; owner-local, per `docs/testing/migration-plan.md`'s current owner-local authorization for a new Material family): accessible-name resolution and native click; Space/Enter keyboard activation each producing exactly one `click`; host-attribute-boundary rejection at the actual rendered element across dynamic updates.
- `MDFab.visual.spec.ts` (4 tests, passing; owner-local, colocated `MDFab.visual.spec.ts-snapshots/`): resting medium/primary-container appearance, plus real pointer-hover, real keyboard-focus, and real pointer-press screenshots. All four baselines were generated with `pnpm test:visual:update` and visually inspected (correct rounded-square medium shape, primary-container purple fill, "+" icon, elevation shadow, and distinct hover/focus/pressed state-layer feedback) before acceptance.
- `pnpm storybook:build` confirms the new story catalogue builds.

Operator visual status: no-reported-defect. Automated proof does not claim subjective Material or renderer-motion acceptance.

## Stage verification

- `pnpm verify --only type-check` — passed.
- `pnpm verify --only unit-tests --files <all touched runtime/test files>` — passed (17/17 across `config/vueCustomElements.test.ts` and `MDFab.test.ts`, then 12/12 rerun for `MDFab.test.ts` alone after the slot-typing fix).
- `pnpm verify --only eslint --files <all touched files>` — first run failed (`@typescript-eslint/no-unnecessary-condition` on the `defineSlots()`-typed empty-slot check); fixed by reading the empty-slot check from `useSlots()` instead of the `defineSlots()` macro return; rerun passed.
- `pnpm verify --only format --files <all touched files>` — first run failed (long-line wrapping in the new browser/visual specs); `pnpm verify --fix-only --files MDFab.browser.spec.ts MDFab.visual.spec.ts` applied the safe automatic wrap (inspected: whitespace-only); rerun passed.
- `pnpm verify --only storybook-build --files MDFab.stories.ts` — passed.
- `pnpm verify --only storybook-behavior --files MDFab.vue MDFab.stories.ts MDFab.browser.spec.ts` — passed (3/3).
- `pnpm test:visual:update src/shared/ui/material/components/floatingActionButton/MDFab.visual.spec.ts` — generated the four new baselines (first run for a new spec always starts with no baseline); inspected each accepted PNG before continuing.
- `pnpm verify --only visual --files MDFab.vue MDFab.stories.ts MDFab.visual.spec.ts` — passed (4/4) against the newly accepted baselines.

This implementation stage did not run migration, independent review, or the outer workflow's final verification gate.

## Architecture deviations

None. Every implemented pass matches `ARCHITECTURE.md` exactly: the medium/primary-container private constants, the required `label`/`icon` contract, the host-attribute allow-list, the zero-token selection (confirmed by direct artifact inspection rather than assumed by analogy), the owner-local browser/visual proof placement, and the deferred/forbidden surface (no `disabled`, no `lowered`, no Extended anatomy, no link/form fields, no non-default size/color).

## Remaining blockers

None.

## Migration readiness

Ready. Runtime, private typing, renderer registration, exports, and every focused stage verification listed above pass and match `ARCHITECTURE.md`. Per `ARCHITECTURE.md`'s "Migration plan", the legacy plain `MDFab` (`src/shared/ui/Button/MDFab.vue`, `.test.ts`, `.stories.ts`) remains dead legacy ownership with zero product consumers, and the explicit no-consumer library-only-default record required by `TEST IMPACT` remains exclusively migration-stage work, along with the legacy-removal audit of `LegacyButton.browser.spec.ts`'s Stage S2-D historical record. No product consumer of the plain FAB exists; `RepoExplorerPane.vue`'s Extended FAB usage is unaffected and untouched by this stage.
