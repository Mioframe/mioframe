# Mioframe Material library

`src/shared/ui/material` is the canonical owner of the project-facing Material component API and all Material-specific architecture and workflow documentation.

The library exposes Vue `MD*` components based on current Material 3 Expressive concepts. A migrated component may use `@m3e/web` internally, but product consumers depend only on the Mioframe Vue contract.

Canonical policy:

- [`docs/architecture.md`](./docs/architecture.md);
- [`docs/component-adapter.md`](./docs/component-adapter.md);
- [`docs/component-tokens.md`](./docs/component-tokens.md);
- [`docs/roadmap.md`](./docs/roadmap.md).

Repository-level `docs/` remains product and project documentation. Material library policy must not be duplicated there.

## Boundary

Allowed inside this directory:

- public Vue Material components and explicitly approved inseparable families;
- family-local imports of required m3e entry points;
- explicit Vue-to-m3e property, event, slot, state, and token mapping;
- narrow shared m3e helpers only after unrelated adapters prove one necessary;
- library architecture, roadmap, family contracts, tests, stories, and curated public entry points.

Not allowed:

- product or domain behavior;
- m3e APIs exported to consumers;
- direct dependencies on features, entities, widgets, pages, or app modules;
- private shadow-DOM access or copied renderer internals;
- speculative wrapper frameworks, registries, generators, token DSLs, or universal base components.

Legacy component directories under `src/shared/ui/<Family>` remain valid production owners until their focused migration. Their current implementation notes remain beside the code until that migration extracts the accepted contract and removes the replaced owner.

## Intended structure

Create only artifacts required by active work:

```text
material/
  AGENTS.md
  README.md
  docs/
    README.md
    architecture.md
    component-adapter.md
    component-tokens.md
    roadmap.md
  index.ts                         # when the first canonical component is ready
  components/
    <family>/
      README.md                    # accepted target and mapping contract
      <Component>.vue
      <Component>.test.ts
      <Component>.stories.ts
      index.ts
```

A component may import its required `@m3e/web/<family>` entry point directly. Do not create an `internal/m3e` framework before two unrelated adapters prove an identical shared mechanism.

## Public API

The intended consumer import is:

```ts
import { MDButton } from '@shared/ui/material';
```

Rules:

- when product or generic shared UI consumes an official Material component, it imports the Mioframe Vue component from the curated Material entry point;
- native HTML and project-specific or generic shared UI remain valid when they are the correct owner;
- internal family code does not import the root barrel;
- renderer element classes, renderer events, private helpers, tests, and `--m3e-*` variables are not exported;
- public props, emits, slots, defaults, and tokens remain stable across m3e upgrades unless a deliberate Mioframe API change is approved.

## Theme and tokens

The accepted Mioframe token layers remain consumer-facing:

- `--md-ref-*`;
- `--md-sys-*`;
- accepted `--md-comp-*`;
- `--app-*` for explicit project extensions.

Family code may privately map those values to documented `--m3e-*` variables. Consumers must not set or read renderer variables.

The current Mioframe theme remains the global owner. `m3e-theme` is not installed as a second theme authority by default.

## Migration map

| Area                              | Current owner                         | Canonical owner                                                              | Current state                         |
| --------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------- |
| Existing public `MD*` components  | legacy `src/shared/ui/<Family>` paths | `material/components/<family>` after focused migration                       | renderer `unassessed`; owner `legacy` |
| Vue-to-m3e integration            | none                                  | component-local adapter first; shared helper only after both pilots prove it | `planned`                             |
| Public Material entry point       | none                                  | `@shared/ui/material`                                                        | `planned`                             |
| Reference/system tokens and theme | existing `src/shared/lib/md` owners   | unchanged until a focused architecture decision                              | `retained`                            |

## State model

Renderer viability:

- `unassessed` — the exact renderer version and required public integration contract are not verified;
- `ready` — every required scenario is supported by documented public m3e APIs;
- `blocked-upstream` — a required public renderer contract is missing, defective, or unstable.

Implementation ownership:

- `legacy` — the current component remains the production owner;
- `migrating` — one focused change owns adapter creation, consumer migration, and target removal;
- `migrated` — the canonical Vue adapter is the only public owner for the migration target.

`blocked-upstream` requires ownership to remain `legacy`. Retaining legacy is a decision derived from those two facts, not another status value.

## Verification minimum

Every public adapter requires a colocated `<Component>.test.ts` component-contract test. Browser, visual, representative-consumer, and production-build proof are added according to risk; all are mandatory for the `MDButton` and `MDSwitch` pilots.

## Current work

PR #162 owns the architecture reset only. It must not add `@m3e/web`, configure Vue custom elements, create a family contract, or change production Material components.

The next implementation milestone is the `MDButton`-only adapter pilot recorded in [`docs/roadmap.md`](./docs/roadmap.md).
