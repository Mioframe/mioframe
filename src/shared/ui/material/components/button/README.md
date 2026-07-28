# Button adapter contract

Material component: Button

Migration target: `MDButton`

Implementation ownership: `migrating`

Canonical implementation: `src/shared/ui/material/components/button/MDButton.vue`

## Status

The selected m3e-backed Button behavior, package-derived renderer typing, dependency composition, and observable proof are implemented. The family is in `correction` because the remaining legacy Dialog consumer contract still exposes numeric loading even though Button accepts boolean loading only.

No unresolved operator-reported Button visual or motion issue is currently recorded. Operator review is performed manually during development; a reported issue reopens this family.

The interaction-feedback correction is implemented against installed `@m3e/web` `2.6.3`:

- shared state-opacity roles use `8%`/`10%`/`10%`/`16%`;
- m3e owns the state layer and ripple;
- Button contains no local opacity conversion or parallel ripple;
- public-surface browser/visual proof covers pointer hover, keyboard focus, pointer press, and Space press;
- provisional `M3E-003` was withdrawn as a pre-merge misclassification and its ID retired.

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

## Selected Material contract

Current scenarios require:

- default actions and controlled toggle selection;
- elevated, filled, tonal, outlined, and text configurations;
- five sizes and round/square shapes;
- label, leading icon, selected label, and selected icon content;
- disabled behavior;
- pointer, Enter, Space, keyboard focus, visible interaction feedback, and expanded target behavior;
- native `button`, `submit`, and `reset` behavior;
- boolean short loading through Loading indicator composition.

Deferred because there is no current consumer:

- link fields;
- `name` and `value`;
- trailing icon;
- determinate progress inside Button;
- complete official Button token surface.

## Material–m3e–Vue matrix

| Material contract                                    | Demand and evidence                                    | Public Vue representation                           | Renderer status and mapping                                             | Owner and decision                                  | Verification               |
| ---------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- | -------------------------- |
| Default and toggle variants                          | current default-action and controlled-toggle consumers | `variant`, controlled `selected`, `update:selected` | `direct` — typed m3e toggle/selection properties                        | Button — `implement-now`                            | unit + browser             |
| Five color configurations                            | current migration surface and visual states            | `color`                                             | `direct` — m3e Button variant                                           | Button — `implement-now`                            | unit + visual              |
| Five sizes and two shapes                            | current component contract and visual coverage         | `size`, `shape`                                     | `direct` — m3e size/shape properties                                    | Button — `implement-now`                            | unit + visual              |
| Leading and selected content                         | current icon and controlled-selection scenarios        | `icon`, `selected-label`, `selected-icon` slots     | `direct` — documented renderer slots                                    | Button — `implement-now`                            | unit + browser             |
| Disabled, focus, hover, pressed, and expanded target | current interaction and accessibility scenarios        | `disabled`; no public ripple API                    | `direct` — m3e state layer/ripple; shared foundation state roles        | Button/foundation — `implement-now`                 | browser + visual           |
| Native action type                                   | form and Dialog actions require button/submit/reset    | `nativeType`                                        | `direct` — renderer `type`                                              | Button — `implement-now`                            | unit + browser             |
| Link and form identity fields                        | no current consumer; official Button sources above     | none                                                | `direct` — renderer surface exists but is not selected                  | Button — `defer`                                    | none                       |
| Boolean loading                                      | current Dialog/action loading scenarios                | `loading?: boolean`                                 | `partial` — parent composes canonical `MDLoadingIndicator`              | Button — `implement-now`                            | unit + browser + visual    |
| Loading purpose                                      | nested progressbar must describe the current action    | Button `label` handed to dependency `label`         | `partial` — parent handoff plus dependency role                         | Button/Loading Indicator — `wrapper-correction`     | browser accessibility tree |
| Loading size and inherited color                     | selected Button-size composition                       | `24/24/24/32/40`, inherited color                   | `divergent` — dependency public API with `M3E-001`/`M3E-002` workaround | Loading Indicator — `temporary-renderer-workaround` | unit + independent visual  |
| Loading with selected content                        | selected route must restore after loading              | loading wins and selected route restores            | `partial` — renderer slots plus wrapper precedence                      | Button — `wrapper-correction`                       | unit + browser             |
| Native click propagation                             | current consumers rely on normal bubbling              | `click` emit and normal bubbling                    | `direct` — renderer host click                                          | Button — `implement-now`                            | browser                    |

## Token ownership

Shared state and other reference/system roles belong to Material foundation. Button may expose only intentionally selected official `--md-comp-button-*` tokens through an owning `tokens.css` file and `token-api.md` entry.

No Button component token is currently required, so no placeholder token file or m3e-variable mirror is added.

## Dependency boundary

```text
MDButton loading state
  → MDLoadingIndicator public Vue API
      → private @m3e/web/loading-indicator mapping
```

Button does not import raw dependency m3e, set dependency-private variables, own Loading indicator defects/geometry/motion, implement a ripple, or expose renderer token vocabulary.

## Implemented proof

- public defaults and selected renderer mappings;
- package-derived `M3eButtonElement` custom-element glue;
- text toggle and selected/unselected content routing;
- native button/submit/reset behavior and normal bubbling;
- controlled toggle intent;
- disabled activation and expanded target;
- Loading indicator composition, purpose, size, and state-combination handoff;
- real-browser named progressbar resolution;
- stable Button and independent Loading indicator visual baselines;
- installed-artifact revalidation of m3e `2.6.3`;
- compatible state-opacity grammar;
- public-surface hover, focus, pointer-ripple, and Space-ripple visual proof.

Host `:active` and event receipt are activation evidence only, not proof of visible feedback.

## Remaining

- narrow `MDDialog` and `DialogForm` loading contracts to boolean and remove numeric coercion;
- verify all current consumers after that migration;
- pass final current-head branch/task-scope repository verification;
- complete final full-PR review with no unresolved operator-reported issue.
