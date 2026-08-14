# Mioframe Material architecture

## Decision

Mioframe exposes one canonical Vue Material library under `src/shared/ui/material`.

Official Material 3 Expressive defines the public component and token model. `@m3e/web` is a private renderer and never defines Mioframe public API.

Workflow mechanics belong only to [`component-workflow.md`](./component-workflow.md). This document owns durable library boundaries.

## Sources of truth

1. official Material documentation — complete component/token contract;
2. family `DESIGN.md` — normalized official snapshot;
3. confirmed scenarios — current demand;
4. family `ARCHITECTURE.md` — implementation contract;
5. runtime code plus `IMPLEMENTATION.md` — component implementation/proof;
6. `MIGRATION.md` — consumers, preserved scenarios, legacy removal;
7. independent `REVIEW.md` — family compliance and PR/CI readiness;
8. canonical CSS plus `docs/token-api.md` — supported public token surface;
9. `docs/m3e-defects.md` — renderer defects/workarounds;
10. `docs/roadmap.md` — mutable milestone status and next action.

## Workflow freshness

`DESIGN.md` may be reused until its source refresh is due. Architecture, implementation, migration, and independent review run fresh for each `material-component <name>` invocation.

No artifact timestamps, hashes, counters, Git identities, dependency-review revisions, or persistent revision graph are used for freshness.

## Ownership

Each official family owns its canonical Vue adapter, selected component tokens, private renderer mappings/workarounds, staged artifacts, and component-specific proof.

Product layers retain product state, persistence, routing, errors, operation lifecycle, disabled guards, and business behavior.

Dependencies remain separate Material families consumed through canonical public APIs.

## Public Vue boundary

Public APIs use official Material terminology and idiomatic Vue semantics. They keep types renderer-independent and expose no raw m3e tags, attributes, events, types, classes, or CSS variables.

Architecture selects only the minimum complete surface needed by confirmed scenarios. Deferred official capability remains documented in DESIGN and is not copied into runtime API for symmetry or hypothetical reuse.

## Renderer boundary

Outside `src/shared/ui/material`, consumers must not import `@m3e/web`, render `m3e-*`, use renderer types/events, depend on `--m3e-*`, or inspect renderer DOM.

Inside a family, prefer documented renderer inputs, derive glue from exported types, keep mappings local, avoid private-shadow-DOM coupling, and do not recreate renderer-owned geometry, accessibility, state layer, ripple, focus, elevation, or motion.

Do not introduce a generic adapter framework without demonstrated repeated need and a separate architecture decision.

## Token boundary

Foundation owns selected `--md-ref-*` and `--md-sys-*`; each family owns selected `--md-comp-<family>-*`; application code owns `--app-*`; renderer/private internals own `--m3e-*` and `--md-private-*`.

## Proof and completion

Architecture selects proof owners before implementation. Implementation proves family-owned contracts; migration proves consumers/no-consumer scenarios and legacy removal; review independently checks the complete current result.

After successful review, the coding-agent workflow hands the family to the architect. GitHub CI on the exact PR head is the authoritative repository verification gate. Merge readiness belongs to the architect after CI and full PR review.

Renderer-owned appearance requires faithful browser or visual evidence. Green automated checks do not replace architecture or independent review.
