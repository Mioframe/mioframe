# Button adapter contract

Family: Button

Migration target: `MDButton` (common label-bearing buttons only)

Renderer viability: `ready`

Implementation ownership: `migrated`

Current implementation owner: `src/shared/ui/material/components/button/MDButton.vue`

Canonical owner after migration: `src/shared/ui/material/components/button/MDButton.vue`

Public export: `@shared/ui/material` → `MDButton`

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

Those APIs cover the required behavioral and styling adapter surface. Loading remains a narrow Mioframe extension: the adapter retains the label, renders progress content, exposes `aria-busy`, and preserves the current enabled activation contract unless `disabled` is also set. A controlled adapter cancels `beforeinput`, emits `update:selected`, and keeps the Vue `selected` prop authoritative.

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
| `disabled` / loading                      | `disabled` plus host `aria-busy`                        | Vue → m3e | Mioframe          | Loading alone remains actionable; explicit `disabled` blocks activation.      |
| `nativeType`                              | form-associated `type`                                  | Vue → m3e | Browser/m3e       | `button`, `submit`, or `reset`.                                               |
| label and icon                            | default and `icon` slots                                | Vue → m3e | Mioframe          | Leading icon only.                                                            |
| public Button color/shape/geometry tokens | documented semantically equivalent Button CSS variables | Vue → m3e | Mioframe          | Private component-local bridge.                                               |
| shared system roles                       | documented Material system-token semantics              | Vue → m3e | theme/m3e         | Prefer direct `--md-sys-*` semantics where supported.                         |
| pressed-corner motion                     | renderer-owned public behavior                          | m3e       | m3e               | No retained Mioframe stiffness/damping tuning contract.                       |

## Consumers and migration state

All production, shared-UI, playground, and story consumers now use `@shared/ui/material`, including form submission in `DatabaseViewAddForm.vue` and `DialogForm.vue`, loading in `DialogForm.vue`, leading-icon compositions, and overlay/menu anchor refs. The obsolete legacy `MDButton` implementation, test, story, fixture, and Button-barrel export are removed; unrelated Button-family owners remain intact.

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

## Implementation preflight

Authoring source: this ready Button adapter contract under the deterministic `material-component-adapter` workflow. No cross-family, global-theme, renderer-strategy, or public-token architecture decision remains unresolved, so a separate architecture handoff is not required.

Goal: replace the legacy `MDButton` owner atomically with one thin `m3e-button` adapter while preserving current action, form, loading, toggle, icon, theme, RTL, focus, size, shape, and color scenarios. Non-goals remain every other Button-family component, link-button API, global theme replacement, and shared adapter infrastructure.

Owners and public entry points: the current owner is `src/shared/ui/Button/MDButton.vue`; the canonical owner and public entry point become `src/shared/ui/material/components/button/MDButton.vue` and `@shared/ui/material`. The consumer-controlled `selected` prop is the source of truth. The adapter owns explicit prop/slot/event/token normalization; m3e owns rendering and interaction internals; the browser owns native form and focus behavior.

Minimum design: one Vue component imports `@m3e/web/button`, renders one `m3e-button` root, binds the supported properties explicitly, cancels toggle `beforeinput` before renderer mutation, emits `update:selected` intent and the stable `click`, renders the existing progress indicator as a loading extension, and maps only active public Button tokens to documented m3e variables. The simpler alternative—exporting `m3e-button` directly—fails the stable Vue API, controlled-state, loading, and private-renderer boundaries; a generic wrapper is unnecessary.

Implementation passes:

1. add the colocated adapter contract test and confirm it fails against the missing canonical owner;
2. implement the adapter and its family-local export, then pass focused unit/type checks;
3. move the MDButton stories and MDButton-only fixtures, migrate every MDButton consumer/import while leaving other Button exports in place, and remove the legacy MDButton implementation/test/export;
4. adapt browser and visual proof to public host behavior without private renderer DOM, update behavior/visual impact mappings, and inspect any intentional baseline changes;
5. run focused unit, Storybook behavior, visual, representative consumer, Storybook build, and production build proof, then final read-only `pnpm verify`.

### TEST IMPACT

- Contract/scenario: Vue API, defaults, explicit m3e property/attribute/slot mapping, loading extension, disabled behavior, and controlled toggle intent.
  - Primary proof owner: colocated `src/shared/ui/material/components/button/MDButton.test.ts` in `unit-tests`.
  - Additional proof: TypeScript and production/Storybook builds for custom-element recognition and registration.
  - Existing proof: legacy `src/shared/ui/Button/MDButton.test.ts`.
  - New/updated proof: replace the legacy test with the canonical adapter test; no private m3e DOM assertions.
  - Risk or platform matrix: Vue custom-element property/event wiring and form-associated element upgrade.
  - Persistent impact metadata: existing unit import selection plus build fallback; no new unit registry.
- Contract/scenario: real keyboard/pointer focus, native submit/reset, disabled/loading activation, controlled toggle, press/release/interruption/final state, reduced motion, and active public token effects.
  - Primary proof owner: Storybook behavior in `tests/e2e/storybook/md-button-family.spec.ts` using public input and host-observable results.
  - Additional proof: representative form and overlay-anchor consumer paths where materially distinct.
  - Existing proof: current MDButton cases in the same spec.
  - New/updated proof: replace legacy-class/private-structure assumptions with adapter public behavior and rendered-host assertions.
  - Risk or platform matrix: Chromium pointer/keyboard, RTL, reduced motion, native form association, and custom-element upgrade.
  - Persistent impact metadata: map the canonical Button family path while retaining the legacy Button directory for unrelated components.
- Contract/scenario: canonical Button appearance across five variants/sizes, two shapes, icons, toggle/disabled/loading, themes, and RTL.
  - Primary proof owner: bounded MDButton Storybook visual stories in `tests/e2e/visual/shared-ui/md-button.spec.ts`.
  - Additional proof: operator comparison against the recorded official Button overview/spec/token sources.
  - Existing proof: current MDButton snapshots and token-routing assertions.
  - New/updated proof: retain concise canonical matrices, remove assertions coupled to legacy internal classes and obsolete motion declarations, and update only reviewed affected baselines.
  - Risk or platform matrix: light/dark/high-contrast theme roles, RTL, font/icon readiness, and renderer-owned motion settlement.
  - Persistent impact metadata: move MDButton production/story source ownership to `src/shared/ui/material/components/button/` in the visual mapping; no spec rename.
