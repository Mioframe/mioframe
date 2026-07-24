# src/shared/ui

Inherits `src/shared/AGENTS.md`. Applies to `src/shared/ui` and descendants until a deeper rule file refines it.

## Routing

- Use `shared-ui-implementation` for project-specific presentation primitives, wrappers, and generic shared UI infrastructure outside official Material component targets.
- Use `material-component-adapter` and the deeper `src/shared/ui/material/AGENTS.md` rules for one explicit official Material component target or proven inseparable family implementation, migration, or adapter change.

## Contains

- project-specific shared presentation primitives and wrappers;
- generic shared UI layout, interaction, and infrastructure;
- the canonical project-facing Material Vue library under `material`.

## Boundaries

- Shared UI must not import product layers or domain models.
- When generic or product UI consumes an official Material component, it must use the curated Mioframe `MD*` Vue API.
- Native HTML and project-specific or generic shared UI remain valid when they are the correct owner.
- Generic shared UI must not depend directly on `@m3e/web`, render `m3e-*` elements, use renderer element types, or consume `--m3e-*` variables. Those renderer details are private to `src/shared/ui/material`.
- Existing Material components outside `src/shared/ui/material` remain valid legacy owners until their focused migration; do not add new Material ownership at legacy paths.
- Do not move product behavior into a shared primitive merely to reuse an official Material component.

## Verification

Shared UI changes require consumer and blast-radius review plus proof at the layer that owns the changed contract. Final completion requires repository verification.
