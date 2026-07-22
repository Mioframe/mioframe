# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical Material 3 Expressive library boundary.

## Read by task

- `docs/architecture.md` for ownership and dependency direction;
- `docs/tokens.md` for token rules;
- `docs/sources.md` for official evidence;
- `docs/component-development.md` or `docs/foundation-development.md` for the convergence model;
- `docs/roadmap.md` for active root status and an optional continuation stack, and the owning README for durable contract facts.

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
- A family-only invocation is one logical full-family operation. Required prerequisites remain inside that orchestration and return to the caller.
- One logical operation may span physical sessions only through the compact validated continuation stack in `docs/roadmap.md`; the operator always resumes the same root family command.
- Canonical export, adoption, and legacy-owner removal require closed dependencies.
- One correction unit is active at a time, but one session continues through multiple reviewed units while it can safely proceed.
- Owner README files contain durable contracts only. Current stage, backlog, review history, shell output, and future passes are forbidden.
- Roadmap may contain only active root family, alignment status, one continuation stack, exact external blocker, and one next action. It must never delegate a nested prerequisite to the operator.

Detailed execution belongs to the relevant skill. Do not restate it in local documents or task reports.

## Completion

Family completion requires closed dependencies, completed prerequisites, one canonical owner, required proof and operator comparison, independent family review, and final repository verification. A checkpoint is nonterminal and not merge readiness.
