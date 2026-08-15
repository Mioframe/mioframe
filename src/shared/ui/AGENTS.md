# src/shared/ui

Inherits `src/shared/AGENTS.md`. Applies to `src/shared/ui` and descendants until a deeper rule file refines it.

## Routing

- Use `shared-ui-implementation` for project-specific presentation primitives, wrappers, and generic shared UI infrastructure outside official Material component targets.
- Use `material-component <name>` and the deeper `src/shared/ui/material/AGENTS.md` rules for one official Material family. One operator command orchestrates canonical contract extraction, implementation plus migration, and fresh independent review.
- Follow `docs/testing/storybook.md` for Storybook ownership, story authoring, catalogue hierarchy, and UI-owned browser/visual proof; follow `docs/testing/migration-plan.md` for the current executable Playwright spec location.
- Do not use legacy Material DESIGN/ARCHITECTURE/IMPLEMENTATION/MIGRATION/REVIEW stages as the current workflow authority.

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

Shared UI changes require consumer and blast-radius review plus proof at the layer that owns the changed contract. Material implementation owns standalone proof and consumer migration; a fresh independent review checks the complete resulting family before architect-owned PR CI.
