# Material library implementation roadmap

This document is the operational progress tracker for filling `src/shared/ui/material` and classifying the complete shared UI library.

It answers four questions for a new session:

1. What has been completed?
2. What is active now?
3. What blocks the active work?
4. What is the single next action?

Durable architecture and workflow rules remain in the canonical Material policy documents and skills. This roadmap does not redefine component blueprints, foundation records, testing contracts, validation rules, review roles, inventory classifications, or migration semantics.

## Sources of truth

Use this document only for sequencing and progress.

- `adoption-plan.md` owns the strategic rollout rationale and phase descriptions.
- `source-of-truth.md` owns the current canonical Material 3 Expressive target and source hierarchy.
- `autonomous-review.md` owns agent evidence review, operator visual acceptance, and the review merge gate.
- `ui-library-inventory.md` owns exhaustive shared-UI classification, evidence-backed priority, queue state, and candidate ordering.
- `foundation-registry.md` owns foundation status, evidence, contracts, owners, gaps, and verification.
- `component-registry.md` owns official Material surface alignment and verification status.
- `src/shared/ui/material/README.md` owns the physical migration map.
- Family `README.md` files own accepted component blueprints.
- This roadmap owns milestone state, dependencies, blockers, completed outcomes, and the single next action.

When these documents disagree, update the stale progress record rather than changing architecture from this roadmap.

## Program outcome

The program does not require moving every shared UI artifact into `src/shared/ui/material`.

It is complete when every in-scope shared UI artifact is classified and reaches one accepted terminal outcome:

- canonical current Material 3 Expressive component, pattern, or foundation owner;
- explicitly retained project-specific or generic shared UI owner outside Material;
- removed or consolidated obsolete/duplicate owner.

For an official component, completion additionally requires source-backed agent review of every non-visual contract and operator acceptance only of prepared visual evidence. Baseline Material 3 must not remain as a silent substitute for an available Expressive contract.

The migration order is evidence-driven. After the architecture pilots, work follows the highest accepted ready priority in `ui-library-inventory.md`, based on consumer reach, critical workflows, interaction frequency, foundation leverage, risk, and dependency readiness.

## Status model

Use exactly one status per milestone:

- `planned` — accepted sequence, work not started;
- `active` — current implementation focus;
- `blocked` — cannot continue until the named blocker is resolved;
- `done` — exit gate passed and the completing PR is merged into `develop`;
- `skipped` — milestone proved unnecessary, with evidence recorded.

Only one milestone should normally be `active`. Parallel work is allowed only when milestones have no shared production, migration, inventory, review, or verification ownership.

## Current state

Last updated: 2026-07-16

Current milestone: `M2 — Structured Material consistency validation`

Current status: `planned`

Current blocker: none. M1's minimal baseline exit gate is complete; M2 has not started.

Next action: begin M2 by defining the required blueprint/registry/map sections, enums, snapshots, and repository references its structured-consistency checks must validate, per `token-validation.md`. Do not resume broader M1-style static-check implementation until M6 (`MDButton` migration) or another real migration provides evidence for which additional checks are worth automating.

## Milestone overview

| ID  | Milestone                                             | Status    | Depends on                                  | Exit gate                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --- | ----------------------------------------------------- | --------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | Architecture and operating model                      | `done`    | none                                        | PR #149 merged; canonical Expressive source target, architecture, review-role contract, scoped routing, skills, registries, migration map, roadmap, and inventory contract available from `develop`                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| M1  | Static Material architecture validation               | `done`    | M0                                          | minimal deterministic filesystem checks (exact canonical new-component placement, empty canonical directories, empty placeholder files and root barrel) plus ESLint/oxlint alias-based dependency-direction boundaries (Material imports, `@shared/service` imports) block invalid new work, proven by tests that execute the real lint path; relative-path layer imports are not resolved or automatically enforced and remain review-driven; broader profile/style/test-artifact/story-identity/migration-residue checks are explicitly out of scope for this milestone, to be added later only when real migrations justify them |
| M2  | Structured Material consistency validation            | `planned` | M1                                          | blueprint/registry/map sections, enums, snapshots, and repository references are checked without semantic Markdown inference                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| M3  | Shared UI inventory and prioritized migration backlog | `planned` | M2                                          | every in-scope shared UI artifact is classified exactly once, consumers and target owners are recorded, and an ordered evidence-backed `P0`/`P1` queue exists                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| M4  | Button foundation readiness                           | `planned` | M2 and M3                                   | every foundation domain required by the accepted Button surface has an exact owner, current Expressive snapshot/status, contract, change mode, verification, and no hidden blocker                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| M5  | Required Button foundation changes                    | `planned` | M4                                          | every change identified by M4 is completed through focused foundation PRs, or this milestone is explicitly `skipped` when no production change is required                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| M6  | `MDButton` architecture migration                     | `planned` | M4 and applicable M5 work                   | Button family is canonical, behavior-preserving migration is complete, consumers and proof artifacts agree, and legacy ownership is removed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| M7  | `MDButton` Material 3 Expressive alignment            | `planned` | M6                                          | Button agent evidence review is passed, documented deviations are corrected or accepted, visual evidence is current, and operator visual acceptance is recorded                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| M8  | Independent stateful migration pilot                  | `planned` | M2, M3, and applicable foundation readiness | a high-priority stateful family—default candidate `MDSwitch`—validates controlled state, interaction/cancellation, anatomy, property coexistence, autonomous evidence review, browser proof, and operator-only visual acceptance                                                                                                                                                                                                                                                                                                                                                                                                    |
| M9  | Autonomous new-component proof                        | `planned` | M7 and M8                                   | one genuinely required new official component is authored directly from current Expressive sources, closes every non-visual gate autonomously, and reaches operator-ready visual handoff without bespoke architecture rounds                                                                                                                                                                                                                                                                                                                                                                                                        |
| M10 | Priority-driven incremental library population        | `planned` | M9                                          | inventory rows progress by accepted priority until every row is `migrated`, `retained`, or `removed`, with Material-owned artifacts canonical and legacy owners eliminated                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

## Milestone details

### M0 — Architecture and operating model

Scope:

- canonical Material 3 Expressive source target;
- canonical library, foundation, component, testing, validation, and migration policies;
- agent evidence review and operator-only visual-acceptance contract;
- scoped `AGENTS.md` routing and hard boundaries;
- `material-component-authoring`, `material-foundation`, and supporting skill ownership;
- foundation/component registries and physical migration map;
- operational roadmap and exhaustive inventory contract.

Do not add production Material artifacts in M0.

Completion evidence:

- PR #149 merged into `develop`;
- previous architecture head passed final `pnpm verify`.

### M1 — Static Material architecture validation

Implement only deterministic repository checks. Do not parse architecture meaning or introduce component-specific exceptions.

PR 151 delivered the complete minimal baseline that is this milestone's exit gate:

- new official Material components must be created under the exact canonical `components/<family>/MD*.vue` path (diff-aware, grandfathers pre-existing legacy files; the check stays disabled only when no comparison base ref is supplied at all; a supplied `--base-ref` that git cannot read fails validation instead of silently skipping this check; a malformed invocation — `--base-ref` with no value, an empty value, or immediately followed by another option — is rejected as a concise CLI usage error before any check runs, and never prints the success summary);
- empty canonical directories (including the `components`/`foundation`/`patterns` namespace roots themselves, not only their children), empty or whitespace-only placeholder files (including otherwise-exempt `README.md`/`AGENTS.md`/`CLAUDE.md` governance files), and an empty root barrel are rejected;
- dependency-direction boundaries — Material must not import product layers by alias, statically or through a dynamic `import()`; generic `shared/lib` must not depend on Material by alias, statically or dynamically; external consumers (including product-layer files, which also keep their existing `@shared/service` boundary) must use the Material public API by alias, statically or dynamically — are enforced through ESLint/oxlint `no-restricted-imports` for static imports/exports and a small dedicated ESLint rule (`local/no-restricted-dynamic-imports`, visiting only `ImportExpression` string literals against a configured regex list) for dynamic imports, since oxlint has no dynamic-import-aware rule and reusing `no-restricted-syntax` for dynamic imports would silently replace the unrelated Vue DOM-communication restrictions (`dispatchEvent`/`querySelector`) configured for overlapping files, as flat-config blocks do not merge repeated rule values; alias and root-alias matching is anchored so it blocks only actual product-layer roots and descendants, not unrelated paths that merely contain a layer name (e.g. `@shared/lib/features/helper`); relative-path layer imports (e.g. `../features/helper`) are not resolved and are not automatically enforced, statically or dynamically, and remain review-driven — this is intentional, since an import-string regex cannot distinguish a resolved product-layer path from an unrelated path or package that merely contains a layer name, and a resolver is not justified without a real migration demonstrating the need; proven by tests that execute the real merged lint configuration against fixtures rather than inspecting configuration JSON or an extracted rule value.

Out of scope for this milestone, and not required for it to be `done`:

- architecture profile validation and exact production file sets;
- CSS layer/route/state order and composition checks;
- required test-artifact and `StateMatrix` story-identity checks;
- migration-completeness and legacy-residue detection, including any obsolete-path list — add one later, in the migration that introduces the first exact obsolete path;
- resolver-aware or relative-path dependency-direction enforcement — relative cross-layer imports remain review-driven until a real migration justifies an existing resolver-aware boundary mechanism;
- any Markdown/blueprint parsing.

These remain review-driven — checked by the coding agent and human review, not automation — until several real component migrations (starting with `MDButton` in M6) establish which conventions are stable enough to encode mechanically. Introduce additional automation only after repeated migrations demonstrate a stable invariant and a meaningful risk of regression; see `docs/material-3/token-validation.md` for the full deferred-check catalogue.

Implementation status: minimal baseline implemented as `scripts/materialStaticValidation.mjs`, wired into `pnpm verify` as the `material-static` label, plus `.oxlintrc.json` boundary rules and their lint-boundary tests. This milestone's exit gate is complete; M2–M10 do not depend on any further M1 automation.

### M2 — Structured Material consistency validation

Add bounded structure/reference checks after M1 establishes path and artifact enforcement.

Minimum outcome:

- required blueprint and registry sections exist;
- enum values are accepted;
- named files, exports, stories, specs, snapshots, owners, and map records exist;
- `verified` foundation records have exact snapshots and named verification;
- migration status agrees across blueprint, registry, inventory, and physical map;
- validation does not claim to prove family rationale, Material interpretation, visual-route equivalence, priority, agent evidence reasoning, or visual correctness.

### M3 — Shared UI inventory and prioritized migration backlog

Populate `ui-library-inventory.md` exhaustively before selecting the long-term migration queue.

Required outcome:

- every public component, composable, directive, style owner, helper, and export under `src/shared/ui` is represented exactly once;
- UI-facing owners outside `src/shared/ui` are included when they own Material foundation behavior;
- each row is classified as official component, official pattern, Material foundation, project-specific, generic UI, or removal;
- current and target owners are explicit;
- direct consumers and critical product flows are recorded;
- likely duplicates, obsolete surfaces, and compatibility-only paths are identified rather than automatically migrated;
- priority uses evidence-based tiers from `ui-library-inventory.md`, not discussion order or visual prominence;
- an ordered `P0`/`P1` queue exists;
- Button is confirmed as the first architecture pilot or an evidence-backed replacement is recorded in this roadmap;
- the independent stateful pilot is confirmed from the highest-value suitable family, with `MDSwitch` as the default candidate.

This milestone inventories the entire library once. Later PRs update only affected rows.

### M4 — Button foundation readiness

Audit only domains required by the accepted Button supported surface.

For every applicable domain record:

- current official Expressive source and exact snapshot;
- current and canonical owner;
- registry and migration status;
- minimum contract required by Button;
- relevant gap;
- selected change mode;
- focused verification;
- whether the dependency is non-blocking.

Expected domains include source evidence, units, tokens/theme, typography, shape, elevation, motion, interaction/state layer/ripple/focus, accessibility/target area, and iconography when applicable.

This milestone is readiness work, not a reason to relocate every legacy foundation owner.

### M5 — Required Button foundation changes

Create only the focused changes proven necessary by M4.

Rules:

- reuse sufficient legacy owners while they remain the single accepted owner;
- relocate a cohesive owner only when a new standalone canonical artifact is required or focused migration is otherwise justified;
- keep correction/replacement separate when consumer impact exceeds the Button migration scope;
- do not split monolithic owners merely to match the target directory diagram;
- mark M5 `skipped` when M4 proves all Button dependencies non-blocking without production changes.

### M6 — `MDButton` architecture migration

Use `architecture-only` unless an approved handoff explicitly changes scope.

Required outcome:

- complete ready Button-family blueprint;
- smallest valid profiles and shortest property routes;
- canonical family location and exports;
- preserved API, behavior, token values, and rendered output;
- all consumers, stories, tests, snapshots, risk registration, registries, inventory, and maps updated;
- canonical `StateMatrix` and separate real browser behavior proof;
- obsolete Button paths and exports removed.

Do not mix remaining visual alignment into this milestone.

### M7 — `MDButton` Material 3 Expressive alignment

Correct only named deviations discovered or retained during M6.

Required outcome:

- current official Expressive sources and Design Kit evidence are resolved;
- agent architecture, Material contract, accessibility, behavior, and migration evidence review is `passed`;
- every visible change updates blueprint routes, matrix cases, baselines, source evidence, inventory completion evidence, and review status;
- operator receives only the prepared screenshot package and records `accepted`, `rejected`, or `blocked`;
- foundation corrections follow their own change mode and consumer review.

### M8 — Independent stateful migration pilot

Use a high-priority stateful family with a materially different interaction shape to challenge the architecture. `MDSwitch` remains the default candidate unless M3 records stronger evidence for another family that proves the same contracts.

The pilot must prove:

- controlled state without hidden copies;
- disabled, keyboard, pointer/touch, cancellation, and cleanup contracts as applicable;
- multiple anatomy/DOM owners;
- property-specific winner/coexistence rules;
- interaction, motion, shape, color, accessibility, and target-area dependencies;
- all non-visual gates can be closed by the agent;
- visual-state proof remains separate from real browser behavior and operator visual acceptance.

Do not introduce shared helpers only because two families look similar. Require the same concrete need in both pilots.

### M9 — Autonomous new-component proof

Choose one genuinely required high-priority component that has no legacy implementation to relocate.

Success means the standard authoring workflow can derive current Expressive sources, supported surface, blueprint, dependencies, profile, production implementation, exports, proof layers, inventory state, agent evidence review, and operator-ready screenshot package without a bespoke architecture redesign.

### M10 — Priority-driven incremental library population

After the pilots, select each migration batch from `ui-library-inventory.md`.

Rules:

- prefer the highest accepted ready priority, considering dependency order and cohesive family ownership;
- migrate one cohesive family or foundation domain per focused PR;
- create patterns only after the official-pattern gate passes;
- update inventory, blueprint/contracts, owners, exports, consumers, stories, tests, snapshots, risk registration, registries, and maps atomically;
- require agent evidence review before operator visual handoff;
- remove old owners instead of accumulating compatibility layers;
- improve foundation contracts only from confirmed needs;
- retain project-specific and generic UI outside Material explicitly rather than forcing migration;
- remove or consolidate low-value duplicates where that is better than canonicalizing them.

M10 remains ongoing until every inventory row has a terminal status and all Material-owned artifacts have canonical current owners. It does not require implementing every optional component or capability published by Material.

## Progress log

Add one row only when a milestone changes status or its exit gate materially changes.

| Date       | Milestone | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Evidence                                            |
| ---------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 2026-07-16 | M0        | Added canonical Expressive target and autonomous agent/operator review contract; final verification and merge remain                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | PR #149; previous architecture head passed `verify` |
| 2026-07-16 | M0        | PR #149 merged into `develop`; marked `done`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `develop` HEAD is PR #149's merge commit            |
| 2026-07-16 | M1        | Started; implemented `material-static` static architecture validator and wired it into `pnpm verify`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `feat/material-static-architecture-validation`      |
| 2026-07-16 | M1        | Reduced PR 151 to a minimal filesystem baseline plus ESLint/oxlint dependency-direction boundaries; broader profile/style/test-artifact/story-identity/migration-residue checks explicitly deferred as review-driven, not automated, pending real migrations                                                                                                                                                                                                                                                                                                                                      | `feat/material-static-architecture-validation`      |
| 2026-07-16 | M1        | Fixed the exact canonical component-placement check, closed the relative-path Material import gap, removed the speculative obsolete-path and premature-root-barrel mechanisms, and added tests that execute the real lint path; marked `done` as PR 151's complete exit gate                                                                                                                                                                                                                                                                                                                      | `feat/material-static-architecture-validation`      |
| 2026-07-16 | M1        | Fixed remaining PR 151 defects: covered dynamic `import()` boundaries via real ESLint `no-restricted-syntax` (oxlint has no equivalent rule); replaced broad `**/features/**`-style relative patterns with anchored regexes that block only actual product-layer roots/descendants; made an explicit unreadable `--base-ref` fail validation instead of silently disabling the placement check; fixed empty-governance-file and empty-namespace-root false negatives; remains `done`                                                                                                              | `feat/material-static-architecture-validation`      |
| 2026-07-16 | M1        | Fixed final PR 151 defects: moved dynamic-import boundaries to a dedicated `local/no-restricted-dynamic-imports` rule so they stop silently replacing the unrelated `dispatchEvent`/`querySelector` restrictions on overlapping Vue files; removed the relative-path product-layer regex (relative cross-layer imports are unresolved and remain review-driven, not automated); rejected malformed `--base-ref` invocations as a CLI usage error; replaced extracted-rule-value ESLint tests with tests that lint real fixture files through the actual merged flat configuration; remains `done` | `feat/material-static-architecture-validation`      |

## Update protocol

Every PR that starts, completes, blocks, skips, or materially reslices a roadmap milestone must update this file in the same PR.

Every PR that changes a shared UI artifact’s classification, priority, owner, dependencies, or migration state must also update `ui-library-inventory.md`.

Update only:

1. `Current state`;
2. the affected milestone status/exit gate;
3. the single `Next action`;
4. a concise progress-log row;
5. dependencies only when new evidence changes them.

Do not rewrite completed milestone details to match a later implementation. Record the new decision in the owning source, architecture, review, registry, blueprint, or migration document and update only the roadmap consequence here.

Before starting a new Material session:

1. read `Current state` and `Next action`;
2. confirm the active milestone against merged repository state;
3. inspect only the owning documents linked by that milestone;
4. do not skip ahead while an exit gate or blocker remains;
5. update this roadmap when the session changes progress.
