# Mioframe Material architecture

## Decision

Mioframe exposes a canonical Vue Material library under:

```text
src/shared/ui/material
```

```text
product layers
  → public Material-first Vue MD* components and token API
  → private @m3e/web renderers
```

Official Material 3 Expressive is the public contract authority. m3e is the preferred private implementation, not the API authority.

## Goal

Each `MD*` component is a demand-driven Vue representation of the official Material component:

- public names, concepts, options, values, defaults, states, combinations, behavior, visuals, accessibility, and supported tokens follow Material documentation;
- only the subset required by current Mioframe scenarios is implemented now;
- the selected subset remains compatible with later expansion toward the full Material contract;
- m3e is used maximally where its documented public surface implements that selected contract;
- missing selected Material behavior is implemented by the correct owner rather than omitted or exposed under renderer-specific vocabulary.

## Sources of truth

1. **Official Material documentation** defines the public component and token contracts.
2. **Current Mioframe consumers** select which part of those contracts is required now.
3. **The installed lockfile-resolved m3e package and observable browser behavior** define available private renderer capabilities and actual runtime behavior.
4. **The family contract matrix** records the accepted Material subset, Vue representation, m3e coverage, implementation owner, gaps, selected/deferred tokens, and proof.
5. **`token-api.md` plus canonical Material CSS declarations** define the supported public token surface and runtime values.
6. **`m3e-defects.md`** records confirmed incorrect m3e implementations and documentation mismatches, their stable `M3E-*` identities, lifecycle, mitigation, revalidation history, and removal triggers.

Upstream m3e repository source, tags, demos, and changelogs are supporting evidence only. Legacy Mioframe components and token files define migration evidence and current scenarios; they do not define the final public API when they differ from the accepted Material contract.

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

The matrix must cover all public props, values, slots, events, controlled state, defaults, native semantics, accessibility behavior, selected tokens, materially relevant visual/motion behavior, and required dependencies.

The matrix may group equivalent rows when that preserves exact ownership and decision clarity. It must not become a copied version of all Material documentation.

A confirmed `divergent` row must reference its stable `M3E-*` record in `m3e-defects.md`. A `missing` capability remains only in the family matrix unless installed-package and browser evidence later confirms an incorrect documented or implemented m3e contract.

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

### Material foundation owns

- supported `--md-ref-*` reference values;
- supported `--md-sys-*` foundations and standard theme roles;
- canonical CSS value grammar and defaults for those roles;
- default light/dark Material theme assignments;
- the foundation part of the public token catalogue.

Canonical runtime locations:

```text
src/shared/ui/material/foundation/tokens.css
src/shared/ui/material/foundation/theme.css
```

Application theme selection, persistence, and approved `--app-*` extensions remain outside the Material library.

### Component family owns

- the selected official `--md-comp-<family>-*` public token subset;
- family-local defaults and fallbacks;
- private mapping from supported Material tokens to documented m3e inputs;
- token rows in the family matrix and public catalogue;
- representative override proof.

Canonical runtime location:

```text
src/shared/ui/material/components/<family>/tokens.css
```

### Vue adapter owns

- Material-to-Vue API normalization;
- explicit typed property and attribute mapping;
- slot placement;
- event normalization;
- controlled-state synchronization;
- native web integration;
- narrow Mioframe-owned light DOM needed to complete selected Material behavior;
- public geometry normalization and host-level sizing required to represent the selected Material contract, provided it does not inspect or recreate the renderer's private geometry engine.

### m3e owns

- internal rendering and private DOM;
- private component defaults not selected as Mioframe public API;
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

A temporary renderer workaround is a narrow delivery bridge, not a transfer of the private renderer system into Mioframe. It must remain removable, exact-version-recorded, independently tested, absent from parents and public APIs, and linked to a confirmed `M3E-*` record.

Mioframe may contribute the underlying renderer fix to m3e and remove the workaround after consuming a corrected version. Do not create a parallel Material renderer inside the Vue wrapper.

## Token API and theme

The Material library owns the supported consumer-facing namespaces:

- `--md-ref-*` declared by Material foundation/theme;
- `--md-sys-*` declared by Material foundation/theme;
- the selected public subset of `--md-comp-*` declared by component families.

`--app-*` belongs outside the Material library. `--m3e-*` and `--md-private-*` remain private and are excluded from the public token catalogue.

`docs/token-api.md` is the complete human-facing list of supported tokens. Canonical CSS files are the executable runtime declarations. Both must change together.

Using m3e removes the need to reproduce every Material component token and renderer default. An official token becomes public only when it is selected, declared by the correct owner, mapped where required, catalogued, and verified. Other official tokens remain `deferred` in family matrices.

Do not create a TypeScript token registry, generic token DSL, global component-token owner, or public aliases for every m3e variable.

`src/shared/lib/md/tokens.css` is a temporary mixed-owner legacy source. The architecture-reset PR must split retained declarations into Material foundation, component families, and non-Material application ownership, update the global import, populate `token-api.md`, and remove the legacy file. It must not remain a compatibility alias or second source of truth.

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

Outside the correct token owner it is forbidden to:

- declare public Material foundation or component tokens as a second source of truth;
- place `--app-*` tokens in Material foundation;
- place one component family's `--md-comp-*` tokens in another family;
- expose owner-local `--md-private-*` bridges as public API.

## Type boundary

- Public Vue types are authored from the selected Material contract.
- Private mappings use exact family entry-point exports such as element classes and value aliases.
- Vue custom-element declarations derive from package types and contain framework glue only.
- Renderer type drift must fail type-check without changing the public Material API accidentally.

## Divergences and upstream defects

Keep missing capability and incorrect implementation distinct:

```text
m3e capability absent
  → family matrix: `missing`

m3e capability documented or implemented incorrectly
  → family matrix: `divergent` + stable `M3E-*` reference
  → `m3e-defects.md`
```

For each selected or closely deferred Material capability, the family matrix records:

- official Material expectation;
- exact installed m3e behavior and version;
- Vue exposure status;
- current requirement status;
- owner and decision: `accept`, `defer`, `wrapper-correction`, `temporary-renderer-workaround`, `m3e-fix`, `blocked`, or `source-conflict`;
- for a temporary workaround, risk, exact host-level input, independent proof, long-term owner `m3e-fix`, and removal trigger.

For every confirmed incorrect m3e implementation or documentation mismatch, `m3e-defects.md` additionally owns:

- the stable `M3E-*` identity;
- affected and last-revalidated versions;
- upstream and Mioframe statuses;
- installed-package and browser evidence and affected family matrices;
- current mitigation or blocker;
- correct upstream result and removal trigger;
- version-by-version revalidation history.

A different internal implementation is not a divergence when the observable Material result is equivalent. An unverified suspicion does not receive an `M3E-*` ID.

Every m3e version update must revalidate all non-resolved entries affecting consumed renderer families. An upstream fix remains `awaiting-upgrade` until the fixed version is consumed, the workaround or blocker is removed, and owned verification passes.

## Verification

Verification proves:

- the selected public Vue API matches the accepted Material matrix;
- public token declarations, `token-api.md`, owners, mappings, and CSS grammars agree;
- Material-to-m3e mappings are package-type checked;
- wrapper-owned behavior and public geometry normalization are correct;
- current consumers use the canonical component;
- visual baselines cover stable selected Material states with meaningful risk;
- selected renderer-owned interaction feedback is observable in browser or visual proof rather than inferred from host state or source inspection;
- every confirmed `divergent` matrix row links to a complete `M3E-*` record;
- final repository verification passes.

Private renderer implementation may be inspected in the installed package for diagnosis, but completion claims rely on owned observable browser proof and operator review. Proxy host assertions prove only the public host contract.

## Completion

A component migration is complete when:

- its Material–m3e–Vue matrix is accepted;
- every public `MD*` capability has an official Material source;
- non-Material requirements have explicit composition, separate-component, or extension decisions;
- selected Material capabilities are implemented by the correct owner;
- supported public tokens have canonical declarations and `token-api.md` entries;
- deferred Material surface, m3e divergences, and temporary exact-version workarounds are recorded with risks and removal triggers;
- every confirmed m3e defect has a linked complete `M3E-*` record with current statuses;
- one canonical Vue owner remains and consumers are migrated;
- type-check, focused tests, visual verification, and repository verification pass;
- operator accepts the final visual and motion behavior.

The architecture-reset milestone is not complete while the legacy mixed-owner token file remains the runtime source of truth.
