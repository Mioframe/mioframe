# Material 3 policies

This directory defines the project contract for the standalone Material library at `src/shared/ui/material`, its legacy migration, product usage, Storybook documentation, verification, and review against official Material 3 sources.

## Policy set

Library boundary, inventory, and migration:

- [Library architecture](./library-architecture.md)
- [Library implementation roadmap](./library-roadmap.md) — current milestone, blockers, next action, and progress
- [Shared UI library inventory](./ui-library-inventory.md) — exhaustive classification, priority, queue state, and terminal outcome for every shared UI artifact
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
- [Adoption plan](./adoption-plan.md) — strategic rollout rationale and phase definitions

## Rule ownership

- Architecture documents own durable schemas and invariants.
- `AGENTS.md` files own scoped hard boundaries and routing.
- `library-roadmap.md` owns milestone state, blockers, dependencies, and the single next action.
- `ui-library-inventory.md` owns exhaustive shared-UI classification, evidence-backed priority, queue state, and terminal outcome.
- `material-component-authoring` owns execution order and stop conditions for creating, migrating, aligning, or materially changing official public component families, including legacy `MD*` components.
- `material-foundation` owns execution order for cross-family foundation changes.
- `material3-guidelines` owns official source lookup, component choice, usage, composition, and product-facing Material decisions.
- `shared-ui-implementation` owns project-specific and generic shared UI outside official Material families.
- Specialized testing skills own only their proof layers.
- The authoring checklist owns operational completion review.
- Validation owns enforceable static/structured checks and explicit review gates.

No skill or secondary policy may add mandatory fields to the canonical family blueprint outside `component-architecture.md`.

## Goals

1. `src/shared/ui/material` is the canonical location for new Material implementation.
2. Every shared UI artifact is classified as official Material, project-specific, generic, retained, consolidated, or removed; no artifact is forced into Material merely because it is UI.
3. Migration priority is evidence-backed by consumer reach, critical workflows, interaction frequency, foundation leverage, risk, and dependency readiness.
4. Official documentation and the official Material Design Kit, when required, explain the supported surface and visual contract.
5. Storybook documents the supported surface, extensions, deviations, and one canonical matrix per component.
6. Every new or migrated component follows one proof profile: architecture, contract, matrix visual regression, browser behavior when applicable, pure behavior when applicable, and required review.
7. Every distinct supported component-owned visible route is readable in the canonical matrix; non-visual state contracts remain in contract/browser tests.
8. Public `--md-*` tokens and `MD*` APIs use verified Material vocabulary.
9. Generic infrastructure, foundation, families, patterns, project UI, and product layers have distinct owners.
10. Project-specific UI remains outside official component families.
11. Usage, tokens, units, API, accessibility, interaction, anatomy, ownership, adaptivity, testing, and review are all part of alignment.
12. A coding agent can author a standard component from a concise request using one complete family blueprint.
13. Requests without detailed scenarios fall back to canonical Material default usage rather than speculative scope.
14. Configuration routing and state resolution remain independent so components receive only required layers.
15. Foundation contracts expand on demand and remain registry-backed.
16. Existing Material code migrates family-by-family/domain-by-domain without permanent compatibility paths.
17. Automation catches deterministic drift; architecture, priority, and visual correctness remain explicit review gates.

## Scope

Existing code is not automatically compliant, consistently tested, visually reviewed, physically migrated, or correctly classified.

New Material artifacts use the canonical library and test architecture immediately. Existing code outside the library is legacy and may receive only strict local repairs until focused migration.

Project-specific and generic shared UI may remain outside `src/shared/ui/material` permanently when the inventory records the correct owner and classification.

A local repair may use `Architecture impact: none` only when it preserves component/foundation contracts, location, public imports, testing surface, behavior, and unrelated output.

## Implementation order

The current operational state and single next action are tracked in [Library implementation roadmap](./library-roadmap.md).

1. Keep source, library, foundation, component, testing, registry, inventory, validation, and verification policies consistent.
2. Implement static library-boundary and test-artifact checks for new work and active migrations.
3. Implement structured blueprint/registry reference checks without a semantic Markdown DSL.
4. Populate the exhaustive shared UI inventory and establish an evidence-backed migration queue.
5. Validate minimum Button foundation domains and exact snapshots after confirming the first pilot order.
6. Relocate/migrate `MDButton` with its canonical matrix and no intentional behavior change.
7. Complete remaining Button alignment separately and perform human visual review.
8. Validate the architecture on an independent high-priority stateful family, with `MDSwitch` as the default candidate.
9. Prove autonomous authoring on a genuinely new required component.
10. Migrate further families and foundations by inventory priority until every row is migrated, retained, or removed.