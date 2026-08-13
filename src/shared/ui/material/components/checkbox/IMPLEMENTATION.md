# Checkbox implementation

Artifact revision: 2026-08-12T20:09:02.171Z
Status: complete
ARCHITECTURE.md reference: `src/shared/ui/material/components/checkbox/ARCHITECTURE.md`
ARCHITECTURE.md revision: 2026-08-12T20:06:50.783Z
Revision summary: Durable-continuation refresh required by `ARCHITECTURE.md`'s fresh `Artifact revision` (`2026-08-12T20:06:50.783Z`, re-issued after the prior `IMPLEMENTATION.md`'s own `Artifact revision`, `2026-08-12T23:55:00.000Z`, was found later than the actual runtime UTC clock and therefore mechanically invalid). This fresh implementation-stage worker independently re-read the new `ARCHITECTURE.md` in full and confirmed its only content change versus the prior architecture revision is the addition of an explicit legacy-to-canonical semantic translation for `BooleanValueInline.vue` (Current scenarios scenario 4, Migration plan step 5: `checked = effectiveValue === true`; `indeterminate = property.indeterminate === true && effectiveValue === undefined`) — a consumer-owned translation that `BooleanValueInline.vue` itself (a migration-stage, `databaseBoolean`-entity concern) must apply, not `MDCheckbox`. No row in "Selected and deferred Material surface," "Public Vue API," "Public token contract," or "Renderer mapping and gaps" changed. This worker independently re-verified `MDCheckbox`'s own selected surface, public Vue API, tokens, and renderer mapping remain unchanged from the current runtime by reading `MDCheckbox.vue`, `components/checkbox/index.ts`, `m3eCheckbox.d.ts`, `config/vueCustomElements.ts`, `docs/m3e-defects.md`, `eslint.config.test.ts`, and `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` directly, and by confirming the test titles present in `MDCheckbox.test.ts` and `MDCheckbox.browser.spec.ts` still cover exactly the contracts this architecture requires. This is a revalidation-only refresh: no production, type-declaration, test, story, or visual-spec file required any change.

Remaining blockers: none
Required return family: none
Required return stage: none
Architecture deviations: none
Migration readiness: ready

## Independent re-confirmation method

This worker did not assume the prior (superseded) `IMPLEMENTATION.md`'s claims were still accurate merely because its prose sounded complete. It independently re-read, directly from the current workspace:

1. `ARCHITECTURE.md` (revision `2026-08-12T20:06:50.783Z`) in full, including its revision summary explaining the substantive change (the `BooleanValueInline.vue` translation) versus the prior architecture revision. Confirmed by diff-reading against the prior artifact's recorded content that only "Current scenarios" scenario 4 and "Migration plan" step 5 changed, adding the explicit `checked`/`indeterminate` translation formula for that one consumer. No "Selected and deferred Material surface" row, no "Public Vue API" prop/emit, no "Public token contract" line, and no "Renderer mapping and gaps" row changed.
2. `MDCheckbox.vue` line-by-line: `checked`/`indeterminate`/`disabled`/`presentation` props with the exact documented defaults and TSDoc; `inheritAttrs: false`; the explicit `getForwardedAttrs()` allow-list (`id`, `title`, `aria-label`, `aria-labelledby`, `data-*`); `class`/`style` merged in the template (never spread via `$attrs`); the `onBeforeinput` handler that runtime-narrows `event.target` with `instanceof M3eCheckboxElement`, no-ops before computing anything when `presentation` is true, otherwise calls `preventDefault()` before emitting `update:checked(!event.target.checked)` and `update:indeterminate(false)`; the `presentationAttrs`/`getMergedAttrs()` composition; the scoped `.md-checkbox_presentation { pointer-events: none; }` style. Matches `ARCHITECTURE.md`'s Public Vue API, Host-attribute boundary, and State precedence and restoration sections exactly.
3. `components/checkbox/index.ts`: sole canonical export `export { default as MDCheckbox } from './MDCheckbox.vue'`.
4. `m3eCheckbox.d.ts`: `RendererCheckboxProps` derived from `Pick<M3eCheckboxElement, 'checked' | 'indeterminate' | 'disabled'>`; explicit `onBeforeinput?: (event: Event) => void` (plain `Event`, not `InputEvent`, matching the documented private typing seam); `GlobalComponents['m3e-checkbox']` declared for template type-checking.
5. `config/vueCustomElements.ts` (repository root): `selectedM3eCustomElements = new Set(['m3e-button', 'm3e-checkbox', 'm3e-loading-indicator', 'm3e-switch'])` and the `isM3eCustomElement` predicate — `m3e-checkbox` is present, unchanged.
6. `eslint.config.test.ts` line 102: `it.each(['m3e-button', 'm3e-checkbox', 'm3e-loading-indicator', 'm3e-switch'])` — the renderer-boundary allowlist test still covers `m3e-checkbox`.
7. `docs/m3e-defects.md`: the complete `M3E-005` entry (summary-table row at line 75 and full registry body starting line 258) is present, cross-referencing `MDCheckbox.browser.spec.ts`'s exact test title.
8. `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts`: confirmed present at the legacy-central location architecture selects.
9. `MDCheckbox.test.ts` (278 lines) and `MDCheckbox.browser.spec.ts` (285 lines): read every `describe`/`it`/`test` title and confirmed they cover exactly the contracts `ARCHITECTURE.md`'s "Proof ownership" and "TEST IMPACT" sections require — demand-scoped defaults, Boolean-property (not attribute) mapping, cancelable-`beforeinput`-derived intent computed pre-mutation, rejected-intent non-mutation, `disabled`/`presentation` non-emission, host-attribute allow-list/rejection matrix including duplicate-listener rejection, click/Space producing exactly one intent pair, an explicit Enter-no-op assertion, accessible name via `aria-label`/`aria-labelledby`, the `M3E-005` native-`<label>` non-functional-name evidence, adjacent-label click-to-toggle, rejected-intent real-browser proof, disabled/presentation Tab-unreachability, presentation pointer/accessibility-tree unreachability, the presentation composition fixture proving pointer-pass-through and state flow-back, the 48×48dp target, and undeclared-dynamic-input rejection.
10. `MDCheckbox.testUtils.ts` (81 lines) and `MDCheckbox.stories.ts` (334 lines): confirmed present at the owner-local paths architecture requires.

No production, type-declaration, test, story, or visual-spec file was edited during this pass. The independent inspection found the current state already conforms to the re-issued architecture revision; the only substantive architecture change (the `BooleanValueInline.vue` consumer translation) has no bearing on `MDCheckbox`'s own selected surface, public API, tokens, or renderer mapping, and is correctly scoped to the migration stage.

## Implemented passes

All of `ARCHITECTURE.md`'s "Implementation passes" #1–#11 remain implemented unchanged, independently re-confirmed against the current architecture revision by direct file inspection as described above:

1. **Adapter creation.** `MDCheckbox.vue`, `components/checkbox/index.ts`, and the root `@shared/ui/material` barrel export exist; `M3eCheckboxElement` is imported from `@m3e/web/checkbox` for private typed mapping; `m3e-checkbox` is declared in `m3eCheckbox.d.ts`'s `GlobalComponents` for template type-checking and separately registered in `config/vueCustomElements.ts`'s `selectedM3eCustomElements` allowlist, wired into Vue's `compilerOptions.isCustomElement` by `config/plugins/base.ts`. One semantic renderer host, no wrapper element.
2. **Host-attribute boundary.** `inheritAttrs: false`; `getForwardedAttrs()` allow-lists exactly `id`, `title`, `aria-label`, `aria-labelledby`, `data-*`; `class`/`style` merged in the template; no `v-bind="$attrs"` spread.
3. **Tri-state controlled mapping.** `checked`/`indeterminate`/`disabled` bound one-directionally into the renderer template root; `onBeforeinput` bound directly on the template root, runtime-narrows `event.target`, no-ops under `presentation`, otherwise `preventDefault()`s before emitting the intended next values. No wrapper-owned shadow state, no repair watcher.
4. **Browser proof for click/Space/Enter.** `MDCheckbox.browser.spec.ts` covers click/Space producing one intent pair and an explicit Enter no-op assertion.
5. **Adjacent-label browser proof and accessible-name evidence.** `M3E-005` entry present and complete in `docs/m3e-defects.md`, cross-referencing `MDCheckbox.browser.spec.ts`. Architecture's "Selected and deferred Material surface" and "Renderer mapping and gaps" rows already read `divergent`/`M3E-005` in the current architecture revision.
6. **Presentation composition fixture.** `presentationAttrs` sets `aria-hidden`/`tabindex="-1"` under `presentation`; `.md-checkbox_presentation { pointer-events: none; }` present; `onBeforeinput` no-ops under `presentation` as defense-in-depth.
7. **Component-contract proof.** `MDCheckbox.test.ts` covers the full contract matrix (see "Independent re-confirmation method" item 9).
8. **Test-environment seam decision.** `MDCheckbox.testUtils.ts` exists as a family-local `ElementInternals` construction-support shim, matching the architecture-recorded duplicate-not-promote decision.
9. **Stories.** `MDCheckbox.stories.ts` exists at the owner-local path.
10. **Visual proof at the legacy central location.** `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` exists, matching architecture's selected placement.
11. **This file** — refreshed under the current architecture revision.

## Public API implemented

Unchanged from the current runtime, independently re-read from `MDCheckbox.vue` during this pass:

- Canonical export: `MDCheckbox` from `@shared/ui/material`.
- Props: `checked` (`boolean`, default `false`, controlled one-directionally via `update:checked`); `indeterminate` (`boolean`, default `false`, controlled one-directionally via `update:indeterminate`, always resolves to `false` on a real user activation); `disabled` (`boolean`, default `false`); `presentation` (`boolean`, default `false`, Mioframe composition extension).
- Slots: none.
- Emits: `update:checked(value: boolean)` and `update:indeterminate(value: boolean)`, fired together from the renderer's cancelable `beforeinput` intent, computed pre-mutation. Never fired while `presentation` is true; never reachable while `disabled` is true.
- Root: one semantic `m3e-checkbox`; no wrapper element; no `defineExpose`.
- Host boundary: `inheritAttrs: false`; only merged `class`/`style`, `id`, `title`, `data-*`, `aria-label`, and `aria-labelledby` reach the host.

## Tokens and renderer mappings

Unchanged: no `components/checkbox/tokens.css` file and no `docs/token-api.md` change, matching `ARCHITECTURE.md`'s zero-token selection (confirmed: no such file present in the component directory listing). The renderer resolves default coloring directly from Mioframe's already-public `--md-sys-color-*` foundation tokens.

Renderer mapping, independently re-confirmed against `ARCHITECTURE.md`'s "Renderer mapping and gaps" table:

- `checked`/`indeterminate` → renderer Boolean properties, one-directionally; `update:checked`/`update:indeterminate` derived from the renderer's cancelable `beforeinput`, intercepted with `preventDefault()` before the renderer's own mutation branch can execute.
- `disabled` → renderer `disabled` Boolean property; the renderer's own guard blocks its internal toggle and `beforeinput` dispatch before either can occur while disabled.
- Native click and Space-key toggle (not Enter): `direct`, unchanged.
- Adjacent-label click-to-toggle: `direct`, unchanged.
- Adjacent-label accessible-name computation: `divergent` (`M3E-005`), not relied upon; `aria-label`/`aria-labelledby` is the selected backstop.
- Accessible name via `aria-label`/`aria-labelledby`: `direct`, forwarded via the host-attribute allow-list.
- Native `role="checkbox"`: `direct`, renderer-owned.
- 48×48dp interactive target: `direct`, renderer-owned.
- `presentation` (Mioframe extension, `not-applicable` to the renderer): wrapper-owned `tabindex="-1"`, `aria-hidden="true"`, host CSS `pointer-events: none`, plus the `beforeinput` handler's no-op guard.
- No `name`, `value`, `required`, error/invalid, or icon-configuration surface is exposed or wired.

Private typing seam (`m3eCheckbox.d.ts`), independently re-read: `onBeforeinput?: (event: Event) => void` (plain `Event`, not `InputEvent`), plus `checked`/`indeterminate`/`disabled` derived from `Pick<M3eCheckboxElement, 'checked' | 'indeterminate' | 'disabled'>`. Matches `ARCHITECTURE.md`'s documented private-typing-seam requirement exactly.

## Dependencies

Unchanged:

- Material foundation: supplies the `--md-sys-color-*` roles the renderer consumes directly; not an official component-family dependency.
- `@m3e/web@2.6.3` (`@m3e/web/checkbox`): private renderer boundary; `M3eCheckboxElement` provides package-derived glue for `checked`/`indeterminate`/`disabled` typing and the `instanceof` runtime-narrowing target for the `beforeinput` handler.
- Dependency queue: none. No other Material family is composed by or required by Checkbox at this stage.

## Component-owned proof

Independently confirmed present at the owner-local paths `ARCHITECTURE.md` requires, by direct filesystem/content inspection during this pass:

- `MDCheckbox.test.ts` (owner-local component-contract proof, 278 lines, test titles independently read and cross-checked against architecture's "Proof ownership" requirements).
- `MDCheckbox.testUtils.ts` (family-local `ElementInternals` construction-support shim, 81 lines).
- `MDCheckbox.browser.spec.ts` (owner-local browser proof, 285 lines, test titles independently read; cross-referenced by the `M3E-005` entry in `docs/m3e-defects.md`).
- `MDCheckbox.stories.ts` (owner-local stories, 334 lines).
- `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` (legacy-central visual proof).
- `eslint.config.test.ts` line 102: `m3e-checkbox` covered by the renderer-boundary-rule test alongside `m3e-button`/`m3e-loading-indicator`/`m3e-switch`.
- `docs/m3e-defects.md`: complete `M3E-005` entry (summary row + full registry body), cross-referencing `MDCheckbox.browser.spec.ts`.

Operator visual status: no-reported-defect (unchanged; no new visual baseline was generated or needed in this pass).

## Stage verification

No production, type-declaration, test, story, or visual-spec file was changed by this revalidation-only pass, so no new implementation-owned `TEST IMPACT` exists and no new focused verifier run was required to prove a code change — there is no diff to verify. This pass's proof consists entirely of direct, independent re-inspection of the existing files against the current (re-issued) `ARCHITECTURE.md` revision, itemized above, which found the current state already conforms with zero gap and confirmed the one substantive architecture change (the `BooleanValueInline.vue` consumer translation) does not touch any Checkbox-owned file.

The previously-recorded focused verification results (type-check, eslint, format, unit-tests, storybook-build, storybook-behavior, visual — all passing, as recorded in `IMPLEMENTATION.md` revision `2026-08-12T19:30:00.000Z`, the last revision that changed actual code/proof content) remain the last known-passing record for these unchanged files; this pass did not invalidate them because it made no edit. Re-running the full focused-check suite against an unchanged file set is not required by `docs/component-adapter.md`'s "Verification contract," which scopes focused proof to what implementation supplies for a given pass; this pass supplies no new code, only a corrected artifact-authorship record citing the current architecture revision.

## Architecture deviations

None. Independently re-verified: every selected contract in `ARCHITECTURE.md` revision `2026-08-12T20:06:50.783Z`'s "Selected and deferred Material surface," "Public Vue API," "Public token contract," and "Renderer mapping and gaps" sections is implemented exactly as `MDCheckbox.vue`, `m3eCheckbox.d.ts`, and the owner-local proof files currently exist. The re-issued architecture revision's only substantive content change (the `BooleanValueInline.vue` consumer-owned semantic translation, added to "Current scenarios" scenario 4 and "Migration plan" step 5) is a migration-stage concern owned by that consumer, not by `MDCheckbox`; it introduces no new implementation-stage obligation.

## Remaining blockers

None.

## Migration readiness

Ready. Runtime, private typing, the Checkbox-owned test seam, owner-local browser/story proof, and the legacy-central visual baseline all independently re-confirmed present and matching `ARCHITECTURE.md` revision `2026-08-12T20:06:50.783Z` during this pass. The migration stage must apply the architecture's newly explicit `BooleanValueInline.vue` translation (`checked = effectiveValue === true`; `indeterminate = property.indeterminate === true && effectiveValue === undefined`) when it migrates that consumer; this implementation-stage worker did not migrate any consumer and did not re-open `MIGRATION.md` (out of scope for this stage).
