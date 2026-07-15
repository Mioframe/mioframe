---
name: implementation-preflight
description: 'Use this skill before non-trivial implementation work to reduce corrective commits by identifying owner boundaries, reusable project code, acceptance matrix, risk matrix, task breadth, work passes, and focused verification before the first production edit.'
---

# Implementation preflight

Use this skill before non-trivial code edits. Keep the preflight short and bounded; do not turn it into broad repository exploration or repeat scoped repository policy.

## Activation check

Use this skill when the task will likely change production code, test behavior, tooling, CI, app configuration, storage semantics, diagnostics, browser behavior, or user-visible UI.

Do not use this skill for trivial typo fixes, formatting-only changes, comments-only changes, or mechanical renames with no behavior or ownership decisions.

## Required preflight

For non-local changes, write a short preflight artifact before the first production edit.

Required sections:

0. **Upstream handoff check**: if the task includes an architecture handoff, do not repeat it. Confirm the verdict is `ready`, restate only decisions that affect planned edits, and verify the plan matches the handoff. If a non-trivial task has no handoff and ownership, source of truth, or expected final state is unclear, stop. For public Material component work, also confirm the ready `MATERIAL COMPONENT CONTRACT` from `docs/material-3/component-architecture.md`.
1. **Owner map**: identify source of truth, runtime owner, user-action owner, UI composition owner, error owner, retry/navigation owner, and verification owner when they apply.
2. **Public entry points**: name the owning FSD layer and public APIs that must be used instead of deep imports.
3. **Reuse**: identify existing helpers, components, configs, schemas, services, tests, or dependencies that already own nearby behavior.
4. **Minimum sufficient design**: map every planned concept to a current requirement or owner boundary; compare it with a narrower design and reject unrequested flexibility or stronger guarantees.
5. **Acceptance matrix**: list only reachable non-happy-path states required by the current contract.
6. **Risk matrix**: list only applicable browser, lifecycle, async, cache, CI/tooling, accessibility, visual, or data-safety risks.
7. **Breadth and passes**: identify independent domains and the order that keeps work incremental.
8. **Verification**: name the focused verify-managed check for the riskiest behavior and the final verification required.

If the upstream handoff verdict is missing or `not ready`, stop and return it for resolution. Do not infer readiness from a detailed task description.

If any required owner is unclear for a cross-layer change, stop and resolve the architecture before editing.

If the minimum sufficient design check finds an abstraction, extension point, compatibility path, recovery mechanism, optimization, or stronger guarantee without a current requirement, existing consumer, repository invariant, platform constraint, or measured need, stop and return the handoff for simplification. Do not silently redesign the contract or hide the same complexity by splitting it across more files.

For contract changes such as persisted formats, public APIs, shared UI contracts, service APIs, worker/provider boundaries, or cross-layer behavior, also record:

- affected consumer inventory;
- owner module;
- compatibility decision;
- edge-case matrix;
- verification plan per consumer.

For user-visible UI or UX changes, run `material3-guidelines` before choosing component structure, layout, interaction behavior, or visual verification. For copy-only or wiring-only changes that preserve the existing Material surface, record `Material impact: none`.

For `.vue`, UI composable, shared UI, widget, pane/page, or feature UI changes, run `vue-component-implementation` and include its concise component contract. If that contract is unclear, implementation is not ready.

## Public Material component architecture gate

For a new or materially changed public shared `MD*` component, the preflight must record exactly one architecture outcome:

- `Architecture impact: none` — a strictly local legacy repair preserves public API, native semantics, token contract, anatomy, supported states, per-property state resolution, and visual output outside the named defect;
- `Architecture impact: layered-v1` — the upstream handoff supplies the complete ready contract delta and exact files required by `docs/material-3/component-architecture.md`;
- `Architecture impact: blocked` — any required architecture or verification decision is unresolved.

For `layered-v1`, the preflight verifies rather than redesigns:

- `Architecture version`, `Change mode`, `Unresolved: none`, and `Readiness: ready` are present;
- a first migration provides the complete initial family contract, or a later change names the current family `README.md` and exact contract delta;
- public API, anatomy owners, configuration axes, semantic states, and interaction states are fully resolved;
- every stateful rendered property has a matrix row with its DOM owner, final variable, route sources, interaction inputs, winner order, and simultaneous outputs;
- each canonical official token names exactly one component or family token owner file;
- any family token file names at least two consuming public components and the exact applicable roots;
- exact production and verification files are named;
- consumer blast radius and verification matrix are complete.

If the implementer would need to choose a file, helper, context, token owner, property resolver, property owner, coexistence rule, unsupported surface, or verification exception, stop and return the handoff. Do not turn the choice into implementation detail.

## Scoped rule application

Use the applicable nested `AGENTS.md` and domain skills as the source of detailed invariants. The preflight records decisions; it does not duplicate those rules.

- For storage, service, worker, provider, cache, protocol, or lifecycle work, apply `src/AGENTS.md`, the applicable `src/shared/**/AGENTS.md`, and `crdt-storage`. Record the canonical fact owner, public path to UI, error owner, recovery owner, and forbidden UI reconstruction.
- For work across `entities`, `features`, `widgets`, or `pages`, apply their nested `AGENTS.md`. Record the model/read/action/composition split and the public API used between layers.
- For shared UI, apply `shared-ui-implementation`, `material3-guidelines`, and `docs/material-3/component-architecture.md`; record architecture impact, current family contract, exact delta, consumer blast radius, and browser/visual evidence.
- For diagnostics, apply `diagnostic-events` and the privacy rules under `src/AGENTS.md`; record only the boundary and safe diagnostic contract affected.

A scoped rule conflict is a blocker. Resolve it before editing rather than choosing whichever wording permits the implementation.

## Wide UI and refactor gate

For non-trivial UI, UX, or cross-layer refactors, additionally record:

- confirmed domain invariants and later user clarifications;
- existing user scenarios that must remain reachable, especially menus, navigation, settings, status indicators, and shared surfaces being replaced;
- owner layer and public entry point for each changed behavior;
- settings, preferences, persisted state, or feature flags whose semantics change;
- affected shared UI primitives and consumer blast radius;
- browser, visual, Storybook, e2e, mutation, and focused unit verification that applies.

Before completion, compare the diff with this gate. If a scenario, invariant, owner, public API, architecture decision, or minimum-design decision changed during implementation, update the handoff/preflight and fix the implementation before claiming completion.

## Breadth control

Before editing, count independent domains. Examples include domain read models, storage semantics, diagnostics, navigation, shared UI primitives, browser layout, e2e coverage, visual snapshots, tooling, and copy normalization.

- If the task touches four or more independent domains, split the work into explicit passes and run focused verification after each risky pass.
- Keep behavior-preserving cleanup separate from functional changes when practical.
- If the user did not explicitly ask to finish one existing branch, prefer proposing a split before starting a broad corrective implementation.
- If the task must stay in one branch, make the pass order explicit and do not start the next risky pass until the previous one has a focused check.

## Feature-flow guardrails

Use these rules for create/open/import/export, setup, picker, dialog, storage, permission, recovery, and other multi-step user flows.

- Start with only applicable states from: happy path, cancellation, unsupported platform/API, permission denial, invalid input, duplicate/conflict, stale data/race, partial failure, rollback failure, and recovery action.
- Separate different user intents into different feature contracts when they have different acceptance rules, UX copy, domain invariants, or recovery paths. Do not begin with a generic all-in-one composable, dialog, or state machine.
- Keep domain and storage invariants below UI layers. UI may request an action and display results, but the data owner enforces uniqueness, reserved names, marker detection, normalization, migrations, and lifecycle ordering.
- Make allowed and disallowed target states explicit. Prefer refusing invalid targets with clear recovery over accepting broad inputs and compensating later.
- Keep outcomes typed and local to the boundary that needs them. Avoid broad status protocols or result objects mixing field issues, transport failures, domain conflicts, and navigation unless several independent callers require them.
- If a feature requires a shared UI primitive change, decide whether it is a separate prerequisite. When kept in the same PR, make it minimal, Material-verified, independently tested, and explicit in blast-radius review.
- Delete obsolete paths, facades, providers, and tests in the same pass as their replacement unless compatibility is required.
- When two consecutive review rounds add concepts, abstractions, branches, protocols, configuration, recovery paths, ownership mistakes, mixed responsibilities, or scenarios, stop patching and redo the handoff and preflight.
- Prefer tests for domain invariants and extracted state transitions before component wiring. Browser behavior, layout, focus, gestures, and Material visual states require browser or visual verification.

## Bounded reuse search

Before creating a helper, component, config, dependency, or test pattern, use targeted repository search or direct imports to identify the current owner. Stop once the owner and reuse decision are clear. Do not begin with broad repository exploration unless evidence shows wider impact.

## Acceptance and risk matrix guidance

Consider only applicable states:

- unavailable or disabled integrations;
- missing browser APIs or unsupported runtime;
- async pending, cancellation, stale completion, and repeated toggles;
- invalid, malformed, or hostile input;
- cache invalidation after create, update, delete, or failed lookup;
- data-safety-sensitive values in diagnostics, URLs, names, ids, and content;
- accessibility structure and heading hierarchy;
- Material component choice, adaptive layout, focus, keyboard, touch, motion, and visual states;
- CI, build, Storybook, Playwright, verify, fix, or verbose modes for tooling changes.

Considering a matrix item does not require implementing it. Include behavior only when reachable through the current contract and required by a user flow, existing consumer, data-safety rule, platform constraint, or repository invariant. State intentionally unsupported behavior instead of adding speculative mechanisms.

## Output discipline

Keep the written preflight concise: usually 8-15 short lines plus a verification note. Do not repeat generic repository rules or the full Material component contract.

Before final handoff, report whether the resulting diff still matches the architecture handoff and family README. If it does not, fix the implementation or explicitly report the architectural divergence.
