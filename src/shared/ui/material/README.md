# Mioframe Material library

`src/shared/ui/material` is the canonical owner of the project-facing Material component API and Material-specific architecture documentation.

```text
current product requirement
  → selected official Material contract
  → public Vue MD* API
  → private @m3e/web renderer
```

Official Material owns the public component model. Current consumers select the subset required now. m3e supplies as much of the private implementation as its documented exact-version contract supports.

Canonical policy:

- [`docs/architecture.md`](./docs/architecture.md);
- [`docs/component-adapter.md`](./docs/component-adapter.md);
- [`docs/component-tokens.md`](./docs/component-tokens.md);
- [`docs/m3e-defects.md`](./docs/m3e-defects.md);
- [`docs/roadmap.md`](./docs/roadmap.md).

## Public API

Consumers import only curated Vue components:

```ts
import { MDButton } from '@shared/ui/material';
```

A public `MD*` component:

- uses official Material names, concepts, options, values, defaults, states, behavior, and accessibility semantics;
- implements only the subset selected by current need;
- remains compatible with later expansion toward deferred Material surface;
- exposes no raw m3e vocabulary, type, event, slot, or CSS variable;
- contains no non-Material capability without a separate architecture decision.

Vue props, emits, slots, `v-model`, refs, and native mappings may adapt Material semantics to Vue without adding new product semantics.

## Required family contract

Every migrated component owns a Material–m3e–Vue matrix in its family README:

| Material contract | Required now | Public Vue API | m3e support | Owner | Decision |
| ----------------- | ------------ | -------------- | ----------- | ----- | -------- |

The matrix distinguishes selected Material API, deferred Material API, renderer gaps, wrapper corrections, m3e fixes, and non-Material requirements.

Confirmed incorrect m3e implementations or documentation mismatches use `divergent`, reference a stable `M3E-*` ID, and link to `docs/m3e-defects.md`. A capability that m3e does not implement remains `missing` only in the family matrix.

## Boundary

Allowed inside this directory:

- public Material-first Vue components;
- family-local m3e imports;
- package-derived renderer typing;
- explicit Material-to-Vue-to-m3e mappings;
- narrow wrapper corrections for selected Material behavior;
- gated exact-version host-level workarounds linked to `M3E-*` records;
- family contracts, tests, stories, and curated exports.

Not allowed:

- product or domain behavior;
- m3e APIs exported to consumers;
- private shadow-DOM access or copied renderer internals;
- duplicate renderer geometry engines, state layers, ripple, focus, elevation, or motion systems;
- speculative wrapper frameworks, defect databases, or token DSLs;
- silent preservation of legacy non-Material extensions.

## Missing and incorrect renderer behavior

Use m3e directly when it implements the selected Material contract.

- Vue owns naming, typed mapping, slots, events, controlled state, native integration, public host geometry normalization, and narrow light-DOM composition.
- m3e owns internal rendering, the private geometry engine and layout, private accessibility, state layer, ripple, focus treatment, elevation, and motion.
- A missing selected capability is recorded as `missing` in the family matrix and routed to the correct owner.
- A confirmed incorrect m3e implementation is recorded as `divergent`, linked to `docs/m3e-defects.md`, and routed to `temporary-renderer-workaround`, `m3e-fix`, or `blocked` according to the accepted gate.
- A temporary workaround must remain host-level, exact-version-specific, independently tested, removable, and private to the canonical owning adapter.

A requirement absent from Material must be resolved as consumer composition, a separate non-MD component, an explicitly approved extension, or removal/migration.

## Theme and tokens

Consumer-facing layers are:

- official `--md-ref-*`;
- official `--md-sys-*`;
- the selected required subset of official `--md-comp-*`;
- `--app-*` only for approved non-Material extensions.

A documented m3e variable remains private and does not automatically create a public token.

## Typing and verification

Public types are based on the selected Material contract. Private mapper outputs are checked against exact package-exported m3e types.

Tests prove the selected public Material Vue contract, wrapper-owned behavior, affected native scenarios, consumer migration, and repository health. m3e-owned animation and private geometry require exact-version source inspection and operator manual review. Every m3e version update revalidates affected non-resolved `M3E-*` records.

## Migration map

| Area                          | Current state                                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| `MDButton`                    | m3e-backed implementation candidate; public API contract reopened for Material-first normalization |
| Other public `MD*` components | legacy-owned until focused Material-first migration                                                |
| Shared m3e integration        | established                                                                                        |
| Confirmed m3e defect registry | established                                                                                        |
| Public entry point            | established                                                                                        |
| Global reference/system theme | retained                                                                                           |

## Current work

PR #162 owns the architecture reset and `MDButton` pilot. M1 is not complete until its source-backed Material–m3e–Vue matrix, public API, non-Material extension decisions, confirmed renderer-defect records, verification, and operator review are accepted.
