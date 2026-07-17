# Material 3 Expressive policies

This directory contains durable policy for building `src/shared/ui/material` against current official Material 3 Expressive sources.

## Library model

The production library mirrors the official Material documentation navigation:

```text
src/shared/ui/material/
  foundations/
  styles/
  components/
```

- Foundations: accessibility, adaptive/layout, interaction, and other official foundation domains.
- Styles: color, elevation, icons, motion, shape, typography, and other official style domains.
- Components: official public component families using official documentation slugs.

Example:

```text
m3.material.io/components/buttons
→ src/shared/ui/material/components/buttons
```

## Core policies

### Program and ownership

- [Adoption plan](./adoption-plan.md)
- [Library roadmap](./library-roadmap.md)
- [Library architecture](./library-architecture.md)
- [Shared UI inventory](./ui-library-inventory.md)
- [`src/shared/ui/material` navigation](../../src/shared/ui/material/README.md)

### Sources, foundations, and styles

- [Source of truth](./source-of-truth.md)
- [Foundations and styles architecture](./foundation-architecture.md)
- [Foundation registry](./foundation-registry.md)
- [Units](./units.md)
- [Tokens](./tokens.md)
- [Accessibility](./accessibility.md)
- [Interaction states](./interaction-states.md)
- [Layout and adaptive behavior](./layout-adaptive.md)
- [Icons](./icons.md)

### Components and proof

- [Component architecture](./component-architecture.md)
- [Component testing](./component-testing.md)
- [Autonomous review](./autonomous-review.md)
- [Component registry](./component-registry.md)
- [Component tokens](./component-tokens.md)
- [Authoring checklist](./component-conversion-checklist.md)
- [Storybook](./storybook.md)
- [Verification](./verification.md)
- [Deviations](./deviations.md)

## Fact ownership

- Architecture documents own durable boundaries and workflow rules.
- `library-roadmap.md` owns the active milestone and next action.
- `ui-library-inventory.md` owns classification, priority, and queue state.
- `source-of-truth.md` owns official source hierarchy.
- The family `README.md` beside implementation owns current project implementation documentation and the complete official capability classification.
- The family `AUDIT.md` beside implementation owns the latest independent two-stage review and independently verified official coverage.
- Registries are program summaries and must not override more specific family documentation.

## Family documentation

Each implemented or actively migrated component family contains:

```text
src/shared/ui/material/components/<official-docs-slug>/README.md
src/shared/ui/material/components/<official-docs-slug>/AUDIT.md
```

`README.md` records:

- official documentation mapping and inventory completeness;
- official coverage: full, partial, or unresolved;
- implemented surface;
- every official capability not implemented, regardless of current consumer demand;
- every partial, defective, provisional, ambiguous, or unverified capability;
- known issues and required follow-up;
- API, semantics, states, tokens, and property ownership;
- foundation/style dependencies;
- extensions and deviations;
- consumers, verification, and review status.

The implementing workflow updates `README.md` and never edits `AUDIT.md`.

`AUDIT.md` is created or replaced only by `material-component-review`. It independently reconstructs the complete official family inventory and performs two comparisons in order:

1. actual implementation against project documentation;
2. project documentation and its capability inventory against canonical Material 3 Expressive.

The audit lists implemented, partial/unverified, not implemented, unresolved, and out-of-family capability independently of the README. This makes implementation defects, project-documentation defects, and incomplete official coverage visible separately. Project documentation is the intended Mioframe contract, but it is not treated as Material authority.

## Entrypoints

### Implement or migrate one family

```text
material-component <component-or-family-name>
```

The workflow resolves the official documentation family, reconstructs its complete capability inventory, uses its official slug, updates the family README, implements the selected coherent surface, migrates consumers, records all absent and unfinished capability, and runs local verification.

### Review one family

```text
material-component-review <component-or-family-name>
```

The review changes only the colocated `AUDIT.md`, independently verifies complete official coverage, reports both comparison stages, and returns compliance plus `Official coverage: full | partial | unresolved`.

### Continue the program

```text
material-library-next
```

Selects and implements exactly one family.

### Read program status

```text
material-library-status
```

Reads roadmap, inventory, registries, and colocated family documentation without changing files.

## Operating loop

```text
discovery → complete official capability inventory → family README →
required shared work → implementation → consumer migration → proportional proof →
local verification → two-stage family audit with independent coverage inventory →
operator visual review when required → queue update
```

## Required behavior

- Implement the current applicable Material 3 Expressive contract for the selected implementation scope.
- Use baseline Material only when no applicable Expressive contract exists or a documented deviation requires it.
- Implement the minimum coherent surface needed by current consumers.
- Classify every official family capability regardless of current consumer demand.
- Record every absent official capability under `Not implemented`.
- Record every partial, defective, provisional, ambiguous, or unverified capability as such.
- Record every known defect, incomplete route, missing verification, and required follow-up.
- Never infer implementation from declarations, aliases, stories, or tests when the final route does not work.
- Keep proof proportional and do not retest browser interpolation internals.
- Remove obsolete ownership during migration.
- Do not create placeholder structures, universal validators, fixed file profiles, or a second metadata database.
- Do not describe a family as fully implemented unless the independent audit reports `Official coverage: full`.
