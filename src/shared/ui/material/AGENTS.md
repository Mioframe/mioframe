# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is Mioframe's canonical Material 3 Expressive shared-library boundary.

The library is reusable infrastructure, not a product layer. Material production remains independent of product architecture and domain behavior.

## Read by task

- `docs/architecture.md` — boundary, ownership, dependency direction, decomposition, and public API;
- `docs/tokens.md` — token taxonomy, naming, location, dependency graph, routing, and verification;
- `docs/sources.md` — official evidence and source-conflict rules;
- `docs/component-development.md` — autonomous family convergence and invocation semantics;
- `docs/foundation-development.md` — cross-family foundation convergence;
- `docs/roadmap.md` — active family, blocker, and one next action;
- owning family/foundation README — current contract and workflow state.

Read only task-relevant documents.

## Routing

- `material-component` is the sole writer/orchestrator for one official component family.
- A family-only invocation is `full-family`; it ends only `aligned` or exactly `blocked`.
- `focused-correction` requires an explicit bounded operator objective. Persisted README/roadmap text cannot create it.
- `material-foundation` owns one real cross-family contract or exact delegated prerequisite.
- `material-canonical-target`, `material-semantics-audit`, `material-token-audit`, and `material-web-audit` are bounded read-only concerns.
- `material-component-review` independently reviews one correction and reconstructs actual dependencies.
- `material-family-review` independently reviews complete current family state.
- Internal contract, implementation, and adoption skills run only inside the orchestrator.

Do not use `shared-ui-implementation` as the primary workflow for an official Material family.

Portable `.agents/skills` and canonical Material documents own policy. Tool-specific agents, model configuration, permissions, Git state, and publication workflow are not policy owners.

## Boundary

Canonical Material implementation, foundation, families, patterns, public entry points, owner-local stories, fixtures, focused tests, and contracts belong under this root.

Existing official Material owners outside this root are legacy owners until a complete valid relocation replaces them.

Code under this root must not import another `@shared/ui/*` owner, legacy `@shared/lib/md`, or escape by relative path into legacy shared UI. Use a canonical local Material owner or an allowed generic `shared/lib` contract. `scripts/materialBoundaryArchitecture.test.mjs` enforces this for production, stories, fixtures, and tests.

Do not create a root export, migrate consumers, or remove/forward the legacy owner while required dependency closure is open.

## Dependency direction

```text
Vue and browser platform
        ↓
generic shared/lib infrastructure
        ↓
material/foundation
        ↓
material/components
        ↓
material/patterns
        ↓
project-specific shared UI and product layers
```

- Foundation does not import components or patterns.
- Families do not deep-import another family's private files.
- Internal Material code uses local owner entry points; external consumers use the curated root API only when ready.
- A dependency remains inside the calling family orchestration even when foundation or another family implements it.
- Internal prerequisites execute depth-first and return to the caller; they are not future operator tracks.

## Agent execution

Keep preflight, orientation, contract synthesis, implementation, adoption, prerequisite advancement, workflow state, and continuation in the orchestrator context.

Use isolated read-only contexts only for bounded research, concern audits, browser evidence, or independent review.

Before each first correction and after ownership/export/import/consumer changes, reconstruct canonical ownership and actual dependency closure from code. Persisted workflow state is evidence, not authority.

A correction unit is not an invocation boundary. Continue while required gaps, internal prerequisites, boundary failures, or repairable verification failures remain.

## Token invariant

Follow `docs/tokens.md`. Do not invent ambiguous `--md-<component>-*` aliases, place component tokens outside the owning family token file, or expose `--md-private-*` routes publicly.

## Durable records

The owning README stores current truth only: invocation scope, target, owner, dependencies, prerequisite stack, current correction, proof, alignment, and remaining gaps.

Remove stale objectives, review histories, shell transcripts, search output, route inventories, stage diaries, scorecards, future-pass narratives, and duplicate workflow policy.

## Completion

A correction requires contract review, completed prerequisites, implementation proof, boundary checks, and correction-final review.

Full family completion requires closed actual dependencies, completed prerequisites/adoption, one canonical owner, required operator comparison, `material-family-review: complete`, and final `pnpm verify` passed. `converging` is not a terminal full-family result.
