# src/shared/ui

Inherits `src/shared/AGENTS.md`. Applies to `src/shared/ui` and descendants until a deeper rule file refines it.

## Routing

- Use `shared-ui-implementation` for project-specific presentation primitives, wrappers, and generic shared UI infrastructure outside official Material component families.
- Use `material-component-adapter` and the deeper `src/shared/ui/material/AGENTS.md` rules for official Material family implementation, migration, or adapter changes.

## Contains

- project-specific shared presentation primitives and wrappers;
- generic shared UI layout, interaction, and infrastructure;
- the canonical project-facing Material Vue library under `material`.

## Boundaries

- Shared UI must not import product layers or domain models.
- Generic shared UI must not depend directly on `@m3e/web`, render `m3e-*` elements, or consume `--m3e-*` variables. Those renderer details are private to `src/shared/ui/material`.
- Do not move product behavior into a shared primitive merely to reuse an official Material component.

## Verification

Shared UI changes require consumer and blast-radius review plus proof at the layer that owns the changed contract. Final completion requires repository verification.
