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
- independently review every complete family;
- avoid speculative abstractions and duplicate owners.

## Sources of truth

1. Official Material documentation defines complete component and token contracts.
2. `components/<family>/DESIGN.md` is the normalized official snapshot.
3. Product scenarios or the approved standalone library scenario select required behavior.
4. `components/<family>/ARCHITECTURE.md` is the demand-scoped implementation contract.
5. Runtime code plus `IMPLEMENTATION.md` records component implementation and proof.
6. `MIGRATION.md` records adoption, preserved scenarios, and legacy removal.
7. `REVIEW.md` records independent compliance and final-verification readiness.
8. Canonical CSS plus `docs/token-api.md` defines the supported public token surface.
9. `docs/m3e-defects.md` owns renderer-defect lifecycle.
10. `docs/roadmap.md` alone owns mutable milestone status and next action.

Existing code, tests, stories, screenshots, renderer demos, and legacy APIs are evidence, not public-contract authority.

## Durable family handoffs

Every stage artifact owns an `Artifact revision`. Design additionally owns a `Design contract revision`.

```text
DESIGN contract revision
  → ARCHITECTURE
Dependency REVIEW revisions
  → parent ARCHITECTURE
ARCHITECTURE artifact revision
  → IMPLEMENTATION
IMPLEMENTATION artifact revision
  → MIGRATION
DESIGN contract + ARCHITECTURE + IMPLEMENTATION + MIGRATION revisions
  → REVIEW
```

Design artifact revision tracks file metadata updates but does not invalidate downstream work by itself. A metadata-only source refresh preserves the design contract revision.

Revision linkage is the durable continuation mechanism after interruption or a new invocation. It is not a hash system or workflow database.

A parent architecture records the exact current review revision of each direct dependency. Updating a dependency invalidates parent architecture mechanically before parent code or review is reused.

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

Architecture starts from complete design and classifies capability as:

- `implement-now` — required by a confirmed product scenario, approved standalone library scenario, or minimum coherent API;
- `defer` — official capability not required now;
- `not-material` — project behavior absent from official Material;
- `source-conflict` — official evidence cannot support a reliable decision.

Deferred capability remains in design but is not copied into runtime API for symmetry or hypothetical reuse.

## New family without consumers

When no current consumer exists, the explicit `material-component <name>` invocation establishes one approved library scenario:

- render the unambiguous official standalone default;
- expose only the API required to render and accessibly operate that default;
- expose only mandatory official controllable state belonging to the selected default;
- do not add `v-model`, selection, toggle, value, or open-state contracts unless that state is part of the selected official default;
- include disabled behavior only when official Material defines it for that default;
- include required semantics, accessibility, states, and faithful proof;
- defer optional variants, sizes, shapes, configurations, and state models;
- do not copy m3e capabilities or invent product scenarios;
- do not create a product consumer merely to justify the family.

Operator input is required only when official documentation provides no standalone default or multiple materially different public models that cannot be resolved mechanically.

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

A temporary renderer workaround is exact-version, host-level, owner-local, removable, recorded in family architecture and `m3e-defects.md`, and revalidated whenever the lockfile-resolved renderer revision changes.

## Token boundary

Runtime owners are:

- foundation for selected `--md-ref-*` and `--md-sys-*` tokens;
- each family for selected `--md-comp-<family>-*` tokens;
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

An official Material dependency is a first-class family with its own complete design, architecture, implementation, migration, proof, and independent review.

Parent architecture records:

- `Dependency families` — complete direct dependency set;
- `Dependency queue` — dependencies that do not yet have current review;
- `Dependency review revisions` — exact review revision for every dependency not in the queue.

Queue and review-revision entries are disjoint and their union equals dependency families.

A queued dependency always runs its complete pipeline through current review. Stage-specific dependency gates are unsupported.

Self-dependency and ancestor dependency are forbidden. The orchestrator detects repeated family names in its active dependency path and returns the exact cycle to the architecture worker that emitted it.

Architecture must correct dependency ownership or record a genuine unresolved architecture blocker. Mutual imports, related-component documentation, or shared implementation details do not justify cyclic family ownership.

Parent architecture may be resolved while dependencies remain pending. It then uses status `ready`, a non-empty queue, and readiness `awaiting-dependencies`. Parent implementation cannot start.

After dependencies reach current review, parent architecture runs again, validates public handoffs, clears or recomputes the queue, and records exact dependency review revisions.

A later dependency review revision change invalidates parent architecture and parent downstream artifacts through normal revision linkage.

Parent composition proof does not replace standalone dependency proof.

## Correction and resume principle

Cross-family correction retains origin and target, but target completion does not bypass durable invalidation in the origin family.

After target reaches current review, the origin family resumes through its ordinary state machine from design forward. Any earlier invalid stage runs first, and the stored origin stage must then execute fresh to clear or replace its route.

## Proof and completion principles

Architecture selects faithful proof owners before implementation:

- implementation proves component-owned contracts;
- migration proves product scenarios or the explicit no-consumer case and legacy removal;
- review independently checks the complete result;
- the outer workflow runs one final read-only project verification after current reviews.

Renderer-owned appearance requires browser or visual proof. Source inspection, host state, token presence, or a story alone is insufficient.

Operator visual/motion inspection is an external defect-reporting channel, not a positive-acknowledgement gate. Absence of a reported defect does not block completion. A concrete defect routes to its owning family and stage.

A passing verification command proves only its covered checks and does not replace architecture or independent review.
