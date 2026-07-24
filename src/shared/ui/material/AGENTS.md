# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical project-facing Material library boundary, including its implementation, contracts, architecture documentation, and roadmap.

## Required workflow

- Read `docs/architecture.md`, `docs/component-adapter.md`, `docs/component-tokens.md`, and `docs/roadmap.md` before Material implementation or migration work.
- Use `material-component-adapter` for one official Material family implementation, migration, or Material adapter change.
- Use `architect-handoff` first when work changes cross-family ownership, global theme ownership, renderer strategy, public token architecture, or another decision not resolved by the adapter contract.
- Use applicable Vue and testing skills for implementation mechanics and proof.
- Do not create Material policy or architecture documents under repository-level `docs/`; this library is their sole owner.

## Authority and ownership

- Current official Material 3 Expressive documentation defines component meaning, usage, visual requirements, and accessibility intent.
- Mioframe owns the public Vue `MD*` API, supported subset, controlled state, native integration, public tokens, consumer migration, and verification.
- The pinned `@m3e/web` public contract is a private renderer implementation dependency.
- Current consumers define scenarios that must be preserved unless an explicit product decision changes them.

Do not treat m3e as the public API owner or as independent Material authority.

## Boundary

Only code under `src/shared/ui/material` may directly:

- import `@m3e/web`;
- render `m3e-*` custom elements;
- use renderer element types;
- map documented `--m3e-*` CSS variables.

Do not export or leak those details. Product and generic shared UI consumers use the curated Vue components only.

Private shadow DOM, undocumented events/properties, internal classes, copied renderer internals, and deep styling are forbidden.

## Adapter design

- Implement one cohesive family at a time.
- Start from confirmed scenarios and current consumers.
- Inspect the current official Material contract and the exact public API of the pinned m3e family entry point.
- Record renderer viability and the explicit Vue-to-m3e mapping in the family `README.md` before production edits.
- Expose the minimum complete Vue API required by current scenarios; do not copy the complete m3e API.
- Keep controlled semantic state consumer-owned and prevent hidden renderer-state drift.
- Preserve native form, link, focus, keyboard, disabled, and accessibility behavior where required.
- Keep project extensions explicit and narrowly justified.

Use explicit family-local code. Do not create a wrapper generator, universal base component, runtime registry, generic property/event schema, token DSL, or shared adapter helper for the first pilot. Extract only after at least two unrelated adapters prove the identical mechanism and extraction reduces total complexity.

## Theme and tokens

- Preserve accepted `--md-ref-*`, `--md-sys-*`, `--md-comp-*`, and `--app-*` contracts.
- Map to documented `--m3e-*` variables only inside the owning family.
- Do not expose `--m3e-*` to consumers or copy renderer defaults into public tokens without a current Mioframe contract.
- The existing Mioframe theme remains authoritative. Do not introduce `m3e-theme` as a second global owner without a separate ready architecture handoff.

## Viability and fallback

Use:

- `ready` when documented m3e public APIs cover every required scenario with a thin adapter;
- `blocked-upstream` when a required renderer contract is missing or defective;
- `retain-legacy` when the existing implementation remains safer;
- `migrating` during one complete adapter and consumer migration;
- `migrated` only after the canonical Vue owner is active and the legacy owner is removed.

Do not work around a blocker through shadow DOM, copied internals, broad CSS patches, duplicated interaction systems, or permanent compatibility paths.

## Verification

Test contracts owned by Mioframe:

- props, emits, slots, defaults, invalid combinations, and controlled state;
- property, attribute, event, slot, and token mapping;
- native form/navigation integration and public accessibility wiring;
- browser behavior that the adapter changes or constrains;
- representative consumers and visible output where applicable;
- production build and required custom-element registration.

Do not duplicate m3e or Lit unit tests. Use final repository verification before reporting completion.

## Migration completion

A family migration must:

- migrate affected imports and consumers;
- update applicable public barrels, tests, stories, visual mappings, and family documentation;
- remove obsolete implementation, exports, tests, and compatibility paths;
- record unsupported Material surface and confirmed m3e deviations;
- update `docs/roadmap.md` only when milestone state, blocker, or next action changes.

Never report a family migrated while parallel permanent ownership or renderer leakage remains.
