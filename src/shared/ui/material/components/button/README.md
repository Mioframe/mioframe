# Button adapter contract

Material component: Button

Migration target: `MDButton`

Implementation ownership: `migrating`

Canonical implementation candidate: `src/shared/ui/material/components/button/MDButton.vue`

## Status

The current m3e-backed Button implementation contains reusable work, but it is not accepted or complete.

Corrected source decisions:

- text toggle is supported across all five Button color configurations;
- loading inside Button is an official Material cross-component composition;
- unused link/form surface is deferred and removed from the current public API;
- determinate progress-in-button is deferred because current Button consumers use only boolean loading.

Remaining ownership error:

- `MDButton` imports and renders raw `m3e-loading-indicator` directly;
- Loading indicator is a separate official Material component and must first be implemented as canonical `MDLoadingIndicator` through the full adapter workflow;
- Button may retain `loading?: boolean` as parent composition state, but it must render `MDLoadingIndicator` and use only its public Vue/token boundary.

See `../loading-indicator/README.md` for the required dependency contract.

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
- `MDLoadingIndicator` must own `@m3e/web/loading-indicator`;
- Progress indicator remains deferred and must receive its own canonical adapter before future Button composition.

## Confirmed official Material facts

- Button has `default` and `toggle` variants.
- Elevated, filled, tonal, outlined, and text are five color configurations.
- Official Button guidance shows default, unselected toggle, and selected toggle across all five color configurations; text toggle is supported.
- Button sizes are extra small, small, medium, large, and extra large; small is the default.
- Button shapes are round and square; round is the default.
- A Button may contain one leading icon. Toggle label and icon content may change with selected state.
- Loading indicators may be placed inside buttons for short actions.
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

| Material contract and exact source | Required now and evidence | Public Vue API direction | Renderer/dependency mapping | Owner and decision |
| --- | --- | --- | --- | --- |
| Default and toggle variants (`buttons/overview`, `buttons/specs`) | yes | `variant: 'default' \| 'toggle'`, controlled `selected`, `update:selected` | `m3e-button.toggle`, `selected`, selection intent event | Button adapter — `implement-now` |
| Five color configurations including text (`buttons/overview`, `buttons/guidelines`) | yes | Material color prop | `m3e-button.variant` | Button adapter — `implement-now`; text toggle remains enabled |
| Five sizes and round/square shapes (`buttons/specs`) | yes | Material size/shape names | typed Button renderer mapping | Button adapter — `implement-now` |
| Leading icon and selected-state label/icon (`buttons/guidelines`) | yes | explicit Vue names such as `icon`, `selected-label`, `selected-icon` | private mapping to renderer slots | Button adapter — correction required; do not expose ambiguous raw `selected` slot name |
| Disabled, keyboard, focus, press, and target behavior | yes | selected public state only | Button renderer | direct renderer ownership plus browser/operator verification |
| Native action type | yes | `nativeType: 'button' \| 'submit' \| 'reset'` | Button renderer `type` | `implement-now` |
| Link/form identity surface | no current consumer | none | renderer supports additional fields | `defer`; removed from public API |
| Loading indicator inside Button (`loading-indicator/guidelines`) | yes | `loading?: boolean` as parent composition state | `MDButton` → canonical `MDLoadingIndicator`; no raw loading renderer in Button | dependency adapter required before Button completion |
| Loading purpose/accessibility | yes | exact parent-to-dependency label handoff must be defined | `MDLoadingIndicator` owns progressbar semantics and accessible name | dependency correction required |
| Loading size and color in Button | yes | handoff through `MDLoadingIndicator` public API or selected official Material tokens | dependency owns renderer sizing/color mapping; parent must not set private `--m3e-*` | dependency correction required |
| Circular progress inside Button | no numeric consumer | none | future canonical Progress indicator adapter | `defer` |
| Native click propagation | yes | normal bubbling plus Vue `click` emit | current code still uses `.stop` | Button correction required |

## Required dependency

Canonical dependency:

```text
src/shared/ui/material/components/loading-indicator/MDLoadingIndicator.vue
```

Required parent boundary:

```text
MDButton loading state
  → MDLoadingIndicator public Vue API
      → private @m3e/web/loading-indicator mapping
```

`MDButton` must not:

- import `@m3e/web/loading-indicator`;
- render `m3e-loading-indicator`;
- maintain `m3eLoadingIndicator.d.ts`;
- set private `--m3e-loading-indicator-*` variables;
- own Loading indicator progressbar labeling, geometry normalization, renderer divergences, or motion assessment.

`MDLoadingIndicator` must own those concerns through its own matrix, implementation, tests, stories, public tokens, and operator review.

## Public Button API constraints

The final Button API must:

- use official Material terminology;
- expose only the current demand-scoped subset;
- support text toggle;
- rename the public selected label slot to explicit Material/Vue terminology and map it privately to m3e `selected`;
- preserve normal native click bubbling;
- retain loading only as documented parent composition state;
- delegate Loading indicator rendering and accessibility to `MDLoadingIndicator`;
- keep renderer types and vocabulary private.

## Current implementation blockers

1. `@click.stop` still suppresses native bubbling.
2. Public `selected` slot still copies renderer vocabulary instead of an explicit selected-label contract.
3. Raw `m3e-loading-indicator` bypasses the missing `MDLoadingIndicator` adapter.
4. Loading indicator default renderer geometry does not match Button icon geometry and is not normalized by an owning dependency adapter.
5. Loading indicator accessible-purpose labeling is unresolved.
6. Loading precedence over selected-icon routing is unresolved.
7. Loading indicator ambient typing is handwritten instead of package-derived inside its own adapter.
8. Exact m3e size-input naming and reduced-motion divergences are not assigned to the dependency owner.
9. README/roadmap completion claims from the prior pass were premature despite green verification.

## Required verification

Button-focused proof after `MDLoadingIndicator` is accepted:

- stable Button defaults and exact typed renderer mappings;
- text toggle selected/unselected;
- explicit selected-label and selected-icon public naming with private renderer routing;
- native button/submit/reset behavior;
- normal parent click bubbling;
- disabled activation blocking;
- expanded target actionability;
- `MDButton` renders `MDLoadingIndicator`, not raw m3e;
- parent-to-dependency accessible label, icon-size, inherited color/public-token, and active-state handoff;
- loading precedence for normal and selected icon routes;
- icon restoration after loading;
- disabled plus loading and selected plus loading;
- current consumers;
- stable visual stories;
- final `pnpm verify`;
- operator Button and dependency motion/visual acceptance.

Green CI for the current raw dependency implementation is reusable evidence only. It is not architecture approval.

## Completion gate

M1 completes only when:

- `MDLoadingIndicator` is accepted as a canonical dependency adapter;
- Button composes it through the public Vue boundary;
- no dependency raw m3e import, tag, type, declaration, or private token remains in Button ownership;
- text toggle is supported;
- public naming and native bubbling are corrected;
- loading accessibility, size, color, selected/disabled precedence, and restoration are verified;
- current consumers use the canonical Button API;
- focused and final verification pass;
- operator accepts Button and Loading indicator visual/motion behavior.
