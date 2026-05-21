# Material 3 policies

This directory defines the project contract for aligning the shared UI kit, Storybook documentation, and visual verification with the official Material 3 documentation.

The policies apply before changing shared UI primitives, Material-style wrappers, user-visible component APIs, design tokens, Storybook documentation, Material interaction states, layout behavior, or visual verification surfaces.

## Policy set

Foundation policies:

- [Source of truth](./source-of-truth.md)
- [Units](./units.md)
- [Tokens](./tokens.md)
- [Baseline theme](./baseline-theme.md)
- [Component tokens](./component-tokens.md)
- [Interaction states](./interaction-states.md)
- [Accessibility](./accessibility.md)
- [Layout and adaptive behavior](./layout-adaptive.md)
- [Shared UI API](./shared-ui-api.md)
- [Storybook](./storybook.md)
- [Verification](./verification.md)
- [Deviations](./deviations.md)

Implementation policies:

- [Component registry](./component-registry.md)
- [Token validation](./token-validation.md)
- [Iconography](./icons.md)
- [Density and spacing](./density-spacing.md)
- [Overlays](./overlays.md)
- [Component conversion checklist](./component-conversion-checklist.md)
- [Adoption plan](./adoption-plan.md)

## Goals

1. Reading the official Material 3 documentation should explain how to use the project UI kit.
2. Reading the project Storybook should feel like reading the relevant Material 3 component documentation for the components used by the app.
3. Material-compatible names must be used for public `--md-*` tokens and public `MD*` component APIs.
4. Project-specific UI must be documented as project-specific and must not masquerade as an official Material 3 component.
5. Visual similarity alone is not enough. Tokens, units, API names, accessibility, interaction states, and adaptive behavior are part of Material 3 alignment.

## Scope

These policies are foundation documents. They do not require all existing code to be immediately compliant. New Material UI work and refactors that touch affected surfaces must move the touched area toward this contract and document any deliberate deviation.

## Implementation order

1. Keep these policies small and reviewable.
2. Audit existing tokens and shared UI APIs against the policies.
3. Use [Component registry](./component-registry.md), [Token validation](./token-validation.md), and [Component conversion checklist](./component-conversion-checklist.md) for every component-family migration.
4. Use Buttons as the first pilot component family after the foundation contract is accepted.
5. Apply the same pattern to Lists, Dialogs, Text fields, selection controls, Navigation, App bars, Toolbars, and Sheets.
