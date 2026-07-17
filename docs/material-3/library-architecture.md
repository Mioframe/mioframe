# Material library architecture

This document defines the physical boundary, dependency direction, public API, and migration model of the Mioframe Material library.

The canonical library root is:

```text
src/shared/ui/material/
```

The library lives inside the application repository, but its Material ownership must remain understandable and testable without product-layer knowledge.

## Goals

The library boundary must:

- give agents one canonical location for Material implementation;
- separate cross-family foundations, official component families, reusable Material patterns, generic infrastructure, and product UI;
- support incremental family-by-family migration;
- keep public and private dependency direction explicit;
- avoid mass relocation, speculative packages, and framework infrastructure built before a real need.

## Canonical structure

Create only artifacts required by accepted current work.

```text
src/shared/ui/material/
  AGENTS.md
  README.md
  index.ts                         # after the first real public artifact exists

  foundation/
    <domain>/

  components/
    <family>/
      README.md
      index.ts
      <Component>.vue
      <Component>.css
      <Component>.test.ts
      <Component>.stories.ts
      ...                          # only applicable, justified files

  patterns/
    <pattern>/
```

The structure is an ownership map, not a requirement to pre-create every directory or file category.

`component-architecture.md` owns family contracts and implementation responsibilities. `foundation-architecture.md` owns cross-family foundation contracts. This document owns location, dependency direction, public entry points, and migration.

## Library domains

### `foundation`

Contains only cross-family Material contracts required by current components or product scenarios, such as:

- verified reference and system tokens;
- theme contexts;
- typography, shape, elevation, and motion roles;
- generic state-layer, ripple, focus, and interaction acquisition;
- Material Symbols rendering;
- Material-facing overlay adapters.

Policy-only concerns remain in `docs/material-3` until a concrete runtime artifact is justified.

### `components`

Contains official public Material component families. A family owns its applicable:

- supported usage and public API;
- native semantics and accessibility;
- anatomy and state ownership;
- official component tokens;
- component-specific behavior and rendering;
- family documentation, stories, and focused tests.

A family consumes accepted foundation contracts and must not recreate a cross-family concern locally.

### `patterns`

Contains a reusable composition only when:

- official Material guidance documents the composition or relationship;
- at least one current product scenario requires it;
- it is independent of one product domain or workflow;
- ownership does not belong more clearly to a component family or product layer;
- it can be tested without product data.

Screens, feature dialogs, settings sections, database toolbars, domain empty states, and product navigation rules remain outside `patterns`.

## What remains outside

Keep outside `src/shared/ui/material`:

- generic DOM, event, teleport, focus, geometry, lifecycle, and browser utilities;
- project-specific shared UI and wrappers;
- feature, entity, widget, page, and app behavior;
- product information architecture and workflows;
- app-specific `--app-*` contracts;
- global application test infrastructure;
- policy and source-evidence documents under `docs/material-3`.

A Material implementation may use a correctly owned generic utility directly. Do not introduce a foundation wrapper merely to route generic behavior.

## Dependency direction

Allowed direction is downward:

```text
shared/lib generic infrastructure
  ├─→ material/foundation
  ├─→ material/components
  └─→ material/patterns

material/foundation → material/components → material/patterns
material library → project-specific shared UI and product layers
```

Rules:

- foundation must not import components or patterns;
- a family must not deep-import another family's private files;
- patterns compose public component and foundation contracts only;
- Material library code must not import product layers;
- generic infrastructure must not depend on Material family knowledge;
- product consumers must not deep-import private implementation or testing files.

## Public API

The project-facing entry point is eventually:

```text
@shared/ui/material
```

Do not create the root entry point before a real production artifact can be exported honestly.

After it exists:

- product consumers use the root entry point by default;
- the root entry point exposes a curated API;
- internal library code uses owning family, foundation, or generic entry points rather than the root barrel;
- private implementation and testing files are not public API.

A separate package, package build, or publication pipeline is not required until a current distribution or isolation need proves it useful.

## New work

- Create every new public official Material component under `components/<family>`.
- Create a new foundation runtime or testing owner under the applicable `foundation/<domain>` only when current work proves the need.
- Create a pattern only after the pattern conditions pass.
- Treat legacy Material locations as existing owners, not templates for new ownership.
- Keep strict local legacy repairs in place only when they do not change ownership, public contract, foundation dependencies, or unrelated output.

## Family migration model

The default migration is one cohesive end-to-end family cycle:

```text
discovery → accepted contract → rule refinement → required foundation work →
implementation → consumer migration → proof → agent review →
operator visual acceptance when required → queue update
```

A family migration may include relocation, architecture cleanup, and Material 3 Expressive alignment when the combined result remains reviewable and leaves no unsafe intermediate state.

Split work into focused prerequisite or follow-up PRs only when:

- a foundation change has a materially wider blast radius;
- a public compatibility decision requires separate review;
- the combined diff would obscure correctness;
- an independently valid intermediate state materially reduces risk.

Do not split work merely because older documents defined separate relocation and alignment phases.

A relocation-only PR remains valid when no API, behavior, token, rendered-output, or verification contract changes. An alignment-only PR remains valid for a canonical family with named Material deviations. These are useful scopes, not mandatory stages.

## Migration completion

A migrated family updates every artifact actually affected by the migration:

- source paths and internal imports;
- public exports and in-repository consumers;
- the family contract;
- applicable stories and tests;
- applicable visual evidence and risk registration;
- the physical migration map;
- registries or inventory rows whose owned facts changed;
- obsolete legacy paths and exports.

Do not update roadmap, registries, snapshots, or other documents when their owned facts did not change.

Permanent compatibility re-exports are forbidden. A temporary path requires exact consumers, no new usage, and a removal target.

## Program sequence

Use the sequence owned by `library-roadmap.md`:

1. complete the operating model;
2. perform the `MDButton` end-to-end pilot;
3. perform an independent stateful pilot, normally `MDSwitch`;
4. continue autonomous sequential migration by evidence-backed priority.

Inventory and foundation work are performed just in time for the selected family. A genuinely new component is authored when the product needs it, not as a prerequisite for continuing migration.

## Rule refinement

Project rules are working contracts. When a real migration proves a rule inaccurate, contradictory, incomplete, obsolete, or needlessly complex, correct the owning rule instead of creating a family-specific exception.

The correction must be the smallest change supported by official Material sources, repository architecture, and accepted product behavior. Update only directly affected rule owners and record the concrete case and consequence.

## Automation policy

There is no mandatory standalone Material validation phase.

Use existing repository checks and focused tests. Add a new automated guard only when real work demonstrates that:

- the protected contract is stable;
- the failure is repeated or materially risky;
- the check is precise and cheap to maintain;
- existing tooling can express it without a parallel architecture system.

Automation may prove deterministic repository facts. It must not claim to prove Material interpretation, family rationale, scenario sufficiency, or visual correctness.

## Completion

The library architecture is healthy when:

- every new Material artifact has one clear owner;
- foundations, families, patterns, generic infrastructure, and product UI remain distinct;
- components use accepted cross-family contracts without local substitutes;
- each completed migration removes obsolete ownership and updates consumers;
- public imports hide private file structure;
- rules improve from real migration evidence;
- the library grows from confirmed component and product needs.