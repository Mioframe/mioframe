# Material 3 overlays

## Principle

Dialogs, sheets, menus, tooltips, snackbars, and other transient surfaces use one coherent overlay containment model. Component families must not create independent teleport, outside-interaction, focus, or stacking systems without a demonstrated missing capability.

## Covered surfaces

This policy applies to:

- dialogs and full-screen dialogs;
- bottom and side sheets;
- menus and popovers;
- tooltips;
- snackbars;
- scrims;
- other modal or transient surfaces.

## Existing containment model

The project currently provides:

- `useOverlayContainer` for resolving the nearest overlay container;
- `TeleportContainer` for rendering into that container;
- `useChildTeleportContainerStack` for nested teleported containers;
- `onInteractionOutside` for one containment-aware outside-interaction boundary.

New Material overlays reuse these owners when they satisfy the required contract. Generic teleport and event mechanisms remain outside Material-specific component ownership.

## Required decisions

Every overlay surface defines applicable:

- modal or non-modal behavior;
- native semantic element or role;
- accessible name and description;
- focus entry and restoration;
- focus containment when modal;
- Escape behavior;
- browser-back behavior;
- outside pointer/touch behavior;
- scroll locking;
- scrim behavior;
- placement and viewport collision behavior;
- elevation;
- teleport/container ownership;
- nested-overlay behavior;
- unmount and cancellation cleanup.

## Material source

Use the current official documentation for the specific overlay component. Component guidance overrides generic preferences for behavior owned by that component.

When Material does not define a project-wide platform detail, keep the decision in the narrowest shared overlay owner rather than duplicating it per family.

## Stacking

Containment ownership is primary. Do not create a second global overlay model through arbitrary component z-index values.

Local z-index is acceptable only for layers internal to one owned surface, such as a scrim behind its panel. Cross-overlay ordering belongs to the shared containment model.

Add a shared stacking token or helper only when real overlapping consumers prove that containment alone is insufficient.

## Verification

Use real browser verification for changed focus, keyboard, outside interaction, scroll locking, scrims, nested teleport containment, placement, viewport behavior, back handling, and cleanup.

Use isolated Storybook fixtures when product routing, persistence, and services are not part of the contract.
