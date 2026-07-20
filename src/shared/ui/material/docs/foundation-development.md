# Material foundation convergence workflow

This is the single workflow for real cross-family Material foundation contracts.

## Purpose

Foundation provides one accepted owner for behavior or rendering inherently shared by current Material families. It is not a universal framework built before components.

Create, expand, or correct a foundation only when a current component or unavoidable Material/platform contract requires it, the concern is family-agnostic, an existing owner is insufficient, shared ownership is simpler than family-local substitutes, and ownership, proof, affected families, and blast radius remain explicit.

A first component may justify foundation work only when the concern is already inherently cross-family and a family-local implementation would create the wrong owner.

## Foundation ownership

Foundation may own:

- official reference and system tokens, theme roles, and real cross-family Mioframe system extensions;
- centralized Material authoring units;
- typography, shape, elevation, and motion roles;
- generic interaction-state acquisition, state layer, ripple, and focus;
- Material Symbols rendering;
- Material-facing overlay adapters;
- shared accessibility, density, target-area, layout, or adaptive contracts when a real runtime owner is required.

Foundation does not own:

- component `--md-comp-*` or `--mio-comp-*` tokens;
- family-private `--md-private-<family>-*` routes;
- component API, anatomy, semantic state, invalid combinations, or state precedence;
- product workflow, placement, information architecture, or screen layout;
- behavior used by only one family without a proven cross-family contract;
- generic DOM, event, geometry, lifecycle, focus, teleport, or browser mechanisms that already have a correct non-Material owner.

Foundation code does not import or name consuming families. Families map their semantics and component tokens into narrow family-agnostic contracts.

All token work follows [`tokens.md`](./tokens.md). `src/shared/lib/md/tokens.css` is a temporary legacy owner; new canonical work must not add component tokens, private Web adaptations, or new token categories there.

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

The main foundation session is the sole orchestrator and writer. Use delegated agents or fresh isolated sessions for target research, current-state audit, contract review, and final review. Researchers and reviewers are read-only. Never use concurrent writers on the same owner or worktree.

## Task lock and workflow state

Lock one domain, mode (`new-foundation`, `align-existing`, or `focused-correction`), correction objective, required scenarios, affected families, applicable platforms, and non-goals.

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

Before target lock, inspect repository rules, required cross-family scenarios, applicable official Material sources, and unavoidable platform contracts. Existing implementation, tests, stories, snapshots, consumers, and prior conclusions must not determine the target.

Confirm that the concern belongs in foundation rather than a component family or an existing generic owner.

Record applicable platforms, public/private/testing/browser-adaptation contracts, deterministic behavior, reactive lifecycle, rendered output, exact token categories and names, motion, affected-family obligations, dependency direction, official sources, verification dates, and unresolved decisions.

For every contradiction, absence, inference, or platform-specific rule, use the source-decision format required by the component workflow.

Token presence does not prove a runtime contract. Token absence does not cancel explicit guidance. Android, iOS, and Web rules are not interchangeable without an explicit decision. Required unresolved decisions block dependent implementation.

## Current-state audit

After target lock, inspect and classify every applicable concern:

- current public, private, testing, and browser contracts;
- deterministic logic and normalization;
- reactive state and lifecycle;
- rendered artifacts, styles, tokens, and motion;
- token taxonomy, naming, location, dependency direction, cycles, unresolved references, and public/private surface;
- accessibility and platform adaptations;
- dependency direction and local substitutes;
- affected families and representative consumers;
- unit, bridge, browser, visual, consumer, and verification proof;
- exports, aliases, obsolete owners, and cleanup obligations.

Classify each concern as `confirmed-compliant`, `project-extension`, `misaligned`, `unresolved`, `obsolete`, or `not-applicable` with a reason.

`confirmed-compliant` requires resolved applicable authority, matching implementation, correct cross-family ownership, faithful proof in the correct lane, a valid token graph when applicable, and no unresolved contradiction.

A Web/platform adaptation or project extension additionally requires a current scenario, explicit owner, valid dependencies, no conflict with Material, and separate proof. A known defect prevents completion.

Passing tests, widespread reuse, stable snapshots, or generic naming do not establish correctness.

Classify dependencies as canonical Material, temporary legacy Material, project extension, or generic non-Material infrastructure. Classify existing proof as canonical, compatibility-only, implementation-detail, legacy-defect preservation, or obsolete.

## Token foundation contract

For a token-domain correction, audit the complete graph slice:

```text
reference source
→ reference token
→ system token or Mioframe system extension
→ affected component token routes
→ rendered proof
```

Requirements:

- exact official names remain exact;
- reference/system declarations live in canonical foundation token files;
- theme overrides change system roles, not component tokens;
- official tokens never depend on Mioframe extensions or private routes;
- component tokens stay family-local;
- private Web adaptations are not placed in reference/system token files;
- dependencies never point upward or across component families;
- required references resolve without fallback masking;
- cycles are forbidden;
- a coherent group moves from the legacy owner in one valid correction, without duplicate active declarations;
- affected families prove integration and computed behavior.

The domain README records semantic groups, public surface, theme behavior, dependency direction, migration state, proof obligations, and gaps. It does not copy every declaration or graph edge.

## Domain README and decomposition

Create `foundation/<domain>/README.md` only when a real runtime, public, private, testing, or correction contract exists. Do not pre-create domains or status records.

Map each responsibility to one owner with inputs, outputs, dependencies, observable contract, primary proof, and co-location rationale.

Reference tokens, system tokens/theme overrides, browser adaptations, rendered artifacts, lifecycle, motion, and testing bridges are separate owners when they have different reasons to change or proof. Do not split by line count or create a runtime token registry, manager, resolver, or generated abstraction without a current need.

## Correction priority

Select the highest-priority complete unit:

1. unresolved required source or platform decisions;
2. incorrect foundation, family, generic, or dependency ownership;
3. public or family-facing contract;
4. reference/system token naming, location, dependency graph, and migration ownership;
5. deterministic state and precedence;
6. reactive lifecycle and browser behavior;
7. rendered-property, style, and motion routing;
8. platform adaptations and project extensions;
9. affected-family adoption;
10. obsolete-owner removal.

Do not bypass a higher-priority blocker with an easier local improvement. Component styling or motion cannot rely on a known-invalid foundation token route.

Each unit records expected behavior, current defect, owner, dependencies, affected families, blast radius, proof lane, prepared failing observation, affected token graph, compatibility impact, visible impact, operator requirement, and completion condition.

Correct incrementally when ownership is sound. Replace only the smallest owner when repair would preserve wrong ownership or add workaround logic.

## Proof lanes

- deterministic/static proof: token naming, placement, graph direction, cycles, unresolved references, pure mappings, and public/private bridges;
- browser proof: computed token values, theme overrides, inheritance, focus, pointer, overlay, lifecycle, cancellation, viewport behavior, and platform adaptation;
- visual proof: screenshots only;
- affected-family or consumer proof: routing, integration, compatibility, and blast radius.

Visible changes require official comparison, baseline handling, and honest operator-acceptance status.

## Foundation contract gate

Before production, an independent read-only review validates target provenance, cross-family ownership, source decisions, complete assessment, token architecture, dependencies, correction priority, proof lane, failing observation, blast radius, workflow state, and absence of production edits before approval.

Implementation starts only after `Contract review status: passed`.

## Implementation and affected families

Implement exactly one approved correction unit. Target, classifications, ownership, dependencies, token graph, blast radius, and proof lane remain locked. New invalidating evidence returns work to contract.

Run the static token architecture guard for token changes. Validate every materially different affected-family route and representative consumer. A family proves its integration; the foundation proves the generic contract.

Remove local substitutes, obsolete owners, stale exports, or compatibility paths only when the objective replaces them and exactly one active owner remains.

## Final gate and completion

After implementation and cleanup, a different independent read-only context reviews the complete domain, token graph, affected families, proof, visible evidence, workflow state, and resulting patch.

A bounded correction may complete while the domain remains `converging` only when the repository is valid and remaining gaps are explicit and non-blocking.

Domain completion requires no required `misaligned`, `unresolved`, or `obsolete` concern, a passed token architecture guard where applicable, one owner per contract, no family-specific knowledge or local substitutes, required operator acceptance, independent final review, and final verification.

When invoked by `material-component`, return control to the component orchestrator. Do not update the component roadmap or start component implementation.

## Forbidden

- target and current-state assessment in one context;
- production edits before independent contract review;
- hidden source conflicts or platform assumptions;
- same-context final approval;
- foundation justified only by duplication, reuse count, or hypothetical future need;
- component tokens, family-private routes, API, anatomy, or state inside foundation;
- invented official-looking token names, upward/cyclic token dependencies, parallel token owners, or fallback-masked required references;
- runtime token registries, managers, generic resolvers, cross-family state machines, or duplicate theme/overlay/state/ripple/focus/icon/motion systems;
- wrong proof lanes or visible changes without operator handoff;
- accidental monoliths, mechanical fragmentation, unnecessary wrappers or DOM;
- full-domain rewrites without owner-level justification;
- knowingly broken intermediate states.
