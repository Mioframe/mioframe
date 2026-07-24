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
- delegate rendering, interaction states, motion, ripple, focus, and internal accessibility implementation to m3e where its public contract is sufficient;
- isolate the application from m3e API changes and implementation details;
- preserve one canonical public owner for each migrated Material component;
- migrate incrementally without permanent parallel implementations;
- keep adapters explicit, local, and replaceable.

## Non-goals

- implementing every Material component or optional capability before a product scenario requires it;
- copying the complete m3e API into Vue props;
- exposing m3e custom elements directly to product code;
- building a generic wrapper generator, runtime registry, universal base component, token DSL, or renderer abstraction before repeated implementation proves one necessary;
- making `m3e-theme` the global Mioframe theme owner without a separate architecture decision;
- patching m3e through private shadow DOM, undocumented properties, or copied internals;
- relocating legacy component implementations or their current implementation notes before their focused migration.

## Sources of truth

The sources have different responsibilities:

1. Current official Material 3 Expressive documentation defines component purpose, vocabulary, usage, visual requirements, interaction expectations, and accessibility intent.
2. The accepted family contract in `src/shared/ui/material/components/<family>/README.md` defines the supported Mioframe subset and public Vue API for a migration.
3. The exact selected `@m3e/web` version and its public package exports, declarations, Custom Elements Manifest, documentation, and exported CSS custom properties define the available renderer integration contract.
4. Current repository code, consumers, tests, stories, and component-local README files define behavior that must be preserved during migration unless an explicit product decision changes it.

m3e is an implementation dependency, not Material design authority and not the public API owner.

## Ownership

### Mioframe Material library owns

- public `MD*` component names and exports after migration;
- Vue props, emits, slots, `v-model`, defaults, and invalid combinations;
- the supported Material surface required by current scenarios;
- controlled-state ownership and event normalization;
- native form, navigation, attribute-forwarding, and application integration semantics;
- the public Material token surface exposed to consumers;
- migration of in-repository consumers and removal of obsolete owners;
- tests proving the Mioframe contract and integration boundary;
- the decision to migrate or retain the legacy implementation after renderer assessment.

### Legacy component directories own until migration

Existing components under `src/shared/ui/<LegacyFamily>` remain the production owner of their implementation, exports, tests, stories, and current implementation notes until their focused migration begins.

Their presence does not create a second canonical m3e adapter architecture. During migration, required behavior is extracted into the new family contract, consumers are moved, and the replaced legacy owner is removed atomically.

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

When product or generic shared UI consumes an official Material component, it must use the public Mioframe Vue component. Native HTML and project-specific or generic shared UI remain valid when they are the correct owner.

Outside `src/shared/ui/material` it is forbidden to:

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

## Renderer assessment and migration state

Renderer capability and implementation ownership are independent facts.

### Renderer viability

- `unassessed` — the exact renderer version and required public contract have not been verified;
- `ready` — documented public m3e APIs cover every required scenario with a thin adapter;
- `blocked-upstream` — a required scenario depends on missing, defective, or unstable public m3e behavior.

### Implementation ownership

- `legacy` — the existing component remains the production owner;
- `migrating` — one focused change owns adapter creation, consumer migration, and obsolete-owner removal;
- `migrated` — the canonical Vue adapter is the single public owner and the replaced legacy owner is removed.

A `blocked-upstream` assessment requires `legacy` ownership to remain. This is the retain-legacy decision; it is not a third renderer status.

Do not compensate for a blocked renderer with shadow-DOM access, copied m3e internals, broad CSS patches, duplicated interaction systems, or undocumented compatibility layers.

## Theme and tokens

Mioframe retains ownership of its accepted Material token layers:

- `--md-ref-*` reference tokens;
- `--md-sys-*` system and theme roles;
- accepted public `--md-comp-*` component tokens;
- `--app-*` project-specific tokens.

A component may map those values to documented `--m3e-*` variables inside its private implementation. `--m3e-*` is never a consumer-facing API.

Do not introduce a second global theme source. The existing Mioframe theme remains authoritative until a focused architecture decision proves that replacing it is safer and simpler.

## Dependency and version policy

The family contract selects the exact m3e version before production edits.

Selection must:

- inspect a current stable, non-prerelease version through primary package evidence;
- verify the required family export, declarations, manifest, peer dependencies, and documented integration surface;
- record the exact version and family entry point in the family README;
- pin the dependency without a range;
- stop with `blocked-upstream` when no verified version satisfies required scenarios.

Implementation must:

- import only required family entry points, not an all-components bundle;
- satisfy peer dependencies explicitly;
- inspect public API and manifest changes before later updates;
- avoid support for multiple m3e versions or runtime renderer switching.

## Vue custom-element integration ownership

Shared build configuration owns recognition of `m3e-*` tags as Vue custom elements consistently for application, tests, and Storybook builds.

Each family owns registration of only its required m3e family entry point through its implementation import. Do not create a global all-components registration module or runtime component registry.

The exact configuration is implementation work and must be recorded in the first family contract before production edits.

## Structure

Create only files required by current work:

```text
src/shared/ui/material/
  AGENTS.md
  README.md
  docs/
    README.md
    architecture.md
    component-adapter.md
    component-tokens.md
    roadmap.md
  index.ts                         # after the first canonical family is ready
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

Every public `MD*` adapter requires a colocated component-contract test covering its stable Vue contract and explicit integration mapping.

Additional proof follows changed risk:

- browser proof for custom-element upgrade, focus, keyboard, pointer/touch, form/navigation, cancellation, or lifecycle behavior changed or constrained by the adapter;
- visual regression for stable visible surfaces with material regression risk;
- representative consumer proof for migrated shared usage;
- production build proof for custom-element recognition, registration, and bundled family entry points.

Do not duplicate m3e unit tests or test Lit/custom-element internals. A green test suite does not prove that m3e matches official Material guidance; source-backed review and visual comparison remain separate evidence.

## Migration completion

A component is migrated only when:

- renderer viability is `ready`;
- implementation ownership is `migrated`;
- its family contract is complete;
- the Vue adapter is the only public owner for the migrated component;
- affected consumers use the canonical public entry point;
- obsolete implementation, exports, tests, and compatibility paths owned exclusively by the migrated component are removed;
- unsupported capabilities and confirmed m3e deviations are explicit;
- applicable focused checks and final repository verification pass.

One component or cohesive inseparable family is migrated per focused PR. The migration target must be explicit before implementation begins.