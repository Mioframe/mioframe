# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical project-facing Material Vue library boundary.

## Routing

- Use `material-component <name>` as the normal entrypoint for one official Material family. The operator does not supply a stage or correction handoff.
- `.agents/skills/material-component/SKILL.md` owns executable sequencing, resume, correction routing, and coding-agent completion.
- `docs/component-workflow.md` explains workflow architecture only.
- `docs/component-contract.md`, `docs/component-adapter.md`, and `docs/component-tokens.md` own stable contract/adapter/token design rules.
- `.agents/skills/verification/SKILL.md` owns verifier execution mechanics; exact-head CI remains architect-owned.
- `docs/m3e-defects.md` owns stable renderer-defect records.
- `docs/roadmap.md` is architect-maintained program status.

Do not duplicate detailed orchestration mechanics here.

## Family contracts

A converted family has exactly three ordered technical contracts:

- `contract.ts` — canonical public Vue structure and defaults;
- `tokens.css` — current public Material component-token names/defaults and tokenized visual values;
- `BEHAVIOR.md` — normative observable behavior not already represented by token-owned visual values.

Contract order is `API → TOKEN → BEHAVIOR`. Material facts come from the repository-configured Material3 MCP. The token worker uses `contract.ts` only as structural scope/terminology. The behavior worker uses `contract.ts` as structural scope and completed `tokens.css` only as an exclusion boundary so token-owned colors, dimensions, spacing, shape, typography, elevation, opacity, focus-indicator metrics, and other visual values are not duplicated in prose.

`BEHAVIOR.md` may still own anatomy/content relationships, interaction/input, keyboard, accessibility, state relationships, layout relationships/non-tokenized constraints, motion, and Material-unspecified boundaries. Exact geometry belongs there only when it is a normative intrinsic component constraint with no corresponding current component token.

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

## Token cascade hard invariants

`docs/component-tokens.md` is the single detailed authority for component-token cascade/ownership.

- A family `tokens.css` is the single owner of that family's public `--md-comp-*` names/defaults; family defaults are declared on `:root`.
- Family `tokens.css` must be loaded as unscoped/global CSS; do not import it through a Vue `<style scoped>` block.
- Component/family implementation CSS owns private renderer bridges and may own intentional contextual overrides, but must not redeclare family defaults or duplicate them in renderer fallbacks.
- Do not solve component-token composition with specificity escalation, `!important`, inline token wiring, TypeScript token maps, or bundle/source-order dependence.
- `--md-ref-*` / `--md-sys-*` are document-wide Material theme inputs; independent subtree Material system themes are not currently guaranteed.

## Vue/component boundary

- Use one stable family block class for component styling/private renderer adaptation; do not add aliases solely for token ownership.
- With `inheritAttrs: false`, explicitly preserve every native/ARIA seam required by the public/behavior contract.
- Keep public events idiomatic and type-safe; do not force normal consumers through dynamic `v-on`/casts to bypass template typing.

## Proof and handoff

Source wiring is not rendered proof. Use the lowest faithful observable proof for accessibility, token-driven appearance/geometry, non-tokenized layout relationships, RTL, states, token effects, composition/cascade, and motion.

When standalone implementation requires new or materially changed behavioral proof, author that proof first in a separate test-author context following root `test-first`, `test-authoring`, and the selected proof-type skill. The implementation context treats the accepted oracle/expectations/assertions as read-only and routes a genuine proof/contract conflict back to the test-author or architect instead of rewriting proof to fit m3e/runtime behavior. This changes test authorship only; it does not alter Material owner order, contract sequencing, or workflow state.

When one Material component contextually overrides another family's public token, proof must show both that the nested component receives the override and that removing it restores the family default.

Follow the repository `verification` skill. Focused verifier commands are optional feedback during implementation/correction or narrow task-specific proof. Do not add a Material-specific mandatory final local verification gate and do not ask the operator to run verifier commands. GitHub exact-head CI is the architect-owned automatic repository gate.

Coding work ends when contracts, standalone implementation/proof, and required migration are complete, deterministic routing is clean, and no semantic coding correction remains. Final semantic review, roadmap status, PR/CI handling, and merge readiness are architect-owned.
