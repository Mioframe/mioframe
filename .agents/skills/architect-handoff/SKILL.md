---
name: architect-handoff
description: 'Use this skill for non-trivial work that requires an explicit architecture decision. It defines the handoff contract linking architecture discussion, implementation preflight, coding, PR description, and final review. Skip only when a repository policy provides a deterministic standard-authoring path and all required decisions are source-resolved.'
---

# Architecture handoff

Use this skill before non-trivial implementation, workflow, shared UI, storage, diagnostics, Material, performance-sensitive, or cross-layer changes unless an applicable repository policy defines a deterministic standard-authoring path that resolves every required decision from authoritative sources.

The handoff is the implementation contract and must not be silently replaced during coding or review.

## When to use

Use this skill when the task changes or clarifies any of these and no deterministic repository path fully resolves them:

- product or feature behavior with multiple user scenarios;
- cross-layer ownership or FSD boundaries;
- shared UI primitives or consumer-visible blast radius;
- storage, service, worker, diagnostics, performance, or workflow contracts;
- Material patterns or UI composition with unresolved architecture consequences;
- task scope spanning more than one owner or requiring pass order;
- an escalation condition from a standard-authoring workflow.

## When it may be skipped

You may skip this skill for:

- typo, comment, or formatting-only edits;
- mechanical renames with no ownership or behavior change;
- docs-only edits that do not define or alter workflow contracts;
- narrow fixes where ownership, source of truth, final state, and verification are explicit and unchanged;
- work covered by an applicable deterministic standard-authoring policy when the agent can derive a ready repository-backed contract from authoritative sources and no escalation condition is present.

For official public Material component families, `material-component-authoring` owns that deterministic workflow and `component-architecture.md` owns its canonical blueprint. Use this handoff instead when the workflow reports `blocked` or the task explicitly uses `handoff-authoring`.

If you skip this skill, the implementation preflight must name the deterministic workflow, authoritative sources, ready contract, and reason no unresolved architecture decision remains.

## Token budget

Keep the handoff compact.

- Prefer short bullet points over prose.
- For small but non-trivial tasks, the handoff should usually fit in 20–40 lines.
- Do not expand stable repository rules, FSD explanations, Material rules, or testing policy unless directly relevant.
- Use `N/A` for genuinely inapplicable sections.
- Do not create a handoff when a deterministic policy already provides the complete implementation contract.

## Required handoff structure

Record:

- Goal
- Confirmed current behavior and repository evidence, or confirmed product requirement and source
- Non-goals
- Affected user scenarios
- Boundaries: what changes and what must not be touched
- Ownership matrix:
  - feature
  - entity
  - widget
  - page/pane
  - shared
  - service/worker
- Source of truth
- State shape
- Public API / entry points
- Minimum sufficient design:
  - simplest design satisfying required scenarios
  - behavior intentionally deferred or unsupported
  - unavoidable complexity and the current requirement justifying it
- Rejected approaches
- Shared UI blast radius
- Acceptance matrix
- Risk matrix
- Required test proof:
  - changed contracts or scenarios
  - required proof types from `docs/testing/architecture.md`
  - accessibility, browser, visual, data-safety, performance, release, and platform risks that apply
  - named metric/budget when the task makes a performance or optimization claim
  - whether mutation may be applicable
  - exact test/spec paths, measurements, and resolver changes are deferred to implementation preflight
- Required verification
- Forbidden
- Implementation readiness:
  - required product and architecture decisions resolved
  - dependencies, inputs, and agent-access boundaries explicit
  - unresolved blockers: `none` or concrete list
  - verdict: `ready` or `not ready`

Keep the handoff concrete. Prefer specific owners, preserved scenarios, and named entry points over generic architecture language. Acceptance criteria describe observable outcomes or invariants; implementation details appear only when they are approved architecture decisions.

Considering a risk does not require supporting it. Include behavior or non-functional guarantees only when required by a scenario, existing consumer, repository invariant, platform constraint, data-safety rule, or measured need.

## Stop conditions before implementation

Stop before production edits when:

- claimed current behavior is unconfirmed, or a new requirement lacks a confirmed source, unless the task is explicitly investigation;
- ownership, source of truth, or expected final state is unclear;
- an unresolved decision can change behavior, ownership, boundaries, state shape, public contracts, test proof, performance evidence, or verification;
- required dependencies, inputs, or agent-access boundaries are unclear or unavailable;
- shared UI would change only to patch one feature without blast-radius review;
- unrelated domains are combined without explicit pass order;
- the design adds abstractions, extension points, compatibility paths, stronger guarantees, recovery mechanisms, optimizations, test infrastructure, or benchmark infrastructure without a current requirement, consumer, invariant, platform constraint, or measured need;
- a narrower contract or fewer concepts satisfy the same acceptance criteria;
- implementation readiness is `not ready`;
- a deterministic standard-authoring workflow reports `blocked`.

When blocked, resolve the handoff first. Do not patch forward and expect review to reconcile architecture later.

## Implementation contract

- Treat the ready handoff as upstream input for tasking, preflight, coding, PR description, and review.
- When the skill is legitimately skipped, treat the repository-backed deterministic workflow and its ready contract as the equivalent implementation contract.
- Do not implement while the applicable contract is `not ready` or `blocked`.
- Do not ask the coding agent to resolve product, architecture, test-ownership, or performance-evidence decisions left open by the applicable contract.
- Restate only implementation-relevant decisions downstream.
- If new facts invalidate the contract, stop and update it before continuing.
- Do not silently replace rejected approaches, move ownership, expand boundaries, or weaken required proof.

## Review contract after implementation

Review the full implementation against the applicable handoff or deterministic workflow contract.

- Do not review only the latest fix or latest changed files.
- Check goal, non-goals, scenarios, ownership, dependency direction, state shape, API, public contracts, shared UI blast radius, test proof, performance evidence, verification, simplicity, proportionality, and future safety.
- Confirm every added concept is justified and nothing can be removed without losing an acceptance criterion or invariant.
- Confirm implementation preflight resolved exact `TEST IMPACT` and the resulting tests and measurements still match the changed contracts.
- Preserve unresolved findings in one consolidated list.
- If repeated rounds add concepts, protocols, branches, configuration, recovery paths, or abstractions, stop patching and simplify the architecture.
- If repeated rounds show ownership drift or mixed responsibilities, stop patching and redo the architecture decision.

## Output discipline

Keep the handoff concise but complete. It should create concrete implementation behavior rather than repeat generic process language.
