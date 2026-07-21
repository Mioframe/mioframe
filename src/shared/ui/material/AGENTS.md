# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical Material 3 Expressive library boundary.

## Read by task

- `docs/architecture.md` for ownership and dependency direction;
- `docs/tokens.md` for token rules;
- `docs/sources.md` for official evidence;
- `docs/component-development.md` or `docs/foundation-development.md` for the applicable convergence model;
- `docs/roadmap.md` and the owning README for current state only.

Read only what the current task requires.

## Routing

- `material-component` is the sole writer and orchestrator for one official component family.
- `material-foundation` is the sole writer and orchestrator for one real cross-family contract.
- Target, semantics, token, Web, correction-review, and family-review skills are read-only specialists.
- Contract, implementation, and adoption skills run only inside the owning orchestrator.

Tool-specific agent configuration, Git state, and publication workflow are not Material policy owners.

## Stable invariants

- Material production code does not import legacy Material owners outside this root.
- Foundation does not import components or patterns; families do not deep-import another family's private files.
- A family-only invocation is full-family work. Required prerequisites remain inside that orchestration and return to the caller.
- Canonical export, adoption, and legacy-owner removal require closed dependencies.
- One correction unit is active at a time, but the orchestrator continues while required gaps remain.
- The owning README contains compact current truth only; no histories, ledgers, registries, or duplicate workflow policy.

Detailed execution belongs to the relevant skill. Do not restate it in local documents or task reports.

## Completion

Family completion requires closed dependencies, completed prerequisites, one canonical owner, required proof and operator comparison, independent family review, and final repository verification.
