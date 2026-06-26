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

## Pane scaffold layout

`MDPane` (`src/shared/ui/Layout/MDPane.vue`) is the Material pane primitive. It owns the pane shell, the visual pane surface, and the split between a non-scrolling top bar region and scrollable body content:

- `MDPane #topBar` is the optional pane-local top bar region (`.md-pane__top-bar`), rendered outside the scroll container. Place a pane-scoped `MDAppBar` here, not in the default slot.
- `MDPane` default slot is the scrollable pane body (`.md-pane__content`).
- `usePaneScrollContainer` (from `@shared/ui/Layout`) resolves to the `.md-pane__content` element and is the target for pane-local scroll reads/writes (anchor scrolling, FAB/toolbar/bottom-sheet positioning).
- `MDPane` does not import or know about `MDAppBar`; pages decide whether a pane has a top bar and what goes in it.
- Global app bars that apply above all panes belong at the scaffold level (`MDSplitLayout` composition), not inside `MDPane`.

## Verification

Adaptive layout changes need browser verification at the affected sizes. Prefer deterministic Storybook surfaces for shared UI and focused Playwright screenshots when the visual layout is the invariant.
