# Shared UI library inventory and migration backlog

This document is the exhaustive classification and priority backlog for `src/shared/ui` and any shared UI-facing artifact that may own Material behavior.

Its purpose is to ensure that gradual Material adoption does not lose components, migrate project-specific UI into the official library, or choose work only from memory.

## Program outcome

The program is complete only when every in-scope shared UI artifact has exactly one accepted outcome:

- migrated to `src/shared/ui/material/components/<family>` as an official Material component family;
- migrated to `src/shared/ui/material/patterns/<pattern>` as an accepted official Material composition;
- migrated to `src/shared/ui/material/foundation/<domain>` as a cross-family Material foundation owner;
- retained outside the Material library as project-specific shared UI;
- retained outside the Material library as generic UI/platform infrastructure;
- removed or consolidated as duplicate, obsolete, or compatibility-only code.

“Move the whole UI library to Material” therefore means classify the whole shared UI surface and canonicalize every Material-owned artifact. It does not mean placing every shared UI component under `src/shared/ui/material`.

## Sources of truth

- `library-roadmap.md` owns the active milestone and execution sequence.
- This inventory owns exhaustive shared-UI classification, migration priority, queue state, and the next candidate families after the architecture pilots.
- `component-registry.md` owns official Material surface alignment and verification status.
- `foundation-registry.md` owns foundation contracts, owners, gaps, and verification.
- `src/shared/ui/material/README.md` owns physical migration status.
- Family blueprints own accepted family contracts.

When an inventory row conflicts with an owning registry, blueprint, or migration map, update the stale inventory row. Do not redefine architecture here.

## Inventory scope

Include:

- every public component, composable, directive, helper, style owner, and public export under `src/shared/ui`;
- shared UI-facing owners outside that directory when they own Material tokens, interaction, icon, overlay, typography, or other UI foundation behavior;
- legacy aliases and compatibility exports that affect migration completion;
- grouped family rows only when the grouped artifacts share one accepted official family or one cohesive migration owner.

Do not omit an artifact because it appears internal, rarely used, or already visually similar to Material.

## Target classification

Use exactly one classification:

- `official-component` — maps to an official public Material component family;
- `official-pattern` — maps to a reusable official Material composition and passes the pattern gate;
- `material-foundation` — owns a cross-family Material contract;
- `project-specific` — shared product UI that may compose Material but is not an official Material surface;
- `generic-ui` — framework/browser/UI infrastructure without Material ownership;
- `remove` — duplicate, obsolete, dead, or compatibility-only surface with an accepted removal path;
- `unresolved` — classification requires named source, ownership, or consumer evidence.

`unresolved` is temporary and cannot remain when the inventory milestone exits.

## Priority model

Use priority tiers rather than an artificial numeric score:

- `P0` — architecture blocker, very high consumer reach, critical repeated user interaction, or foundation leverage that unlocks several high-value families;
- `P1` — widely used component or critical workflow surface with clear dependencies and high product value;
- `P2` — specialized or moderate-reach surface that should follow the common foundations and families it depends on;
- `P3` — low-reach, legacy, replaceable, or likely-removal surface that should not displace higher-value work;
- `pending` — evidence has not yet been collected.

Priority must be justified by recorded evidence, not visual prominence or component-name familiarity.

Consider:

- direct consumer count and breadth across features/pages;
- presence in critical or frequently repeated user flows;
- interaction frequency and user-visible failure cost;
- foundation/family leverage for later migrations;
- current Material deviation, defect, or maintenance risk;
- dependency readiness and migration blast radius;
- whether consolidation/removal yields more value than migration.

High migration complexity alone does not increase priority. Low complexity alone does not justify migrating a low-value surface first.

## Queue status

Use exactly one status:

- `unclassified` — discovered but not yet assessed;
- `assessed` — classification, target owner, evidence, and priority are recorded;
- `queued` — accepted for an upcoming migration batch;
- `active` — one current PR or milestone owns the work;
- `migrated` — canonical Material owner is active and legacy ownership is removed;
- `retained` — accepted project-specific or generic owner remains outside Material;
- `removed` — obsolete/duplicate surface and public paths are gone;
- `blocked` — a named source, ownership, dependency, or compatibility blocker prevents progress.

## Required row fields

The exhaustive inventory table created during roadmap milestone M3 must contain:

| Field                     | Meaning                                                                     |
| ------------------------- | --------------------------------------------------------------------------- |
| Artifact/family           | Stable row identity                                                         |
| Current owner             | Current production path or public entry point                               |
| Public surfaces           | Components, composables, directives, styles, and exports covered by the row |
| Consumer evidence         | Direct consumers and important product flows                                |
| Official Material mapping | Official family/pattern/foundation mapping, or `none`                       |
| Classification            | One target classification from this document                                |
| Canonical owner           | Accepted target path or retained current owner                              |
| Priority                  | `P0`–`P3` or `pending`                                                      |
| Priority rationale        | Concise evidence-backed reason                                              |
| Dependencies              | Foundation/family/consumer prerequisites                                    |
| Queue status              | Current migration state                                                     |
| Completion evidence       | PR, tests, registry/blueprint/map records, or removal evidence              |
| Blocker/next decision     | Named unresolved item or `none`                                             |

## Inventory completion gate

Roadmap milestone M3 is complete only when:

- all in-scope artifacts and public exports are represented exactly once;
- family grouping is explicit and does not hide unrelated ownership;
- no row remains `unclassified` or `unresolved`;
- every row has a target classification and canonical/retained owner;
- direct consumers and critical product flows are recorded sufficiently to prioritize work;
- an ordered `P0`/`P1` migration queue exists;
- Button is confirmed as the first architecture pilot or the roadmap records an evidence-backed replacement;
- likely removals and consolidations are identified instead of automatically migrated;
- project-specific and generic UI are explicitly retained outside the official Material library;
- the roadmap’s next migration milestone matches the highest accepted ready priority, except for an explicitly documented architecture pilot.

## Update protocol

Every PR that changes a shared UI artifact’s classification, priority, public owner, queue status, dependencies, or completion evidence must update the affected inventory row in the same PR.

Do not reorder the backlog merely because a component is currently being discussed. Change priority only when consumer, product, dependency, or risk evidence changes.

## Current inventory state

Status: `planned`

Population owner: roadmap milestone `M3 — shared UI inventory and prioritized migration backlog`.

No complete priority claim is made before M3. Button and Switch are accepted architecture-pilot candidates; the exhaustive inventory must still confirm their product reach, dependencies, and place in the migration queue.
