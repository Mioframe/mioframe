---
name: material-design-3
description: 'Use this skill for UI changes that touch Material 3 components, typography, color roles, shape, elevation, motion, layout, adaptive behavior, accessibility, or visual states. Apply it before adding or refactoring shared UI primitives, panes, dialogs, sheets, navigation, forms, lists, markdown surfaces, or responsive layouts.'
---

# Material 3 implementation rules

Use this skill whenever a change can affect how the UI looks, adapts, reads, or behaves. The rules below are distilled from the Material 3 markdown documentation bundle: `components/**`, `foundations/**`, and `styles/**`.

## Activation check

Use this workflow when the change touches any of these areas:

- shared UI primitives or Material-style components;
- typography, text hierarchy, labels, supporting text, or markdown rendering;
- layout, panes, scroll containers, responsive behavior, or viewport classes;
- dialogs, sheets, menus, tooltips, snackbars, app bars, navigation, forms, lists, cards, chips, buttons, progress, or selection controls;
- color roles, surface roles, elevation, shape, motion, or interaction states;
- accessibility, focus order, keyboard navigation, pointer or touch behavior, screen reader order, or text resizing.

## Source-grounded workflow

1. Identify the closest Material component or foundation rule before designing a local solution.
2. Check existing project primitives before writing local CSS or a new component. Prefer extending an existing `MD*` primitive through a narrow prop, slot, or composable contract.
3. Map the behavior to Material semantics first: component type, emphasis level, state model, adaptive strategy, and accessibility contract.
4. Keep the implementation token-driven. Use existing `--md-sys-*` tokens and component-local `--md-*` variables instead of hard-coded visual values unless the value is documented as fixed component geometry.
5. Verify the result in the smallest realistic browser surface. For Material visual states and responsive behavior, prefer Storybook plus Playwright or a reproducible browser smoke check.
6. If the product intentionally diverges from Material guidance, document the product reason in the PR or code comment nearest to the decision.

## Design tokens and color roles

- Use Material system tokens for color, type, elevation, shape, and motion. Avoid duplicating token values in local CSS.
- Treat color roles as semantic, not decorative. `primary` is for the most important action or emphasis, `secondary` for lower-emphasis supporting UI, `tertiary` for small special emphasis, and `error` only for destructive or error states.
- Pair container colors with their matching `on-*` colors for text and icons. Do not use `*container` roles directly for text or icons.
- Use surface roles for backgrounds and large low-emphasis areas. Avoid placing content on arbitrary custom fills when a surface or container role exists.
- Prefer outline roles for boundaries and dividers. Use `outline-variant` for lower-emphasis boundaries.
- Elevation belongs to surfaces and components. Do not add elevation as decoration. Use the smallest number of elevation levels that communicates layering, protection against the background, or interaction affordance.
- Do not casually change default elevation of an existing Material component. If elevation changes on hover or focus, keep it consistent with that component's Material state model.

## Typography

- Use the Material 3 type scale: display, headline, title, body, and label, each with large, medium, and small variants. Prefer existing `--md-sys-typescale-*` tokens.
- Use `label` styles for buttons, tabs, chips, compact controls, and metadata. Use `body` for readable content. Use `title` and `headline` for section and pane hierarchy. Reserve `display` for short, high-emphasis text, normally not for dense app screens.
- Do not invent arbitrary font sizes for hierarchy. Change type scale only through shared tokens or a reusable typography primitive.
- Emphasized type styles and heavier weights are for selection, actions, headlines, and editorial emphasis. Do not use weight as a substitute for a missing layout hierarchy.
- For larger styles such as title, headline, and display, keep line height around 1.2 times type size unless a token says otherwise. For body and label copy, keep line height around 1.5 times type size where readable text wraps.
- Support browser text resizing. Avoid fixed-height text containers that clip larger text.

## Layout and adaptive behavior

- Design compact first, then adapt upward. Material width classes are: compact under 600dp, medium 600-839dp, expanded 840-1199dp, large 1200-1599dp, and extra-large 1600dp and up.
- Start from a canonical layout rather than an ad hoc grid when a screen has multiple regions. Relevant canonical layouts include list-detail, supporting pane, and feed.
- Compact layouts should normally show one pane. Medium layouts should normally show one pane, with two panes only when content density and ergonomics justify it. Expanded and large layouts should normally use two panes when it improves task flow. Extra-large layouts may use one to three panes.
- Use Material adaptive strategies deliberately: show and hide, levitate, and reflow. Do not merely stretch compact UI across large screens.
- Keep DOM order stable when repositioning content across breakpoints so keyboard and screen reader order remain coherent.
- Actions may move from bottom placement on compact screens to leading or side placement on larger screens, but action order and meaning must stay consistent.
- Avoid long, flat controls on large screens. Constrain action widths or group them with their related content.

## Components and patterns

### Buttons and actions

- Choose the button variant by emphasis: filled for the single most important final action, tonal for a lower-priority action needing more emphasis than outline, outlined for medium-emphasis alternatives, text for the lowest-priority actions and for dialogs, cards, and snackbars.
- Use filled buttons sparingly, ideally one per page, pane, dialog, or task group.
- Keep button icons and labels centered and grouped as width changes. Do not anchor icon and label to opposite edges.
- Dialog actions should use text buttons aligned to the trailing edge for the writing direction.
- Use determinate progress in actions when progress is knowable.

### Dialogs, sheets, menus, and snackbars

- Use dialogs only for high-importance blocking decisions where the user must confirm, dismiss, or choose before continuing. Use snackbars for low-importance optional feedback.
- Do not put multi-step branches, navigation-heavy choices, or routine supplemental selection into a dialog. Prefer a sheet, menu, pane, or explicit separate action.
- Avoid nested dialogs and avoid opening a dialog from another dialog unless no other interaction model fits.
- Use full-screen dialogs only when compact layouts need a complex modal task that cannot fit in a simple dialog.
- Prefer bottom sheets for compact supplemental action or selection. Prefer menus for supplemental selection in medium and expanded contexts when the choice set is lightweight.
- Snackbars must be non-blocking. Do not use them for critical errors requiring a decision.

### Navigation and app structure

- Use navigation bar for three to five primary destinations in compact mobile or tablet contexts.
- Use navigation rail for medium and expanded layouts where primary destinations must remain visible without occupying drawer width.
- Use navigation drawer or expanded rail for larger, more information-dense navigation sets.
- Keep one clear page-level heading or app-bar heading. Avoid duplicate top-level headings inside the same pane.

### Lists, cards, forms, and text inputs

- Lists are for vertically scannable collections. Preserve readable multi-line content when truncation would hide essential information.
- Cards should group one coherent subject and its directly related actions. Do not use cards as generic spacing boxes.
- Text fields need visible labels or an equivalent accessible name. Placeholder-only labeling is not enough.
- Supporting text and error text are part of the field contract. Keep validation messages concise and adjacent to the field they explain.
- Selection controls must expose selected, disabled, focused, hovered, pressed, and error states through Material state visuals and accessible semantics.

### Tooltips

- Use plain tooltips for brief labels or clarifications. Use rich tooltips only when supporting text or an action is genuinely needed.
- Tooltips must not contain information required to complete a task. Required guidance belongs in visible supporting text or the surrounding layout.
- Tooltip content must wrap within its constrained width and remain reachable through keyboard and touch-compatible behavior.

## Accessibility and interaction states

- Treat accessibility as part of the component contract, not as a final cleanup pass.
- Preserve keyboard focus visibility and logical focus order. Hover cannot be the only way to reveal required actions.
- Keep touch targets at least 48px by 48px unless a surrounding target area provides the accessible hit size.
- Support Material states where relevant: enabled, disabled, hovered, focused, pressed, dragged, selected, loading, and error.
- Disabled means unavailable, not lower priority. Do not use disabled styling to de-emphasize an available action.
- Do not rely on color alone to communicate state, selection, validation, or destructive meaning.
- Maintain text contrast of at least 4.5:1 for normal text and 3:1 for large text and essential graphics.

## Verification checklist

Before reporting completion for a Material-related UI change, check the affected surface for:

- component choice matches the Material role and emphasis;
- typography uses type scale tokens rather than local arbitrary values;
- colors use paired semantic roles and preserve contrast;
- compact, medium, and expanded behavior are intentional;
- focus, keyboard, pointer, touch, and screen reader order are not broken;
- loading, disabled, selected, error, hover, focus, and pressed states still render correctly when the component supports them;
- visual changes are covered by an existing or new Storybook story, Playwright visual check, focused e2e check, or reproducible browser smoke check appropriate to the scope.

## Limits

- Do not paste large chunks of Material documentation into source files.
- Do not add a new `MD*` primitive just because one screen needs a local variation.
- Do not use Material as a reason to hide product-specific requirements. Resolve conflicts explicitly and document intentional divergence.
- Do not treat desktop hover, wide viewports, or precise pointer input as the default interaction model.