# Mioframe Material architecture

## Decision

Mioframe exposes one canonical Vue Material library under `src/shared/ui/material`.

Official Material 3 Expressive defines the public component API, behavior, geometry, motion, accessibility, and token model. Contract workers read those facts through the repository-configured `material3` MCP. `@m3e/web` is a private renderer and never defines Mioframe public API.

Workflow mechanics belong only to [`component-workflow.md`](./component-workflow.md). Family definition ownership belongs to [`component-contract.md`](./component-contract.md). This document owns durable library boundaries.

## Sources of truth

1. Material 3 MCP — canonical upstream Material semantics;
2. family `contract.ts` — public parameters/props, slots, events, configurations/types and defaults;
3. family `tokens.css` — executable current public component-token contract/catalogue;
4. family `BEHAVIOR.md` — normative observable behavior, accessibility, geometry and motion;
5. runtime code and executable proof — standalone implementation truth;
6. migrated consumers/product proof — adoption truth;
7. `docs/m3e-defects.md` — renderer defects/workarounds;
8. `docs/roadmap.md` — architect-maintained milestone status and next action.

A family `README.md` may contain ordinary developer documentation but is not a workflow source of truth or stage-completion record.

Legacy family `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` files are historical workflow evidence only until conversion.

## Ownership

Each official family owns its three technical contracts, Vue adapter, public component tokens, private renderer mappings/workarounds, and component-specific proof.

Product layers retain product state, persistence, routing, errors, operation lifecycle, availability/disabled guards, and business behavior.

Dependencies remain separate Material families consumed through canonical public APIs.

The architect owns semantic review of the resulting family/PR, correction routing after coding handoff, roadmap status, exact-head CI review, and merge readiness.

## Public Vue boundary

Public APIs use official Material terminology and idiomatic Vue semantics. They keep types renderer-independent and expose no raw m3e tags, attributes, events, types, classes, or CSS variables.

The public family contract is not demand-scoped. Current Mioframe consumers do not decide which official current Material configurations, states, content roles, events, or tokens exist in the canonical component.

Do not add undocumented convenience surface, platform-inapplicable surface, renderer vocabulary, legacy compatibility aliases, or speculative non-Material behavior.

## Definition dependency and isolation

API contract is the first definition boundary because it establishes the current developer-selectable configurations, content roles, public values and defaults.

Token and behavior extraction run afterward in separate fresh contexts. They may read completed `contract.ts` only for structural scope/terminology, while Material 3 MCP remains the sole factual authority for token/behavior semantics. If their Material evidence proves the structural boundary wrong, they return to the API owner instead of compensating locally.

Contract workers do not inspect m3e, legacy implementation, application consumers, or current call-site demand. They do not read one another's narrative reasoning.

There is no mandatory design, architecture, source-ledger, synthesis, guidance, definition-review, or coding-agent final-review stage in the normal path.

## Renderer boundary

Outside `src/shared/ui/material`, consumers must not import `@m3e/web`, render `m3e-*`, use renderer types/events, depend on `--m3e-*`, or inspect renderer DOM.

Inside standalone implementation, prefer documented exact-version renderer inputs, derive glue from exported types, keep mappings local, avoid private-shadow-DOM coupling, and do not recreate renderer-owned geometry, accessibility, state layer, ripple, focus, elevation, or motion.

A renderer limitation does not redefine a Material contract. Use a small family-local correction or documented exact-version workaround when that preserves the contracts; otherwise escalate rather than weakening public API/behavior/tokens.

Prefer explicit local mapping over generic adapter machinery. Generalize only when repeated proven needs make total ownership simpler.

Migration consumes only the finished canonical Mioframe Material API and current consumers; it does not inspect renderer internals or redefine Material.

## Token boundary

Foundation owns supported `--md-ref-*` and `--md-sys-*`; each family owns current official public `--md-comp-<family>-*`; application code owns `--app-*`; renderer/private internals own `--m3e-*` and `--md-private-*`.

Public component tokens derive from Material 3 MCP rather than current consumer overrides or renderer variables. Each family `tokens.css` is the executable public component-token catalogue; do not create a second central registry. Runtime renderer mappings remain private.

Historical/baseline token rows still present in Material documentation are not automatically part of the current Expressive public contract.

## Standalone-first integration

A canonical family enters standalone implementation once its API, token, and behavior contracts are complete.

The implementation is proven before application consumers are inspected for first migration. For later corrections, migration runs again only when the correction actually changes consumer usage or legacy ownership remains.

## Resume-first workflow

Contract workers write new owned artifacts only after their completion checks pass. A blocked worker must not leave a new partial contract file.

Repository artifacts are durable completed-stage results. A fresh invocation does not rerun a compatible completed current-workflow owner solely because previous chat context is unavailable.

An owner is normally reopened only when current repository state produces a mechanical compatibility route or an exact semantic correction marker names that owner/finding. Legacy staged families have one narrow transition rule: because the previous workflow could leave an old demand-scoped `tokens.css` but never created `BEHAVIOR.md`, current token derivation is repeated when necessary until the current token→behavior sequence reaches `BEHAVIOR.md`. An interruption between those two owners may therefore cause one bounded token re-derivation; no persistent completion marker or workflow-history state is added for that edge case.

If a semantic correction run is interrupted, its marker remains required on resume. If current state cannot be resolved by the normal routes plus the explicit legacy transition, the coding workflow stops at `needs-architect` rather than rebuilding everything.

An interrupted implementation resumes within the implementation owner from current runtime/proof and does not reopen contracts without an actual route.

## Proof and completion

Standalone implementation proves the canonical API, renderer mapping, public tokens, behavior, accessibility, geometry, motion, and standalone presentation at the lowest faithful level.

When a behavior requirement needs consumer-supplied native/ARIA information, the adapter must preserve an explicit public/native/ARIA seam. `inheritAttrs: false` is not permission to drop required accessibility inputs.

Source-level CSS assignment is not rendered token proof. Screenshots are not the sole oracle for fixed geometry/state semantics.

Migration separately proves required consumer adoption, preserved product behavior and legacy removal.

The coding-agent workflow then stops. The architect reviews Material fidelity, cross-contract reachability, exact-version renderer behavior, proof, consumers, ownership, and the full PR before exact-head CI/merge decisions.

Green automated checks do not replace architect semantic review.
