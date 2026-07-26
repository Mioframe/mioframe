# Button adapter contract

Material component: Button

Migration target: `MDButton`

Implementation ownership: `migrated`

Canonical implementation: `src/shared/ui/material/components/button/MDButton.vue`

## Status

The previous Material-first pass made two source-interpretation errors, corrected in this pass:

1. it treated missing text-toggle token rows as proof that text toggle is unsupported, despite positive overview and guideline evidence — corrected: text toggle is enabled;
2. it searched only Button pages for loading and incorrectly classified indicator-in-button behavior as non-Material, despite explicit Loading indicator placement guidance — corrected: indeterminate Loading indicator is implemented as a Button-owned composition, and the separate `LoadingButton` is removed.

This pass also completed unfinished correction work already recorded but not yet implemented: unused link (`href`, `download`, `target`, `rel`) and form-identity (`name`, `value`) surface has been removed from the public API because no current consumer uses it.

## Official sources

Button:

- `/components/buttons/overview`;
- `/components/buttons/specs`;
- `/components/buttons/guidelines`;
- `/components/buttons/accessibility`.

Related Material compositions:

- `/components/loading-indicator/guidelines`;
- `/components/loading-indicator/accessibility`;
- `/components/progress-indicators/guidelines`;
- `/components/progress-indicators/accessibility`.

Renderer package:

- `@m3e/web@^2.6.2`, resolved `2.6.2`;
- Button entry: `@m3e/web/button` (`M3eButtonElement`, `ButtonShape`, `ButtonSize`, `ButtonVariant`);
- Loading indicator entry: `@m3e/web/loading-indicator` (`M3eLoadingIndicatorElement`, `LoadingIndicatorVariant`);
- Progress indicator entry inspected but not consumed yet: `@m3e/web/progress-indicator` (`M3eCircularProgressIndicatorElement`).

## Confirmed official Material facts

- Button has `default` and `toggle` variants.
- Elevated, filled, tonal, outlined, and text are five color configurations.
- Official Button guidelines show default, unselected toggle, and selected toggle across all five color configurations. Text toggle is supported.
- Button sizes are extra small, small, medium, large, and extra large; small is the default.
- Button shapes are round and square; round is the default.
- A Button may contain one leading icon. Toggle label and icon content may change with selected state.
- Loading indicators may be placed inside buttons for short actions that take a few seconds.
- Circular progress indicators may be placed inside buttons while an action is in progress; the active indicator should use the same color as the Button icon or label and the track should be removed.

Token-table omissions do not override these positive component and placement rules.

## Current product needs (evidence)

Audited every current `MDButton` and (removed) `LoadingButton` consumer under `src/`:

- default actions — used throughout the app;
- controlled toggle selection — `MDButton.stories.ts` `BehaviorContracts`, consumer usage elsewhere;
- filled, outlined, and text color configurations — used throughout;
- current size and shape scenarios — used in several widgets/features;
- visible and accessible label content;
- optional leading icon and selected-state content;
- disabled behavior;
- native `button` and `submit` behavior (`DialogForm.vue`, `DatabaseViewAddForm.vue`); no current consumer uses `reset` on `MDButton`, but the native type contract keeps it as one coherent enum;
- expanded interaction target (`MDButtonTargetHitVisualStory.vue`);
- indeterminate async-action indication — `RepositoryExplorerWidget.vue`, `VfsActivityStatusChip.vue`, and `DialogForm.vue` all show a spinner while a boolean loading flag is true.

Not required by any current consumer:

- `href`, `download`, `target`, `rel` (link-button behavior) — no consumer sets these;
- `name`, `value` (form-identity pair) — no consumer sets these; the two current `submit` buttons (`DialogForm.vue`, `DatabaseViewAddForm.vue`) rely on being the form's only/primary submitter and do not need a name/value pair;
- determinate progress inside a Button — audited every `loading`-prop pass-through (`RepositoryExplorerWidget.vue`, `VfsActivityStatusChip.vue`, `DialogForm.vue` → `MDDialog.vue` → all `MDDialog`/`DialogForm` consumers). Every one passes a boolean or a boolean-coercing expression (`!!loading`, `loading > 0`, `isXLoading`). The two places that do carry a real fractional value (`ImportZipDialog.vue`, `ExportZipDialog.vue`) render `MDCircularProgressIndicator` directly inside a dialog icon slot, never through a Button. Circular progress-in-button therefore has no current consumer and is deferred.

## Material–m3e–Vue matrix

| Material contract and exact source                                                                                     | Required now and evidence                                                           | Public Vue API                                                                           | m3e support                                                                               | Owner and decision                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Default and toggle Button variants (`buttons/overview`, `buttons/specs`)                                               | yes — `BehaviorContracts` story, toggle consumers                                   | `variant: 'default' \| 'toggle'`, `selected` (controlled), `update:selected` emit        | `toggle`, `selected` attrs, `beforeinput`/`input`/`change` events                         | `direct` m3e + Vue controlled-state mapping — `implement-now`                                          |
| Five Button color configurations including text (`buttons/overview`, `buttons/specs`, `buttons/guidelines`)            | yes — used throughout the app                                                       | `color: 'elevated' \| 'filled' \| 'tonal' \| 'outlined' \| 'text'`                       | `variant` attr                                                                            | `direct` — `implement-now`; text toggle remains enabled (no prohibition exists, see Status)            |
| Five sizes and round/square shapes (`buttons/overview`, `buttons/specs`)                                               | yes — `SizeGeometryMatrix`, `ToggleShapes` stories, several consumers               | `size`, `shape: 'round' \| 'square'`                                                     | `size` attr; `shape` renderer value `rounded`/`square` (typed normalization)              | `direct` — `implement-now`                                                                             |
| Leading icon and selected-state label/icon content (`buttons/guidelines`)                                              | yes — icon slot used across the app; selected content in toggle stories             | `icon`, `selected`, `selected-icon` slots                                                | documented `icon`, `selected`, `selected-icon` renderer slots                             | `direct` slot mapping — `implement-now`                                                                |
| `trailing-icon` renderer slot (`buttons/guidelines`)                                                                   | no current consumer                                                                 | none                                                                                     | documented `trailing-icon` renderer slot exists                                           | `defer`                                                                                                |
| Disabled, keyboard, focus, press, and target behavior (`buttons/specs`, `buttons/accessibility`, `buttons/guidelines`) | yes                                                                                 | `disabled` prop only; renderer owns keyboard/focus/press/target                          | `direct` renderer behavior                                                                | `direct` — `implement-now`; operator reviews renderer-owned motion                                     |
| Native `button`/`submit` integration                                                                                   | yes — `DialogForm.vue`, `DatabaseViewAddForm.vue`                                   | `nativeType: 'button' \| 'submit' \| 'reset'` (kept as one enum; `reset` unused today)   | `type` attr                                                                               | `implement-now`                                                                                        |
| Link button behavior (`href`, `download`, `target`, `rel`)                                                             | no current consumer (audited)                                                       | none                                                                                     | `LinkButtonMixin` fields exist on `M3eButtonElement`                                      | `defer` — removed from public API; not exposed for hypothetical completeness                           |
| Form-identity pair (`name`, `value`)                                                                                   | no current consumer (audited)                                                       | none                                                                                     | `FormSubmitterMixin` fields exist on `M3eButtonElement`                                   | `defer` — removed from public API                                                                      |
| Loading indicator inside Button (`loading-indicator/guidelines`, placement)                                            | yes — `RepositoryExplorerWidget.vue`, `VfsActivityStatusChip.vue`, `DialogForm.vue` | `loading?: boolean`; renders in the `icon` slot position, replacing user icon while true | `m3e-loading-indicator` (`@m3e/web/loading-indicator`), narrow internal composition       | Material-owned Button composition, internal light-DOM use of `m3e-loading-indicator` — `implement-now` |
| Circular progress indicator inside Button (`progress-indicators/guidelines`, "Progress indicators in buttons")         | no current numeric consumer (audited; see Current product needs)                    | none                                                                                     | `m3e-circular-progress-indicator` (`@m3e/web/progress-indicator`) inspected, not consumed | `defer` — official Material composition, but no current consumer passes a real fractional value        |
| Busy semantics while loading                                                                                           | yes (composition requirement)                                                       | `aria-busy` bound on `m3e-button` itself                                                 | native ARIA passthrough attribute                                                         | wrapper-owned — `implement-now`                                                                        |
| Loading indicator color (`progress-indicators/guidelines` "same color as icon or label")                               | yes                                                                                 | none (presentation-only)                                                                 | `--m3e-loading-indicator-active-indicator-color` mapped to `currentColor`                 | inherited `currentColor`, no duplicated color matrix — `implement-now`                                 |
| Public Button component tokens (`--md-comp-*`)                                                                         | no current override need                                                            | none                                                                                     | renderer CSS inputs exist                                                                 | `defer`                                                                                                |
| Rapid-click modified curve                                                                                             | no measured need                                                                    | none                                                                                     | inspect only if selected later                                                            | `defer`                                                                                                |

## Public Vue API (summary)

```ts
props: {
  nativeType?: 'button' | 'submit' | 'reset'; // default 'button'
  color?: 'elevated' | 'filled' | 'tonal' | 'outlined' | 'text'; // default 'filled'
  label: string;
  disabled?: boolean;
  variant?: 'default' | 'toggle'; // default 'default'
  size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large'; // default 'small'
  shape?: 'round' | 'square'; // default 'round'
  selected?: boolean; // controlled, only meaningful for variant 'toggle'
  loading?: boolean; // shows the Loading indicator composition
}
emits: {
  click: [MouseEvent];
  'update:selected': [boolean];
}
slots: {
  icon(): unknown;
  selected(): unknown;
  'selected-icon'(): unknown;
}
```

Text toggle (`color="text"` with `variant="toggle"`) is a supported combination; no normalization or dev warning restricts it.

## Documented cross-component composition

Indeterminate loading is a documented Material composition (Loading indicator guidelines: placement inside buttons for short actions). It is represented as the smallest suitable API: a `loading` boolean prop on `MDButton` that swaps the `icon` slot content for `<m3e-loading-indicator>`, a narrow internal composition using a documented m3e family entry point. No separate public component was created because no other current consumer needs a standalone Loading Indicator outside Button.

Circular progress-in-button is the same kind of documented composition but is deferred: no current consumer supplies a real fractional value to a Button (see Current product needs). If a future consumer needs it, add a `progress?: number` (or similar) prop following the same internal-composition pattern with `@m3e/web/progress-indicator`, remove the track per Material guidance, and inherit color from the rendered label/icon exactly as the loading indicator does.

## Deferred Material surface

- `trailing-icon` renderer slot;
- link-button behavior (`href`, `download`, `target`, `rel`);
- form-identity pair (`name`, `value`);
- determinate circular progress-in-button;
- public `--md-comp-button-*` component tokens;
- rapid-click modified curve.

## True non-Material requirements

None identified. The former `LoadingButton` was not a true non-Material requirement — it implemented a documented Material composition (Loading indicator placement inside Button) outside the Material boundary, with an extra wrapper root, `aria-busy` on the wrong owner, and a duplicated color route. It has been removed; its 3 consumers (`RepositoryExplorerWidget.vue`, `VfsActivityStatusChip.vue`, `DialogForm.vue`) now use `MDButton`'s `loading` prop directly.

## Source gaps

None blocking. Token coverage for text toggle is incomplete, but overview/guideline prose positively documents the combination, so the capability remains supported per the source-evidence rules in `docs/architecture.md`.

## Implementation ownership

- m3e Button owns geometry, internal layout, state layer, ripple, focus treatment, elevation, selected/pressed shape behavior, private accessibility, and motion.
- m3e Loading indicator owns its own internal motion and rendering; the adapter only sets `currentColor` through the documented `--m3e-loading-indicator-active-indicator-color` CSS input.
- The Vue adapter owns Material-to-Vue names, controlled selection intent, required native integration, slots, event normalization, `aria-busy` on the interactive owner, and the icon/indicator content-slot composition.
- The adapter does not inspect private shadow DOM or copy Button/indicator internals.

## Verification

Covered by `MDButton.test.ts`:

- stable defaults and explicit shape/size/color/type mapping;
- accessible label and optional leading icon through public slots;
- explicit disabled and native type mapping;
- selected content/selected-icon routed through documented renderer slots;
- toggle mutation cancellation and controlled `update:selected` intent;
- text-color toggle enabled; `selected` ignored for default actions;
- Loading indicator shown in place of the leading icon with `aria-busy="true"` on the interactive `m3e-button`;
- leading icon and `aria-busy` restored once loading ends.

Visual stories (`MDButton.stories.ts`) cover color/size/shape states, toggle shapes including text, disabled+selected+outlined+text, expanded hit target, focus indicator target, and `LoadingIndicatorPresentation` (loading across filled/outlined/text/tonal colors, with an icon, and disabled+loading together).

Not required: one test per renderer field, a complete token matrix, or automated proof of renderer-owned indicator motion (operator manual review covers that).

## Completion gate

M1 is complete:

- the matrix uses positive official evidence and related-component sources;
- text toggle is supported;
- loading-in-button is owned as a documented Material composition inside `MDButton`;
- unused public native/link surface (`href`, `download`, `target`, `rel`, `name`, `value`) is removed;
- the final Vue API is Material-oriented and demand-driven;
- all current consumers use `MDButton` directly; `LoadingButton` is removed;
- focused verification passes (see task VERIFY RESULT); final `pnpm verify` pending;
- operator visual and motion review: **required** (indicator motion and color across the visual stories above).
