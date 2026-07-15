# Material 3 policies

This directory defines the project contract for aligning the Material foundation, shared UI kit, product composition, Storybook documentation, and verification with official Material 3 documentation.

The policies apply before changing shared UI primitives, Material-style wrappers, public component APIs, foundation contracts, design tokens, Storybook documentation, interaction states, layout behavior, or visual verification surfaces.

## Policy set

Foundation architecture and status:

- [Foundation architecture](./foundation-architecture.md)
- [Foundation registry](./foundation-registry.md)
- [Source of truth](./source-of-truth.md)
- [Units](./units.md)
- [Tokens](./tokens.md)
- [Baseline theme](./baseline-theme.md)
- [Interaction states](./interaction-states.md)
- [Accessibility](./accessibility.md)
- [Layout and adaptive behavior](./layout-adaptive.md)
- [Iconography](./icons.md)
- [Density and spacing](./density-spacing.md)
- [Overlays](./overlays.md)

Component and completion policies:

- [Component architecture](./component-architecture.md)
- [Component tokens](./component-tokens.md)
- [Shared UI API](./shared-ui-api.md)
- [Component registry](./component-registry.md)
- [Token and architecture validation](./token-validation.md)
- [Component authoring checklist](./component-conversion-checklist.md)
- [Storybook](./storybook.md)
- [Verification](./verification.md)
- [Deviations](./deviations.md)
- [Adoption plan](./adoption-plan.md)

## Goals

1. Official Material documentation should explain the supported project UI surface.
2. Project Storybook should document the supported Material surface, extensions, and deviations.
3. Public `--md-*` tokens and `MD*` APIs use verified Material vocabulary.
4. Project-specific UI remains explicitly project-specific.
5. Foundation, usage patterns, tokens, units, API, accessibility, interaction, anatomy, ownership, and adaptive behavior are part of alignment.
6. A coding agent can independently create a standard component from a concise request by following the deterministic source-backed workflow.
7. A request without detailed scenarios falls back to canonical Material default usage rather than speculative optional scope.
8. Configuration routing and state resolution are independent, so components receive only the layers they need.
9. Components declare their Material usage contract and accepted foundation dependencies instead of recreating common behavior locally.
10. Foundation contracts are expanded on demand, tracked in one current registry, and refreshed against newer official snapshots without speculative infrastructure.
11. Simple components remain simple; aliases, abstractions, and optional capabilities require current evidence.
12. Validation catches structural and ownership drift before repeated review rounds.

## Scope

Existing code is not automatically compliant. New public Material components and components migrated to `layered-v1` follow both component and foundation architecture workflows.

A local repair to an unmigrated component may use the strict `Architecture impact: none` path only when it preserves the existing component and foundation contracts and unrelated output.

## Implementation order

1. Keep source, foundation, component, registry, and verification policies current.
2. Add verify-managed checks for foundation ownership, component profiles, dependency declarations, and unnecessary aliases.
3. Establish blocking foundation-registry validation for domains touched by `MDButton`.
4. Migrate `MDButton` without behavior changes.
5. Complete remaining `MDButton` alignment separately.
6. Validate the component and foundation workflows on `MDSwitch`.
7. Prove autonomous authoring on a genuinely new requested Material component.
8. Migrate further families and improve foundation domains only from confirmed needs.
