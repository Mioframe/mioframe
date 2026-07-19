# Material 3 Expressive library documentation

This directory is the canonical documentation boundary for the Material 3 Expressive library under `src/shared/ui/material`.

All Material-owned artifacts live inside the same shared-library root:

```text
src/shared/ui/material/
  AGENTS.md
  README.md
  docs/
  foundation/
  components/
  patterns/
```

The root-level `docs/` directory must not own Material policy, roadmap, audits, registries, source evidence, or implementation guidance. Repository-level agent infrastructure may route work into this boundary, but it must not become a second Material fact owner.

## Policy set

### Program and ownership

- [Adoption plan](./adoption-plan.md) — component-first isolated-library development workflow
- [Library roadmap](./library-roadmap.md) — current milestone, blocker, next action, and progress
- [Library architecture](./library-architecture.md) — physical boundary, dependency direction, public API, and migration model
- [Shared UI inventory](./ui-library-inventory.md) — classification, priority, queue state, and terminal outcomes
- [Library map](../README.md) — physical current and canonical ownership

### Official sources and foundations

- [Source of truth](./source-of-truth.md)
- [Foundation architecture](./foundation-architecture.md)
- [Foundation registry](./foundation-registry.md)
- [Units](./units.md)
- [Tokens](./tokens.md)
- [Baseline theme](./baseline-theme.md)
- [Interaction states](./interaction-states.md)
- [Accessibility](./accessibility.md)
- [Layout and adaptive behavior](./layout-adaptive.md)
- [Iconography](./icons.md)
- [Density and spacing](./density-spacing.md)
- [Overlays](./overlays.md)

### Components and proof

- [Component architecture](./component-architecture.md)
- [Component testing](./component-testing.md)
- [Autonomous review](./autonomous-review.md)
- [Component audits](./audits/README.md)
- [Component tokens](./component-tokens.md)
- [Shared UI API](./shared-ui-api.md)
- [Component registry](./component-registry.md)
- [Validation policy](./token-validation.md)
- [Authoring checklist](./component-conversion-checklist.md)
- [Storybook](./storybook.md)
- [Verification](./verification.md)
- [Deviations](./deviations.md)

## Ownership

- `AGENTS.md` owns the hard local boundary and workflow routing.
- Architecture documents own durable library contracts.
- `library-roadmap.md` owns active program state and the single next action.
- `ui-library-inventory.md` owns classification, priority, and terminal outcomes.
- `source-of-truth.md` owns official-source hierarchy.
- `foundation-registry.md` and `component-registry.md` own program-level alignment state.
- Family `README.md` files own accepted family contracts.
- `audits/<family-slug>.md` owns the latest completed independent compliance review.

All these owners remain inside `src/shared/ui/material`. When they disagree, correct the stale owning artifact rather than duplicating policy elsewhere.

## Entry points

- `material-library-status` reads this boundary without mutation.
- `material-library-next` selects exactly one next family from the roadmap and inventory.
- `material-component <name>` resolves and executes one component-family task.
- `material-component-review <name>` writes the latest audit to `src/shared/ui/material/docs/audits/<family-slug>.md`.
- `material-foundation` executes a cross-family foundation task.

Repository-level skill files are routing infrastructure. They must delegate to this documentation and must not carry an independent Material architecture, roadmap, registry, audit, or source-of-truth model.
