# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical project-facing Material Vue library boundary.

## Routing

- Use `material-component <name>` as the normal entrypoint for one official Material family. The operator does not supply a stage or correction handoff.
- `.agents/skills/material-component/SKILL.md` owns executable sequencing, resume, correction routing, and coding-agent completion.
- `docs/component-workflow.md` explains workflow architecture only.
- `docs/component-contract.md`, `docs/component-adapter.md`, and `docs/component-tokens.md` own stable contract/adapter/token design rules.
- `.agents/skills/verification/SKILL.md` owns verifier execution mechanics, including command-scoped approval/escalation.
- `docs/m3e-defects.md` owns stable renderer-defect records.
- `docs/roadmap.md` is architect-maintained program status.

Do not duplicate detailed orchestration mechanics here.

## Family contracts

A converted family has exactly three technical contracts:

- `contract.ts` — canonical public Vue structure and defaults;
- `tokens.css` — current public Material component-token catalogue;
- `BEHAVIOR.md` — normative observable behavior, accessibility, geometry, states, and motion.

Material facts come from the repository-configured Material3 MCP. API runs first; token and behavior workers may use `contract.ts` only as structural scope/terminology and derive their own facts from Material3 MCP.

Contract workers must not use m3e, legacy implementation, application consumers/current demand, or another worker's narrative reasoning as Material authority.

A family `README.md` is ordinary developer documentation, not a workflow gate. Legacy `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` are legacy evidence only and are removed when that family completes conversion.

## Public and renderer boundary

- Expose canonical Material semantics through Vue `MD*` APIs.
- Complete standalone implementation and proof before inspecting consumers.
- Run migration only when consumers or replaced legacy ownership actually require changes.
- Keep product state, persistence, routing, errors, operation lifecycle, and business rules outside Material.
- Consumers import through the root `@shared/ui/material` entrypoint.
- Outside this directory, do not import `@m3e/web`, render `m3e-*`, use renderer types/events, depend on `--m3e-*`, or inspect renderer DOM.
- Inside an owning family, keep renderer mappings/workarounds local and never weaken a correct canonical contract to fit m3e.
- Public component tokens and private renderer token bridges remain CSS-owned. Runtime Vue/TypeScript may select configuration but must not become a token catalogue or custom-property mapping engine.
- Use one stable family block class as the component styling/token boundary; do not add a second alias class solely to attach public token defaults.
- With `inheritAttrs: false`, explicitly preserve every native/ARIA seam required by the public/behavior contract.

## Proof and handoff

Source wiring is not rendered proof. Use the lowest faithful observable proof for accessibility, geometry, RTL, states, token effects, and motion.

Required focused verifier checks are coding-agent work. If sandbox/Podman blocks canonical `pnpm verify ...`, use the `verification` skill's narrowly scoped approval/escalation path; do not ask the operator to run verifier commands.

Coding work ends only after contracts, standalone implementation/proof, and required migration are complete, deterministic routing is clean, and no semantic correction remains. Final semantic review, roadmap status, PR/CI handling, and merge readiness are architect-owned.
