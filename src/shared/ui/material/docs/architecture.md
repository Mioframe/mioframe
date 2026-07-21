# Material library architecture

## Purpose

`src/shared/ui/material` is Mioframe's isolated Material 3 Expressive implementation library. It is a shared implementation tool, not a product layer or application shell.

Product code determines required scenarios and priority. It does not determine internal Material ownership, dependency direction, or public APIs.

## Canonical boundary

```text
src/shared/ui/material/
  foundation/
  components/
  patterns/
  docs/
  index.ts
```

- `foundation` contains proven cross-family contracts;
- `components` contains official public Material families;
- `patterns` contains accepted reusable Material compositions;
- `docs` contains minimal architecture, token, source, workflow, and roadmap records;
- `index.ts` is the curated public entry point after owners are ready.

Existing Material code outside this root is legacy ownership, not authority. Correct it while one active owner remains; relocate only when the canonical owner can replace it completely.

## Dependency direction

```text
Vue and browser platform
→ generic shared/lib infrastructure
→ material/foundation
→ material/components
→ material/patterns
→ project-specific UI
```

Material production does not import product layers or legacy Material owners. Foundation does not import components/patterns. Families do not deep-import another family's private files. External consumers use the curated public API only when the owner is ready.

Every dependency used by a family is classified as canonical foundation, canonical family, temporary legacy Material, project extension, or generic non-Material foundation. Reuse alone does not make a component a foundation.

## Dependency closure

A family is not ready merely because its files are under `material/components`.

Before export, adoption, or legacy replacement, every dependency required by the supported surface must resolve to exactly one ready canonical foundation, official family public contract, generic foundation, or explicit Mioframe extension owner.

Temporary legacy ownership, missing reference/system tokens, unowned shared behavior, defective dependencies, private cross-family imports, hidden fallbacks, cycles, or parallel owners block closure.

A family-agnostic cross-family gap routes through the smallest complete `material-foundation` prerequisite. Another official component remains a separate family prerequisite. Required prerequisites stay inside the caller's orchestration and return automatically.

A retained legacy entry point may forward to the canonical owner but cannot keep a parallel implementation.

## Ownership

A component family owns its public API, semantics, accessibility, anatomy/DOM, family state, component tokens, private routing, rendered properties, geometry, typography, RTL, motion, local stories/proof, extensions, compatibility, and consumer migration.

A foundation domain owns only a genuinely cross-family family-agnostic contract. It does not exist merely to remove duplication or predict reuse.

Reference/system token ownership, component-token placement, extension namespaces, private routing, graph direction, and verification are defined by [`tokens.md`](./tokens.md).

## Decomposition and public API

Map each concern to one owner with inputs, outputs, allowed dependencies, observable contract, proof, and co-location rationale.

Public Vue components are thin composition roots. Deterministic normalization may use owner-local TypeScript; reactive browser lifecycle uses focused composables. Token values and implementation routing/styles remain separate when they have distinct ownership.

Prefer native semantics, explicit props/emits/slots/events, consumer-controlled state, narrow foundation inputs, exact token meanings, and one rendered-property owner.

Avoid broad option bags, product adapters, universal bases, managers, registries, generic resolvers, speculative extension points, hidden controlled-state copies, unnecessary DOM, ambiguous token namespaces, and permanent compatibility aliases.

## Convergence invariant

Existing code, tests, stories, consumers, and snapshots are editable evidence. Preserve confirmed owners, correct the smallest complete highest-priority gap, close dependencies before adoption, and remove obsolete ownership after replacement.

The executable process is owned by `material-component`, `material-foundation`, and their bounded stage/review skills.

## Durable records

Owner README files store only durable supported surface, API, semantics, ownership, token/style/motion contracts, extensions, unsupported behavior, compatibility, and proof obligations.

Current stage, correction unit, prerequisite stack, backlog, review results/history, shell output, commit narratives, and future passes are transient execution state and must not be persisted in owner documentation.

`docs/roadmap.md` stores only the active family, alignment status, exact external blocker, and one next action. Code and proof own exact implementation details.

## Simplicity gate

Before adding an abstraction, layer, file, state owner, foundation, pattern, compatibility mechanism, or workflow role, prove an existing mechanism is insufficient, a current requirement needs it, ownership remains explicit, total complexity decreases, and the result is easier to understand, test, and change.