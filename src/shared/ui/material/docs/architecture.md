# Material library architecture

## Purpose

`src/shared/ui/material` is an isolated shared implementation library used by Mioframe. It is not a product layer and does not own product workflows, domain concepts, routing, persistence, application state, or screen composition.

The goal is a readable, source-backed Material 3 Expressive library that can be developed and proved through its own public contracts and owner-local Storybook fixtures.

## Canonical boundary

Everything specifically owned by Material lives under:

```text
src/shared/ui/material/
  AGENTS.md
  README.md
  docs/
  foundation/
  components/
  patterns/
  index.ts        # only after a real public export exists
```

This includes Material implementation, family and foundation contracts, Material-specific stories, fixtures, focused tests, policy, and roadmap.

Material-specific documentation must not live in repository-level `docs/` or sibling `shared/ui` directories. Repository `AGENTS.md` files and skills may route work here, but they do not own independent Material policy or status.

## Dependency direction

```text
Vue and browser platform
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

Rules:

- Material production code must not import entities, features, widgets, pages, panes, app shells, routes, services, workers, stores, or domain models.
- Material production code must not import project-specific presentation components from sibling `shared/ui` modules.
- Material stories, fixtures, and focused tests remain generic and owner-local; they must not import product layers or domain fixtures.
- Foundation must not import components or patterns.
- A component family must not deep-import another family's private files.
- Patterns use public component and foundation contracts only.
- Generic infrastructure must not depend on Material family knowledge.
- A correctly owned generic low-level utility may be used directly; do not add a Material wrapper merely to hide a generic dependency.

## Ownership

### Foundation

Owns only proven cross-family Material contracts required by current work. It must remain free of component-family and product knowledge.

### Component family

Owns its supported generic public API, native semantics, accessibility, anatomy, DOM ownership, states, component tokens, property routing, behavior, motion, rendering, family documentation, stories, fixtures, and focused tests.

Multiple components share a family only when official guidance or a current runtime contract establishes one cohesive owner. Similar appearance, repeated CSS, adjacent legacy paths, or hypothetical reuse are insufficient.

### Pattern

A pattern is created only when official Material guidance defines a reusable composition, it is independent of one product domain, ownership does not belong to a single family, and it can be documented and tested without product data.

### Product and project-specific shared UI

Own domain meaning, placement, workflows, adapters, content, and screen composition. Product needs may choose migration priority and required compatibility, but must not create domain-shaped Material APIs or hidden product behavior inside the library.

## Public API

External consumers use:

```ts
import { MDButton } from '@shared/ui/material';
```

Create the root entry point only when a real public artifact can be exported honestly.

After it exists:

- external consumers use the curated root API by default;
- internal Material modules use owning local public entry points, not the root barrel;
- private implementation, docs, fixtures, stories, and testing helpers are not public API;
- every export has one clear Material owner;
- public props, emits, slots, and tokens remain generic and source-backed.

## Canonical records

Keep facts with their implementation owner:

- library-wide architecture and workflow: this documentation set;
- canonical family contract: `components/<family>/README.md`;
- temporary legacy-family contract: `docs/legacy/<family>.md` until that family migrates into the canonical root;
- foundation contract: `foundation/<domain>/README.md` when a real domain owner exists;
- current implementation: code and public exports;
- proof: colocated tests, Storybook stories, browser specs, and accepted visual baselines;
- current work: `docs/roadmap.md`;
- history: Git and merged PRs.

Do not create a second state system through registries, inventories, durable audit reports, or repeated status tables.

## Migration boundary

Existing Material code outside this root is legacy, not a template for new ownership. A strict local repair may remain at a legacy path only when location, API, ownership, behavior, and visible contract do not change.

A complete family migration normally:

1. establishes the canonical family contract;
2. implements and proves the library owner;
3. migrates affected consumers through the public API;
4. verifies only integration risks introduced by migration;
5. removes obsolete files, exports, tests, stories, compatibility paths, and any temporary `docs/legacy/<family>.md` contract.

Temporary compatibility requires exact named consumers, no new usage, and a removal target. Permanent parallel ownership is forbidden.

## Simplicity constraints

Do not add placeholder directories, universal bases, runtime registries, generic state machines, broad option bags, generic test DSLs, validators driven by prose, or speculative extension points.

An additional abstraction is justified only when an existing mechanism is insufficient for a current requirement, ownership remains explicit, and total complexity decreases compared with the simplest viable local solution.
