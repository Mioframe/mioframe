# Material library architecture

## Purpose

`src/shared/ui/material` is Mioframe's isolated Material 3 Expressive implementation library. It is a shared implementation tool, not a product layer, product domain, application shell, or independent product goal.

Product code may determine priority, compatibility obligations, and required scenarios. It must not determine internal Material ownership, dependency direction, or public APIs around one Mioframe workflow.

## Canonical boundary

```text
src/shared/ui/material/
  foundation/
  components/
  patterns/
  docs/
  index.ts
```

- `foundation`: proven cross-family Material contracts;
- `components`: official public Material component families;
- `patterns`: accepted reusable official Material compositions;
- `docs`: minimal durable architecture, sources, workflows, and roadmap;
- `index.ts`: curated public entry point after a real export exists.

Existing Material code outside this root is legacy. It may receive only a strict local repair that does not change ownership, API, semantics, anatomy, state, behavior, proof, or unrelated output. Material changes that exceed that boundary use the canonical component workflow and migrate the family.

A temporary legacy family contract may live under `docs/legacy/<family>.md` only while the active implementation still lives outside the canonical boundary. It moves to `components/<family>/README.md` during migration and the legacy contract is removed.

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

- Material production code does not import product layers, domains, routes, services, workers, stores, app shells, or project-specific presentation components.
- Foundation does not import components or patterns.
- A family does not deep-import another family's private files.
- Patterns use public component and foundation contracts only.
- External consumers use the curated Material public API when it exists.
- Internal Material modules use owning local entry points instead of the root barrel.

## Ownership

A component family owns its official Material surface:

- public API and invalid combinations;
- native semantics and accessibility;
- anatomy and DOM ownership;
- component-controlled state and lifecycle;
- token routing and final rendered-property ownership;
- family-specific browser behavior;
- owner-local stories, fixtures, and focused tests;
- consumer migration obligations when replacing a legacy family.

A foundation domain owns only a real cross-family contract. It must remain family-agnostic and must not exist merely to remove duplication or predict reuse.

Product and generic shared UI remain outside the Material boundary.

## Public API

Public APIs must be narrow, explicit, and based on official component semantics rather than one consumer.

Prefer:

- native HTML semantics;
- explicit props, emits, slots, attributes, and events;
- consumer-controlled semantic state;
- component-agnostic foundation inputs;
- exact official token meanings;
- one declaration owner and one final rendered-property owner.

Avoid:

- broad option bags;
- product adapters;
- universal bases;
- managers and registries;
- generic resolvers;
- speculative extension points;
- hidden copies of controlled state;
- unnecessary DOM nodes;
- permanent compatibility aliases.

## Workflow ownership

Component implementation has one owner:

- `docs/component-development.md` defines the staged workflow;
- `material-component` executes that workflow for exactly one family;
- `material-component-review` is a separate review-only path and never edits production code;
- `material-library-next` selects only the roadmap's one next family and invokes `material-component`;
- supporting Material, Vue, testing, and verification skills are loaded only at the stage that needs them.

Do not create another authoring flow, implementation plan, audit workflow, checklist, stage tracker, or family-state owner.

## Canonical records

The factual records are:

- current code and curated exports;
- family README files beside canonical implementation;
- temporary legacy contracts under `docs/legacy` until migration;
- foundation-domain README files only after a real owner exists;
- owner-local tests, stories, fixtures, and accepted snapshots;
- Git history and merged PRs;
- `docs/roadmap.md` for the active family, blocker, and one next action only.

Do not create registries, inventories, durable audits, checklists, progress ledgers, or duplicate status systems.

## Migration

Use one cohesive end-to-end migration by default:

1. resolve the family contract from official evidence and repository facts;
2. implement and prove one primary vertical slice;
3. complete the supported canonical family;
4. migrate affected consumers through the public API;
5. verify integration risks;
6. remove obsolete implementation, exports, tests, stories, snapshots, temporary contracts, and compatibility paths;
7. review the full resulting family and prepare visual acceptance evidence;
8. run final repository verification.

Split work only when a narrower result is complete, independently valid, and safer because of real blast radius, compatibility, or reviewability constraints.

## Simplicity gate

Before adding an abstraction, layer, file, state owner, foundation, pattern, or compatibility mechanism, prove that:

- an existing mechanism is insufficient;
- a current requirement needs it;
- ownership remains explicit;
- total complexity decreases;
- the result is easier to understand, test, and change.

If the simpler alternative cannot be shown to be insufficient, use it.