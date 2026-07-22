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

- `material-component` is a coordination-only root for one official component family. It must not edit production code, tests, tokens, consumers, exports, legacy owners, or owner README files.
- Every component owner correction runs in a fresh isolated writable `material-component-implementation` context.
- Every foundation owner correction runs in a fresh isolated writable `material-foundation` context.
- Every owner readiness decision runs in a different fresh isolated read-only `material-component-review` context.
- Final family readiness runs in another fresh isolated read-only `material-family-review` context.
- Target, semantics, token, and Web skills are read-only specialists delegated by the owning context.

Tool-specific agent configuration, Git state, and publication workflow are not Material policy owners.

## Stable invariants

- Material production code does not import legacy Material owners outside this root.
- Foundation does not import components or patterns; families do not deep-import another family's private files.
- A family-only invocation is one logical full-family operation. Required prerequisites remain inside that orchestration and return to the caller.
- The continuation stack is root-to-deepest unfinished owner. Only the deepest owner may be implemented or reviewed.
- A stack entry is removed only after implementation by a fresh writable context and acceptance by a different fresh read-only reviewer.
- The root orchestrator cannot substitute for an unavailable implementation or review context. Isolation failure is a physical checkpoint reason.
- One logical operation may span physical sessions only through the compact validated continuation stack in `docs/roadmap.md`; the operator always resumes the same root family command.
- Canonical export, adoption, and legacy-owner removal require closed dependencies.
- Owner README files contain durable contracts only. Current stage, backlog, review history, shell output, and future passes are forbidden.
- Roadmap may contain only active root family, alignment status, one continuation stack, one checkpoint reason, exact external blocker, and one next action. It must never delegate a nested prerequisite to the operator.

Detailed execution belongs to the relevant skill. Do not restate it in local documents or task reports.

## Completion

Family completion requires an empty stack, accepted independent owner reviews, closed dependencies, one canonical owner, required proof and operator comparison, independent family review, and final repository verification. A checkpoint is nonterminal and requires one exact allowed physical reason.
