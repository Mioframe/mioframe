# Button adapter contract

Material component: Button

Migration target: `MDButton`

Implementation ownership: `migrating`

Canonical implementation: `src/shared/ui/material/components/button/MDButton.vue`

The current milestone status, remaining blockers, and next action are owned only by [`docs/roadmap.md`](../../docs/roadmap.md).

## Ownership

The selected action Button model is:

- m3e owns private rendering, active and released pressed geometry, state layer, ripple, focus, elevation, expanded target, and motion;
- `MDButton` owns the selected public Vue API, typed renderer mapping, native integration, selected Button component tokens, and Loading Indicator composition;
- `loading` controls visual busy presentation and `aria-busy` only;
- `disabled` and operation-specific re-entry guards remain independent and consumer-owned;
- the wrapper contains no copied controller, timer, shadow-DOM access, local ripple, pseudo-class timing correction, or parallel interaction-state system.

`MDLoadingIndicator` remains the canonical dependency and owns [`M3E-001`](../../docs/m3e-defects.md#m3e-001--loading-indicator-documented-size-input-is-not-implemented) and [`M3E-002`](../../docs/m3e-defects.md#m3e-002--uncontained-host-size-is-coupled-to-active-indicator-size).

## Official sources

Button:

- `/components/buttons/overview`;
- `/components/buttons/specs`;
- `/components/buttons/guidelines`;
- `/components/buttons/accessibility`.

Loading composition:

- `/components/loading-indicator/overview`;
- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`;
- `/components/loading-indicator/accessibility`;
- `/components/progress-indicators/guidelines`;
- `/components/progress-indicators/accessibility`.

Renderer:

- declared `@m3e/web@^2.6.3`, resolved `2.6.3`;
- Button owns only `@m3e/web/button` integration;
- Loading Indicator integration remains dependency-owned;
- installed artifacts and observable browser behavior are runtime evidence.

## Selected public API

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
- five official text-Button color tokens required by the current inverse-primary Snackbar action context;
- boolean loading presentation retained as an operator-approved M1 library requirement for confirmed short indeterminate operations and complete Loading Indicator dependency closure;
- pointer, Enter, Space, keyboard focus, expanded target, and visible interaction feedback.

Deferred because there is no current production consumer:

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
- the rest of the official Button token surface.

## Material–m3e–Vue matrix

| Material contract                                     | Demand and evidence                                                                                                        | Public Vue representation                                                                                                                                                                                                         | Renderer status and mapping                                                            | Owner and decision                                                              | Verification                            |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------- |
| Action Button identity                                | current application actions                                                                                                | root-exported `MDButton`; required `label`                                                                                                                                                                                        | `direct` — `m3e-button` with `toggle=false`                                            | Button — `implement-now`                                                        | unit + browser + visual                 |
| Filled, outlined, and text colors                     | current primary, outlined filter, Dialog, card, tooltip, Snackbar, and secondary actions                                   | `color`; default `filled`                                                                                                                                                                                                         | `direct` — typed renderer `variant`                                                    | Button — `implement-now`                                                        | unit + visual                           |
| Small and extra-small sizes                           | default actions and current compact filter/add action                                                                      | `size`; default `small`                                                                                                                                                                                                           | `direct` — typed renderer `size`                                                       | Button — `implement-now`                                                        | unit + visual                           |
| Rounded shape                                         | every current consumer uses the standard rounded Button                                                                    | no public prop; fixed `shape="rounded"`                                                                                                                                                                                           | `direct` — renderer shape property                                                     | Button — `implement-now`                                                        | unit + visual                           |
| Label and leading icon                                | all actions require a label; selected consumers use an icon                                                                | required `label`; `icon` slot                                                                                                                                                                                                     | `direct` — default content plus documented `icon` slot                                 | Button — `implement-now`                                                        | unit + browser + visual                 |
| Disabled state                                        | recovery, Dialog, and unavailable-action scenarios                                                                         | `disabled?: boolean`                                                                                                                                                                                                              | `direct` — renderer disabled contract                                                  | Button — `implement-now`                                                        | unit + browser + visual                 |
| Native action type                                    | current ordinary actions and form/Dialog submit actions                                                                    | `nativeType`; values `button` and `submit`; default `button`                                                                                                                                                                      | `direct` — typed renderer `type`                                                       | Button — `implement-now`                                                        | unit + browser                          |
| Native click propagation                              | current consumers rely on ordinary bubbling                                                                                | `click(MouseEvent)` emit; no propagation suppression                                                                                                                                                                              | `direct` — renderer host click                                                         | Button — `implement-now`                                                        | browser                                 |
| Expanded target                                       | compact actions require accessible hit geometry                                                                            | no public prop                                                                                                                                                                                                                    | `direct` — renderer-owned target                                                       | m3e — `implement-now`                                                           | browser + visual                        |
| Hover, focus, ripple, pressed geometry, and motion    | current pointer and keyboard interaction                                                                                   | no public state API                                                                                                                                                                                                               | `direct` — renderer owns the complete transient interaction presentation and timing    | m3e — `implement-now`                                                           | browser + visual + operator review      |
| Boolean loading presentation                          | operator-approved M1 library surface for confirmed short indeterminate operations; no current production recovery consumer | `loading?: boolean`                                                                                                                                                                                                               | `partial` — Button composes canonical `MDLoadingIndicator`                             | Button — `implement-now`                                                        | unit + browser + visual                 |
| Loading accessibility                                 | the action remains the only interactive semantic owner                                                                     | Button `aria-busy`; nested indicator `aria-hidden`                                                                                                                                                                                | `partial` — wrapper owns semantic composition; dependency remains visual inside Button | Button — `wrapper-correction`                                                   | unit + browser accessibility tree       |
| Loading activation ownership                          | loading presentation must not silently change action availability                                                          | `loading` and `disabled` remain independent; consumers own guards                                                                                                                                                                 | `not-applicable` — no renderer mapping beyond the separately supplied states           | consumer — `implement-now`                                                      | unit + browser + consumer tests         |
| Loading precedence and restoration                    | loading replaces an optional leading icon and the icon must return afterward                                               | `loading` wins over `icon` while true                                                                                                                                                                                             | `partial` — wrapper controls dependency placement                                      | Button — `wrapper-correction`                                                   | unit + browser                          |
| Loading size and composed color                       | both selected Button sizes use the dependency composition contract                                                         | `24/24` overall-size handoff; public Loading Indicator color token overridden to `currentColor`                                                                                                                                   | `divergent` — dependency public API with `M3E-001`/`M3E-002` workaround                | Loading Indicator — `temporary-renderer-workaround`; Button — `implement-now`   | unit + independent browser/visual proof |
| Legacy Material surface context                       | current Buttons render inside `.md` surfaces; Snackbar supplies a contextual inverse-primary action                        | no legacy `--md-content-color` API; Button keeps component-owned color and exposes only the five selected official text-Button tokens                                                                                             | `direct` — native inheritance plus family-local public-to-private token mapping        | legacy surface, Button, and Snackbar owners — `implement-now`                   | source contract + browser + visual      |
| Toggle and selected content                           | no current production consumer; official Button sources above                                                              | none                                                                                                                                                                                                                              | `direct` — renderer supports the deferred surface                                      | Button — `defer`                                                                | none                                    |
| Elevated/tonal colors, larger sizes, and square shape | no current production consumer; official Button sources above                                                              | none                                                                                                                                                                                                                              | `direct` — renderer supports the deferred surface                                      | Button — `defer`                                                                | none                                    |
| Reset, link, form identity, and trailing icon         | no current production consumer; official Button sources above                                                              | none                                                                                                                                                                                                                              | `direct` — renderer supports the deferred surface                                      | Button — `defer`                                                                | none                                    |
| Public Button component tokens                        | current Snackbar action requires contextual inverse-primary label/icon and state-layer colors                              | `--md-comp-button-text-label-text-color`; `--md-comp-button-text-icon-color`; `--md-comp-button-text-hover-state-layer-color`; `--md-comp-button-text-focus-state-layer-color`; `--md-comp-button-text-pressed-state-layer-color` | family-local mapping to the corresponding documented public m3e host inputs            | Button declares defaults; Snackbar supplies contextual values — `implement-now` | contract + browser + visual             |

## Loading ownership

```text
approved short indeterminate operation state
  → loading presentation and explicit disabled/guard decisions
      → MDButton.loading
          → decorative MDLoadingIndicator public Vue API
              → private @m3e/web/loading-indicator mapping
```

Button owns:

- loading precedence and placement;
- `aria-busy` on the Button host;
- hiding the nested visual indicator from the accessibility tree;
- `24` overall-size handoff for both retained Button sizes;
- restoring the leading icon after loading ends.

Consumers own:

- whether activation is currently allowed;
- explicit `disabled` binding;
- operation-specific in-flight guards, status, errors, and completion facts.

Loading Indicator owns:

- its standalone public API and progressbar semantics;
- renderer mapping and geometry;
- its standalone primary active color and public component token;
- `M3E-001` and `M3E-002`;
- standalone tests, stories, and visual proof.

Dialog owns busy action availability. Feature code owns long-running status, determinate progress, operation-specific labels, and completion facts. Button does not own those states.

Browser-permission and provider-authorization recovery use feature-owned pending state, textual status, and explicit disabled actions because external UI can suspend them indefinitely. `loading` is not the state model for these operations, and no current production recovery operation uses `MDButton.loading`. The API remains selected because M1 explicitly approves the short-indeterminate library contract and requires its Loading Indicator dependency to be complete before composition; future consumers must still satisfy that lifecycle contract.

## Token ownership

Shared state and other reference/system roles belong to Material foundation. Button exposes only intentionally selected official `--md-comp-button-*` tokens through `components/button/tokens.css` and matching `token-api.md` entries.

The current selected surface is limited to the five text-Button foreground/state-layer color tokens required by `MDSnackbar`. Button owns their primary defaults and private renderer mappings; Snackbar owns the inverse-primary contextual overrides. `MDButton` does not consume the legacy generic `--md-content-color` token.

Button also overrides `--md-comp-loading-indicator-active-indicator-color` to `currentColor` only on its composed dependency instance.

## Implemented proof

- public defaults and selected renderer mappings;
- package-derived `M3eButtonElement` custom-element glue;
- action-only public API with deferred toggle surface removed;
- native button/submit behavior and normal bubbling;
- disabled activation blocking and expanded target;
- leading-icon mapping and restoration;
- decorative Loading Indicator composition, `aria-busy`, and absence of a nested progressbar semantic;
- independence of loading presentation from disabled and click behavior;
- `24/24` dependency-size handoff;
- stable selected Button and Loading Indicator visual baselines;
- installed-artifact revalidation of m3e `2.6.3`;
- compatible state-opacity grammar;
- public-surface hover, focus, pointer-ripple, Space-ripple, and renderer-owned pressed-presentation proof;
- ordinary text inheritance and component-owned Button/icon/loading colors inside a real `.md` surface;
- exact declaration/catalogue/private-mapping agreement for the five selected text-Button tokens;
- real Snackbar resting, hover, focus, and pressed proof for contextual inverse-primary action color without legacy content-token coupling.
