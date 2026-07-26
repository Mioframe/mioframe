# Button adapter contract

Material component: Button

Migration target: `MDButton`

Implementation ownership: `migrating`

Canonical implementation candidate: `src/shared/ui/material/components/button/MDButton.vue`

## Status

The m3e-backed Button implementation remains reusable, but the latest Material-first pass is not accepted. It made two source-interpretation errors:

1. it treated missing text-toggle token rows as proof that text toggle is unsupported, despite positive overview and guideline evidence;
2. it searched only Button pages for loading and incorrectly classified indicator-in-button behavior as non-Material, despite explicit Loading indicator and Progress indicator placement guidance.

Do not restore the legacy renderer. Correct the matrix and implementation using the evidence rules below.

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
- Button entry: `@m3e/web/button`;
- inspect `@m3e/web/loading-indicator` and `@m3e/web/progress-indicator` for the documented indicator compositions before choosing implementation ownership;
- derive all renderer element and value types from exact package exports.

## Confirmed official Material facts

- Button has `default` and `toggle` variants.
- Elevated, filled, tonal, outlined, and text are five color configurations.
- Official Button guidelines show default, unselected toggle, and selected toggle across all five color configurations. Text toggle is supported.
- Button sizes are extra small, small, medium, large, and extra large; small is the default.
- Button shapes are round and square; round is the default.
- A Button may contain one leading icon. Toggle label and icon content may change with selected state.
- Loading indicators may be placed inside buttons for short actions that take a few seconds.
- Circular progress indicators may be placed inside buttons while an action is in progress.
- For progress indicators in buttons, Material says the active indicator should use the same color as the Button icon or label and the track should be removed.

Token-table omissions do not override these positive component and placement rules.

## Current product needs

Current consumers require:

- default actions;
- controlled toggle selection;
- filled, outlined, and text color configurations;
- current size and shape scenarios;
- visible and accessible label content;
- optional leading icon and selected-state content;
- disabled behavior;
- pointer, Enter, Space, and focus behavior;
- native `button`, `submit`, and `reset` behavior;
- expanded interaction target;
- indeterminate async-action indication;
- determinate action progress in consumers that provide a number.

Consumer needs select the required Material subset. They do not authorize unused native/link fields or renderer-specific vocabulary.

## Corrected Material–m3e–Vue matrix

The next adapter pass must replace provisional API details with exact package-checked mappings, but the following decisions are already resolved:

| Material contract and exact source | Required now | Public Vue direction | m3e support to inspect | Owner and decision |
| --- | --- | --- | --- | --- |
| Default and toggle Button variants (`buttons/overview`, `buttons/specs`) | yes | Material-oriented variant prop and controlled selected state | Button `toggle`, `selected`, selection event | direct m3e plus Vue controlled-state mapping |
| Five Button color configurations including text (`buttons/overview`, `buttons/specs`, `buttons/guidelines`) | yes | Material color-configuration prop | Button renderer variant mapping | direct m3e; text toggle must remain enabled |
| Five sizes and round/square shapes (`buttons/overview`, `buttons/specs`) | yes | Material names and defaults | Button size/shape mappings | direct m3e plus typed normalization where spelling differs |
| Leading icon and selected-state label/icon content (`buttons/guidelines`) | yes | explicit Material/Vue content-slot names | Button documented slots | direct m3e slot mapping; do not expose ambiguous renderer-only names |
| Disabled, keyboard, focus, press, and target behavior (`buttons/specs`, `buttons/accessibility`, `buttons/guidelines`) | yes | only currently required public state | Button renderer | direct m3e; operator reviews renderer-owned motion |
| Native `button`, `submit`, and `reset` integration | yes | required Vue/native mapping | Button `type` | implement now |
| Link and unused form metadata | no current consumer | none | renderer supports fields | defer; do not expose for theoretical completeness |
| Loading indicator inside Button (`loading-indicator/guidelines`, placement) | yes | source-backed Vue representation for indeterminate loading | inspect exact m3e loading-indicator and Button slot support | Material-owned Button composition; implement in `MDButton` unless evidence proves a separate owner is simpler and semantically superior |
| Circular progress indicator inside Button (`progress-indicators/guidelines`, “Progress indicators in buttons”) | yes for numeric consumers | source-backed Vue representation for determinate progress | inspect exact m3e progress-indicator and Button slot support | Material-owned Button composition; indicator follows rendered label/icon color and has no track |
| Public Button component tokens | no current override need | none | renderer CSS inputs exist | defer |
| Rapid-click modified curve | no measured need | none | inspect only if selected later | defer |

## Source-evidence corrections

### Text toggle

Text toggle is not a Material/m3e divergence. The previous restriction came from reading token coverage as a complete validity matrix. That inference is forbidden.

Required correction:

- remove `isUnsupportedTextToggle`;
- remove the warning and normalization to default action;
- keep `toggle` and `selected` mapped for text color configuration;
- add focused contract and visual coverage for text toggle.

### Indicator in Button

Loading and progress presentation inside a Button is an official cross-component Material composition, not a true non-Material extension.

The separate `LoadingButton` introduced by the previous pass is therefore not accepted as the final ownership by default. It added an extra root, placed `aria-busy` on the wrong owner, duplicated renderer color routes, and split an official Button composition away from the Material boundary.

The minimum target is:

- `MDButton` remains the public Material Button owner;
- its selected API represents the currently required documented loading/progress compositions;
- indicator rendering uses the correct Material indicator implementation available from exact-version m3e where viable, otherwise the smallest Material-owned light-DOM correction;
- busy/native semantics belong to the interactive Button owner;
- indicator color follows the rendered label/icon color rather than duplicating Button color and disabled matrices;
- loading/progress does not implicitly change `disabled` unless an explicit product decision requires it;
- label/accessibility behavior and indicator placement are recorded from official guidance and verified in the browser;
- remove the separate `LoadingButton` and migrate its consumers back unless the corrected matrix proves a distinct public component is still necessary.

## Public API constraints

The final public API must:

- use Material names and semantics;
- expose only the currently required subset;
- keep `default` and `toggle` variants, including text toggle;
- use explicit content names such as selected label and selected icon rather than ambiguous renderer slot vocabulary;
- include only required native action mapping;
- represent documented loading/progress composition without leaking m3e element or slot names;
- preserve normal click bubbling;
- keep public types independent from m3e while private mappings satisfy exact package types.

The exact prop shape for indeterminate loading versus determinate progress must be chosen from official terminology and current consumer requirements. Do not retain `boolean | number` automatically only because legacy used it, and do not split it into a non-MD component automatically only because Button pages omit a framework API.

## Implementation ownership

- m3e Button owns geometry, internal layout, state layer, ripple, focus treatment, elevation, selected/pressed shape behavior, private accessibility, and motion.
- The Vue adapter owns Material-to-Vue names, controlled selection intent, required native integration, slots, event normalization, and documented indicator composition.
- Exact-version m3e Loading indicator or Progress indicator owns its renderer internals when used.
- The adapter must not inspect private shadow DOM, copy indicator or Button internals, or build parallel state/color systems.

## Required verification

Focused proof must cover:

- Button defaults and typed mappings;
- text toggle enabled in unselected and selected states;
- selected label/icon public slot names and private m3e routing;
- required native button/submit/reset behavior;
- normal click bubbling;
- disabled activation blocking;
- expanded target actionability;
- loading/progress ARIA on the actual interactive owner;
- indicator color inheritance, including disabled plus loading/progress;
- restoration of leading icon/content after indicator state ends;
- current consumers after removal or correction of `LoadingButton`;
- stable visual stories for Button states and indicator composition;
- final `pnpm verify`;
- operator visual and renderer-owned motion review.

Do not use tests of private m3e DOM. Do not claim animation quality from `:active` or screenshots.

## Completion gate

M1 completes when:

- the matrix uses positive official evidence and related-component sources;
- text toggle is supported;
- loading/progress-in-button is owned as documented Material composition;
- unused public native/link surface is removed or explicitly justified;
- the final Vue API is Material-oriented and demand-driven;
- all current consumers use the accepted owner;
- focused and final verification pass;
- operator accepts visual and motion behavior.
