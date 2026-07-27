# Button adapter contract

Material component: Button

Migration target: `MDButton`

Implementation ownership: `migrating`

Canonical implementation: `src/shared/ui/material/components/button/MDButton.vue`

## Status

The m3e-backed Button implementation composes the canonical `MDLoadingIndicator` dependency adapter and no longer embeds raw Loading indicator renderer surface.

Accepted source decisions:

- text toggle is supported across all five Button color configurations;
- loading inside Button is an official Material cross-component composition delegated to `MDLoadingIndicator`;
- unused link/form surface is deferred;
- determinate progress-in-button is deferred because current consumers use only boolean loading;
- loading takes precedence over both normal and selected-icon routes and restores the correct route afterward.

Operator review found an unresolved integration/foundation issue: Button activation works, but visible ripple feedback is absent with the current unitless system state-opacity representation. With installed m3e `2.6.3`, changing pressed opacity from `0.1` to `10%` restores the effect.

This is not currently a confirmed m3e defect. The provisional `M3E-003` classification was withdrawn before merge and its ID retired. The correction must audit installed m3e artifacts and all selected state-opacity consumers, then choose the compatible foundation representation or narrowest owner-local mapping. Button must not implement a second ripple.

See `../loading-indicator/README.md` for the dependency contract. The dependency owns confirmed renderer defects [`M3E-001`](../../docs/m3e-defects.md#m3e-001--loading-indicator-documented-size-input-is-not-implemented) and [`M3E-002`](../../docs/m3e-defects.md#m3e-002--uncontained-host-size-is-coupled-to-active-indicator-size); Button only consumes the corrected public overall-size contract.

## Official sources

Button:

- `/components/buttons/overview`;
- `/components/buttons/specs`;
- `/components/buttons/guidelines`;
- `/components/buttons/accessibility`.

Related dependencies and compositions:

- `/components/loading-indicator/overview`;
- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`;
- `/components/loading-indicator/accessibility`;
- `/components/progress-indicators/guidelines`;
- `/components/progress-indicators/accessibility`.

Renderer package:

- declared `@m3e/web@^2.6.3`, resolved `2.6.3`;
- Button owns `@m3e/web/button` only;
- `MDLoadingIndicator` owns `@m3e/web/loading-indicator`;
- installed package artifacts and observable browser behavior are runtime evidence;
- upstream source, demos, tags, and changelogs are supporting evidence only.

## Confirmed official Material facts

- Button has `default` and `toggle` variants.
- Elevated, filled, tonal, outlined, and text are five color configurations.
- Text toggle is supported.
- Sizes are extra small, small, medium, large, and extra large; small is default.
- Shapes are round and square; round is default.
- A Button may contain one leading icon; toggle content may change with selected state.
- Button interaction requires observable hover, focus, and pressed feedback.
- Loading indicators may be placed inside buttons for short actions.
- Loading indicator is an independent Material component.

Token-table omissions do not override positive overview or guideline evidence.

## Current product needs

Current consumers require:

- default actions and controlled toggle selection;
- filled, outlined, and text configurations;
- current size and shape scenarios;
- label, leading icon, and selected-state content;
- disabled behavior;
- pointer, Enter, Space, focus, visible interaction feedback, and expanded target behavior;
- native `button`, `submit`, and coherent `reset` behavior;
- boolean indeterminate loading in current product consumers.

Not currently required:

- link fields;
- `name` and `value`;
- trailing icon;
- determinate progress inside Button;
- complete official Button token surface.

## Material–m3e–Vue matrix

| Material contract and source                                      | Required now        | Public Vue/token API                                              | Renderer/dependency mapping                                                                    | Owner and decision                                                                                      |
| ----------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Default and toggle variants                                       | yes                 | `variant`, controlled `selected`, `update:selected`               | typed m3e Button properties/event                                                              | Button — `implement-now`                                                                                |
| Five color configurations including text                          | yes                 | `color`                                                           | m3e Button variant                                                                             | Button — `implement-now`                                                                                |
| Five sizes and round/square shapes                                | yes                 | `size`, `shape`                                                   | typed renderer mapping                                                                         | Button — `implement-now`                                                                                |
| Leading icon and selected content                                 | yes                 | `icon`, `selected-label`, `selected-icon` slots                   | private renderer slots                                                                         | Button — `implement-now`                                                                                |
| Disabled, keyboard, focus, hover, pressed/ripple, target behavior | yes                 | `disabled`; no renderer-specific ripple API                       | m3e state/focus/ripple; visible feedback currently blocked by state-opacity CSS representation | Material foundation plus Button verification — `wrapper-correction` pending consumer audit; not `M3E-*` |
| Native action type                                                | yes                 | `nativeType` prop with button, submit, and reset values           | renderer `type`                                                                                | Button — `implement-now`                                                                                |
| Link/form identity surface                                        | no current consumer | none                                                              | renderer supports more surface                                                                 | `defer`                                                                                                 |
| Loading indicator inside Button                                   | yes                 | `loading?: boolean`                                               | `MDButton` → `MDLoadingIndicator`                                                              | `implement-now`                                                                                         |
| Loading purpose/accessibility                                     | yes                 | Button label is handed to the selected progress composition       | dependency owns progressbar semantics                                                          | `implement-now`                                                                                         |
| Loading size and color                                            | yes                 | Button maps sizes to overall indicator sizes `24/24/24/32/40`     | dependency owns renderer sizing/color and `M3E-001`/`M3E-002` workarounds                      | `implement-now`                                                                                         |
| Loading plus selected plus selected-icon                          | yes                 | loading temporarily hides selected icon route and restores it     | slot routing                                                                                   | `wrapper-correction`                                                                                    |
| Circular determinate progress                                     | no numeric consumer | none                                                              | future canonical adapter                                                                       | `defer`                                                                                                 |
| Native click propagation                                          | yes                 | normal bubbling plus Vue `click` emit                             | `@click` without stop                                                                          | `implement-now`                                                                                         |
| Selected official Button component tokens                         | demand-driven       | future `components/button/tokens.css` entries plus `token-api.md` | family-local documented m3e mappings                                                           | Button family; complete catalogue not copied                                                            |

## Token ownership

Button owns only supported official `--md-comp-button-*` tokens and their private renderer mappings in:

```text
src/shared/ui/material/components/button/tokens.css
```

Shared `--md-ref-*` and `--md-sys-*` roles, including state opacity, belong to Material foundation. Button must not define a component-local public replacement for a shared system role.

Every supported Button token must be listed in `../../docs/token-api.md`. Official but unsupported Button tokens remain `deferred` in this matrix.

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

Completed proof includes:

- public defaults and typed renderer mappings;
- text toggle and selected content routing;
- native button/submit/reset behavior and click bubbling;
- disabled activation and expanded target actionability;
- canonical Loading indicator composition;
- accessible loading-purpose and progressbar resolution in the browser;
- loading precedence/restoration combinations;
- current consumer migration;
- stable Button and Loading indicator visual baselines;
- pointer and keyboard activation reaching host `:active`.

Host `:active` proves input receipt only. It does not prove visible feedback.

Pending:

- complete token-ownership migration and establish Material foundation as the state-opacity owner;
- audit every selected state-opacity consumer and CSS grammar;
- choose one compatible foundation representation or the narrowest owner-local mapping;
- prove visible pointer hover, keyboard focus, pointer ripple, and Space-key ripple through observable browser/visual output without private DOM inspection;
- revalidate `M3E-001` and `M3E-002` against installed m3e `2.6.3`;
- run final `pnpm verify`;
- obtain operator Button and dependency visual/motion acceptance.

## Completion gate

M1 remains `migrating` and `correction` until:

- canonical token owners and `token-api.md` replace the legacy mixed-owner token file;
- visible interaction feedback is restored and proven;
- no Button-owned ripple or inappropriate local system-token override exists;
- `M3E-001` and `M3E-002` are revalidated against the consumed version;
- `MDLoadingIndicator` remains the accepted dependency adapter;
- no dependency renderer surface leaks into Button ownership;
- selected combinations, accessibility, native behavior, and consumer migration remain verified;
- focused proof, visual proof, type-check, final `pnpm verify`, and operator review pass.
