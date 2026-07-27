# Mioframe Material architecture

## Decision

Mioframe exposes a canonical Vue Material library under:

```text
src/shared/ui/material
```

```text
product layers
  → public Material-first Vue MD* components
  → private @m3e/web renderers
```

Official Material 3 Expressive is the public contract authority. m3e is the preferred private implementation, not the API authority.

## Goal

Each `MD*` component is a demand-driven Vue representation of the official Material component:

- public names, concepts, options, values, defaults, states, combinations, behavior, visuals, and accessibility follow Material documentation;
- only the subset required by current Mioframe scenarios is implemented now;
- the selected subset remains compatible with later expansion toward the full Material contract;
- m3e is used maximally where its documented public surface implements that selected contract;
- missing selected Material behavior is implemented by the correct owner rather than omitted or exposed under renderer-specific vocabulary.

## Sources of truth

1. **Official Material documentation** defines the public component contract.
2. **Current Mioframe consumers** select which part of that contract is required now.
3. **The exact lockfile-resolved m3e package** defines available private renderer capabilities and types.
4. **The family contract matrix** records the accepted Material subset, Vue representation, m3e coverage, implementation owner, gaps, and deferred surface.

Legacy Mioframe components define migration evidence and current scenarios. They do not define the final `MD*` API when they differ from Material.

## Demand-driven Material surface

Start with the full official Material component model, then classify each relevant capability:

- `implement-now` — required by a current consumer or needed for a coherent selected API;
- `defer` — official Material capability not required now;
- `not-material` — legacy or product requirement with no Material source, requiring a separate decision.

Do not implement the full Material catalogue merely for completeness. Do not let the m3e API decide what becomes public.

## Required Material–m3e–Vue matrix

Before implementation, the family README must include:

| Material contract and source | Required now and evidence | Public Vue API | m3e support | Owner | Decision | Verification |
| ---------------------------- | ------------------------- | -------------- | ----------- | ----- | -------- | ------------ |

The matrix must cover all public props, values, slots, events, controlled state, defaults, native semantics, accessibility behavior, selected tokens, and materially relevant visual/motion behavior.

The matrix may group equivalent rows when that preserves exact ownership and decision clarity. It must not become a copied version of all Material documentation.

## Public Vue API

The public API is Material-first and Vue-idiomatic:

```text
Material concept
  → Vue prop / slot / emit / v-model / ref / native mapping
  → private m3e property / slot / event / CSS input
```

Rules:

- use official Material terminology and semantics;
- keep public types independent from m3e types;
- map public values to package-exported m3e types at compile time;
- do not expose raw custom-element attributes, event objects, types, or CSS variables;
- do not preserve legacy naming when it conflicts with Material;
- do not create public options that have no Material contract without an explicit extension decision.

Framework adaptation such as Vue emits, `v-model`, slots, refs, and native HTML integration is allowed when it represents Material behavior without adding new product semantics.

## Implementation ownership

### Vue adapter owns

- Material-to-Vue API normalization;
- explicit typed property and attribute mapping;
- slot placement;
- event normalization;
- controlled-state synchronization;
- native web integration;
- narrow Mioframe-owned light DOM needed to complete selected Material behavior;
- public Material token mapping selected for current use;
- public geometry normalization and host-level sizing required to represent the selected Material contract, provided it does not inspect or recreate the renderer's private geometry engine.

### m3e owns

- internal rendering and private DOM;
- the private geometry engine and internal layout;
- state layer, ripple, focus, elevation, and motion;
- private accessibility implementation;
- documented renderer CSS inputs and defaults.

### Gap routing

When m3e does not fully implement a selected Material capability:

- use `wrapper-correction` for explicit Vue mapping, events, controlled state, native integration, public geometry normalization, or light-DOM composition that does not recreate renderer internals;
- use `temporary-renderer-workaround` only for a confirmed exact-version divergence that can be corrected through a host-level property, attribute, CSS custom property, or host dimension inside the canonical owner under the complete gate in `component-adapter.md`;
- use `m3e-fix` for the underlying private DOM, geometry engine, state-layer, ripple, focus, elevation, motion, or private accessibility defect;
- use `blocked` only when neither owner can deliver the selected Material contract safely.

A temporary renderer workaround is a narrow delivery bridge, not a transfer of the private renderer system into Mioframe. It must remain removable, exact-version-recorded, independently tested, and absent from parent adapters and public APIs.

Mioframe may contribute the underlying renderer fix to m3e and remove the workaround after consuming a corrected version. Do not create a parallel Material renderer inside the Vue wrapper.

## Non-Material requirements

A requirement absent from official Material is not automatically part of an `MD*` component, even when a legacy component or consumer already uses it.

Resolve it explicitly as:

1. composition in the consumer, feature, or widget;
2. a separate shared component without the `MD` prefix that composes Material primitives;
3. an exceptional documented `MD*` extension approved by an architecture decision.

The default is composition or a separate non-MD component. Compatibility migration must include the decision and consumer transition; it must not silently redefine the Material API.

## Boundary

Outside `src/shared/ui/material` it is forbidden to:

- import `@m3e/web`;
- render `m3e-*` tags;
- use renderer types or event objects;
- depend on `--m3e-*` variables;
- inspect m3e private DOM or internal state.

## Type boundary

- Public Vue types are authored from the selected Material contract.
- Private mappings use exact family entry-point exports such as element classes and value aliases.
- Vue custom-element declarations derive from package types and contain framework glue only.
- Renderer type drift must fail type-check without changing the public Material API accidentally.

## Tokens and theme

Mioframe owns verified Material namespaces:

- `--md-ref-*`;
- `--md-sys-*`;
- the selected public subset of `--md-comp-*`;
- `--app-*` only for separately approved non-Material extensions.

A public component token must use the official Material path and be selected by current need. A documented m3e variable remains private and does not automatically create a public token.

## Divergences

For each selected or closely deferred Material capability, record:

- official Material expectation;
- exact m3e behavior and version;
- Vue exposure status;
- current requirement status;
- owner and decision: `accept`, `defer`, `wrapper-correction`, `temporary-renderer-workaround`, `m3e-fix`, `blocked`, or `source-conflict`;
- for a temporary workaround, risk, exact host-level input, independent proof, long-term owner `m3e-fix`, and removal trigger.

A difference in internal implementation is not a divergence when the observable Material result is equivalent.

## Verification

Verification proves:

- the selected public Vue API matches the accepted Material matrix;
- Material-to-m3e mappings are package-type checked;
- wrapper-owned behavior and public geometry normalization are correct;
- current consumers use the canonical component;
- visual baselines cover stable selected Material states with meaningful risk;
- final repository verification passes.

Renderer-owned animation and private geometry implementation are verified by exact-version source inspection plus operator manual review. Proxy host assertions prove only the public host contract, not private renderer lifecycle or internal geometry.

## Completion

A component migration is complete when:

- its Material–m3e–Vue matrix is accepted;
- every public `MD*` capability has an official Material source;
- non-Material requirements have explicit composition, separate-component, or extension decisions;
- selected Material capabilities are implemented by the correct owner;
- deferred Material surface, m3e divergences, and temporary exact-version workarounds are recorded with their risks and removal triggers;
- one canonical Vue owner remains and consumers are migrated;
- type-check, focused tests, visual verification, and repository verification pass;
- operator accepts the final visual and motion behavior.
