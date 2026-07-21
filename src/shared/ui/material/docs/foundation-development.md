# Material foundation convergence workflow

This is the canonical workflow for real cross-family Material foundation contracts.

Foundation exists only when a current component or unavoidable Material/platform contract needs one family-agnostic owner and that owner is simpler than family-local substitutes.

The coding agent owns technical discovery, architecture, implementation, proof, and continuation. Git operations and repository publication workflow are outside this workflow.

## Ownership

Foundation may own:

- official reference/system tokens, theme roles, and real cross-family Mioframe system extensions;
- typography, shape, elevation, motion, state-layer, ripple, focus, symbols, overlay adapters, or platform bridges with current cross-family scenarios;
- shared accessibility, density, target-area, or adaptive contracts when a runtime owner is required.

Foundation does not own component tokens, another component family's tokens/API/anatomy/state, family-private routes, product behavior, or generic browser mechanisms that already have a correct non-Material owner.

Foundation code does not import or name consuming families. Families map their semantics into narrow family-agnostic contracts.

## Portable execution model

Policy lives in scoped `AGENTS.md`, portable `.agents/skills`, this document, and the owning foundation README. Tool-specific configuration is not a policy owner.

Use the foundation orchestrator context for orientation, contract synthesis, implementation, affected-family adoption, state updates, and continuation. Use isolated read-only contexts for verbose source research, concern audits, and independent review when the runtime supports them; otherwise execute the same portable skills sequentially with bounded inputs.

## Sequence

```text
material-foundation
→ resume or initialize domain state
→ one bounded domain orientation
→ concern plan
→ concern-scoped material-canonical-target when required
→ selected audits
   - material-semantics-audit
   - material-token-audit
   - material-web-audit
→ domain contract synthesis
→ independent correction contract gate
→ one complete correction or delegated prerequisite unit
→ affected-family validation and legacy-owner cleanup or forwarding
→ independent correction-final gate
→ update affected state only
→ continue next required unit or return to calling component
→ final verification
```

Production edits are forbidden before the contract gate passes.

## Domain orientation

Record one concise map:

```text
FOUNDATION ORIENTATION
Domain:
Mode: new-foundation | align-existing | focused-correction
Current owner:
Legacy or missing owners:
Public/family-facing contract:
Foundation files:
Affected families:
Direct dependencies:
Proof owners:
Locked target claims:
Known unresolved concerns:
```

Read applicable instructions and Material documents, then the owning README, implementation, direct dependencies, affected-family integration, and proof. Expand repository search only for a named dependency or ownership question.

Do not rebuild complete orientation after each correction. Refresh only invalidated facts.

## Concern plan

Record domain, mode, objective, exact required family-agnostic contract, current legacy or missing owner, required cross-family scenarios, affected families, platforms, non-goals, completion condition, and selected concern lanes.

Run only lanes affected by the objective and direct dependencies. A token-only correction does not require a complete lifecycle or motion audit unless rendered behavior changes. A platform or motion correction does not require re-deriving unrelated token groups.

When invoked by `material-component`, foundation scope is limited to the exact required prerequisite and returns control afterward. The calling component does not continue until the prerequisite is complete.

## Target and evidence reuse

Use `material-canonical-target` only for claims affected by the objective or contradictory evidence. Existing implementation, tests, consumers, and reuse count do not define the target.

Locked claims outside the concern set remain locked until source, implementation, proof, reviewer, or operator evidence contradicts them. A new session or correction unit does not invalidate accepted facts.

Token presence does not prove runtime support. Platform guidance is not transferable without an explicit decision.

## Selected audits

Each selected audit runs read-only and reports only its concern lane:

- semantics: public/family-facing contract, lifecycle ownership, affected families, extensions, dependencies, and proof;
- token: reference/system/Mioframe-system taxonomy, location, graph direction, theme overrides, migration ownership, static and rendered proof;
- Web: rendered artifacts, CSS ownership, platform adaptation, motion lifecycle, browser and visual proof.

A role reports another-lane dependency to the orchestrator instead of absorbing it.

## Foundation contract

Synthesize only selected target/audit results. Confirm that foundation ownership is required now and that an existing family or generic owner is insufficient.

Another official Material component family is not foundation. A dependency on Progress Indicator requires a ready Progress Indicator public contract or deferral/removal of the dependent extension.

Select the smallest complete unit in this order:

1. unresolved required source or platform decision;
2. wrong foundation, family, or generic ownership;
3. public or family-facing contract;
4. reference/system token naming, location, graph, and migration ownership;
5. deterministic state and precedence;
6. reactive or browser lifecycle;
7. rendered-property, style, and motion routing;
8. platform adaptation or project extension;
9. affected-family adoption;
10. obsolete-owner removal.

Do not bypass a higher-priority blocker affecting the same cross-family contract.

## Token foundation rules

For token work follow `tokens.md`:

```text
reference source
→ reference token
→ system token or Mioframe system extension
→ family-local component token
→ rendered proof
```

Reference/system tokens live in foundation token files. Component tokens remain family-local. Official tokens do not depend on Mioframe extensions or private routes. Dependencies do not point upward or across families. Required references resolve without hidden fallbacks. Cycles and parallel active owners are forbidden.

Move the smallest coherent required group from the legacy owner in one valid correction. Do not introduce runtime token managers, registries, resolvers, or generators.

## Behavior foundation rules

For state layer, ripple, motion adaptation, focus, symbols, or another shared Material behavior:

- define one narrow family-agnostic contract;
- move or replace the full behavior required by the current scenarios;
- update affected families to the canonical contract;
- retain a legacy entry point only as a forwarding compatibility path when other consumers still need it;
- remove parallel behavior ownership;
- prove affected families through public inputs.

A legacy path that still contains its own implementation is not forwarding-only.

## Review budget

Contract and correction-final gates each allow one initial review and at most one substantive re-review. A second failure stops with consolidated blockers.

Mechanical documentation fixes do not trigger another full review. Do not restart complete source or affected-family research for wording, counts, or cross-references.

The same root architecture problem surviving two correction rounds requires architecture reconsideration.

## Implementation and proof

Implement one approved correction unit using the locked concern contracts. Do not rerun specialist audits unless new contradictory evidence reopens a lane.

- static/deterministic proof: names, locations, graph direction, cycles, mappings, bridges, and single-owner replacement;
- browser proof: computed values, theme overrides, inheritance, lifecycle, cancellation, viewport, and platform behavior;
- visual proof: screenshots and official comparison only;
- affected-family proof: integration, compatibility, and blast radius;
- architecture proof: applicable repository guards.

Visible changes require explicit operator comparison.

## Convergence and delegated completion

After each accepted correction, update only affected state and select the next required unit without restarting complete orientation or accepted audits.

A delegated prerequisite is complete only when:

- the canonical foundation owner owns the whole required contract;
- the calling component can consume it without a private or legacy import;
- replaced declarations or behavior have one active owner;
- any retained legacy entry point only forwards to the canonical owner;
- affected-family proof and applicable architecture guards pass;
- no known defect remains in the required contract.

Otherwise return blocked. Track nested prerequisites and stop on a dependency cycle with the exact chain.

## Documentation

Create a foundation README only for a real contract. Store current target, owner, durable public/private contract, proof obligations, current correction, calling-family requirement, and remaining gaps.

Do not store review history, shell transcripts, exact graph or route ledgers, repeated source narratives, file counts, or stage diaries.

## Completion

A bounded correction may complete while the wider domain remains `converging` only when remaining gaps do not affect the required contract.

Domain completion requires valid ownership, canonical affected-family consumption, applicable architecture guards, affected-family proof, cleanup or forwarding-only replacement of legacy owners, required operator comparison, correction review, and final verification.

## Forbidden

- target and implementation assessment in one context;
- production edits before contract approval;
- full-domain audits for a bounded concern without contradictory evidence;
- repeated accepted audits without contradiction;
- same-context approval or more than one substantive re-review per gate;
- foundation justified only by duplication, reuse count, or hypothetical need;
- another component family's tokens, private routes, API, anatomy, or state in foundation;
- invented token names, upward or cyclic dependencies, parallel owners, or fallback-masked requirements;
- returning a delegated prerequisite complete while the calling family still uses the required legacy owner;
- duplicate generic systems, unnecessary wrappers or DOM, full-domain rewrites, or knowingly broken intermediate states;
- Git, branch, commit, pull-request, or merge operations;
- durable audits, histories, registries, checklists, scorecards, or progress ledgers.
