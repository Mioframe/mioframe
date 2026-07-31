# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical project-facing Material library boundary.

## Required staged workflow

Use `material-component <name>` as the normal operator-facing entrypoint.

Every official family follows exactly:

```text
material-component-design
  → components/<family>/DESIGN.md

material-component-architecture
  → components/<family>/ARCHITECTURE.md

material-component-implementation
  → component code/proof + components/<family>/IMPLEMENTATION.md

material-component-migration
  → consumer migration + components/<family>/MIGRATION.md

material-component-review
  → components/<family>/REVIEW.md
```

Read `docs/component-workflow.md` first.

The operator supplies the component name once. The orchestrator executes every internally actionable stage through isolated workers, validates each handoff, processes dependencies, routes corrections backward, and continues until completion or a genuine blocker.

One stage scope owns one reasoning focus and one artifact. Every stage runs in a fresh worker context. The orchestrator may select, launch, validate, and route; it must not perform design research, architecture decisions, implementation, migration, or review itself.

A stage worker receives only the component name, task-relevant readable workspace files, applicable rules, and paths to canonical upstream artifacts. Hidden reasoning, conversational summaries, and prose from another worker are not valid handoffs. The review worker must be independent from workers that authored architecture, implementation, or migration.

If a fresh worker cannot be created, stop the workflow as an orchestration blocker. Do not simulate isolation inside one agent context and do not require repeated operator commands.

The orchestrator always selects the earliest missing, stale, blocked, incomplete, or invalid stage. Later code does not permit skipping an earlier stage.

Required stage gates:

- `DESIGN.md`: complete official Material snapshot, status `current`;
- `ARCHITECTURE.md`: demand-scoped deterministic plan, status `ready`;
- `IMPLEMENTATION.md`: architecture implemented with no deviations, status `complete`;
- `MIGRATION.md`: consumers migrated and legacy ownership removed, status `complete`;
- `REVIEW.md`: independent review of the resulting workspace.

A required official dependency passes the same stages as a first-class family. Pause the parent, process the dependency automatically through separate fresh workers, and resume the parent when the required dependency gate is complete.

`README.md` is only a short family index. It is not a substitute for any stage artifact and must not duplicate mutable stage status or next action.

Use `architect-handoff` only for unresolved cross-family ownership, renderer strategy, global theme ownership, public token architecture, or product behavior outside the deterministic Material workflow.

## Authority

1. Official Material 3 Expressive documentation defines the complete public component and token model.
2. Family `DESIGN.md` is the complete normalized local snapshot of that official model.
3. Family `ARCHITECTURE.md` selects current Mioframe demand and resolves Vue API, dependencies, ownership, tokens, renderer mapping, proof, and migration.
4. Family code plus `IMPLEMENTATION.md` records component-owned implementation and proof.
5. `MIGRATION.md` records consumer adoption and legacy removal.
6. `REVIEW.md` records independent compliance and completion readiness.
7. Canonical CSS declarations plus `docs/token-api.md` define the supported public token surface.
8. `docs/m3e-defects.md` owns confirmed renderer-defect identities and lifecycle.
9. `docs/roadmap.md` alone owns project-wide milestone status and next action.

The installed lockfile-resolved `@m3e/web` artifact and observable browser behavior define the private renderer capability actually consumed. Upstream renderer source, demos, and changelogs are supporting evidence only. Legacy Mioframe and renderer APIs are not public-contract authorities.

## Stage boundaries

### DESIGN.md

Answers only what official Material defines. It includes complete variants, configurations, anatomy, states, behavior, guidance, accessibility, geometry, motion, related components, and component-token catalogue, whether or not Mioframe uses them.

It contains no current demand, Vue API, renderer mapping, code, tests, migration, proof, implementation progress, or roadmap status.

A source freshness threshold triggers a refresh attempt but does not by itself make a complete snapshot stale. `stale` requires evidence of newer official content. `blocked` requires genuinely missing or incomplete official content after available fallbacks.

### ARCHITECTURE.md

Answers what Mioframe must implement now and how. It references exact `DESIGN.md` sections, resolves dependencies and owners, defines selected public Vue/token contracts, renderer mappings and gaps, implementation passes, `TEST IMPACT`, migration inventory, acceptance criteria, and forbidden approaches.

It contains no implementation progress. Coding must not begin while its status is not `ready`.

### IMPLEMENTATION.md

Is a concise handoff for canonical component code, tokens, exports, defects, tests, stories, proof, and implementation-stage verification. It must report no architecture deviation before migration starts.

Implementation does not migrate product consumers or remove consumer-facing legacy ownership.

### MIGRATION.md

Owns complete consumer inventory, migration, preserved user scenarios and failure paths, obsolete ownership removal, final required verification, and review readiness.

Migration does not redesign the component.

### REVIEW.md

Independently compares the full result with official design, accepted architecture, implementation, consumers, workspace rules, proof, verification, and operator-reported visual/motion status. Review does not fix code; it returns findings to the orchestrator for routing to the earliest owning stage.

## Public API and ownership

- Expose a demand-scoped official Material contract expressed idiomatically in Vue.
- Keep public types and terminology independent from the renderer.
- Do not add unused renderer, native, or token surface for hypothetical completeness.
- Define precedence and restoration for public states that may coexist.
- A composed official Material component remains independently owned and is used through its canonical `MD*` API.
- The parent owns composition meaning and state handoff; the dependency owns its own artifacts, renderer mapping, accessibility, geometry, tokens, defects, tests, and visual proof.
- Parent composition proof does not replace standalone dependency proof.
- Visual loading/busy presentation and activation blocking are independent unless `ARCHITECTURE.md` explicitly assigns both.

## Token ownership

- `DESIGN.md` records the complete official component-token catalogue without selecting runtime support.
- `ARCHITECTURE.md` selects the minimum complete token set for confirmed rendered parts and states.
- `foundation/tokens.css` owns supported renderer-independent `--md-ref-*` and `--md-sys-*` foundations.
- `foundation/theme.css` owns the default palette and light/dark system-color assignments.
- `components/<family>/tokens.css` owns only that family’s selected official `--md-comp-<family>-*` surface and private renderer mappings.
- `docs/token-api.md` lists every supported public token; declarations and catalogue entries change together.
- `--app-*` belongs outside Material. `--m3e-*` and `--md-private-*` remain private.
- Derive every public component-token name from the exact official path in `DESIGN.md`, never from renderer vocabulary.
- For contextual tokens, `ARCHITECTURE.md` traces every required state and rendered part through `official path → public token → renderer input → fallback → consumer result → proof`.
- Do not publish tokens for unconsumed parts merely for symmetry or renderer completeness.
- Do not recreate a mixed-owner legacy token file, compatibility alias, duplicate public owner, TypeScript token registry, token DSL, or exhaustive public Material/renderer copy.

## Renderer boundary

Prefer documented renderer APIs. Keep renderer imports, tags, types, events, and private CSS inputs inside the canonical owning implementation.

A temporary exact-version workaround is allowed only when the gate in `docs/component-adapter.md` is satisfied and `ARCHITECTURE.md` plus `docs/m3e-defects.md` record it. It must remain owner-local, public-host-only, removable, and must not recreate renderer-owned interaction, accessibility, geometry, state, or motion systems.

Do not override renderer-owned interaction timing or transient geometry with host pseudo-classes or renderer-CSS switching. Route unacceptable behavior to a renderer correction or `blocked`.

Vue custom-element glue derives from package-exported element classes or `HTMLElementTagNameMap`. `config/vueCustomElements.ts` is the exact selected raw-tag allow-list.

## Verification and completion

Use the workspace testing architecture and proof selected by `ARCHITECTURE.md`.

Observable renderer-owned appearance requires browser or visual proof. Host state, token presence, event receipt, custom-property value, source inspection, or a story alone is insufficient.

For contextual tokens, browser proof asserts the computed rendered result for each selected state and part. Visual proof supplements it; behavior tests own keyboard and focus success criteria.

Final verification uses the exact task scope required by root `AGENTS.md` and the `verification` skill.

A component remains incomplete until all five stage artifacts are current and final verification passes. Automated checks alone are not architecture approval.

Operator visual/motion inspection is an external defect-reporting channel, not a positive-acknowledgement completion gate. Absence of an operator-reported defect does not block completion and requires no explicit confirmation. A concrete operator-reported defect is a real blocker and routes to its owning stage, opening a new correction cycle even after otherwise-recorded completion.

## Stop conditions

The orchestrator may stop only for genuinely unavailable official content after all fallbacks, unavailable required source tools, inability to create the required fresh worker, an unresolved material architecture decision, a required project verification command that cannot execute, a concrete unresolved operator-reported visual/motion defect, or safety-required input.

A completed stage, failed refresh helper, cache age, ordinary code/test finding, missing repeated operator command, or absence of an operator-reported defect is not by itself a blocker.

## Boundary

Outside this directory, product code must not import `@m3e/web`, render `m3e-*`, use renderer types/events, depend on `--m3e-*`, or inspect renderer DOM.

Do not introduce Lit directly, a generic adapter framework, or another public token registry without demonstrated repeated need and a separate architecture decision.
