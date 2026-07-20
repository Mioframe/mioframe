# Material library documentation

This directory contains the complete durable documentation for `src/shared/ui/material`.

Read only the documents required by the current task:

- [`architecture.md`](./architecture.md) — boundary, ownership, dependency direction, convergence model, implementation decomposition, public API, and workflow ownership;
- [`sources.md`](./sources.md) — official Material 3 Expressive authority and evidence rules;
- [`component-development.md`](./component-development.md) — the only orchestrated convergence workflow for one component family;
- [`foundation-development.md`](./foundation-development.md) — the convergence workflow for a real cross-family Material foundation contract;
- [`roadmap.md`](./roadmap.md) — active family, blocker, and one next correction action.

Implementation starts only through `material-component`. It internally routes canonical-target resolution, current-state assessment, correction implementation, conditional adoption, and independent review to their owners. Review-only assessment uses `material-component-review`; it reports findings without creating a second workflow or durable audit artifact.

Canonical family contracts live beside canonical implementation in `components/<family>/README.md`. While one active legacy owner remains elsewhere under `src/shared/ui`, its contract may live under `docs/legacy/<family>.md` and moves with the family during relocation. A foundation domain gets `foundation/<domain>/README.md` only after a real runtime, correction, or public contract exists.

Family and foundation README files contain the applicable canonical target, current implementation assessment, alignment map, implementation decomposition, style and motion ownership, proof map, correction units, and implementation order required by their workflow. These structured sections are the single implementation and convergence record; they are not separate status documents.

Existing code, tests, stories, snapshots, and consumers are evidence of current behavior and compatibility. They are not Material authority and must be classified before reuse as canonical proof.

Do not create separate registries, inventories, audits, checklists, progress ledgers, verification manuals, Storybook manuals, alignment scorecards, or duplicated workflow documents. Code, owning README contracts, proof, exports, accepted snapshots, consumers, and Git history are the factual implementation record.
