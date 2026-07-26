# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical project-facing Material library boundary, including migrated implementation, contracts, architecture documentation, and roadmap.

## Required workflow

- Read `docs/architecture.md`, `docs/component-adapter.md`, `docs/component-tokens.md`, and `docs/roadmap.md` before Material implementation or migration work.
- Use `material-component-adapter` for one explicitly selected official Material component or proven inseparable family implementation, migration, or adapter change.
- Use `architect-handoff` only when work changes cross-family ownership, global theme ownership, renderer strategy, public token architecture, or another decision not resolved by the adapter contract.
- Do not create Material policy or architecture documents under repository-level `docs/`; this library is their sole owner.

## Authority and ownership

- Official Material 3 Expressive documentation defines intended component meaning, behavior, visuals, and accessibility.
- Mioframe owns the public Vue `MD*` API, current application scenarios, controlled state, project extensions, consumer migration, and accepted public tokens.
- The exact lockfile-resolved `@m3e/web` public contract is the private renderer implementation source of truth.
- Exported TypeScript declarations from the exact m3e family entry point own renderer element properties and value types.
- Current consumers define behavior that must be preserved unless an explicit product decision changes it.

m3e is not the public API owner and is not independent Material authority.

## Supported surface

For a selected component, implement the minimum complete union of:

1. scenarios currently required by Mioframe consumers;
2. documented m3e capabilities that map directly to the canonical Material/Vue component without custom renderer reconstruction.

Do not:

- implement optional Material surface that neither Mioframe nor m3e supports;
- mirror every raw m3e property, event, slot, or CSS variable merely because it exists;
- recreate the complete Material token catalogue;
- add wrapper logic for a capability already provided correctly by m3e.

The public Vue API remains curated and canonical. m3e-only vocabulary stays private.

## m3e divergences

Compare the supported surface with the relevant official Material guidance and record confirmed differences in the family README.

Classify each divergence:

- **not required by Mioframe** — record it for possible m3e improvement; do not add wrapper complexity;
- **required by Mioframe and thinly correctable** — implement the smallest explicit wrapper correction using public m3e APIs and light DOM owned by Mioframe;
- **required but not safely correctable** — record an upstream blocker; do not use private shadow DOM, copied internals, or duplicated renderer systems.

Equivalent observable behavior implemented differently is not a divergence.

## Boundary

Only code under `src/shared/ui/material` may directly:

- import `@m3e/web`;
- render `m3e-*` custom elements;
- use renderer element types;
- map documented `--m3e-*` CSS variables.

Do not export or leak those details. Private shadow DOM, undocumented events/properties, internal classes, copied renderer internals, and deep styling are forbidden.

## Adapter design

- Implement one explicit component target at a time.
- Start from current consumers and the documented m3e family contract.
- Keep the adapter explicit and local.
- Preserve accepted Mioframe extensions such as loading.
- Keep consumer-controlled state in Vue and prevent renderer drift.
- Do not create a wrapper generator, universal base component, registry, generic schema, token DSL, all-components import, or speculative shared helper.

For M1, the migration target is `MDButton` only. `MDIconButton`, `MDFab`, and `MDExtendedFab` remain legacy-owned.

## Renderer typing

- Import renderer element classes and exported value types from the exact family entry point with type-only imports.
- Keep the Mioframe Vue API independently defined, but require mapped values to satisfy renderer-exported types.
- Vue ambient declarations may add framework glue only and must derive renderer properties from package types.
- Do not hand-copy renderer property lists or literal unions when usable package types exist.

## Theme and tokens

- Preserve only accepted active public tokens with repository consumer evidence or an intentional Mioframe documentation promise.
- A documented m3e CSS variable does not automatically require a public `--md-comp-*` counterpart.
- Use existing `--md-sys-*` theme roles directly when m3e already consumes equivalent Material semantics.
- Map an active public component token to a documented `--m3e-*` input only when Mioframe actually exposes that token.
- Remove declaration-only, test-only, and unused legacy token routes.
- Do not copy all m3e defaults into Mioframe or build a parallel component theme.

## Motion verification

Renderer-owned animation is not automatically testable through the public custom-element host.

For m3e-owned motion:

- inspect the exact installed implementation source to confirm the expected state transition, interruption handling, and reduced-motion branch;
- verify that the adapter does not replace, disable, or duplicate that implementation;
- require manual operator testing for actual visual quality and timing;
- do not create proxy browser assertions or screenshot matrices that claim to prove an animation they cannot observe;
- do not inspect private shadow DOM in automated tests.

Automated tests may cover public input acquisition or wrapper-owned behavior, but must not present that as proof of renderer animation.

## Verification

Verification is risk-based and limited to Mioframe-owned contracts:

- component-contract tests for public Vue props, emits, slots, normalization, and controlled state;
- browser tests for current user/native scenarios changed or constrained by the adapter;
- visual baselines for stable visible Mioframe output with meaningful regression risk;
- representative-consumer or dedicated build proof only when the migration changes that integration boundary and final verification does not already cover it;
- final `pnpm verify`.

Do not duplicate m3e or Lit tests. Themes, RTL, tokens, and optional renderer capabilities need separate proof only when Mioframe customizes them or a current scenario depends on them.

## Completion

A migration is complete when:

- renderer viability is `ready` for the supported surface;
- one canonical Vue owner remains and consumers are migrated;
- package-derived renderer typing is used;
- all current Mioframe scenarios and extensions are preserved;
- required m3e divergences are recorded and required thin corrections are implemented;
- only active accepted public tokens are preserved;
- relevant risk-based verification passes;
- operator accepts the first canonical visual result, including renderer-owned motion where applicable.

A skill invocation owns all known repository-local work within this resolved scope. It must not expand the scope to complete Material or m3e catalogues. `partial` is valid when implementation and automated verification are complete and only operator acceptance or a genuine external blocker remains.
