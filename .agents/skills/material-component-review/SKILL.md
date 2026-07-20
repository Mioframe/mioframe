---
name: material-component-review
description: 'Use for an independent read-only contract-gate or final-gate review of one Material component family against official sources, complete concern coverage, ownership, proof, consumers, rendered behavior, and workflow state. Never modify repository files.'
---

# Material component review

This is the only review-only workflow for an official Material component family.

It supports two scopes:

- `contract-gate` — before production edits;
- `final-gate` — after implementation and any conditional adoption.

Do not implement or repair through this skill.

## Independence requirement

Run from a fresh agent session or isolated read-only context that did not author the contract or implement the patch being reviewed.

Receive only the family, review scope, current objective, required scenarios, applicable platforms, current repository ref, and applicable operator evidence. Reconstruct repository rules and official evidence independently.

Do not accept implementation reasoning, rejected approaches, previous self-review, green CI, or claims of correctness as evidence. When independent context is unavailable, return `blocked — independent review handoff required`.

Claude Code may use `material-contract-gate-reviewer` or `material-final-reviewer` from `.claude/agents/`. Codex may use a separate agent thread or isolated worktree. The reviewer does not delegate further.

## Required sources

Read root and nested `AGENTS.md`, Material architecture and source rules, component workflow, family README, applicable official sources, and repository evidence appropriate to the scope.

## Contract-gate scope

Review before any production edit for the correction unit.

Verify:

- canonical target was produced without current implementation, component proof, or prior family conclusions determining it;
- applicable platforms are explicit;
- diagrams, prose, specs, accessibility guidance, and token tables are reconciled;
- every contradiction, absence, inference, and platform-specific rule has a source-decision entry;
- required unresolved decisions block dependent work;
- every mandatory concern is classified or marked not applicable with a reason;
- `confirmed-compliant` and `project-extension` satisfy their full evidence requirements;
- every dependency is correctly classified;
- current proof is honestly classified;
- the selected correction unit is the highest-priority complete unit available;
- proof lane, prepared failing observation, compatibility impact, visible impact, and operator requirement are resolved;
- workflow state, detailed README sections, and roadmap agree;
- production, test, story, or snapshot changes for the unit did not precede the gate.

Use exactly one contract result:

- `contract gate passed`;
- `contract gate failed`;
- `blocked — insufficient evidence`;
- `blocked — independent review handoff required`.

Production may begin only after `contract gate passed`.

## Final-gate scope

Review the complete current family and resulting PR, not only the latest diff.

Inspect:

- target provenance, source decisions, and platform applicability;
- full alignment map and remaining gaps;
- public API, native and form semantics, event propagation, accessibility, anatomy, DOM, target area, and unnecessary nodes;
- semantic and transient state, precedence, lifecycle, interruption, cancellation, disabled and failure behavior;
- dependency and ownership direction;
- token declarations, configuration, state routing, rendered properties, public overrides, geometry, typography, responsive behavior, RTL, and text scaling;
- motion acquisition, rapid input, interruption, and reduced motion;
- project extensions and dependency health;
- decomposition and actual file/style ownership;
- proof lanes and actual proof contents;
- Storybook output, visual baselines, official comparison, and operator status;
- representative and remaining consumers;
- obsolete owners, exports, tests, stories, snapshots, aliases, and compatibility residue;
- workflow state, roadmap, and verification readiness.

Determine separately:

1. whether the current correction objective is complete and mergeable;
2. whether the family is `aligned`, `converging`, or `blocked`.

## Mandatory defect patterns

Treat as blockers or major issues unless narrowly justified:

- target derived from legacy code or proof;
- hidden or selectively omitted source conflict;
- platform-specific guidance applied to another platform without a decision;
- token absence used to cancel explicit guidance, or token presence used as sole proof of support;
- mandatory concern omitted from assessment;
- existing proof reused without classification;
- dependency classified as generic merely because it is widely reused;
- lower-priority improvement selected around a higher-priority blocker;
- proof placed in the wrong lane;
- visual spec containing browser-behavior assertions or computed-style matrices;
- visible change without required official comparison or operator acceptance;
- production work preceding the contract gate;
- stale or contradictory workflow state or roadmap;
- relocation, decomposition, copied styles, stable snapshots, or green CI presented as Material improvement without source-backed or ownership-backed delta;
- accidental monolith or artificial fragmentation;
- consumer migration onto a misaligned or unresolved contract;
- family declared aligned while required gaps remain.

## Findings

Consolidate findings into blockers, major issues, minor issues, and items outside the current objective.

Every actionable finding states requirement, concrete evidence, mismatch, affected scenario, required final state, whether it blocks objective or family completion, and correction owner:

- `material-component-contract`;
- `material-component-implementation`;
- `material-component-adoption`.

Do not scatter one root problem across repetitive findings.

## Final verdicts

For `final-gate`, use exactly one objective verdict:

- `correction objective complete`;
- `correction objective complete — operator visual acceptance required`;
- `correction objective incomplete`;
- `blocked — insufficient evidence`;
- `blocked — independent review handoff required`.

Family status is exactly `aligned`, `converging`, or `blocked`.

Green verification never upgrades a review result by itself.

## Result

```text
MATERIAL STAGE RESULT
Family:
Stage: review
Review scope: contract-gate | final-gate
Status: complete | blocked
Exit gate: passed | failed
Contract gate result: not-applicable | passed | failed
Current objective result:
Family alignment status: aligned | converging | blocked
Independent context: confirmed | unavailable
Evidence:
Operator visual status: not-required | required | accepted | rejected
Remaining known gaps:
Next correction unit: none | <exact unit>
Blocker: none | <exact blocker>
```

## Restrictions

- Do not modify production, consumer, test, story, snapshot, contract, roadmap, or export files.
- Do not invoke correction skills or advance the workflow.
- Do not create durable audits, registries, scorecards, or second family-state documents.
- Do not approve incomplete ownership, proof, scenarios, dependencies, workflow state, visual evidence, or verification.
- Do not require deletion of already confirmed owners because another owner is defective.
