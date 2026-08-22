# src/shared/ui

Inherits `src/shared/AGENTS.md`. Applies to `src/shared/ui` and descendants until a deeper rule file refines it.

## Routing

- Use `shared-ui-implementation` for project-specific presentation primitives, wrappers, and generic shared UI infrastructure outside official Material component targets.
- For shared virtualization, treat `virtualization/README.md` as the public API/ownership/usage source of truth; database-specific migration architecture remains under `docs/database-virtualization*.md`.
- Use `material-component <name>` and the deeper `src/shared/ui/material/AGENTS.md` rules for one official Material family. The coding workflow owns three focused technical contracts, standalone implementation, and consumer migration only when required; architect review/CI is not duplicated by a coding worker.
- Follow `docs/testing/storybook.md` for Storybook ownership and `docs/testing/migration-plan.md` for current executable Playwright spec placement.
- Do not use legacy Material DESIGN/ARCHITECTURE/IMPLEMENTATION/MIGRATION/REVIEW stages as current workflow authority.

## Contains

- project-specific shared presentation primitives and wrappers;
- generic shared UI layout, interaction, and infrastructure;
- the canonical project-facing Material Vue library under `material`.

## Boundaries

- Shared UI must not import product layers or domain models.
- When generic or product UI consumes an official Material component, it must use the canonical Mioframe `MD*` Vue API.
- Native HTML and project-specific or generic shared UI remain valid when they are the correct owner.
- Generic shared UI must not depend directly on `@m3e/web`, render `m3e-*` elements, use renderer element types, or consume `--m3e-*` variables. Those renderer details are private to `src/shared/ui/material`.
- Existing Material components outside `src/shared/ui/material` remain valid legacy owners only until their focused canonical migration; do not add new Material ownership at legacy paths.
- Do not move product behavior into a shared primitive merely to reuse an official Material component.
- Do not place complete product scenarios in Storybook fixtures or create a shared-UI-specific Storybook taxonomy that conflicts with the canonical hierarchy.

## Verification

Shared UI changes require consumer and blast-radius review plus proof at the layer that owns the changed contract. Material standalone implementation owns component proof; migration owns only required consumer adoption and legacy removal. The architect owns the final semantic family/PR review and exact-head CI decision.
