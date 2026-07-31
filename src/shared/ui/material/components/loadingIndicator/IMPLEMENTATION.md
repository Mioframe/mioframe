# Loading indicator implementation

Status: complete
DESIGN.md reference: `./DESIGN.md` (`Status: current`, design document date 2026-07-30)
ARCHITECTURE.md reference: `./ARCHITECTURE.md` (`Status: ready`, architecture date 2026-07-31, host-attribute boundary correction)
Implementation workspace state: canonical Loading Indicator runtime, token, exports, renderer integration, component proof, and Button composition inspected. This pass corrects the host-attribute allow-list projection mechanism from a cached `computed()` to a render-time function; the host-attribute boundary itself (allow-list content, `inheritAttrs: false`) is unchanged from the prior correction.

## Implemented passes

1. Audited `MDLoadingIndicator.vue`, family export, root Material export, Vue custom-element selection, and package-derived renderer declaration against the ready architecture; no mismatch outside the projection mechanism was found.
2. `defineOptions({ inheritAttrs: false })` and forwarding of exactly the accepted allow-list (`class`, `style`, `id`, `title`, `data-*`, `aria-hidden`, `aria-describedby`) are unchanged from the prior host-attribute-boundary correction. Corrected the projection mechanism: `forwardedAttrs` was a cached `computed()` over `useAttrs()`. `useAttrs()` is guaranteed by Vue to reflect the latest attrs during render, but is not documented or guaranteed to be a supported `computed()` reactive dependency, so relying on it for cache invalidation risked staleness when an allow-listed key was added, removed, or re-added after mount. It is now `getForwardedAttrs()`, a plain function that rebuilds the allow-listed object from the live `attrs` object every time it runs, called directly from the template as `v-bind="getForwardedAttrs()"` so it recomputes on every render; separate `:class`/`:style` bindings still merge consumer values with the adapter-owned `md-loading-indicator` class and the M3E-001/M3E-002 `width`/`height`/`--m3e-loading-indicator-size` style object, with internal geometry always winning on a conflicting style key. `useAttrs` remains imported behind the documented local `eslint-disable-next-line no-restricted-imports` justification.
3. Revalidated M3E-001 and M3E-002 against the installed `2.6.3` public types and artifact; both remain confirmed and unchanged. No defect-record update was required.
4. Added a `MDLoadingIndicator.test.ts` lifecycle test proving an allow-listed `id` is absent initially, can be added, removed, and re-added with a different value; a previously absent `data-*` key can be added and removed; and a dynamically added forbidden `role`/`click` listener still never reaches or mutates the rendered `m3e-loading-indicator`. All prior Host-attribute boundary coverage (allow-list forwarding, style-merge precedence, rejection matrix, reactivity) and the full existing component contract remain unchanged and re-verified.
5. Audited Button composition (`MDButton.vue`, read-only) as the dependency-handoff consumer: its `aria-hidden="true"` and `--md-comp-loading-indicator-active-indicator-color: currentColor` (via `.md-button__loading-indicator` class merge) both reach the renderer host through the unchanged allow-list, now projected by the corrected render-time mechanism. No Button-specific behavior changed.

## Public API implemented

- Root-exported `MDLoadingIndicator` Vue component; unchanged by this correction.
- Required `label: string` accessible-purpose prop, sole `aria-label` source (a consumer-passed `aria-label` attr cannot override it).
- Optional `size?: number`, default 48, finite clamp to 24-240, non-finite normalization to 48, and development warnings for normalized input — unchanged.
- Single custom-element host; `inheritAttrs: false` plus an explicit host-attribute allow-list (`class`, `style`, `id`, `title`, `data-*`, `aria-hidden`, `aria-describedby`) replaces the previous unrestricted native/global fallthrough. No slots, emits, exposed methods, variant, progress value, loading state, or operation-state ownership.

## Tokens and renderer mappings implemented

- `--md-comp-loading-indicator-active-indicator-color` remains declared at the family owner with `var(--md-sys-color-primary)` fallback, mapped privately to the renderer active-indicator color input; still reachable through the merged `style` binding (different key from the protected geometry keys).
- Public overall size still sets explicit host width/height; private active size still uses the renderer's effective size input at the official 38/48 ratio. Both remain protected: a consumer `style` cannot override `width`, `height`, or `--m3e-loading-indicator-size`.
- M3E-001 and M3E-002 remain confirmed for the installed version, family-local, exact-version-gated, and removable.
- Button composition still overrides only the public family token to `currentColor`, now proven to still pass through the merged `style`.

## Dependencies completed

- Material foundation primary color ownership is unchanged and available.
- No official component-family dependency is required by the selected surface.
- The installed Loading Indicator package remains a private renderer dependency.
- Button is an audited parent composition consumer (read-only in this pass), not a Loading Indicator implementation dependency.

## Proof completed

- `MDLoadingIndicator.test.ts` `Host-attribute boundary` describe block proves: allowed `class`/`style`/`id`/`title`/`data-*`/`aria-hidden`/`aria-describedby` reach `m3e-loading-indicator`; `aria-hidden="true"` specifically works; a consumer `style` merges with the internal `width`/`height`/`--m3e-loading-indicator-size` without breaking the M3E-001/M3E-002 workaround (internal geometry wins on conflict); a consumer public Material token style override (`--md-comp-loading-indicator-active-indicator-color`) still reaches the host; raw renderer `variant`, `contained`, `role`, `aria-valuenow`/`aria-valuemin`/`aria-valuemax`, an arbitrary unknown attribute, and an arbitrary listener do not reach or modify the renderer; `label` remains the effective accessible-purpose source; forwarded `class`/`style`/`id`/`title`/`data-*`/`aria-hidden`/`aria-describedby` stay reactive to consumer changes; and (new in this pass) an allow-listed `id`/`data-*` key can be added, removed, and re-added after mount while a dynamically added forbidden attribute/listener stays rejected, proving the render-time projection mechanism has no cache-staleness gap.
- The pre-existing component contract tests (label forwarding, public token fallthrough, default/explicit overall geometry, proportional private mapping, clamping, non-finite normalization) remain green, unmodified in intent.
- `MDLoadingIndicator.stories.ts`'s `AttributeBoundary` story and `tests/e2e/storybook/md-loading-indicator.spec.ts`'s Chromium behavior test are unchanged by this pass; both already exercise dynamic attribute updates against the projection mechanism and continue to pass against the render-time function.
- Package-derived Vue custom-element typing and selected-tag configuration remain unchanged and still constrain renderer integration to the Material boundary.
- Renderer-boundary and token-catalogue checks remain unchanged and still cover public/private ownership and declarations.

## Verification performed

- `pnpm verify --only eslint --files src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.vue src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.test.ts` — passed (fix-only pass applied for a JSDoc formatting warning; no logic change).
- `pnpm verify --only type-check` — passed.
- `pnpm verify --only unit-tests --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.test.ts src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.vue src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.test.ts` — passed, 44 tests total (14 Button, 30 Loading Indicator, including the new lifecycle test).
- `pnpm verify --only format --files src/shared/ui/material/components/button/MDButton.test.ts src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.test.ts` — passed.
- Storybook browser-behavior proof for this family (`md-loading-indicator.spec.ts`) is unchanged by this pass; the prior host-attribute-boundary correction round already recorded it passing (see git history), and this correction does not touch that spec or the story it exercises.
- Migration and final release-sensitive verification remain a later stage's responsibility.

## Architecture deviations

None.

## Remaining implementation blockers

None.

## Migration readiness

Ready. `MDButton`'s current usage (`aria-hidden="true"`, the `.md-button__loading-indicator` class carrying `--md-comp-loading-indicator-active-indicator-color: currentColor`) already fits inside the allow-list with no change required. The allow-list content and consumer audit are unchanged by this projection-mechanism correction; `material-component-migration`'s prior audit against the boundary recorded in [ARCHITECTURE.md's migration plan](./ARCHITECTURE.md#migration-plan) remains valid.
