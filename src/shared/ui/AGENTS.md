# src/shared/ui

Inherits `src/shared/AGENTS.md`.

## Routing

- Use `shared-ui-implementation` for project-specific or generic shared UI outside official Material families.
- Use `material-component` as the coordination-only root for one official Material family; a family name alone means full-family convergence.
- Use `material-foundation` as the coordination-only root for one standalone exact cross-family foundation domain.
- Component and foundation owner edits run in fresh isolated writable `material-component-implementation` contexts with an explicit owner kind.
- A different fresh isolated read-only `material-component-review` context accepts each owner correction; another fresh read-only `material-family-review` context accepts final component-family readiness.
- A foundation prerequisite inside a component operation remains on the component root stack and must not create another root or roadmap writer.
- Inside `src/shared/ui/material`, follow its `AGENTS.md`.

Portable `.agents/skills` and repository documents own the workflow. Tool-specific configuration, Git state, and publication workflow do not.

## Boundaries

- Canonical Material implementation, contracts, stories, fixtures, and focused proof belong under `src/shared/ui/material`.
- Project-specific and generic shared UI remains outside that boundary.
- Existing official Material owners outside it are legacy; replace them only through one complete valid migration.
- Shared UI does not import product layers or domain models.
- A Material root orchestrator does not edit production code and cannot review its own delegated work.

Do not create Material registries, durable audits, histories, checklists, scorecards, or duplicate workflow instructions here.

## Verification

Shared UI changes require owner-level proof and consumer blast-radius review. Material completion additionally requires an empty continuation stack, accepted independent owner reviews, closed dependencies, singular canonical ownership, required operator acceptance where applicable, and final verification.
