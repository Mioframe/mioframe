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
- `tokens.css` — current public Material component-token catalogue/defaults;
- `BEHAVIOR.md` — normative observable behavior, accessibility, geometry, states, and motion.

Material facts come from the repository-configured Material3 MCP. API runs first; token and behavior workers may use `contract.ts` only as structural scope/terminology and derive their own facts from Material3 MCP.

Contract workers must not use m3e, legacy implementation, application consumers/current demand, or another worker's narrative reasoning as Material authority.

A family `README.md` is ordinary developer documentation, not a workflow gate.

## Public and renderer boundary

- Expose canonical Material semantics through Vue `MD*` APIs.
- Complete standalone implementation and proof before inspecting consumers.
- Run migration only when consumers or replaced legacy ownership actually require changes.
- Keep product state, persistence, routing, errors, operation lifecycle, and business rules outside Material.
- Consumers import through the root `@shared/ui/material` entrypoint.
- Outside this directory, do not import `@m3e/web`, render `m3e-*`, use renderer types/events, depend on `--m3e-*`, or inspect renderer DOM.
- Inside an owning family, keep renderer mappings/workarounds local and never weaken a correct canonical contract to fit m3e.

## Token cascade

- Family `tokens.css` is the single owner of that family's public `--md-comp-*` names and Material defaults.
- Family-owned `--md-comp-*` defaults are declared on `:root`, not on `.md-<component>` or another local selector.
- `--md-comp-*` remains inheritable public override input: a closer ancestor/composer/consumer may intentionally override it for nested instances.
- `.md-<component>` is the stable family styling/private-renderer bridge boundary, not the owner of public token defaults.
- Private `--md-comp-* → --m3e-*` mappings remain CSS-owned and must not repeat Material defaults.
- Runtime Vue/TypeScript may select configuration but must not become a token catalogue or custom-property mapping engine.
- Do not use specificity escalation, `!important`, inline token wiring, or bundle/source order to make contextual overrides win.
- Material `--md-ref-*`/`--md-sys-*` are document-wide theme inputs. Future global user theme settings are supported; independent subtree Material system themes are not currently guaranteed.

## Vue/component boundary

- Use one stable family block class for component styling and private renderer-token mapping; do not add alias classes solely for token ownership.
- With `inheritAttrs: false`, explicitly preserve every native/ARIA seam required by the public/behavior contract.
- Keep public events idiomatic and type-safe; do not force normal consumers through dynamic `v-on`/casts to bypass template typing.

## Proof and handoff

Source wiring is not rendered proof. Use the lowest faithful observable proof for accessibility, geometry, RTL, states, token effects, composition/cascade, and motion.

When one Material component contextually overrides another family's public token, proof must show the nested component receives the override and that removing it restores the family `:root` default.

Required focused verifier checks are coding-agent work. If sandbox/Podman blocks canonical `pnpm verify ...`, use the `verification` skill's narrowly scoped approval/escalation path; do not ask the operator to run verifier commands.

Coding work ends only after contracts, standalone implementation/proof, and required migration are complete, deterministic routing is clean, and no semantic correction remains. Final semantic review, roadmap status, PR/CI handling, and merge readiness are architect-owned.
