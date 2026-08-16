# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical project-facing Material Vue library boundary.

## Routing

- Use `material-component <name>` as the normal entrypoint for one official Material family.
- `docs/component-workflow.md` owns worker sequencing, resume rules, gates, corrections, and coding-agent completion.
- `docs/component-contract.md` owns the three family definition artifacts and their isolation.
- `docs/component-adapter.md` owns Vue/m3e implementation invariants.
- `docs/component-tokens.md` owns token boundaries and rendered-result proof.
- `docs/m3e-defects.md` owns stable renderer-defect records.
- `docs/roadmap.md` is architect-maintained program status; coding stages do not mark review/CI/merge completion there.
- Use `architect-handoff` only when current contracts and repository rules cannot deterministically resolve ownership, composition, or renderer behavior.

Do not duplicate those detailed contracts here.

## Family definition

Official Material facts come from the repository-configured `material3` MCP server for exactly three isolated contract workers:

- `contract.ts` — public parameters/props, slots, events, public configurations/types, and defaults;
- `tokens.css` — current official public component-token contract/catalogue;
- `BEHAVIOR.md` — normative observable behavior, accessibility, geometry, and motion.

Definition workers must not inspect m3e, legacy implementation, application consumers/current demand, or another worker's reasoning.

A family `README.md` may contain ordinary developer documentation but is not a definition worker artifact or workflow gate.

Old family `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` files are legacy evidence only and are removed when that family completes conversion.

## Resume and correction

- Existing completed contract artifacts are durable stage results.
- Reinvoking `material-component` does not recreate them solely because the new agent lacks previous chat context.
- Reopen a completed stage only from an exact architect correction handoff naming the owner/finding.
- If current stage cannot be determined mechanically, stop at `needs-architect` rather than rerunning the full pipeline.
- After two unsuccessful correction rounds for one underlying problem, return to architecture.

## Public and renderer boundary

- Expose official Material semantics through canonical Vue `MD*` APIs, independent from current Mioframe demand and m3e vocabulary.
- Standalone implementation satisfies the three contracts before consumers are inspected.
- Migration runs only when current consumers or replaced legacy ownership actually require it.
- Keep product state, persistence, routing, errors, operation lifecycle, and business rules outside Material.
- Consumers use the root `@shared/ui/material` entrypoint.
- Outside this directory, code must not import `@m3e/web`, render `m3e-*`, use renderer types/events, depend on `--m3e-*`, or inspect renderer DOM.
- Inside an owning family, keep renderer mappings/workarounds local and do not weaken canonical contracts to fit m3e.
- `--m3e-*` and `--md-private-*` remain private; `--app-*` remains outside Material.

## Proof and handoff

A declaration, source mapping, host attribute, story, or screenshot alone does not prove a different observable Material contract. Token/state/motion/geometry results require the lowest faithful browser/visual proof.

Coding-agent work ends after contracts, standalone proof, and required migration are complete. Hand the family to the architect for semantic review, GitHub PR/CI, roadmap update, and merge readiness.
