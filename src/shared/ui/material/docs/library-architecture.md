# Material library architecture

This document defines the physical boundary, documentation ownership, dependency direction, public API, and migration model of the Mioframe Material library.

The canonical library root is:

```text
src/shared/ui/material/
```

## Canonical structure

Create only artifacts required by approved current work.

```text
src/shared/ui/material/
  AGENTS.md
  README.md
  index.ts                         # after a real public artifact exists

  docs/
    README.md
    workflow.md
    source-of-truth.md
    library-architecture.md
    component-architecture.md
    foundation-architecture.md
    component-testing.md
    library-roadmap.md
    ui-library-inventory.md
    foundation-registry.md
    audits/
      README.md
      <family>.md
    ...                            # focused Material domain policies

  foundation/
    <domain>/

  components/
    <family>/
      README.md                    # approved family contract
      index.ts
      <Component>.vue
      <Component>.css
      <Component>.test.ts
      <Component>.stories.ts
      ...

  patterns/
    <pattern>/
```

This is an ownership map, not a requirement to pre-create every directory or file type.

## Library domains

### `docs`

Owns Material-library architecture, workflow, official-source policy, foundation policies, program records, audits, and verification contracts.

It must not contain product requirements, feature workflows, implementation logs, correction history, agent context, or duplicate family contracts.

### `foundation`

Contains only cross-family Material runtime or testing contracts required by approved components or product scenarios. Policy-only concerns remain in `docs` until a concrete runtime artifact is justified.

### `components`

Contains official public Material component families. A family owns its approved supported usage, public API, native semantics, accessibility, anatomy, states, official component tokens, rendering, family contract, stories, and focused tests.

### `patterns`

Contains a reusable composition only when official guidance defines it, a current scenario requires it, it is independent of one product domain, ownership does not belong to one family, and it can be tested without product data.

## What remains outside

Keep outside `src/shared/ui/material`:

- product documentation under root `docs`;
- generic DOM, event, teleport, focus, geometry, lifecycle, and browser utilities;
- project-specific shared UI and wrappers;
- feature, entity, widget, page, and app behavior;
- product information architecture and workflows;
- app-specific `--app-*` contracts;
- global application test infrastructure.

A Material implementation may use a correctly owned generic utility directly. Do not create a foundation wrapper merely to route generic behavior.

## Dependency direction

```text
shared/lib generic infrastructure
  ├─→ material/foundation
  ├─→ material/components
  └─→ material/patterns

material/foundation → material/components → material/patterns
material library → project-specific shared UI and product layers
```

- Documentation describes the library but is not a runtime dependency.
- Foundation must not import components or patterns.
- A family must not deep-import another family's private files.
- Patterns compose public component and foundation contracts only.
- Material runtime code must not import product layers.
- Generic infrastructure must not depend on Material family knowledge.
- Product consumers must not deep-import private implementation or testing files.

## Public API

The project-facing entry point is eventually `@shared/ui/material`.

Do not create the root entry point before a real production artifact can be exported honestly. Internal library code uses owning family, foundation, or generic entry points rather than the root barrel.

## Development model

Follow `workflow.md`:

```text
approved architecture and ready contract
→ implementation
→ independent technical review
→ operator visual acceptance when required
→ merge
```

The architect owns family selection, supported surface, ownership, public API, acceptance criteria, implementation task, and merge recommendation.

The coding agent implements only an approved `Readiness: ready` contract. It does not approve architecture, independently review its own result, or continue automatically to another family.

## New work

- Create new public official Material components under `components/<family>`.
- Create a foundation runtime/testing owner under `foundation/<domain>` only when approved current work proves the cross-family need.
- Create a pattern only after the pattern conditions pass.
- Treat legacy Material locations as existing owners, not templates for new ownership.
- Create no placeholder layers, manager agents, owner stacks, or execution state machines.

## Migration model

The default cycle is:

```text
approved contract → required foundation work → implementation → consumer migration → proof → cleanup → independent review → visual acceptance
```

Split work only when a wider foundation blast radius, compatibility decision, reviewability, or safer independently valid state requires it.

A migrated family updates only affected source paths, exports, consumers, family contract, stories, tests, visual evidence, physical ownership map, and program records. Obsolete legacy owners and unapproved compatibility paths must be removed.

## Automation policy

Add a guard only after real work proves a stable repeated and precisely detectable need. Automation may prove deterministic repository facts; it must not claim to prove Material interpretation, architecture quality, scenario sufficiency, or visual correctness.

## Completion

The architecture is healthy when documentation, foundations, families, patterns, generic infrastructure, and product UI have distinct owners; every artifact has one owner; migrations remove obsolete ownership; public imports hide private structure; and implementation remains separate from independent review.
