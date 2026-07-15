# Material 3 policies

This directory defines the project contract for the standalone Material library at `src/shared/ui/material`, its legacy migration, product usage, Storybook documentation, and verification against official Material 3 documentation.

The policies apply before changing Material library artifacts, legacy Material implementations, Material-style wrappers, public component APIs, foundation contracts, design tokens, Storybook documentation, interaction states, layout behavior, or visual verification surfaces.

## Policy set

Library boundary and migration:

- [Library architecture](./library-architecture.md)
- [`src/shared/ui/material` library map](../../src/shared/ui/material/README.md)

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

1. `src/shared/ui/material` is the one canonical location for new Material implementation.
2. Official Material documentation explains the supported library surface and product usage.
3. Project Storybook documents the supported Material surface, extensions, and deviations.
4. Public `--md-*` tokens and `MD*` APIs use verified Material vocabulary.
5. Generic infrastructure, Material foundation, component families, Material patterns, project-specific shared UI, and product layers have distinct owners.
6. Project-specific UI remains explicitly project-specific and outside official component families.
7. Foundation, usage patterns, tokens, units, API, accessibility, interaction, anatomy, ownership, and adaptive behavior are part of alignment.
8. A coding agent can independently create a standard component directly inside the library from a concise request.
9. A request without detailed scenarios falls back to canonical Material default usage rather than speculative optional scope.
10. Configuration routing and state resolution are independent, so components receive only the layers they need.
11. Components declare their Material usage contract and accepted foundation dependencies instead of recreating common behavior locally.
12. Foundation contracts are expanded on demand, tracked in one current registry, and refreshed against newer official snapshots without speculative infrastructure.
13. Existing scattered Material code migrates family-by-family and domain-by-domain without permanent compatibility paths.
14. Validation catches location, dependency, ownership, and structural drift before repeated review rounds.

## Scope

Existing code is not automatically compliant or physically migrated. New public Material artifacts use `src/shared/ui/material` immediately. Existing Material code outside the library is legacy and may receive only strict local repairs until its focused migration begins.

A local repair to an unmigrated component may use `Architecture impact: none` only when it preserves the existing component/foundation contracts, location, public imports, and unrelated output.

## Implementation order

1. Keep source, library, foundation, component, registry, and verification policies current.
2. Add verify-managed checks preventing new Material artifacts outside `src/shared/ui/material` and invalid dependency directions inside it.
3. Establish blocking foundation-registry validation for domains required by `MDButton`.
4. Migrate the minimum required foundation owners without behavior changes.
5. Relocate and migrate `MDButton` into `material/components/button` without behavior changes.
6. Complete remaining `MDButton` alignment separately.
7. Validate the library, component, and foundation workflows on `MDSwitch`.
8. Prove autonomous authoring on a genuinely new requested component created directly in the library.
9. Migrate further families and improve foundation domains only from confirmed needs.
