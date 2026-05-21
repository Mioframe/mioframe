# Material 3 overlays

## Principle

Dialogs, sheets, menus, tooltips, snackbars, and other overlay-like surfaces must follow the existing shared overlay contract. Overlay behavior must not be reinvented independently for each component family.

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

## Existing ownership model

The project already owns overlay containment through shared primitives:

- `useOverlayContainer` resolves the nearest provided overlay container and falls back to the current Vue app root or `document.body`.
- `TeleportContainer` teleports overlay content into that container and registers the teleported container.
- `useChildTeleportContainerStack` tracks child teleported containers and propagates them through parent stacks.
- `onInteractionOutside` treats the target, ignored elements, and registered child teleported containers as inside the same interaction boundary.

New overlay-like Material components should use this existing ownership model instead of introducing unrelated teleport roots, ad hoc document-level containment, or independent outside-click logic.

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
- teleport/container strategy through the shared overlay primitives;
- nested overlay behavior through the teleported container stack;
- z-index only when the shared overlay/container model is insufficient by itself;
- accessibility name, role, and description.

## Material source

Use the relevant official Material component docs before changing overlay behavior. When a component-specific doc exists, it overrides generic overlay preferences.

If Material guidance is incomplete for a shared overlay concern, document the project decision as a local overlay policy or deviation.

## Stacking and containment

The primary project rule is containment ownership, not a global numeric z-index table.

Prefer the existing overlay container and teleport registry for ordering and interaction containment. Component-local z-index values are allowed only when a component needs an internal visual layer, such as a scrim behind its own surface or a menu above its own container. Do not use local z-index values to create a second overlay ownership model.

When changing dialogs, sheets, menus, tooltips, or snackbars, inspect their use of `useOverlayContainer`, `TeleportContainer`, child teleport registration, escape/back stacking, focus trap behavior, and outside interaction handling before adding new primitives.

If future overlay work proves that numeric stacking conflicts remain, introduce a shared overlay-layer token or helper as a focused follow-up. Do not preemptively replace the existing ownership model.

## Verification

Overlay changes require browser-based verification when behavior changes. Use Storybook for isolated surfaces where possible, and Playwright/browser smoke checks for focus, keyboard, scrim, outside click, scroll lock, nested teleports, and responsive behavior.
