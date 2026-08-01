# Mioframe Material architecture

## Decision

Mioframe exposes one canonical Vue Material library under:

```text
src/shared/ui/material
```

Official Material 3 Expressive defines the public component and token model. `@m3e/web` is the preferred private renderer and does not define the public API.

The complete execution state machine belongs to [`component-workflow.md`](./component-workflow.md). This document owns durable library architecture and responsibility boundaries only.

## Goals

- preserve the complete official component model independently of current demand;
- resolve component architecture before coding;
- expose a stable Material-first Vue API;
- use m3e without leaking renderer vocabulary or ownership;
- implement the minimum complete surface required by confirmed scenarios;
- keep component implementation separate from product-consumer migration;
- independently review the complete resulting family;
- avoid speculative abstractions and duplicate owners.

## Sources of truth

1. Official Material documentation defines the complete component and token contracts.
2. `components/<family>/DESIGN.md` is the complete normalized local official snapshot.
3. Current Mioframe scenarios and workspace rules select required behavior.
4. `components/<family>/ARCHITECTURE.md` is the demand-scoped implementation contract.
5. Runtime code plus `IMPLEMENTATION.md` records component-owned implementation and proof.
6. `MIGRATION.md` records consumer adoption, preserved scenarios, and legacy removal.
7. `REVIEW.md` records independent compliance and final-workflow-verification readiness.
8. Canonical CSS plus `docs/token-api.md` defines the supported public token surface.
9. `docs/m3e-defects.md` owns confirmed renderer-defect lifecycle.
10. `docs/roadmap.md` alone owns mutable milestone status and next action.

Existing code, tests, stories, screenshots, renderer demos, and legacy APIs are evidence to inspect, not public-contract authority.

## Family ownership

Every official family owns:

- its five staged artifacts;
- canonical Vue adapter and root export;
- selected official component tokens;
- private renderer mappings and controlled workarounds;
- component-specific tests, stories, browser/visual proof, and defect records.

Family `README.md` files are navigation only.

A parent adapter owns composition meaning, placement, controlled parent state, slots/events, and public handoff to dependencies. A dependency remains independently owned and is consumed through its canonical public API.

Product layers retain product state, persistence, routing, errors, operation lifecycle, disabled guards, and business behavior.

## Demand-scoped public surface

Architecture starts from the complete `DESIGN.md` and classifies official capability as:

- `implement-now` — required by a current scenario or minimum coherent API;
- `defer` — official capability not required now;
- `not-material` — project behavior absent from official Material;
- `source-conflict` — official evidence cannot support a reliable decision.

Deferred capability remains documented in `DESIGN.md` but is not copied into runtime API for symmetry or hypothetical reuse.

## Public Vue boundary

```text
official Material concept
  → accepted Vue API in ARCHITECTURE.md
  → private renderer mapping
```

The public boundary:

- uses official Material terminology and semantics;
- expresses selected behavior idiomatically in Vue;
- keeps public types independent from m3e;
- exposes no raw renderer attributes, events, tags, classes, types, or CSS variables;
- defines precedence and restoration for coexisting public states;
- adds no native, renderer, or token surface without confirmed demand.

A requirement absent from official Material belongs to consumer composition, another shared component without an `MD` prefix, or an exceptional documented extension approved in family architecture.

## Renderer boundary

Outside `src/shared/ui/material`, consumers do not import `@m3e/web`, render `m3e-*`, use renderer types/events, depend on `--m3e-*`, or inspect renderer DOM.

Inside an owning family:

- prefer documented renderer inputs;
- derive custom-element glue from exported renderer types;
- keep mappings family-local;
- do not inspect private shadow DOM or copy renderer internals;
- do not recreate renderer-owned geometry, accessibility, state layer, ripple, focus, elevation, or motion;
- do not create a generic adapter framework without demonstrated repeated need.

A temporary renderer workaround is exact-version, host-level, owner-local, removable, recorded in family architecture and `m3e-defects.md`, and revalidated on dependency updates.

## Token boundary

Runtime owners are:

- foundation for selected `--md-ref-*` and `--md-sys-*` tokens;
- each family for its selected `--md-comp-<family>-*` tokens;
- application code outside Material for `--app-*`;
- renderer internals for `--m3e-*` and `--md-private-*`.

Every contextual component token traces:

```text
official DESIGN.md path
  → public Mioframe token
  → renderer input
  → renderer fallback
  → expected consumer result
  → proof owner
```

Do not create mixed-owner token files, duplicate public owners, compatibility aliases, token registries, token DSLs, or exhaustive runtime copies.

## Dependency closure

An official Material dependency is a first-class family with its own artifacts, implementation, tokens, defects, proof, migration facts, and review.

A parent architecture may be fully resolved while dependency work remains pending. It then uses `Status: ready`, a non-empty exact dependency queue, and `Implementation readiness: awaiting-dependencies`. Parent implementation cannot start in that state.

The orchestrator processes the queue before retrying parent architecture. After requested dependency gates are reached, parent architecture runs again, validates public handoffs, clears or recomputes the queue, and becomes implementation-ready only when the queue is `none`.

Later parent stages cannot complete before their required dependency gates. Parent composition proof does not replace standalone dependency proof.

## Proof and completion principles

Architecture selects faithful proof owners before implementation:

- implementation proves component-owned contracts;
- migration proves product scenarios and legacy removal;
- review independently checks the complete result;
- the outer workflow runs one final read-only project verification after current review.

Renderer-owned appearance requires browser or visual proof. Source inspection, host state, token presence, or a story alone is insufficient.

Operator visual/motion inspection is an external defect-reporting channel, not a positive-acknowledgement gate. Absence of a reported defect does not block completion. A concrete defect routes to its owning stage.

A passing verification command proves only its covered checks and does not replace architecture or independent review.
