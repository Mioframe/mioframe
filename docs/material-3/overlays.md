# Material 3 overlays

## Principle

Dialogs, sheets, menus, tooltips, snackbars, and other overlay-like surfaces must follow a shared overlay contract. Overlay behavior must not be reinvented independently for each component family.

## Covered surfaces

This policy applies to:

- dialogs;
- full-screen dialogs;
- bottom sheets;
- side sheets;
- menus;
- tooltips;
- snackbars;
- scrims;
- any future modal or transient surface.

## Shared concerns

Every overlay-like surface must explicitly define:

- modal or non-modal behavior;
- focus entry and restoration;
- focus trap behavior when modal;
- escape key behavior;
- browser back behavior when applicable;
- outside click or outside tap behavior;
- scroll locking;
- scrim usage;
- elevation level;
- z-index or stacking order;
- teleport/container strategy;
- nested overlay behavior;
- accessibility name, role, and description.

## Material source

Use the relevant official Material component docs before changing overlay behavior. When a component-specific doc exists, it overrides generic overlay preferences.

If Material guidance is incomplete for a shared overlay concern, document the project decision as a local overlay policy or deviation.

## Stacking

Stacking must be centralized enough to prevent dialogs, sheets, menus, and tooltips from competing with unrelated z-index values.

Do not add component-local z-index values without checking the existing overlay stack and documenting the intended layer.

## Verification

Overlay changes require browser-based verification when behavior changes. Use Storybook for isolated surfaces where possible, and Playwright/browser smoke checks for focus, keyboard, scrim, outside click, scroll lock, and responsive behavior.
