# Material library architecture

## Purpose

`src/shared/ui/material` is Mioframe's isolated Material 3 Expressive implementation library. It is a shared implementation tool, not a product layer, application shell, or independent product goal.

Product code determines required scenarios, compatibility obligations, and priority. It does not determine internal Material ownership, dependency direction, or public APIs around one domain workflow.

## Canonical boundary

```text
src/shared/ui/material/
  foundation/
  components/
  patterns/
  docs/
  index.ts
```

- `foundation` contains proven cross-family Material contracts;
- `components` contains official public Material families;
- `patterns` contains accepted reusable official Material compositions;
- `docs` contains minimal durable architecture, source, workflow, and roadmap records;
- `index.ts` is the curated public entry point after real exports exist.

Existing Material code outside this root is legacy ownership, not authority and not disposable by default. Correct it in place while exactly one active owner remains. Relocate only when the canonical owner can replace the legacy path in one complete valid change.

A temporary legacy family contract may live under `docs/legacy/<family>.md` and moves beside the canonical owner during relocation.

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

- Material production does not import product layers, domains, routes, services, workers, stores, app shells, or project-specific presentation components.
- Foundation does not import components or patterns.
- A family does not deep-import another family's private files.
- Patterns use public component and foundation contracts only.
- External consumers use the curated Material public API when the owner is ready.
- Internal Material modules use local owning entry points, not the root barrel.

Every shared dependency used by a family is classified as canonical Material, temporary legacy Material, project extension, or generic non-Material foundation. Repeated use does not make a Material component generic foundation.

## Ownership

A component family owns:

- public API, defaults, invalid combinations, and attributes;
- native, form, keyboard, event, and accessibility semantics;
- anatomy and DOM;
- semantic and transient state owned by the family;
- token, state, and rendered-property routing;
- family-specific geometry, responsive behavior, typography, RTL, text scaling, and motion;
- owner-local stories, fixtures, and proof;
- compatibility and consumer-migration obligations;
- project extensions explicitly attached to the family.

A foundation domain owns only a genuinely cross-family, family-agnostic contract. It must not exist merely to remove duplication or predict reuse.

## Decomposition

Map each concern to one owner with inputs, outputs, allowed dependencies, observable contract, primary proof, and co-location rationale.

- Public Vue components are thin composition roots.
- Deterministic normalization and state precedence use owner-local TypeScript when independently testable.
- Reactive browser lifecycle uses focused composables.
- Non-trivial visual contracts have explicit style and motion ownership.
- One stylesheet is valid only when its concerns genuinely change and are proved together.
- Do not split by line count, preserve monoliths by habit, or add wrappers and DOM merely for separation.

## Public API

Public APIs are narrow, explicit, and based on official semantics rather than one consumer or legacy shape.

Prefer native HTML semantics, explicit props/emits/slots/attributes/events, consumer-controlled semantic state, family-agnostic foundation inputs, exact token meanings, and one final rendered-property owner.

Avoid broad option bags, product adapters, universal bases, managers, registries, generic resolvers, speculative extension points, hidden controlled-state copies, unnecessary DOM, and permanent compatibility aliases.

Compatibility is evidence to plan migration, not authority to preserve a wrong contract.

## Convergence invariant

Existing implementation is editable current-state evidence. Preserve independently confirmed owners, correct misaligned owners through bounded complete units, block or narrow unresolved surface, and remove obsolete ownership after replacement.

The full sequence, classifications, correction priority, proof lanes, responsibility isolation, and recovery rules are owned only by [`component-development.md`](./component-development.md) and [`foundation-development.md`](./foundation-development.md). Executable stage responsibilities are owned by the corresponding `.agents/skills`.

## Durable records

The owning family or foundation README is the single current contract and workflow-state record. Exact implementation details remain owned by code and proof; do not mirror selectors, declarations, or runtime routes as a manually synchronized code ledger.

Do not create separate audits, registries, scorecards, checklists, or progress ledgers.

## Simplicity gate

Before adding an abstraction, layer, file, state owner, foundation, pattern, compatibility mechanism, or workflow role, prove that an existing mechanism is insufficient, a current requirement needs it, ownership remains explicit, total complexity decreases, and the result is easier to understand, test, and change.
