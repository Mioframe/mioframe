# Mioframe Material library

`src/shared/ui/material` is the complete canonical boundary for Mioframe's Material 3 Expressive implementation.

The library is isolated from product architecture. Product code consumes its public API; the library does not import product layers, domain models, routes, services, stores, app shells, or project-specific presentation components.

## Structure

```text
src/shared/ui/material/
  AGENTS.md
  README.md
  docs/
  foundation/
  components/
  patterns/
  index.ts        # after a real public export exists
```

- `docs` contains the minimal durable library policy and current roadmap;
- `foundation` contains proven cross-family contracts;
- `components` contains official public Material families;
- `patterns` contains accepted reusable official Material compositions;
- family/domain contracts, stories, fixtures, and focused tests stay beside their owner.

Generic platform utilities, project-specific shared UI, features, widgets, pages, app behavior, and product adapters remain outside.

## Documentation

Start with [`docs/README.md`](./docs/README.md). The canonical set is intentionally limited to:

- [`architecture.md`](./docs/architecture.md);
- [`sources.md`](./docs/sources.md);
- [`component-development.md`](./docs/component-development.md);
- [`foundation-development.md`](./docs/foundation-development.md);
- [`roadmap.md`](./docs/roadmap.md).

Do not create parallel registries, inventories, audits, checklists, progress ledgers, or duplicated workflow documents.

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

## Public API

The intended external entry point is:

```ts
import { MDButton } from '@shared/ui/material';
```

Create it only when a real public artifact can be exported honestly. External consumers use the curated root API; internal Material code uses owning local entry points; private files remain private.

## Development

`material-component` executes the only component implementation workflow, one family at a time:

```text
0 task lock
→ 1 resolved family contract
→ 2 primary vertical slice
→ 3 complete supported family
→ 4 consumer migration and old-owner removal
→ 5 full-result review and visual handoff
→ 6 final verification
```

Review-only assessment uses `material-component-review` and does not edit production files. The current family and one next action are recorded in [`docs/roadmap.md`](./docs/roadmap.md).