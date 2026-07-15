# Material 3 policies

This directory defines the project contract for the standalone Material library at `src/shared/ui/material`, its legacy migration, product usage, Storybook documentation, verification, and review against official Material 3 sources.

## Policy set

Library boundary and migration:

- [Library architecture](./library-architecture.md)
- [`src/shared/ui/material` library map](../../src/shared/ui/material/README.md)

Foundation architecture and status:

- [Source of truth](./source-of-truth.md)
- [Foundation architecture](./foundation-architecture.md)
- [Foundation registry](./foundation-registry.md)
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

- [Component architecture](./component-architecture.md) — complete canonical family blueprint and production ownership
- [Component testing architecture](./component-testing.md)
- [Component tokens](./component-tokens.md)
- [Shared UI API](./shared-ui-api.md)
- [Component registry](./component-registry.md)
- [Token and architecture validation](./token-validation.md)
- [Component authoring checklist](./component-conversion-checklist.md)
- [Storybook](./storybook.md)
- [Verification](./verification.md)
- [Deviations](./deviations.md)
- [Adoption plan](./adoption-plan.md)

## Rule ownership

- Architecture documents own durable schemas and invariants.
- `AGENTS.md` files own scoped hard boundaries and routing.
- Skills own execution order and stop conditions.
- The authoring checklist owns operational completion review.
- Validation owns enforceable static/structured checks and explicit review gates.

No skill or secondary policy may add mandatory fields to the canonical family blueprint outside `component-architecture.md`.

## Goals

1. `src/shared/ui/material` is the canonical location for new Material implementation.
2. Official documentation and the official Material Design Kit, when required, explain the supported surface and visual contract.
3. Storybook documents the supported surface, extensions, deviations, and one canonical matrix per component.
4. Every new or migrated component follows one proof profile: architecture, contract, matrix visual regression, browser behavior when applicable, pure behavior when applicable, and required review.
5. Every distinct supported component-owned visible route is readable in the canonical matrix; non-visual state contracts remain in contract/browser tests.
6. Public `--md-*` tokens and `MD*` APIs use verified Material vocabulary.
7. Generic infrastructure, foundation, families, patterns, project UI, and product layers have distinct owners.
8. Project-specific UI remains outside official component families.
9. Usage, tokens, units, API, accessibility, interaction, anatomy, ownership, adaptivity, testing, and review are all part of alignment.
10. A coding agent can author a standard component from a concise request using one complete family blueprint.
11. Requests without detailed scenarios fall back to canonical Material default usage rather than speculative scope.
12. Configuration routing and state resolution remain independent so components receive only required layers.
13. Foundation contracts expand on demand and remain registry-backed.
14. Existing Material code migrates family-by-family/domain-by-domain without permanent compatibility paths.
15. Automation catches deterministic drift; architecture and visual correctness remain explicit review gates.

## Scope

Existing code is not automatically compliant, consistently tested, visually reviewed, or physically migrated.

New Material artifacts use the canonical library and test architecture immediately. Existing code outside the library is legacy and may receive only strict local repairs until focused migration.

A local repair may use `Architecture impact: none` only when it preserves component/foundation contracts, location, public imports, testing surface, behavior, and unrelated output.

## Implementation order

1. Keep source, library, foundation, component, testing, registry, validation, and verification policies consistent.
2. Implement static library-boundary and test-artifact checks for new work and active migrations.
3. Implement structured blueprint/registry reference checks without a semantic Markdown DSL.
4. Validate minimum Button foundation domains and exact snapshots.
5. Relocate/migrate `MDButton` with its canonical matrix and no intentional behavior change.
6. Complete remaining Button alignment separately and perform human visual review.
7. Validate the same architecture independently on `MDSwitch`.
8. Prove autonomous authoring on a genuinely new required component.
9. Migrate further families and improve foundation domains only from confirmed needs.
