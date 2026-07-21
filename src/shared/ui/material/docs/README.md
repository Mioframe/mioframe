# Material library documentation

This directory contains the durable documentation for `src/shared/ui/material`.

Read only the documents required by the current task:

- [`architecture.md`](./architecture.md) — boundary, ownership, dependency direction, decomposition, public API, and stable convergence invariants;
- [`tokens.md`](./tokens.md) — token taxonomy, naming, location, dependency direction, routing, and verification;
- [`sources.md`](./sources.md) — official Material 3 Expressive authority and evidence rules;
- [`component-development.md`](./component-development.md) — canonical component workflow, concern-role ownership, review budgets, and PR review;
- [`foundation-development.md`](./foundation-development.md) — canonical cross-family foundation workflow;
- [`roadmap.md`](./roadmap.md) — active family, blocker, and one next action.

`material-component` and `material-foundation` are the only writers/orchestrators. Internal skills own one bounded concern or stage and do not redefine the sequence.

Portable read-only roles under `.agents/skills` separate responsibility:

- `material-canonical-target` — delegated official target claims only;
- `material-semantics-audit` — API/native/accessibility/state/extensions/dependencies/consumers;
- `material-token-audit` — token graph and rendered token proof;
- `material-web-audit` — DOM/CSS/layout/motion/browser proof;
- `material-component-review` — one correction gate;
- `material-pr-review` — complete base-to-head merge readiness.

Claude Code may load these roles through thin `.claude/agents` adapters; Codex may use the same skills in separate agent threads or worktrees. Tool-specific adapters contain permissions and invocation scope only, never Material policy.

Canonical family contracts live beside canonical implementation in `components/<family>/README.md`. While one active legacy owner remains elsewhere under `src/shared/ui`, its contract may live under `docs/legacy/<family>.md` and moves with the family during relocation. A foundation domain gets `foundation/<domain>/README.md` only after a real contract exists.

The owning README contains current workflow state, applicable target/source decisions, classifications, durable public/token/style/motion contracts, proof obligations, the current correction unit, and remaining gaps.

Exact selectors, declarations, token edges, keyframe references, runtime route inventories, review-round history, shell transcripts, and repeated source narratives are not durable README content. Code and concise role results own those transient facts.

Existing code, tests, stories, snapshots, consumers, and green verification are evidence of current behavior and compatibility. They are not Material authority.

Do not create separate registries, inventories, durable audits, review histories, checklists, progress ledgers, verification manuals, Storybook manuals, alignment scorecards, or duplicated workflow documents.
