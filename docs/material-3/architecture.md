# Mioframe Material architecture

## Decision

Mioframe does not implement the complete Material 3 Expressive rendering and interaction system itself.

The canonical project-facing Material API is a Vue component library under:

```text
src/shared/ui/material
```

Each public `MD*` component exposes a stable Mioframe-owned Vue contract and may use the corresponding `@m3e/web` custom element as its private renderer.

```text
product layers
  → @shared/ui/material Vue components
  → private @m3e/web custom elements
```

## Goals

- provide predictable Vue components using current Material 3 Expressive concepts;
- delegate component rendering, interaction states, motion, ripple, focus, and internal accessibility implementation to m3e where its public contract is sufficient;
- isolate the application from m3e API changes and implementation details;
- preserve one canonical owner for each public Material component;
- migrate incrementally without maintaining two permanent implementations;
- keep wrappers explicit, local, and replaceable.

## Non-goals

- implementing every Material component or optional capability before a product scenario requires it;
- copying the complete m3e API into Vue props;
- exposing m3e custom elements directly to product code;
- building a generic wrapper generator, runtime registry, universal base component, or renderer abstraction before repeated implementation proves one necessary;
- making `m3e-theme` the global Mioframe theme owner without a separate architecture decision;
- patching m3e through private shadow DOM, undocumented properties, or copied internals.

## Sources of truth

The sources have different responsibilities:

1. Current official Material 3 Expressive documentation defines component purpose, vocabulary, supported design concepts, usage, visual requirements, interaction expectations, and accessibility intent.
2. The accepted family contract in `src/shared/ui/material/components/<family>/README.md` defines the supported Mioframe subset and public Vue API.
3. The pinned `@m3e/web` version and its public package documentation, Custom Elements Manifest, types, and exported CSS custom properties define the available renderer integration contract.
4. Current repository code, consumers, and tests define behavior that must be preserved during migration unless an explicit product decision changes it.

m3e is an implementation dependency, not Material design authority and not the public API owner.

## Ownership

### Mioframe Material library owns

- public `MD*` component names and exports;
- Vue props, emits, slots, `v-model`, defaults, and invalid combinations;
- the supported Material surface required by current scenarios;
- controlled-state ownership and event normalization;
- native form, navigation, attribute-forwarding, and application integration semantics;
- the public Material token surface exposed to consumers;
- migration of in-repository consumers and removal of obsolete owners;
- tests proving the Mioframe contract and the integration boundary;
- the decision to retain a legacy implementation when m3e cannot safely satisfy required scenarios.

### m3e owns internally

Only behavior provided through its documented public contract, including applicable:

- custom-element rendering and private DOM;
- interaction-state acquisition;
- ripple, focus treatment, and motion;
- internal accessibility implementation;
- component-local layout and visual rendering.

A wrapper must not claim that m3e owns behavior which Mioframe overrides or reconstructs.

### Product layers own

- user workflows and domain state;
- component choice and placement for a product surface;
- consumer content and labels;
- product-level adaptive composition;
- feature-specific loading, recovery, navigation, and persistence behavior.

## Public boundary

Product and generic shared UI code must use the public Vue components. Outside `src/shared/ui/material` it is forbidden to:

- import `@m3e/web`;
- render `m3e-*` tags;
- expose or consume `M3e*Element` types;
- depend on `--m3e-*` CSS custom properties;
- target m3e shadow DOM, parts, internal classes, or undocumented events;
- infer product state from m3e internal state.

The Material library must not leak these details through its own exports.

## Vue adapter contract

A public component maps Material and Vue concepts to one concrete m3e public contract.

The wrapper owns explicit mapping for applicable:

- Vue props to custom-element properties or attributes;
- Vue slots to named m3e slots;
- m3e events to Vue emits;
- consumer-controlled state to m3e state properties;
- native attributes and form/navigation behavior;
- public Mioframe tokens to private m3e CSS variables;
- project extensions such as loading when required by existing scenarios.

Do not forward the complete `$attrs` object blindly when the custom element has semantic or event-sensitive attributes. Critical properties and attributes remain explicit.

Controlled semantic state remains consumer-owned. The wrapper must prevent a hidden m3e state copy from drifting away from the Vue prop.

## Theme and tokens

Mioframe retains ownership of its accepted Material token layers:

- `--md-ref-*` reference tokens;
- `--md-sys-*` system and theme roles;
- accepted public `--md-comp-*` component tokens;
- `--app-*` project-specific tokens.

A component may map those values to documented `--m3e-*` variables inside its private implementation. `--m3e-*` is never a consumer-facing API.

Do not introduce a second global theme source. The existing Mioframe theme remains authoritative until a focused architecture decision proves that replacing it with an m3e theme owner is safer and simpler.

## Renderer viability

Before migrating a family, classify its renderer path:

- `ready` — public m3e APIs cover all required scenarios with a thin adapter;
- `blocked-upstream` — a required scenario depends on missing or defective public m3e behavior;
- `retain-legacy` — the current implementation remains the safer owner until the blocker is resolved;
- `migrating` — one active change owns wrapper creation and complete consumer migration;
- `migrated` — the Vue wrapper is the single canonical owner and the legacy implementation is removed.

Do not compensate for a blocked renderer with shadow-DOM access, copied m3e internals, broad CSS patches, duplicated interaction systems, or an undocumented compatibility layer. Retaining the current implementation is preferable to a fragile wrapper.

## Dependency policy

When implementation begins:

- pin `@m3e/web` to an exact version;
- import only required family entry points, not an all-components bundle;
- satisfy peer dependencies explicitly;
- keep dependency updates in focused PRs;
- inspect public API and manifest changes before updating;
- run contract, browser, visual, build, and representative consumer verification for affected wrappers.

Do not support multiple m3e versions or runtime renderer switching.

## Structure

Create only files required by current work:

```text
src/shared/ui/material/
  AGENTS.md
  README.md
  components/
    <family>/
      README.md
      <Component>.vue
      <Component>.test.ts
      <Component>.stories.ts
      index.ts
```

A family may import its m3e entry point directly. Shared integration helpers belong under the Material root only after at least two unrelated adapters prove the same concrete need and the helper reduces total complexity.

## Verification ownership

Test only contracts owned by Mioframe:

- Vue props, emits, slots, defaults, and controlled state;
- property, attribute, event, slot, and token mapping;
- native form and navigation integration;
- accessible names and state exposed through the public component;
- required browser behavior at the integration boundary;
- preserved representative consumers;
- visible output and regressions where material.

Do not duplicate m3e unit tests or test Lit/custom-element internals. A green test suite does not prove that m3e matches official Material guidance; source-backed review and visual comparison remain separate evidence.

## Migration completion

A family is migrated only when:

- its family contract is complete and renderer viability is `ready`;
- the Vue wrapper is the only public owner;
- affected consumers use the canonical public entry point;
- obsolete implementation, exports, tests, and compatibility paths are removed;
- unsupported capabilities and confirmed m3e deviations are explicit;
- applicable repository verification passes.

One family is migrated per focused PR unless inseparable official ownership and current consumer behavior justify a larger family boundary.