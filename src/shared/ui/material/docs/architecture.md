# Mioframe Material architecture

## Decision

Mioframe exposes one canonical Vue Material library under `src/shared/ui/material`.

Official Material 3 Expressive defines the public component API, behavior, geometry, motion, accessibility, token model, and correct component usage. Definition workers and independent review read those official facts through the repository-configured `material3` MCP. `@m3e/web` is a private renderer and never defines Mioframe public API or usage guidance.

Workflow mechanics belong only to [`component-workflow.md`](./component-workflow.md). Family definition ownership belongs to [`component-contract.md`](./component-contract.md). This document owns durable library boundaries.

## Sources of truth

1. Material 3 MCP — canonical upstream Material semantics and usage guidance;
2. family `contract.ts` — public parameters/props, slots, events, values/types and defaults;
3. family `tokens.css` — executable public component-token contract and catalogue;
4. family `BEHAVIOR.md` — normative observable behavior, accessibility, geometry and motion;
5. family `README.md` — developer-facing description and correct Material application guidance;
6. runtime code and executable proof — standalone implementation truth;
7. migrated consumers and product proof — adoption truth;
8. `docs/m3e-defects.md` — renderer defects/workarounds;
9. `docs/roadmap.md` — mutable milestone status and next action.

Legacy family `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` files are historical workflow evidence only until the family is converted.

## Ownership

Each official family owns its three technical contracts, developer usage README, Vue adapter, public component tokens, private renderer mappings/workarounds, and component-specific proof.

Product layers retain product state, persistence, routing, errors, operation lifecycle, availability/disabled guards, and business behavior.

Dependencies remain separate Material families consumed through canonical public APIs.

## Public Vue boundary

Public APIs use official Material terminology and idiomatic Vue semantics. They keep types renderer-independent and expose no raw m3e tags, attributes, events, types, classes, or CSS variables.

The public family contract is not demand-scoped. Current Mioframe consumers do not decide which official Material variants, states, content roles, events, or tokens exist in the canonical component.

Do not add undocumented convenience surface, platform-inapplicable surface, renderer vocabulary, legacy compatibility aliases, or speculative non-Material behavior.

## Usage guidance boundary

Family `README.md` answers developer-facing questions such as:

- what the component is for;
- when to use or avoid it;
- which official variant/configuration fits a scenario;
- what content is appropriate;
- what accessibility responsibility remains with the consumer;
- when a related Material component is the correct choice instead.

It derives only from Material 3 MCP and remains independent from current Mioframe call sites. It does not duplicate runtime API tables, token catalogues, normative interaction/geometry/motion rules, renderer details, or product migration instructions.

Migration applies this guidance to product scenarios after the canonical standalone component is complete.

## Definition isolation

API contract, token contract, behavior contract, and usage guidance extraction are separate fresh worker responsibilities. All official Material facts come from Material 3 MCP.

Before implementation, definition workers do not inspect m3e, legacy implementation, application consumers, or current call-site demand.

There is no mandatory design, architecture, source-ledger, synthesis, or definition-review stage between those artifacts and implementation.

## Renderer boundary

Outside `src/shared/ui/material`, consumers must not import `@m3e/web`, render `m3e-*`, use renderer types/events, depend on `--m3e-*`, or inspect renderer DOM.

Inside standalone implementation, prefer documented exact-version renderer inputs, derive glue from exported types, keep mappings local, avoid private-shadow-DOM coupling, and do not recreate renderer-owned geometry, accessibility, state layer, ripple, focus, elevation, or motion.

A renderer limitation does not redefine a Material contract. Use a small family-local correction or documented exact-version workaround when that preserves the contracts; otherwise escalate to architecture/upstream rather than weakening public API/behavior/tokens.

Do not introduce a generic adapter framework without demonstrated repeated need and a separate architecture decision.

Migration consumes only the finished canonical Mioframe Material API plus family README guidance; it does not inspect renderer internals.

## Token boundary

Foundation owns supported `--md-ref-*` and `--md-sys-*`; each family owns official public `--md-comp-<family>-*`; application code owns `--app-*`; renderer/private internals own `--m3e-*` and `--md-private-*`.

Public component tokens derive from Material 3 MCP rather than current consumer overrides or renderer variables. Each family `tokens.css` is the executable public component-token catalogue; do not create a second central registry. Runtime renderer mappings remain private.

## Standalone-first integration

A canonical family is fully defined and then implemented/proven as a standalone Material component before application consumers are inspected for migration.

After standalone proof, a separate fresh migration worker adapts consumers to the canonical API and applies the family README guidance. If a legacy behavior belongs to product/shared composition rather than the Material component, keep it with that owner instead of expanding Material.

## Proof and completion

Standalone implementation proves the canonical API, renderer mapping, public tokens, behavior, accessibility, geometry, motion, and standalone presentation at the lowest faithful level.

Migration separately proves consumer adoption, preserved product behavior and legacy removal. Correct-use guidance itself is reviewed against Material 3 MCP; add product proof only when applying that guidance changes an observable product scenario.

A fresh independent reviewer checks Material 3 MCP against all three technical contracts and the family README, then implementation, exact-version renderer behavior, proof, consumers and ownership.

After successful review, the coding-agent workflow hands the family to the architect. GitHub CI on the exact PR head is the authoritative repository verification gate. Merge readiness belongs to the architect after CI and full PR review.

Renderer-owned appearance requires faithful browser or visual evidence. Green automated checks do not replace semantic or independent review.
