# Floating action button implementation

Status: complete
ARCHITECTURE.md reference: `src/shared/ui/material/components/floatingActionButton/ARCHITECTURE.md`
Revision summary: Fresh implementation pass over the current `ARCHITECTURE.md`. No production, test, story, or export edit was required: `MDFab.vue`, its exports, and its complete component/browser/visual/story proof already match every current-architecture contract. This pass's own contribution is the required renderer-version revalidation — the zero-token resolution chain and the renderer mapping table were re-confirmed by direct installed-artifact inspection against the now-installed `@m3e/web@2.7.4` (previously only directly confirmed against `2.6.3`) — and it found no behavioral or contract drift.
Remaining blockers: none
Required return family: none
Required return stage: none
Architecture deviations: none
Migration readiness: ready

## Implemented passes

All nine `ARCHITECTURE.md` "Implementation passes" were re-run as revalidation; none required a production edit.

1. Confirmed `MDFab.vue` still imports `M3eFabElement`'s exported `FabSize`/`FabVariant` types (aliased `RendererFabSize`/`RendererFabVariant`) from `@m3e/web/fab`, plus the explicit `import '@m3e/web/fab';` side-effect import. `m3e-fab` remains registered in `config/vueCustomElements.ts` (confirmed by direct grep) and covered by `config/vueCustomElements.test.ts` (`expect(isM3eCustomElement('m3e-fab')).toBe(true)`). `components/floatingActionButton/index.ts` re-exports `MDFab`, and the root `src/shared/ui/material/index.ts` barrel re-exports it unchanged (`export { MDFab } from './components/floatingActionButton/index';`). One semantic `m3e-fab` host, no wrapper element.
2. Confirmed the host-attribute boundary is unchanged: `defineOptions({ inheritAttrs: false })`, an explicit `getForwardedAttrs()` allow-listing only `id`/`title`/`data-*`, `class`/`style` merged separately in the template (`['md-fab', attrs.class]`, `:style="attrs.style"`) so the adapter-owned class always wins, and no `v-bind="$attrs"` anywhere in the file.
3. Confirmed the required `label` prop still maps to `:aria-label="props.label"`; the private constants remain `rendererVariant: RendererFabVariant = 'primary-container'` and `rendererSize: RendererFabSize = 'medium'`, bound as `:size="rendererSize"` `:variant="rendererVariant"` and never derived from `attrs`/props; the `icon` slot still renders into the renderer's default (unnamed) slot (`<slot name="icon" />` inside `m3e-fab`, mapped from `defineSlots<{ icon(): unknown }>()`); the renderer's `click` event is still forwarded unchanged via `@click="onClick"` → `emit('click', event)`; the DEV-mode empty-`icon`-slot warning (`onMounted` + `useSlots()`) is unchanged.
4. **Revalidated against the now-installed `@m3e/web@2.7.4`** (not carried forward from the prior `2.6.3` confirmation). `node_modules/@m3e/web/package.json` confirms the installed version is `2.7.4`. Direct inspection of the installed `2.7.4` artifacts:
   - `node_modules/@m3e/web/dist/src/fab/FabElement.d.ts` lines 362–376: `M3eFabElement.variant` still `@default "primary-container"`; `M3eFabElement.size` still `@default "medium"` — unchanged, matching the adapter's private constants exactly, so no drift in the "renderer's own default already matches" claim.
   - `node_modules/@m3e/web/dist/fab.js` line 325: the `primary-container` variant's `containerColor` still resolves `var(--m3e-primary-container-fab-container-color, var(--m3e-fab-container-color, ${DesignToken.color.primaryContainer}))`.
   - `node_modules/@m3e/web/dist/fab.js` line 323: `iconColor` resolves through `${DesignToken.color.onPrimaryContainer}`.
   - `node_modules/@m3e/web/dist/fab.js` line 327 / line 360: resting `containerElevation` still resolves through `${DesignToken.elevation.level3}`; hover `containerElevation` through `${DesignToken.elevation.level4}`.
   - `node_modules/@m3e/web/dist/fab.js` lines 358/373/388: hover/focus/pressed `stateLayerOpacity` still resolve through `${DesignToken.state.hoverStateLayerOpacity}` / `focusStateLayerOpacity` / `pressedStateLayerOpacity` respectively.
   - `node_modules/@m3e/web/dist/fab.js` line 47: the medium size's `shape` still resolves `var(--m3e-fab-medium-shape, var(--m3e-fab-shape, ${DesignToken.shape.corner.largeIncreased}))`.
   - `node_modules/@m3e/web/dist/core.js` independently confirms every one of those `DesignToken` members still resolves to a public `--md-sys-*` custom property with a literal Material-spec fallback: line 2213 `primaryContainer: var(--md-sys-color-primary-container, #EADDFF)`; line 2215 `onPrimaryContainer: var(--md-sys-color-on-primary-container, #4F378B)`; line 2347 `level3: var(--md-sys-elevation-level3, ...)`; line 2349 `level4: var(--md-sys-elevation-level4, ...)`; line 2585 `largeIncreased: var(--md-sys-shape-corner-large-increased, ...)`; lines 2598/2600/2602 `focus/hover/pressedStateLayerOpacity: var(--md-sys-state-*-state-layer-opacity, ...)`.
   - `src/shared/ui/material/foundation/theme.css` lines 70–71 declare `--md-sys-color-primary-container`/`--md-sys-color-on-primary-container`; `src/shared/ui/material/foundation/tokens.css` lines 19, 38, 41, 160, 167, 170 declare `--md-sys-shape-corner-large-increased`, `--md-sys-elevation-level3`, `--md-sys-elevation-level4`, `--md-sys-state-hover/focus/pressed-state-layer-opacity` — so the resolution chain remains complete end to end with no dangling fallback-only value.
   - **Result: no resolution gap.** The zero-`--md-comp-fab-*`-token decision remains current-version-confirmed against `2.7.4`; no return to architecture is required.
   - **Incidental observation, not a scenario-blocking divergence:** unlike every other `FabVariantToken` variant (which chain their variant-specific `--m3e-<variant>-fab-*` custom property to the documented generic `--m3e-fab-*` property before the literal `DesignToken` fallback, e.g. `primary`'s `iconColor` falls back through `var(--m3e-fab-icon-color, ...)`), the installed `2.7.4` `primary-container` variant's `labelTextColor`/`iconColor` entries (`fab.js` lines 321/323) chain the same `--m3e-primary-container-fab-label-text-color`/`--m3e-primary-container-fab-icon-color` property to itself twice instead of to the documented generic `--m3e-fab-label-text-color`/`--m3e-fab-icon-color` (documented `@cssprop ... (all variants)` on `FabElement.d.ts`). This means the documented "all variants" generic override would not reach the primary-container label/icon color specifically. It does not affect this family's selected contract: `ARCHITECTURE.md` selects zero public `--md-comp-fab-*` tokens and no `--m3e-fab-*` override is set anywhere in `MDFab.vue`, so the literal `DesignToken.color.onPrimaryContainer` fallback — independently confirmed correct above — is what actually resolves. Per `docs/m3e-defects.md`'s inclusion boundary ("deferred official surface with no selected scenario"), this does not meet the bar for a new `M3E-*` record: no current or default scenario relies on the generic override, and the default value it would have affected already resolves correctly through the unaffected literal fallback. Revisit only if a future scenario needs the generic `--m3e-fab-*` override to reach the primary-container variant specifically.
5. Reran `MDFab.test.ts` via `pnpm verify --only unit-tests --files src/shared/ui/material/components/floatingActionButton/MDFab.vue src/shared/ui/material/components/floatingActionButton/MDFab.test.ts src/shared/ui/material/components/floatingActionButton/index.ts`: all 12 tests pass, unchanged from the prior pass — props/defaults, required `label`, icon-slot rendering and DEV warning, host-attribute allow-list/rejection matrix, private-constant immutability, and `click` forwarding all still hold.
6. `MDFab.browser.spec.ts` (3 tests) was inspected directly and still covers accessible-name resolution, native click and Space/Enter keyboard activation each producing exactly one `click`, and host-attribute-boundary rejection at the actual rendered element across dynamic updates. This sandbox cannot run the podman-backed `storybook-behavior` Playwright lane (see [Stage verification](#stage-verification)); no production or spec content changed, so this is a re-inspection, not a claimed rerun.
7. `MDFab.stories.ts` was inspected directly and still covers exactly the selected single default (`Default`) plus `VisualStates`, `BehaviorContracts`, `HostAttributeBoundary`, and `RealInteractionFeedback` fixtures, matching `docs/testing/storybook.md` conventions. No size/color Controls matrix, since none is exposed.
8. `MDFab.visual.spec.ts` and its four colocated baseline PNGs were inspected directly (not re-generated): resting state plus real pointer-hover, real keyboard-focus, and real pointer-press screenshots remain present, matching the Button/Checkbox/Switch `RealInteractionFeedback` precedent. This sandbox cannot run the podman-backed `visual` Playwright lane (see [Stage verification](#stage-verification)); no baseline-affecting code changed in this pass, so no re-generation is required. The documented light/dark coverage gap (a repository-wide single-project visual-runner limitation, not FAB-specific) remains unchanged.
9. This file — rewritten per this pass's control-field and heading contract, replacing the prior version's stale `@m3e/web@2.6.3` renderer revision and "First implementation" framing with the current `2.7.4`-confirmed revalidation record.

## Public API implemented

Unchanged from the prior pass; independently re-confirmed by direct source inspection this pass.

Canonical export: `import { MDFab } from '@shared/ui/material';`

- Prop: `label: string` (required) — maps to the host `aria-label`; not rendered as visible text.
- Slot: `icon` (required, no fallback content) — rendered into the renderer's default (unnamed) slot.
- Emit: `click(event: MouseEvent)` — the renderer host's native click, forwarded unchanged.
- No `disabled` prop, no size/color prop, no link/form surface, no `lowered` elevation, no compatibility alias. `variant`/`size` are adapter-owned private constants (`"primary-container"`/`"medium"`), never settable by a consumer.
- Root: one semantic `m3e-fab`; `inheritAttrs: false`; no `v-bind="$attrs"` anywhere. Only `class`/`style` (merged with `md-fab`), `id`, `title`, and `data-*` reach the host.

## Tokens and renderer mappings

No `components/floatingActionButton/tokens.css` file and no `docs/token-api.md` change, matching `ARCHITECTURE.md`'s zero-token selection — unchanged, and now directly revalidated against `@m3e/web@2.7.4` (see [Implemented passes](#implemented-passes) pass 4).

Renderer mapping implemented exactly as `ARCHITECTURE.md`'s "Renderer mapping and gaps" table selects; every row was independently re-checked against the installed `2.7.4` artifact this pass:

- `variant="primary-container"` / `size="medium"` — adapter-owned private constants, typed against exported `FabVariant`/`FabSize`; these still match the renderer's own documented defaults (`M3eFabElement.variant`/`size` still default to the same values in `2.7.4`), confirmed directly from the installed `.d.ts`.
- Required icon → renderer's default (unnamed) slot, documented as "Renders the icon of the button."
- Required accessible label → global `aria-label` attribute reflection from `label`.
- Native click / Space / Enter activation → renderer's internal native button-equivalent semantics (`KeyboardClick` mixin composition, still present in the `2.7.4` `M3eFabElement_base` type intersection); no wrapper-owned keyboard handling.
- Disabled state → not mapped or forwarded (official guidance forbids disabling a FAB; no disabled token set is published).
- Extended anatomy, lowered elevation, link/form fields, other sizes/colors → not exposed, deliberately out of scope.
- Hover/focus/press state layer, elevation transitions, shape → renderer-owned, revalidated this pass against Mioframe's public foundation tokens (see [Implemented passes](#implemented-passes) pass 4).

No new `M3E-*` renderer-defect record was required. `docs/m3e-defects.md` records no FAB entry, and this pass's revalidation confirms no divergence meeting the registry's inclusion boundary for this family's selected contract (see the incidental non-blocking observation in pass 4 above, which does not meet that bar).

## Dependencies

Unchanged from the prior pass; independently re-confirmed.

- Material foundation: supplies `--md-sys-color-*`/`--md-sys-shape-*`/`--md-sys-elevation-*`/`--md-sys-state-*`, revalidated this pass to be consumed by the renderer's own `DesignToken` default-value system for the selected medium/primary-container default at `2.7.4`; not an official component-family dependency.
- `@m3e/web@2.7.4` (`@m3e/web/fab`, lockfile-resolved, confirmed via `node_modules/@m3e/web/package.json`): private renderer boundary; `M3eFabElement`/`FabVariant`/`FabSize` provide package-derived typing for the private constants.
- No canonical Material family (Button, Loading Indicator, Checkbox, Switch) is composed by the selected FAB default — matches `ARCHITECTURE.md`'s "Dependency closure": dependency queue is `none`.
- `FabContainer.vue` and `MDExtendedFab`/`RepoExplorerPane.vue`'s Extended FAB usage are untouched — out of this family's scope.

## Component-owned proof

- `MDFab.test.ts` (12 tests): reran this pass via `pnpm verify --only unit-tests`; all pass, unchanged in content and coverage from the prior implementation.
- `config/vueCustomElements.test.ts`: independently re-confirmed by direct grep to still assert `isM3eCustomElement('m3e-fab')`.
- `MDFab.browser.spec.ts` (3 tests; owner-local, per `docs/testing/migration-plan.md`'s current owner-local authorization for a new Material family): inspected directly this pass; content unchanged from the prior implementation. Not re-executed in this sandbox — this sandbox cannot run podman-backed Playwright lanes and no production or spec content changed that would require re-execution for feedback.
- `MDFab.visual.spec.ts` (4 tests; owner-local, colocated `MDFab.visual.spec.ts-snapshots/`): inspected directly this pass, baselines present and unchanged. Not re-executed in this sandbox for the same reason.
- `MDFab.stories.ts`: inspected directly this pass; five story exports unchanged from the prior implementation.

Operator visual status: no-reported-defect. Automated proof does not claim subjective Material or renderer-motion acceptance.

## Stage verification

- `pnpm verify --only type-check` — passed.
- `pnpm verify --only unit-tests --files src/shared/ui/material/components/floatingActionButton/MDFab.vue src/shared/ui/material/components/floatingActionButton/MDFab.test.ts src/shared/ui/material/components/floatingActionButton/index.ts` — passed (12/12).
- `pnpm verify --only storybook-behavior --files MDFab.vue MDFab.stories.ts MDFab.browser.spec.ts` and `pnpm verify --only visual --files MDFab.vue MDFab.stories.ts MDFab.visual.spec.ts` were **not run** in this sandbox: this environment cannot execute podman-backed Playwright browser/visual lanes (per repository operating constraint, such checks must be requested from the user/architect via a podman-capable environment rather than attempted here). No production, test, story, or CSS content changed in this pass that would alter their outcome; both lanes previously passed against this exact unchanged content per `REVIEW.md`. This is recorded honestly as "not run in this sandbox," not as "passed," and is not treated as a blocker: per `src/shared/ui/material/AGENTS.md`, "Final workflow verification readiness... does not mean a local broad verifier command has run," and exact-head GitHub CI runs both lanes on the PR.
- `pnpm storybook:build` was not rerun this pass; no story content changed.

This implementation stage did not run migration, independent review, or the outer workflow's final verification gate.

## Architecture deviations

None. Every implemented/revalidated pass matches `ARCHITECTURE.md` exactly: the medium/primary-container private constants, the required `label`/`icon` contract, the host-attribute allow-list, the zero-token selection (now directly re-confirmed against `2.7.4`, not merely carried forward from `2.6.3`), the owner-local browser/visual proof placement, and the deferred/forbidden surface (no `disabled`, no `lowered`, no Extended anatomy, no link/form fields, no non-default size/color).

## Remaining blockers

None.

## Migration readiness

Ready. Runtime, private typing, renderer registration, exports, and every focused stage verification listed above pass and match `ARCHITECTURE.md`. The renderer-version-drift risk `ARCHITECTURE.md` recorded (confirmation only against `2.6.3`) is resolved by this pass's direct `2.7.4` revalidation, which found no behavioral or contract drift. Per `ARCHITECTURE.md`'s "Migration plan", the legacy plain `MDFab` remains removed with zero product consumers; the explicit no-consumer library-only-default record remains migration-stage work to reconfirm, not repeat. No product consumer of the plain FAB exists; `RepoExplorerPane.vue`'s Extended FAB usage is unaffected and untouched by this stage.
