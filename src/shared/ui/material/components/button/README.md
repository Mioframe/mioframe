# Button adapter contract

Material component: Button

Migration target: `MDButton`

Implementation ownership: `migrated`

Canonical implementation: `src/shared/ui/material/components/button/MDButton.vue`

## Status

The m3e-backed Button implementation composes the canonical `MDLoadingIndicator` dependency adapter and no longer embeds raw Loading indicator renderer surface.

Corrected source decisions:

- text toggle is supported across all five Button color configurations;
- loading inside Button is an official Material cross-component composition, delegated to `MDLoadingIndicator`;
- unused link/form surface is deferred and removed from the current public API;
- determinate progress-in-button is deferred because current Button consumers use only boolean loading.

See `../loading-indicator/README.md` for the dependency contract.

## Official sources

Button:

- `/components/buttons/overview`;
- `/components/buttons/specs`;
- `/components/buttons/guidelines`;
- `/components/buttons/accessibility`.

Related official dependencies and compositions:

- `/components/loading-indicator/overview`;
- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`;
- `/components/loading-indicator/accessibility`;
- `/components/progress-indicators/guidelines`;
- `/components/progress-indicators/accessibility`.

Renderer package:

- `@m3e/web@^2.6.2`, resolved `2.6.2`;
- Button adapter owns `@m3e/web/button` only;
- `MDLoadingIndicator` owns `@m3e/web/loading-indicator`;
- Progress indicator remains deferred and must receive its own canonical adapter before future Button composition.

## Confirmed official Material facts

- Button has `default` and `toggle` variants.
- Elevated, filled, tonal, outlined, and text are five color configurations.
- Official Button guidance shows default, unselected toggle, and selected toggle across all five color configurations; text toggle is supported.
- Button sizes are extra small, small, medium, large, and extra large; small is the default. Official `md.comp.button.<size>.icon.size` tokens are 20dp (extra-small/small), 24dp (medium), 32dp (large), 40dp (extra-large).
- Button shapes are round and square; round is the default.
- A Button may contain one leading icon. Toggle label and icon content may change with selected state.
- Loading indicators may be placed inside buttons for short actions (`loading-indicator/guidelines`, "Placement").
- Loading indicator is an independent Material component, not renderer-private Button anatomy.
- Circular progress indicators may be placed inside buttons, but no current Button consumer requires determinate progress.

Token-table omissions do not override positive overview or guideline evidence.

## Current product needs

Current consumers require:

- default actions;
- controlled toggle selection;
- filled, outlined, and text color configurations;
- current size and shape scenarios;
- visible and accessible label content;
- optional leading icon and selected-state content;
- disabled behavior;
- pointer, Enter, Space, focus, and expanded target behavior;
- native `button`, `submit`, and coherent `reset` behavior;
- boolean indeterminate loading in `RepositoryExplorerWidget.vue`, `VfsActivityStatusChip.vue`, and `DialogForm.vue`.

Not currently required:

- `href`, `download`, `target`, `rel`;
- `name`, `value`;
- trailing icon;
- determinate progress inside Button;
- complete public Button token surface.

## Material–m3e–Vue matrix

| Material contract and exact source                                                  | Required now and evidence | Public Vue API direction                                                                                                                                                                                                             | Renderer/dependency mapping                                                                  | Owner and decision                                                                                 |
| ----------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Default and toggle variants (`buttons/overview`, `buttons/specs`)                   | yes                       | `variant: 'default' \| 'toggle'`, controlled `selected`, `update:selected`                                                                                                                                                           | `m3e-button.toggle`, `selected`, selection intent event                                      | Button adapter — `implement-now`                                                                   |
| Five color configurations including text (`buttons/overview`, `buttons/guidelines`) | yes                       | `color` prop                                                                                                                                                                                                                         | `m3e-button.variant`                                                                         | Button adapter — `implement-now`; text toggle remains enabled                                      |
| Five sizes and round/square shapes (`buttons/specs`)                                | yes                       | `size`/`shape` props                                                                                                                                                                                                                 | typed Button renderer mapping                                                                | Button adapter — `implement-now`                                                                   |
| Leading icon and selected-state label/icon (`buttons/guidelines`)                   | yes                       | `icon`, `selected-label`, `selected-icon` slots                                                                                                                                                                                      | private mapping to renderer `icon`/`selected`/`selected-icon` slots                          | Button adapter — `implement-now`; `selected-label` replaces the ambiguous raw `selected` slot name |
| Disabled, keyboard, focus, press, and target behavior                               | yes                       | `disabled` prop                                                                                                                                                                                                                      | Button renderer                                                                              | direct renderer ownership plus browser/operator verification                                       |
| Native action type                                                                  | yes                       | `nativeType: 'button' \| 'submit' \| 'reset'`                                                                                                                                                                                        | Button renderer `type`                                                                       | `implement-now`                                                                                    |
| Link/form identity surface                                                          | no current consumer       | none                                                                                                                                                                                                                                 | renderer supports additional fields                                                          | `defer`; removed from public API                                                                   |
| Loading indicator inside Button (`loading-indicator/guidelines`)                    | yes                       | `loading?: boolean` as parent composition state                                                                                                                                                                                      | `MDButton` → canonical `MDLoadingIndicator`; no raw loading renderer in Button               | `implement-now` — dependency adapter accepted (`../loading-indicator/README.md`)                   |
| Loading purpose/accessibility                                                       | yes                       | `MDButton` hands off its own `label` to `MDLoadingIndicator`'s required `label` prop                                                                                                                                                 | `MDLoadingIndicator` owns progressbar semantics and the `aria-label` mapping                 | `implement-now`                                                                                    |
| Loading size and color in Button                                                    | yes                       | `MDButton` computes `loadingIndicatorSize` from its own `size` per the official Button icon-size tokens and passes it to `MDLoadingIndicator`'s `size` prop; color relies on `MDLoadingIndicator`'s inherited-`currentColor` mapping | dependency owns renderer sizing/color mapping; parent never sets private `--m3e-*` variables | `implement-now`                                                                                    |
| Circular progress inside Button                                                     | no numeric consumer       | none                                                                                                                                                                                                                                 | future canonical Progress indicator adapter                                                  | `defer`                                                                                            |
| Native click propagation                                                            | yes                       | normal bubbling plus Vue `click` emit                                                                                                                                                                                                | `@click` (no `.stop` modifier)                                                               | `implement-now`                                                                                    |

## Dependency

Canonical dependency:

```text
src/shared/ui/material/components/loading-indicator/MDLoadingIndicator.vue
```

Parent boundary, as implemented:

```text
MDButton loading state
  → MDLoadingIndicator public Vue API (label, size)
      → private @m3e/web/loading-indicator mapping
```

`MDButton` does not:

- import `@m3e/web/loading-indicator`;
- render `m3e-loading-indicator`;
- maintain a Loading indicator ambient renderer declaration;
- set private `--m3e-loading-indicator-*` variables;
- own Loading indicator progressbar labeling, geometry normalization, renderer divergences, or motion assessment.

`MDLoadingIndicator` owns those concerns through its own matrix, implementation, tests, stories, and public API (see `../loading-indicator/README.md`).

## Public Button API

The Button API:

- uses official Material terminology;
- exposes only the current demand-scoped subset;
- supports text toggle;
- names the public selected label slot `selected-label` (mapped privately to m3e's `selected` slot);
- preserves normal native click bubbling (`@click`, no `.stop`);
- retains `loading` only as documented parent composition state;
- delegates Loading indicator rendering and accessibility to `MDLoadingIndicator`;
- keeps renderer types and vocabulary private.

## Required verification

Completed:

- stable Button defaults and exact typed renderer mappings (`MDButton.test.ts`);
- text toggle selected/unselected (`MDButton.test.ts`, story `ToggleShapes`);
- explicit `selected-label`/`selected-icon` public naming with private renderer routing (`MDButton.test.ts`);
- native button/submit/reset behavior (story `BehaviorContracts`, `md-button-family.spec.ts`);
- normal parent click bubbling (`md-button-family.spec.ts`, "preserves normal native click bubbling to ancestor listeners");
- disabled activation blocking, expanded target actionability (`md-button-family.spec.ts`);
- `MDButton` renders `MDLoadingIndicator`, not raw m3e (`MDButton.test.ts`, `md-button-family.spec.ts`);
- parent-to-dependency accessible label and icon-size handoff (`MDButton.test.ts`, `md-button-family.spec.ts`);
- loading precedence over the normal icon route, icon restoration after loading (`MDButton.test.ts`);
- disabled plus loading and selected plus loading (existing stories `LoadingIndicatorPresentation`, `DisabledSelectedOutlinedAndText`);
- current consumers (`RepositoryExplorerWidget.vue`, `VfsActivityStatusChip.vue`, `DialogForm.vue`) unaffected — no public API change to `loading`, and the renamed `selected-label` slot has no external consumer;
- stable visual stories.

Pending:

- final `pnpm verify`;
- operator Button and dependency motion/visual acceptance.

## Completion gate

M1 is complete pending final verification and operator review:

- `MDLoadingIndicator` is accepted as a canonical dependency adapter;
- Button composes it through the public Vue boundary;
- no dependency raw m3e import, tag, type, declaration, or private token remains in Button ownership;
- text toggle is supported;
- public naming and native bubbling are corrected;
- loading accessibility, size, color, selected/disabled precedence, and restoration are verified;
- current consumers use the canonical Button API;
- focused tests and type-check pass;
- final `pnpm verify` and operator visual/motion review remain (tracked in `../../docs/roadmap.md`).
