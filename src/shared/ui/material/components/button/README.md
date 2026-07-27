# Button adapter contract

Material component: Button

Migration target: `MDButton`

Implementation ownership: `migrating`

Canonical implementation: `src/shared/ui/material/components/button/MDButton.vue`

## Status

The m3e-backed Button implementation composes the canonical `MDLoadingIndicator` dependency adapter and no longer embeds raw Loading indicator renderer surface.

Corrected source decisions:

- text toggle is supported across all five Button color configurations;
- loading inside Button is an official Material cross-component composition, delegated to `MDLoadingIndicator`;
- unused link/form surface is deferred and removed from the current public API;
- determinate progress-in-button is deferred because current Button consumers use only boolean loading;
- loading takes precedence over **both** the normal icon route and the selected-icon route (the combination of `toggle` + `selected` + a `selected-icon` slot + `loading` is a valid, tested combination, not a mutually-exclusive or unreachable one).

Operator review found Button activation working but visible pressed feedback absent with the lockfile-resolved m3e `2.6.2`, initially recorded as an m3e ripple defect. After consuming `@m3e/web` `2.6.3` and inspecting the exact installed artifact, the real cause was identified as Mioframe's own foundation-token representation: `src/shared/lib/md/tokens.css` defined the four `--md-sys-state-*-state-layer-opacity` tokens as unitless numbers (`0.08`/`0.1`/`0.1`/`0.16`), which is invalid in the color-weight position of `color-mix()` — the CSS function m3e's `M3eStateLayerElement` uses for hover/focus presentation. The originally suspected ripple defect did not reproduce against the installed `2.6.3` artifact (its `M3eRippleElement` applies opacity and color as independent declarations, which accept unitless numbers). The former `M3E-003` registry entry was removed as a pre-merge misclassification; see `../../docs/m3e-defects.md#removed-records`. The correction is a foundation-level representation change (`8%`/`10%`/`10%`/`16%`), not a renderer upgrade, a new Mioframe ripple, or a Button-local conversion.

See `../loading-indicator/README.md` for the dependency contract, its public numeric `size` API, and its exact-version renderer workaround. The dependency owns confirmed renderer defects [`M3E-001`](../../docs/m3e-defects.md#m3e-001--loading-indicator-documented-size-input-is-not-implemented) and [`M3E-002`](../../docs/m3e-defects.md#m3e-002--uncontained-host-size-is-coupled-to-active-indicator-size); Button only consumes the corrected public overall-size contract.

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

- declared `@m3e/web@^2.6.3`, currently resolved `2.6.3`;
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
- Button interaction requires observable hover, focus, and pressed feedback; the current renderer implements pressed feedback through its state and ripple primitives.
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
- pointer, Enter, Space, focus, visible pressed feedback, and expanded target behavior;
- native `button`, `submit`, and coherent `reset` behavior;
- boolean indeterminate loading in `RepositoryExplorerWidget.vue`, `VfsActivityStatusChip.vue`, and `DialogForm.vue`.

Not currently required:

- `href`, `download`, `target`, `rel`;
- `name`, `value`;
- trailing icon;
- determinate progress inside Button;
- complete public Button token surface.

## Material–m3e–Vue matrix

| Material contract and exact source                                                              | Required now and evidence                | Public Vue API direction                                                                                                                                                                                                                                                                                                                                                                                                                      | Renderer/dependency mapping                                                                                                                                                                                                                      | Owner and decision                                                                                                                                                |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default and toggle variants (`buttons/overview`, `buttons/specs`)                               | yes                                      | `variant: 'default' \| 'toggle'`, controlled `selected`, `update:selected`                                                                                                                                                                                                                                                                                                                                                                    | `m3e-button.toggle`, `selected`, selection intent event                                                                                                                                                                                          | Button adapter — `implement-now`                                                                                                                                  |
| Five color configurations including text (`buttons/overview`, `buttons/guidelines`)             | yes                                      | `color` prop                                                                                                                                                                                                                                                                                                                                                                                                                                  | `m3e-button.variant`                                                                                                                                                                                                                             | Button adapter — `implement-now`; text toggle remains enabled                                                                                                     |
| Five sizes and round/square shapes (`buttons/specs`)                                            | yes                                      | `size`/`shape` props                                                                                                                                                                                                                                                                                                                                                                                                                          | typed Button renderer mapping                                                                                                                                                                                                                    | Button adapter — `implement-now`                                                                                                                                  |
| Leading icon and selected-state label/icon (`buttons/guidelines`)                               | yes                                      | `icon`, `selected-label`, `selected-icon` slots                                                                                                                                                                                                                                                                                                                                                                                               | private mapping to renderer `icon`/`selected`/`selected-icon` slots                                                                                                                                                                              | Button adapter — `implement-now`; `selected-label` replaces the ambiguous raw `selected` slot name                                                                |
| Disabled, keyboard, focus, pressed feedback, and target behavior                                | yes                                      | `disabled` prop; no renderer-specific ripple API                                                                                                                                                                                                                                                                                                                                                                                              | m3e Button state-layer/ripple primitives, consuming `--md-sys-state-*-state-layer-opacity` through `color-mix()` (state layer) and independent `opacity`/`background-color` declarations (ripple)                                                | Button adapter — `implement-now`; foundation token owns the percentage representation (`../../docs/component-tokens.md`), Button does not convert or duplicate it |
| Native action type                                                                              | yes                                      | `nativeType: 'button' \| 'submit' \| 'reset'`                                                                                                                                                                                                                                                                                                                                                                                                 | Button renderer `type`                                                                                                                                                                                                                           | `implement-now`                                                                                                                                                   |
| Link/form identity surface                                                                      | no current consumer                      | none                                                                                                                                                                                                                                                                                                                                                                                                                                          | renderer supports additional fields                                                                                                                                                                                                              | `defer`; removed from public API                                                                                                                                  |
| Loading indicator inside Button (`loading-indicator/guidelines`)                                | yes                                      | `loading?: boolean` as parent composition state, taking precedence over both the normal and selected-icon routes                                                                                                                                                                                                                                                                                                                              | `MDButton` → canonical `MDLoadingIndicator`; no raw loading renderer in Button                                                                                                                                                                   | `implement-now` — dependency adapter accepted (`../loading-indicator/README.md`)                                                                                  |
| Loading purpose/accessibility                                                                   | yes                                      | `MDButton` hands off its own `label` to `MDLoadingIndicator`'s required `label` prop. The Button label names the action; the Loading indicator represents the ongoing execution of that same action; therefore `MDButton` hands its label to `MDLoadingIndicator` as the progress-purpose accessible name for this selected composition (a demand-scoped composition decision for this pairing, not a universal rule for every future parent) | `MDLoadingIndicator` owns progressbar semantics and the `aria-label` mapping                                                                                                                                                                     | `implement-now`                                                                                                                                                   |
| Loading size and color in Button                                                                | yes                                      | `MDButton` computes `loadingIndicatorSize` from its own `size` per the Mioframe Button-to-Loading-indicator composition mapping (24/24/24/32/40, not the Button icon-size tokens) and passes it to `MDLoadingIndicator`'s numeric `size` prop, which represents the dependency's **overall** component size; color relies on `MDLoadingIndicator`'s inherited-`currentColor` mapping                                                          | dependency owns renderer sizing/color mapping and the overall/active-indicator geometry split, including the mitigations for `M3E-001` and `M3E-002`; parent never sets private `--m3e-*` variables and never computes active-indicator geometry | `implement-now`; defect lifecycle remains dependency-owned in `../../docs/m3e-defects.md`                                                                         |
| Loading plus selected plus selected-icon (`buttons/guidelines`, `loading-indicator/guidelines`) | yes — public API permits the combination | `loading` hides the `selected-icon` slot content entirely (not rendered while loading), unsetting m3e's `with-selected-icon` state so the default icon slot (containing `MDLoadingIndicator`) wins regardless of `selected`; restored once loading ends                                                                                                                                                                                       | m3e CSS precedence driven by slot assignment (`with-selected-icon` class toggled via `slotchange`)                                                                                                                                               | `implement-now` — `wrapper-correction`                                                                                                                            |
| Circular progress inside Button                                                                 | no numeric consumer                      | none                                                                                                                                                                                                                                                                                                                                                                                                                                          | future canonical Progress indicator adapter                                                                                                                                                                                                      | `defer`                                                                                                                                                           |
| Native click propagation                                                                        | yes                                      | normal bubbling plus Vue `click` emit                                                                                                                                                                                                                                                                                                                                                                                                         | `@click` (no `.stop` modifier)                                                                                                                                                                                                                   | `implement-now`                                                                                                                                                   |

## Dependency

Canonical dependency:

```text
src/shared/ui/material/components/loading-indicator/MDLoadingIndicator.vue
```

Parent boundary, as implemented:

```text
MDButton loading state
  → MDLoadingIndicator public Vue API (label, numeric size)
      → private @m3e/web/loading-indicator mapping
```

`MDButton` does not:

- import `@m3e/web/loading-indicator`;
- render `m3e-loading-indicator`;
- maintain a Loading indicator ambient renderer declaration;
- set private `--m3e-loading-indicator-*` variables;
- own Loading indicator progressbar labeling, geometry normalization, renderer divergences, defect registry entries, or motion assessment.

`MDLoadingIndicator` owns those concerns through its own matrix, implementation, tests, stories, public API, and the linked `M3E-001`/`M3E-002` records in `../../docs/m3e-defects.md`.

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
- parent-to-dependency accessible label and size handoff, including the full Button size-to-Loading-indicator-size mapping (`MDButton.test.ts`, `md-button-family.spec.ts`);
- loading precedence over **both** the normal icon route and the selected-icon route, and icon restoration to the correct route (selected vs. normal) after loading ends (`MDButton.test.ts`: "replaces the selected icon route...", "restores the selected icon after loading ends while still selected", "restores the normal icon after loading ends when no longer selected");
- disabled plus loading (`MDButton.test.ts`; `md-button-family.spec.ts` "Disabled loading action": disabled blocks activation while `aria-busy` and the nested progressbar remain present) and the full toggle/selected/`selected-icon`/loading combination (`md-button-family.spec.ts` "Toggle loading action": nested progressbar present, `selected-icon` absent from the DOM while loading);
- real-browser accessibility proof, not attribute presence alone: `md-button-family.spec.ts` resolves the nested Loading indicator as a named `progressbar` via `getByRole` for the loading, disabled-plus-loading, and toggle-plus-loading scenarios, while the Button itself remains discoverable as a `button`;
- current consumers (`RepositoryExplorerWidget.vue`, `VfsActivityStatusChip.vue`, `DialogForm.vue`) unaffected — no public API change to `loading`, and the renamed `selected-label` slot has no external consumer;
- stable executable visual-regression proof for Button itself (`tests/e2e/visual/shared-ui/md-button.spec.ts`, including the regenerated `md-button-loading.png` baseline after the dependency's overall/active-indicator geometry correction — inspected: Loading indicators remain centered in the leading-icon position, labels remain visible, rows have coherent spacing, and disabled/outlined loading presentation remains legible); the composed `MDLoadingIndicator` dependency additionally owns its own standalone executable visual-regression proof (`tests/e2e/visual/shared-ui/md-loading-indicator.spec.ts`, see `../loading-indicator/README.md`) rather than relying on this Button screenshot as its only visual evidence. The Button-to-Loading-indicator size mapping (`24/24/24/32/40`) is unchanged by that correction — it is a Button-owned overall-size composition mapping, not the dependency's internal geometry;
- dependency defect ownership is explicit: `M3E-001` and `M3E-002` are linked from the Loading size/color matrix row but remain owned by `MDLoadingIndicator` and `../../docs/m3e-defects.md`;
- pointer and keyboard activation reach the renderer and the host enters/leaves `:active`; this does **not** by itself prove visible hover, focus, or ripple feedback;
- `@m3e/web` is resolved to `2.6.3`; `M3E-001` and `M3E-002` are revalidated against the installed `2.6.3` artifact and retained unchanged (`../../docs/m3e-defects.md`); the former `M3E-003` ripple record is removed as a pre-merge misclassification;
- the four canonical Material state-opacity system tokens (`src/shared/lib/md/tokens.css`) use the percentage representation `8%`/`10%`/`10%`/`16%`, preserving the same opacity magnitude while becoming valid in `color-mix()` (m3e's state layer), `opacity` (m3e's ripple and Mioframe's legacy ripple), and `rgb(from … / <alpha>)` (Mioframe's legacy `MDStateLayer` and `ripple.css`) — all selected current consumers accept the percentage form (`../../docs/component-tokens.md`);
- real, renderer-owned pointer hover, keyboard focus, pointer-press ripple, and Space-key ripple feedback are proven with `animations: 'disabled'` screenshots against the public Button host, without inspecting private m3e shadow DOM (`tests/e2e/visual/shared-ui/md-button.spec.ts`: "MDButton renders visible renderer-owned hover feedback on real pointer hover", "…focus feedback on real keyboard focus", "…a visible settled ripple on real pointer press", "…a visible settled ripple on real Space-key press", story `RealInteractionFeedback`).

Pending:

- final `pnpm verify` after the token and proof changes;
- operator Button and dependency motion/visual acceptance, including inspection of the new interaction-feedback baselines.

## Completion gate

M1 remains `migrating` and returns to `correction` until:

- `@m3e/web` `2.6.3` is consumed and `M3E-001`/`M3E-002` are revalidated against it, with the former `M3E-003` ripple record removed as a pre-merge misclassification (`../../docs/m3e-defects.md`);
- the canonical Material state-opacity tokens use the percentage representation and no Button-local opacity conversion or ripple implementation exists;
- `MDLoadingIndicator` remains an accepted canonical dependency adapter;
- Button composes it through the public Vue boundary;
- no dependency raw m3e import, tag, type, declaration, private token, or defect lifecycle remains in Button ownership;
- text toggle is supported;
- public naming and native bubbling are corrected;
- loading accessibility, size, color, and the full selected/disabled precedence matrix (including toggle plus selected plus `selected-icon` plus loading) are verified in the browser, not only via attributes;
- real pointer hover, keyboard focus, pointer-press ripple, and Space-key ripple feedback are proven through observable browser/visual behavior, and host `:active` is no longer presented as sufficient press-presentation evidence on its own;
- current consumers use the canonical Button API;
- focused tests, visual proof, and type-check pass;
- final `pnpm verify` and operator visual/motion review pass (tracked in `../../docs/roadmap.md`).
