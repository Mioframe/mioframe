# Mioframe Material architecture

## Decision

Mioframe exposes one canonical Vue Material library under `src/shared/ui/material`.

Official Material 3 Expressive defines the public component API, behavior, visual design, motion, accessibility, and token model. Contract workers read those facts through the repository-configured `material3` MCP. `@m3e/web` is a private renderer and never defines Mioframe public API.

Workflow mechanics belong only to [`component-workflow.md`](./component-workflow.md). Family definition ownership belongs to [`component-contract.md`](./component-contract.md). This document owns durable library boundaries.

## Sources of truth

1. Material 3 MCP — canonical upstream Material semantics;
2. family `contract.ts` — public parameters/props, slots, events, configurations/types and defaults;
3. family `tokens.css` — executable current public component-token contract and tokenized visual values;
4. family `BEHAVIOR.md` — remaining normative observable behavior, accessibility, interaction/layout relationships, motion and non-tokenized constraints;
5. runtime code and executable proof — standalone implementation truth;
6. migrated consumers/product proof — adoption truth;
7. `docs/m3e-defects.md` — renderer defects/workarounds;
8. `docs/roadmap.md` — architect-maintained milestone status and next action.

A family `README.md` may contain ordinary developer documentation but is not a workflow source of truth or stage-completion record.

Legacy family `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` files are historical workflow evidence only until conversion.

## Ownership

Each official family owns its three technical contracts, Vue adapter, public component tokens, private renderer mappings/workarounds, and component-specific proof.

`tokens.css` is the sole family contract owner for current official tokenized visual values. `BEHAVIOR.md` must not duplicate those values in prose; it owns the remaining normative observable behavior and non-tokenized relationships/constraints.

Product layers retain product state, persistence, routing, errors, operation lifecycle, availability/disabled guards, and business behavior.

Dependencies remain separate Material families consumed through canonical public APIs.

The architect owns semantic review of the resulting family/PR, correction routing after coding handoff, roadmap status, exact-head CI review, and merge readiness.

## Public Vue boundary

Public APIs use official Material terminology and idiomatic Vue semantics. They keep types renderer-independent and expose no raw m3e tags, attributes, events, types, classes, or CSS variables.

The public family contract is not demand-scoped. Current Mioframe consumers do not decide which official current Material configurations, states, content roles, events, or tokens exist in the canonical component.

Do not add undocumented convenience surface, platform-inapplicable surface, renderer vocabulary, legacy compatibility aliases, or speculative non-Material behavior.

## Definition dependency and isolation

Definition order is explicit:

```text
API → TOKEN → BEHAVIOR
```

API establishes the current developer-selectable configurations, content roles, public values and defaults.

Token runs next in a fresh context. It may read completed `contract.ts` only for structural scope/terminology, while Material 3 MCP remains the factual authority for token semantics.

Behavior runs after token in another fresh context. It may read completed `contract.ts` for structural scope and completed `tokens.css` only to exclude already-owned visual values. Material 3 MCP remains the sole factual authority for behavior semantics. Token names/defaults are not evidence that a behavior exists.

This order prevents one Material visual fact from having two normative family owners while preserving isolated semantic derivation. If token or behavior Material evidence proves the API structural boundary wrong, that worker returns to the API owner instead of compensating locally.

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

Public component tokens derive from Material 3 MCP rather than current consumer overrides or renderer variables. Each family `tokens.css` is the executable public component-token catalogue and sole contract owner for official tokenized color, geometry/size, shape, typography, spacing, elevation, opacity, focus-indicator metrics and other visual values; do not create a second central or prose catalogue. Runtime renderer mappings remain private.

Historical/baseline token rows still present in Material documentation are not automatically part of the current Expressive public contract.

## Behavior boundary

`BEHAVIOR.md` owns the Material-defined observable behavior left after tokenized visual values are excluded: anatomy/content relationships, state existence/relationships, interaction/input, keyboard, accessibility, layout relationships/non-tokenized constraints, motion and useful Material-unspecified boundaries.

It may describe the condition around a tokenized visual state without copying its token value. Exact geometry belongs in behavior only when it is an intrinsic normative component constraint with no corresponding current component token. External parent/layout placement guidance is not automatically a family behavior contract.

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

Standalone implementation proves the canonical API, renderer mapping, public tokens, remaining behavior, accessibility, token-driven visual/geometry results, non-tokenized layout constraints, motion, and standalone presentation at the lowest faithful level.

When a behavior requirement needs consumer-supplied native/ARIA information, the adapter must preserve an explicit public/native/ARIA seam. `inheritAttrs: false` is not permission to drop required accessibility inputs.

Source-level CSS assignment is not rendered token proof. Screenshots are not the sole oracle for numeric geometry or interaction semantics.

Migration separately proves required consumer adoption, preserved product behavior and legacy removal.

The coding-agent workflow then stops. The architect reviews Material fidelity, cross-contract reachability, exact-version renderer behavior, proof, consumers, ownership, and the full PR before exact-head CI/merge decisions.

Green automated checks do not replace architect semantic review.
