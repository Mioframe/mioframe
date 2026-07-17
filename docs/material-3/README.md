# Material 3 Expressive policies

This directory defines Mioframe's contract for building and migrating the Material library at `src/shared/ui/material` against current official Material 3 Expressive sources.

## Policy set

### Program and ownership

- [Adoption plan](./adoption-plan.md) — pilot-first and autonomous sequential migration strategy
- [Library roadmap](./library-roadmap.md) — current milestone, blocker, next action, and progress
- [Library architecture](./library-architecture.md) — physical boundary, dependency direction, public API, and migration model
- [Shared UI inventory](./ui-library-inventory.md) — classification, priority, queue state, and terminal outcomes
- [`src/shared/ui/material` map](../../src/shared/ui/material/README.md) — physical current and canonical ownership

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

- [Component architecture](./component-architecture.md) — adaptive family contract and production ownership
- [Component testing](./component-testing.md) — proportional proof and visual evidence
- [Autonomous review](./autonomous-review.md) — agent evidence review and operator visual acceptance
- [Component tokens](./component-tokens.md)
- [Shared UI API](./shared-ui-api.md)
- [Component registry](./component-registry.md)
- [Validation policy](./token-validation.md) — evidence-driven automation boundary
- [Authoring checklist](./component-conversion-checklist.md)
- [Storybook](./storybook.md)
- [Verification](./verification.md)
- [Deviations](./deviations.md)

## Rule ownership

- Architecture documents own durable boundaries and contracts.
- `AGENTS.md` owns scoped hard boundaries and routing.
- `library-roadmap.md` owns current milestone, blockers, and next action.
- `ui-library-inventory.md` owns classification, priority, queue state, and terminal outcome.
- `source-of-truth.md` owns source hierarchy and the current Expressive target.
- `autonomous-review.md` owns agent/operator review-role separation.
- `material-component` owns one-name invocation, official target resolution, and automatic change-mode selection.
- `material-component-authoring` owns the canonical execution order after the family is resolved.
- `material-foundation` owns execution order for cross-family foundation changes.
- The family `README.md` owns the accepted contract for one family.
- Validation policy defines when automation is justified; actual tooling owns only checks that exist.

When a real migration exposes an inaccurate rule, correct the owning source rather than adding an exception or duplicating a replacement.

## One-name component entry point

A user may start component work with only:

```text
material-component <component-or-family-name>
```

The component name is sufficient input. The entrypoint resolves the official Material surface, owning family, existing implementation, consumers, change mode, minimum supported Expressive surface, applicable foundations, and proof layers before running `material-component-authoring` end to end.

Existing consumers define required scenarios. When no consumer exists, implement the current canonical Expressive default and record optional official capabilities as unsupported. Ask the user only when a genuine product decision or materially unresolved official ambiguity remains.

## Goals

1. `src/shared/ui/material` is the canonical owner for new official Material implementation.
2. Components target the current applicable Material 3 Expressive contract; baseline Material 3 is never a silent fallback.
3. Foundation, official families, Material patterns, generic infrastructure, project UI, and product layers have distinct owners.
4. Families implement the minimum complete surface required by current scenarios and consumers.
5. Foundations expand on demand and remain free of family-specific and product knowledge.
6. Legacy families migrate end to end by evidence-backed priority.
7. Component contracts are adaptive: mandatory core decisions plus only applicable conditional concerns.
8. Proof is proportional: component contract always, browser/pure/consumer/visual layers only when owned.
9. A `StateMatrix` is used for multiple distinct visual routes, not as ceremony for every component.
10. Agents close all non-visual review gates and prepare bounded visual evidence for the operator when required.
11. Rules and automation improve from repeated real migration evidence.
12. Existing migrations remove obsolete owners instead of accumulating compatibility layers.
13. A component name alone can start a complete source-backed implementation or migration without a separate architecture task.

## Scope

Existing code is not automatically Expressive-compliant, consistently tested, visually accepted, physically migrated, or correctly classified.

New Material artifacts use the canonical library immediately. Existing code outside it is legacy and may receive strict local repairs until focused migration.

Project-specific and generic shared UI may remain outside Material permanently when ownership is explicit.

A local repair may use `Architecture impact: none` only when it preserves ownership, public contract, foundation dependencies, testing surface, behavior, and unrelated output.

## Operating model

The current operational sequence is:

1. operating model complete;
2. `MDButton` end-to-end pilot;
3. independent stateful pilot, normally `MDSwitch`;
4. autonomous sequential migration of the highest-priority ready family.

Each family follows:

```text
discovery → accepted contract → rule refinement → required foundation work →
implementation → consumer migration → proportional proof → agent review →
operator visual acceptance when required → queue update → next family
```

Do not create a validator phase, exhaustive inventory gate, fixed CSS-file profile, mandatory visual matrix for simple components, or new-component proof before real work demonstrates a need.
