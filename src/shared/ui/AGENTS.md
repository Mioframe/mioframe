# src/shared/ui

Inherits `src/shared/AGENTS.md`. Applies to `src/shared/ui` and descendants until a deeper rule file refines it.

## Routing

- Use `shared-ui-implementation` for project-specific presentation primitives, wrappers, and generic shared UI infrastructure outside official Material families.
- Use `material-component` as the sole implementation entry point for exactly one official Material family.
- A family name alone is a `full-family` invocation. It must continue until `aligned` or an exact external blocker; `converging` and a completed correction unit are not terminal results.
- `focused-correction` requires an explicit bounded operator objective. Persisted README/roadmap text cannot narrow the invocation.
- Use `material-component-review` for one independent correction gate; it independently reconstructs actual dependencies when canonical ownership/export/adoption is involved.
- Use `material-family-review` only for independent final review after no known required gap or internal prerequisite remains.
- Use `material-foundation` for one real cross-family contract or exact delegated prerequisite.
- Use `material3-guidelines` for official source lookup, component choice, usage, and composition.
- Use `material-library-status` only for concise read-only status.
- Inside `src/shared/ui/material`, follow its `AGENTS.md`.

When no family is supplied, `material-component` may continue only the one active roadmap family. Do not ask the user to design variants, API, foundations, files, tests, or consumers when official sources and repository evidence resolve them.

Implementation, bounded correction review, and complete family review remain separate responsibilities. Internal concern/stage skills are orchestrator-only.

Portable `.agents/skills` and repository documents own workflow policy. Tool-specific agents, model configuration, permissions, Git state, and publication workflow are not policy owners.

## Boundaries

- Canonical Material implementation, documentation, contracts, stories, fixtures, and focused tests belong under `src/shared/ui/material`.
- Project-specific and generic shared UI remains outside Material ownership.
- Official public families belong under `material/components/<family>`.
- Real family-agnostic cross-family contracts belong under `material/foundation/<domain>`.
- Existing official Material owners outside the canonical root are legacy until a complete valid relocation replaces them.
- A dependency used by a family remains inside that family's orchestration even when foundation or another family implements it.
- Do not create a canonical export, migrate consumers, or remove the legacy owner while actual dependency closure is open.
- Shared UI must not import product layers or domain models.

Do not create Material registries, inventories, durable audits, review histories, checklists, scorecards, progress ledgers, or duplicate workflow policy.

## Verification

Shared UI changes require consumer/blast-radius review and proof at the owning layer.

Full Material family completion requires closed actual dependencies, completed prerequisites, one canonical owner, clean Material boundary/token guards, independent family review, required operator visual acceptance, and passed final repository verification.
