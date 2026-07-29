# Button adapter contract

Material component: Button

Migration target: `MDButton`

Implementation ownership: `migrating`

Canonical implementation: `src/shared/ui/material/components/button/MDButton.vue`

The current milestone status, remaining blockers, and next action are owned only by [`docs/roadmap.md`](../../docs/roadmap.md).

## Ownership

The selected action Button model is:

- m3e owns private rendering, active and released pressed geometry, state layer, ripple, focus, elevation, expanded target, and motion;
- `MDButton` owns the selected public Vue API, typed renderer mapping, native integration, and Loading Indicator composition;
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
- text actions in Dialogs, cards, tooltips, and secondary action groups;
- outlined extra-small filter/add actions;
- labels and optional leading icons;
- explicit disabled action blocking;
- native submit actions in forms and Dialogs;
- normal button actions with native click bubbling;
- boolean loading presentation for current access-recovery actions;
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
- complete official Button token surface.

## Material–m3e–Vue matrix

| Material contract | Demand and evidence | Public Vue representation | Renderer status and mapping | Owner and decision | Verification |
| --- | --- | --- | --- | --- | --- |
| Action Button identity | current application actions | root-exported `MDButton`; required `label` | `direct` — `m3e-button` with `toggle=false` | Button — `implement-now` | unit + browser + visual |
| Filled, outlined, and text colors | current primary, outlined filter, Dialog, card, tooltip, and secondary actions | `color`; default `filled` | `direct` — typed renderer `variant` | Button — `implement-now` | unit + visual |
| Small and extra-small sizes | default actions and current compact filter/add action | `size`; default `small` | `direct` — typed renderer `size` | Button — `implement-now` | unit + visual |
| Rounded shape | every current consumer uses the standard rounded Button | no public prop; fixed `shape="rounded"` | `direct` — renderer shape property | Button — `implement-now` | unit + visual |
| Label and leading icon | all actions require a label; selected consumers use an icon | required `label`; `icon` slot | `direct` — default content plus documented `icon` slot | Button — `implement-now` | unit + browser + visual |
| Disabled state | recovery, Dialog, and unavailable-action scenarios | `disabled?: boolean` | `direct` — renderer disabled contract | Button — `implement-now` | unit + browser + visual |
| Native action type | current ordinary actions and form/Dialog submit actions | `nativeType`; values `button` and `submit`; default `button` | `direct` — typed renderer `type` | Button — `implement-now` | unit + browser |
| Native click propagation | current consumers rely on ordinary bubbling | `click(MouseEvent)` emit; no propagation suppression | `direct` — renderer host click | Button — `implement-now` | browser |
| Expanded target | compact actions require accessible hit geometry | no public prop | `direct` — renderer-owned target | m3e — `implement-now` | browser + visual |
| Hover, focus, ripple, pressed geometry, and motion | current pointer and keyboard interaction | no public state API | `direct` — renderer owns the complete transient interaction presentation and timing | m3e — `implement-now` | browser + visual + operator review |
| Boolean loading presentation | current file-system and authorization recovery actions | `loading?: boolean` | `partial` — Button composes canonical `MDLoadingIndicator` | Button — `implement-now` | unit + browser + visual |
| Loading accessibility | the action remains the only interactive semantic owner | Button `aria-busy`; nested indicator `aria-hidden` | `partial` — wrapper owns semantic composition; dependency remains visual inside Button | Button — `wrapper-correction` | unit + browser accessibility tree |
| Loading activation ownership | loading presentation must not silently change action availability | `loading` and `disabled` remain independent; consumers own guards | `not-applicable` — no renderer mapping beyond the separately supplied states | consumer — `implement-now` | unit + browser + consumer tests |
| Loading precedence and restoration | loading replaces an optional leading icon and the icon must return afterward | `loading` wins over `icon` while true | `partial` — wrapper controls dependency placement | Button — `wrapper-correction` | unit + browser |
| Loading size and inherited color | both selected Button sizes need compact loading feedback | `24/24` overall-size handoff; inherited color | `divergent` — dependency public API with `M3E-001`/`M3E-002` workaround | Loading Indicator — `temporary-renderer-workaround` | unit + independent browser/visual proof |
| Toggle and selected content | no current production consumer; official Button sources above | none | `direct` — renderer supports the deferred surface | Button — `defer` | none |
| Elevated/tonal colors, larger sizes, and square shape | no current production consumer; official Button sources above | none | `direct` — renderer supports the deferred surface | Button — `defer` | none |
| Reset, link, form identity, and trailing icon | no current production consumer; official Button sources above | none | `direct` — renderer supports the deferred surface | Button — `defer` | none |
| Public Button component tokens | no current CSS consumer | none | `not-applicable` — renderer inputs remain private | Button — `defer` | none |

## Loading ownership

```text
consumer operation state
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
- inherited active color;
- `M3E-001` and `M3E-002`;
- standalone tests, stories, and visual proof.

Dialog owns busy action availability. Feature code owns long-running status, determinate progress, operation-specific labels, and completion facts. Button does not own those states.

## Token ownership

Shared state and other reference/system roles belong to Material foundation. Button may expose only intentionally selected official `--md-comp-button-*` tokens through an owning `tokens.css` file and `token-api.md` entry.

No Button component token is currently required, so no placeholder token file or public m3e-variable mirror is added.

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
- public-surface hover, focus, pointer-ripple, Space-ripple, and renderer-owned pressed-presentation proof.
