# src/shared/ui

Inherits `src/shared/AGENTS.md`. Applies to `src/shared/ui` and descendants until a deeper rule file refines it.

## Routing

- Use `shared-ui-implementation` for project-specific presentation primitives, wrappers, and generic shared UI infrastructure.

## Contains

- project-specific shared presentation primitives and wrappers;
- generic shared UI layout, interaction, and infrastructure.

## Boundaries

- Shared UI must not import product layers or domain models.

## Verification

Shared UI changes require consumer and blast-radius review plus proof at the layer that owns the changed contract. Final completion requires repository verification.
