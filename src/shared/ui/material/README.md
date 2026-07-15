# Mioframe Material library

`src/shared/ui/material` is the canonical source boundary for Mioframe's Material implementation.

The library contains:

- cross-family Material foundation contracts;
- official public Material component families;
- reusable official Material compositions independent of product domains.

Canonical architecture:

- `docs/material-3/library-architecture.md`;
- `docs/material-3/foundation-architecture.md`;
- `docs/material-3/component-architecture.md`;
- `docs/material-3/component-testing.md`.

Policy and source-evidence documents remain under `docs/material-3`. This directory owns runtime/library artifacts and their local contracts.

## Ownership map

```text
material/foundation
  Cross-family Material tokens, roles, primitives, adapters, and verification-only helpers.

material/components
  Official public component families, blueprints, implementations, stories, and focused tests.

material/patterns
  Reusable official Material compositions required by current scenarios.
```

Generic platform utilities, project-specific shared UI, features, widgets, pages, and app behavior remain outside.

## Dependency direction

```text
shared/lib generic infrastructure
  ├─→ material/foundation
  ├─→ material/components
  └─→ material/patterns

material/foundation → material/components → material/patterns
material library → project-specific shared UI and product layers
```

Higher Material layers may use correctly owned generic utilities directly. Do not create foundation wrappers only to route generic DOM, event, geometry, lifecycle, teleport, or browser helpers.

Product imports inside the Material library, higher-to-lower dependency inversions, and private cross-family imports are forbidden.

## Public API

The intended project-facing entry point is:

```ts
import { MDButton } from '@shared/ui/material';
```

Do not create the root production `index.ts` until at least one real family or foundation artifact is migrated.

After it exists:

- product consumers use the root entry point by default;
- internal library modules use owning family/foundation entry points or correctly owned generic utilities;
- deep imports into implementation or testing files are forbidden.

## New implementation rule

- New official Material components are created under `components/<family>`.
- New Material foundation runtime/testing artifacts are created under `foundation/<domain>`.
- New Material patterns are created under `patterns/<pattern>` only after the pattern gate passes.
- Legacy Material directories may receive strict local repairs but no new Material ownership.

Every new public component includes:

- the complete canonical family blueprint;
- a colocated component-contract test;
- exactly one canonical Storybook `StateMatrix`;
- a Playwright visual regression for that matrix;
- real browser-behavior tests when applicable;
- pure helper/composable tests when applicable.

The matrix covers every distinct supported component-owned visible route. Non-visual state contracts remain in component/browser tests. Equivalent size, label, icon, and content combinations are not duplicated.

Empty placeholder directories/files are forbidden. A directory appears only with an accepted artifact.

Using an external generic utility does not transfer its ownership into Material.

## Physical migration map

This table tracks physical ownership only. Foundation/component alignment and verification status remain in their registries and family blueprints.

| Area                              | Current production owner                                                       | Canonical owner                                                                     | Migration status              |
| --------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ----------------------------- |
| Reference/system tokens and theme | `src/shared/lib/md/tokens.css`                                                 | `material/foundation/tokens` and `material/foundation/theme` as proven by migration | `legacy`                      |
| Typography utilities              | `src/shared/lib/md`                                                            | `material/foundation/typography`                                                    | `legacy`                      |
| State layer, ripple, and focus    | `src/shared/ui/State`                                                          | `material/foundation/interaction`                                                   | `legacy`                      |
| Material Symbols                  | `src/shared/ui/Icon`                                                           | `material/foundation/icon`                                                          | `legacy`                      |
| Material overlay contract         | `src/shared/ui/Overlay` plus generic teleport/outside-interaction dependencies | `material/foundation/overlay`; generic dependencies remain outside                  | `legacy`                      |
| Existing official `MD*` families  | existing `src/shared/ui/<LegacyFamily>` directories                            | `material/components/<family>`                                                      | `legacy`                      |
| New official Material family      | none                                                                           | `material/components/<family>`                                                      | create directly as `migrated` |
| Reusable Material patterns        | scattered or missing compositions                                              | `material/patterns/<pattern>` after the pattern gate passes                         | `legacy` or `missing`         |

Do not split a valid monolithic owner merely to match this table. Migration follows confirmed ownership and reviewable boundaries.

## Migration status meanings

- `legacy`: current code remains accepted for existing consumers but is not a template for new work;
- `migrating`: one focused PR owns relocation and all consumer/export/contract/test/map updates;
- `migrated`: the canonical owner is active, legacy paths are removed, the applicable component or foundation verification profile exists, and architecture validation is blocking.

A domain must not have parallel active legacy and canonical production owners without an explicit temporary migration contract naming consumers and removal target.

## Legacy additive changes

An existing file in a legacy foundation owner may receive a source-backed additive capability only when:

- it remains the single active owner;
- the change satisfies `foundation-additive` conditions;
- no new standalone owner is created at the legacy path;
- the registry records the delta and remaining migration status.

A new standalone runtime/testing artifact requires relocating the cohesive owner to the canonical domain first or in the same explicit migration.

## Migration rules

Each migration handles one cohesive family or foundation domain and must:

1. preserve behavior unless a stricter alignment/correction mode is explicit;
2. update all in-repository consumers;
3. expose the accepted public API through the Material library;
4. remove old files and exports;
5. update blueprints/contracts, registries, Storybook, tests, snapshots, risk registration, and this map;
6. add or consolidate the canonical matrix for migrated components;
7. avoid permanent compatibility re-exports.

A mass move is forbidden. Migration is demand-driven: minimum Button foundation domains, `MDButton`, `MDSwitch`, then a genuinely new component authored directly in the library.
