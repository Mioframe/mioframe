---
name: material-component
description: 'Use when creating, repairing, aligning, migrating, continuing, or materially improving one official Material component family. Orchestrates the canonical evidence-gated workflow, isolated role handoffs, bounded correction units, independent reviews, conditional adoption, and verification.'
---

# Material component orchestrator

This is the sole implementation entry point for one official Material component family. Use `material-component-review` for review-only requests.

Follow `src/shared/ui/material/docs/component-development.md` as the single canonical workflow. Do not restate or alter its classifications, correction priority, proof lanes, or completion rules here.

## Task lock

Resolve and record one:

- family;
- mode: `new-component`, `align-existing`, or `focused-correction`;
- correction objective;
- required scenarios and platforms;
- non-goals;
- current stage and next gate.

Use `align-existing` whenever an implementation exists. Relocation, decomposition, API preservation, adoption, and cleanup are actions, not modes or proof.

A family name is optional only when `docs/roadmap.md` already identifies one active family.

## Orchestration

Execute exactly this sequence:

```text
material-canonical-target in an isolated read-only context
→ target lock
→ material-current-state-audit in a separate read-only context
→ material-component-contract synthesis
→ material-component-review with Review scope: contract-gate
→ material-foundation when an exact prerequisite is approved
→ material-component-implementation for one approved correction unit
→ material-component-adoption only when ownership migration or cleanup is in scope
→ material-component-review with Review scope: final-gate in a different context
→ verification
→ next correction unit or family completion
```

Production edits are forbidden before `contract gate passed`.

Only this orchestrator:

- synthesizes role and stage results;
- writes the family workflow state and roadmap;
- selects the next stage or correction unit;
- reopens the target or contract when evidence invalidates a locked decision;
- decides whether the objective or family is complete.

Internal roles and stage skills do not invoke each other or update the roadmap.

## Cross-agent isolation

Canonical role procedures live in portable `.agents/skills`:

- `material-canonical-target`;
- `material-current-state-audit`;
- `material-component-review`.

Claude Code may use thin `.claude/agents` adapters that preload these skills and restrict tools. Codex may run the same skills in separate agent threads or isolated worktrees. Tool-specific adapters are not policy owners.

For every isolated handoff provide only the bounded scope, required scenarios, platforms, repository ref, applicable instruction paths, and required result format. Do not pass preferred conclusions or implementation reasoning to reviewers.

Researchers and reviewers are read-only. Never use concurrent writers on the same owner or worktree. The orchestrator validates every returned claim and remains responsible for the decision.

When isolated execution is unavailable, stop with `independent review handoff required`; do not weaken the gate.

## Workflow state

Keep one coherent `MATERIAL WORKFLOW STATE` block in the owning README using the fields defined by `component-development.md`.

After each stage:

1. validate the returned exit gate;
2. update only orchestrator-owned state fields and roadmap facts;
3. confirm detailed README sections do not contradict the state block;
4. invoke only the recorded next gate.

A stale README or roadmap blocks progression.

## Correction routing

Route findings to one owner:

- target, source decision, classification, dependency, supported surface, contract, decomposition, correction priority, or proof lane → `material-component-contract`;
- production, DOM, styles, state implementation, token routing, motion implementation, Storybook, or proof implementation → `material-component-implementation`;
- consumers, parallel owners, import migration, obsolete paths, aliases, or cleanup → `material-component-adoption`.

Run the applicable independent gate again after corrections.

## Stop conditions

Stop for an exact unresolved blocker in official evidence, platform applicability, required scenario, ownership, dependency direction, public contract, foundation blast radius, proof ownership, independent context, repeated correction failure, visual acceptance, or verification.

A fresh context resets reasoning, not independently confirmed repository progress.

## Result

Report family, mode, objective, current workflow state, target and assessment results, contract-gate result, completed correction unit, preserved or replaced owners, foundation and consumer impact, proof result, final-gate result, family alignment status, operator visual status, verification, remaining gaps, next action, and exact blocker or `none`.
