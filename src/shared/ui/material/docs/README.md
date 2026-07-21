# Material library documentation

This directory contains the durable documentation for `src/shared/ui/material`.

Read only the documents required by the current task:

- [`architecture.md`](./architecture.md) — boundary, ownership, dependency direction, decomposition, public API, and stable convergence invariants;
- [`tokens.md`](./tokens.md) — token taxonomy, naming, location, dependency direction, routing, and verification;
- [`sources.md`](./sources.md) — official Material 3 Expressive authority and evidence rules;
- [`component-development.md`](./component-development.md) — autonomous family convergence, concern ownership, evidence reuse, review budgets, and completion;
- [`foundation-development.md`](./foundation-development.md) — autonomous cross-family foundation convergence;
- [`roadmap.md`](./roadmap.md) — active family, blocker, and one next action.

`material-component` and `material-foundation` are the only writers and orchestrators. They own discovery, architecture, correction selection, implementation, state updates, and continuation.

Portable read-only skills under `.agents/skills` separate bounded responsibilities:

- `material-canonical-target` — delegated official target claims only;
- `material-semantics-audit` — API, native semantics, accessibility, state, extensions, dependencies, and consumers;
- `material-token-audit` — token graph and rendered token proof;
- `material-web-audit` — DOM, CSS, layout, motion, lifecycle, and browser proof;
- `material-component-review` — one correction contract or correction-final gate;
- `material-family-review` — complete current family readiness after no known required gap remains.

A runtime may execute a portable skill in the orchestrator context or an isolated read-only context. Tool-specific agent directories, model settings, permission files, Git state, and pull-request metadata are not Material policy owners.

Use isolated contexts only for self-contained research or review that would otherwise fill the orchestrator context with source pages, repository search results, browser evidence, or review detail. Keep orientation, contract synthesis, implementation, adoption, state updates, and continuation in the orchestrator because those phases share substantial state.

Canonical family contracts live beside canonical implementation in `components/<family>/README.md`. While one active legacy owner remains elsewhere under `src/shared/ui`, its contract may live under `docs/legacy/<family>.md` and moves with the family during relocation. A foundation domain gets `foundation/<domain>/README.md` only after a real contract exists.

The owning README contains one compact current workflow state, applicable target/source decisions, classifications, durable public/token/style/motion contracts, proof obligations, current correction unit, dependency status, and remaining gaps.

Exact selectors, declarations, token edges, keyframe references, runtime route inventories, review history, shell transcripts, and repeated source narratives are not durable README content. Code and concise role results own those transient facts.

Existing code, tests, stories, snapshots, consumers, and green verification are evidence of current behavior and compatibility. They are not Material authority.

Do not create separate registries, inventories, durable audits, review histories, checklists, progress ledgers, verification manuals, Storybook manuals, alignment scorecards, or duplicated workflow documents.
