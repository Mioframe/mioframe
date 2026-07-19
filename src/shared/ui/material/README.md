# Mioframe Material library

`src/shared/ui/material` is the complete canonical boundary for Mioframe's Material 3 Expressive implementation.

Everything Material-specific lives here:

- `docs` — architecture, official-source policy, roadmap, inventories, registries, audits, authoring, testing, Storybook, review, verification, and deviations;
- `foundation` — proven cross-family Material contracts;
- `components` — official public Material component families;
- `patterns` — accepted reusable official Material compositions;
- root and family contracts, public entry points, local support code, stories, fixtures, and focused tests.

Generic platform utilities, project-specific shared UI, features, widgets, pages, app behavior, and product adapters remain outside.

## Documentation

Start with:

- [`docs/README.md`](./docs/README.md);
- [`docs/library-architecture.md`](./docs/library-architecture.md);
- [`docs/adoption-plan.md`](./docs/adoption-plan.md);
- [`docs/library-roadmap.md`](./docs/library-roadmap.md);
- [`docs/source-of-truth.md`](./docs/source-of-truth.md);
- [`docs/foundation-architecture.md`](./docs/foundation-architecture.md);
- [`docs/component-architecture.md`](./docs/component-architecture.md);
- [`docs/component-testing.md`](./docs/component-testing.md).

No Material-owned document may live under repository-level `docs/` or a sibling shared UI owner.

## Dependency direction

```text
Vue / browser platform
        ↓
generic shared/lib infrastructure
        ↓
material/foundation
        ↓
material/components
        ↓
material/patterns
        ↓
project-specific shared UI and product layers
```

The product consumes the Material public API. Material production code, documentation fixtures, stories, and focused tests do not import product layers or product-specific shared UI.

Higher Material layers may use correctly owned generic low-level utilities directly. Do not create foundation wrappers merely to route generic behavior.

## Public API

The external entry point is:

```ts
import { MDButton } from '@shared/ui/material';
```

Do not create the root production `index.ts` until at least one real public family or foundation artifact can be exported honestly.

After it exists:

- external consumers use the curated root entry point by default;
- internal Material modules use their owning local entry points;
- private implementation, documentation, fixture, story, and testing files remain private;
- public contracts remain generic and source-backed rather than shaped around one Mioframe consumer.

## New work

- New official components: `components/<family>`.
- New cross-family foundations: `foundation/<domain>`, only when current work proves the need.
- New accepted official compositions: `patterns/<pattern>`, only after the pattern gate passes.
- New Material policy or status documentation: `docs/`.
- Family contracts: beside the owning implementation.
- Stories, fixtures, and focused tests: beside their Material owner.

Do not create placeholders, speculative frameworks, product adapters, or parallel Material owners.

## Physical migration map

| Area                              | Current production owner                            | Canonical owner                                                                     | Migration status              |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------- |
| Material policy and program docs  | `src/shared/ui/material/docs`                       | `src/shared/ui/material/docs`                                                       | `migrated`                    |
| Reference/system tokens and theme | `src/shared/lib/md/tokens.css`                      | `material/foundation/tokens` and `material/foundation/theme` as proven by migration | `legacy`                      |
| Typography utilities              | `src/shared/lib/md`                                 | `material/foundation/typography`                                                    | `legacy`                      |
| State layer, ripple, and focus    | `src/shared/ui/State`                               | `material/foundation/interaction`                                                   | `legacy`                      |
| Material Symbols                  | `src/shared/ui/Icon`                                | `material/foundation/icon`                                                          | `legacy`                      |
| Material overlay contract         | `src/shared/ui/Overlay` plus generic dependencies   | `material/foundation/overlay`; generic dependencies remain outside                  | `legacy`                      |
| Existing official `MD*` families  | existing `src/shared/ui/<LegacyFamily>` directories | `material/components/<family>`                                                      | `legacy`                      |
| New official Material family      | none                                                | `material/components/<family>`                                                      | create directly as `migrated` |
| Reusable Material patterns        | scattered or missing compositions                   | `material/patterns/<pattern>` after the pattern gate passes                         | `legacy` or `missing`         |

A domain must not have parallel permanent legacy and canonical owners. Temporary compatibility requires exact consumers, no new usage, and a removal target.

## Migration loop

```text
discovery
→ accepted library contract
→ owner-local Storybook laboratory
→ complete vertical slice
→ library-owned proof
→ complete supported family surface
→ external consumer migration and integration proof
→ obsolete-owner removal
→ review and operator visual acceptance
→ queue update
```

The active milestone and single next action are owned by [`docs/library-roadmap.md`](./docs/library-roadmap.md).
