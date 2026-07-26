# Mioframe Material architecture

## Decision

Mioframe exposes a canonical Vue Material library under:

```text
src/shared/ui/material
```

Each public `MD*` component may use the corresponding `@m3e/web` custom element as its private renderer.

```text
product layers
  → @shared/ui/material Vue components
  → private @m3e/web custom elements
```

Mioframe does not reimplement the complete Material 3 Expressive rendering system.

## Goals

- provide stable Vue components using canonical Material concepts;
- cover current Mioframe scenarios;
- expose documented m3e capabilities that fit the canonical component without custom renderer reconstruction;
- isolate product code from m3e implementation details and API drift;
- use package-exported m3e types at compile time;
- record m3e differences from official Material guidance;
- correct only differences that Mioframe actually requires and that can be fixed safely in a thin wrapper;
- keep one canonical public owner per migrated component.

## Non-goals

- implementing optional Material surface unsupported by both Mioframe and m3e;
- copying the complete m3e API into Vue;
- recreating the full Material component-token catalogue;
- duplicating m3e rendering, ripple, focus, state-layer, elevation, or motion systems;
- proving private renderer animation through proxy automated assertions;
- exposing m3e elements, types, CSS variables, or private DOM to product code;
- building a generic wrapper framework before repeated concrete need exists.

## Sources of truth

1. Official Material 3 Expressive documentation defines intended component behavior, visuals, and accessibility.
2. Current Mioframe consumers define required application scenarios and compatibility constraints.
3. The exact lockfile-resolved `@m3e/web` package defines the available private renderer surface through exports, declarations, element types, manifest, documentation, CSS variables, and implementation source where renderer-owned behavior must be assessed.
4. The family README defines the accepted public Vue surface, selected m3e surface, known divergences, and wrapper corrections.

m3e is an implementation dependency, not Material authority and not the public API owner.

## Supported surface

For each component, the supported surface is the minimum complete union of:

- current Mioframe scenarios;
- documented m3e capabilities that map directly to canonical Material/Vue concepts.

This does not mean mirroring every raw m3e field. The adapter exposes only a coherent canonical Vue API.

Capabilities missing from m3e are implemented in the wrapper only when:

- Mioframe needs them now;
- the correction is narrow and explicit;
- it can be implemented through documented public m3e APIs or Mioframe-owned light DOM;
- it does not duplicate the renderer's internal system.

## Ownership

### Mioframe Material library owns

- public `MD*` names and exports;
- Vue props, emits, slots, defaults, and controlled state;
- current application behavior and project extensions;
- native integration constrained or normalized by the adapter;
- accepted public token contracts;
- consumer migration and obsolete-owner removal;
- classification and documentation of m3e divergences;
- wrapper corrections required by Mioframe;
- tests for Mioframe-owned behavior.

### m3e owns internally

When provided through documented public contracts:

- rendering and private DOM;
- state-layer, ripple, focus, elevation, and motion;
- internal accessibility implementation;
- component-local layout and visual behavior;
- documented renderer CSS inputs and defaults.

The wrapper must not reconstruct these systems merely to reproduce old implementation details.

### Product layers own

- workflows and domain state;
- content and labels;
- component placement and composition;
- feature-specific loading, recovery, navigation, and persistence behavior.

## Public boundary

Outside `src/shared/ui/material` it is forbidden to:

- import `@m3e/web`;
- render `m3e-*` tags;
- use `M3e*Element` types;
- depend on `--m3e-*` variables;
- inspect m3e shadow DOM or internal state.

The public `MD*` API must not leak renderer-specific types or events.

## Vue adapter contract

A wrapper normally owns only:

- explicit typed property and attribute mapping;
- named slot placement;
- event normalization;
- controlled-state synchronization;
- native behavior required by Mioframe;
- current project extensions;
- active public token mapping;
- narrow corrections for Mioframe-required m3e divergences.

Do not forward all `$attrs` blindly when semantic properties or events require explicit ownership.

## Renderer type boundary

The exact m3e family entry point owns private renderer element and value types.

- Use type-only imports from `@m3e/web/<family>`.
- Keep Mioframe public prop types independently defined.
- Require every mapped value to satisfy the package-exported renderer type.
- Derive Vue custom-element typing from exported classes, aliases, or `HTMLElementTagNameMap`.
- Do not maintain handwritten mirrors when package types exist.

## m3e divergence policy

Compare official Material guidance with the selected supported m3e surface.

For each confirmed divergence record:

- Material expectation;
- exact m3e behavior and version;
- whether Mioframe currently requires the expectation;
- decision: accept, wrapper correction, upstream follow-up, or blocker.

Use these rules:

- a difference not required by Mioframe is documented for possible m3e work but does not expand the adapter;
- a required difference may be fixed in the wrapper only through a minimal public-boundary correction;
- a required difference that needs private DOM or duplicated renderer internals is an upstream blocker;
- equivalent observable behavior implemented differently is not a divergence.

## Theme and tokens

Mioframe retains ownership of:

- `--md-ref-*` reference values;
- `--md-sys-*` theme roles;
- intentionally accepted active `--md-comp-*` contracts;
- `--app-*` project extensions.

A documented m3e variable is private and does not automatically require a Mioframe component-token alias.

Prefer direct system-role semantics when m3e already implements them. Add a public `--md-comp-*` route only when a current consumer uses it or Mioframe intentionally documents it as supported API. Do not copy all m3e defaults into a parallel theme.

## Motion verification

Renderer-owned animation is assessed differently from Mioframe-owned behavior.

- Inspect the exact installed m3e implementation source to confirm state transitions, interruption handling, and reduced-motion handling.
- Verify that the wrapper does not disable or replace the renderer implementation.
- Use operator manual testing for actual animation quality and timing.
- Do not use `:active`, host screenshots, or private DOM inspection as false proof of internal animation.

Automated tests may verify public input behavior or wrapper-owned state, but only claim what they directly observe.

## Verification ownership

Every adapter requires:

- package-derived type-check;
- component-contract tests for the public Vue boundary;
- focused browser tests for current user/native scenarios affected by the adapter;
- stable visual baselines for Mioframe-visible output with meaningful regression risk;
- final repository verification.

Additional theme, RTL, token, consumer, or build proof is required only when Mioframe customizes that boundary, a current scenario depends on it, or final verification does not already cover it.

Do not duplicate m3e or Lit tests.

## Migration state

Renderer viability:

- `unassessed` — exact required surface is not verified;
- `ready` — the resolved supported surface is available through documented m3e APIs plus allowed thin corrections;
- `blocked-upstream` — a Mioframe-required contract cannot be delivered safely.

Implementation ownership:

- `legacy` — existing component remains production owner;
- `migrating` — focused migration is incomplete;
- `migrated` — one canonical adapter owns the component and all repository-local work within the resolved scope is complete.

Operator visual and motion acceptance may remain after repository-local work and may be reported as the sole `partial` remainder.

## Structure

```text
src/shared/ui/material/
  AGENTS.md
  README.md
  docs/
    architecture.md
    component-adapter.md
    component-tokens.md
    roadmap.md
  index.ts
  components/
    <family>/
      README.md
      <Component>.vue
      <Component>.test.ts
      <Component>.stories.ts
      index.ts
```

Create only files required by current work. Shared adapter helpers require repeated concrete need across unrelated components.