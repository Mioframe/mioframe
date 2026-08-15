# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical project-facing Material Vue library boundary.

## Routing

- Use `material-component <name>` as the normal operator entrypoint for one official Material family.
- `docs/component-workflow.md` owns orchestration and correction routing.
- `docs/component-contract.md` owns the three technical contract artifacts, the family README guidance artifact, and their isolation.
- `docs/component-adapter.md` owns Vue/m3e implementation invariants.
- `docs/component-tokens.md` owns token boundaries and rendered-result proof.
- Use `architect-handoff` only when ownership/composition/renderer decisions are genuinely non-deterministic from current contracts and repository rules.

Do not duplicate those detailed contracts in this file.

## Worker model

The normal workflow uses fresh isolated workers for:

```text
API contract       ┐
Token contract     │
Behavior contract  ├─→ definition-ready gate
Usage guidance     ┘
                        ↓
                 implementation
                        ↓
                    migration
                        ↓
               independent review
```

The four definition workers may run in parallel and each owns one artifact only. Standalone implementation and migration are separate worker contexts. Review must be independent from every authoring worker. If isolation is unavailable, report the workflow blocked rather than simulating several responsibilities in one context.

## Authority

For official Material facts, the definition workers and independent reviewer use the repository-configured `material3` MCP server in `.mcp.json`.

Each converted family owns exactly three mandatory technical contracts plus one mandatory developer-guidance artifact:

```text
contract.ts

tokens.css

BEHAVIOR.md

README.md
```

- `contract.ts` owns public parameters/props, slots, events, values/types and defaults.
- `tokens.css` owns the public official component-token contract/catalogue.
- `BEHAVIOR.md` owns normative observable behavior, accessibility, geometry and motion.
- `README.md` owns the official component description and correct-use guidance for developers. It is not a runtime contract.

Runtime code/tests are implementation truth. `docs/m3e-defects.md` owns stable renderer defect records. `docs/roadmap.md` alone owns mutable program status/next action.

Old family DESIGN/ARCHITECTURE/IMPLEMENTATION/MIGRATION/REVIEW files are legacy evidence only and are removed when that family completes the current workflow.

Some project-wide testing migration documentation still refers to a family `ARCHITECTURE.md` when describing already-migrated legacy Material proof. For a converted/new family, that wording means the canonical contracts and current scoped Material rules; do not create or retain an `ARCHITECTURE.md` merely to satisfy historical testing terminology.

## Public boundary

- Expose official Material semantics through canonical Vue `MD*` APIs.
- The public contracts and guidance are independent from current Mioframe consumer demand and from m3e vocabulary.
- Standalone implementation must be complete before consumers are inspected for migration.
- Migration must apply canonical Material usage guidance instead of preserving an incorrect legacy component choice for convenience.
- Keep product state, persistence, routing, errors, operation lifecycle and business rules outside Material.
- Consumers use the root `@shared/ui/material` entrypoint.

## Definition isolation

During API/token/behavior/guidance work:

- Material facts come from `material3` MCP;
- do not inspect `@m3e/web`;
- do not inspect legacy component implementation;
- do not inspect application consumers/current demand;
- do not combine API, token, behavior and guidance ownership in one worker;
- do not add mandatory SOURCES/synthesis/review artifacts to the normal definition path.

The orchestrator performs only the mechanical definition-ready gate.

## Renderer boundary

Outside this directory, code must not import `@m3e/web`, render `m3e-*`, use renderer types/events, depend on `--m3e-*`, or inspect renderer DOM.

Inside an owning family implementation:

- inspect exact lockfile-resolved renderer documentation/examples/public artifacts for affected mappings;
- prefer documented renderer seams and family-local glue;
- do not recreate renderer-owned geometry, accessibility, state layer, ripple, focus, elevation, or motion;
- do not weaken the Material contracts to fit the renderer;
- do not add a generic adapter framework without demonstrated repeated need and an architecture decision.

Migration does not inspect renderer internals; it consumes only the finished canonical Mioframe Material API plus family `README.md` guidance.

## Tokens

- foundation owns supported `--md-ref-*` and `--md-sys-*` roles and theme assignments;
- each family `tokens.css` owns and catalogues its official public `--md-comp-*` contract;
- renderer `--m3e-*` and `--md-private-*` stay private;
- `--app-*` stays outside Material;
- no second token catalogue, registry, DSL, TypeScript mirror, or compatibility alias layer.

Public token mappings are accepted only when the required rendered result is proven.

## Proof

Follow project-wide testing/Storybook rules. Use the lowest faithful proof.

- component tests: Vue API and adapter boundaries;
- browser proof: pointer/keyboard/focus/accessibility and fixed numeric geometry;
- visual proof: stable renderer-owned appearance/motion states;
- browser rendered results: public token mappings;
- product E2E: cross-owner product scenarios only.

A story, declaration, host attribute, source mapping, or screenshot alone does not prove a different observable contract.

Operator visual/motion observations are defect evidence, not a positive-acknowledgement gate.

After fresh independent review succeeds, hand the family to the architect. Exact-head GitHub CI and merge readiness remain architect-owned.
