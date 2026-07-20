---
name: material-component
description: 'Use when creating, repairing, aligning, migrating, continuing, or materially improving one official Material component family. This is the sole evidence-gated convergence orchestrator from isolated target research through correction units, contract and final review, conditional adoption, and verification.'
---

# Material component

This is the only implementation entry point for an official Material component family.

A family name is optional only when `src/shared/ui/material/docs/roadmap.md` already names one active family. Resolve target behavior, current defects, ownership, dependencies, consumers, proof, and the next correction unit from official sources and repository evidence rather than asking the user to design the component.

Do not use this skill for review-only work. Use `material-component-review` instead.

## Required sources

Read:

1. root and applicable nested `AGENTS.md` files;
2. `src/shared/ui/material/docs/architecture.md`;
3. `src/shared/ui/material/docs/sources.md`;
4. `src/shared/ui/material/docs/component-development.md`;
5. `src/shared/ui/material/docs/roadmap.md` when selecting or advancing active work;
6. the owning family README when it exists.

## Task lock

Lock one family, mode (`new-component`, `align-existing`, or `focused-correction`), correction objective, required scenarios, applicable platforms, non-goals, current stage, and next gate.

Use `align-existing` whenever an implementation already exists. Relocation, API preservation, decomposition, adoption, and cleanup are actions, not modes and not proof of correctness.

One PR may complete the family or one bounded correction objective, but every merged state must be independently valid.

## Evidence-gated orchestration

Execute:

```text
isolated canonical-target research
→ canonical target lock
→ isolated current-state audit
→ material-component-contract synthesis
→ independent material-component-review (Review scope: contract-gate)
→ material-foundation when required
→ material-component-implementation
→ material-component-adoption when ownership change is in scope
→ independent material-component-review (Review scope: final-gate)
→ verification
→ next correction unit or family completion
```

Production edits are forbidden before the contract gate passes.

Only this skill chooses the next stage, synthesizes delegated results, writes workflow state or roadmap state, and decides whether to advance or stop. Internal stages and delegated agents do not invoke each other or update the roadmap.

## Delegated responsibility

Use delegated agents or fresh isolated sessions to prevent one context from authoring and approving its own assumptions.

Preferred read-only roles:

- `material-canonical-target`: official target and source conflicts before implementation inspection;
- `material-current-state-auditor`: exhaustive implementation and proof assessment after target lock;
- `material-contract-gate-reviewer`: pre-production independent gate;
- `material-final-reviewer`: independent complete-family and PR review.

Claude Code may use the project definitions in `.claude/agents/`. Codex may use separate agent threads or isolated worktrees for bounded independent work. When no delegation mechanism exists, use fresh isolated sessions with the same input restrictions. Do not weaken a gate.

Delegation rules:

- give one bounded responsibility, explicit allowed and forbidden inputs, and a required output;
- researchers and reviewers are read-only;
- pass scenarios and evidence, not preferred conclusions or implementation reasoning;
- parallelize only independent investigations;
- never use concurrent writers on the same owner or worktree;
- delegated agents never update README, roadmap, production, tests, stories, or snapshots;
- the orchestrator validates every returned claim and remains responsible for the decision;
- delegated agents do not delegate further.

## Workflow state

Require one current state block in the family README:

```text
MATERIAL WORKFLOW STATE
Family:
Mode:
Current objective:
Current stage: target | assessment | contract-review | foundation | implementation | adoption | final-review | verification
Canonical target status: draft | locked | reopened
Assessment status: not-started | complete | blocked
Contract review status: not-started | passed | failed
Current correction unit: none | <exact unit>
Implementation status: not-started | complete | blocked
Final review status: not-started | passed | failed
Operator visual status: not-required | required | accepted | rejected
Family alignment status: aligned | converging | blocked
Next gate:
Blocker: none | <exact blocker>
```

Every stage must leave this block, the detailed sections, and `docs/roadmap.md` mutually consistent. Stale or contradictory stage claims block progression.

## Canonical target and assessment

The canonical-target researcher receives repository rules, required scenarios, applicable platforms, and official-source access. It must not inspect the current component implementation, component tests, stories, snapshots, or prior family conclusions.

After the target is locked, the current-state auditor inspects the complete implementation and proof but cannot redefine the target.

The contract stage synthesizes both results. It must record source conflicts and platform applicability, classify every mandatory concern and dependency, classify existing proof, choose the highest-priority complete correction unit, and lock the correct proof lane.

A target is reopened when new evidence invalidates it. Do not silently amend canonical decisions during implementation.

## Mandatory concern coverage

The assessment cannot omit:

- API, defaults, invalid combinations, and attributes;
- native, keyboard, form, and event-propagation semantics;
- accessibility and platform adaptations;
- anatomy, DOM, target area, and unnecessary nodes;
- semantic and transient state, precedence, cancellation, interruption, and cleanup;
- tokens, routing, rendered properties, geometry, typography, RTL, responsive behavior, and text scaling;
- motion, rapid input, interruption, and reduced motion;
- project extensions;
- external Material component and generic foundation dependencies;
- owners, exports, consumers, aliases, and cleanup;
- unit, component, browser, visual, consumer, and verification proof.

Each category receives a classification or `not-applicable` with a reason.

## Classification and dependency rules

`confirmed-compliant` requires a resolved applicable requirement, matching implementation, correct ownership, faithful observable proof in the correct lane, and no unresolved contradicting source.

`project-extension` additionally requires a current Mioframe scenario, explicit owner, Material compatibility, valid dependencies, and separate proof. A known defect in the extension or dependency prevents completion.

Every imported shared dependency is classified as `canonical-material-dependency`, `temporary-legacy-material-dependency`, `project-extension-dependency`, or `generic-non-material-foundation`. Repeated use does not make a Material component generic foundation.

Existing proof is classified before reuse as canonical, compatibility-only, implementation-detail, legacy-defect preservation, or obsolete.

## Correction priority

Select the next unit in this order:

1. unresolved required source or platform decisions;
2. wrong family, dependency, or foundation ownership;
3. native semantics, event propagation, accessibility, and form behavior;
4. public API and invalid combinations;
5. state ownership;
6. anatomy and DOM;
7. token and rendered-property routing;
8. geometry, responsive behavior, typography, RTL, and text scaling;
9. motion and browser lifecycle;
10. project extensions;
11. adoption;
12. obsolete-owner removal.

A lower-priority improvement cannot bypass a higher-priority blocker affecting the same supported surface.

## Contract gate

Before implementation, run an independent review with `Review scope: contract-gate`.

The gate must validate target provenance, source conflicts, platform applicability, complete concern coverage, classifications, dependency ownership, correction priority, proof lane, compatibility impact, workflow-state consistency, and that production work did not precede approval.

Advance only on `Contract gate result: passed`.

## Implementation and final gate

Implementation changes only the approved correction unit. If evidence invalidates target, classification, ownership, dependency, correction order, or proof lane, return to contract and preserve unaffected work.

After implementation and any conditional adoption, run a different independent review context with `Review scope: final-gate`. It reviews the complete family and PR, not only the patch.

If the environment cannot provide independent review, stop with `independent review handoff required`.

## Review correction routing

Route findings to exactly one owner:

- target, source conflict, classification, dependency, supported surface, API contract, anatomy contract, state contract, decomposition, proof lane, compatibility, or correction priority → `material-component-contract`;
- production owners, DOM, behavior, token routing, rendered properties, motion, Storybook, or proof implementation → `material-component-implementation`;
- consumers, parallel ownership, stale references, compatibility residue, or cleanup → `material-component-adoption`.

Run the applicable independent gate again after corrections.

## Existing implementation policy

Treat current implementation as editable evidence, never as Material authority and never as disposable by default.

Preserve only independently confirmed owners. Correct misaligned owners in bounded units. Block or narrow unresolved surface. Remove obsolete owners after replacement. Rewrite only the smallest owner when its contract is predominantly wrong or incremental repair would add more workaround logic.

A fresh session resets reasoning, not valid repository progress.

## Stop conditions

Stop for an exact unresolved blocker in official evidence, platform applicability, required scenarios, ownership, dependency direction, public contract, foundation blast radius, proof ownership, missing independent context, repeated correction failure, verification, or required visual acceptance.

Do not select another family or continue with assumptions.

## Final result

Report family, mode, objective, workflow state, target and assessment result, source conflicts, classification changes, dependencies, correction units, proof lanes, preserved and replaced owners, foundation impact, consumers, adoption, contract-gate result, final-gate result, family alignment status, remaining gaps, operator visual status, final verification, and exact blocker or `none`.
