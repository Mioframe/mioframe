# Material 3 policies

This directory defines the project contract for aligning the shared UI kit, Storybook documentation, component architecture, and verification with official Material 3 documentation.

The policies apply before changing shared UI primitives, Material-style wrappers, public component APIs, design tokens, Storybook documentation, interaction states, layout behavior, or visual verification surfaces.

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
- [Token and architecture validation](./token-validation.md)
- [Iconography](./icons.md)
- [Density and spacing](./density-spacing.md)
- [Overlays](./overlays.md)
- [Component authoring checklist](./component-conversion-checklist.md)
- [Adoption plan](./adoption-plan.md)

## Goals

1. Official Material documentation should explain the supported project UI surface.
2. Project Storybook should document the supported Material surface, extensions, and deviations.
3. Public `--md-*` tokens and `MD*` APIs use verified Material vocabulary.
4. Project-specific UI remains explicitly project-specific.
5. Tokens, units, API, accessibility, interaction, anatomy, ownership, and adaptive behavior are part of alignment.
6. A coding agent can independently create a standard component from a concise scenario request by following the deterministic source-backed workflow.
7. Simple components remain simple; abstractions and optional capabilities require current evidence.
8. Validation catches structural drift before repeated review rounds.

## Scope

Existing code is not automatically compliant. New public Material components and components migrated to `layered-v1` follow the architecture workflow.

A local repair to an unmigrated component may use the strict `Architecture impact: none` path only when it preserves the existing contract and unrelated output.

## Implementation order

1. Keep source, token, architecture, registry, and verification policies current.
2. Add verify-managed checks for architecture profiles and ownership.
3. Migrate `MDButton` without behavior changes.
4. Complete remaining `MDButton` alignment separately.
5. Validate the workflow on `MDSwitch`.
6. Prove autonomous authoring on a genuinely new requested Material component.
7. Migrate further families one at a time.
