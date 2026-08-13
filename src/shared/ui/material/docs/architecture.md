# Mioframe Material architecture

## Decision

Mioframe exposes one canonical Vue Material library under `src/shared/ui/material`.

Official Material 3 Expressive defines the public component/token model. `@m3e/web` is a preferred private renderer and never defines Mioframe public API.

Workflow mechanics are owned only by [`component-workflow.md`](./component-workflow.md). This document records durable library boundaries and must not duplicate stage revision/timestamp machinery.

## Sources of truth

1. official Material documentation — complete component/token contract;
2. family `DESIGN.md` — normalized official snapshot;
3. confirmed product scenarios or approved standalone-library scenario — current demand;
4. family `ARCHITECTURE.md` — current implementation contract;
5. runtime code plus `IMPLEMENTATION.md` — component implementation/proof;
6. `MIGRATION.md` — consumers, preserved scenarios, legacy removal;
7. independent `REVIEW.md` — complete-family compliance/readiness;
8. canonical CSS plus `docs/token-api.md` — supported public token surface;
9. `docs/m3e-defects.md` — renderer defects/workarounds;
10. `docs/roadmap.md` — mutable milestone status/next action.

## Stage freshness

`DESIGN.md` may be reused until its normal source refresh is due. Every operator invocation then runs fresh architecture, implementation, migration, and independent review.

The workflow intentionally uses no artifact timestamps, hashes, counters, Git identities, dependency-review revisions, or persistent revision graph for freshness. Legacy revision fields in existing artifacts are ignored and removed when their owning stage next rewrites them.

This trades a small amount of repeated agent work for simpler and more reliable orchestration. Material family migration is normally a one-time operation; persistent cross-invocation reasoning reuse is not a current requirement.

## Family ownership

Each official family owns its five artifacts, canonical Vue adapter/root export, selected official component tokens, private renderer mappings/workarounds, and component-specific proof.

Product layers retain product state, persistence, routing, errors, operation lifecycle, disabled guards, and business behavior.

A parent Material adapter owns composition meaning and public handoff. Dependencies remain independent families consumed through canonical public APIs.

## Demand-scoped public surface

Architecture starts from complete DESIGN and selects only the minimum complete current surface for confirmed scenarios.

Capability is classified as implement-now, defer, not-material, or source-conflict. Deferred official capability remains documented in DESIGN but is not copied into runtime API for symmetry/future flexibility.

With no current consumer, one explicit `material-component <name>` invocation authorizes only the unambiguous official standalone default. Do not invent a product consumer or expose renderer capability merely because it exists.

## Public Vue boundary

Public APIs use official Material terminology and idiomatic Vue semantics, keep types renderer-independent, expose no raw m3e tags/attributes/events/types/CSS variables, define state precedence/restoration, and add no speculative surface.

Requirements absent from official Material stay in consumer composition, non-Material shared UI, or an explicitly approved bounded extension.

## Renderer boundary

Outside `src/shared/ui/material`, consumers must not import `@m3e/web`, render `m3e-*`, use renderer types/events, depend on `--m3e-*`, or inspect renderer DOM.

Inside a family, prefer documented renderer inputs, derive glue from exported types, keep mappings local, avoid private-shadow-DOM coupling, and do not recreate renderer-owned geometry/accessibility/state-layer/ripple/focus/elevation/motion.

Do not introduce a generic adapter framework without demonstrated repeated need and a separate architecture decision.

## Token boundary

Foundation owns selected `--md-ref-*`/`--md-sys-*`; each family owns selected `--md-comp-<family>-*`; application code owns `--app-*`; renderer/private internals own `--m3e-*`/`--md-private-*`.

Contextual component tokens trace official DESIGN path → public Mioframe token → renderer input/fallback → expected result → proof owner.

## Dependencies and corrections

Architecture records direct dependency families and a current-invocation dependency queue only. Queued dependencies run their own Material pipeline; parent architecture then runs fresh and validates current public handoffs directly.

Self/ancestor dependency cycles are forbidden and detected through the invocation-local dependency path.

After any earlier-stage or cross-family correction, affected downstream stages run fresh. This invocation-local rerun rule replaces durable revision invalidation.

## Proof and completion

Architecture selects proof owners before implementation. Implementation proves family-owned contracts; migration proves consumers/no-consumer case and legacy removal; review independently checks the complete current result; the outer workflow runs final project verification.

Renderer-owned appearance requires faithful browser/visual evidence. Green automated checks do not replace architecture or independent review.
