# Material library implementation roadmap

This document is the operational progress tracker for filling `src/shared/ui/material`.

It answers four questions for a new session:

1. What has been completed?
2. What is active now?
3. What blocks the active work?
4. What is the single next action?

Durable architecture and workflow rules remain in the canonical Material policy documents and skills. This roadmap does not redefine component blueprints, foundation records, testing contracts, validation rules, or migration semantics.

## Sources of truth

Use this document only for sequencing and progress.

- `adoption-plan.md` owns the strategic rollout rationale and phase descriptions.
- `foundation-registry.md` owns foundation status, evidence, contracts, owners, gaps, and verification.
- `component-registry.md` owns component alignment and verification status.
- `src/shared/ui/material/README.md` owns the physical migration map.
- Family `README.md` files own accepted component blueprints.
- This roadmap owns milestone state, dependencies, blockers, completed outcomes, and the single next action.

When these documents disagree, update the stale progress record rather than changing architecture from this roadmap.

## Status model

Use exactly one status per milestone:

- `planned` — accepted sequence, work not started;
- `active` — current implementation focus;
- `blocked` — cannot continue until the named blocker is resolved;
- `done` — exit gate passed and the completing PR is merged into `develop`;
- `skipped` — milestone proved unnecessary, with evidence recorded.

Only one milestone should normally be `active`. Parallel work is allowed only when milestones have no shared production, migration, or verification ownership.

## Current state

Last updated: 2026-07-16

Current milestone: `M0 — architecture and operating model`

Current status: `active`

Current blocker: none; PR #149 has passed final verification and still needs to be made ready and merged.

Next action: mark PR #149 ready for review and merge it into `develop`.

## Milestone overview

| ID | Milestone | Status | Depends on | Exit gate |
| --- | --- | --- | --- | --- |
| M0 | Architecture and operating model | `active` | none | PR #149 merged; canonical policies, scoped routing, skills, registries, migration map, and roadmap available from `develop` |
| M1 | Static Material architecture validation | `planned` | M0 | deterministic path, dependency, import/export, profile-file, style-order, test-artifact, story-identity, and obsolete-path checks block invalid new/migrating work |
| M2 | Structured Material consistency validation | `planned` | M1 | blueprint/registry/map sections, enums, snapshots, and repository references are checked without semantic Markdown inference |
| M3 | Button foundation readiness | `planned` | M2 | every foundation domain required by the supported Button surface has an exact owner, snapshot/status, accepted contract, change mode, verification, and no hidden blocker |
| M4 | Required Button foundation changes | `planned` | M3 | every change identified by M3 is completed through focused foundation PRs, or this milestone is explicitly `skipped` when no production change is required |
| M5 | `MDButton` architecture migration | `planned` | M3 and applicable M4 work | Button family is canonical, behavior-preserving migration is complete, consumers and proof artifacts agree, and legacy ownership is removed |
| M6 | `MDButton` Material alignment | `planned` | M5 | documented Button deviations are corrected or accepted, visual evidence is current, and required human Material review is recorded |
| M7 | `MDSwitch` independent migration pilot | `planned` | M2 and applicable foundation readiness | Switch validates controlled state, interaction, cancellation, anatomy, property coexistence, browser proof, and visual-matrix separation without Button-specific exceptions |
| M8 | Autonomous new-component proof | `planned` | M6 and M7 | one genuinely required new official component is authored directly in the library from sources and scenarios without bespoke architecture correction rounds |
| M9 | Incremental library population | `planned` | M8 | further families, foundations, and patterns migrate only from confirmed product need, one cohesive owner at a time |

## Milestone details

### M0 — Architecture and operating model

Scope:

- canonical library, foundation, component, testing, source, validation, and migration policies;
- scoped `AGENTS.md` routing and hard boundaries;
- `material-component-authoring`, `material-foundation`, and supporting skill ownership;
- foundation/component registries and physical migration map;
- this operational roadmap.

Do not add production Material artifacts in M0.

Completion evidence:

- PR #149;
- final `pnpm verify` passed;
- merge into `develop` pending.

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
- validation does not claim to prove family rationale, Material interpretation, visual-route equivalence, or human visual correctness.

### M3 — Button foundation readiness

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

### M4 — Required Button foundation changes

Create only the focused changes proven necessary by M3.

Rules:

- reuse sufficient legacy owners while they remain the single accepted owner;
- relocate a cohesive owner only when a new standalone canonical artifact is required or focused migration is otherwise justified;
- keep correction/replacement separate when consumer impact exceeds the Button migration scope;
- do not split monolithic owners merely to match the target directory diagram;
- mark M4 `skipped` when M3 proves all Button dependencies non-blocking without production changes.

### M5 — `MDButton` architecture migration

Use `architecture-only` unless an approved handoff explicitly changes scope.

Required outcome:

- complete ready Button-family blueprint;
- smallest valid profiles and shortest property routes;
- canonical family location and exports;
- preserved API, behavior, token values, and rendered output;
- all consumers, stories, tests, snapshots, risk registration, registries, and maps updated;
- canonical `StateMatrix` and separate real browser behavior proof;
- obsolete Button paths and exports removed.

Do not mix remaining visual alignment into this milestone.

### M6 — `MDButton` Material alignment

Correct only named deviations discovered or retained during M5.

Every visible change updates affected blueprint routes, matrix cases, baselines, source evidence, and review status. Foundation corrections follow their own change mode and consumer review.

### M7 — `MDSwitch` independent migration pilot

Use Switch to challenge the architecture with a different state and interaction shape.

The pilot must prove:

- controlled selected/unselected state without hidden copies;
- disabled, keyboard, pointer drag, cancellation, and cleanup contracts;
- multiple anatomy/DOM owners;
- property-specific winner/coexistence rules;
- interaction, motion, shape, color, accessibility, and target-area dependencies;
- visual-state proof remains separate from real browser behavior.

Do not introduce shared helpers only because Button and Switch look similar. Require the same concrete need in both pilots.

### M8 — Autonomous new-component proof

Choose one genuinely required component that has no legacy implementation to relocate.

Success means the standard authoring workflow can derive sources, supported surface, blueprint, dependencies, profile, production implementation, exports, proof layers, and truthful review state without a bespoke architecture redesign.

### M9 — Incremental library population

After the pilots:

- select work from current product need and consumer value;
- migrate one cohesive family or foundation domain per focused PR;
- create patterns only after the official-pattern gate passes;
- update all owning records atomically;
- remove old owners instead of accumulating compatibility layers;
- improve foundation contracts only from confirmed needs.

M9 remains ongoing until the required Material surface of the product is canonical. It does not require implementing every component or optional capability published by Material.

## Progress log

Add one row only when a milestone changes status or its exit gate materially changes.

| Date | Milestone | Change | Evidence |
| --- | --- | --- | --- |
| 2026-07-16 | M0 | Architecture baseline completed in code review; merge remains | PR #149, final `verify` passed |

## Update protocol

Every PR that starts, completes, blocks, skips, or materially reslices a roadmap milestone must update this file in the same PR.

Update only:

1. `Current state`;
2. the affected milestone status/exit gate;
3. the single `Next action`;
4. a concise progress-log row;
5. dependencies only when new evidence changes them.

Do not rewrite completed milestone details to match a later implementation. Record the new decision in the owning architecture, registry, blueprint, or migration document and update only the roadmap consequence here.

Before starting a new Material session:

1. read `Current state` and `Next action`;
2. confirm the active milestone against merged repository state;
3. inspect only the owning documents linked by that milestone;
4. do not skip ahead while an exit gate or blocker remains;
5. update this roadmap when the session changes progress.