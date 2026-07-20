# Material foundation convergence workflow

This is the single workflow for real cross-family Material foundation contracts.

## Purpose

Foundation provides one accepted owner for behavior or rendering inherently shared by current Material families. It is not a universal framework built before components.

Create, expand, or correct a foundation only when:

- a current component or unavoidable Material/platform contract requires it;
- the concern is family-agnostic;
- an existing generic or Material owner is insufficient;
- shared ownership is simpler than family-local substitutes;
- ownership, proof, affected families, and blast radius remain explicit.

A first component may justify foundation work only when the concern is already inherently cross-family and a family-local implementation would create the wrong owner.

## Foundation ownership

Foundation may own:

- reference and system tokens and theme roles;
- centralized Material authoring units;
- typography, shape, elevation, and motion roles;
- generic interaction-state acquisition, state layer, ripple, and focus;
- Material Symbols rendering;
- Material-facing overlay adapters;
- shared accessibility, density, target-area, layout, or adaptive contracts when a real runtime owner is required.

Foundation does not own:

- component `--md-comp-*` tokens;
- component API, anatomy, semantic state, invalid combinations, or state precedence;
- product workflow, placement, information architecture, or screen layout;
- behavior used by only one family without a proven cross-family contract;
- generic DOM, event, geometry, lifecycle, focus, teleport, or browser mechanisms that already have a correct non-Material owner.

Foundation code does not import or name consuming families. Families map their semantics and component tokens into narrow family-agnostic contracts.

## Evidence-gated workflow

```text
material-foundation
→ task lock
→ isolated canonical foundation target
→ target lock
→ isolated current-state audit
→ domain contract synthesis
→ independent foundation contract gate
→ one correction-unit implementation
→ affected family and consumer validation
→ conditional cleanup
→ independent final gate
→ verification
```

Production edits are forbidden until the foundation contract gate passes.

The main foundation session is the sole orchestrator and writer. Use delegated agents or fresh isolated sessions for target research, current-state audit, contract review, and final review. Researchers and reviewers are read-only.

Do not use concurrent writers on the same owner or worktree. Pass scenarios and evidence to reviewers, not preferred conclusions or implementation reasoning. When delegated agents are unavailable, use fresh isolated sessions without weakening either gate.

## Task lock and workflow state

Lock one domain, mode (`new-foundation`, `align-existing`, or `focused-correction`), correction objective, required scenarios, affected families, applicable platforms, non-goals, current stage, and next gate.

Use `align-existing` whenever an owner already exists. Relocation, additive capability, replacement, and cleanup are actions, not modes or proof.

The domain README begins with:

```text
MATERIAL FOUNDATION WORKFLOW STATE
Domain:
Mode:
Current objective:
Current stage: target | assessment | contract-review | implementation | final-review | verification
Canonical target status: draft | locked | reopened
Assessment status: not-started | complete | blocked
Contract review status: not-started | passed | failed
Current correction unit: none | <exact unit>
Implementation status: not-started | complete | blocked
Final review status: not-started | passed | failed
Operator visual status: not-required | required | accepted | rejected
Domain alignment status: aligned | converging | blocked
Next gate:
Blocker: none | <exact blocker>
```

Workflow state and detailed README sections must agree. Stale or contradictory state blocks progression.

## Canonical foundation target

Before target lock, inspect repository rules, required cross-family scenarios, applicable official Material sources, and unavoidable platform contracts. Existing foundation implementation, tests, stories, snapshots, current consumers, and prior conclusions must not determine the target.

Confirm that the concern belongs in foundation rather than a component family or an existing generic owner.

Record:

- applicable platforms;
- public, private bridge, testing-only, and browser-adaptation contracts;
- deterministic behavior and reactive lifecycle;
- rendered output, styles, tokens, and motion;
- affected family obligations;
- dependency direction;
- official sources and verification dates;
- unresolved decisions.

For every contradiction, absence, inference, or platform-specific rule, use the same source-decision format required by the component workflow.

Token presence does not prove a runtime contract. Token absence does not automatically cancel explicit guidance. Android, iOS, and Web rules are not interchangeable without an explicit decision.

Required unresolved decisions block dependent implementation. New evidence reopens the target.

## Current-state audit

After target lock, inspect and classify every applicable concern:

- current public, private, testing, and browser contracts;
- deterministic logic and normalization;
- reactive state and lifecycle;
- rendered artifacts, styles, tokens, and motion;
- accessibility and platform adaptations;
- dependency direction and local substitutes;
- affected families and representative consumers;
- unit, bridge, browser, visual, consumer, and verification proof;
- exports, aliases, obsolete owners, and cleanup obligations.

Classify each concern as `confirmed-compliant`, `project-extension`, `misaligned`, `unresolved`, `obsolete`, or `not-applicable` with a reason.

`confirmed-compliant` requires resolved applicable authority, matching implementation, correct cross-family ownership, faithful proof in the correct lane, and no unresolved contradiction.

A Web/platform adaptation or project extension additionally requires a current scenario, explicit owner, valid dependencies, no conflict with Material, and separate proof. A known defect prevents completion.

Passing tests, widespread reuse, stable snapshots, or generic naming do not establish correctness.

Classify dependencies as canonical Material, temporary legacy Material, project extension, or generic non-Material infrastructure. Existing popularity does not prove ownership.

Classify existing proof as canonical, compatibility-only, implementation-detail, legacy-defect preservation, or obsolete.

## Domain README and decomposition

Create `foundation/<domain>/README.md` only when a real runtime, public, private, testing, or correction contract exists. Do not pre-create domains or status records.

The README contains the workflow state, target and source decisions, current-state alignment map, dependency classifications, affected families, decomposition, proof map, correction units, compatibility impact, remaining gaps, and completion state.

Map each responsibility to one owner with inputs, outputs, dependencies, observable contract, primary proof, and co-location rationale.

Keep deterministic logic, reactive lifecycle, rendered artifacts, styles, motion, browser adapters, and testing bridges separate when they have different reasons to change or proof owners. Do not split by line count, preserve a monolith by habit, or add wrappers and DOM merely for separation.

## Correction priority

Select the highest-priority complete unit:

1. unresolved required source or platform decisions;
2. incorrect foundation, family, generic, or dependency ownership;
3. public or family-facing contract;
4. deterministic state and precedence;
5. reactive lifecycle and browser behavior;
6. rendered-property, token, style, and motion routing;
7. platform adaptations and project extensions;
8. affected-family adoption;
9. obsolete-owner removal.

Do not bypass a higher-priority blocker with an easier local improvement.

Each unit records expected behavior, current defect, owner, dependencies, affected families, blast radius, proof lane, prepared failing observation, compatibility impact, visible impact, operator requirement, and completion condition.

Correct incrementally when ownership is sound. Replace only the smallest owner when repair would preserve wrong ownership or add more workaround logic.

## Proof lanes

- deterministic or bridge proof: pure contracts, mappings, state precedence, and public/private bridges;
- browser proof: focus, pointer, overlay, lifecycle, cancellation, viewport behavior, computed roles, and platform adaptation;
- visual proof: screenshots only;
- affected-family or consumer proof: routing, integration, compatibility, and blast radius.

Visual specs do not contain browser-behavior success criteria or large computed-style matrices. Visible changes require official comparison, baseline handling, and honest operator-acceptance status.

## Foundation contract gate

Before production, run an independent read-only review from a fresh context.

It validates:

- target provenance and platform applicability;
- proof that the concern is truly cross-family;
- source conflicts and unresolved decisions;
- complete current-state coverage;
- ownership and dependency classifications;
- selected correction priority and blast radius;
- proof lane and prepared failing observation;
- workflow-state consistency;
- absence of production edits for the unit before approval.

Implementation starts only after `Contract review status: passed`.

## Implementation and affected families

Implement exactly one approved correction unit. Target, classifications, ownership, dependencies, blast radius, and proof lane remain locked.

When new evidence invalidates them, return to contract and preserve unaffected confirmed work.

Validate every materially different affected-family route and representative consumer. A family proves its integration; the foundation proves generic behavior.

Remove local substitutes, obsolete owners, stale exports, or compatibility paths only when the current objective replaces them and exactly one active owner remains.

## Final gate and completion

After implementation and cleanup, run a different independent read-only final review. It reviews the complete domain, all affected families, proof, visible evidence, workflow state, and resulting patch.

A bounded correction may complete while the domain remains `converging` only when the repository is valid and remaining gaps are explicit and non-blocking.

Domain completion requires no required `misaligned`, `unresolved`, or `obsolete` concern, one owner per contract, no family-specific knowledge or local substitutes, required operator acceptance, independent final review, and final verification.

When invoked by `material-component`, return the result format defined by `material-foundation` and return control to the component orchestrator. Do not update the component roadmap or start component implementation.

## Forbidden

- target and current-state assessment in one unisolated reasoning pass;
- production edits before independent contract review;
- hidden source conflicts or platform assumptions;
- same-context final approval;
- foundation justified only by duplication, reuse count, or hypothetical future need;
- component-specific tokens, API, anatomy, or state inside foundation;
- universal bases, runtime registries, generic resolvers, cross-family state machines, or duplicate theme/overlay/state/ripple/focus/icon/motion systems;
- wrong proof lanes or visible changes without operator handoff;
- accidental monoliths, mechanical fragmentation, unnecessary wrappers or DOM;
- full-domain rewrites without owner-level justification;
- knowingly broken intermediate states.
