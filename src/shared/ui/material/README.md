# Mioframe Material library

`src/shared/ui/material` is the canonical owner of Mioframe’s project-facing Material Vue API, supported Material token API, private renderer integration, and Material-specific documentation.

```text
official Material documentation
  → complete family DESIGN.md
  → ready family ARCHITECTURE.md
  → canonical component implementation
  → application consumer migration
  → independent review
```

Official Material defines the complete public model. `@m3e/web` is a private implementation detail.

Canonical documents:

- [`docs/architecture.md`](./docs/architecture.md);
- [`docs/component-workflow.md`](./docs/component-workflow.md);
- [`docs/design-document.md`](./docs/design-document.md);
- [`docs/component-adapter.md`](./docs/component-adapter.md);
- [`docs/component-tokens.md`](./docs/component-tokens.md);
- [`docs/token-api.md`](./docs/token-api.md);
- [`docs/m3e-defects.md`](./docs/m3e-defects.md);
- [`docs/roadmap.md`](./docs/roadmap.md) — sole owner of current milestone status and next action.

## Family artifacts

Every official component family owns:

```text
components/<family>/DESIGN.md
components/<family>/ARCHITECTURE.md
components/<family>/IMPLEMENTATION.md
components/<family>/MIGRATION.md
components/<family>/REVIEW.md
components/<family>/README.md
```

Artifact roles:

- `DESIGN.md` — complete normalized official Material contract;
- `ARCHITECTURE.md` — demand-scoped Mioframe/Vue/m3e plan;
- `IMPLEMENTATION.md` — component implementation and proof handoff;
- `MIGRATION.md` — consumer migration and legacy removal;
- `REVIEW.md` — independent final compliance review;
- `README.md` — short navigation index only.

A missing, stale, blocked, or incomplete earlier artifact blocks all later stages. Current code, renderer artifacts, stories, tests, and family README are not substitutes.

`material-component <name>` runs exactly one next stage and stops. See `docs/component-workflow.md`.

## Public component API

Consumers import curated Vue components:

```ts
import { MDButton, MDLoadingIndicator } from '@shared/ui/material';
```

A public `MD*` component:

- uses official Material terminology selected by its ready architecture;
- exposes only current demand plus the minimum coherent surface;
- keeps deferred official capability expandable without renderer-shaped API;
- exposes no raw m3e tags, types, events, or CSS inputs;
- contains no non-Material behavior without an explicit architecture decision.

Vue props, emits, slots, refs, native mappings, and explicit dependency composition may represent Material semantics without adding product semantics.

## Public token API

The complete official component-token catalogue belongs in family `DESIGN.md`. Runtime selection belongs in family `ARCHITECTURE.md`.

Supported runtime namespaces are:

- selected `--md-ref-*` and `--md-sys-*` declarations under foundation/theme;
- selected official `--md-comp-*` declarations under the owning family.

`docs/token-api.md` is the supported consumer catalogue. Canonical CSS files are executable declarations.

```text
foundation/tokens.css
  → renderer-independent reference/system foundations

foundation/theme.css
  → standard palette and light/dark system-color assignments

components/<family>/tokens.css
  → architecture-selected family component tokens
  → private renderer mappings
```

`--app-*` belongs outside Material. `--m3e-*` and `--md-private-*` remain private. Mioframe does not reproduce every renderer default or every official component token in runtime CSS.

## Renderer boundary

Allowed inside this directory:

- all five family stage artifacts;
- public Material-first Vue adapters;
- foundation and standard theme declarations;
- selected family component tokens;
- family-local renderer imports and private mappings;
- package-derived renderer typing;
- approved wrapper corrections and controlled host-level workarounds;
- tests, stories, visual proof, defect records, and curated exports.

Not allowed:

- product/domain behavior or application-owned tokens;
- renderer API exported to consumers;
- private shadow-DOM access or copied renderer internals;
- duplicate renderer geometry, state-layer, ripple, focus, elevation, accessibility, or motion systems;
- global component-token ownership, duplicate public token owners, token DSLs, or exhaustive runtime Material/m3e copies;
- silent legacy non-Material extensions.

Repository enforcement rejects direct `@m3e/web` imports and raw `m3e-*` Vue elements outside this directory. `config/vueCustomElements.ts` is the exact compiler allow-list.

## Typing, proof, and completion

Public types come from the selected Material architecture. Private mapping and Vue custom-element glue derive from exact package-exported renderer types.

Architecture selects proof before implementation. Component tests own Vue mapping, browser tests own native/accessibility behavior, visual regression owns stable pixel presentation, migration tests own product scenarios, and review checks the full result.

Renderer-owned appearance is not inferred from source inspection, token presence, events, host state, or a story alone.

Final verification uses the exact branch/task scope required by root policy. Operator visual/motion acceptance is a separate gate and must not be fabricated by agents.

See `docs/roadmap.md` for current milestone state and next action.
