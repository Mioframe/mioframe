# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical project-facing Material Vue library boundary.

## Routing

- Use `material-component <name>` as the normal operator entrypoint for one official Material family.
- `docs/component-workflow.md` owns orchestration and correction routing.
- `docs/component-contract.md` owns family contract artifacts and separation.
- `docs/component-adapter.md` owns Vue/m3e implementation invariants.
- `docs/component-tokens.md` owns token boundaries and rendered-result proof.
- Use `architect-handoff` only when contract/renderer/ownership/composition decisions are genuinely non-deterministic from those sources.

Do not duplicate those detailed contracts in this file.

## Worker model

The normal workflow uses fresh isolated workers for:

```text
contract
  → implementation + migration
  → independent review
```

Review must be independent from the authoring workers. If isolation is unavailable, report the workflow blocked rather than simulating independence in one context.

## Authority

Official Material 3 Expressive defines the canonical public component, behavior, usage, accessibility, geometry, motion, and token model.

Each converted family owns:

```text
contract.ts

tokens.css

BEHAVIOR.md

GUIDANCE.md

SOURCES.md
```

Runtime code/tests are implementation truth. `docs/token-api.md` is the supported runtime token index. `docs/m3e-defects.md` owns stable renderer defect records. `docs/roadmap.md` alone owns mutable program status/next action.

Old family DESIGN/ARCHITECTURE/IMPLEMENTATION/MIGRATION/REVIEW files are legacy evidence only and are removed when that family completes the current workflow.

## Public boundary

- Expose official Material semantics through canonical Vue `MD*` APIs.
- The public contract is independent from current Mioframe consumer demand and from m3e vocabulary.
- Consumers adapt to the canonical component after standalone component proof.
- Keep product state, persistence, routing, errors, operation lifecycle and business rules outside Material.
- Consumers use the root `@shared/ui/material` entrypoint.

## Renderer boundary

Outside this directory, code must not import `@m3e/web`, render `m3e-*`, use renderer types/events, depend on `--m3e-*`, or inspect renderer DOM.

Inside an owning family:

- inspect exact lockfile-resolved renderer documentation/examples/public artifacts for affected mappings;
- prefer documented renderer seams and family-local glue;
- do not recreate renderer-owned geometry, accessibility, state layer, ripple, focus, elevation, or motion;
- do not weaken the Material contract to fit the renderer;
- do not add a generic adapter framework without demonstrated repeated need and an architecture decision.

## Tokens

- foundation owns supported `--md-ref-*` and `--md-sys-*` roles and theme assignments;
- each family `tokens.css` owns its official public `--md-comp-*` contract;
- renderer `--m3e-*` and `--md-private-*` stay private;
- `--app-*` stays outside Material;
- no token registry/DSL/TypeScript mirror/compatibility alias layer.

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
