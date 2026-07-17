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
- [Component audits](./audits/README.md) — durable latest compliance audit per family
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
- `material-library-status` owns read-only program-state reconciliation and status-report format.
- `material-library-next` owns automatic selection of exactly one next family and startup of its component workflow.
- `material-component` owns one-name invocation, official target resolution, and automatic change-mode selection.
- `material-component-review` owns one-name review orchestration, compliance evaluation, and creation of the durable family audit.
- `material-component-authoring` owns the canonical execution order after the family is resolved.
- `material-foundation` owns execution order for cross-family foundation changes.
- The family `README.md` owns the accepted contract for one family.
- `audits/<family-slug>.md` owns the latest completed source-backed compliance evaluation for one family.
- Validation policy defines when automation is justified; actual tooling owns only checks that exist.

Status and selection entrypoints do not become new fact owners. They must read roadmap, inventory, registries, migration map, family contracts, audits, and verification state according to the ownership above. An audit does not override the family contract, registry, inventory, or roadmap. When a real migration exposes an inaccurate rule, correct the owning source rather than adding an exception or duplicating a replacement.

## Library status entry point

A user may inspect the program without changing it:

```text
material-library-status
```

The status workflow reports the active milestone or prerequisite, single next action, blocker, latest completed family, executable and blocked candidates, audit freshness, pending visual acceptance, relevant foundation gaps, verification state, record inconsistencies, inventory completeness, and one recommended command.

It is strictly read-only. It does not repair stale records, update audits, reorder the queue, implement components, or infer a complete backlog from a partially populated inventory.

## Next-family entry point

A user may continue the program without naming a component:

```text
material-library-next
```

The workflow selects exactly one family. During the pilots it follows the active roadmap milestone and its single `Next action`. After the pilots it selects one unblocked `queued` official-component row with satisfied dependencies, preferring accepted `P0` over `P1` evidence.

One invocation completes at most one cohesive family. It records the next candidate after completion but does not start a second family in the same task or PR.

## One-name component entry point

A user may start component work with only:

```text
material-component <component-or-family-name>
```

The component name is sufficient input. The entrypoint resolves the official Material surface, owning family, existing implementation, consumers, change mode, minimum supported Expressive surface, applicable foundations, proof layers, and current family audit before running `material-component-authoring` end to end.

Existing consumers define required scenarios. When no consumer exists, implement the current canonical Expressive default and record optional official capabilities as unsupported. Ask the user only when a genuine product decision or materially unresolved official ambiguity remains.

## One-name compliance review

A user may audit an existing implementation with only:

```text
material-component-review <component-or-family-name>
```

The review entrypoint resolves the component, official Material 3 Expressive sources, claimed supported surface, current owners, consumers, stories, tests, and visual evidence. It reports a clear compliance result plus confirmed source-backed findings, evidence gaps, rule defects, verified areas, and the recommended next action.

Every completed review creates or replaces:

```text
docs/material-3/audits/<family-slug>.md
```

The filename is stable and uses the resolved owning-family slug. Later reviews replace the same file; Git history preserves earlier audits. The audit records the implementation ref and commit reviewed, so consumers can detect when it is stale.

The review is read-only for implementation and policy. Its only required repository change is the family audit artifact. Current code, family documentation, registry status, tests, snapshots, prior audits, and rendering are claims to verify rather than proof of Material correctness. Production fixes begin only through a separate `material-component` or `material-component-authoring` task.

`compliant` requires all claimed and required non-visual contracts to pass, one canonical owner to remain, required evidence to exist, and any required operator visual acceptance to be durably recorded. Otherwise the result distinguishes technical compliance awaiting visual review, partial compliance, non-compliance, or blocked official evidence.

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
14. A component name alone can start an independent source-backed compliance review without changing production implementation.
15. Every completed compliance review leaves one durable, current, source-backed audit file for the resolved family.
16. The program can report its current state without mutation and can select one next family without manual component choice.

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
4. autonomous sequential migration of the highest-priority executable family.

Each family follows:

```text
discovery → accepted contract → rule refinement → required foundation work →
implementation → consumer migration → proportional proof → agent review →
operator visual acceptance when required → queue update → next candidate
```

Do not create a validator phase, exhaustive inventory gate, fixed CSS-file profile, mandatory visual matrix for simple components, or new-component proof before real work demonstrates a need.
