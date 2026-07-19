# Material library architecture

This document defines the physical boundary, dependency direction, public API, documentation ownership, and migration model of the Material 3 Expressive library.

## Canonical root

Everything owned specifically by the Material library lives under:

```text
src/shared/ui/material/
```

This includes production code, local support code, public entry points, foundations, official component families, accepted Material patterns, stories, fixtures, tests, documentation, roadmap, inventories, registries, audits, source-evidence policy, and review guidance.

No Material-owned policy or status document may live under the repository-level `docs/` directory. No sibling `shared/ui` directory may become a second Material owner.

## Purpose

The library is a shared implementation tool consumed by Mioframe. It is not a product layer and does not own product workflows, domain concepts, navigation, screen composition, persistence, or application state.

The boundary must remain:

- understandable without product-layer knowledge;
- independently developable through owner-local fixtures and Storybook;
- independently testable through library-owned contracts;
- consumable only through curated public APIs;
- free of reverse dependencies on product code;
- physically coherent, with code and documentation under one owner.

## Canonical structure

Create only artifacts required by accepted current work.

```text
src/shared/ui/material/
  AGENTS.md
  README.md
  index.ts                         # after a real public artifact exists

  docs/
    README.md
    adoption-plan.md
    library-roadmap.md
    library-architecture.md
    source-of-truth.md
    foundation-*.md
    component-*.md
    audits/
    ...                            # Material-owned policy and status only

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

The structure is an ownership map, not a requirement to pre-create empty directories, placeholder files, or generic frameworks.

## Library domains

### `docs`

Owns all durable Material-specific knowledge:

- official-source hierarchy and captured evidence policy;
- architecture and dependency rules;
- development workflow and roadmap;
- foundation and component registries;
- shared UI inventory and migration state;
- authoring, testing, Storybook, verification, review, and deviation policy;
- latest family compliance audits.

Repository-level `AGENTS.md` and `.agents/skills` may route execution into this documentation. They must not duplicate or independently redefine Material facts.

### `foundation`

Contains only proven cross-family Material contracts required by current work, such as:

- verified reference and system tokens;
- theme contexts;
- typography, shape, elevation, and motion roles;
- generic state layer, ripple, focus, and interaction acquisition;
- Material Symbols rendering;
- Material-facing overlay contracts.

Foundation must not own component tokens, component anatomy, semantic feature state, product layout, or hypothetical extension systems.

### `components`

Contains official public Material component families. A family owns its applicable:

- generic public API;
- native semantics and accessibility;
- anatomy and DOM ownership;
- controlled and browser-owned states;
- official component tokens and private routing;
- component-specific behavior, motion, and rendering;
- family documentation, stories, fixtures, and focused tests.

A family consumes accepted foundation contracts and must not recreate a cross-family concern locally.

### `patterns`

Contains a reusable composition only when:

- official Material guidance establishes the composition or relationship;
- the composition is reusable outside one product domain;
- ownership does not belong more clearly to a component family;
- it uses public component and foundation contracts;
- it can be documented and tested without product data.

Product screens, settings sections, domain empty states, navigation policy, feature dialogs, and workflow-specific arrangements stay outside the Material root.

## Dependency direction

The direction is one-way:

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

Rules:

- Material production code must not import entities, features, widgets, pages, panes, app shells, routes, services, workers, stores, or domain models.
- Material production code must not import project-specific or generic presentation components from sibling `shared/ui` modules.
- Material stories, tests, and fixtures must remain owner-local and generic.
- Foundation must not import components or patterns.
- A family must not deep-import another family's private files.
- Patterns use public component and foundation contracts only.
- Generic infrastructure must not depend on Material family knowledge.
- Product consumers must not deep-import private Material files.

A correctly owned generic low-level utility may be used directly. Do not create a Material wrapper merely to disguise a generic dependency.

## Public API

The external entry point is:

```text
@shared/ui/material
```

Create it only when a real public artifact can be exported honestly.

After it exists:

- product and project-specific shared UI import the curated root API by default;
- internal Material code imports the owning local public entry point, not the root barrel;
- private implementation, fixture, story, testing, and documentation files are not public API;
- every public export has one Material owner;
- public props, emits, slots, and tokens remain generic and source-backed rather than shaped around one Mioframe consumer.

A separate package, build, or publication pipeline is not required unless a current distribution or technical-isolation requirement proves it necessary.

## Development boundary

Library correctness is established inside the library before product integration is treated as complete:

```text
official evidence
→ accepted family or foundation contract
→ owner-local Storybook laboratory
→ complete vertical implementation slice
→ library-owned contract/browser/visual proof
→ complete supported library surface
→ external consumer migration
→ integration proof
→ obsolete-owner removal
```

Product needs may select priority and minimum supported official surface. They do not define internal ownership, introduce domain-shaped APIs, or substitute consumer behavior for library proof.

## Migration completion

A family migration is complete only when:

- the canonical Material owner is inside this root;
- the supported contract is complete and documented locally;
- required library-owned stories, fixtures, tests, and visual evidence exist;
- product consumers use the public API;
- external integration risks are verified separately;
- obsolete legacy owners, exports, tests, stories, and compatibility paths are removed;
- affected local docs, roadmap, inventory, registries, audits, and verification metadata are accurate;
- required independent review and operator visual acceptance are complete.

Temporary compatibility requires exact named consumers, no new usage, and a removal target. Permanent parallel ownership is forbidden.

## What remains outside

Only non-Material owners remain outside this root:

- generic browser, DOM, geometry, event, focus, teleport, and lifecycle infrastructure;
- repository-wide testing and build infrastructure;
- project-specific shared UI and adapters;
- product domain and workflow code;
- generic repository agent infrastructure that only routes into the Material boundary.

Anything that owns a Material-specific rule, status, audit, roadmap, source interpretation, component contract, foundation contract, story, fixture, test, or implementation belongs inside `src/shared/ui/material`.
