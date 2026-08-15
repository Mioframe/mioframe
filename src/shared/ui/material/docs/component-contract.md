# Material family contract

## Decision

Each canonical Mioframe Material family is defined from official Material 3 Expressive before renderer integration or application migration.

The family contract is independent from current Mioframe consumers and from `@m3e/web`. The application adapts to the canonical Material API; the Material API is not shaped around legacy consumers or renderer vocabulary.

A family contract has five narrow owners:

```text
components/<family>/
  contract.ts
  tokens.css
  BEHAVIOR.md
  GUIDANCE.md
  SOURCES.md
```

These files are durable source-of-truth artifacts. Implementation reports, migration reports, and review reports are transient workflow output and are not persisted as parallel authorities.

## `contract.ts` — structural public API

`contract.ts` owns the renderer-independent Vue-facing Material contract:

- public props and their defaults;
- public value/state/variant/configuration types;
- public slots for Material content roles;
- public emits for consumer-observable intent or events;
- valid and invalid public combinations when TypeScript can express them clearly;
- concise TSDoc for semantics that a type alone cannot communicate.

Use explicit family types such as `MD<Component>Props`, `MD<Component>Slots`, and `MD<Component>Emits` (plus focused value/variant aliases where useful). The Vue implementation must consume these contract types directly through typed Vue APIs such as `defineProps`, `defineSlots`, and `defineEmits`; it must not restate the same public unions/interfaces inside the SFC as a second source of truth.

`contract.ts` is the canonical type source, not automatically a promise that every helper type is root-exported. Re-export only consumer-useful public types through the family/root entrypoints; keep implementation-only helpers private.

Derive the contract from official Material semantics and idiomatic Vue mechanics. Do not derive it from legacy Mioframe props, current consumer demand, m3e names, DOM implementation details, or speculative convenience APIs.

The supported contract should represent the official component surface applicable to the canonical web/Vue component. Do not omit an official option merely because Mioframe does not currently use it. Do not invent platform-specific or undocumented surface.

When official guidance is ambiguous enough that one public API cannot be derived reliably, record the conflict in `SOURCES.md` and block contract completion rather than guessing.

## `tokens.css` — public visual customization contract

`tokens.css` owns the public official component-token surface for the supported component contract.

- Public names use the official `--md-comp-*` semantic path, never renderer or legacy vocabulary.
- Defaults resolve through canonical `--md-sys-*` / `--md-ref-*` foundations where Material specifies such aliases.
- Include official component tokens for supported variants, parts and states even when the current application does not override them.
- Do not expose `--m3e-*`, `--md-private-*`, renderer defaults, or application `--app-*` tokens.
- Do not create a parallel TypeScript token enum, token registry, DSL, JSON catalogue, or compatibility alias layer.

`tokens.css` is both the executable public token contract and its canonical catalogue. Private m3e bridges belong to the component implementation or an owner-local private stylesheet, not to a second public token registry.

## `BEHAVIOR.md` — normative observable behavior

`BEHAVIOR.md` records what the component must observably do, not how Mioframe or m3e implements it.

Keep only official normative facts required to implement or verify the component:

```text
## Anatomy and content roles
## States and state precedence
## Interaction and input behavior
## Keyboard behavior
## Accessibility semantics
## Geometry and layout
## Motion
## Behavior conflicts or unknowns
```

The document may state fixed dimensions, spacing, touch targets, transitions, state combinations, accessible roles/states, and content ownership when Material specifies them.

Do not include m3e lifecycle details, Vue implementation strategy, test code, migration details, or product-specific behavior.

## `GUIDANCE.md` — consumer usage guidance

`GUIDANCE.md` tells a developer when and how to use the canonical Material component correctly.

Keep it concise:

```text
## Purpose
## When to use
## When not to use
## Variant and configuration guidance
## Content guidance
## Consumer accessibility responsibilities
## Related components and composition
```

Rules owned by the component itself belong in `BEHAVIOR.md`; responsibilities of the consumer belong here.

Do not duplicate prop tables, slot/event signatures, token catalogues, geometry tables, implementation notes, or migration instructions.

## `SOURCES.md` — provenance and conflicts

`SOURCES.md` is a compact source ledger so later workers can verify provenance without loading an encyclopedia-style design document.

Record:

- exact official Material routes/resources used;
- source/cache revision when available;
- date checked;
- relevant delegated official foundations or related-component sources;
- exact source conflicts, extraction gaps, or unresolved official facts.

Do not record renderer documentation, repository consumers, Git/PR state, implementation decisions, or workflow history.

## Contract extraction order

The contract worker establishes official Material truth before renderer or legacy influence:

1. resolve the official component/family;
2. read the applicable official Material sources;
3. write or refresh `SOURCES.md`;
4. derive `contract.ts`;
5. derive `tokens.css`;
6. derive `BEHAVIOR.md`;
7. derive `GUIDANCE.md`;
8. cross-check the five artifacts for contradictions and missing official surface.

The worker may parallelize independent official-source extraction when the runtime supports it and doing so reduces latency, but parallel subagents are not required. One contract worker owns final synthesis and consistency.

Do not inspect m3e implementation, legacy component code, or product consumers to decide the public contract. Existing family contract files may be read when refreshing that contract; project-wide Material foundation/token conventions may be read to preserve canonical naming and ownership.

## Contract completeness

Contract completion requires:

- API, tokens, behavior, guidance, and source provenance agree;
- no public term depends on m3e or legacy vocabulary;
- official defaults and supported variants/states are represented;
- content roles and event/state semantics are explicit enough for implementation;
- official token paths are represented without a duplicate registry;
- fixed geometry/motion/accessibility requirements needed for verification are explicit;
- no unresolved official-source ambiguity is silently guessed.

A contract is not implementation proof. `@m3e/web` compatibility is evaluated only after the canonical contract exists.

## Legacy staged artifacts

Existing family `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` files are legacy workflow evidence, not authorities under this contract-first model.

Do not bulk-rewrite untouched families only to remove those files. When a family is processed successfully through the new workflow, create the canonical contract files and remove its obsolete staged artifacts before final independent review.
