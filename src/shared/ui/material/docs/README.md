# Material library documentation

This directory contains the complete durable documentation for `src/shared/ui/material`.

Read only the documents required by the current task:

- [`architecture.md`](./architecture.md) — boundary, ownership, dependency direction, convergence model, implementation decomposition, public API, and workflow ownership;
- [`sources.md`](./sources.md) — official Material 3 Expressive authority and evidence rules;
- [`component-development.md`](./component-development.md) — the canonical component convergence model;
- [`foundation-development.md`](./foundation-development.md) — the convergence workflow for a real cross-family Material foundation contract;
- [`roadmap.md`](./roadmap.md) — active family, blocker, and one next correction action.

Implementation starts only through `material-component`. Its skill is the executable workflow owner and strengthens `component-development.md` with mandatory responsibility isolation, canonical-target lock, complete concern coverage, dependency classification, correction priority, proof-lane lock, independent contract review before production, and independent final review before verification.

Use read-only delegated agents or fresh isolated sessions for canonical target research, current-state audit, contract-gate review, and final review. Claude Code project definitions live under `.claude/agents/`; Codex may use separate agent threads or isolated worktrees. Delegation never transfers orchestration, repository writes, or final decisions away from `material-component`.

Canonical family contracts live beside canonical implementation in `components/<family>/README.md`. While one active legacy owner remains elsewhere under `src/shared/ui`, its contract may live under `docs/legacy/<family>.md` and moves with the family during relocation. A foundation domain gets `foundation/<domain>/README.md` only after a real runtime, correction, or public contract exists.

Family and foundation README files contain one coherent workflow-state block plus the applicable canonical target, source decisions, current implementation assessment, alignment map, dependency classifications, implementation decomposition, style and motion ownership, proof map, correction units, and implementation order. These sections are the single implementation and convergence record.

Existing code, tests, stories, snapshots, consumers, and green verification are evidence of current behavior and compatibility. They are not Material authority and must be classified before reuse.

Review-only assessment uses `material-component-review` with explicit `contract-gate` or `final-gate` scope. Review reports findings without fixing files or creating another workflow artifact.

Do not create separate registries, inventories, audits, checklists, progress ledgers, verification manuals, Storybook manuals, alignment scorecards, or duplicated workflow documents. Code, owning README contracts, proof, exports, accepted snapshots, consumers, and Git history are the factual implementation record.
