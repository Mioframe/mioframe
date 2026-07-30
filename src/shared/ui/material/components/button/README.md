# Button adapter contract

Material component: Button

Migration target: `MDButton`

Implementation ownership: `migrating`

Canonical implementation: `src/shared/ui/material/components/button/MDButton.vue`

Design artifact: `src/shared/ui/material/components/button/DESIGN.md` — **missing; adapter contract blocked**.

The current milestone status, remaining blockers, and next action are owned only by [`docs/roadmap.md`](../../docs/roadmap.md).

## Design gate

This README is a provisional demand-scoped adapter record reconstructed before the required complete family `DESIGN.md` existed. Its source list, selected/deferred surface, token target, and matrix are not substitutes for the complete official Material description.

Before implementation continues:

1. create `DESIGN.md` from all applicable official Button overview, specs, guidelines, accessibility, related-component, and token sources;
2. include every official variant, configuration, size, shape, state, behavior, measurement, accessibility rule, and component token, including currently unused capability;
3. record source snapshot metadata and unresolved official values;
4. rebuild this README with exact `DESIGN.md` section and token-path references;
5. revalidate every selected, deferred, restrictive, and token decision.

The seven-token Snackbar correction below is provisional until confirmed by the complete design artifact.

## Ownership

The selected action Button model is:

- m3e owns private rendering, active and released pressed geometry, state layer, ripple, focus, elevation, expanded target, and motion;
- `MDButton` owns the selected public Vue API, typed renderer mapping, native integration, selected Button component tokens, and Loading Indicator composition;
- `loading` controls visual busy presentation and `aria-busy` only;
- `disabled` and operation-specific re-entry guards remain independent and consumer-owned;
- the wrapper contains no copied controller, timer, shadow-DOM access, local ripple, pseudo-class timing correction, or parallel interaction-state system.

`MDLoadingIndicator` remains the canonical dependency and owns [`M3E-001`](../../docs/m3e-defects.md#m3e-001--loading-indicator-documented-size-input-is-not-implemented) and [`M3E-002`](../../docs/m3e-defects.md#m3e-002--uncontained-host-size-is-coupled-to-active-indicator-size).

## Official source inventory pending DESIGN extraction

Button sources to capture completely:

- `/components/buttons/overview`;
- `/components/buttons/specs`;
- `/components/buttons/guidelines`;
- `/components/buttons/accessibility`;
- every official related-component and delegated foundation source referenced by those pages.

Loading composition sources belong to the dependency `DESIGN.md`:

- `/components/loading-indicator/overview`;
- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`;
- `/components/loading-indicator/accessibility`;
- `/components/progress-indicators/guidelines`;
- `/components/progress-indicators/accessibility`.

Renderer evidence remains separate from official design evidence:

- declared `@m3e/web@^2.6.3`, resolved `2.6.3`;
- Button owns only `@m3e/web/button` integration;
- Loading Indicator integration remains dependency-owned;
- installed artifacts and observable browser behavior are runtime evidence.

## Provisional selected public API

The following API remains the current implementation but must be revalidated against `DESIGN.md`:

```ts
nativeType?: 'button' | 'submit';
color?: 'filled' | 'outlined' | 'text';
label: string;
disabled?: boolean;
size?: 'extra-small' | 'small';
loading?: boolean;

emit('click', event: MouseEvent);
slot icon;
```

Defaults:

```text
nativeType = button
color      = filled
size       = small
shape      = rounded (fixed renderer mapping; no public prop)
```

Current demand:

- filled actions across product screens;
- text actions in Dialogs, cards, tooltips, Snackbar, and secondary action groups;
- outlined extra-small filter/add actions;
- labels and optional leading icons;
- explicit disabled action blocking;
- native submit actions in forms and Dialogs;
- normal button actions with native click bubbling;
- Snackbar action label remains `inverse-primary` in resting, hovered, focused, and pressed states;
- boolean loading presentation retained as an operator-approved M1 library requirement for confirmed short indeterminate operations and complete Loading Indicator dependency closure;
- pointer, Enter, Space, keyboard focus, expanded target, and visible interaction feedback.

Provisionally deferred because there is no current consumer for the public runtime surface:

- toggle and selected state;
- selected label and selected icon content;
- elevated and tonal colors;
- medium, large, and extra-large sizes;
- public square shape;
- native reset;
- link fields;
- `name` and `value` form identity fields;
- trailing icon;
- determinate progress inside Button;
- text-Button icon color tokens for contextual overrides;
- the rest of the official Button runtime token surface.

All deferred capability must still be fully described in `DESIGN.md`.

## Provisional Material–m3e–Vue matrix

This matrix must be rebuilt with a `DESIGN.md reference` column after the design stage.

| Material contract                          | Demand and evidence                                                                      | Public Vue representation                               | Renderer status and mapping                             | Owner and decision                           | Verification                                |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------- | ------------------------------------------- |
| Action Button identity                     | current application actions                                                              | root-exported `MDButton`; required `label`              | `direct` — `m3e-button` with `toggle=false`             | Button — `implement-now`                     | unit + browser + visual                     |
| Filled, outlined, and text colors          | current primary, outlined filter, Dialog, card, tooltip, Snackbar, and secondary actions | `color`; default `filled`                               | `direct` — typed renderer `variant`                     | Button — `implement-now`                     | unit + visual                               |
| Small and extra-small sizes                | default actions and compact filter/add actions                                           | `size`; default `small`                                 | `direct` — typed renderer `size`                        | Button — `implement-now`                     | unit + visual                               |
| Rounded shape                              | every current consumer uses the standard rounded Button                                  | no public prop; fixed `shape="rounded"`                 | `direct` — renderer shape property                      | Button — `implement-now`                     | unit + visual                               |
| Label and leading icon                     | all actions require a label; selected consumers use an icon                              | required `label`; `icon` slot                           | `direct` — default content plus documented `icon` slot  | Button — `implement-now`                     | unit + browser + visual                     |
| Disabled state                             | recovery, Dialog, and unavailable-action scenarios                                       | `disabled?: boolean`                                    | `direct` — renderer disabled contract                   | Button — `implement-now`                     | unit + browser + visual                     |
| Native action type                         | ordinary actions and form/Dialog submit actions                                          | `nativeType`; `button`/`submit`                         | `direct` — typed renderer `type`                        | Button — `implement-now`                     | unit + browser                              |
| Native click propagation                   | consumers rely on ordinary bubbling                                                      | `click(MouseEvent)` emit                                | `direct` — renderer host click                          | Button — `implement-now`                     | browser                                     |
| Expanded target                            | compact actions require accessible hit geometry                                          | no public prop                                          | `direct` — renderer-owned target                        | m3e — `implement-now`                        | browser + visual                            |
| Interaction presentation and motion        | pointer and keyboard interaction                                                         | no public state API                                     | `direct` — renderer-owned                               | m3e — `implement-now`                        | browser + visual + operator review          |
| Boolean loading presentation               | operator-approved M1 surface                                                             | `loading?: boolean`                                     | `partial` — composes `MDLoadingIndicator`               | Button — `implement-now`                     | unit + browser + visual                     |
| Loading accessibility                      | Button remains the interactive semantic owner                                            | host `aria-busy`; nested indicator `aria-hidden`        | `partial` — wrapper composition                         | Button — `wrapper-correction`                | unit + browser accessibility tree           |
| Loading activation ownership               | loading must not silently disable an action                                              | independent `loading` and `disabled`                    | `not-applicable`                                        | consumer — `implement-now`                   | unit + browser + consumer tests             |
| Loading precedence/restoration             | loading replaces and restores the leading icon                                           | `loading` wins over `icon`                              | `partial` — wrapper placement                           | Button — `wrapper-correction`                | unit + browser                              |
| Loading size/composed color                | selected Button sizes use dependency composition                                         | `24/24` handoff; dependency public color-token override | `divergent` — dependency `M3E-001`/`M3E-002` workaround | dependency + Button                          | unit + browser + visual                     |
| Legacy Material surface context            | Button renders inside `.md`; Snackbar needs contextual inverse-primary                   | no legacy `--md-content-color` API                      | `partial`; contextual tokens under correction           | legacy surface, Button, Snackbar — `blocked` | source + browser + visual                   |
| Contextual text-Button label/state layer   | Snackbar label remains inverse-primary in resting and transient states                   | provisional seven-token target below                    | `partial`; current mapping omits state-label inputs     | Button + Snackbar — `blocked`                | contract + computed browser result + visual |
| Toggle/selected content                    | no current production consumer                                                           | none                                                    | renderer supports deferred surface                      | Button — `defer`                             | none                                        |
| Elevated/tonal, larger sizes, square shape | no current production consumer                                                           | none                                                    | renderer supports deferred surface                      | Button — `defer`                             | none                                        |
| Reset/link/form identity/trailing icon     | no current production consumer                                                           | none                                                    | renderer supports deferred surface                      | Button — `defer`                             | none                                        |
| Contextual text-Button icon tokens         | Snackbar action has no icon                                                              | none                                                    | renderer supports deferred surface                      | Button — `defer`                             | none                                        |

## Provisional contextual token trace

The complete Button `DESIGN.md` must confirm these official paths before implementation:

| State   | Rendered part | Provisional official Material path              | Provisional public token                          | Renderer input and fallback                                                           | Current consumer result | Proof target                  |
| ------- | ------------- | ----------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------- | ----------------------------- |
| resting | label         | `md.comp.button.text.label-text.color`          | `--md-comp-button-text-label-text-color`          | `--m3e-text-button-label-text-color` → generic label → primary                        | inverse-primary         | computed label color + visual |
| hovered | label         | `md.comp.button.text.hovered.label-text.color`  | `--md-comp-button-text-hovered-label-text-color`  | `--m3e-text-button-hover-label-text-color` → generic hover label → primary            | inverse-primary         | computed label color + visual |
| focused | label         | `md.comp.button.text.focused.label-text.color`  | `--md-comp-button-text-focused-label-text-color`  | `--m3e-text-button-focus-label-text-color` → generic focus label → primary            | inverse-primary         | computed label color + visual |
| pressed | label         | `md.comp.button.text.pressed.label-text.color`  | `--md-comp-button-text-pressed-label-text-color`  | `--m3e-text-button-pressed-label-text-color` → generic pressed label → primary        | inverse-primary         | computed label color + visual |
| hovered | state layer   | `md.comp.button.text.hovered.state-layer.color` | `--md-comp-button-text-hovered-state-layer-color` | `--m3e-text-button-hover-state-layer-color` → generic hover state layer → primary     | inverse-primary         | rendered presentation         |
| focused | state layer   | `md.comp.button.text.focused.state-layer.color` | `--md-comp-button-text-focused-state-layer-color` | `--m3e-text-button-focus-state-layer-color` → generic focus state layer → primary     | inverse-primary         | rendered presentation         |
| pressed | state layer   | `md.comp.button.text.pressed.state-layer.color` | `--md-comp-button-text-pressed-state-layer-color` | `--m3e-text-button-pressed-state-layer-color` → generic pressed state layer → primary | inverse-primary         | rendered presentation         |

The current runtime declarations are not accepted. They use renderer-derived `hover`/`focus` names, omit state-specific label tokens, and publish an unconsumed icon token.

## Loading ownership

```text
approved short indeterminate operation state
  → loading presentation and explicit disabled/guard decisions
      → MDButton.loading
          → decorative MDLoadingIndicator public Vue API
              → private @m3e/web/loading-indicator mapping
```

Button owns loading precedence/placement, `aria-busy`, decorative suppression, the selected `24` handoff, and icon restoration. Consumers own action availability, explicit `disabled`, guards, status, errors, and completion facts. Loading Indicator owns standalone API, semantics, geometry, renderer mapping, token, defects, tests, stories, and visual proof.

## Current proof and blockers

Implementation evidence that remains reusable:

- package-derived renderer typing;
- selected renderer prop mappings;
- native button/submit behavior and bubbling;
- disabled behavior and expanded target;
- leading-icon mapping/restoration;
- Loading Indicator composition and accessibility handoff;
- loading/disabled independence;
- selected size handoff;
- interaction and visual proof already present.

Completion blockers:

- create and accept the complete Button `DESIGN.md`;
- rebuild this matrix with exact design references;
- revalidate the public API, deferred surface, Loading Indicator dependency, and provisional token target;
- implement the confirmed contextual token contract;
- prove Snackbar computed label colors in all selected states;
- regenerate and inspect affected baselines;
- pass final verification and operator review.
