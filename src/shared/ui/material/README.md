# Mioframe Material library

`src/shared/ui/material` is the canonical owner of the project-facing Material component API and all Material-specific architecture and workflow documentation.

The library exposes Vue `MD*` components based on Material 3 Expressive concepts. Migrated components may use `@m3e/web` privately; product code depends only on the Mioframe Vue contract.

Canonical policy:

- [`docs/architecture.md`](./docs/architecture.md);
- [`docs/component-adapter.md`](./docs/component-adapter.md);
- [`docs/component-tokens.md`](./docs/component-tokens.md);
- [`docs/roadmap.md`](./docs/roadmap.md).

Repository-level `docs/` remains product and project documentation. Material library policy is owned here.

## Boundary

Allowed inside this directory:

- public Vue Material components;
- family-local imports of required m3e entry points;
- package-derived renderer typing;
- explicit Vue-to-m3e property, event, slot, state, and active-token mapping;
- narrow Mioframe-required corrections for confirmed m3e/Material divergences;
- family contracts, tests, stories, and curated public exports.

Not allowed:

- product or domain behavior;
- m3e APIs exported to consumers;
- private shadow-DOM access or copied renderer internals;
- duplicate renderer ripple, focus, state-layer, elevation, or motion systems;
- speculative wrapper frameworks, registries, generators, token DSLs, or universal base components.

Legacy component directories remain production owners until focused migration.

## Supported surface

Each adapter covers:

1. current Mioframe consumer scenarios;
2. documented m3e capabilities that belong to the canonical Material component surface and can be exposed through thin typed mappings.

The library does not mirror every raw m3e field, recreate the complete Material token catalogue, or implement optional surface unsupported by both Mioframe and m3e.

Confirmed m3e differences from official Material guidance are recorded per family. Differences not required by Mioframe are upstream follow-up candidates, not automatic wrapper work.

## Public API

Consumers import from the curated entry point:

```ts
import { MDButton } from '@shared/ui/material';
```

Rules:

- official Material components use Mioframe Vue wrappers;
- native HTML and generic/project-specific shared UI remain valid where appropriate;
- family code does not import the root barrel;
- renderer classes, events, private helpers, and `--m3e-*` variables are not exported;
- public props, emits, slots, defaults, and intentionally accepted tokens remain stable across renderer upgrades unless deliberately changed.

## Theme and tokens

Consumer-facing layers are:

- `--md-ref-*`;
- `--md-sys-*`;
- intentionally accepted active `--md-comp-*` contracts;
- `--app-*` extensions.

A documented m3e variable does not automatically require a public Mioframe alias. Family code maps only active public component tokens and otherwise relies on existing Material system roles or documented renderer defaults.

The existing Mioframe theme remains global owner. `m3e-theme` is not a second theme authority.

## Renderer typing

Renderer element properties and value types come from the exact installed m3e family entry point. Vue ambient declarations contain only framework glue derived from package types. Renderer types do not leak through the public `MD*` API.

## Motion

m3e-owned animation is assessed through exact-version source inspection and operator manual testing. Automated tests verify only Mioframe-owned integration and publicly observable behavior; they do not use private DOM or proxy assertions to claim internal animation correctness.

## Migration map

| Area                            | Current owner                         | Canonical owner                                        | Current state                                                                             |
| ------------------------------- | ------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `MDButton`                      | `material/components/button`          | `material/components/button`                           | renderer `ready`; owner `migrating` until bounded correction and operator review complete |
| Other public `MD*` components   | legacy `src/shared/ui/<Family>` paths | `material/components/<family>` after focused migration | renderer `unassessed`; owner `legacy`                                                     |
| Shared m3e compiler integration | shared Vite/Vue configuration         | shared Vite/Vue configuration                          | established                                                                               |
| Public Material entry point     | `@shared/ui/material`                 | `@shared/ui/material`                                  | established                                                                               |
| Reference/system theme tokens   | existing foundation owners            | unchanged                                              | retained                                                                                  |

## Verification

Every public adapter requires a colocated component-contract test and final repository verification.

Browser, visual, consumer, token, theme, RTL, and dedicated build proof are selected by current Mioframe scenarios and changed integration risk. They are not mandatory merely because m3e exposes the capability.

The first canonical visual result and renderer-owned motion require operator review.

## Current work

PR #162 owns the architecture reset, shared m3e integration, and `MDButton` pilot.

The MDButton adapter, public export, consumer migration, package-derived typing, and current application behavior are implemented. Remaining repository-local work is bounded to removing unused token mappings, completing canonical direct m3e Button coverage, recording Material/m3e divergences and animation source assessment, and running verification before operator review.
