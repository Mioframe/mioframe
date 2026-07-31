# Mioframe Material architecture

## Decision

Mioframe exposes a canonical Vue Material library under:

```text
src/shared/ui/material
```

Every official Material family is developed through isolated durable stages followed by one workflow-level verification:

```text
official Material documentation
  → DESIGN.md
  → ARCHITECTURE.md
  → component implementation + IMPLEMENTATION.md
  → consumer migration + MIGRATION.md
  → independent REVIEW.md
  → final workflow verification
```

Official Material 3 Expressive is the public-contract authority. `@m3e/web` is the preferred private renderer, not the API authority.

The stage separation is an architecture constraint. Its purpose is to keep each worker focused on one class of reasoning and give the next worker a complete, reviewable handoff. Final workflow verification closes the operator invocation; it is not a sixth reasoning stage or family artifact.

## Goals

- preserve the complete official component model independently of current demand;
- resolve architecture before coding;
- give coding agents deterministic implementation instructions rather than design choices;
- isolate component implementation from product-consumer migration;
- independently review the full resulting family;
- autonomously complete the staged workflow from one component-name invocation;
- run one final read-only verification only after the current independent review;
- use m3e maximally without leaking its vocabulary or ownership;
- implement the minimum complete current contract without speculative surface.

## Sources of truth

1. Official Material documentation defines the complete component and token contracts.
2. `components/<family>/DESIGN.md` is the complete normalized local snapshot of the official contract.
3. Current Mioframe scenarios and repository rules select required behavior.
4. `components/<family>/ARCHITECTURE.md` is the accepted demand-scoped implementation handoff.
5. Family code plus `IMPLEMENTATION.md` records the canonical component implementation and focused component proof.
6. `MIGRATION.md` records consumer adoption, legacy removal, and migration-scoped proof.
7. `REVIEW.md` records independent compliance and final-workflow-verification readiness.
8. Canonical CSS declarations plus `docs/token-api.md` define supported public tokens.
9. `docs/m3e-defects.md` owns confirmed renderer-defect lifecycle.
10. `docs/roadmap.md` alone owns project-wide milestone status and next action.
11. The top-level `material-component` report owns the final workflow verification command and result.

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
and how will code, stage proof, migration, and workflow closure be completed?
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
- implementation-scoped and migration-scoped `TEST IMPACT`;
- migration inventory and removal plan;
- acceptance criteria, risks, and forbidden approaches.

Its status must be `ready` before coding starts.

Architecture must not assign the top-level final workflow verification to implementation, migration, review, a dependency family, or “whichever stage closes the family”. That command belongs to the outer orchestrator after all current independent reviews.

### IMPLEMENTATION.md

Records whether the accepted architecture was implemented at the canonical component owner.

The real implementation output is code, tokens, exports, defects, tests, stories, and proof. The record contains completed passes, focused implementation-stage verification, deviations, and migration readiness.

A complete implementation has no architecture deviation. It does not migrate application consumers and does not own the top-level final workflow verification.

### MIGRATION.md

Records the complete consumer inventory, migrated paths, preserved scenarios and failure paths, obsolete ownership removal, proof, and migration-stage verification.

Migration consumes the accepted API. It does not redesign it and does not own or defer the top-level final workflow verification.

### REVIEW.md

Independently compares official design, accepted architecture, full implementation, all consumers, proof, stage verification, and operator-reported visual/motion status.

Review is read-only except for its own artifact. Findings route to the earliest owning stage. Review records whether the family is ready for final workflow verification; it does not run that command and does not treat its expected pending state as a finding or risk.

## One invocation, isolated stages

The normal entrypoint is:

```text
material-component <name>
```

The operator supplies the component name once. A thin orchestrator autonomously repeats the state machine until completion or a genuine blocker:

1. select the earliest invalid design, architecture, implementation, migration, or review stage;
2. run exactly that stage in a fresh worker context;
3. validate its durable artifact and return to the state machine;
4. process dependencies and correction routes automatically;
5. after all affected reviews are current, run the one final workflow verification;
6. route a verification failure to the earliest owning stage, require a fresh independent review after any workspace change, and rerun the same final command;
7. finish only when all artifact gates and final verification pass on the unchanged workspace.

A stage worker stops after its selected artifact/report and returns control to the orchestrator. The outer operator invocation must not stop merely because one stage completed, and the operator must not repeat the command to advance the next internally actionable stage.

The orchestrator does not perform stage-owned research, architecture, code, migration, or review. Running final workflow verification is orchestration closure, not stage reasoning.

See `component-workflow.md` for the complete state machine.

## Dependency closure

An official Material dependency is a first-class family and passes the same five artifact stages.

A parent architecture is not ready until required dependency design and architecture are ready. Parent implementation cannot complete before dependency implementation. Parent migration and review cannot complete while required dependency artifact closure is incomplete.

The parent owns composition meaning, placement, and state handoff. The dependency owns its official design, architecture, renderer integration, accessibility, geometry, tokens, defects, tests, stories, visual proof, migration facts, and review.

Parent composition proof does not replace standalone dependency proof.

The orchestrator does not run a separate top-level final verification after each dependency. It runs one final command after the parent and every affected dependency have current artifacts and independent reviews.

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
- component-specific defect records and stage proof.

It does not own the outer workflow's final verification result.

### Parent adapter

Owns composition meaning, placement, controlled parent state, slots/events, native integration, and public handoff to dependencies.

### m3e

Owns private DOM, internal rendering/layout, private defaults, state layer, ripple, focus treatment, elevation, renderer motion, and private accessibility implementation.

### Material orchestrator

Owns state-machine control, fresh-worker sequencing, dependency processing, correction routing, and the one final read-only workflow verification after current independent review.

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

Architecture selects proof owners before coding:

- implementation proves component-owned contracts through focused implementation-stage verification;
- migration proves product scenarios and legacy removal through focused migration-stage verification;
- review checks the full result and stage evidence independently;
- the outer orchestrator runs one final read-only workflow gate after the current review.

Renderer-owned appearance requires browser or visual proof. Host state, token presence, event receipt, source inspection, or a story alone is insufficient.

For ordinary Material component work, final workflow verification is:

```text
pnpm verify
```

`pnpm verify:release` is used only when the task itself changes release-sensitive infrastructure and the project verification rules classify it accordingly. Component code is not release-sensitive merely because it will eventually be merged or released.

A component is complete only when:

- design is current;
- architecture is ready;
- implementation is complete without deviations;
- migration and legacy removal are complete;
- independent review passes;
- the required final workflow verification passes on the unchanged current workspace;
- no concrete operator-reported visual/motion defect remains unresolved.

Operator visual/motion inspection is an external defect-reporting channel, not a positive-acknowledgement gate: absence of a reported defect does not block completion and requires no explicit confirmation. A reported defect routes to its owning stage.

A passing final verification alone is not architecture approval and does not replace the independent review.
