# Material library documentation

This directory is part of `src/shared/ui/material` and is the only canonical documentation tree for the Mioframe Material library.

## Read first

For component or foundation work, read only the documents required by the approved scope:

- [Workflow](./workflow.md) — role separation, stage gates, correction policy, visual acceptance, and durable artifacts;
- [Source of truth](./source-of-truth.md) — official Material evidence hierarchy and snapshot rules;
- [Library architecture](./library-architecture.md) — physical boundary, dependency direction, public API, and migration model;
- [Component architecture](./component-architecture.md) — family ownership and ready-contract requirements;
- [Foundation architecture](./foundation-architecture.md) — cross-family foundation ownership;
- [Component testing](./component-testing.md) — proportional proof and visual evidence.

## Program records

- [Library roadmap](./library-roadmap.md) — current milestone, blocker, and one next action;
- [Shared UI inventory](./ui-library-inventory.md) — classification, priority, dependencies, queue state, and terminal outcomes;
- [Foundation registry](./foundation-registry.md) — current foundation ownership, readiness, gaps, and verification;
- [Family audits](./audits/README.md) — latest independent review per family.

These records own different facts. Do not duplicate their responsibilities in another roadmap, registry, checklist, monolithic audit, audit history, or execution ledger.

## Domain policies

Read only applicable policies:

- [Units](./units.md)
- [Tokens](./tokens.md)
- [Baseline theme](./baseline-theme.md)
- [Interaction states](./interaction-states.md)
- [Accessibility](./accessibility.md)
- [Layout and adaptive behavior](./layout-adaptive.md)
- [Iconography](./icons.md)
- [Density and spacing](./density-spacing.md)
- [Overlays](./overlays.md)
- [Component tokens](./component-tokens.md)
- [Shared UI API](./shared-ui-api.md)
- [Token validation](./token-validation.md)
- [Storybook](./storybook.md)
- [Verification](./verification.md)
- [Deviations](./deviations.md)

## Executable skills

- `material3-guidelines` — official source and usage decisions for an architect-owned contract;
- `material-component-implementation` — coding after an approved `Readiness: ready` family contract;
- `material-component-review` — independent full-PR review, durable audit, and merge recommendation;
- `material-foundation` — implementation of an explicitly approved foundation contract;
- applicable Vue, testing, and verification skills.

A coding skill is not an architecture owner. It must not select a family, broaden supported surface, approve its own implementation, or claim merge readiness.

## Family contracts

Family `README.md` files beside the canonical family owner store the approved supported surface, API, semantics, ownership, foundation dependencies, acceptance criteria, unsupported behavior, deviations, and readiness.

Current execution state, shell output, correction history, review history, and temporary agent context do not belong in family contracts or this documentation tree.
