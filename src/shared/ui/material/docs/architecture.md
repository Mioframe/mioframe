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

## Implementation decomposition

Every non-trivial Material component, foundation domain, or pattern is implemented as documented responsibility owners, not as one file that accumulates every contract.

Before production edits, the owning README must map each applicable concern to one implementation owner, its inputs and outputs, dependencies, observable contract, and primary proof. Concerns include public composition, API normalization, native semantics, anatomy, semantic state, interaction lifecycle, token selection, rendered-property routing, styles, motion, foundation integration, stories, fixtures, and proof.

Use these rules:

- one responsibility with an independent reason to change or primary proof owner has one explicit implementation owner;
- co-locate responsibilities only when they change together, have the same dependencies and proof, and remain easier to understand together;
- do not create a file merely to reduce line count, remove superficial duplication, or predict reuse;
- do not retain a monolithic `.vue`, `.ts`, or stylesheet when independent responsibilities, proofs, or sources of truth are already present;
- do not add wrapper components or DOM nodes merely to obtain file-level separation.

Public Vue components are thin composition roots. They own the public Vue API, native semantic host, minimum required anatomy, and composition of internal owners. Deterministic normalization, invalid-combination handling, configuration selection, and semantic-state precedence belong in owner-local TypeScript modules when they are independently testable. Reactive browser or Vue lifecycle belongs in focused composables. Cross-family behavior belongs in foundation only when it is inherently family-agnostic.

A non-trivial visual contract uses an owner-local stylesheet separate from the Vue composition root. This is expected when the artifact has multiple configurations, states, token routes, rendered properties, motion routes, or substantial custom-property declarations. The stylesheet owns the ordered route from configuration to state resolution to final rendered-property application. Inline scoped styles remain acceptable only when the visual contract is short, linear, and clearer when colocated.

Do not prescribe one universal file tree or artifact count. The README records the actual decomposition and explains material co-location decisions so review can distinguish cohesion from accidental monoliths.

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

Component implementation has one external owner and three internal stage owners:

- `docs/component-development.md` defines the only component workflow and exit gates;
- `material-component` is the sole implementation orchestrator and the only owner allowed to select a family, choose the next stage, or update the roadmap;
- `material-component-contract` owns source-backed family decisions, implementation decomposition, proof map, and the ready family README before production edits;
- `material-component-implementation` owns initial executable proof, implementation units, the primary composed slice, representative consumer validation, complete supported family, Storybook, and proportional family proof;
- `material-component-adoption` owns remaining consumer migration and complete removal of obsolete ownership;
- `material-component-review` is review-only, may be invoked independently, and never fixes production files;
- `material-foundation` is invoked only for a proven cross-family prerequisite or focused standalone foundation work;
- supporting Material, Vue, testing, and verification skills operate only inside the owning stage.

Internal stage skills do not invoke each other, select another family, update the roadmap, or create independent plans.

Do not create another authoring flow, implementation plan, next-family orchestrator, audit workflow, durable checklist, stage tracker, or family-state owner. Structured contract sections, decomposition maps, proof maps, and ordered gates inside the canonical family or foundation README are required records, not prohibited parallel checklists.

## Canonical records

The factual records are:

- current code and curated exports;
- family README files beside canonical implementation;
- temporary legacy contracts under `docs/legacy` until migration;
- foundation-domain README files only after a real owner exists;
- owner-local tests, stories, fixtures, and accepted snapshots;
- Git history and merged PRs;
- `docs/roadmap.md` for the active family, blocker, and one next action only.

Do not create separate registries, inventories, durable audits, progress ledgers, or duplicate status systems.

## Migration

Use one cohesive end-to-end migration by default:

1. lock one family, objective, scenarios, and non-goals;
2. resolve the ready family contract, implementation decomposition, style ownership, proof map, and implementation order;
3. complete any proven cross-family foundation prerequisite;
4. create applicable initial failing proof before production edits;
5. implement documented units in order and compose one complete primary slice;
6. validate that slice in one representative real consumer;
7. complete only the supported canonical family;
8. migrate remaining consumers through the public API;
9. remove obsolete implementation, exports, tests, stories, snapshots, temporary contracts, aliases, and compatibility paths;
10. review the complete resulting family from an independent context and prepare visual acceptance evidence;
11. run final repository verification.

Split work only when a narrower result is complete, independently valid, and safer because of real blast radius, compatibility, or reviewability constraints. A split must not create two active owners or require promised later cleanup to make the merged state correct.

## Simplicity gate

Before adding an abstraction, layer, file, state owner, foundation, pattern, compatibility mechanism, or workflow skill, prove that:

- an existing mechanism is insufficient;
- a current requirement needs it;
- ownership remains explicit;
- total complexity decreases;
- the result is easier to understand, test, and change.

The simplest viable alternative is not necessarily the fewest files. A cohesive extraction is simpler when it gives an independently changing contract one clear owner, keeps the public composition root readable, and makes proof local. Conversely, separation is not justified when it only moves lines without clarifying ownership or proof.

A workflow skill is justified only when it owns a distinct responsibility and exit gate. Do not create separate skills for source lookup, Storybook, accessibility, tokens, visual acceptance, or testing when those concerns belong inside an existing stage.

If the simpler alternative cannot be shown to be insufficient, use it.
