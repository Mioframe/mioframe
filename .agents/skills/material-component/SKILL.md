---
name: material-component
description: 'Use when creating, repairing, aligning, migrating, continuing, or materially improving one official Material component family. Orchestrates concern-scoped target research, focused specialist audits, dependency closure, one correction unit, bounded independent reviews, complete PR review, and verification.'
---

# Material component orchestrator

This is the sole implementation entry point for one official Material component family. Follow `src/shared/ui/material/docs/component-development.md` and `src/shared/ui/material/docs/tokens.md`.

## Task lock

Record:

- family and mode: `new-component`, `align-existing`, or `focused-correction`;
- correction objective, required scenarios/platforms, and non-goals;
- actual PR base/head and every public owner affected by the complete PR;
- current stage and next gate.

Use `align-existing` whenever an implementation exists.

## Concern and dependency plan

Before delegation, classify each lane as required or not required with a reason:

- canonical target claims requiring new research;
- semantics/API lane;
- token lane;
- Web implementation lane;
- required direct dependencies and their owners;
- dependency closure: `closed` or `blocked`;
- exact foundation prerequisite;
- exact canonical-family prerequisite;
- adoption scope.

Inventory every dependency needed by the supported public surface. Classify it as canonical Material foundation, canonical Material family, temporary legacy Material, project extension, or generic non-Material foundation.

A required temporary legacy Material dependency, unresolved reference/system token group, unowned shared Material behavior, known-defective dependency, family-private deep import, hidden required fallback, or parallel active owner blocks dependency closure.

When the missing contract is cross-family and family-agnostic, delegate the smallest coherent currently required prerequisite to `material-foundation`. When it belongs to another official component family, require that family's ready public contract or remove/defer the dependent extension. Do not classify another component family as foundation.

For focused correction, invoke only affected lanes and direct dependencies. New families, full owner migration, adoption, or explicit full-family audit normally require all applicable lanes and closed dependencies.

## Orchestration

```text
concern-scoped material-canonical-target when required
→ selected isolated audits:
   material-semantics-audit
   material-token-audit
   material-web-audit
→ material-component-contract
→ material-component-review with Review scope: contract-gate
→ complete material-foundation or canonical-family prerequisite when required
→ material-component-implementation for one approved unit
→ material-component-adoption only for approved migration/cleanup
→ material-component-review with Review scope: correction-final
→ material-pr-review against actual base/head
→ verification
```

Production edits are forbidden before `contract gate passed`. Component implementation does not begin while a required prerequisite is pending or blocked.

Only this orchestrator:

- selects concern lanes and synthesizes their results;
- inventories direct dependencies and owns dependency-closure status;
- writes family workflow state and roadmap facts;
- selects one correction unit;
- reopens target/contract when new evidence invalidates a locked claim;
- distinguishes correction completion, dependency closure, family alignment, and PR merge readiness;
- decides whether to advance or stop.

Internal roles and stage skills do not invoke each other or update the roadmap.

## Handoffs

For each bounded target, semantics, token, Web, or correction-review role provide only:

- exact concern set;
- required scenarios/platforms;
- current repository ref and bounded paths;
- relevant locked target claims;
- applicable instructions;
- required result format.

For a foundation prerequisite provide its exact required family-agnostic contract, current legacy owner, affected families, required proof, and completion condition. It returns control after one complete prerequisite.

For `material-pr-review`, provide the actual PR base/head, complete changed-file list, complete diff/patch evidence, resulting changed-owner files, dependency inventory/closure result, representative affected consumers, correction-review result, operator evidence, and verification result.

Do not pass preferred conclusions, implementation reasoning, unrelated README history, or complete family context to a bounded role. Complete PR context is reserved for `material-pr-review` only.

Claude Code may use thin `.claude/agents` adapters that preload portable skills. Codex may run the same skills in separate agent threads or isolated worktrees. Tool-specific adapters are not policy owners.

When required independent execution or handoff evidence is unavailable, stop; do not weaken the gate.

## Review budget

For each of contract gate, correction final gate, and PR review:

- allow one initial review;
- allow at most one re-review after substantive corrections;
- if the second review fails, stop with consolidated blockers;
- do not launch a new full review for wording, count, stale cross-reference, or other mechanical correction that does not change a contract decision or observable result;
- if the same root architecture problem survives two correction rounds, return to architecture rather than patching again.

Do not run repeated full target/audit passes without contradictory evidence.

## Workflow state

Keep one current `MATERIAL WORKFLOW STATE` block using the canonical fields, including dependency closure and prerequisite status. The README records current truth only. Remove superseded review narratives, shell transcripts, exact route ledgers, and historical round-by-round reasoning.

After each stage:

1. validate the exit gate;
2. update orchestrator-owned state fields and current contract facts;
3. ensure README and roadmap agree;
4. invoke only the recorded next gate.

## Routing

- official target/source decision → `material-canonical-target` then `material-component-contract`;
- API/native/accessibility/state/extension/consumer assessment → `material-semantics-audit`;
- token graph assessment → `material-token-audit`;
- DOM/CSS/layout/motion/browser assessment → `material-web-audit`;
- contract synthesis and correction selection → `material-component-contract`;
- production/proof implementation → `material-component-implementation`;
- reference/system or cross-family foundation correction → `material-foundation`;
- another official family prerequisite → that family's `material-component` workflow;
- consumer migration/obsolete ownership → `material-component-adoption`;
- correction gate → `material-component-review`;
- complete merge readiness → `material-pr-review`.

A finding outside a role's lane returns to this orchestrator; the role does not absorb it.

## Stop conditions

Stop for unresolved official evidence, platform applicability, required scenario, ownership, open required dependency closure, dependency direction, public contract, token graph, browser evidence, foundation blast radius, independent context, incomplete PR diff evidence, repeated review failure, operator rejection, or required verification failure.

A defect in the resulting base-to-head PR remains PR-owned even when it predates the latest correction round on the feature branch.

## Result

Report family, objective, concern/dependency plan, target slices, selected audit results, dependency closure and completed prerequisites, correction contract/review result, completed correction unit, correction-final result, complete PR-review verdict, family alignment, operator status, verification, remaining gaps, and exact next action or blocker.
