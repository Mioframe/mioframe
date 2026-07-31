# Mioframe Material architecture

## Decision

Mioframe exposes a canonical Vue Material library under:

```text
src/shared/ui/material
```

Every official Material family is developed through isolated durable stages:

```text
official Material documentation
  → DESIGN.md
  → ARCHITECTURE.md
  → component implementation + IMPLEMENTATION.md
  → consumer migration + MIGRATION.md
  → independent REVIEW.md
```

Official Material 3 Expressive is the public-contract authority. `@m3e/web` is the preferred private renderer, not the API authority.

The stage separation is an architecture constraint. Its purpose is to keep each agent focused on one class of work and give the next agent a complete, reviewable handoff.

## Goals

- preserve the complete official component model independently of current demand;
- resolve architecture before coding;
- give coding agents deterministic implementation instructions rather than design choices;
- isolate component implementation from product-consumer migration;
- independently review the full resulting family;
- use m3e maximally without leaking its vocabulary or ownership;
- implement the minimum complete current contract without speculative surface.

## Sources of truth

1. Official Material documentation defines the complete component and token contracts.
2. `components/<family>/DESIGN.md` is the complete normalized local snapshot of the official contract.
3. Current Mioframe scenarios and repository rules select required behavior.
4. `components/<family>/ARCHITECTURE.md` is the accepted demand-scoped implementation handoff.
5. Family code plus `IMPLEMENTATION.md` records the canonical component implementation and proof.
6. `MIGRATION.md` records consumer adoption and legacy removal.
7. `REVIEW.md` records independent compliance and merge readiness.
8. Canonical CSS declarations plus `docs/token-api.md` define supported public tokens.
9. `docs/m3e-defects.md` owns confirmed renderer-defect lifecycle.
10. `docs/roadmap.md` alone owns project-wide milestone status and next action.

The installed lockfile-resolved m3e artifact and observable browser behavior define renderer capability actually consumed. Upstream renderer source, tags, demos, and changelogs are supporting evidence only. Legacy Mioframe code is migration evidence, not public API authority.

## Family artifact model

```text
components/<family>/
  DESIGN.md
  ARCHITECTURE.md
  IMPLEMENTATION.md
  MIGRATION.md
  REVIEW.md
  README.md
```

`README.md` is a short index linking the five stage artifacts and canonical runtime entry points. It must not become a mixed design, architecture, implementation, migration, and status document.

### DESIGN.md

Answers:

```text
What does official Material define?
```

It is complete, source-backed, and not demand-scoped. It contains all official variants, configurations, states, geometry, guidance, accessibility, motion, related components, and component tokens.

It contains no Mioframe demand, Vue API, m3e mapping, code paths, tests, migration, or PR status.

### ARCHITECTURE.md

Answers:

```text
What must Mioframe implement now, who owns it, how does m3e participate,
and how will code, proof, and migration be completed?
```

It references exact design sections and resolves:

- goal and non-goals;
- selected and deferred surface;
- current scenarios and failure paths;
- dependencies and ownership;
- public Vue API and state precedence;
- selected component tokens;
- renderer mapping, fallback, gaps, and workarounds;
- implementation passes;
- `TEST IMPACT`;
- migration inventory and removal plan;
- acceptance criteria, risks, and forbidden approaches.

Its status must be `ready` before coding starts.

### IMPLEMENTATION.md

Records whether the accepted architecture was implemented at the canonical component owner.

The real implementation output is code, tokens, exports, defects, tests, stories, and proof. The record contains completed passes, verification, deviations, and migration readiness.

A complete implementation has no architecture deviation. It does not migrate application consumers.

### MIGRATION.md

Records the complete consumer inventory, migrated paths, preserved scenarios and failure paths, obsolete ownership removal, proof, and final current-head verification.

Migration consumes the accepted API. It does not redesign it.

### REVIEW.md

Independently compares official design, accepted architecture, full implementation, all consumers, proof, verification, and operator-reported visual/motion status.

Review is read-only except for its own artifact. Findings route to the earliest owning stage.

## One invocation, one stage

The normal entrypoint is `material-component <name>`.

The router selects the earliest invalid stage and runs only that stage:

1. design;
2. architecture;
3. implementation;
4. migration;
5. review.

It stops after the selected artifact/report. It must not continue automatically into a later stage.

A later-stage finding can route backward, but the later stage must not rewrite the earlier artifact itself.

See `component-workflow.md` for the state machine.

## Dependency closure

An official Material dependency is a first-class family and passes the same stages.

A parent architecture is not ready until required dependency design and architecture are ready. Parent implementation cannot complete before dependency implementation. Parent migration and review cannot complete while dependency closure is incomplete.

The parent owns composition meaning, placement, and state handoff. The dependency owns its official design, architecture, renderer integration, accessibility, geometry, tokens, defects, tests, stories, visual proof, migration facts, and review.

Parent composition proof does not replace standalone dependency proof.

## Demand-scoped public surface

Architecture starts from the complete `DESIGN.md` and classifies official capability as:

- `implement-now` — required by a current confirmed scenario or minimum coherent selected API;
- `defer` — official capability not required now;
- `not-material` — project behavior absent from official Material;
- `source-conflict` — official sources do not support one reliable decision.

Do not remove deferred capability from `DESIGN.md`. Do not copy the complete official or renderer surface into runtime API for completeness. Renderer availability does not define public semantics.

## Public Vue boundary

```text
Material concept from DESIGN.md
  → accepted Vue API in ARCHITECTURE.md
  → private m3e mapping in implementation
```

Rules:

- use official Material terminology and semantics;
- express the selected contract idiomatically in Vue;
- keep public types independent from m3e;
- constrain private mappings with package-exported renderer types;
- do not expose raw renderer attributes, events, tags, classes, types, or CSS inputs;
- do not preserve conflicting legacy naming;
- do not add hypothetical native, renderer, or token surface;
- define precedence and restoration for coexisting public states.

## Ownership

### Material foundation

Owns supported renderer-independent reference/system tokens, standard theme roles, CSS grammar, and foundation catalogue entries.

```text
foundation/tokens.css
foundation/theme.css
```

Application theme selection, persistence, and `--app-*` extensions remain outside Material.

Legacy `.md` surfaces own only their own background, inherited base content color, and root transition. They must not impose color or motion on arbitrary descendants.

### Component family

Owns:

- its five stage artifacts;
- canonical Vue adapter and export;
- selected official component tokens;
- private family-local renderer mappings;
- component-specific defect records and proof.

### Parent adapter

Owns composition meaning, placement, controlled parent state, slots/events, native integration, and public handoff to dependencies.

### m3e

Owns private DOM, internal rendering/layout, private defaults, state layer, ripple, focus treatment, elevation, renderer motion, and private accessibility implementation.

## Gap routing

Architecture assigns every selected gap to exactly one result:

- `wrapper-correction` — correct public Vue/native/light-DOM integration without recreating renderer internals;
- `temporary-renderer-workaround` — exact-version host-level mitigation under the controlled gate;
- `m3e-fix` — renderer-owned private behavior defect;
- `blocked` — no safe owner can deliver the selected contract.

Coding agents must not choose between unresolved gap strategies.

A workaround remains local, private, removable, linked to a stable defect record, and revalidated on renderer updates. It must not recreate renderer interaction, accessibility, geometry, state, or motion systems.

## Token boundary

`DESIGN.md` contains the complete official component-token catalogue.

`ARCHITECTURE.md` selects only the minimum complete runtime token set required by confirmed rendered parts and states.

Runtime owners:

- `--md-ref-*` and `--md-sys-*` under foundation/theme;
- selected `--md-comp-*` under the owning family;
- `--app-*` outside Material;
- `--m3e-*` and `--md-private-*` private.

Every contextual token trace is resolved before implementation:

```text
official DESIGN.md path
  → public Mioframe token
  → renderer input
  → renderer fallback
  → expected consumer result
  → proof owner
```

Do not recreate a mixed-owner token file, compatibility alias, global component-token owner, TypeScript registry, token DSL, or public renderer aliases.

## Non-Material requirements

A requirement absent from official Material is resolved as one of:

1. consumer/feature/widget composition;
2. separate shared component without `MD` prefix;
3. exceptional documented `MD*` extension approved in architecture.

The default is composition or a separate non-Material owner.

## Renderer and typing boundary

Outside `src/shared/ui/material`, it is forbidden to import `@m3e/web`, render `m3e-*`, use renderer types/events, depend on `--m3e-*`, or inspect renderer DOM.

Inside the canonical family:

- prefer documented renderer inputs;
- inspect the installed artifact for exact mapping and diagnosis;
- derive custom-element glue from exported element classes or `HTMLElementTagNameMap`;
- make renderer drift fail type-check;
- do not introduce Lit directly, inspect private shadow DOM, copy internals, or create a generic adapter framework without demonstrated repeated need.

## Verification and completion

Architecture selects proof owners before coding. Implementation proves component-owned contracts. Migration proves product scenarios and legacy removal. Review checks the full result independently.

Renderer-owned appearance requires browser or visual proof. Host state, token presence, event receipt, source inspection, or a story alone is insufficient.

A component is complete only when:

- design is current;
- architecture is ready;
- implementation is complete without deviations;
- migration and legacy removal are complete;
- independent review passes;
- required current-head verification passes;
- no concrete operator-reported visual/motion defect remains unresolved.

Operator visual/motion inspection is an external defect-reporting channel, not a positive-acknowledgement gate: absence of a reported defect does not block completion and requires no explicit confirmation. A reported defect routes to its owning stage.

Green CI alone is not architecture approval.
