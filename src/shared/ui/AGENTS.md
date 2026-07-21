# src/shared/ui

Inherits `src/shared/AGENTS.md`. Applies to `src/shared/ui` and descendants until a deeper rule file refines it.

## Routing

- Use `shared-ui-implementation` for project-specific presentation primitives, wrappers, and generic shared UI infrastructure outside official Material families.
- Use `material-component` as the sole implementation entry point for exactly one official Material family. A family name is sufficient input; the agent autonomously discovers and completes the required work.
- Use `material-component-review` only for one independent correction contract or correction-final review.
- Use `material-family-review` only for independent final review after the family orchestrator reports no known required gap.
- Use `material-foundation` for autonomous convergence of one real cross-family Material contract or exact delegated prerequisite.
- Use `material3-guidelines` for official source lookup, component choice, usage, and composition.
- Use `material-library-status` only for concise read-only family, correction, roadmap, and verification status.
- Inside `src/shared/ui/material`, follow its `AGENTS.md`; it owns detailed Material workflow routing.

When no family is supplied, `material-component` may continue only the one active family recorded by the roadmap. Do not ask the user to design variants, API, foundations, files, tests, or consumers when official sources and repository evidence can resolve them.

Implementation, bounded correction review, and complete family review are separate responsibilities. Internal Material concern and stage skills are invoked only by the orchestrators.

Portable `.agents/skills` and repository documents own the workflow. Tool-specific agent directories, model configuration, permissions, Git state, and publication workflow are not policy owners.

## Boundaries

- All canonical Material-owned implementation, documentation, family/domain contracts, stories, fixtures, and focused tests belong under `src/shared/ui/material`.
- Project-specific and generic shared UI remains outside official Material ownership.
- New official public `MD*` families belong under `material/components/<family>`.
- New cross-family Material owners belong under `material/foundation/<domain>` only after a real need is proven.
- Reusable official Material compositions belong under `material/patterns/<pattern>` only after the pattern gate passes.
- Existing official Material directories outside the canonical root are legacy owners. They may be assessed and corrected in place through `material-component` until a complete relocation is safe. Do not create parallel active owners or force relocation before correctness.
- Shared UI must not import product layers or domain models.

Do not create Material registries, inventories, durable audits, review histories, separate checklists, alignment scorecards, progress ledgers, or duplicate workflow policy outside the Material root.

## Verification

Shared UI changes require consumer and blast-radius review plus proof at the layer that owns the changed contract.

A Material correction requires correction review. Full family completion requires closed dependencies, one canonical owner, independent family review, required operator visual acceptance, and final repository verification.
