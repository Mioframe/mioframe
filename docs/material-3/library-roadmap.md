# Material library implementation roadmap

This document is the operational progress tracker for filling `src/shared/ui/material` and classifying the complete shared UI library.

It answers four questions for a new session:

1. What has been completed?
2. What is active now?
3. What blocks the active work?
4. What is the single next action?

Durable architecture and workflow rules remain in the canonical Material policy documents and skills. This roadmap does not redefine component blueprints, foundation records, testing contracts, validation rules, inventory classifications, or migration semantics.

## Sources of truth

Use this document only for sequencing and progress.

- `adoption-plan.md` owns the strategic rollout rationale and phase descriptions.
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

- canonical official Material component, pattern, or foundation owner;
- explicitly retained project-specific or generic shared UI owner outside Material;
- removed or consolidated obsolete/duplicate owner.

The migration order is evidence-driven. After the architecture pilots, work follows the highest accepted ready priority in `ui-library-inventory.md`, based on consumer reach, critical workflows, interaction frequency, foundation leverage, risk, and dependency readiness.

## Status model

Use exactly one status per milestone:

- `planned` — accepted sequence, work not started;
- `active` — current implementation focus;
- `blocked` — cannot continue until the named blocker is resolved;
- `done` — exit gate passed and the completing PR is merged into `develop`;
- `skipped` — milestone proved unnecessary, with evidence recorded.

Only one milestone should normally be `active`. Parallel work is allowed only when milestones have no shared production, migration, inventory, or verification ownership.

## Current state

Last updated: 2026-07-16

Current milestone: `M0 — architecture and operating model`

Current status: `active`

Current blocker: final verification is pending on the roadmap, inventory, and instruction-routing update to PR #149.

Next action: complete final verification, then mark PR #149 ready for review and merge it into `develop`.

## Milestone overview

| ID  | Milestone                                             | Status    | Depends on                                  | Exit gate                                                                                                                                                                                                                        |
| --- | ----------------------------------------------------- | --------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | Architecture and operating model                      | `active`  | none                                        | PR #149 merged; canonical policies, scoped routing, skills, registries, migration map, roadmap, and inventory contract available from `develop`                                                                                  |
| M1  | Static Material architecture validation               | `planned` | M0                                          | deterministic path, dependency, import/export, profile-file, style-order, test-artifact, story-identity, and obsolete-path checks block invalid new/migrating work                                                               |
| M2  | Structured Material consistency validation            | `planned` | M1                                          | blueprint/registry/map sections, enums, snapshots, and repository references are checked without semantic Markdown inference                                                                                                     |
| M3  | Shared UI inventory and prioritized migration backlog | `planned` | M2                                          | every in-scope shared UI artifact is classified exactly once, consumers and target owners are recorded, and an ordered evidence-backed `P0`/`P1` queue exists                                                                    |
| M4  | Button foundation readiness                           | `planned` | M2 and M3                                   | every foundation domain required by the accepted Button surface has an exact owner, snapshot/status, contract, change mode, verification, and no hidden blocker                                                                  |
| M5  | Required Button foundation changes                    | `planned` | M4                                          | every change identified by M4 is completed through focused foundation PRs, or this milestone is explicitly `skipped` when no production change is required                                                                       |
| M6  | `MDButton` architecture migration                     | `planned` | M4 and applicable M5 work                   | Button family is canonical, behavior-preserving migration is complete, consumers and proof artifacts agree, and legacy ownership is removed                                                                                      |
| M7  | `MDButton` Material alignment                         | `planned` | M6                                          | documented Button deviations are corrected or accepted, visual evidence is current, and required human Material review is recorded                                                                                               |
| M8  | Independent stateful migration pilot                  | `planned` | M2, M3, and applicable foundation readiness | a high-priority stateful family—default candidate `MDSwitch`—validates controlled state, interaction/cancellation, anatomy, property coexistence, browser proof, and visual-matrix separation without Button-specific exceptions |
| M9  | Autonomous new-component proof                        | `planned` | M7 and M8                                   | one genuinely required new official component is authored directly in the library from sources and scenarios without bespoke architecture correction rounds                                                                      |
| M10 | Priority-driven incremental library population        | `planned` | M9                                          | inventory rows progress by accepted priority until every row is `migrated`, `retained`, or `removed`, with Material-owned artifacts canonical and legacy owners eliminated                                                       |

## Milestone details

### M0 — Architecture and operating model

Scope:

- canonical library, foundation, component, testing, source, validation, and migration policies;
- scoped `AGENTS.md` routing and hard boundaries;
- `material-component-authoring`, `material-foundation`, and supporting skill ownership;
- foundation/component registries and physical migration map;
- operational roadmap and exhaustive inventory contract.

Do not add production Material artifacts in M0.

Completion evidence:

- PR #149;
- previous architecture head passed final `pnpm verify`;
- final roadmap/inventory/instruction head verification and merge into `develop` pending.

### M1 — Static Material architecture validation

Implement only deterministic repository checks. Do not parse architecture meaning or introduce component-specific exceptions.

Minimum outcome:

- canonical locations for new Material artifacts;
- downward dependency direction;
- forbidden product and private cross-family imports;
- curated public exports and forbidden implementation/testing deep imports;
- selected component profile matches the exact production file set;
- applicable style order is valid;
- required test artifacts and one canonical `StateMatrix` identity exist for new/migrating families;
- legacy paths cannot acquire new Material ownership;
- obsolete paths and permanent compatibility exports are rejected for completed migrations.

### M2 — Structured Material consistency validation

Add bounded structure/reference checks after M1 establishes path and artifact enforcement.

Minimum outcome:

- required blueprint and registry sections exist;
- enum values are accepted;
- named files, exports, stories, specs, snapshots, owners, and map records exist;
- `verified` foundation records have exact snapshots and named verification;
- migration status agrees across blueprint, registry, and physical map;
- validation does not claim to prove family rationale, Material interpretation, visual-route equivalence, priority, or human visual correctness.

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

- official source and exact snapshot;
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

### M7 — `MDButton` Material alignment

Correct only named deviations discovered or retained during M6.

Every visible change updates affected blueprint routes, matrix cases, baselines, source evidence, inventory completion evidence, and review status. Foundation corrections follow their own change mode and consumer review.

### M8 — Independent stateful migration pilot

Use a high-priority stateful family with a materially different interaction shape to challenge the architecture. `MDSwitch` remains the default candidate unless M3 records stronger evidence for another family that proves the same contracts.

The pilot must prove:

- controlled state without hidden copies;
- disabled, keyboard, pointer/touch, cancellation, and cleanup contracts as applicable;
- multiple anatomy/DOM owners;
- property-specific winner/coexistence rules;
- interaction, motion, shape, color, accessibility, and target-area dependencies;
- visual-state proof remains separate from real browser behavior.

Do not introduce shared helpers only because two families look similar. Require the same concrete need in both pilots.

### M9 — Autonomous new-component proof

Choose one genuinely required high-priority component that has no legacy implementation to relocate.

Success means the standard authoring workflow can derive sources, supported surface, blueprint, dependencies, profile, production implementation, exports, proof layers, inventory state, and truthful review state without a bespoke architecture redesign.

### M10 — Priority-driven incremental library population

After the pilots, select each migration batch from `ui-library-inventory.md`.

Rules:

- prefer the highest accepted ready priority, considering dependency order and cohesive family ownership;
- migrate one cohesive family or foundation domain per focused PR;
- create patterns only after the official-pattern gate passes;
- update inventory, blueprint/contracts, owners, exports, consumers, stories, tests, snapshots, risk registration, registries, and maps atomically;
- remove old owners instead of accumulating compatibility layers;
- improve foundation contracts only from confirmed needs;
- retain project-specific and generic UI outside Material explicitly rather than forcing migration;
- remove or consolidate low-value duplicates where that is better than canonicalizing them.

M10 remains ongoing until every inventory row has a terminal status and all Material-owned artifacts have canonical owners. It does not require implementing every optional component or capability published by Material.

## Progress log

Add one row only when a milestone changes status or its exit gate materially changes.

| Date       | Milestone | Change                                                                                                                         | Evidence                                            |
| ---------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| 2026-07-16 | M0        | Architecture baseline, operational roadmap, and full-library inventory contract completed; final verification and merge remain | PR #149; previous architecture head passed `verify` |

## Update protocol

Every PR that starts, completes, blocks, skips, or materially reslices a roadmap milestone must update this file in the same PR.

Every PR that changes a shared UI artifact’s classification, priority, owner, dependencies, or migration state must also update `ui-library-inventory.md`.

Update only:

1. `Current state`;
2. the affected milestone status/exit gate;
3. the single `Next action`;
4. a concise progress-log row;
5. dependencies only when new evidence changes them.

Do not rewrite completed milestone details to match a later implementation. Record the new decision in the owning architecture, registry, blueprint, inventory, or migration document and update only the roadmap consequence here.

Before starting a new Material session:

1. read `Current state` and `Next action`;
2. confirm the active milestone against merged repository state;
3. inspect only the owning documents linked by that milestone;
4. consult `ui-library-inventory.md` before selecting or reprioritizing a family;
5. do not skip ahead while an exit gate or blocker remains;
6. update the roadmap and affected inventory rows when the session changes progress.
