# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical project-facing Material Vue library boundary.

## Routing

- Use `material-component <name>` as the normal operator-facing entrypoint for one official Material family.
- Read `docs/component-workflow.md` as the single complete state-machine contract.
- Use the five stage skills only through the stage selected by that workflow.
- Use `architect-handoff` for unresolved cross-family foundation ownership, renderer strategy, global theme ownership, public token architecture, or product behavior outside one deterministic family architecture.
- The Storybook inspection requirement does not make theme ownership unresolved: Material foundation owns the deterministic theme-mode seam described by `docs/testing/storybook.md`; use `architect-handoff` for broader product/global theme changes beyond that bounded workbench requirement.

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
- foundation owns selected `--md-ref-*` and `--md-sys-*` tokens and application of their system/light/dark theme mode;
- the production default remains system-following unless a separate product requirement changes it;
- Storybook may request deterministic light/dark inspection only through the foundation-owned mode seam and must not own duplicate token values;
- each family owns only its selected `--md-comp-<family>-*` tokens;
- `docs/token-api.md` lists supported public tokens;
- `--m3e-*` and `--md-private-*` remain private;
- `--app-*` remains outside Material.

Do not create duplicate public owners, compatibility token aliases, token registries, token DSLs, or exhaustive renderer copies.

## Proof and Storybook

Architecture selects proof owners before implementation. Use the lowest faithful proof and preserve shared-UI blast-radius coverage.

- The Material family is the Storybook owner for its component stories and family-owned browser/visual proof.
- Follow `docs/testing/storybook.md` for Storybook workbench behavior, Playground/Controls, preview isolation, theme modes, story authoring, catalogue naming, routing sandbox, generated docs, proof boundaries, target placement, and ownership conventions.
- A configurable public Material component should expose a useful args-driven Playground through its family stories when the public surface has meaningful options; Controls represent only the curated Mioframe Vue API, never raw m3e/private inputs.
- Follow `docs/testing/migration-plan.md` for the current executable Playwright spec location and workbench capabilities. Do not place colocated Material `*.browser.spec.ts` or `*.visual.spec.ts` until the owning lane can discover them.
- Once owner-local browser or visual discovery is executable for the canonical Material family, use that final family-local placement immediately. Do not create or preserve a temporary central/legacy Storybook proof location merely for a later Storybook ownership migration.
- During Material migration, classify existing legacy family stories/specs/baselines as retained-and-rehomed, replaced by canonical proof, or obsolete-and-removed. Complete that cleanup in the same Material workflow rather than leaving a second cleanup PR for the same family.
- Keep stories deterministic and family-local; do not introduce product stores, services, workers, persistence, production routing, network, or business behavior into family stories.
- Routing-aware reusable Material composition may use the project-wide Storybook router harness only when routing is part of the reusable contract; product navigation remains outside Material.
- Family browser proof contains no screenshots. Family visual proof contains no browser-behavior success criteria.
- Do not introduce a Material-specific Storybook runner, controls registry, router, theme copy, taxonomy, or workflow that duplicates project-wide Storybook/testing rules.

Renderer-owned appearance requires browser or visual evidence. Host state, token presence, source inspection, or a story alone is insufficient.

Operator visual/motion inspection is an external defect-reporting channel, not a positive-acknowledgement gate. Absence of a reported defect does not block completion. A concrete reported defect routes to the owning stage.

Final workflow verification belongs to the outer `material-component` orchestrator after current independent review. Stage workers run only their focused proof.
