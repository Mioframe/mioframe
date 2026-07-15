# Mioframe Material library

`src/shared/ui/material` is the canonical source boundary for Mioframe's Material implementation.

The library contains:

- shared Material foundation contracts;
- official public Material component families;
- reusable official Material compositions that are independent of product domains.

Detailed architecture is defined by:

- `docs/material-3/library-architecture.md`;
- `docs/material-3/foundation-architecture.md`;
- `docs/material-3/component-architecture.md`;
- `docs/material-3/component-testing.md`.

Canonical policy and source-evidence documents remain under `docs/material-3`; this directory owns runtime/library artifacts and their local contracts.

## Ownership map

```text
material/foundation
  Cross-family Material tokens, roles, primitives, adapters, and verification-only state helpers.

material/components
  Official public component families, their implementation contracts, stories, and focused tests.

material/patterns
  Reusable official Material compositions only when a current scenario requires them.
```

Generic platform utilities, project-specific shared UI, features, widgets, pages, and app behavior remain outside this directory.

## Dependency direction

```text
shared/lib generic infrastructure
  ├─→ material/foundation
  ├─→ material/components
  └─→ material/patterns

material/foundation → material/components → material/patterns
material library → project-specific shared UI and product layers
```

Higher Material layers may use a correctly owned generic `shared/lib` utility directly. Do not create a foundation wrapper merely to route a generic DOM, event, geometry, lifecycle, or browser helper.

Imports from product layers into the Material library and imports from higher Material layers into lower owners are forbidden.

## Public API

The intended project-facing entry point is:

```ts
import { MDButton } from '@shared/ui/material';
```

Do not create the root production `index.ts` until the first real family or foundation artifact is migrated. Once it exists:

- product consumers use the root entry point;
- internal library modules use owning foundation/family entry points or correctly owned generic `shared/lib` entry points, not the root barrel;
- deep imports into implementation files are forbidden.

## New implementation rule

After this boundary is accepted:

- new official Material components are created in `components/<family>`;
- new Material foundation runtime artifacts are created in `foundation/<domain>`;
- new Material patterns are created in `patterns/<pattern>` only when the documented pattern gate passes;
- legacy Material directories may receive strict local repairs, but no new public Material surface.

Every new public component is created together with:

- a family README blueprint;
- a colocated contract test;
- exactly one canonical Storybook `StateMatrix`;
- a Playwright visual regression for that matrix;
- real Storybook browser-behavior tests when applicable;
- pure helper/composable tests when applicable.

The state matrix shows every supported visual state and every distinct state-rendering route, with visible row and column labels. It does not duplicate equivalent sizes, labels, icons, or content combinations.

Empty placeholder directories and files are forbidden. A directory appears only with an accepted production artifact.

Using a generic utility from outside the library does not transfer its ownership into Material.

## Physical migration map

This table tracks source location, not Material alignment or test-profile completeness. Alignment status remains in the foundation and component registries; each family README owns its current testing contract.

| Area                              | Current production owner                                                       | Canonical owner                                                                     | Migration status              |
| --------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ----------------------------- |
| Reference/system tokens and theme | `src/shared/lib/md/tokens.css`                                                 | `material/foundation/tokens` and `material/foundation/theme` as proven by migration | `legacy`                      |
| Typography utilities              | `src/shared/lib/md`                                                            | `material/foundation/typography`                                                    | `legacy`                      |
| State layer, ripple, and focus    | `src/shared/ui/State`                                                          | `material/foundation/interaction`                                                   | `legacy`                      |
| Material Symbols                  | `src/shared/ui/Icon`                                                           | `material/foundation/icon`                                                          | `legacy`                      |
| Material overlay contract         | `src/shared/ui/Overlay` plus generic teleport/outside-interaction dependencies | `material/foundation/overlay`; generic dependencies remain outside                  | `legacy`                      |
| Existing official `MD*` families  | existing `src/shared/ui/<LegacyFamily>` directories                            | `material/components/<family>`                                                      | `legacy`                      |
| New official Material family      | none                                                                           | `material/components/<family>`                                                      | create directly as `migrated` |
| Reusable Material patterns        | current scattered or missing compositions                                      | `material/patterns/<pattern>` only after the pattern gate passes                    | `legacy` or `missing`         |

Do not split the monolithic token owner merely to match this table. Source relocation follows confirmed ownership and reviewable migration boundaries.

## Migration status meanings

- `legacy`: current code remains accepted for existing consumers, but it is not a location or testing template for new Material work;
- `migrating`: one focused PR owns relocation and must update all consumers, exports, contracts, stories, tests, snapshots, risk registration, and this map;
- `migrated`: the canonical owner is active, legacy paths are removed, the standard test profile exists, and architecture validation is blocking.

## Migration rules

Each migration handles one cohesive family or foundation domain and must:

1. preserve behavior unless the PR explicitly uses an alignment or foundation correction mode;
2. update all in-repository consumers in the same PR;
3. expose the accepted public API through the Material library entry point;
4. remove old files and exports;
5. update family/domain contracts, registries, Storybook, tests, snapshots, risk registration, and verification;
6. add or consolidate the canonical state matrix for each migrated component;
7. avoid permanent compatibility re-exports.

A mass move of all Material code is forbidden. Migration is demand-driven and begins with the foundation domains required by the Button pilot, followed by `MDButton`, `MDSwitch`, and one genuinely new component authored and tested directly in the library.
