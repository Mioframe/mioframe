---
name: material-component-authoring
description: 'Use for creating, migrating, aligning, or materially changing an official public Material component family, including legacy MD* components outside the canonical library. Owns the complete execution order from task classification and source lookup through blueprint readiness, implementation passes, migration, verification, and review.'
paths:
  - 'src/shared/ui/material/components/**'
---

# Material component authoring

Use this as the primary execution workflow for official public Material component work.

It applies to:

- a new public `MD*` component;
- migration of a legacy `MD*` component or family into `src/shared/ui/material`;
- first `layered-v1` architecture conversion;
- Material alignment of an accepted family;
- a material change to a migrated component's API, native semantics, anatomy, states, tokens, property routing, behavior, Storybook surface, or verification contract.

It does not apply to project-specific shared UI, ordinary product composition, or a strict legacy repair that validly records `Architecture impact: none`.

This skill owns execution order and stop conditions. Canonical schemas and durable invariants remain in `docs/material-3`.

## Required companion instructions

Use:

- `material3-guidelines` for official source authority, component choice, usage, and minimum supported surface;
- `material-foundation` only when a foundation dependency changes;
- `vue-component-implementation` for Vue implementation mechanics;
- `component-contract-testing` for public component contracts;
- `ui-browser-behavior` for real browser-owned behavior;
- `visual-regression-testing` for canonical matrices and baseline diffs;
- `verification` for focused and final repository checks.

Do not use `shared-ui-implementation` as the authoring workflow for an official Material family. Generic repository and Vue rules still apply where they do not conflict with the Material architecture.

## 1. Classify the task

Before production edits, record exactly one component change mode:

- `new-component`;
- `library-relocation-only`;
- `architecture-only`;
- `alignment-only`.

Also record the authoring mode:

- `standard-authoring` when all decisions are source-resolved;
- `handoff-authoring` when a ready architecture handoff defines the exact delta;
- `blocked` when a required decision remains unresolved.

A strict local repair to an unmigrated component may exit this workflow only when it preserves location, imports, public API, native semantics, foundation dependencies, anatomy, states, testing surface, behavior, and unrelated rendered output.

Do not combine relocation, architecture conversion, foundation correction, broad cleanup, and visual alignment unless an explicit ready handoff defines the combined scope.

## 2. Resolve sources and scope

1. Start from named scenarios and current consumers.
2. When no scenario is supplied, use canonical Material default usage only.
3. Check the relevant official documentation through the source hierarchy.
4. Use the official Material Design Kit only when published docs cannot resolve exact visual geometry, anatomy, or state composition.
5. Define the minimum complete supported surface.
6. Record optional official capabilities as unsupported rather than implementing them speculatively.
7. Add no Mioframe extension without an explicit requirement, owner, and deviation record.

Stop when required guidance is missing and the surface cannot be narrowed without losing a required scenario.

## 3. Inspect current ownership

Inspect only the affected family and direct dependencies:

- current component files and public exports;
- family consumers and wrappers;
- component registry and deviation records;
- library migration map;
- applicable foundation registry records and owner contracts;
- current Storybook, contract, browser, visual, snapshot, and risk-registration artifacts.

Do not inspect unrelated families to design a generic abstraction.

## 4. Complete the canonical blueprint

Before production code, create or update the family `README.md` using the complete schema from `component-architecture.md`.

The blueprint must resolve:

- family ownership and library paths;
- scenarios, usage, supported and unsupported surface;
- official source snapshots and Design Kit evidence when required;
- public API, native semantics, invalid combinations, states, anatomy, and DOM/accessibility owners;
- foundation dependencies and change modes;
- smallest architecture profile and exact production files;
- token ownership and rendered-property routes;
- exports, consumers, Storybook, tests, snapshots, and review requirements.

Do not begin production edits until `Unresolved: none` and `Readiness: ready` are truthful.

## 5. Resolve foundation dependencies

For every applicable foundation domain:

1. identify the accepted current owner and canonical owner;
2. confirm registry status and the exact supported contract required by the component;
3. reuse the accepted contract when sufficient;
4. classify any change as `library-relocation-only`, `additive`, `correction`, `replacement`, or `refresh`;
5. apply `material-foundation` when the contract changes.

`missing` and `blocked` dependencies prevent component readiness. Do not create a family-local substitute.

A foundation correction or replacement should normally be a focused prerequisite unless the small component delta is inseparable and explicitly approved.

## 6. Plan implementation passes

Use `implementation-preflight` only for a compact owner, risk, pass-order, and verification record. Do not repeat the blueprint.

Prefer this pass order when applicable:

1. source-backed blueprint and registry/map updates;
2. foundation prerequisite or accepted dependency wiring;
3. production family files and public export;
4. consumer/import migration;
5. contract tests;
6. Storybook and canonical `StateMatrix`;
7. browser and visual verification;
8. obsolete-path removal and final consistency pass.

Reorder passes only when repository dependencies require it. Do not start the next risky pass before focused verification of the previous one.

## 7. Implement the family contract

- Use exactly the smallest selected profile: `simple`, `configured`, `stateful`, or `configured-stateful`.
- Keep props, emits, slots, native bindings, runtime fact acquisition, events, and anatomy explicit in Vue.
- Prefer native HTML activation, form, navigation, and accessibility semantics.
- Keep DOM-critical attributes explicit on their actual owner.
- Keep token declarations, configuration routing, state resolution, and final rendering in their canonical layers.
- Use the shortest valid token/property pipeline.
- Keep controlled semantic state consumer-owned and transient state narrowly component-owned.
- Define acquisition, release, cancellation, disabled, failure, and unmount behavior for owned transient state.
- Do not deep-style another component family or create private cross-family dependencies.

Do not introduce universal bases, runtime registries, generic resolvers, CSS DSLs, cross-family state machines, broad option bags, test-only production APIs, or speculative extension points.

## 8. Create a new component

For `new-component`:

1. create the family directly under `src/shared/ui/material/components/<family>`;
2. create only files declared by the ready blueprint;
3. expose the component through the family entry point and curated Material root export when available;
4. add no compatibility alias or legacy implementation;
5. document supported usage, unsupported surface, extensions, deviations, and source evidence;
6. complete the standard test profile before reporting implementation complete.

A new public `MD*` component must not be introduced incidentally without completing this workflow.

## 9. Migrate a legacy component

For relocation or first architecture migration:

1. migrate one cohesive family per focused PR;
2. preserve API, behavior, tokens, and rendered output unless the selected mode explicitly permits a named delta;
3. update every in-repository consumer import;
4. update family blueprint, library map, component/foundation registries, exports, stories, tests, snapshots, and risk registration;
5. create or consolidate the canonical test profile;
6. remove obsolete files and legacy exports in the same PR;
7. allow a temporary compatibility path only when atomic migration is technically unsafe, with exact consumers, no new usage, and a removal target.

Do not call a component migrated while an active legacy owner or undocumented parallel path remains.

## 10. Complete the standard proof profile

Every new or migrated public component requires:

1. static and structured architecture validation;
2. colocated Vue Test Utils component-contract tests;
3. exactly one canonical Storybook `StateMatrix`;
4. bounded Playwright visual regression;
5. Storybook Playwright behavior tests for real browser-owned behavior when applicable;
6. focused pure helper/composable tests when applicable;
7. changed-consumer preservation checks;
8. required architecture, Material, and human visual review.

The matrix covers every distinct supported component-owned visible route, not every state name. Forced state proves appearance only. Real focus, keyboard, pointer/touch, drag, overlay, responsive, motion, cancellation, and cleanup behavior uses real browser input.

An automated agent reports human visual review as `required` or `blocked`, never `passed`.

## 11. Completion gate

Before completion, use `component-conversion-checklist.md` and confirm:

- blueprint, code, library map, registries, exports, consumers, Storybook, tests, snapshots, and risk registration agree;
- every required foundation dependency is non-blocking;
- no unsupported capability is exposed accidentally;
- no local foundation substitute, obsolete path, permanent alias, or speculative abstraction remains;
- static and structured validation passes;
- required review gates are accepted or remain explicit merge blockers;
- final `pnpm verify` passes.

If implementation discovers a new architecture, ownership, compatibility, source, foundation, or verification decision, stop and update the blueprint or handoff before continuing.
