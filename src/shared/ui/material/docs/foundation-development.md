# Material foundation convergence workflow

This is the single workflow for real cross-family Material foundation contracts.

Foundation exists only when a current component or unavoidable Material/platform contract needs one family-agnostic owner and that owner is simpler than family-local substitutes.

## Ownership

Foundation may own:

- official reference/system tokens, theme roles, and real cross-family Mioframe system extensions;
- typography, shape, elevation, motion, state-layer, ripple, focus, symbols, overlay adapters, or platform bridges with current cross-family scenarios;
- shared accessibility, density, target-area, or adaptive contracts when a runtime owner is required.

Foundation does not own component tokens, family-private routes, component API/anatomy/state, product behavior, or generic browser mechanisms that already have a correct non-Material owner.

Foundation code does not import or name consuming families. Families map their semantics into narrow family-agnostic contracts.

## Sequence

```text
material-foundation
→ domain/task lock
→ concern plan
→ concern-scoped material-canonical-target when required
→ selected isolated audits:
   material-semantics-audit for public/lifecycle/consumer contracts
   material-token-audit for reference/system graph work
   material-web-audit for rendered/platform/motion behavior
→ domain contract synthesis
→ independent correction contract gate
→ one correction-unit implementation
→ affected-family validation and cleanup
→ independent correction final gate
→ return to calling component or complete standalone PR review
→ verification
```

Production edits are forbidden before the contract gate passes.

## Concern plan

Record domain, mode (`new-foundation`, `align-existing`, or `focused-correction`), objective, required cross-family scenarios, affected families, platforms, non-goals, actual PR base/head, and selected concern lanes.

Run only lanes affected by the objective and direct dependencies. A token-only correction does not require a full lifecycle or motion audit unless rendered behavior changes. A platform/motion correction does not require re-deriving unrelated token groups.

When invoked by `material-component`, foundation scope is limited to the exact approved prerequisite and returns control afterward.

## Target and evidence reuse

Use `material-canonical-target` only for claims affected by the objective or contradictory evidence. Existing implementation, tests, consumers, and reuse count do not define the target.

Locked claims outside the concern set remain locked. Do not repeatedly re-derive them without a contradiction.

Token presence does not prove runtime support. Platform guidance is not transferable without an explicit decision.

## Selected audits

Each selected role runs read-only in a separate context and reports only its concern lane.

- semantics: public/family-facing contract, lifecycle ownership, affected families, extensions, dependencies, and proof;
- token: reference/system/Mioframe-system taxonomy, location, graph direction, theme overrides, migration ownership, static/rendered proof;
- Web: rendered artifacts, CSS ownership, platform adaptation, motion lifecycle, browser and visual proof.

A role reports another-lane dependency to the orchestrator instead of absorbing it.

## Foundation contract

Synthesize only selected target/audit results. Confirm that foundation ownership is required now and that an existing family or generic owner is insufficient.

Select the smallest complete unit in this order:

1. unresolved required source/platform decision;
2. wrong foundation/family/generic ownership;
3. public or family-facing contract;
4. reference/system token naming, location, graph, and migration ownership;
5. deterministic state and precedence;
6. reactive/browser lifecycle;
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

Reference/system tokens live in foundation token files. Component tokens remain family-local. Official tokens do not depend on Mioframe extensions/private routes. Dependencies do not point upward or across families. Required references resolve without hidden fallbacks. Cycles and parallel active owners are forbidden.

Move a coherent group from the legacy owner in one valid correction. Do not introduce runtime token managers, registries, resolvers, or generators.

## Review budget

Contract and correction-final gates each allow one initial review and at most one substantive re-review. A second failure stops the workflow with consolidated blockers.

Mechanical documentation fixes do not trigger another full review. Do not restart complete source or affected-family research for wording, counts, or cross-references.

The same root architecture problem surviving two correction rounds requires architecture reconsideration.

## Implementation and proof

Implement one approved correction unit. Run only selected-lane checks and every materially distinct affected-family route.

- static/deterministic proof: names, locations, graph direction, cycles, mappings, bridges;
- browser proof: computed values, theme overrides, inheritance, lifecycle, cancellation, viewport/platform behavior;
- visual proof: screenshots only;
- affected-family proof: integration, compatibility, and blast radius.

Visible changes require official comparison and explicit operator status.

## Documentation

Create a foundation README only for a real contract. Store current target, owner, durable public/private contract, proof obligations, correction unit, and remaining gaps.

Do not store review history, shell transcripts, exact graph/route ledgers, repeated source narratives, file counts, or stage-by-stage diary text.

## Completion

A bounded foundation correction may complete while the domain remains `converging` only when the resulting repository/PR is valid and remaining gaps are explicit and non-blocking.

Completion requires valid ownership, applicable architecture guards, affected-family proof, cleanup of replaced owners, required operator acceptance, correction review, complete PR review when standalone, and final verification.

## Forbidden

- target and implementation assessment in one context;
- production edits before contract approval;
- full-domain audits for a bounded concern without contradictory evidence;
- same-context approval or more than one substantive re-review per gate;
- foundation justified only by duplication, reuse count, or hypothetical need;
- family tokens/private routes/API/anatomy/state in foundation;
- invented token names, upward/cyclic dependencies, parallel owners, or fallback-masked requirements;
- duplicate generic systems, unnecessary wrappers/DOM, full-domain rewrites, or knowingly broken intermediate states;
- durable audits, review histories, registries, checklists, scorecards, or progress ledgers.