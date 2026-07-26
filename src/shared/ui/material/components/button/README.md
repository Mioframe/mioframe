# Button adapter contract

Family: Button

Migration target: `MDButton` (common label-bearing buttons only)

Renderer viability: `ready`

Implementation ownership: `legacy`

Current implementation owner: `src/shared/ui/Button/MDButton.vue`

Canonical owner after migration: `src/shared/ui/material/components/button/MDButton.vue`

Planned public export: `@shared/ui/material` → `MDButton`

## Required scenarios and boundary

The current contract requires ordinary pointer/Enter/Space activation, disabled behavior, native `button`/`submit`/`reset`, form association, a visible accessible label, optional leading icon, loading, controlled toggle selection, programmatic focus, five colors, five sizes, two shapes, active public Button token overrides, themes, and RTL icon placement.

No current repository consumer uses `MDButton` as a link. Link props are not required by this pilot. `MDIconButton`, `MDFab`, `MDExtendedFab`, button groups, segmented buttons, split buttons, and other Material families remain excluded.

## Sources and renderer assessment

Official Material records were read from the verified project Material cache captured `2026-07-20T16:16:49.323Z`: `/components/buttons/overview`, `/components/buttons/specs`, `/components/buttons/guidelines`, and `/components/buttons/accessibility`.

The renderer dependency range is `@m3e/web@^2.6.2`; the inspected lockfile version is `2.6.2`; the required family entry point is `@m3e/web/button`; and the registered element is `m3e-button`. Its peers are `lit@^3.3.0` and `tslib@^2.8.1`, both satisfied by the lockfile. The package declarations and Custom Elements Manifest document:

- variants `elevated`, `filled`, `tonal`, `outlined`, and `text`;
- sizes `extra-small`, `small`, `medium`, `large`, and `extra-large`;
- shapes `rounded` and `square`;
- reflected `toggle` and `selected` properties;
- default, `icon`, `selected`, `selected-icon`, and `trailing-icon` slots;
- disabled behavior, form-associated `button`/`submit`/`reset`, and link attributes;
- cancelable `beforeinput` before selected-state mutation, followed by `input` and `change` when not canceled;
- documented component and variant CSS custom properties for geometry, shape, color, elevation, outline, state layers, typography, and spacing;
- renderer-owned pressed-corner motion and reduced-motion behavior.

Those APIs cover the required behavioral and styling adapter surface. Loading remains a narrow Mioframe extension by making the renderer unavailable while busy, retaining the label, rendering progress content, and exposing `aria-busy`. A controlled adapter cancels `beforeinput`, emits `update:selected`, and keeps the Vue `selected` prop authoritative.

## Legacy token classification

The legacy implementation declares these official per-size tokens:

- `--md-comp-button-<size>-pressed-container-corner-size-motion-spring-stiffness`;
- `--md-comp-button-<size>-pressed-container-corner-size-motion-spring-damping`.

They are not active public migration contracts:

| Material meaning                | Mioframe token                                                                  | Renderer owner                   | Legacy evidence                                                            | Consumer evidence                                   | Decision                                |
| ------------------------------- | ------------------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------- |
| pressed-corner spring stiffness | `--md-comp-button-<size>-pressed-container-corner-size-motion-spring-stiffness` | m3e renderer-owned Button motion | declared; value-only visual test; not used by the actual legacy transition | no repository override or documented consumer found | remove as obsolete target-owned surface |
| pressed-corner spring damping   | `--md-comp-button-<size>-pressed-container-corner-size-motion-spring-damping`   | m3e renderer-owned Button motion | declared; value-only visual test; not used by the actual legacy transition | no repository override or documented consumer found | remove as obsolete target-owned surface |

The legacy `border-radius` transition uses duration/easing variables rather than these stiffness/damping declarations. The existing test proves only that the declarations resolve to system-token values; it does not prove that an override changes motion. Their absence from m3e's public Button CSS inputs is therefore not an upstream blocker.

m3e owns the observable pressed-corner motion. The adapter must verify press/release, interruption or stable final state, and reduced-motion behavior without reproducing or asserting private spring coefficients.

## Planned mapping

| Mioframe Vue contract                     | m3e public contract                                     | Direction | Owner             | Notes                                                                         |
| ----------------------------------------- | ------------------------------------------------------- | --------- | ----------------- | ----------------------------------------------------------------------------- |
| `color`                                   | `variant` property                                      | Vue → m3e | Mioframe          | Exact five-value mapping.                                                     |
| `shape` (`round` or `square`)             | `shape` (`rounded` or `square`)                         | Vue → m3e | Mioframe          | Private vocabulary normalization.                                             |
| `size`                                    | `size` property                                         | Vue → m3e | Mioframe          | Exact five-value mapping.                                                     |
| toggle `selected`                         | `toggle`, `selected`, cancelable `beforeinput`          | both      | Consumer/Mioframe | Cancel renderer mutation, emit controlled intent, prop remains authoritative. |
| `disabled` / loading                      | `disabled` plus host `aria-busy`                        | Vue → m3e | Mioframe          | Loading remains a justified project extension.                                |
| `nativeType`                              | form-associated `type`                                  | Vue → m3e | Browser/m3e       | `button`, `submit`, or `reset`.                                               |
| label and icon                            | default and `icon` slots                                | Vue → m3e | Mioframe          | Leading icon only.                                                            |
| public Button color/shape/geometry tokens | documented semantically equivalent Button CSS variables | Vue → m3e | Mioframe          | Private component-local bridge.                                               |
| shared system roles                       | documented Material system-token semantics              | Vue → m3e | theme/m3e         | Prefer direct `--md-sys-*` semantics where supported.                         |
| pressed-corner motion                     | renderer-owned public behavior                          | m3e       | m3e               | No retained Mioframe stiffness/damping tuning contract.                       |

## Consumers and migration state

Production consumers still use `@shared/ui/Button` in entities, features, pages, widgets, and generic shared UI, including form submission in `DatabaseViewAddForm.vue` and `DialogForm.vue`, loading in `DialogForm.vue`, leading-icon compositions, and overlay/menu anchor refs.

No consumer has been migrated yet and no legacy file has been removed. Implementation ownership remains `legacy` until the adapter, all consumers, proof, and obsolete-owner removal are completed atomically.

## Required implementation and verification

The implementation must:

1. create the canonical thin Vue adapter and import only `@m3e/web/button`;
2. preserve the required Vue, controlled-state, native form, disabled, loading, focus, icon, theme, and RTL scenarios;
3. privately map active public Mioframe tokens to documented semantically equivalent m3e CSS variables;
4. remove the obsolete stiffness/damping declarations and their value-only test;
5. migrate every `MDButton` consumer and public export;
6. remove only `MDButton`-exclusive legacy implementation, stories, tests, styles, and compatibility paths;
7. preserve unrelated Button-family components and shared modules.

Required proof remains: colocated component-contract proof; real-browser keyboard/focus/form/controlled-state/disabled/loading and motion-lifecycle proof; concise visual coverage with reviewed baselines; active token overrides proven through rendered effects; representative consumer proof; m3e boundary guard; production and Storybook builds; and final repository verification.

Unresolved: none.
