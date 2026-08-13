# Checkbox implementation

Status: complete
ARCHITECTURE.md reference: `src/shared/ui/material/components/checkbox/ARCHITECTURE.md`
Revision summary: Fresh, independent implementation pass per `material-component-implementation`: every implementation pass, public API surface, renderer mapping, and TEST IMPACT item in current `ARCHITECTURE.md` was independently re-derived against current `MDCheckbox.vue`, `m3eCheckbox.d.ts`, `config/vueCustomElements.ts`, and every colocated proof/story file, not trusted from the prior artifact's prose. Every architecture-selected pass is already correctly implemented; this pass made no production edit. This revision drops the legacy `Artifact revision`/`ARCHITECTURE.md revision` timestamp fields that `docs/component-workflow.md` no longer defines as control fields.
Remaining blockers: none
Required return family: none
Required return stage: none
Architecture deviations: none
Migration readiness: ready

## Implemented passes

All eleven of `ARCHITECTURE.md`'s "Implementation passes" are implemented and independently re-confirmed present by this pass reading the current files directly:

1. **Adapter creation.** `components/checkbox/MDCheckbox.vue` imports `M3eCheckboxElement` from `@m3e/web/checkbox` for private typed narrowing; `m3e-checkbox` is registered in `config/vueCustomElements.ts`'s `selectedM3eCustomElements` set alongside `m3e-button`/`m3e-loading-indicator`/`m3e-switch`; `components/checkbox/index.ts` exports `MDCheckbox`, and the root `src/shared/ui/material/index.ts` barrel re-exports it. One semantic `m3e-checkbox` host; package-derived types throughout.
2. **Host-attribute boundary.** `defineOptions({ inheritAttrs: false })`; `getForwardedAttrs()` allow-lists exactly `id`, `title`, `aria-label`, `aria-labelledby`, and every `data-*` key; `class`/`style` are merged in the template (`['md-checkbox', ..., attrs.class]`, `:style="attrs.style"`) so the adapter-owned class always wins; every other attribute/listener is dropped.
3. **One-directional `checked`/`indeterminate`/`disabled` mapping and `beforeinput` intent handler.** `:checked="props.checked"`, `:indeterminate="props.indeterminate"`, `:disabled="props.disabled"` bind as typed Boolean properties into the renderer only. `onBeforeinput` runtime-narrows `event.target` with `instanceof M3eCheckboxElement`, no-ops (no `preventDefault()`, no emit) when `props.presentation` is true, otherwise calls `event.preventDefault()` before computing `!event.target.checked`/`false` and emitting `update:checked`/`update:indeterminate`. No wrapper-owned toggle logic, no `watch`/`watchEffect` repair. `m3eCheckbox.d.ts` declares the required private `onBeforeinput?: (event: Event) => void` renderer event-prop (the renderer dispatches a plain `Event`, not `InputEvent`). `presentationAttrs` computed sets `tabindex="-1"`/`aria-hidden="true"` only when `presentation` is true.
4. **Click/Space/Enter browser proof.** `MDCheckbox.browser.spec.ts` proves click and Space each produce exactly one `update:checked`/`update:indeterminate` intent pair through the real renderer lifecycle, and explicitly asserts Enter produces no effect (`changeCount` stays `'0'`) — correctly diverging from Switch's Enter-inclusive proof per the renderer's `KeyboardClick(..., false)` composition.
5. **Adjacent-label and accessible-name browser proof.** The `AdjacentLabel` story/spec proves external `<label for>` click-to-toggle activation; the `BehaviorContracts` story/spec proves accessible-name resolution from `aria-labelledby`/`aria-label` and disabled non-activation; a dedicated test proves native `<label for>` association does **not** resolve an accessible name (`toHaveAccessibleName('')`), confirming the informational check landed on `divergent` and is recorded as `M3E-005` in `docs/m3e-defects.md` (complete entry, cross-referenced from this architecture).
6. **Presentation composition fixture.** `PresentationComposition` story + its browser spec test prove real pointer input on the decorative region reaches the fixture owner's own action, the owner's state flows back into `checked`, and the decorative renderer never independently toggles (`readChecked()` stays in lockstep with the owner's `aria-checked`).
7. **Component-contract proof audit.** `MDCheckbox.test.ts` covers props/defaults, Boolean-property (not attribute) mapping, single-emission-pair `beforeinput`-derived intent computed pre-mutation, rejected-intent non-mutation, `presentation`/`disabled` non-emission, the complete host-attribute allow-list/rejection matrix (including duplicate-listener rejection and dynamic add/remove/re-add), and forbidden renderer surface (`name`, `value`, `required`).
8. **Test-environment seam decision.** `MDCheckbox.testUtils.ts`'s `installCheckboxElementInternalsShim()` is a Checkbox-local duplicate of Switch's identical minimal `attachInternals()` construction shim, with an explicit recorded rationale for not promoting it (promotion would require editing the already-complete, independently reviewed Switch family's own test file from a single-family implementation-stage worker) — the promote-or-duplicate decision architecture required is made and documented, not silently skipped.
9. **Stories.** `MDCheckbox.stories.ts` covers exactly the selected surface (`Default` Playground with `useArgs` round-trip, `Checked`, `Indeterminate`, `Disabled`, `Presentation`, `PresentationComposition`, `RejectedIntent`, `BehaviorContracts`, `AdjacentLabel`, `TabOrderFixture`, `TargetHitArea`, `HostAttributeBoundary`, `VisualStates`, `RealInteractionFeedback`). No icon/error/readonly/form-participation story exists.
10. **Owner-local visual proof.** `components/checkbox/MDCheckbox.visual.spec.ts` with colocated `MDCheckbox.visual.spec.ts-snapshots/` (`md-checkbox-states-linux.png`, `md-checkbox-hover-linux.png`, `md-checkbox-focus-linux.png`, `md-checkbox-pressed-linux.png`) covers selected/unselected/indeterminate/disabled/presentation states plus real hover/focus/pressed feedback. No legacy central `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` remains (confirmed absent); `docs/testing/migration-plan.md`'s S4-B section already records this owner-local ownership as complete and historical, not a stale pending-authorization claim.
11. **This `IMPLEMENTATION.md`.**

## Public API implemented

- Canonical export: `MDCheckbox` from `@shared/ui/material`.
- Props: `checked` (`boolean`, default `false`, controlled one-directionally via `update:checked`); `indeterminate` (`boolean`, default `false`, controlled one-directionally via `update:indeterminate`, always resolves to `false` on a real user activation); `disabled` (`boolean`, default `false`); `presentation` (`boolean`, default `false`, Mioframe composition extension).
- Slots: none.
- Emits: `update:checked(value: boolean)` and `update:indeterminate(value: boolean)`, fired together from the renderer's cancelable `beforeinput` intent, computed pre-mutation, never a post-mutation read. Never fired while `presentation` is true; never reachable while `disabled` is true (renderer's own guard blocks `beforeinput` dispatch first).
- Root: one semantic `m3e-checkbox`; no wrapper element; no `defineExpose`.
- Host boundary: `inheritAttrs: false`; only merged `class`/`style`, `id`, `title`, `data-*`, `aria-label`, and `aria-labelledby` reach the host; every other attribute/listener (including a duplicate `beforeinput`/`change`/`click`) is dropped.

## Tokens and renderer mappings

No `components/checkbox/tokens.css` file exists and no `docs/token-api.md` entry references Checkbox, matching architecture's selection of zero `--md-comp-checkbox-*` tokens (the renderer resolves correct defaults directly from already-public `--md-sys-color-*` foundation tokens). `checked`/`indeterminate`/`disabled` map as typed Boolean properties (not dashed attributes) in `m3eCheckbox.d.ts`'s `RendererCheckboxProps` (`Pick<M3eCheckboxElement, 'checked' | 'indeterminate' | 'disabled'>`); the private `onBeforeinput?: (event: Event) => void` renderer event-prop is declared to match the renderer's actual plain-`Event` dispatch (not the ambient `InputEvent` type). No renderer mapping changed this pass.

## Dependencies

- Material foundation: supplies the `--md-sys-color-*` roles the renderer consumes directly; not an official component-family dependency.
- `@m3e/web@2.6.3` (`@m3e/web/checkbox`): private renderer boundary; `M3eCheckboxElement` provides package-derived glue for `checked`/`indeterminate`/`disabled` typing and the `instanceof` runtime-narrowing target for the `beforeinput` handler.
- Dependency queue: none (`ARCHITECTURE.md` "Dependency closure").

## Component-owned proof

- `MDCheckbox.test.ts` — component-contract proof; present, passing.
- `MDCheckbox.testUtils.ts` — family-local `ElementInternals` construction-support shim; present.
- `MDCheckbox.browser.spec.ts` — owner-local browser proof (click/Space/Enter, adjacent-label activation, accessible name, `M3E-005` informational check, rejected intent, tab order, presentation isolation and composition, 48dp target, host-attribute boundary); present, passing.
- `MDCheckbox.stories.ts` — owner-local stories; present.
- `MDCheckbox.visual.spec.ts` with colocated `MDCheckbox.visual.spec.ts-snapshots/` (four baseline PNGs) — owner-local visual proof; present, passing with zero baseline diff.
- `eslint.config.test.ts` — renderer-boundary-rule test covers `m3e-checkbox` alongside `m3e-button`/`m3e-loading-indicator`/`m3e-switch`; present, passing.
- `docs/m3e-defects.md` — complete `M3E-005` entry (Checkbox adjacent-label accessible-name gap), cross-referenced from `ARCHITECTURE.md`.

Operator visual status: no-reported-defect.

## Stage verification

Focused verifier-managed checks run fresh this pass, confirming current code and proof without any production edit:

- `pnpm verify --only type-check` — passed.
- `pnpm verify --only unit-tests --files src/shared/ui/material/components/checkbox/MDCheckbox.test.ts` — passed.
- `pnpm verify --only storybook-behavior --files src/shared/ui/material/components/checkbox/MDCheckbox.browser.spec.ts` — passed (all browser-proof scenarios above, including click/Space/Enter, adjacent-label, accessible name, rejected intent, tab order, presentation, target hit area, host-attribute boundary).
- `pnpm verify --only visual --files src/shared/ui/material/components/checkbox/MDCheckbox.visual.spec.ts` — passed, zero baseline diff against the existing colocated snapshots.
- `pnpm verify --only eslint --files` (all colocated Checkbox family files plus `m3eCheckbox.d.ts`) — passed.
- `pnpm verify --only format --files` (same file set) — passed.
- `pnpm verify --only unit-tests --files eslint.config.test.ts` — passed (renderer-boundary rule coverage for `m3e-checkbox`).

No production file changed, so no fix-mode run was needed. This pass did not run the project-wide final completion gate (`pnpm verify`); that is the orchestrator's responsibility after all Material stages complete, per `src/shared/ui/material/AGENTS.md`.

## Architecture deviations

None. Every implementation pass, public API element, token/mapping decision, and TEST IMPACT item in current `ARCHITECTURE.md` is already correctly implemented and independently re-verified by this pass.

## Remaining blockers

None.

## Migration readiness

Ready. Zero unresolved architecture deviation; all component-owned proof passes fresh; `docs/m3e-defects.md`'s `M3E-005` entry and `docs/testing/migration-plan.md`'s S4-B section are both already current (independently re-confirmed by this pass), so migration stage has no stale documentation to correct that this stage owns.
