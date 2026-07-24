# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical project-facing Material library boundary, including migrated implementation, contracts, architecture documentation, and roadmap.

## Required workflow

- Read `docs/architecture.md`, `docs/component-adapter.md`, `docs/component-tokens.md`, and `docs/roadmap.md` before Material implementation or migration work.
- Use `material-component-adapter` for one explicitly selected official Material component or proven inseparable family implementation, migration, or adapter change.
- Use `architect-handoff` first when work changes cross-family ownership, global theme ownership, renderer strategy, public token architecture, or another decision not resolved by the adapter contract.
- Use applicable Vue and testing skills for implementation mechanics and proof.
- Do not create Material policy or architecture documents under repository-level `docs/`; this library is their sole owner.

## Authority and ownership

- Current official Material 3 Expressive documentation defines component meaning, usage, visual requirements, and accessibility intent.
- Mioframe owns the public Vue `MD*` API, supported subset, controlled state, native integration, public tokens, consumer migration, and verification.
- The exact selected `@m3e/web` public contract is a private renderer implementation dependency.
- Current consumers define scenarios that must be preserved unless an explicit product decision changes them.
- Existing legacy directories remain production owners until their focused migration reaches the exit gate.

Do not treat m3e as the public API owner or as independent Material authority.

## Boundary

Only code under `src/shared/ui/material` may directly:

- import `@m3e/web`;
- render `m3e-*` custom elements;
- use renderer element types;
- map documented `--m3e-*` CSS variables.

Do not export or leak those details. When product or generic shared UI consumes an official Material component, it uses the curated Mioframe Vue component. Native HTML and project-specific or generic shared UI remain valid when they are the correct owner.

Private shadow DOM, undocumented events/properties, internal classes, copied renderer internals, and deep styling are forbidden.

## Adapter design

- Implement one explicit component target at a time. Expand to a family only when current ownership proves component-only migration technically unsafe.
- Start from confirmed scenarios and current consumers.
- Use the configured Material source interface and record traceable source evidence.
- Select and inspect an exact stable, non-prerelease m3e version through primary package evidence.
- Record renderer viability, implementation ownership, and explicit Vue-to-m3e mapping in the family `README.md` before production edits.
- Expose the minimum complete Vue API required by current scenarios; do not copy the complete m3e API.
- Keep controlled semantic state consumer-owned and prevent hidden renderer-state drift.
- Preserve native form, link, focus, keyboard, disabled, and accessibility behavior where required.
- Keep project extensions explicit and narrowly justified.

For M1, the migration target is `MDButton` only. `MDIconButton`, `MDFab`, and `MDExtendedFab` remain legacy-owned unless the roadmap is changed from repository evidence before production edits.

Use explicit component-local code. Do not create a wrapper generator, universal base component, runtime registry, generic property/event schema, token DSL, all-components import, or shared adapter helper for the first pilot. Extract only after at least two unrelated adapters prove the identical mechanism and extraction reduces total complexity.

## Renderer and ownership states

Renderer viability:

- `unassessed` — exact version and required integration contract are not verified;
- `ready` — documented public m3e APIs cover every required scenario with a thin adapter;
- `blocked-upstream` — a required renderer contract is missing, defective, or unstable.

Implementation ownership:

- `legacy` — the current component remains the production owner;
- `migrating` — one focused change owns adapter creation, consumer migration, and target removal;
- `migrated` — the canonical Vue adapter is the only public owner for the migration target.

A blocked renderer requires ownership to remain `legacy`. Do not work around a blocker through shadow DOM, copied internals, broad CSS patches, duplicated interaction systems, or permanent compatibility paths.

## Dependency and registration

- Pin the verified `@m3e/web` version exactly, without a range.
- Import only the required family entry point.
- Shared build configuration owns Vue recognition of `m3e-*` consistently for application, Storybook, and tests.
- The selected component family owns element registration through its implementation import.
- Do not create global runtime registration or support multiple renderer versions.

## Theme and tokens

- Preserve accepted `--md-ref-*`, `--md-sys-*`, `--md-comp-*`, and `--app-*` contracts.
- Map to documented `--m3e-*` variables only inside the owning family.
- Do not expose `--m3e-*` to consumers or copy renderer defaults into public tokens without a current Mioframe contract.
- The existing Mioframe theme remains authoritative. Do not introduce `m3e-theme` as a second global owner without a separate ready architecture handoff.

## Verification

Every public adapter requires a colocated `<Component>.test.ts` component-contract test covering its stable Vue API and explicit integration mapping.

Add browser, visual, representative-consumer, and production-build proof according to risk. All are mandatory for the `MDButton` and `MDSwitch` pilots.

Do not duplicate m3e or Lit unit tests. Use final repository verification before reporting completion.

## Migration completion

A migration target must:

- have renderer viability `ready` and implementation ownership `migrated`;
- migrate all affected target imports and consumers;
- update target-owned public barrels, tests, stories, visual mappings, and documentation;
- remove the obsolete target implementation, exports, tests, and exclusively owned compatibility paths;
- preserve unrelated legacy components and shared modules;
- record unsupported Material surface and confirmed m3e deviations;
- update `docs/roadmap.md` only when milestone state, blocker, or next action changes.

Never report a component migrated while parallel public ownership or renderer leakage remains.