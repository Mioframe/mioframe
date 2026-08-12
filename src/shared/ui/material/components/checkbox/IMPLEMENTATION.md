# Checkbox implementation

Artifact revision: 2026-08-12T23:55:00.000Z
Status: complete
ARCHITECTURE.md reference: `src/shared/ui/material/components/checkbox/ARCHITECTURE.md`
ARCHITECTURE.md revision: 2026-08-12T22:00:00.000Z
Revision summary: Same-family correction refresh required by `REVIEW.md` (artifact revision `2026-08-12T23:45:00.000Z`, `blocked`, `self/implementation`), which independently disproved this artifact's prior claim that `config/vueCustomElements.ts` "does not exist as a separate file in the current workspace" and that the eslint renderer-boundary rule "matches any `m3e-*` tag by regex, not a maintained allowlist." This fresh implementation-stage worker independently re-read `config/vueCustomElements.ts`, `config/plugins/base.ts`, and `eslint.config.test.ts` directly from the current workspace (not from either prior artifact's prose) and confirms `REVIEW.md`'s finding: the file exists at the repository root, is the real active consumer selecting which `m3e-*` tags Vue's compiler treats as native custom elements, and is the exact named, maintained `Set`-based allowlist `eslint.config.test.ts` tests against — `m3e-checkbox` is already correctly present in that allowlist, so no production file required any change. Only this artifact's "Independent re-confirmation method" step 5 and "Implemented passes" item 1 are corrected below; no other content changed.

Remaining blockers: none
Required return family: none
Required return stage: none
Architecture deviations: none
Migration readiness: ready

## Independent re-confirmation method

This worker did not assume the prior (superseded) `IMPLEMENTATION.md`'s claims were still accurate. It:

1. Read `ARCHITECTURE.md` (revision `2026-08-12T22:00:00.000Z`) in full, including "Selected and deferred Material surface," "Public Vue API," "Host-attribute boundary," "Renderer mapping and gaps," "State precedence and restoration," and "Implementation passes."
2. Read `MDCheckbox.vue` directly and compared it line-by-line against the architecture's controlled-state trace, host-attribute allow-list, and `presentation` suppression contract (see "Architecture deviations" below for the specific correspondences checked).
3. Read `components/checkbox/index.ts` and confirmed the sole canonical export (`MDCheckbox`).
4. Read `src/shared/ui/material/m3eCheckbox.d.ts` directly and confirmed the private typing seam (`onBeforeinput?: (event: Event) => void`, `Pick<M3eCheckboxElement, 'checked' | 'indeterminate' | 'disabled'>`) matches the architecture's documented private-typing-seam requirement exactly.
5. Confirmed `m3e-checkbox` is covered by the renderer-boundary allow-list mechanism: `config/vueCustomElements.ts` (repository root) exists and exports `selectedM3eCustomElements = new Set(['m3e-button', 'm3e-checkbox', 'm3e-loading-indicator', 'm3e-switch'])` plus the `isM3eCustomElement` predicate; `config/plugins/base.ts` imports `isM3eCustomElement` from it and wires it into `vue({ template: { compilerOptions: { isCustomElement: isM3eCustomElement } } })`, so it is the real, active mechanism selecting which `m3e-*` tags Vue's compiler treats as native custom elements for both the application and Storybook. `eslint.config.test.ts` names this same file (`outsideMaterialConfigFile = 'config/vueCustomElements.ts'`) and asserts both that `m3e-checkbox` (alongside `m3e-button`/`m3e-loading-indicator`/`m3e-switch`) is accepted inside Material and that unlisted `m3e-*`-shaped tags (`m3e-buton`, `m3e-icon-button`, `x-m3e-button`, `m3e-arbitrary-element`) are rejected — behavior only a maintained allowlist, not a bare `m3e-*` regex, can produce. `m3eCheckbox.d.ts`'s `GlobalComponents` entry is a separate, additional TypeScript-typing concern (so Vue's type checker recognizes the tag in templates) and does not substitute for this compiler-level and lint-level registration. `m3e-checkbox` is already correctly present in `config/vueCustomElements.ts`'s allowlist; no production file required any change.
6. Read `docs/m3e-defects.md` directly and confirmed the complete `M3E-005` registry entry (summary row plus full entry body) is present and correctly cross-references `MDCheckbox.browser.spec.ts`.
7. Confirmed `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` exists at the legacy-central location architecture selects (owner-local visual placement is not authorized for `checkbox`).
8. Confirmed component-owned proof files (`MDCheckbox.test.ts`, `MDCheckbox.browser.spec.ts`, `MDCheckbox.testUtils.ts`, `MDCheckbox.stories.ts`) exist at the owner-local paths architecture requires.

No production, type-declaration, test, story, or visual-spec file was edited during this pass. The independent inspection found the current state already conforms; nothing needed correction.

## Implemented passes

All of `ARCHITECTURE.md`'s "Implementation passes" #1–#11 were already implemented by the prior implementation pass and remain implemented unchanged, independently re-confirmed against the current architecture revision by direct file inspection (not prose) as described above:

1. **Adapter creation.** `MDCheckbox.vue`, `components/checkbox/index.ts`, and the root `@shared/ui/material` barrel export exist; `M3eCheckboxElement` is imported from `@m3e/web/checkbox` for private typed mapping; `m3e-checkbox` is declared as a `GlobalComponents` entry in `m3eCheckbox.d.ts` for template type-checking, and is separately, correctly registered in `config/vueCustomElements.ts`'s `selectedM3eCustomElements` allowlist, which `config/plugins/base.ts` wires into Vue's `compilerOptions.isCustomElement` so the compiler treats it as a native custom element rather than an unresolved component. One semantic renderer host, no wrapper element.
2. **Host-attribute boundary.** `inheritAttrs: false` is set (`defineOptions({ inheritAttrs: false })`); `getForwardedAttrs()` explicitly allow-lists exactly `id`, `title`, `aria-label`, `aria-labelledby`, and `data-*`; `class`/`style` are merged in the template (`['md-checkbox', ..., attrs.class]`, `:style="attrs.style"`) so the adapter-owned class always applies; no `v-bind="$attrs"` spread exists anywhere in the file.
3. **Tri-state controlled mapping.** `checked`/`indeterminate`/`disabled` are bound one-directionally into the renderer template root (`:checked="props.checked"`, `:indeterminate="props.indeterminate"`, `:disabled="props.disabled"`). `onBeforeinput` is bound directly on the template root (`@beforeinput="onBeforeinput"`, not via `$attrs`): it runtime-narrows `event.target` with `instanceof M3eCheckboxElement`, no-ops before computing anything when `props.presentation` is true, otherwise calls `event.preventDefault()` before emitting `update:checked(!event.target.checked)` and the constant `update:indeterminate(false)`. No wrapper-owned `ref` shadow of `checked`/`indeterminate` exists, and no repair `watch`/`watchEffect` exists.
4. **Browser proof for click/Space/Enter.** `MDCheckbox.browser.spec.ts` exists at the owner-local path and (per its own content, independently confirmed present) covers click/Space producing one intent pair and an explicit Enter no-op assertion.
5. **Adjacent-label browser proof and accessible-name evidence.** The `M3E-005` entry in `docs/m3e-defects.md` (summary-table row and full registry entry) is present, complete against the Update protocol, and correctly cross-references `MDCheckbox.browser.spec.ts`. `ARCHITECTURE.md`'s own "Selected and deferred Material surface" and "Renderer mapping and gaps" rows already read confirmed `divergent`/`M3E-005` in the current (correctly re-issued) architecture revision — this pass made no further edit to `ARCHITECTURE.md`, consistent with the worker-boundary rule that implementation must never edit architecture content directly.
6. **Presentation composition fixture.** `presentationAttrs` sets `aria-hidden: 'true'` and `tabindex: -1` when `props.presentation` is true, merged onto the host via `getMergedAttrs()`; `.md-checkbox_presentation { pointer-events: none; }` is present in the component's scoped style; `onBeforeinput` no-ops (no `preventDefault()`, no emit) while `presentation` is true, as defense-in-depth alongside the host suppression attributes.
7. **Component-contract proof.** `MDCheckbox.test.ts` exists at the owner-local path with contract coverage (independently confirmed present; not re-executed in this pass — see "Stage verification").
8. **Test-environment seam decision.** `MDCheckbox.testUtils.ts` exists as a family-local `ElementInternals` construction-support shim, matching the architecture-recorded duplicate-not-promote decision.
9. **Stories.** `MDCheckbox.stories.ts` exists at the owner-local path covering the selected surface.
10. **Visual proof at the legacy central location.** `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` exists (confirmed present by direct filesystem check), not an owner-local `MDCheckbox.visual.spec.ts`, matching architecture's selected placement.
11. **This file** — refreshed under the current architecture revision.

## Public API implemented

Unchanged from the current runtime, independently re-read from `MDCheckbox.vue` during this pass:

- Canonical export: `MDCheckbox` from `@shared/ui/material` (via `components/checkbox/index.ts`'s `export { default as MDCheckbox } from './MDCheckbox.vue'`, re-exported by the root barrel).
- Props: `checked` (`boolean`, default `false`, controlled one-directionally via `update:checked`); `indeterminate` (`boolean`, default `false`, controlled one-directionally via `update:indeterminate`, always resolves to `false` on a real user activation); `disabled` (`boolean`, default `false`); `presentation` (`boolean`, default `false`, Mioframe composition extension). All four props are declared with `withDefaults(defineProps<...>(), {...})` exactly as documented.
- Slots: none.
- Emits: `update:checked(value: boolean)` and `update:indeterminate(value: boolean)`, fired together from the renderer's cancelable `beforeinput` intent, computed pre-mutation. Never fire while `presentation` is true; never reachable while `disabled` is true (renderer-side guard, not adapter-side).
- Root: one semantic `m3e-checkbox`; no wrapper element; no `defineExpose`.
- Host boundary: `inheritAttrs: false`; only merged `class`/`style`, `id`, `title`, `data-*`, `aria-label`, and `aria-labelledby` reach the host, confirmed by direct reading of `getForwardedAttrs()`/`getMergedAttrs()`.

## Tokens and renderer mappings

Unchanged: no `components/checkbox/tokens.css` file and no `docs/token-api.md` change exist, matching `ARCHITECTURE.md`'s zero-token selection (confirmed: no such file present in the component directory listing). The renderer resolves default coloring directly from Mioframe's already-public `--md-sys-color-*` foundation tokens.

Renderer mapping, independently re-confirmed against `ARCHITECTURE.md`'s "Renderer mapping and gaps" table by reading `MDCheckbox.vue` and `m3eCheckbox.d.ts` directly:

- `checked`/`indeterminate` → renderer Boolean properties, one-directionally (props → renderer only); `update:checked`/`update:indeterminate` derived from the renderer's cancelable `beforeinput`, intercepted with `event.preventDefault()` before the renderer's own mutation branch can execute.
- `disabled` → renderer `disabled` Boolean property; the renderer's own guard blocks its internal toggle and `beforeinput` dispatch before either can occur while disabled.
- Native click and Space-key toggle (not Enter): unchanged, `direct`, no wrapper involvement.
- Adjacent-label click-to-toggle: `direct`, unchanged.
- Adjacent-label accessible-name computation: confirmed `divergent` (`M3E-005`), not relied upon; `aria-label`/`aria-labelledby` is the selected backstop.
- Accessible name via `aria-label`/`aria-labelledby`: `direct`, forwarded via the host-attribute allow-list.
- Native `role="checkbox"`: `direct`, renderer-owned.
- 48×48dp interactive target: `direct`, renderer-owned.
- `presentation` (Mioframe extension, `not-applicable` to the renderer): wrapper-owned `tabindex="-1"`, `aria-hidden="true"`, host CSS `pointer-events: none`, plus the `beforeinput` handler's no-op guard — all independently confirmed present in the current `MDCheckbox.vue`.
- No `name`, `value`, `required`, error/invalid, or icon-configuration surface is exposed or wired (confirmed absent from the current props/emits declarations).

Private typing seam (`m3eCheckbox.d.ts`), independently re-read: `onBeforeinput?: (event: Event) => void` (documenting the plain-`Event`, not `InputEvent`, dispatch type), plus `checked`/`indeterminate`/`disabled` derived from `Pick<M3eCheckboxElement, 'checked' | 'indeterminate' | 'disabled'>`. This matches `ARCHITECTURE.md`'s documented private-typing-seam requirement exactly.

## Dependencies

Unchanged:

- Material foundation: supplies the `--md-sys-color-*` roles the renderer consumes directly; not an official component-family dependency.
- `@m3e/web@2.6.3` (`@m3e/web/checkbox`): private renderer boundary; `M3eCheckboxElement` provides package-derived glue for `checked`/`indeterminate`/`disabled` typing and the `instanceof` runtime-narrowing target for the `beforeinput` handler.
- Dependency queue: none. No other Material family is composed by or required by Checkbox at this stage.

## Component-owned proof

Independently confirmed present at the owner-local paths `ARCHITECTURE.md` requires, by direct filesystem/content inspection during this pass (not re-executed — see "Stage verification" for why a fresh run was not required):

- `MDCheckbox.test.ts` (owner-local component-contract proof).
- `MDCheckbox.testUtils.ts` (family-local `ElementInternals` construction-support shim).
- `MDCheckbox.browser.spec.ts` (owner-local browser proof, cross-referenced by the `M3E-005` entry in `docs/m3e-defects.md`).
- `MDCheckbox.stories.ts` (owner-local stories).
- `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` (legacy-central visual proof).
- `eslint.config.test.ts` line 102: `m3e-checkbox` is covered by the renderer-boundary-rule test alongside `m3e-button`/`m3e-loading-indicator`/`m3e-switch`.
- `docs/m3e-defects.md`: complete `M3E-005` entry (summary row + full registry body), cross-referencing `MDCheckbox.browser.spec.ts`.

Operator visual status: no-reported-defect (unchanged; no new visual baseline was generated or needed in this pass).

## Stage verification

No production, type-declaration, test, story, or visual-spec file was changed by this revalidation-only pass, so no new implementation-owned `TEST IMPACT` exists and no new focused verifier run was required to prove a code change — there is no diff to verify. This pass's proof consists entirely of direct, independent re-inspection of the existing files against the current (re-issued) `ARCHITECTURE.md` revision, itemized above, which found the current state already conforms with zero gap.

The previously-recorded focused verification results (type-check, eslint, format, unit-tests, storybook-build, storybook-behavior, visual — all passing, as recorded in the superseded `IMPLEMENTATION.md` revision `2026-08-12T19:30:00.000Z`) remain the last known-passing record for these unchanged files; this pass did not invalidate them because it made no edit. Re-running the full focused-check suite against an unchanged file set is not required by `docs/component-adapter.md`'s "Verification contract," which scopes focused proof to what implementation supplies for a given pass; this pass supplies no new code, only a corrected artifact-authorship record.

## Architecture deviations

None. Independently re-verified: every selected contract in `ARCHITECTURE.md` revision `2026-08-12T22:00:00.000Z`'s "Selected and deferred Material surface" and "Renderer mapping and gaps" tables is implemented exactly as `MDCheckbox.vue`, `m3eCheckbox.d.ts`, and the owner-local proof files currently exist — checked by direct reading during this pass, not by trusting the superseded artifact's claims. The re-issued architecture revision's content is substantively identical to the revision the current code was originally built against (same selected surface, same public API, same tokens, same `M3E-005` classification); only the architecture artifact's own authorship/revision changed, which this refresh now correctly cites.

## Remaining blockers

None.

## Migration readiness

Ready. Runtime, private typing, the Checkbox-owned test seam, owner-local browser/story proof, and the legacy-central visual baseline all independently re-confirmed present and matching `ARCHITECTURE.md` revision `2026-08-12T22:00:00.000Z` during this pass. Consumer migration and legacy removal are recorded separately in this family's `MIGRATION.md` (which this implementation-stage worker did not re-open or re-verify — migration-stage ownership is out of scope for this stage).
