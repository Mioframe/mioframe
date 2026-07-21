# src/shared/ui

Inherits `src/shared/AGENTS.md`.

## Routing

- Use `shared-ui-implementation` for project-specific or generic shared UI outside official Material families.
- Use `material-component` for one official Material component family; a family name alone means full-family convergence.
- Use `material-foundation` only for a real cross-family Material contract or delegated prerequisite.
- Use `material-component-review` for one correction gate and `material-family-review` for final family readiness.
- Inside `src/shared/ui/material`, follow its `AGENTS.md`.

Portable `.agents/skills` and repository documents own the workflow. Tool-specific configuration, Git state, and publication workflow do not.

## Boundaries

- Canonical Material implementation, contracts, stories, fixtures, and focused proof belong under `src/shared/ui/material`.
- Project-specific and generic shared UI remains outside that boundary.
- Existing official Material owners outside it are legacy; replace them only through one complete valid migration.
- Shared UI does not import product layers or domain models.

Do not create Material registries, durable audits, histories, checklists, scorecards, or duplicate workflow instructions here.

## Verification

Shared UI changes require owner-level proof and consumer blast-radius review. Material family completion additionally requires closed dependencies, one canonical owner, independent family review, required operator acceptance, and final verification.
