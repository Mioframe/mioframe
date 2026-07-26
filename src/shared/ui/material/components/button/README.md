# Button adapter contract

Family: Button

Migration target: `MDButton` (common label-bearing buttons only)

Renderer viability: `blocked-upstream`

Implementation ownership: `legacy`

Current implementation owner: `src/shared/ui/Button/MDButton.vue`

Canonical owner after a viable migration: `src/shared/ui/material/components/button/MDButton.vue`

Planned public export: `@shared/ui/material` → `MDButton`

## Required scenarios and boundary

The current contract requires ordinary pointer/Enter/Space activation, disabled behavior, native `button`/`submit`/`reset`, form association, a visible accessible label, optional leading icon, loading, controlled toggle selection, programmatic focus, five colors, five sizes, two shapes, accepted public Button token overrides, themes, and RTL icon placement.

No current repository consumer uses `MDButton` as a link. Link props are not required by this pilot. `MDIconButton`, `MDFab`, `MDExtendedFab`, button groups, segmented buttons, split buttons, and other Material families remain excluded.

## Sources and renderer assessment

Official Material records were read from the verified project Material cache captured `2026-07-20T16:16:49.323Z`: `/components/buttons/overview`, `/components/buttons/specs`, `/components/buttons/guidelines`, and `/components/buttons/accessibility`.

The renderer dependency range is `@m3e/web@^2.6.2`; the inspected lockfile version is `2.6.2`; the required family entry point would be `@m3e/web/button`; and the registered element is `m3e-button`. Its peers are `lit@^3.3.0` and `tslib@^2.8.1`, both satisfied by the lockfile. The package declarations and Custom Elements Manifest document:

- variants `elevated`, `filled`, `tonal`, `outlined`, and `text`;
- sizes `extra-small`, `small`, `medium`, `large`, and `extra-large`;
- shapes `rounded` and `square`;
- reflected `toggle` and `selected` properties;
- default, `icon`, `selected`, `selected-icon`, and `trailing-icon` slots;
- disabled behavior, form-associated `button`/`submit`/`reset`, and link attributes;
- cancelable `beforeinput` before selected-state mutation, followed by `input` and `change` when not canceled;
- documented component and variant CSS custom properties for geometry, shape, color, elevation, outline, and state layers.

Those APIs cover the behavioral adapter surface. Loading could remain a narrow Mioframe extension by making the renderer unavailable while busy, retaining the label and adding progress content and `aria-busy`. A controlled adapter could cancel `beforeinput`, emit `update:selected` before `click`, and leave `selected` prop-authoritative.

## Blocking public token gap

The accepted Mioframe contract exposes these public tokens for every supported size:

- `--md-comp-button-<size>-pressed-container-corner-size-motion-spring-stiffness`;
- `--md-comp-button-<size>-pressed-container-corner-size-motion-spring-damping`.

The current legacy implementation consumes them, and `tests/e2e/visual/shared-ui/md-button.spec.ts` explicitly verifies their routing to the accepted expressive motion system tokens. They are therefore an active public/visual contract, not unused legacy implementation detail.

`m3e-button` 2.6.2 documents pressed-shape CSS variables, but it exposes no Button motion duration, easing, spring stiffness, or spring damping CSS custom property. A Mioframe `--md-*` override cannot control the renderer's pressed-corner motion through the documented public CSS API. Preserving it would require private renderer DOM/style access, patching m3e internals, or duplicating renderer motion, all forbidden by the architecture and task.

Renderer viability is consequently `blocked-upstream`, and implementation ownership must remain `legacy`. Reconsider only after one of these independently authorized conditions is met:

1. a stable lockfile-resolved m3e release documents public Button motion/spring inputs that cover the accepted tokens; or
2. an explicit breaking Mioframe API decision removes the accepted per-size spring token contract and migrates its consumers/tests.

## Planned mapping after the blocker is resolved

| Mioframe Vue contract                        | m3e public contract                            | Direction | Owner               | Notes                                                                         |
| -------------------------------------------- | ---------------------------------------------- | --------- | ------------------- | ----------------------------------------------------------------------------- |
| `color`                                      | `variant` property                             | Vue → m3e | Mioframe            | Exact five-value mapping.                                                     |
| `shape` (`round` or `square`)                | `shape` (`rounded` or `square`)                | Vue → m3e | Mioframe            | Private vocabulary normalization.                                             |
| `size`                                       | `size` property                                | Vue → m3e | Mioframe            | Exact five-value mapping.                                                     |
| toggle `selected`                            | `toggle`, `selected`, cancelable `beforeinput` | both      | Consumer/Mioframe   | Cancel renderer mutation, emit controlled intent, prop remains authoritative. |
| `disabled` / loading                         | `disabled` plus host `aria-busy`               | Vue → m3e | Mioframe            | Loading remains a justified project extension.                                |
| `nativeType`                                 | form-associated `type`                         | Vue → m3e | Browser/m3e         | `button`, `submit`, or `reset`.                                               |
| label and icon                               | default and `icon` slots                       | Vue → m3e | Mioframe            | Leading icon only.                                                            |
| public Button color/shape/geometry tokens    | documented Button CSS variables                | Vue → m3e | Mioframe            | Private component-local bridge.                                               |
| public per-size pressed-corner spring tokens | no documented public input                     | Vue → m3e | unresolved upstream | Blocking gap.                                                                 |

## Consumers and migration state

Production consumers remain on `@shared/ui/Button` in entities, features, pages, widgets, and generic shared UI, including form submission in `DatabaseViewAddForm.vue` and `DialogForm.vue`, loading in `DialogForm.vue`, leading-icon compositions, and overlay/menu anchor refs. Stories exercise toggle state and public token overrides. No consumer or production export was migrated, and no legacy file was removed.

Required verification after viability becomes ready remains: colocated component-contract proof; real-browser keyboard/focus/form/controlled-state/disabled/loading proof; concise visual coverage and reviewed baselines; representative consumer proof; m3e boundary guard; production and Storybook builds; and final repository verification.

Unresolved: upstream public Button motion/spring token support or an explicit breaking decision for the existing Mioframe token contract.
