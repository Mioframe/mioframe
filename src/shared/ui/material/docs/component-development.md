# Material component convergence workflow

This is the single canonical workflow for an official public Material component family.

It improves new, partially correct, or badly misaligned implementations without treating legacy code as authority and without requiring full-family rewrites. Correct owners remain; wrong owners converge through bounded complete corrections.

## Sequence

```text
material-component
→ task lock
→ isolated material-canonical-target
→ target lock
→ isolated material-current-state-audit
→ material-component-contract
→ independent contract-gate review
→ material-foundation when required
→ one material-component-implementation correction unit
→ affected consumer and visual validation
→ conditional material-component-adoption
→ independent final-gate review
→ verification
→ next correction unit or family completion
```

Production edits are forbidden until the contract gate passes.

`material-component` is the only orchestrator. It owns synthesis, stage transitions, family README and roadmap writes, and the decision to advance or stop. Internal roles and stages do not invoke each other.

## Cross-agent isolation

Reusable role procedures are portable Agent Skills under `.agents/skills`. Claude Code may execute them through thin `.claude/agents` adapters with tool restrictions and skill preloading. Codex may execute the same skills in separate agent threads or isolated worktrees.

Use isolated read-only contexts for:

- canonical target research before implementation inspection;
- current-state audit after target lock;
- contract review before production;
- final review after implementation.

Pass bounded scope, scenarios, platforms, repository ref, applicable instructions, and required result format. Do not pass preferred conclusions or implementation reasoning to reviewers. Never use concurrent writers on the same owner or worktree.

## Task and workflow state

Lock one family, mode (`new-component`, `align-existing`, or `focused-correction`), objective, required scenarios, applicable platforms, and non-goals.

Existing families use `align-existing`. Relocation, API preservation, decomposition, adoption, and cleanup are actions, not modes or proof.

The owning README begins with:

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

Run `material-canonical-target` before current component implementation, component tests, stories, snapshots, or prior family conclusions can determine the target.

Record supported and unsupported surface, public semantics, invalid combinations, anatomy, state, accessibility, tokens, rendered properties, motion, adaptive behavior, platforms, dependencies, source names, and verification dates.

Every contradiction, absence, inference, or platform-specific statement receives:

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

Token presence does not prove support. Token absence does not cancel explicit guidance. Android, iOS, and Web rules are not interchangeable without an explicit decision. Required unresolved decisions block dependent work. New evidence reopens the target.

## Current-state assessment

After target lock, run `material-current-state-audit` against the complete current and previous ownership.

Every applicable concern is classified as `confirmed-compliant`, `project-extension`, `misaligned`, `unresolved`, `obsolete`, or `not-applicable` with a reason. Mandatory concerns are:

- API, defaults, invalid combinations, and attributes;
- native, keyboard, form, event-propagation, and accessibility semantics;
- anatomy, DOM, target area, and unnecessary nodes;
- semantic and transient state, precedence, interruption, cancellation, and cleanup;
- token, configuration, state, and rendered-property routing;
- geometry, typography, icon placement, RTL, responsive behavior, and text scaling;
- motion implementation and browser lifecycle;
- project extensions;
- Material and generic dependencies;
- owners, exports, consumers, aliases, and obsolete paths;
- unit, component, browser, visual, consumer, and verification evidence.

`confirmed-compliant` requires resolved applicable authority, matching implementation, correct ownership, faithful proof in the correct lane, and no unresolved contradiction.

`project-extension` additionally requires a current Mioframe scenario, explicit owner, Material compatibility, valid dependencies, and separate proof. A known defect prevents completion.

Classify proof as canonical, compatibility-only, implementation-detail, legacy-defect preservation, or obsolete. Existing tests, stories, snapshots, consumers, names, and green CI are evidence only.

Classify each dependency as canonical Material, temporary legacy Material, project extension, or generic non-Material foundation.

## Motion implementation audit

The current-state auditor, implementation stage, and final reviewer independently scan the complete family and directly owned dependencies for all CSS transitions and animations, keyframes, WAAPI or JS animation routes, frames, timers, classes, completion listeners, `will-change`, motion custom properties, and reduced-motion overrides.

The stage result reports each discovered route with its location, owner, target, trigger, animated properties or keyframes, timing, token route, initial and final values, interruption/reversal/cancellation/cleanup, reduced-motion result, performance risk, proof, and classification.

The owning README records only the durable motion contract:

- supported state edges and required visible result;
- owning element or runtime concern;
- official timing/easing or documented platform decision;
- interruption, reversal, cancellation, cleanup, and reduced-motion semantics;
- proof owner;
- alignment classification and unresolved gaps.

Do not copy exact selectors, declarations, keyframe references, or runtime route lists into the README. Code remains the implementation record; each audit reconstructs the exact inventory.

Reject or classify as misaligned:

- `transition: all`;
- declared tokens that do not drive rendered motion;
- unused or unreachable keyframes;
- declarations on the wrong rendered owner or shadowed by cascade;
- shorthand resets or duplicate conflicting declarations;
- unstable initial/final values;
- undefined rapid-input, interruption, reversal, cancellation, disable, or unmount behavior;
- stale classes, listeners, timers, frames, or WAAPI animations;
- reduced-motion behavior that loses the final state or preserves unnecessary long motion;
- layout/paint-heavy animation without a required visual contract and bounded performance reasoning;
- broad or permanent `will-change` without evidence;
- proof that only asserts token, declaration, keyframe text, snapshots, or framework/browser internals.

Static proof may protect exact token-to-declaration routing. User-visible acquisition, completion, interruption, reversal, cancellation, and reduced-motion lifecycle require browser proof through public input.

## Decomposition and correction units

Map each concern to one owner with inputs, outputs, dependencies, observable contract, primary proof, and co-location rationale. Split by ownership and proof, not line count. Do not retain monoliths by habit or add wrappers and DOM merely for separation.

Correction priority is:

1. unresolved required source or platform decisions;
2. wrong family, dependency, or foundation ownership;
3. native semantics, event propagation, accessibility, and form behavior;
4. public API and invalid combinations;
5. state ownership;
6. anatomy and DOM;
7. token and rendered-property routing;
8. geometry, responsive behavior, typography, RTL, and text scaling;
9. motion implementation and browser lifecycle;
10. project extensions;
11. adoption;
12. obsolete-owner removal.

Do not bypass a higher-priority blocker with an easier local improvement.

Each correction unit records expected behavior, current defect, owner, dependencies, blast radius, proof lane, prepared failing observation, affected motion contract, compatibility impact, visible impact, operator requirement, and completion condition.

Rewrite only the smallest owner when incremental repair would preserve wrong ownership or add more workaround logic.

## Proof lanes

- unit/component proof: deterministic API, normalization, native attributes, state precedence, non-browser wiring, and narrow token routing;
- browser proof: layout, focus, keyboard, form behavior, propagation, pointer/touch, target area, responsive behavior, animation lifecycle, and reduced motion;
- visual proof: screenshots only;
- consumer proof: integration and compatibility.

Visual specs do not contain behavior success criteria or large computed-style matrices. Visible changes require official comparison, baseline handling, and honest operator-acceptance status.

## Gates

The contract gate independently validates target provenance, source decisions, platform applicability, concern coverage, classifications, dependencies, correction priority, proof lane, compatibility, motion-audit completeness, workflow state, and that production work did not precede approval.

Implementation executes exactly one approved correction unit. New invalidating evidence returns work to contract while preserving unaffected confirmed work.

Adoption runs only when ownership, public-entry migration, or obsolete-owner removal is in scope and every moved consumer receives a ready contract.

The final gate reviews the complete family and resulting PR, independently reconstructs the motion code inventory, and determines separately whether the correction objective is mergeable and whether the family is `aligned`, `converging`, or `blocked`.

## Completion and recovery

A bounded correction may merge while the family remains `converging` only when the repository is independently valid and remaining gaps are explicit, non-blocking, and outside the objective.

Family completion requires no required `misaligned`, `unresolved`, or `obsolete` concern, a passed motion audit, one canonical owner, required consumers on that owner, required operator acceptance, independent final review, and final verification.

New evidence returns work to the owning stage. A fresh isolated context resets reasoning, not confirmed repository progress. Hidden source conflicts, omitted concerns or motion routes, wrong proof lanes, stale workflow state, same-context self-review, or repeated ineffective correction rounds block progression.

Do not create duplicate contracts, durable audits, registries, scorecards, checklists, or progress ledgers.