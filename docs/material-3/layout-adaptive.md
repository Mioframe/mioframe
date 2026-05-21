# Material 3 layout and adaptive behavior

## Principle

Material layout behavior is a foundation concern. Component and screen work should use the official Material 3 layout, adaptive, and canonical layout guidance where it applies.

Do not treat desktop layout, hover input, or precise pointer input as the default. The project remains mobile-first while still supporting larger screens through adaptive Material patterns.

## Adaptive vocabulary

Use Material layout vocabulary in docs and APIs when applicable:

- compact;
- medium;
- expanded;
- pane;
- list-detail;
- supporting pane;
- feed;
- navigation bar;
- navigation rail;
- navigation drawer;
- sheet;
- app bar;
- toolbar.

## Canonical layouts

Use canonical layouts as starting points for app-level organization when they match the product flow:

- list-detail for explorable lists with item detail;
- supporting pane for primary content with secondary supporting content;
- feed for browsable content grids or streams.

Do not invent a custom screen structure when a canonical Material layout fits the problem.

## Component-level adaptivity

Components that change behavior across viewport classes must document:

- the relevant Material guidance;
- the breakpoints or container conditions used by the project;
- the behavioral difference between compact, medium, and expanded contexts;
- the Storybook or browser surface used to verify the behavior.

## Navigation surfaces

Navigation bar, navigation rail, and navigation drawer choices should follow Material adaptive guidance and product information architecture. Do not choose a navigation surface by visual preference alone.

## Verification

Adaptive layout changes need browser verification at the affected sizes. Prefer deterministic Storybook surfaces for shared UI and focused Playwright screenshots when the visual layout is the invariant.
