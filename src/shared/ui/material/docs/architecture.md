# Mioframe Material architecture

## Decision

Mioframe exposes a canonical Vue Material library under:

```text
src/shared/ui/material
```

```text
official Material documentation
  → complete family DESIGN.md
  → current Mioframe scenarios
  → demand-scoped Vue MD* contract and supported tokens
  → private @m3e/web renderer
```

Official Material 3 Expressive is the public contract authority. m3e is the preferred private implementation, not the API authority.

## Goal

Each `MD*` component is a demand-driven Vue representation of a selected subset of a complete official Material component contract:

- `DESIGN.md` preserves the complete official concepts, options, defaults, states, behavior, visuals, accessibility, geometry, guidance, related components, and component-token catalogue;
- current Mioframe scenarios select the subset implemented now;
- the subset remains coherent and expandable without exposing renderer vocabulary;
- m3e is used maximally where its public surface implements the selected contract;
- missing selected behavior is assigned to the correct owner rather than omitted or recreated indiscriminately.

## Sources of truth

1. Official Material documentation defines the complete public component and token contracts.
2. `components/<family>/DESIGN.md` is the complete normalized local snapshot of the official component contract.
3. Current Mioframe consumers select the required subset.
4. The installed lockfile-resolved m3e artifact and observable browser behavior define consumed renderer capability.
5. The family README records the accepted demand-scoped Material–m3e–Vue matrix and component-specific proof.
6. Canonical CSS declarations plus `token-api.md` define the supported public token surface.
7. `m3e-defects.md` owns confirmed renderer-defect identities and lifecycle.
8. `roadmap.md` alone owns current milestone status, blockers, and next action.

Upstream m3e source, tags, demos, and changelogs are supporting renderer evidence only. Legacy Mioframe code describes migration scenarios, not the final public API when it conflicts with Material.

## Family artifacts

Every official component family owns two distinct documentation artifacts:

```text
components/<family>/DESIGN.md
components/<family>/README.md
```

`DESIGN.md` answers:

```text
What does official Material define?
```

It is complete and not demand-scoped. It contains no Mioframe implementation, m3e mapping, migration, proof, or status decision.

The family README answers:

```text
What does Mioframe implement, defer, map, correct, and verify now?
```

It is demand-scoped and references exact `DESIGN.md` sections for every selected, deferred, restrictive, or conflicting decision.

A missing, stale, blocked, or incomplete `DESIGN.md` blocks adapter architecture, implementation, completion review, and `migrated` status. Family README reconstruction from current code or renderer behavior is not a substitute.

## Demand-scoped public surface

Start from the complete family `DESIGN.md`, then classify official capability as:

- `implement-now` — required by a current scenario or needed for a coherent selected API;
- `defer` — official surface not required now;
- `not-material` — a project requirement with no official Material source;
- `source-conflict` — the design document records official sources that do not support one reliable decision.

Do not copy the complete Material or m3e catalogue into the public runtime API for completeness. Do not let renderer availability determine public API semantics. Do not remove unused official capability from `DESIGN.md`.

A family README must contain the canonical matrix defined by `component-adapter.md`. No production mapping, supported token, dependency composition, or completion claim exists without a corresponding accepted row and proof.

## Public Vue boundary

```text
Material concept from DESIGN.md
  → selected Vue prop / slot / emit / v-model / ref / native mapping
  → private m3e property / slot / event / CSS input
```

Rules:

- use official Material terminology and semantics;
- keep public types independent from m3e;
- constrain private mappings with package-exported renderer types;
- do not expose raw custom-element attributes, event types, classes, tags, or CSS variables;
- do not preserve legacy naming that conflicts with Material;
- do not add hypothetical native, renderer, or supported-token surface;
- define precedence and restoration for public states that may coexist.

Framework adaptation is allowed when it represents selected Material behavior without adding product semantics.

## Ownership

### Material foundation

Owns supported renderer-independent reference/system tokens, CSS grammar, standard light/dark theme roles, and foundation catalogue entries.

```text
src/shared/ui/material/foundation/tokens.css
src/shared/ui/material/foundation/theme.css
```

Application theme selection, persistence, and approved `--app-*` extensions remain outside Material.

Selected light/dark system-color roles are verified as exact semantic reference-token assignments, not only as declared or catalogued token names.

Legacy `.md` surfaces own their own background, inherited base content color, and root transition. They rely on native inheritance for ordinary descendant text and must not impose color or motion on arbitrary component descendants through universal selectors. Canonical Material adapters remain independent of the selected private renderer; renderer-specific exceptions do not belong in legacy shared styles.

### Component family

Owns:

- the complete official `DESIGN.md` snapshot;
- the demand-scoped README matrix;
- selected official `--md-comp-<family>-*` runtime surface;
- private family-local renderer mappings;
- component-specific evidence and public catalogue entries.

```text
src/shared/ui/material/components/<family>/DESIGN.md
src/shared/ui/material/components/<family>/README.md
src/shared/ui/material/components/<family>/tokens.css
```

### Parent Vue adapter

Owns parent naming, composition state, placement, controlled state, slots/events, native integration, and public handoff to dependency adapters.

### Canonical dependency adapter

Owns its design document, renderer import and mapping, accessibility, geometry normalization, family tokens, defects, tests, stories, visual proof, and root export.

### m3e

Owns private DOM, internal rendering/layout, private defaults, state layer, ripple, focus treatment, elevation, renderer motion, and private accessibility implementation.

## Gap routing

When m3e does not fully implement a selected Material capability:

- `wrapper-correction` — explicit Vue mapping, controlled state, event/native integration, light-DOM composition, or public host geometry that does not recreate renderer internals;
- `temporary-renderer-workaround` — a confirmed exact-version divergence correctable through a public host property, attribute, CSS custom property, or host dimension under the complete gate in `component-adapter.md`;
- `m3e-fix` — underlying private DOM, renderer geometry, state-layer, ripple, focus, accessibility, elevation, or motion defect;
- `blocked` — neither owner can safely deliver the selected contract.

A workaround is removable technical debt, not a transfer of the renderer system into Mioframe. It remains local to the canonical owner, absent from public API and parents, linked to a stable defect record, and revalidated on every consumed m3e update.

## Token boundary

The family `DESIGN.md` contains the complete official component-token catalogue.

The runtime Material library supports only intentionally selected and verified tokens:

- `--md-ref-*` and `--md-sys-*` under foundation/theme;
- selected `--md-comp-*` under the owning family.

`--app-*` remains outside Material. `--m3e-*` and `--md-private-*` remain private.

Using m3e removes the need to reproduce every component default in runtime CSS. An official token becomes supported only when selected from the complete design document, declared by one semantic owner, catalogued, mapped where necessary, and verified. Unsupported official tokens remain `deferred` in the family README while staying fully described in `DESIGN.md`.

Do not recreate a mixed-owner legacy token file, compatibility alias, global component-token owner, TypeScript registry, token DSL, or public aliases for renderer variables.

## Non-Material requirements

A requirement absent from official Material must be resolved explicitly as:

1. composition at the consumer/feature/widget owner;
2. a separate shared component without the `MD` prefix;
3. an exceptional documented `MD*` extension approved by architecture.

The default is composition or a separate non-Material owner. Compatibility migration must not silently redefine Material API.

## Renderer and typing boundary

Outside `src/shared/ui/material`, it is forbidden to import `@m3e/web`, render `m3e-*`, use renderer types/events, depend on `--m3e-*`, or inspect renderer DOM.

Repository contract tests enforce the private CSS namespace across runtime CSS, Vue, and TypeScript source while the compiler and ESLint guards independently enforce imports and raw elements.

Inside the canonical adapter:

- prefer documented public renderer inputs;
- inspect the installed artifact for diagnosis and exact mapping;
- derive Vue custom-element glue from exported element classes or `HTMLElementTagNameMap`;
- ensure renderer type drift fails type-check;
- do not introduce Lit directly, inspect private shadow DOM, copy internals, or create a generic adapter framework without a separate demonstrated need.

## Verification and completion

Verification must prove the selected public API, package-derived mapping, ownership, current consumer scenarios, accessibility/native behavior, public token agreement, wrapper-owned corrections, dependency handoffs, and selected stable presentation.

Renderer-owned appearance must be demonstrated through browser or visual proof. Host state, token presence, event receipt, source inspection, or a Storybook story alone is not sufficient.

Completion additionally requires a current complete `DESIGN.md` for the family and every required dependency. Green code verification cannot compensate for a missing or demand-truncated official design artifact.

Final repository verification uses the exact task scope required by root policy. Current milestone status and unresolved operator-reported issues are recorded only in `roadmap.md` and family READMEs, not in this durable architecture document.
