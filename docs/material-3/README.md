# Material 3 policies

This directory defines the project contract for aligning the shared UI kit, Storybook documentation, component architecture, and visual verification with the official Material 3 documentation.

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

- [Component architecture](./component-architecture.md)
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
5. Visual similarity alone is not enough. Tokens, units, API names, accessibility, interaction states, architecture, ownership, and adaptive behavior are part of Material 3 alignment.
6. Implementation agents must follow a ready component contract rather than design public Material components during implementation.

## Scope

These policies do not require all existing code to be immediately compliant. New public Material components and components explicitly migrated to `layered-v1` must follow the architecture contract. A local legacy-component repair may remain unmigrated only under the strict `Architecture impact: none` conditions in [Component architecture](./component-architecture.md).

## Implementation order

1. Keep foundation policies, the component registry, and official-source workflow current.
2. Establish the strict `layered-v1` architecture and add verify-managed static enforcement.
3. Migrate `MDButton` in a behavior-preserving architecture-only PR.
4. Complete `MDButton` Material alignment in a separate focused PR.
5. Validate the same architecture on `MDSwitch` as an independent stateful and gesture-owning pilot.
6. After both pilots, migrate further component families one at a time using the registry and conversion checklist.
