# Material library documentation

This directory contains durable documentation for `src/shared/ui/material`.

Read only task-relevant documents:

- [`architecture.md`](./architecture.md) — boundary, ownership, dependency direction, decomposition, public API, and stable invariants;
- [`tokens.md`](./tokens.md) — token taxonomy, naming, location, dependency direction, routing, and verification;
- [`sources.md`](./sources.md) — official Material 3 Expressive authority and evidence rules;
- [`component-development.md`](./component-development.md) — full-family invocation, canonicalization preflight, dependency closure, convergence, review, and completion;
- [`foundation-development.md`](./foundation-development.md) — cross-family foundation convergence;
- [`roadmap.md`](./roadmap.md) — active family, blocker, and one next action.

`material-component` and `material-foundation` are the only writers/orchestrators. They own discovery, architecture, prerequisites, correction selection, implementation, state updates, and continuation.

A family-only `material-component` invocation is `full-family`. Persisted README or roadmap text cannot narrow it. `converging` is internal progress; terminal results are `aligned` or exactly `blocked`.

Portable read-only skills separate bounded responsibilities:

- `material-canonical-target` — delegated official target claims;
- `material-semantics-audit` — API, native semantics, accessibility, state, extensions, dependencies, and consumers;
- `material-token-audit` — token graph and rendered token proof;
- `material-web-audit` — DOM, CSS, layout, motion, lifecycle, and browser proof;
- `material-component-review` — one correction gate with independent dependency reconstruction;
- `material-family-review` — complete family readiness from current code.

Tool-specific agent directories, model settings, permissions, Git state, and PR metadata are not Material policy owners.

Use isolated contexts only for self-contained research/evidence/review that would otherwise flood the orchestrator. Keep preflight, contract synthesis, implementation, adoption, prerequisites, state updates, and continuation in the orchestrator.

Canonical family contracts live beside implementation in `components/<family>/README.md`. A legacy family contract may remain under `docs/legacy/<family>.md` only while one active legacy owner exists. Foundation README files exist only for real contracts.

The owning README stores compact current truth: invocation scope, target, owner, dependency/prerequisite state, durable contract, proof, current correction, alignment, and remaining gaps.

Selectors, exact token edges, motion routes, review history, shell transcripts, repeated source narratives, stale objectives, and future-pass plans are not durable README content.

Current code, tests, stories, snapshots, consumers, and green checks are evidence, not Material authority or architecture approval.

Architecture proof includes:

- `scripts/materialBoundaryArchitecture.test.mjs` for legacy-owner imports and boundary escapes;
- `scripts/materialTokenArchitecture.test.mjs` for token ownership and graph rules.

Do not create parallel registries, inventories, audits, histories, checklists, progress ledgers, manuals, scorecards, or duplicate workflow documents.
