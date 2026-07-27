# Button adapter contract

Material component: Button

Migration target: `MDButton`

Implementation ownership: `migrating`

Canonical implementation: `src/shared/ui/material/components/button/MDButton.vue`

## Status

The m3e-backed Button implementation is complete for the selected demand-scoped contract and composes the canonical `MDLoadingIndicator` dependency adapter.

The interaction-feedback correction is implemented and proven against the installed lockfile-resolved `@m3e/web` `2.6.3` artifact:

- the four shared Material state-opacity roles use the equivalent percentage representation `8%`/`10%`/`10%`/`16%`;
- m3e owns the Button state layer and ripple;
- `MDButton` contains no local opacity conversion and no second ripple implementation;
- real-browser visual proof covers pointer hover, keyboard focus, pointer press, and Space-key press;
- the provisional `M3E-003` record was removed as a pre-merge misclassification and its ID retired.

The percentage values currently remain in the legacy mixed-owner migration source `src/shared/lib/md/tokens.css`. They must move unchanged to the canonical Material foundation owner during M0. Button remains `migrating` because token ownership, final verification of the resulting head, and operator visual/motion acceptance are still open.

See `../loading-indicator/README.md` for the dependency contract. `MDLoadingIndicator` owns confirmed renderer defects [`M3E-001`](../../docs/m3e-defects.md#m3e-001--loading-indicator-documented-size-input-is-not-implemented) and [`M3E-002`](../../docs/m3e-defects.md#m3e-002--uncontained-host-size-is-coupled-to-active-indicator-size).

## Official sources

Button:

- `/components/buttons/overview`;
- `/components/buttons/specs`;
- `/components/buttons/guidelines`;
- `/components/buttons/accessibility`.

Related dependency and composition sources:

- `/components/loading-indicator/overview`;
- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`;
- `/components/loading-indicator/accessibility`;
- `/components/progress-indicators/guidelines`;
- `/components/progress-indicators/accessibility`.

Renderer package:

- declared `@m3e/web@^2.6.3`, currently resolved `2.6.3`;
- Button owns only `@m3e/web/button` integration;
- `MDLoadingIndicator` owns `@m3e/web/loading-indicator` integration;
- installed package artifacts and observable browser behavior are runtime evidence;
- upstream source, demos, tags, and changelogs are supporting evidence only.

## Selected Material contract

Current consumers require:

- default actions and controlled toggle selection;
- elevated, filled, tonal, outlined, and text color configurations where selected by current stories and consumers;
- five Material sizes and round/square shapes;
- label, leading icon, selected label, and selected icon content;
- disabled behavior;
- pointer, Enter, Space, keyboard focus, visible interaction feedback, and expanded target behavior;
- native `button`, `submit`, and coherent `reset` behavior;
- boolean indeterminate loading inside Button.

Material facts selected for the public contract:

- Button has `default` and `toggle` variants;
- text toggle is valid;
- loading is a cross-component composition delegated to the independent Loading indicator component;
- loading takes precedence over normal and selected-icon content and restores the correct route afterward.

Deferred because there is no current consumer:

- link fields;
- `name` and `value`;
- trailing icon;
- determinate progress inside Button;
- the complete official Button token surface.

## Material–m3e–Vue matrix

| Material contract                                             | Required now             | Public Vue representation                                                     | Renderer/dependency mapping                                    | Owner and decision                                                                       |
| ------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Default and toggle variants                                   | yes                      | `variant: 'default' \| 'toggle'`, controlled `selected`, `update:selected`    | typed m3e Button toggle and selection mapping                  | Button — `implement-now`                                                                 |
| Five color configurations including text                      | selected current surface | `color` prop                                                                  | typed m3e Button variant mapping                               | Button — `implement-now`; text toggle supported                                          |
| Five sizes and round/square shapes                            | yes                      | `size` and `shape` props                                                      | typed m3e Button mapping                                       | Button — `implement-now`                                                                 |
| Leading icon and selected-state content                       | yes                      | `icon`, `selected-label`, `selected-icon` slots                               | private mapping to renderer slots                              | Button — `implement-now`                                                                 |
| Disabled, focus, hover, pressed feedback, and target behavior | yes                      | `disabled`; no renderer-specific ripple API                                   | m3e state layer and ripple consume shared Material state roles | Button plus Material foundation — `implement-now`; no local ripple or opacity conversion |
| Native action type                                            | yes                      | `nativeType: 'button' \| 'submit' \| 'reset'`                                 | renderer `type`                                                | Button — `implement-now`                                                                 |
| Link/form identity surface                                    | no                       | none                                                                          | renderer surface remains private and unused                    | `defer`                                                                                  |
| Loading inside Button                                         | yes                      | `loading?: boolean` parent composition state                                  | `MDButton` → `MDLoadingIndicator`                              | Button owns composition; dependency owns indicator contract                              |
| Loading accessible purpose                                    | yes                      | Button hands its action `label` to the dependency `label` prop                | dependency owns `progressbar` semantics                        | `implement-now` for this selected composition                                            |
| Loading size and color                                        | yes                      | overall-size mapping `24/24/24/32/40`; inherited color                        | dependency owns private active-size and color mapping          | `implement-now`; `M3E-001`/`M3E-002` remain dependency-owned                             |
| Loading plus selected plus selected icon                      | yes                      | loading content wins while mounted and selected content is restored afterward | slot-routing wrapper correction                                | Button — `implement-now`                                                                 |
| Native click propagation                                      | yes                      | normal bubbling plus Vue click emit                                           | `@click`, no `.stop`                                           | Button — `implement-now`                                                                 |

## Token ownership

Button may own only intentionally supported official `--md-comp-button-*` tokens and their private family-local renderer mappings in:

```text
src/shared/ui/material/components/button/tokens.css
```

Shared `--md-ref-*` and `--md-sys-*` roles, including state opacity, belong to Material foundation. Button must not define a public replacement or private conversion for a shared system role.

Every supported Button token must be listed in `../../docs/token-api.md`. Official but unsupported Button tokens remain `deferred` in this matrix. No Button component-token surface is currently required by a consumer, so no placeholder family token declarations are added.

## Dependency boundary

```text
MDButton loading state
  → MDLoadingIndicator public Vue API
      → private @m3e/web/loading-indicator mapping
```

`MDButton` does not:

- import or render raw Loading indicator m3e;
- set dependency-private variables;
- own Loading indicator accessibility, geometry, defects, or motion;
- implement or copy a ripple;
- expose m3e token vocabulary.

## Verification

Completed on the current implementation before the remaining M0 ownership migration:

- public defaults and exact package-derived renderer mappings;
- text toggle and selected/unselected content routing;
- native button/submit/reset behavior and normal click bubbling;
- disabled activation and expanded target actionability;
- canonical `MDLoadingIndicator` composition;
- loading-purpose handoff and real-browser `progressbar` resolution;
- loading precedence and restoration across normal, selected, disabled, and selected-icon combinations;
- migration of current product consumers;
- stable Button and independent Loading indicator visual baselines;
- installed-artifact revalidation of `@m3e/web` `2.6.3`;
- removal of the invalid provisional `M3E-003` record;
- compatible state-opacity grammar across selected current consumers;
- observable visual proof for real pointer hover, keyboard focus, pointer-press ripple, and Space-key ripple without private renderer DOM access.

Host `:active` and event receipt remain useful activation evidence, but they are not treated as proof of visible interaction feedback.

Pending:

- physical token-ownership migration from `src/shared/lib/md/tokens.css` to canonical Material foundation/theme and family owners;
- population of `../../docs/token-api.md` from the retained supported runtime surface;
- final `pnpm verify` on the head produced by that migration;
- operator Button and dependency visual/motion acceptance, including the new interaction-feedback baselines.

## Completion gate

M1 remains `migrating` and cannot be accepted until:

- M0 establishes canonical token owners, removes the legacy mixed-owner file, and populates the public catalogue;
- the percentage state-opacity representation is preserved under the new foundation owner;
- `MDLoadingIndicator` remains the canonical dependency adapter and its defect records stay current;
- Button has no raw dependency renderer access, dependency-private token use, local ripple, or local state-opacity conversion;
- the selected public API, accessibility, native behavior, composition combinations, consumer migration, and visible interaction feedback remain proven;
- focused verification and final `pnpm verify` pass on the resulting head;
- operator visual/motion acceptance is recorded.
