# Mioframe Material library

`src/shared/ui/material` is the canonical owner of the project-facing Material component API, supported Material token API, and Material-specific architecture documentation.

```text
current product requirement
  → selected official Material component and token contracts
  → public Vue MD* API plus supported CSS token API
  → private @m3e/web renderer
```

Official Material owns the public model. Current consumers select the subset required now. m3e supplies private implementation where its consumed contract supports that subset.

Canonical policy:

- [`docs/architecture.md`](./docs/architecture.md);
- [`docs/component-adapter.md`](./docs/component-adapter.md);
- [`docs/component-tokens.md`](./docs/component-tokens.md);
- [`docs/token-api.md`](./docs/token-api.md);
- [`docs/m3e-defects.md`](./docs/m3e-defects.md);
- [`docs/roadmap.md`](./docs/roadmap.md).

## Public component API

Consumers import only curated Vue components:

```ts
import { MDButton } from '@shared/ui/material';
```

A public `MD*` component:

- uses official Material names, concepts, options, values, defaults, states, behavior, visuals, and accessibility semantics;
- implements only the subset selected by current need;
- remains compatible with later expansion toward deferred Material surface;
- exposes no raw m3e vocabulary, type, event, slot, or CSS variable;
- contains no non-Material capability without a separate architecture decision.

Vue props, emits, slots, `v-model`, refs, and native mappings may adapt Material semantics to Vue without adding product semantics.

## Public token API

Consumer-facing token layers are:

- supported `--md-ref-*` and `--md-sys-*` declared by Material foundation/theme;
- the selected supported subset of official `--md-comp-*` declared by component families.

`docs/token-api.md` is the complete consumer-facing catalogue. Canonical CSS files are the executable declarations.

```text
foundation/tokens.css
  → supported reference/system foundations

foundation/theme.css
  → standard palette and light/dark color roles

components/<family>/tokens.css
  → supported family component tokens
  → private mapping to m3e
```

`--app-*` belongs outside the Material library. `--m3e-*` and `--md-private-*` remain private.

Using m3e means Mioframe does not reproduce every Material component token or renderer default. Official but unsupported tokens remain `deferred` in family matrices and are not public API.

## Required family contract

Every migrated component owns a Material–m3e–Vue matrix in its family README:

| Material contract | Required now | Public Vue/token API | m3e support | Owner | Decision |
| --- | --- | --- | --- | --- | --- |

The matrix distinguishes selected Material API, deferred Material API, renderer gaps, wrapper corrections, m3e fixes, and non-Material requirements.

Confirmed incorrect m3e implementations or documentation mismatches use `divergent`, reference a stable `M3E-*` ID, and link to `docs/m3e-defects.md`. A capability that m3e does not implement remains `missing` only in the family matrix.

## Boundary

Allowed inside this directory:

- public Material-first Vue components;
- Material foundation and standard theme declarations;
- family-owned supported component tokens;
- family-local m3e imports and private mappings;
- package-derived renderer typing;
- narrow wrapper corrections for selected Material behavior;
- gated exact-version host-level workarounds linked to `M3E-*` records;
- family contracts, tests, stories, and curated exports.

Not allowed:

- product or domain behavior;
- application-owned `--app-*` declarations;
- m3e APIs exported to consumers;
- private shadow-DOM access or copied renderer internals;
- duplicate renderer geometry engines, state layers, ripple, focus, elevation, or motion systems;
- a global component-token owner, duplicate public declaration owner, token DSL, or copied full Material/m3e token catalogue;
- silent preservation of legacy non-Material extensions.

## Missing and incorrect renderer behavior

Use m3e directly when it implements the selected Material contract.

- Vue owns naming, typed mapping, slots, events, controlled state, native integration, public host geometry normalization, and narrow light-DOM composition.
- Material foundation and component families own the supported public token contract.
- m3e owns internal rendering, private defaults, geometry/layout, accessibility, state layer, ripple, focus, elevation, and motion.
- A missing selected capability is `missing` in the family matrix.
- A confirmed incorrect implementation is `divergent`, linked to `docs/m3e-defects.md`, and routed to a controlled workaround, m3e fix, or blocker.

A requirement absent from Material must be resolved as consumer composition, a separate non-MD component, an approved extension, or removal.

## Typing and verification

Public types are based on the selected Material contract. Private mapper outputs are checked against exact package-exported m3e types.

Tests prove the selected Vue and token contracts, wrapper-owned behavior, affected native scenarios, consumer migration, and repository health. Selected renderer-owned visible feedback requires observable browser or visual proof and operator review; source inspection or host state alone is insufficient.

Every m3e version update revalidates affected non-resolved `M3E-*` records against the consumed artifact and owned proof.

## Migration map

| Area | Current state |
| --- | --- |
| `MDButton` | m3e-backed pilot in correction |
| `MDLoadingIndicator` | canonical dependency adapter in correction |
| Other public `MD*` components | legacy-owned until focused migration |
| Shared m3e integration | established |
| Confirmed m3e defect registry | established |
| Public component entry point | established |
| Material foundation/theme runtime owner | migration required |
| Public token catalogue | established, population required during migration |

## Current work

PR #162 owns the architecture reset, token-ownership migration, and correction of the `MDButton` pilot. M0/M1 are not complete until canonical token owners replace `src/shared/lib/md/tokens.css`, `token-api.md` matches the retained runtime surface, interaction feedback is proven, final verification passes, and operator review is accepted.