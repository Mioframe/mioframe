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
- Snackbar action label remains `inverse-primary` in resting, hovered, focused, and pressed states;
- boolean loading presentation retained as an operator-approved M1 library requirement for confirmed short indeterminate operations and complete Loading Indicator dependency closure;
- pointer, Enter, Space, keyboard focus, expanded target, and visible interaction feedback.

Deferred because there is no current consumer for the public surface:

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
- the rest of the official Button token surface.

The existing `icon` slot remains selected because current Buttons render leading icons. This does not justify public contextual icon tokens: the current Snackbar override is label-only, and normal icon colors remain renderer defaults.

## Material–m3e–Vue matrix

| Material contract                                     | Demand and evidence                                                                                                        | Public Vue representation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Renderer status and mapping                                                                                                                                        | Owner and decision                                                              | Verification                                |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------- |
| Action Button identity                                | current application actions                                                                                                | root-exported `MDButton`; required `label`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `direct` — `m3e-button` with `toggle=false`                                                                                                                        | Button — `implement-now`                                                        | unit + browser + visual                     |
| Filled, outlined, and text colors                     | current primary, outlined filter, Dialog, card, tooltip, Snackbar, and secondary actions                                   | `color`; default `filled`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `direct` — typed renderer `variant`                                                                                                                                | Button — `implement-now`                                                        | unit + visual                               |
| Small and extra-small sizes                           | default actions and current compact filter/add action                                                                      | `size`; default `small`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `direct` — typed renderer `size`                                                                                                                                   | Button — `implement-now`                                                        | unit + visual                               |
| Rounded shape                                         | every current consumer uses the standard rounded Button                                                                    | no public prop; fixed `shape="rounded"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `direct` — renderer shape property                                                                                                                                 | Button — `implement-now`                                                        | unit + visual                               |
| Label and leading icon                                | all actions require a label; selected consumers use an icon                                                                | required `label`; `icon` slot                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `direct` — default content plus documented `icon` slot                                                                                                             | Button — `implement-now`                                                        | unit + browser + visual                     |
| Disabled state                                        | recovery, Dialog, and unavailable-action scenarios                                                                         | `disabled?: boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `direct` — renderer disabled contract                                                                                                                              | Button — `implement-now`                                                        | unit + browser + visual                     |
| Native action type                                    | current ordinary actions and form/Dialog submit actions                                                                    | `nativeType`; values `button` and `submit`; default `button`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `direct` — typed renderer `type`                                                                                                                                   | Button — `implement-now`                                                        | unit + browser                              |
| Native click propagation                              | current consumers rely on ordinary bubbling                                                                                | `click(MouseEvent)` emit; no propagation suppression                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `direct` — renderer host click                                                                                                                                     | Button — `implement-now`                                                        | browser                                     |
| Expanded target                                       | compact actions require accessible hit geometry                                                                            | no public prop                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `direct` — renderer-owned target                                                                                                                                   | m3e — `implement-now`                                                           | browser + visual                            |
| Hover, focus, ripple, pressed geometry, and motion    | current pointer and keyboard interaction                                                                                   | no public state API                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `direct` — renderer owns the complete transient interaction presentation and timing                                                                               | m3e — `implement-now`                                                           | browser + visual + operator review          |
| Boolean loading presentation                          | operator-approved M1 library surface for confirmed short indeterminate operations; no current production recovery consumer | `loading?: boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `partial` — Button composes canonical `MDLoadingIndicator`                                                                                                        | Button — `implement-now`                                                        | unit + browser + visual                     |
| Loading accessibility                                 | the action remains the only interactive semantic owner                                                                     | Button `aria-busy`; nested indicator `aria-hidden`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `partial` — wrapper owns semantic composition; dependency remains visual inside Button                                                                            | Button — `wrapper-correction`                                                   | unit + browser accessibility tree           |
| Loading activation ownership                          | loading presentation must not silently change action availability                                                          | `loading` and `disabled` remain independent; consumers own guards                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `not-applicable` — no renderer mapping beyond the separately supplied states                                                                                       | consumer — `implement-now`                                                      | unit + browser + consumer tests             |
| Loading precedence and restoration                    | loading replaces an optional leading icon and the icon must return afterward                                               | `loading` wins over `icon` while true                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `partial` — wrapper controls dependency placement                                                                                                                  | Button — `wrapper-correction`                                                   | unit + browser                              |
| Loading size and composed color                       | both selected Button sizes use the dependency composition contract                                                         | `24/24` overall-size handoff; public Loading Indicator color token overridden to `currentColor`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `divergent` — dependency public API with `M3E-001`/`M3E-002` workaround                                                                                            | Loading Indicator — `temporary-renderer-workaround`; Button — `implement-now`   | unit + independent browser/visual proof     |
| Legacy Material surface context                       | current Buttons render inside `.md` surfaces; Snackbar requires a contextual inverse-primary action label                  | no legacy `--md-content-color` API; Button keeps component-owned color                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `partial` — native inheritance is correct, but the contextual public token subset is still under correction                                                       | legacy surface, Button, and Snackbar owners — `blocked`                         | source contract + browser + visual          |
| Contextual text-Button label and state layer           | Snackbar action label must remain inverse-primary through resting, hovered, focused, and pressed presentation               | accepted target: `--md-comp-button-text-label-text-color`; `--md-comp-button-text-hovered-label-text-color`; `--md-comp-button-text-focused-label-text-color`; `--md-comp-button-text-pressed-label-text-color`; `--md-comp-button-text-hovered-state-layer-color`; `--md-comp-button-text-focused-state-layer-color`; `--md-comp-button-text-pressed-state-layer-color`                                                                                                                                                                                                 | `partial` — m3e exposes separate text-Button resting/hover/focus/pressed label and state-layer inputs; current Mioframe mapping omits state-specific label inputs | Button declares defaults; Snackbar supplies contextual values — `blocked`       | contract + computed browser result + visual |
| Toggle and selected content                           | no current production consumer; official Button sources above                                                              | none                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `direct` — renderer supports the deferred surface                                                                                                                  | Button — `defer`                                                                | none                                        |
| Elevated/tonal colors, larger sizes, and square shape | no current production consumer; official Button sources above                                                              | none                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `direct` — renderer supports the deferred surface                                                                                                                  | Button — `defer`                                                                | none                                        |
| Reset, link, form identity, and trailing icon         | no current production consumer; official Button sources above                                                              | none                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `direct` — renderer supports the deferred surface                                                                                                                  | Button — `defer`                                                                | none                                        |
| Contextual text-Button icon tokens                    | Snackbar action has no icon; no other contextual consumer is confirmed                                                     | none                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `direct` — renderer supports the deferred surface                                                                                                                  | Button — `defer`                                                                | none                                        |

## Contextual token state/part trace

Accepted correction target:

| State   | Rendered part | Official Material token path                        | Public Mioframe token                                          | Renderer input and fallback                                                                                                                        | Current consumer result | Proof target                     |
| ------- | ------------- | --------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------- |
| resting | label         | `md.comp.button.text.label-text.color`               | `--md-comp-button-text-label-text-color`                         | `--m3e-text-button-label-text-color` → generic Button label input → primary                                                                         | inverse-primary         | computed label color + visual    |
| hovered | label         | `md.comp.button.text.hovered.label-text.color`       | `--md-comp-button-text-hovered-label-text-color`                 | `--m3e-text-button-hover-label-text-color` → generic hover label input → primary                                                                    | inverse-primary         | computed label color + visual    |
| focused | label         | `md.comp.button.text.focused.label-text.color`       | `--md-comp-button-text-focused-label-text-color`                 | `--m3e-text-button-focus-label-text-color` → generic focus label input → primary                                                                    | inverse-primary         | computed label color + visual    |
| pressed | label         | `md.comp.button.text.pressed.label-text.color`       | `--md-comp-button-text-pressed-label-text-color`                 | `--m3e-text-button-pressed-label-text-color` → generic pressed label input → primary                                                                | inverse-primary         | computed label color + visual    |
| hovered | state layer   | `md.comp.button.text.hovered.state-layer.color`      | `--md-comp-button-text-hovered-state-layer-color`                | `--m3e-text-button-hover-state-layer-color` → generic hover state-layer input → primary                                                             | inverse-primary         | rendered state-layer presentation |
| focused | state layer   | `md.comp.button.text.focused.state-layer.color`      | `--md-comp-button-text-focused-state-layer-color`                | `--m3e-text-button-focus-state-layer-color` → generic focus state-layer input → primary                                                             | inverse-primary         | rendered state-layer presentation |
| pressed | state layer   | `md.comp.button.text.pressed.state-layer.color`      | `--md-comp-button-text-pressed-state-layer-color`                | `--m3e-text-button-pressed-state-layer-color` → generic pressed state-layer input → primary                                                         | inverse-primary         | rendered state-layer presentation |

The current runtime declarations are not accepted as the final public contract. They use renderer-derived `hover`/`focus` state names, omit the three state-specific label tokens, and publish an unconsumed icon token. The correction must replace them without compatibility aliases because the API has not shipped.

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

The accepted target is limited to the seven label/state-layer tokens required by the Snackbar scenario. Button owns their primary defaults and private renderer mappings; Snackbar owns the inverse-primary contextual overrides. `MDButton` does not consume the legacy generic `--md-content-color` token.

Button overrides `--md-comp-loading-indicator-active-indicator-color` to `currentColor` only on its composed dependency instance.

## Implemented proof

The following implementation remains valid:

- public defaults and selected renderer prop mappings;
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
- ordinary text inheritance and component-owned Button/loading colors inside a real `.md` surface.

Current correction blockers:

- replace renderer-derived public `hover`/`focus` names with official `hovered`/`focused` names;
- remove the unconsumed public icon token;
- add the three required state-specific label tokens;
- map all seven accepted tokens to the exact m3e inputs and fallbacks;
- prove the Snackbar label’s computed inverse-primary color in resting, hovered, focused, and pressed states;
- regenerate and inspect the affected visual baselines.