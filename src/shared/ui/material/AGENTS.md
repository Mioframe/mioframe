# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical project-facing Material Vue library boundary.

## Routing

- Use `material-component <name>` as the normal operator entrypoint for one official Material family.
- `docs/component-workflow.md` owns worker sequencing, gates, corrections, and completion.
- `docs/component-contract.md` owns the family definition artifacts and their isolation.
- `docs/component-adapter.md` owns Vue/m3e implementation invariants.
- `docs/component-tokens.md` owns token boundaries and rendered-result proof.
- `docs/m3e-defects.md` owns stable renderer-defect records.
- `docs/roadmap.md` alone owns mutable Material program status and next action.
- Use `architect-handoff` only when current contracts and repository rules cannot deterministically resolve an ownership, composition, or renderer decision.

Do not duplicate those detailed contracts in this file.

## Family definition

Official Material facts come from the repository-configured `material3` MCP server for the definition workers and independent reviewer.

A converted family has four canonical definition artifacts with separate owners:

- `contract.ts` — public parameters/props, slots, events, public values/types, and defaults;
- `tokens.css` — public official component-token contract/catalogue;
- `BEHAVIOR.md` — normative observable behavior, accessibility, geometry, and motion;
- `README.md` — official component description and correct-use guidance for developers; it is not a runtime contract.

Each artifact is authored in a fresh isolated worker. Definition workers must not inspect m3e, legacy implementation, application consumers/current demand, or another definition worker's reasoning. They may run in parallel only when the runtime can keep their independent file writes isolated safely.

Old family `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` files are legacy evidence only and are removed when that family completes the current workflow.

## Public and renderer boundary

- Expose official Material semantics through canonical Vue `MD*` APIs, independent from current Mioframe demand and m3e vocabulary.
- Standalone implementation must satisfy the three technical contracts before application consumers are inspected for migration.
- Migration uses the finished canonical API plus family `README.md` guidance; it does not redesign the Material family.
- Keep product state, persistence, routing, errors, operation lifecycle, and business rules outside Material.
- Consumers use the root `@shared/ui/material` entrypoint.
- Outside this directory, code must not import `@m3e/web`, render `m3e-*`, use renderer types/events, depend on `--m3e-*`, or inspect renderer DOM.
- Inside an owning family, keep renderer mappings/workarounds local and do not weaken canonical Material contracts to fit m3e.
- `--m3e-*` and `--md-private-*` remain private; `--app-*` remains outside Material; do not create a second public token catalogue or registry.

## Proof and handoff

Follow project-wide testing/Storybook rules and the proof contracts linked above. A declaration, source mapping, host attribute, story, or screenshot alone does not prove a different observable Material contract.

Operator visual/motion observations are defect evidence, not a positive-acknowledgement gate.

After fresh independent review succeeds, hand the family to the architect. Exact-head GitHub CI and merge readiness remain architect-owned.
