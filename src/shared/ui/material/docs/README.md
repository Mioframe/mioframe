# Material library documentation

This directory contains the durable documentation for `src/shared/ui/material`.

Read only the documents required by the current task:

- [`architecture.md`](./architecture.md) — boundary, ownership, dependency direction, decomposition, public API, and stable convergence invariants;
- [`sources.md`](./sources.md) — official Material 3 Expressive authority and evidence rules;
- [`component-development.md`](./component-development.md) — the single canonical component convergence workflow;
- [`foundation-development.md`](./foundation-development.md) — the single canonical cross-family foundation workflow;
- [`roadmap.md`](./roadmap.md) — active family, blocker, and one next action.

`material-component` and `material-foundation` execute these workflows. Stage skills own only their bounded inputs, responsibility, exit gate, and result format; they do not redefine the canonical sequence.

Reusable isolated roles are portable Agent Skills under `.agents/skills`. Claude Code may load them through thin `.claude/agents` adapters; Codex may use the same skills in separate agent threads or worktrees. Tool-specific adapters contain permissions and invocation scope only, never Material policy.

Canonical family contracts live beside canonical implementation in `components/<family>/README.md`. While one active legacy owner remains elsewhere under `src/shared/ui`, its contract may live under `docs/legacy/<family>.md` and moves with the family during relocation. A foundation domain gets `foundation/<domain>/README.md` only after a real runtime, correction, or public contract exists.

The owning README contains one coherent workflow-state block plus the applicable canonical target, source decisions, current assessment, alignment map, dependency classifications, decomposition, style and motion contracts, proof map, correction units, and remaining gaps.

Exact selectors, CSS declarations, keyframe references, and runtime animation routes remain owned by code. Auditors and reviewers reconstruct them on every relevant run instead of maintaining a duplicate code ledger in documentation.

Existing code, tests, stories, snapshots, consumers, and green verification are evidence of current behavior and compatibility. They are not Material authority and must be classified before reuse.

Review uses `material-component-review` with explicit `contract-gate` or `final-gate` scope. Review reports findings without fixing files or creating another workflow artifact.

Do not create separate registries, inventories, audits, checklists, progress ledgers, verification manuals, Storybook manuals, alignment scorecards, or duplicated workflow documents.
