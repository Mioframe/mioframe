---
name: architect-handoff
description: 'Use this skill for non-trivial work to define the architecture handoff contract that links architecture discussion, agent tasks, implementation preflight, implementation, PR description, and final review.'
---

# Architecture handoff

Use this skill before non-trivial implementation, workflow, shared UI, storage, diagnostics, Material, or cross-layer changes. The handoff is the implementation contract and must not be silently replaced by a different architecture during coding or review.

## When to use

Use this skill when the task changes or clarifies any of these:

- product or feature behavior with multiple user scenarios;
- cross-layer ownership or FSD boundaries;
- shared UI primitives or consumer-visible blast radius;
- storage, service, worker, diagnostics, or workflow contracts;
- Material patterns or UI composition with architecture consequences;
- task scope that spans more than one owner or requires pass order.

## When it may be skipped

You may skip this skill only for clearly bounded trivial work such as:

- typo, comment, or formatting-only edits;
- mechanical renames with no ownership or behavior change;
- docs-only edits that do not define or alter workflow contracts;
- narrow fixes where ownership, source of truth, final state, and verification are already explicit and unchanged.

If you skip it, be able to state why no architecture contract is needed.

## Token budget

Keep the handoff compact.

- Prefer short bullet points over prose.
- For small but non-trivial tasks, the handoff should usually fit in 20-40 lines.
- Do not expand stable repository rules, FSD explanations, or Material rules unless they are directly relevant to the decision.
- Use `N/A` for genuinely not applicable sections.
- Do not create an architecture handoff for trivial single-file mechanical changes when ownership, source of truth, and final state are obvious.

## Required handoff structure

Record the handoff with these fields:

- Goal
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
- Rejected approaches
- Shared UI blast radius
- Acceptance matrix
- Risk matrix
- Required verification
- Forbidden

Keep the handoff concrete. Prefer specific owners, explicit preserved scenarios, and named entry points over generic architecture language.

## Stop conditions before implementation

Stop before production edits when any of these are true:

- ownership is unclear;
- source of truth is unclear;
- expected final state is unclear;
- more than two architecture questions are unresolved;
- shared UI would be changed only to patch one feature without blast-radius review;
- the task combines unrelated domains without an explicit pass order.

When blocked, resolve the handoff first. Do not patch forward and hope review will reconcile the architecture later.

## Implementation contract

- Treat the handoff as upstream input for agent tasking, implementation preflight, coding, PR description, and final review.
- Restate only the implementation-relevant decisions in downstream steps; do not rewrite the architecture into a different plan.
- If new facts invalidate the handoff, stop and update the handoff explicitly before continuing.
- Do not silently replace rejected approaches, move ownership, or expand touched boundaries during implementation.

## Review contract after implementation

Review the full implemented feature against the architecture handoff.

- Do not review only the latest fix or latest changed files.
- Check goal, non-goals, affected scenarios, ownership, dependency direction, state shape, API shape, public contracts, shared UI blast radius, verification coverage, simplicity, and future safety.
- Preserve all unresolved findings in one consolidated list instead of dropping earlier blockers when new issues appear.
- If repeated review rounds show ownership drift or mixed responsibilities, stop patching and redo the architecture handoff.

## Output discipline

Keep the handoff concise but complete. The handoff should create concrete agent behavior, not broad generic process language.
