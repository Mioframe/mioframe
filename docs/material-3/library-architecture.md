# Material library architecture

This document defines the physical and dependency boundary of the Mioframe Material library.

The canonical library root is:

```text
src/shared/ui/material/
```

The library is developed inside the application repository, but its ownership and public API must remain independent enough that Material implementation can be understood, tested, migrated, and eventually extracted without product-layer knowledge.

## Goals

The library boundary must:

- give coding agents one deterministic location for Material implementation;
- contain Material foundation, official component families, and reusable official Material compositions;
- keep project-specific UI and generic platform infrastructure outside the library;
- make public and private dependency direction explicit;
- support incremental family-by-family and domain-by-domain migration;
- prevent new Material artifacts from being scattered across `shared/ui` and `shared/lib`;
- avoid a mass relocation PR or speculative package infrastructure.

## Canonical structure

Create only directories and files required by accepted current work. Empty placeholder directories are forbidden.

```text
src/shared/ui/material/
  AGENTS.md
  README.md
  index.ts                         # once the first production artifact is migrated

  foundation/
    index.ts                       # curated foundation API used by component families
    tokens/
    theme/
    typography/
    shape/
    elevation/
    motion/
    interaction/
    icon/
    overlay/

  components/
    <family>/
      README.md
      index.ts
      <Component>.vue
      <Component>.tokens.css       # only when owned official tokens exist
      <Component>.routes.css       # only for configured profiles
      <Component>.states.css       # only for stateful profiles
      <Component>.css
      <Component>.test.ts
      <Component>.stories.ts

  patterns/
    <pattern>/
      README.md
      index.ts
      ...
```

`component-architecture.md` defines the internal family layers and profiles. `foundation-architecture.md` defines foundation ownership and maintenance. This document owns location, library dependency direction, public entry points, and migration.

The canonical policy and evidence documents remain under `docs/material-3`. They describe the library but are not runtime library artifacts.

## Library domains

### `foundation`

Contains only cross-family Material contracts:

- verified reference and system tokens;
- theme contexts;
- Material authoring units and their library-facing contract;
- typography roles and utilities;
- shape, elevation, and motion roles or documented Web adaptations;
- generic state-layer, ripple, focus, and interaction acquisition;
- Material Symbols rendering;
- Material-specific overlay adapters and lifecycle contracts.

Policy-only concerns such as accessibility, density, target areas, and adaptivity remain in `docs/material-3` until a concrete runtime artifact is required. Do not create runtime managers merely to mirror policy categories.

### `components`

Contains public official Material component families. A family owns:

- supported Material usage contract;
- public API and native semantics;
- anatomy;
- official component tokens;
- configuration routing;
- property-specific state resolution;
- component-owned behavior;
- family documentation, stories, and focused tests.

A component family consumes foundation contracts but does not modify or duplicate them locally.

### `patterns`

Contains reusable compositions only when all conditions hold:

- Material documents the composition, canonical layout, or adaptive relationship;
- the contract is independent of one feature or domain model;
- at least one current product scenario requires it;
- ownership does not belong more clearly to a component family, widget, page, or generic layout primitive;
- the composition can be tested without product data or workflow behavior.

Do not place screens, settings sections, database toolbars, feature dialogs, domain empty states, or product navigation rules in `patterns`.

## What stays outside the library

The following remain outside `src/shared/ui/material`:

- generic DOM, event, teleport, focus, geometry, and browser utilities that are not Material-specific;
- project-specific shared UI and wrappers;
- feature, entity, widget, page, and app behavior;
- product information architecture and workflow decisions;
- app-specific tokens and contracts under `--app-*`;
- compatibility adapters owned by one legacy consumer;
- global e2e infrastructure and application-level test fixtures;
- canonical policy and source-evidence documents under `docs/material-3`.

A Material foundation implementation may depend on generic `shared/lib` infrastructure. Generic infrastructure must not depend on the Material library.

## Dependency direction

Allowed dependency direction is downward only:

```text
shared/lib generic infrastructure
  ├─→ material/foundation
  ├─→ material/components
  └─→ material/patterns

material/foundation
  → material/components
  → material/patterns

material/components
  → material/patterns

material library
  → project-specific shared UI
  → entities/features/widgets/pages/app
```

Higher Material layers may import a correctly owned generic `shared/lib` utility directly. Do not create a foundation wrapper merely to route a generic DOM, event, geometry, lifecycle, or browser helper through `material/foundation`.

Additional rules:

- `foundation` must not import `components` or `patterns`;
- one component family must not import private files or variables from another family;
- `patterns` may compose only public component/foundation contracts and correctly owned generic utilities;
- the Material library must not import project layers;
- project layers must not deep-import library implementation files;
- generic infrastructure must not use `MD*`, Material token vocabulary, or component-family knowledge unless it is itself migrated into the library as an accepted Material owner.

## Public API

The library public entry point is eventually:

```text
@shared/ui/material
```

Do not create `index.ts` until at least one production family or foundation artifact is migrated and can be exported honestly.

Rules:

- product consumers import from the root library entry point by default;
- the root entry point re-exports curated family and public foundation entry points;
- internal library code must not import the root entry point because that creates avoidable cycles;
- component families import foundation contracts from `material/foundation`, an accepted foundation sub-entry point, or a correctly owned generic `shared/lib` entry point;
- tests may import a family entry point when verifying that family contract;
- deep imports into `.vue`, `.css`, private helpers, or another family are forbidden;
- public exports require accurate TSDoc and registry/README ownership.

A separate workspace package, package build, or npm publication is not required now. Add those only when a current distribution or isolation requirement exists.

## Directory and naming conventions

- library namespaces and family directories use lower camel case, for example `components/button` and `foundation/interaction`;
- Vue components and class-centric files remain PascalCase;
- official public Material components keep `MD*` names;
- project-specific components must not be placed under `components` or exported as official Material surfaces;
- family-private helpers remain inside their family;
- generic foundation bridges remain in the owning foundation domain;
- stories and focused unit/contract tests are colocated with the owning family or foundation domain;
- browser and visual suites may remain under repository test roots while targeting public library stories and contracts.

## New work rule

After this architecture is accepted:

- every new public official Material component is created directly under `src/shared/ui/material/components/<family>`;
- every new Material foundation runtime artifact is created under the owning `material/foundation/<domain>`;
- every new reusable Material composition is created under `material/patterns/<pattern>` only when the pattern conditions pass;
- no new public `MD*` implementation may be added directly under `src/shared/ui/<LegacyFamily>`;
- no new Material token, typography, state, icon, or overlay owner may be added under `src/shared/lib/md` or legacy `src/shared/ui/State|Icon|Overlay` paths;
- a strict local repair to legacy code may stay in place only under the existing `Architecture impact: none` rules.

Using an existing generic `shared/lib` utility from a new Material artifact is allowed when that utility already owns the generic concern. This does not make the utility part of the Material library.

## Legacy ownership and target ownership

Current code remains valid until explicitly migrated. Existing locations are legacy production owners, not templates for new work.

Each Material family or foundation domain has:

```text
Current owner: <existing path>
Canonical owner: src/shared/ui/material/<domain-or-family>
Migration status: legacy | migrating | migrated
```

The current alignment registries continue to own Material correctness status. `src/shared/ui/material/README.md` owns the physical library migration map. These are separate dimensions and must not be conflated.

## Migration modes

### `library-relocation-only`

Moves one cohesive family or foundation domain without intended API, token, behavior, or rendered-output changes.

Use when the existing implementation is already structurally acceptable or when relocation must precede a later alignment PR.

### `architecture-only`

May combine relocation with the first `layered-v1` migration when the resulting scope remains one family, behavior-preserving, and reviewable.

### `alignment-only`

Runs after relocation/architecture acceptance and corrects named Material deviations.

### `foundation-replacement`

Uses the stricter foundation architecture workflow when changing the accepted generic owner or contract.

Do not combine unrelated family moves, broad import cleanup, foundation corrections, and visual alignment in one PR.

## Atomic migration requirements

A migrated family or foundation domain must update in the same PR:

1. source paths and internal imports;
2. the owning README/contract;
3. public library exports;
4. every in-repository consumer import;
5. Storybook titles and story imports when affected;
6. focused unit/browser/visual tests and risk registrations;
7. alignment registries when ownership or status changes;
8. `src/shared/ui/material/README.md` migration status;
9. obsolete old paths and exports.

Do not keep permanent compatibility re-exports at the legacy path. A temporary re-export is allowed only when one atomic migration is technically unsafe, with an explicit consumer list, removal target, and no new usage.

## Migration sequence

Use demand-driven order rather than moving the entire tree:

1. establish this boundary, scoped rules, and migration map;
2. add validator rules preventing new Material artifacts outside the library;
3. migrate the minimum foundation domains required by the first component pilot;
4. migrate `MDButton` and its family entry points;
5. complete Button alignment separately where needed;
6. migrate and validate `MDSwitch` as an independent family;
7. author one genuinely new component directly in the library;
8. migrate further families and foundation domains only when product work or alignment work touches them.

Foundation domains may move before, with, or after a component family only according to their change mode and consumer blast radius. Physical relocation alone must not silently change a foundation contract.

## Validation

Verify-managed architecture checks should identify:

- a new public `MD*` implementation outside `material/components`;
- a new Material foundation owner outside `material/foundation`;
- a project-specific surface incorrectly placed under `material/components`;
- product-layer imports inside the Material library;
- a foundation import from components or patterns;
- a cross-family private import;
- external deep imports into library implementation files;
- an unnecessary foundation wrapper around an existing correctly owned generic utility;
- a migrated artifact still exported from a legacy path without an approved temporary contract;
- a migration-map entry inconsistent with actual paths or public exports;
- a generic infrastructure module that gained Material ownership without registry migration;
- an empty namespace, placeholder layer, or speculative pattern.

Legacy paths remain advisory until their family/domain migration starts. New artifacts and migrated owners are blocking immediately.

## Completion

The library architecture is healthy when:

- agents know one location for every new Material artifact;
- foundation, components, patterns, project UI, and generic infrastructure have distinct owners;
- generic utilities remain directly reusable without artificial foundation wrappers;
- new work no longer increases legacy Material surface;
- each migration removes its old path and updates all consumers;
- public imports do not expose internal file structure;
- foundation and component correctness remain governed by their existing contracts and registries;
- the library grows only from confirmed component and product needs.