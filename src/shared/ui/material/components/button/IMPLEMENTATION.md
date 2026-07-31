# Button implementation

Status: complete (host-attribute-boundary correction implemented and fully proven, including the Storybook browser-behavior lane — see Verification performed)
DESIGN.md reference: `./DESIGN.md` (`Status: current`, official tabs snapshot 2026-07-20)
ARCHITECTURE.md reference: `./ARCHITECTURE.md` (`Status: ready`, architecture date 2026-07-31, host-attribute boundary correction)
Implementation workspace state: canonical Button runtime, tokens, exports, component proof, and dependency artifacts inspected; this pass implements the accepted `## Host-attribute boundary` correction on top of the previously complete seven-token/renderer-mapping implementation. No token, mapping, or public-API surface changed in this pass.

## Implemented passes

1. `MDButton.vue`: added `defineOptions({ inheritAttrs: false })`, imported `useAttrs` behind the documented local lint exception (matching the established `MDLoadingIndicator.vue` pattern for the same architecture section), and replaced automatic `$attrs` fallthrough with an explicit `forwardedAttrs` computed that forwards only `id`, `title`, `aria-controls`, `aria-describedby`, `aria-expanded`, `aria-haspopup`, and every `data-*` key. `class`/`style` are merged in the template (`:class="['md-button', attrs.class]"`, `:style="attrs.style"`) so the adapter-owned `md-button` class always survives. `v-bind="forwardedAttrs"` is placed before the adapter's own explicit bindings (`:disabled`, `shape="rounded"`, `:size`, `:toggle="false"`, `:type`, `:variant`, `:aria-busy`, `@click`) so those always win on any key collision (there is none by construction, since the allow-list excludes every key the adapter itself owns). `$attrs` is read-only throughout; a fresh object is built each time, never mutated.
2. Confirmed `computed()` over `useAttrs()` stays reactive to attrs changes (the returned object is a tracking `Proxy`, not a plain object — verified against the Vue 3.5.40 runtime source and by a passing reactive unit test), matching the existing `MDLoadingIndicator.vue` convention.
3. Rewrote `MDButton.test.ts`'s host-attribute coverage: allowed `class`/`style`/`id`/`title`/`data-*`/approved-ARIA attributes reaching `m3e-button`; consumer `class`/`style` merging with (not replacing) internal `md-button` class/styles; reactive forwarding of an allowed attribute through a live parent binding; `toggle`, `selected`, `shape`, renderer `variant`/`type`, and an unrelated unknown attribute never reaching or mutating the host, with adapter-owned bindings winning even when attrs attempt the same key; an undeclared `beforeinput` listener never attaching to the host. Retained and re-verified existing defaults/retained-values, label/icon, disabled/submit mapping, false-Boolean-property mapping, click-payload forwarding, and loading/disabled ownership tests unchanged in behavior.
4. Added `MDButton.stories.ts`'s `HostAttributeBoundary` story: a `data-testid`-addressable `MDButton` receiving a reactive `v-bind` object that dynamically attempts `toggle`, `selected`, `shape`, `variant`, and an unrelated unknown attribute, plus a button that flips those attempted values on click.
5. Added `tests/e2e/storybook/md-button-family.spec.ts`'s `'MDButton drops undeclared dynamic attrs and never exposes their renderer state'` test: opens the new story and asserts the rendered `m3e-button` keeps `variant: 'filled'`, `shape: 'rounded'`, `toggle: false`, `selected: false` and never gains the unknown attribute, across the initial render and two dynamic attempted-override updates — satisfying ARCHITECTURE.md's requirement that browser proof show dynamically passed undeclared inputs cannot change actual rendered custom-element state, not merely that they are absent from a snapshot.

## Public API implemented

- No change. Root-exported `MDButton` keeps required `label`; selected `color`, `size`, `nativeType`, `disabled`, and presentation-only `loading` props; optional leading `icon` slot; and unchanged `click(MouseEvent)` forwarding.
- The single `m3e-button` host remains the sole component root and the semantic/native owner. It no longer receives unrestricted global/native attribute and listener fallthrough — only the accepted host-attribute allow-list reaches it, per the corrected `## Host-attribute boundary`.

## Tokens and renderer mappings implemented

No change in this pass. The public family surface remains exactly the seven official text Button label/state-layer color tokens selected in `ARCHITECTURE.md`, implemented in a prior pass and unaffected by the host-attribute-boundary correction.

## Dependencies completed

No change. Loading Indicator `IMPLEMENTATION.md` remains complete; its Button composition contract is unaffected (the `icon`-slot Loading Indicator composition uses declared props, not `$attrs`, and was not touched).

## Proof completed

- `MDButton.test.ts`: host-attribute allow-list forwarding and merge, reactive forwarding, renderer-private/unknown-attribute/listener rejection with adapter-precedence, plus the full existing defaults/label/icon/disabled/submit/click/loading contract, re-verified unchanged.
- `md-button-family.spec.ts`: new browser proof that dynamically attempted undeclared inputs (`toggle`, `selected`, `shape`, `variant`, an unknown attribute) never change the rendered `m3e-button`'s own attributes/properties, across two dynamic updates.
- Package type-check and eslint (including the `no-restricted-imports` local exception for `useAttrs`) pass for every touched file.

## Verification performed

- `pnpm verify --only format --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.test.ts src/shared/ui/material/components/button/MDButton.stories.ts tests/e2e/storybook/md-button-family.spec.ts` — passed.
- `pnpm verify --only eslint --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.test.ts src/shared/ui/material/components/button/MDButton.stories.ts tests/e2e/storybook/md-button-family.spec.ts` — passed.
- `pnpm verify --only type-check` — passed.
- `pnpm verify --only unit-tests --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.test.ts` — passed, 13 tests.
- `pnpm verify --only storybook-behavior --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.stories.ts tests/e2e/storybook/md-button-family.spec.ts` — re-run by the orchestrator outside the implementation worker's sandbox (which hit a transient Podman-init failure unrelated to this change) — **passed** ✅, including the new `'MDButton drops undeclared dynamic attrs and never exposes their renderer state'` case.

## Architecture deviations

None.

## Remaining implementation blockers

None. The earlier Podman-init failure was a transient limitation of one worker's sandbox instance, not a repository or code issue; the same command passed cleanly when re-run.

## Migration readiness

Ready for `material-component-migration` to perform the required consumer audit: `ARCHITECTURE.md`'s "Host-attribute boundary" and migration plan record that tightening fallthrough to the accepted allow-list is a breaking change for any consumer currently relying on leaked renderer access through `$attrs`, so migration must audit every current `MDButton` consumer against the exact allow-list before the family can be marked migrated/complete. All implementation-stage proof (unit, type-check, eslint, format, storybook-behavior) is confirmed passing.
