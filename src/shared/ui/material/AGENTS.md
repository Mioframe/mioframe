# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical project-facing Material Vue library boundary.

## Routing

- Use `material-component <name>` as the normal operator-facing entrypoint for one official Material family.
- Read `docs/component-workflow.md` as the single complete state-machine contract.
- Use the five stage skills only through the stage selected by that workflow.
- Use `architect-handoff` for unresolved cross-family foundation ownership, renderer strategy, global theme ownership, public token architecture, or product behavior outside one deterministic family architecture.

Do not reproduce the full workflow in this file, README files, architecture docs, or roadmap.

## Worker boundary

Every design, architecture, implementation, migration, and review stage runs in a fresh isolated worker context using the current runtime’s supported mechanism.

Workers receive only task-relevant readable workspace files, applicable rules, canonical artifact paths, and documented project commands.

Workers must not depend on:

- Git history, diff, branch, worktree/index state, or commit identifiers;
- pull-request metadata or review threads;
- GitHub checks or another external publication system.

If isolated workers are unavailable, report the workflow as blocked. Do not continue several reasoning stages in one context.

## Authority

- Official Material 3 Expressive documentation defines the complete public component and token model.
- Family `DESIGN.md` is the complete normalized official snapshot.
- Family `ARCHITECTURE.md` selects current Mioframe demand and resolves ownership, Vue API, tokens, renderer mapping, proof, and migration.
- Runtime code plus `IMPLEMENTATION.md` records component-owned implementation and proof.
- `MIGRATION.md` records consumer adoption, preserved scenarios, and legacy removal.
- `REVIEW.md` records independent compliance and final-workflow-verification readiness.
- Canonical CSS plus `docs/token-api.md` defines the supported public token surface.
- `docs/m3e-defects.md` owns renderer-defect records.
- `docs/roadmap.md` alone owns mutable milestone status and next action.

Current code, renderer output, tests, stories, and README files are evidence to inspect, not substitutes for stage artifacts or official Material authority.

## Public boundary

- Expose official Material semantics through curated Vue `MD*` APIs.
- Keep public types and terminology independent from m3e.
- Select the minimum complete surface for confirmed scenarios.
- Do not expose raw renderer attributes, events, tags, classes, types, or CSS inputs.
- Do not add speculative native, renderer, token, or compatibility surface.
- Keep product behavior, operation state, persistence, routing, errors, and business rules in their product owners.

Consumers use the root `@shared/ui/material` entrypoint. Internal family modules do not import the root barrel or another family’s private files.

## Renderer boundary

Outside this directory, code must not import `@m3e/web`, render `m3e-*`, use renderer types/events, depend on `--m3e-*`, or inspect renderer DOM.

Inside an owning family:

- prefer documented renderer inputs;
- derive private custom-element glue from exported renderer types;
- keep mappings owner-local;
- do not inspect private shadow DOM or copy renderer internals;
- do not recreate renderer-owned geometry, accessibility, state layer, ripple, focus, elevation, or motion;
- do not add a generic adapter framework without demonstrated repeated need and a separate architecture decision.

Controlled renderer workarounds follow `docs/component-adapter.md` and `docs/m3e-defects.md`.

## Token ownership

- `DESIGN.md` captures the complete official component-token catalogue.
- `ARCHITECTURE.md` selects only the minimum complete runtime token surface.
- foundation owns selected `--md-ref-*` and `--md-sys-*` tokens;
- each family owns only its selected `--md-comp-<family>-*` tokens;
- `docs/token-api.md` lists supported public tokens;
- `--m3e-*` and `--md-private-*` remain private;
- `--app-*` remains outside Material.

Do not create duplicate public owners, compatibility token aliases, token registries, token DSLs, or exhaustive renderer copies.

## Proof and visual channel

Architecture selects proof owners before implementation. Use the lowest faithful proof and preserve shared-UI blast-radius coverage.

Renderer-owned appearance requires browser or visual evidence. Host state, token presence, source inspection, or a story alone is insufficient.

Operator visual/motion inspection is an external defect-reporting channel, not a positive-acknowledgement gate. Absence of a reported defect does not block completion. A concrete reported defect routes to the owning stage.

Final workflow verification belongs to the outer `material-component` orchestrator after current independent review. Stage workers run only their focused proof.
