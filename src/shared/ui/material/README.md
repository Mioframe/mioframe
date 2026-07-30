# Mioframe Material library

`src/shared/ui/material` is the canonical owner of Mioframe’s project-facing Material Vue API, supported Material token API, private renderer integration, and Material-specific documentation.

```text
official Material documentation
  → complete family DESIGN.md
  → current product scenario
  → selected official Material component/token contracts
  → public Vue MD* API and supported CSS token API
  → private @m3e/web renderer
```

Official Material defines the complete public model. Each family `DESIGN.md` preserves that complete official model locally. Current consumers select the subset required now. The installed m3e package supplies private implementation where its consumed contract supports that subset.

Canonical documents:

- [`docs/architecture.md`](./docs/architecture.md);
- [`docs/design-document.md`](./docs/design-document.md);
- [`docs/component-adapter.md`](./docs/component-adapter.md);
- [`docs/component-tokens.md`](./docs/component-tokens.md);
- [`docs/token-api.md`](./docs/token-api.md);
- [`docs/m3e-defects.md`](./docs/m3e-defects.md);
- [`docs/roadmap.md`](./docs/roadmap.md) — sole owner of current status and next action.

## Family documentation

Every official component family owns:

```text
components/<family>/DESIGN.md
components/<family>/README.md
```

`DESIGN.md` is the complete normalized snapshot of official Material documentation. It includes all official variants, configurations, states, behavior, guidance, accessibility, geometry, related components, and component tokens, regardless of current Mioframe demand.

The family README is the demand-scoped Mioframe contract. It selects from `DESIGN.md`, records Vue API, m3e mapping, ownership, defects, proof, and deferred surface.

A missing, stale, blocked, or incomplete `DESIGN.md` blocks implementation completion. The README, current code, m3e artifacts, stories, and tests are not substitutes for the complete official design artifact.

## Public component API

Consumers import curated Vue components:

```ts
import { MDButton, MDLoadingIndicator } from '@shared/ui/material';
```

A public `MD*` component:

- uses selected official Material terminology and semantics from its `DESIGN.md`;
- exposes only current demand plus the minimum coherent adjacent surface;
- keeps deferred official capability expandable without renderer-shaped API;
- exposes no raw m3e tags, types, events, or CSS inputs;
- contains no non-Material behavior without an explicit ownership decision.

Vue props, emits, slots, refs, native mappings, and explicit dependency composition may represent Material semantics without adding product semantics.

## Public token API

The complete official component-token catalogue belongs in the family `DESIGN.md`.

Supported runtime consumer namespaces are:

- selected `--md-ref-*` and `--md-sys-*` declarations under foundation/theme;
- selected official `--md-comp-*` declarations under the owning family.

`docs/token-api.md` is the complete supported consumer catalogue. Canonical CSS files are executable declarations.

```text
foundation/tokens.css
  → renderer-independent reference/system foundations

foundation/theme.css
  → standard palette and light/dark system-color assignments

components/<family>/tokens.css
  → selected family component tokens
  → private renderer mappings
```

`--app-*` belongs outside Material. `--m3e-*` and `--md-private-*` remain private. Using m3e means Mioframe does not reproduce every renderer default or every official component token in runtime CSS.

## Family adapter contract

Every migrating or migrated component owns a Material–m3e–Vue matrix in its family README using the format and acceptance criteria from `docs/component-adapter.md`.

The matrix records demand evidence, exact `DESIGN.md` references, selected and deferred Material surface, explicit renderer status/mapping, ownership/decision, exact-version divergences, dependencies, state combinations, and proof.

A confirmed incorrect m3e contract is `divergent`, references a stable `M3E-*` record, and follows the controlled workaround/fix lifecycle. A capability absent from m3e remains `missing` in the family matrix.

Family READMEs own component implementation contracts and matrix facts. They do not duplicate the complete official design or milestone status, remaining blockers, and next actions from `docs/roadmap.md`.

## Renderer boundary

Allowed inside this directory:

- complete source-backed family `DESIGN.md` artifacts;
- public Material-first Vue adapters;
- foundation and standard theme declarations;
- selected family component tokens;
- family-local renderer imports and private mappings;
- package-derived renderer typing;
- narrow wrapper corrections and gated host-level workarounds;
- family adapter contracts, tests, stories, visual proof, and curated exports.

Not allowed:

- product/domain behavior or application-owned tokens;
- renderer API exported to consumers;
- private shadow-DOM access or copied renderer internals;
- duplicate renderer geometry, state-layer, ripple, focus, elevation, accessibility, or motion systems;
- global component-token ownership, duplicate public token owners, token DSLs, or exhaustive runtime Material/m3e catalogue copies;
- silent legacy non-Material extensions.

Repository enforcement rejects direct `@m3e/web` imports and raw `m3e-*` Vue elements outside this directory. `config/vueCustomElements.ts` is the exact compiler allow-list for selected raw renderer tags. `vue/no-undef-components` remains enabled globally; selected raw tags use only narrow described local exceptions because that rule cannot consume the compiler predicate.

## Typing and verification

Public types come from the selected Material contract. Private mapping and Vue custom-element glue derive from exact package-exported renderer types.

Tests prove the selected public contract through the faithful owner: Vue mapping in component tests, real native/accessibility behavior in browsers, and selected stable presentation through visual regression. Renderer-owned appearance is not inferred from source inspection, token presence, events, or host state alone.

Final verification uses the exact branch/task scope required by root policy. Because PR #162 changes production dependencies, its final completion gate is `pnpm verify:release`. Operator visual/motion review is manual during development; unresolved reported issues are tracked in the affected family README and `docs/roadmap.md`.

See `docs/roadmap.md` for the current milestone state, exact verification remainder, and next action.
