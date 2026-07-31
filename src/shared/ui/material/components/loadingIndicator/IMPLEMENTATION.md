# Loading indicator implementation

Status: complete
DESIGN.md reference: `./DESIGN.md` (`Status: current`, design document date 2026-07-30)
ARCHITECTURE.md reference: `./ARCHITECTURE.md` (`Status: ready`, architecture date 2026-07-31, host-attribute boundary correction)
Implementation workspace state: canonical Loading Indicator runtime, token, exports, renderer integration, component proof, and Button composition inspected for the [Host-attribute boundary](./ARCHITECTURE.md#host-attribute-boundary) correction only.

## Implemented passes

1. Audited `MDLoadingIndicator.vue`, family export, root Material export, Vue custom-element selection, and package-derived renderer declaration against the ready architecture; no mismatch outside the host-attribute boundary was found.
2. Set `defineOptions({ inheritAttrs: false })` on `MDLoadingIndicator.vue` and replaced default fallthrough with explicit forwarding of exactly the accepted allow-list (`class`, `style`, `id`, `title`, `data-*`, `aria-hidden`, `aria-describedby`) via a `useAttrs()`-derived, freshly built `forwardedAttrs` computed object (never mutating `$attrs`) plus separate `:class`/`:style` bindings that merge consumer values with the adapter-owned `md-loading-indicator` class and the M3E-001/M3E-002 `width`/`height`/`--m3e-loading-indicator-size` style object, with internal geometry always winning on a conflicting style key. `useAttrs` is imported behind a documented local `eslint-disable-next-line no-restricted-imports` justification, consistent with the rule's "document a transparent host/adaptor contract" escape hatch.
3. Revalidated M3E-001 and M3E-002 against the installed `2.6.3` public types and artifact; both remain confirmed and unchanged. No defect-record update was required.
4. Added Host-attribute boundary proof: extended `MDLoadingIndicator.test.ts` with a `Host-attribute boundary` describe block, and added an `AttributeBoundary` Storybook story plus a new Playwright behavior test in `tests/e2e/storybook/md-loading-indicator.spec.ts`.
5. Audited Button composition (`MDButton.vue`, read-only) as the dependency-handoff consumer: its `aria-hidden="true"` and `--md-comp-loading-indicator-active-indicator-color: currentColor` (via `.md-button__loading-indicator` class merge) both reach the renderer host through the new allow-list unchanged. No Button file was modified.

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

- `MDLoadingIndicator.test.ts` `Host-attribute boundary` describe block proves: allowed `class`/`style`/`id`/`title`/`data-*`/`aria-hidden`/`aria-describedby` reach `m3e-loading-indicator`; `aria-hidden="true"` specifically works; a consumer `style` merges with the internal `width`/`height`/`--m3e-loading-indicator-size` without breaking the M3E-001/M3E-002 workaround (internal geometry wins on conflict); a consumer public Material token style override (`--md-comp-loading-indicator-active-indicator-color`) still reaches the host; raw renderer `variant`, `contained`, `role`, `aria-valuenow`/`aria-valuemin`/`aria-valuemax`, an arbitrary unknown attribute, and an arbitrary listener do not reach or modify the renderer; `label` remains the effective accessible-purpose source; forwarded `class`/`style`/`id`/`title`/`data-*`/`aria-hidden`/`aria-describedby` stay reactive to consumer changes.
- The pre-existing component contract tests (label forwarding, public token fallthrough, default/explicit overall geometry, proportional private mapping, clamping, non-finite normalization) remain green, unmodified in intent.
- `MDLoadingIndicator.stories.ts` adds a non-visual `AttributeBoundary` story that reactively toggles undeclared dynamic inputs (`aria-valuenow=63`, `aria-valuemin=17`, `aria-valuemax=83`, `contained`, `role="alert"`, `variant="contained"`, and an unattached click listener) via a `data-testid="toggle-undeclared-attrs"` control, with the sentinel values chosen to differ from the renderer's own observed defaults (`aria-valuemin="0"`, `aria-valuemax="100"`, no default `aria-valuenow`).
- `tests/e2e/storybook/md-loading-indicator.spec.ts` adds a new Chromium behavior test that opens that story and proves the sentinel values never reach the rendered `m3e-loading-indicator` before or after the reactive toggle, the role stays `progressbar` (never `alert`), and the unattached listener never fires — inspecting only the public rendered result, not shadow DOM.
- Package-derived Vue custom-element typing and selected-tag configuration remain unchanged and still constrain renderer integration to the Material boundary.
- Renderer-boundary and token-catalogue checks remain unchanged and still cover public/private ownership and declarations.

## Verification performed

- `pnpm verify --only format --files <changed files>`: passed after `--fix-only` (2 unformatted files).
- `pnpm verify --only eslint --files <changed files>`: passed after (1) adding a documented `eslint-disable-next-line no-restricted-imports` justification for `useAttrs` immediately above its import, and (2) removing an unnecessary type assertion in the new reactivity test (replaced with an explicit `data()` return-type annotation).
- `pnpm verify --only oxlint --files <changed files>`: passed (one pre-fix warning, `no-unnecessary-type-assertion`, resolved by the same type-assertion fix above).
- `pnpm verify --only type-check`: passed.
- `pnpm verify --only unit-tests --files MDLoadingIndicator.vue MDLoadingIndicator.test.ts`: passed, 29 tests (after correcting one test's expected `--m3e-loading-indicator-size` string to the regex/`toBeCloseTo` pattern already used elsewhere in the file, matching actual floating-point precision).
- `pnpm verify --only storybook-behavior --files MDLoadingIndicator.vue MDLoadingIndicator.stories.ts tests/e2e/storybook/md-loading-indicator.spec.ts`: passed, 5 tests (after correcting the new spec's sentinel `aria-valuemin`/`aria-valuemax` values to differ from the renderer's own observed defaults, discovered via a real Chromium failure).
- Migration and final release-sensitive verification remain a later stage's responsibility.

## Architecture deviations

None.

## Remaining implementation blockers

None. Explicit operator visual/motion acceptance is a later review gate, not an implementation blocker.

## Migration readiness

Ready. `MDButton`'s current usage (`aria-hidden="true"`, the `.md-button__loading-indicator` class carrying `--md-comp-loading-indicator-active-indicator-color: currentColor`) already fits inside the new allow-list with no change required, but `material-component-migration` must still perform the formal consumer audit against the tightened boundary recorded in [ARCHITECTURE.md's migration plan](./ARCHITECTURE.md#migration-plan) before the family is marked migrated/complete.
