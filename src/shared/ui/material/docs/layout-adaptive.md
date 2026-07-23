# Material 3 layout and adaptive behavior

## Principle

Use current official Material layout and adaptive guidance where it applies. Do not treat desktop layout, hover input, or precise pointing as the default.

Product composition owns information architecture and selection of adaptive layouts. Reusable components own only their documented responsive behavior.

## Vocabulary

Use official vocabulary when applicable:

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

Use canonical layouts as starting points when they fit the product scenario:

- list-detail for explorable lists with item detail;
- supporting pane for primary content with secondary supporting content;
- feed for browsable content grids or streams.

Do not force a canonical layout when product information architecture requires a different composition.

## Component adaptivity

A reusable component that changes across viewport or container conditions defines:

- the relevant official guidance;
- the observed viewport or container owner;
- the conditions used by the project;
- behavior in each supported context;
- focus, scrolling, overlay, and state implications;
- the browser surface used to verify it.

Do not hide product-level adaptive composition inside a shared component merely to centralize breakpoints.

## Navigation

Navigation bar, rail, and drawer selection follows both current Material adaptive guidance and product information architecture. Visual preference alone is insufficient.

## Existing pane contract

`MDPane` owns a pane shell with a non-scrolling top-bar region and scrollable body:

- `#topBar` renders outside `.md-pane__content`;
- the default slot renders inside the scroll container;
- `usePaneScrollContainer` resolves the body scroll owner;
- pages decide whether a pane contains an app bar;
- global app bars belong to the surrounding scaffold.

`MDPane` does not own product routing, navigation choice, or global scaffold composition.

## Verification

Adaptive changes require browser verification at affected viewport or container sizes. Use deterministic Storybook surfaces for reusable UI and product E2E only when the complete application composition is the changed contract.
