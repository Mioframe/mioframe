# Button adapter contract

Material component: Button

Migration target: `MDButton`

Implementation ownership: `migrating`

Canonical implementation: `src/shared/ui/material/components/button/MDButton.vue`

## Status

The demand-scoped m3e-backed action Button, package-derived renderer typing, dependency composition, consumer migration, and automated proof are implemented. The family is in `verification` pending operator visual review, the PR-level final completion gate, and final full-PR review.

No unresolved operator-reported Button visual or motion issue is currently recorded. Operator review is performed manually during development; a reported issue reopens this family.

The selected interaction model against installed `@m3e/web` `2.6.3` is:

- m3e owns state layer, ripple, focus, elevation, and the active pressed morph;
- shared state-opacity roles use `8%`/`10%`/`10%`/`16%`;
- after physical release, the wrapper maps documented pressed-shape inputs back to the resting round shape while renderer-owned feedback may finish independently;
- Button contains no copied controller, timer, shadow-DOM access, local ripple, or parallel interaction-state system.

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
- Loading indicator integration remains dependency-owned;
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
- disabled action blocking;
- native submit actions in forms and Dialogs;
- normal button actions with native click bubbling;
- boolean loading for current access-recovery actions;
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

| Material contract                                     | Demand and evidence                                                                   | Public Vue representation                            | Renderer status and mapping                                                                                                    | Owner and decision                                  | Verification                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ---------------------------------------------------- | -------------- |
| Action Button identity                                | current application actions                                                           | root-exported `MDButton`; required `label`           | `direct` — `m3e-button` with `toggle=false`                                                                                    | Button — `implement-now`                            | unit + browser + visual                              |
| Filled, outlined, and text colors                     | current primary, outlined filter, Dialog, card, tooltip, and secondary actions        | `color`; default `filled`                            | `direct` — typed renderer `variant`                                                                                            | Button — `implement-now`                            | unit + visual                                        |
| Small and extra-small sizes                           | default actions and current compact filter/add action                                 | `size`; default `small`                              | `direct` — typed renderer `size`                                                                                               | Button — `implement-now`                            | unit + visual                                        |
| Rounded shape                                         | every current consumer uses the standard rounded Button                               | no public prop; fixed `shape="rounded"`              | `direct` — renderer shape property                                                                                             | Button — `implement-now`                            | unit + visual                                        |
| Label and leading icon                                | all actions require a label; selected consumers use an icon                           | required `label`; `icon` slot                        | `direct` — default content plus documented `icon` slot                                                                         | Button — `implement-now`                            | unit + browser + visual                              |
| Disabled state                                        | recovery, Dialog, and unavailable-action scenarios                                    | `disabled?: boolean`                                 | `direct` — renderer disabled contract                                                                                          | Button — `implement-now`                            | unit + browser + visual                              |
| Native action type                                    | current ordinary actions and form/Dialog submit actions                               | `nativeType?: 'button'                               | 'submit'`; default `button`                                                                                                    | `direct` — typed renderer `type`                    | Button — `implement-now`                             | unit + browser |
| Native click propagation                              | current consumers rely on ordinary bubbling                                           | `click(MouseEvent)` emit; no propagation suppression | `direct` — renderer host click                                                                                                 | Button — `implement-now`                            | browser                                              |
| Expanded target                                       | compact actions require accessible hit geometry                                       | no public prop                                       | `direct` — renderer-owned target                                                                                               | m3e — `implement-now`                               | browser + visual                                     |
| Hover, focus, ripple, and pressed feedback            | current pointer and keyboard interaction                                              | no public state API                                  | `direct` — renderer-owned state layer/ripple/focus/active pressed presentation                                                 | m3e — `implement-now`                               | browser + visual + operator review                   |
| Immediate released geometry                           | retained m3e pressed feedback otherwise keeps pressed geometry after physical release | no public API; family-local CSS mapping              | `partial` — documented pressed-shape inputs follow renderer while `:active`, then resolve to resting round shape after release | Button — `wrapper-correction`                       | contract inspection + visual proof + operator review |
| Boolean loading                                       | current file-system and authorization recovery actions                                | `loading?: boolean`                                  | `partial` — Button composes canonical `MDLoadingIndicator`                                                                     | Button — `implement-now`                            | unit + browser + visual                              |
| Loading accessibility                                 | the action remains the only interactive semantic owner                                | Button `aria-busy`; nested indicator `aria-hidden`   | `partial` — wrapper owns semantic composition; dependency remains visual inside Button                                         | Button — `wrapper-correction`                       | unit + browser accessibility tree                    |
| Loading precedence and restoration                    | loading replaces an optional leading icon and the icon must return afterward          | `loading` wins over `icon` while true                | `partial` — wrapper controls dependency placement                                                                              | Button — `wrapper-correction`                       | unit + browser                                       |
| Loading size and inherited color                      | both selected Button sizes need compact loading feedback                              | `24/24` overall-size handoff; inherited color        | `divergent` — dependency public API with `M3E-001`/`M3E-002` workaround                                                        | Loading Indicator — `temporary-renderer-workaround` | unit + independent browser/visual proof              |
| Toggle and selected content                           | no current production consumer; official Button sources above                         | none                                                 | `direct` — renderer supports the deferred surface                                                                              | Button — `defer`                                    | none                                                 |
| Elevated/tonal colors, larger sizes, and square shape | no current production consumer; official Button sources above                         | none                                                 | `direct` — renderer supports the deferred surface                                                                              | Button — `defer`                                    | none                                                 |
| Reset, link, form identity, and trailing icon         | no current production consumer; official Button sources above                         | none                                                 | `direct` — renderer supports the deferred surface                                                                              | Button — `defer`                                    | none                                                 |
| Public Button component tokens                        | no current CSS consumer                                                               | none                                                 | `not-applicable` — renderer inputs remain private                                                                              | Button — `defer`                                    | none                                                 |

## Loading ownership

```text
short action state
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

Loading Indicator owns:

- its standalone public API and progressbar semantics;
- renderer mapping and geometry;
- inherited active color;
- `M3E-001` and `M3E-002`;
- standalone tests, stories, and visual proof.

Dialog owns busy action availability. Feature code owns long-running status, determinate progress, operation-specific labels, and completion facts. Button does not own those states.

## Token ownership

Shared state and other reference/system roles belong to Material foundation. Button may expose only intentionally selected official `--md-comp-button-*` tokens through an owning `tokens.css` file and `token-api.md` entry.

No Button component token is currently required, so no placeholder token file or public m3e-variable mirror is added. The pressed-release correction uses documented renderer inputs privately inside the family and does not create a consumer token API.

## Implemented proof

- public defaults and selected renderer mappings;
- package-derived `M3eButtonElement` custom-element glue;
- action-only public API with deferred toggle surface removed;
- native button/submit behavior and normal bubbling;
- disabled activation blocking and expanded target;
- leading-icon mapping and restoration;
- decorative Loading indicator composition, `aria-busy`, and absence of a nested progressbar semantic;
- `24/24` dependency-size handoff;
- public CSS pressed-release mapping without timers or private renderer access;
- stable selected Button and Loading indicator visual baselines;
- installed-artifact revalidation of m3e `2.6.3`;
- compatible state-opacity grammar;
- public-surface hover, focus, pointer-ripple, and Space-ripple visual proof.

## Verification remainder

- complete operator visual review of pressed-shape release and loading presentation;
- pass the PR-level final `pnpm verify:release` completion gate on the final head;
- complete final full-PR review with no unresolved operator-reported issue.
