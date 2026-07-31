# Button review

Reviewed workspace state: full current working-tree state of `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`; `MDButton.vue`, `MDButton.test.ts`, `MDButton.stories.ts`, `MDButtonTargetHitVisualStory.vue`, `tokens.css`, `index.ts`, `README.md` (all read in full, not summarized); `tests/e2e/storybook/md-button-family.spec.ts` (read in full); `src/shared/ui/material/docs/token-api.md`'s Button rows; `config/vueCustomElements.ts`; `src/shared/ui/material/rendererBoundary.test.ts`; the composed `MDLoadingIndicator.vue`'s own host-attribute allow-list and its `active-indicator-color` token entry in `token-api.md`; `src/shared/ui/material/docs/roadmap.md`; every current `MDButton` consumer independently re-enumerated by repository-wide grep and spot-checked against `MIGRATION.md`'s inventory (`MDSnackbar.vue`, `MDNavigationPathSegmentButton.vue`); `git diff`/`git log` across the commit that introduced the host-attribute-boundary correction (`8f857f7b`) and the uncommitted working-tree attrs-projection correction on top of it; and fresh independent re-runs (this review, 2026-07-31) of `pnpm verify --only unit-tests`, `pnpm verify --only type-check`, and `pnpm verify --only eslint` for the touched files, independent of the implementation/migration workers' self-reports and independent of the prior `REVIEW.md` (which reviewed only the preceding host-attribute-boundary round and predates the attrs-projection correction under review here).
Review date: 2026-07-31
DESIGN.md status: `current`
ARCHITECTURE.md status: `ready`
IMPLEMENTATION.md status: `complete`
MIGRATION.md status: `complete`
Operator visual status: no-reported-defect
Verdict: compliant-with-listed-risks

## Goal and scenarios reviewed

This review covers the complete resulting `button` family, not only the latest attrs-projection correction. The full public contract was re-examined against `DESIGN.md`/`ARCHITECTURE.md`: filled/outlined/text color, extra-small/small size, round shape, required label, optional leading icon, native `button`/`submit` type, `disabled`, the non-official `loading` composition extension, `click` forwarding, the host-attribute allow-list, and the seven selected contextual text tokens (`Current scenarios` items 1–7 in `ARCHITECTURE.md`).

The specific correction under fresh review: the host-attribute allow-list projection mechanism changed from a cached `computed(() => {...})` over `useAttrs()` to a plain function `getForwardedAttrs()` called directly from the template (`v-bind="getForwardedAttrs()"`), because `useAttrs()` is guaranteed by Vue to reflect the latest attrs during render but is not a documented supported `computed()` reactive dependency. `MDButton.vue` was read in full and independently confirmed to contain no `computed()`, `watch()`, `watchEffect()`, or mirrored state around the allow-list — `getForwardedAttrs()` (lines 106–123) rebuilds a fresh object from `Object.entries(attrs)` on every call, called only from the template. The allow-list content itself (`id`, `title`, `aria-controls`, `aria-describedby`, `aria-expanded`, `aria-haspopup`, `data-*`, plus separately merged `class`/`style`) is unchanged from the prior host-attribute-boundary round and matches `ARCHITECTURE.md`'s "Host-attribute boundary" table exactly.

## Official design compliance

No `DESIGN.md` change occurred in this round; it remains `current` with a complete source ledger, full variant/geometry/token catalogue (spot-checked filled/elevated/sizes/deprecated sets and the "Source conflicts and extraction gaps" section), and no unresolved freshness blocker (the 2026-07-30 refresh-tooling limitation is explicitly non-blocking per its own recorded reasoning). No design-owned finding.

## Architecture compliance

`ARCHITECTURE.md` is `ready` and internally consistent with `DESIGN.md`'s selected surface. Its "Host-attribute boundary" section documents the mechanism at the `inheritAttrs: false` + explicit-forwarding level (not tied to a specific reactive primitive), so the attrs-projection correction (computed → plain function) required no architecture update — confirmed correct, since `IMPLEMENTATION.md` correctly records "Architecture deviations: None" and no allow-list content, public API, or token changed. The dependency closure table's Loading Indicator row is current (`DESIGN.md`: current, `ARCHITECTURE.md`: ready, `IMPLEMENTATION.md`: complete — independently verified by reading those three files' status lines). No architecture-owned finding.

## Implementation compliance

Read `MDButton.vue` in full, not diffed against worker prose:

- `defineOptions({ inheritAttrs: false })` present; the only `useAttrs` import goes through the documented local `eslint-disable-next-line no-restricted-imports` exception with an inline comment explaining the read-only, allow-list-only usage.
- `getForwardedAttrs()` is a positive allow-list (exact key match for six named keys, prefix match for `data-`), not a denylist; every unnamed attribute or listener is excluded by construction. `class`/`style` are read directly from `attrs` in the template (`:class="['md-button', attrs.class]"`, `:style="attrs.style"`) and are additive by construction of the array form.
- Explicit adapter bindings (`:disabled`, `shape="rounded"`, `:size`, `:toggle="false"`, `:type`, `:variant`, `:aria-busy`, `@click`) are declared after `v-bind="getForwardedAttrs()"` in template source order, so they win on any (currently nonexistent, by allow-list construction) key collision, matching `ARCHITECTURE.md`'s stated precedence.
- `loading`/`disabled` ownership, the single `m3e-button` root, `nativeType`→`type` mapping, and the `click(MouseEvent)` emit are unchanged. `m3e-button`/`m3e-loading-indicator` are the only two entries in `config/vueCustomElements.ts`'s selected allow-list, matching the `vue/no-undef-components` exception comment in the template.
- No `!important` in `MDButton.vue`'s scoped styles. No generic adapter framework, wrapper base class, registry, or composable was introduced — the filter is a single inline function local to `MDButton.vue`.
- Token surface: `tokens.css` declares exactly the seven public `--md-comp-button-text-*` names mapped to the seven private `--m3e-text-button-*` inputs, matching `ARCHITECTURE.md`'s "Public token contract" table and `docs/token-api.md`'s seven Button rows exactly (cross-checked all three sources).
- Composed dependency handoff: `MDLoadingIndicator` receives only `label`, `size` (mapped to 24 for both retained Button sizes), `aria-hidden="true"`, and a composition-local `currentColor` override via the public `--md-comp-loading-indicator-active-indicator-color` token (confirmed against `token-api.md`, which explicitly credits "Button loading composition contract and visual baseline" as a proof owner for that token). `MDLoadingIndicator.vue`'s own host-attribute allow-list independently includes `aria-hidden`, so the composed `aria-hidden="true"` reaches its host correctly under the same corrected mechanism. No renderer-private vocabulary crosses the composition boundary. Standalone Loading Indicator proof is not duplicated here, per its own family ownership.

**Test-file read (in full, per task instruction):** `MDButton.test.ts` has 14 tests, matching `IMPLEMENTATION.md`'s claim. Every host-attribute-boundary assertion reads the live mounted `m3e-button` element via `Reflect.get`/`.attributes()`/`.classes()`, not a re-serialized props object. The new `'projects an allow-listed attribute and a data-* key from render-time attrs across add/remove/re-add...'` test independently proves the specific claim under review: it mounts through a parent with an initially empty dynamic `v-bind` object, then adds, removes, and re-adds an `id` with a different value, adds and removes a `data-*` key, and confirms a dynamically added `toggle`/`onBeforeinput` still never reaches or mutates the rendered element — genuine proof that a plain function re-evaluated at template-render time (not a cached `computed()`) tracks live attrs correctly across the exact staleness scenario the correction targets.

**One genuine implementation-proof gap found:** running `pnpm verify --only eslint --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.test.ts` myself produces `passed with warnings` — `2 problems (0 errors, 2 warnings) | 155:39 warning There is more than one component in this file vue/one-component-per-file | 207:39 warning ...`. Line 207 is inside the newly added `'projects an allow-listed attribute...'` test's inline `defineComponent({ ... })` Wrapper; line 155 is the pre-existing `'stays reactive to allowed forwarded attribute changes'` test's own inline `Wrapper`. Confirmed via `git diff 8f857f7b~1 8f857f7b` that the test file had zero `defineComponent` calls before the host-attribute-boundary round, so the rule was not previously triggering; the new test's second inline component is what now trips `vue/one-component-per-file` twice. `IMPLEMENTATION.md`'s "Verification performed" section states eslint "passed (fix-only pass applied for a JSDoc formatting warning; no logic change)" and does not mention or classify this warning. Per `src/AGENTS.md`/root `AGENTS.md` warning-handling rule ("fix warnings caused by the current change... classify remaining warnings as pre-existing, unrelated, or intentionally deferred"), this is a real, if minor, proof-record gap — not a blocker, since `verify --only eslint` still reports `passed`.

## Migration and legacy removal

Independently re-enumerated every current `MDButton` consumer via `grep -rl "MDButton" src` (excluding the family itself) and compared the result set line-for-line against `MIGRATION.md`'s consumer inventory: identical file set, including the same two intentional false positives (`ButtonsBar/index.ts` re-exporting an unrelated `MDButtonsBar`, and the canonical `material/index.ts` export). Spot-checked `MDSnackbar.vue` and `MDNavigationPathSegmentButton.vue` directly: both use only declared props (`color`, `label`), the declared `click` emit, and `class` (allow-listed, merged) — matching `MIGRATION.md`'s claims exactly. `git diff --stat` confirms no consumer file changed in this round, consistent with `MIGRATION.md`'s claim that every consumer already fit the allow-list. No migration-owned finding.

## Proof and verification

Re-ran the following myself rather than trusting `IMPLEMENTATION.md`'s recorded results (one prior invocation attempt hit an active `pnpm verify` lock from an unrelated concurrent run; per the verification skill I waited and used `pnpm verify:status` rather than forcing a duplicate run, then re-ran once idle):

- `pnpm verify --only unit-tests --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.test.ts` — **passed**.
- `pnpm verify --only type-check` — **passed**.
- `pnpm verify --only eslint --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.test.ts` — **passed with warnings** (see the `vue/one-component-per-file` gap above; not a failure).

All reproduce or refine `IMPLEMENTATION.md`'s recorded results; the eslint warning was not previously disclosed. Storybook-behavior (`md-button-family.spec.ts`) and visual lanes were not independently re-run in this pass (browser/visual infrastructure not exercised here); their content was read in full and matches the claimed coverage (host-attribute-boundary dynamic-update browser test, contextual-token rendered-label states, target-hit/focus-indicator geometry), and `IMPLEMENTATION.md`/`MIGRATION.md` both record them passing. This is a proof-content read, not an independent re-execution, and is noted as such rather than claimed as re-verified.

## Blockers

None.

## Major issues

None.

## Minor issues

- `IMPLEMENTATION.md`'s eslint verification record does not disclose or classify the two `vue/one-component-per-file` warnings that `pnpm verify --only eslint` currently produces for `MDButton.test.ts` (introduced by the newly added dynamic add/remove/re-add test's second inline `defineComponent` Wrapper). Non-blocking (verify still reports `passed`), but the project warning-handling rule requires fixing or explicitly classifying warnings caused by the current change. Route: `material-component-implementation`.

## Accepted risks

- The allow-list is a manually maintained positive list local to `MDButton.vue`; a future edit reintroducing `v-bind="$attrs"` or removing `inheritAttrs: false` would silently reopen the leak. `ARCHITECTURE.md`'s "Risks" section already names this and the existing test/browser-proof suite would catch such a regression on the next run; no independent lint rule enforces it structurally. Already documented, not new.
- Browser proof covers `toggle`, `shape`, `variant`, `selected`, and one unknown attribute at the rendered custom-element level, but not every named forbidden attribute (e.g. `contained`, `aria-pressed`) individually. Acceptable: the forwarding mechanism is a single positive allow-list code path already proven for the tested keys, so untested forbidden keys are excluded by the same mechanism, not a separate per-key path that could diverge.
- `loading` motion/contrast and general Button visual/motion presentation remain subject to operator visual/motion inspection as an external defect-reporting channel per the corrected workflow rules; no defect is currently reported for this family, and none is required for completion.

## Items not required

- No change to `DESIGN.md`, the public Button Vue API (props/slots/emits), the seven-token contextual contract, or the `@m3e/web` version.
- No consumer code change (none needed; independently confirmed every current consumer already fits the allow-list).
- No new operator visual/motion acceptance: this correction changes no rendered appearance, color, geometry, or motion, only which non-visual attributes/listeners can reach the host and how that projection is recomputed.
- No duplication of standalone `MDLoadingIndicator` proof; only the Button-owned composition handoff (props passed, token used, allow-list reachability) was verified here.

## Required return stage

`material-component-implementation` — for the undisclosed `vue/one-component-per-file` eslint warnings in `MDButton.test.ts` (fix by extracting a single shared test-local `Wrapper` component or explicitly classify/accept the warning in `IMPLEMENTATION.md`'s verification record). This is a proof-record completeness gap, not a functional or architectural defect, and does not block the family's current completion.

## Completion status

Complete. `MDButton.vue`'s host-attribute allow-list is now projected by a render-time `getForwardedAttrs()` function with no `computed()`/`watch()`/`watchEffect()`/mirrored state, eliminating the prior cache-staleness risk while preserving the exact allow-list content, `inheritAttrs: false`, and the single `m3e-button` root; this is independently verified by direct code reading and a fresh passing focused unit-tests/type-check run, plus a new dynamic add/remove/re-add lifecycle test that proves the staleness scenario is closed. The public API, seven-token contract, renderer mapping, dependency composition (including the Loading Indicator handoff), and consumer inventory are all unchanged and independently reconfirmed. Operator visual status is `no-reported-defect`; no positive acceptance record is required. One minor, non-blocking proof-documentation gap (undisclosed eslint warnings) is routed back to implementation.
