# Mioframe Material library

`src/shared/ui/material` is the canonical owner of Mioframe’s project-facing Material Vue API, supported Material token API, and Material-specific documentation.

```text
current product scenario
  → selected official Material component/token contracts
  → public Vue MD* API and supported CSS token API
  → private @m3e/web renderer
```

Official Material defines the public model. Current consumers select the subset required now. The installed m3e package supplies private implementation where its consumed contract supports that subset.

Canonical documents:

- [`docs/architecture.md`](./docs/architecture.md);
- [`docs/component-adapter.md`](./docs/component-adapter.md);
- [`docs/component-tokens.md`](./docs/component-tokens.md);
- [`docs/token-api.md`](./docs/token-api.md);
- [`docs/m3e-defects.md`](./docs/m3e-defects.md);
- [`docs/roadmap.md`](./docs/roadmap.md) — sole owner of current status and next action.

## Public component API

Consumers import curated Vue components:

```ts
import { MDButton } from '@shared/ui/material';
```

A public `MD*` component:

- uses selected official Material terminology and semantics;
- exposes only current demand plus the minimum coherent adjacent surface;
- keeps deferred official capability expandable without renderer-shaped API;
- exposes no raw m3e tags, types, events, or CSS inputs;
- contains no non-Material behavior without an explicit ownership decision.

Vue props, emits, slots, `v-model`, refs, and native mappings may represent Material semantics without adding product semantics.

## Public token API

Supported consumer namespaces are:

- selected `--md-ref-*` and `--md-sys-*` declarations under foundation/theme;
- selected official `--md-comp-*` declarations under the owning family.

`docs/token-api.md` is the complete consumer catalogue. Canonical CSS files are executable declarations.

```text
foundation/tokens.css
  → renderer-independent reference/system foundations

foundation/theme.css
  → standard palette and light/dark system-color assignments

components/<family>/tokens.css
  → selected family component tokens
  → private renderer mappings
```

`--app-*` belongs outside Material. `--m3e-*` and `--md-private-*` remain private. Using m3e means Mioframe does not reproduce every renderer default or official component token.

## Family contract

Every migrating or migrated component owns a Material–m3e–Vue matrix in its family README using the format and acceptance criteria from `docs/component-adapter.md`.

The matrix records demand evidence, selected and deferred Material surface, explicit renderer status/mapping, ownership/decision, exact-version divergences, dependencies, and proof.

A confirmed incorrect m3e contract is `divergent`, references a stable `M3E-*` record, and follows the controlled workaround/fix lifecycle. A capability absent from m3e remains `missing` in the family matrix.

## Boundary

Allowed inside this directory:

- public Material-first Vue adapters;
- foundation and standard theme declarations;
- selected family component tokens;
- family-local renderer imports and private mappings;
- package-derived renderer typing;
- narrow wrapper corrections and gated host-level workarounds;
- family contracts, tests, stories, visual proof, and curated exports.

Not allowed:

- product/domain behavior or application-owned tokens;
- renderer API exported to consumers;
- private shadow-DOM access or copied renderer internals;
- duplicate renderer geometry, state-layer, ripple, focus, elevation, accessibility, or motion systems;
- global component-token ownership, duplicate public token owners, token DSLs, or full Material/m3e catalogue copies;
- silent legacy non-Material extensions.

## Typing and verification

Public types come from the selected Material contract. Private mapping and Vue custom-element glue derive from exact package-exported renderer types.

Tests prove the selected public contract through the faithful owner: Vue mapping in component tests, real native/accessibility behavior in browsers, and selected stable presentation through visual regression. Renderer-owned appearance is not inferred from source inspection, token presence, events, or host state alone.

Final verification uses the exact branch/task scope required by root policy. Operator visual/motion review is manual during development; unresolved reported issues are tracked in the affected family README and `docs/roadmap.md`.

## Current inventory

| Area | Current state |
| --- | --- |
| `MDButton` | m3e-backed pilot in correction pending consumer loading alignment |
| `MDLoadingIndicator` | canonical dependency adapter in verification |
| Other public `MD*` components | legacy-owned until focused migration |
| Shared m3e integration | established; automated external boundary guard pending |
| Confirmed m3e defect registry | established |
| Public component entry point | established |
| Foundation/theme runtime owners | established |
| Public token catalogue | established and populated |

See `docs/roadmap.md` for the exact correction scope and next action.
