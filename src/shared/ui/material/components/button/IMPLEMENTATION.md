# Button implementation

Status: complete (attrs-projection correction implemented and fully proven; host-attribute-boundary correction remains intact — see Verification performed)
DESIGN.md reference: `./DESIGN.md` (`Status: current`, official tabs snapshot 2026-07-20)
ARCHITECTURE.md reference: `./ARCHITECTURE.md` (`Status: ready`, architecture date 2026-07-31, host-attribute boundary correction)
Implementation workspace state: canonical Button runtime, tokens, exports, component proof, and dependency artifacts inspected; this pass corrects the host-attribute allow-list projection mechanism from a cached `computed()` to a render-time function, on top of the previously complete seven-token/renderer-mapping implementation and host-attribute-boundary correction. No token, mapping, allow-list content, or public-API surface changed in this pass.

## Implemented passes

1. `MDButton.vue`: `defineOptions({ inheritAttrs: false })` and the `useAttrs` import behind the documented local lint exception are unchanged from the prior host-attribute-boundary correction. `class`/`style` remain merged in the template (`:class="['md-button', attrs.class]"`, `:style="attrs.style"`) so the adapter-owned `md-button` class always survives.
2. Corrected the allow-list projection mechanism: `forwardedAttrs` was a cached `computed()` over `useAttrs()`. `useAttrs()` is guaranteed by Vue to reflect the latest attrs during render, but is not documented or guaranteed to be a supported `computed()` reactive dependency, so relying on it for cache invalidation risked staleness when an allow-listed key was added, removed, or re-added after mount. It is now `getForwardedAttrs()`, a plain function that rebuilds the allow-listed object from the live `attrs` object every time it runs, called directly from the template as `v-bind="getForwardedAttrs()"` so it recomputes on every render. `getForwardedAttrs()` is placed before the adapter's own explicit bindings (`:disabled`, `shape="rounded"`, `:size`, `:toggle="false"`, `:type`, `:variant`, `:aria-busy`, `@click`) so those always win on any key collision (there is none by construction, since the allow-list excludes every key the adapter itself owns). `$attrs` remains read-only throughout; a fresh object is built each call, never mutated. The allow-listed keys (`id`, `title`, `aria-controls`, `aria-describedby`, `aria-expanded`, `aria-haspopup`, `data-*`) are unchanged.
3. Added `MDButton.test.ts`'s `'projects an allow-listed attribute and a data-* key from render-time attrs across add/remove/re-add, and keeps rejecting a dynamically added forbidden attribute/listener'` test: mounts through a parent with an initially empty dynamic `v-bind` object and proves an allow-listed `id` is absent initially, can be added, removed, and re-added with a different value; a previously absent `data-*` key can be added and removed; and a dynamically added forbidden `toggle`/`beforeinput` still never reaches or mutates the rendered `m3e-button`. All prior host-attribute-boundary coverage (allow-list forwarding, class/style merge, reactive forwarding, renderer-private/unknown-attribute/listener rejection with adapter precedence) and the full existing defaults/label/icon/disabled/submit/click/loading contract remain unchanged and re-verified.
4. `MDButton.stories.ts`'s `HostAttributeBoundary` story and `tests/e2e/storybook/md-button-family.spec.ts`'s `'MDButton drops undeclared dynamic attrs and never exposes their renderer state'` browser test are unchanged; both already exercise dynamic attribute updates against the projection mechanism and continue to pass against the render-time function.
5. Independent review found the new lifecycle test's inline `defineComponent` Wrapper produced an undisclosed `vue/one-component-per-file` eslint warning (a second component definition in a file that already had one from the "stays reactive to allowed forwarded attribute changes" test). Fixed by consolidating both tests onto one shared module-level `DynamicAttrsWrapper` component (parameterized via a `props.attrs` object updated with `wrapper.setProps()`), removing the second `defineComponent` call entirely rather than merely disclosing the warning, per the project's "fix warnings caused by the current change" rule.

## Public API implemented

- No change. Root-exported `MDButton` keeps required `label`; selected `color`, `size`, `nativeType`, `disabled`, and presentation-only `loading` props; optional leading `icon` slot; and unchanged `click(MouseEvent)` forwarding.
- The single `m3e-button` host remains the sole component root and the semantic/native owner. It no longer receives unrestricted global/native attribute and listener fallthrough — only the accepted host-attribute allow-list reaches it, per the corrected `## Host-attribute boundary`.

## Tokens and renderer mappings implemented

No change in this pass. The public family surface remains exactly the seven official text Button label/state-layer color tokens selected in `ARCHITECTURE.md`, implemented in a prior pass and unaffected by the host-attribute-boundary correction.

## Dependencies completed

No change. Loading Indicator `IMPLEMENTATION.md` remains complete; its Button composition contract is unaffected (the `icon`-slot Loading Indicator composition uses declared props, not `$attrs`, and was not touched).

## Proof completed

- `MDButton.test.ts`: host-attribute allow-list forwarding and merge, reactive forwarding, renderer-private/unknown-attribute/listener rejection with adapter-precedence, the full existing defaults/label/icon/disabled/submit/click/loading contract, plus the new dynamic allow-listed-key add/remove/re-add and dynamic forbidden-input-rejection lifecycle test — all re-verified passing (14 tests).
- `md-button-family.spec.ts`: existing browser proof that dynamically attempted undeclared inputs (`toggle`, `selected`, `shape`, `variant`, an unknown attribute) never change the rendered `m3e-button`'s own attributes/properties, across two dynamic updates — unaffected by the projection-mechanism correction and re-verified.
- Package type-check and eslint (including the `no-restricted-imports` local exception for `useAttrs`) pass for every touched file.

## Verification performed

- `pnpm verify --only eslint --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.test.ts` — passed with zero warnings after the `DynamicAttrsWrapper` consolidation (initially passed with a JSDoc formatting warning fixed via `--fix-only`, then the independent review's `vue/one-component-per-file` finding was fixed by removing the second `defineComponent`).
- `pnpm verify --only type-check` — passed.
- `pnpm verify --only unit-tests --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.test.ts` — passed, 14 tests, re-verified after the `DynamicAttrsWrapper` consolidation.
- `pnpm verify --only unit-tests --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.test.ts src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.vue src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.test.ts` — passed, 44 tests total (14 Button, 30 Loading Indicator).
- `pnpm verify --only format --files src/shared/ui/material/components/button/MDButton.test.ts src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.test.ts` — passed.
- Storybook browser-behavior proof for this family (`md-button-family.spec.ts`) is unchanged by this pass; the prior host-attribute-boundary correction round already recorded it passing (see git history), and this correction does not touch that spec or the story it exercises.

## Architecture deviations

None.

## Remaining implementation blockers

None.

## Migration readiness

Ready for `material-component-migration` to perform the required consumer audit: `ARCHITECTURE.md`'s "Host-attribute boundary" and migration plan record that tightening fallthrough to the accepted allow-list is a breaking change for any consumer currently relying on leaked renderer access through `$attrs`, so migration must audit every current `MDButton` consumer against the exact allow-list before the family can be marked migrated/complete. All implementation-stage proof (unit, type-check, eslint, format, storybook-behavior) is confirmed passing.
