# Material component convergence workflow

This is the only implementation workflow for an official public Material component family.

It improves new, partially correct, or badly misaligned implementations without treating legacy code as authority and without requiring full-family rewrites. Correct owners remain; wrong owners converge through bounded complete corrections.

## Workflow

```text
material-component
→ task lock
→ isolated canonical-target research
→ canonical target lock
→ isolated current-state audit
→ contract synthesis
→ independent contract-gate review
→ material-foundation when required
→ one correction-unit implementation
→ affected consumer and visual validation
→ conditional adoption
→ independent final-gate review
→ verification
→ next correction unit or family completion
```

Production edits are forbidden until the contract gate passes.

`material-component` is the only orchestrator. It owns synthesis, stage transitions, family README and roadmap updates, and the decision to advance or stop. Internal stages and delegated agents do not invoke each other.

## Responsibility isolation

Use delegated agents or fresh isolated sessions for:

- canonical target research before implementation inspection;
- current-state audit after target lock;
- independent contract review before production;
- independent final review after implementation.

Researchers and reviewers are read-only. Pass scenarios and evidence, not preferred conclusions or implementation reasoning. Parallelize only independent investigations. Never use concurrent writers on the same owner or worktree.

Claude Code project roles live under `.claude/agents/`. Codex may use separate agent threads or isolated worktrees. When delegation is unavailable, use fresh isolated sessions without weakening gates.

## Task and workflow state

Lock one family, mode (`new-component`, `align-existing`, or `focused-correction`), objective, required scenarios, applicable platforms, non-goals, current stage, and next gate.

Existing families use `align-existing`. Relocation, API preservation, decomposition, adoption, and cleanup are actions, not modes or proof.

The family README begins with one coherent state block:

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

Workflow state, detailed README sections, and roadmap must agree. Stale or contradictory state blocks progression.

## Canonical target

Before target lock, inspect only repository rules, required scenarios, applicable consumers as scenario evidence, and official Material sources. Existing component API, DOM, CSS, tests, stories, snapshots, and prior conclusions must not determine the target.

Record supported and unsupported surface, public semantics, anatomy, state, tokens, rendered properties, motion, accessibility, platforms, dependencies, and source dates.

Every contradiction, absence, inference, and platform-specific statement receives a source decision:

```text
SOURCE DECISION
Concern:
Applicable platform:
Source A and statement:
Source B and statement:
Conflict or missing evidence:
Narrower applicable authority:
Decision:
Rationale:
Status: resolved | unresolved
```

Explicit guidance is not cancelled only because a token is absent. Token presence alone does not prove support. Android, iOS, and Web guidance are not interchangeable without an explicit decision. Required unresolved decisions block dependent corrections. New evidence reopens the target.

## Current-state assessment

After target lock, assess every category or mark it `not-applicable` with a reason:

- API, defaults, invalid combinations, and attributes;
- native, keyboard, form, and event-propagation semantics;
- accessibility and platform adaptations;
- anatomy, DOM, target area, and unnecessary nodes;
- semantic and transient state, precedence, interruption, cancellation, and cleanup;
- token declarations, configuration, state routing, rendered properties, and public overrides;
- geometry, typography, icon placement, RTL, responsive behavior, and text scaling;
- motion, rapid input, interruption, and reduced motion;
- project extensions;
- external Material and generic foundation dependencies;
- owners, exports, consumers, aliases, and cleanup;
- unit, component, browser, visual, consumer, and verification proof.

Classify each concern as `confirmed-compliant`, `project-extension`, `misaligned`, `unresolved`, `obsolete`, or `not-applicable`.

`confirmed-compliant` requires resolved applicable authority, matching implementation, correct ownership, faithful proof in the correct lane, and no unresolved contradiction.

`project-extension` additionally requires a current Mioframe scenario, explicit owner, Material compatibility, valid dependencies, and separate proof. A known defect prevents completion.

Classify proof as canonical, compatibility-only, implementation-detail, legacy-defect preservation, or obsolete. Existing tests, stories, snapshots, consumers, and green CI are evidence only.

Classify each dependency as canonical Material, temporary legacy Material, project extension, or generic non-Material foundation. Repeated use does not make a Material component generic foundation.

## Decomposition and correction units

Map each concern to one owner with inputs, outputs, dependencies, observable contract, primary proof, and co-location rationale. Split by ownership and proof, not line count. Do not retain monoliths by default or add wrappers and DOM merely for separation.

Correction priority is:

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

Do not bypass a higher-priority blocker with an easier local improvement.

Each correction unit records expected behavior, current defect, owner, dependencies, blast radius, proof lane, prepared failing observation, compatibility impact, visible impact, operator requirement, and completion condition.

Rewrite only the smallest owner when incremental repair would preserve wrong ownership or add more workaround logic.

## Proof lanes

- unit/component proof: deterministic API, normalization, native attributes, state precedence, and non-browser wiring;
- browser proof: layout, focus, keyboard, form behavior, propagation, pointer/touch, target area, responsive behavior, platform behavior, and motion lifecycle;
- visual proof: screenshots only;
- consumer proof: integration and compatibility.

Visual specs do not contain behavior success criteria or large computed-style assertion matrices. Visible changes require official comparison, baseline handling, and honest operator-acceptance status.

## Contract gate

After contract synthesis, run `material-component-review` with `Review scope: contract-gate` from a fresh read-only context.

It validates target provenance, source decisions, platform applicability, complete concern coverage, classifications, dependencies, correction priority, proof lane, compatibility, workflow state, and that production work did not precede the gate.

Implementation starts only after `Contract review status: passed`.

## Implementation and adoption

Implement exactly one approved correction unit. The target, classifications, dependencies, priority, owner, proof lane, and compatibility decision remain locked. New invalidating evidence returns work to contract while preserving unaffected confirmed work.

Validate affected browser behavior and representative consumers. Handle visual evidence and operator handoff when required.

Adoption runs only when ownership, public-entry migration, or obsolete-owner removal is in scope and moved consumers receive a ready canonical contract. Do not maintain parallel active owners or migrate consumers onto misaligned surface.

## Final gate and completion

After implementation and conditional adoption, run `material-component-review` with `Review scope: final-gate` from a different fresh read-only context.

Review the complete family and resulting PR. Determine separately whether the correction objective is mergeable and whether the family is `aligned`, `converging`, or `blocked`.

A bounded correction may merge while the family remains `converging` only when the repository is fully valid and remaining gaps are explicit and non-blocking.

Family completion requires no required `misaligned`, `unresolved`, or `obsolete` concern, one canonical owner, required consumers on that owner, required operator acceptance, and final verification.

## Recovery

New evidence returns work to the owning stage. A fresh session resets reasoning, not repository progress. Hidden source conflicts, omitted concerns, wrong proof lanes, stale workflow state, same-context self-review, or two repeated ineffective correction rounds are workflow defects and block progression.

Do not create duplicate contracts, durable audits, registries, scorecards, or progress ledgers.
