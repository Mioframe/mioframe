# Mioframe Material architecture

## Decision

Mioframe exposes one canonical Vue Material library under `src/shared/ui/material`.

Official Material 3 Expressive defines the public component, behavior, usage, geometry, motion, accessibility, and token model. `@m3e/web` is a private renderer and never defines Mioframe public API.

Workflow mechanics belong only to [`component-workflow.md`](./component-workflow.md). Family contract ownership belongs to [`component-contract.md`](./component-contract.md). This document owns durable library boundaries.

## Sources of truth

1. official Material documentation — canonical upstream semantics;
2. family `contract.ts` — public props, slots, emits, types, defaults and combinations;
3. family `tokens.css` — public component-token contract;
4. family `BEHAVIOR.md` — normative observable behavior, accessibility, geometry and motion;
5. family `GUIDANCE.md` — correct consumer usage and composition;
6. family `SOURCES.md` — official-source provenance and conflicts;
7. runtime code and executable proof — implementation truth;
8. `docs/token-api.md` — supported public runtime token catalogue;
9. `docs/m3e-defects.md` — renderer defects/workarounds;
10. `docs/roadmap.md` — mutable milestone status and next action.

Legacy family `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` files are historical workflow evidence only until the family is converted.

## Ownership

Each official family owns its canonical contract, Vue adapter, public component tokens, private renderer mappings/workarounds, and component-specific proof.

Product layers retain product state, persistence, routing, errors, operation lifecycle, availability/disabled guards, and business behavior.

Dependencies remain separate Material families consumed through canonical public APIs.

## Public Vue boundary

Public APIs use official Material terminology and idiomatic Vue semantics. They keep types renderer-independent and expose no raw m3e tags, attributes, events, types, classes, or CSS variables.

The public family contract is not demand-scoped. Current Mioframe consumers do not decide which official Material variants, states, content roles, events, or tokens exist in the canonical component.

Do not add undocumented convenience surface, platform-inapplicable surface, renderer vocabulary, legacy compatibility aliases, or speculative non-Material behavior.

## Renderer boundary

Outside `src/shared/ui/material`, consumers must not import `@m3e/web`, render `m3e-*`, use renderer types/events, depend on `--m3e-*`, or inspect renderer DOM.

Inside a family, prefer documented renderer inputs, derive glue from exported types, keep mappings local, avoid private-shadow-DOM coupling, and do not recreate renderer-owned geometry, accessibility, state layer, ripple, focus, elevation, or motion.

A renderer limitation does not redefine the Material contract. Use a small family-local correction or documented exact-version workaround when that preserves the contract; otherwise escalate to architecture/upstream rather than weakening the public API.

Do not introduce a generic adapter framework without demonstrated repeated need and a separate architecture decision.

## Token boundary

Foundation owns supported `--md-ref-*` and `--md-sys-*`; each family owns official public `--md-comp-<family>-*`; application code owns `--app-*`; renderer/private internals own `--m3e-*` and `--md-private-*`.

Public component tokens derive from official Material token paths rather than current consumer overrides or renderer variables. Runtime mappings remain private.

## Standalone-first integration

A canonical family is implemented and proven as a standalone Material component before application consumers influence migration decisions.

After standalone proof, consumers adapt to the canonical API. If a legacy behavior belongs to product/shared composition rather than the Material component, keep it with that owner instead of expanding the Material API.

## Proof and completion

Implementation proves the canonical component contract, renderer mapping, public tokens, behavior, accessibility, geometry, motion, and standalone presentation at the lowest faithful level. The same implementation worker then proves consumer migration and legacy removal.

A fresh independent reviewer checks official contract extraction, implementation, exact-version renderer behavior, proof, consumers, and ownership.

After successful review, the coding-agent workflow hands the family to the architect. GitHub CI on the exact PR head is the authoritative repository verification gate. Merge readiness belongs to the architect after CI and full PR review.

Renderer-owned appearance requires faithful browser or visual evidence. Green automated checks do not replace semantic or independent review.
