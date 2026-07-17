# Shared UI inventory and Material migration backlog

This document owns exhaustive classification, priority, and queue state for shared UI artifacts.

It prevents gradual migration from losing legacy owners, forcing project-specific UI into the official library, or selecting work only from memory.

## Accepted outcomes

Every in-scope shared UI artifact eventually has one outcome:

- canonical official Material component under `src/shared/ui/material/components/<official-docs-slug>`;
- canonical shared Material foundation under `src/shared/ui/material/foundations/<official-docs-slug>`;
- canonical shared Material style under `src/shared/ui/material/styles/<official-docs-slug>`;
- retained project-specific shared UI outside the official library;
- retained generic UI/platform infrastructure outside the official library;
- removed or consolidated obsolete, duplicate, or compatibility-only code.

There is no generic `material/patterns` target. Product-specific compositions remain outside the official Material library unless current official documentation gives them a concrete component, foundation, or style owner.

## Fact ownership

- `library-roadmap.md` owns the active milestone and next action.
- This inventory owns classification, priority, queue state, dependencies, and next candidates.
- `component-registry.md` and `foundation-registry.md` are compact program indexes.
- A canonical family/domain README beside implementation owns detailed current state.
- A colocated AUDIT owns the latest independent review.

When a summary conflicts with local canonical documentation, update the stale summary rather than duplicating local details here.

## Inventory scope

Include:

- every public component, composable, directive, helper, style owner, and public export under `src/shared/ui`;
- Material-facing owners outside that directory, including tokens, typography, interaction, icons, overlays, and build-time units;
- legacy aliases and compatibility exports affecting migration completion;
- grouped rows only when artifacts share one official family or one cohesive retained/removal owner.

Do not omit an artifact because it is internal, rarely used, or already visually similar to Material.

## Classification

Use one:

- `official-component` — maps to an official Material component family;
- `material-foundation` — maps to an official Material Foundations domain;
- `material-style` — maps to an official Material Styles domain;
- `project-specific` — product UI that may compose Material but is not itself an official surface;
- `generic-ui` — framework/browser/UI infrastructure without Material ownership;
- `remove` — duplicate, obsolete, dead, or compatibility-only surface;
- `unresolved` — exact official mapping or retained/removal ownership still requires evidence.

`unresolved` is temporary.

## Priority

Use:

- `P0` — architecture blocker, very high reach, critical repeated interaction, or shared-domain leverage;
- `P1` — widely used family or critical workflow with clear dependencies;
- `P2` — moderate/specialized reach following common dependencies;
- `P3` — low reach, replaceable, likely removal, or compatibility-only;
- `pending` — evidence not collected.

Priority uses consumer reach, workflow criticality, interaction frequency, correctness risk, shared leverage, dependency readiness, blast radius, and consolidation value. Difficulty alone does not raise priority.

## Queue status

Use:

- `unclassified` — discovered, not assessed;
- `assessed` — mapping, owner, evidence, and priority recorded;
- `queued` — accepted for upcoming migration;
- `active` — current family/domain work;
- `migrated` — canonical owner active, obsolete ownership removed, local documentation and required review complete;
- `retained` — accepted outside the official library;
- `removed` — obsolete surface and public paths gone;
- `blocked` — named evidence, dependency, ownership, or compatibility blocker.

## Required row fields

| Field | Meaning |
| --- | --- |
| Artifact/family | Stable identity |
| Current owner | Current production path or public entry point |
| Public surfaces | Covered components/composables/directives/styles/exports |
| Consumer evidence | Direct consumers and important flows |
| Official Material mapping | Exact component/foundation/style path or `none` |
| Classification | One value from this document |
| Canonical or retained owner | Official-docs-slug target or retained current owner |
| Priority | `P0`–`P3` or `pending` |
| Priority rationale | Concise evidence-backed reason |
| Dependencies | Required families/domains/consumer decisions |
| Queue status | Current migration state |
| Completion evidence | Local README/AUDIT, tests, removal evidence, or retained decision |
| Blocker/next decision | Exact unresolved item or `none` |

## Completion gate

The inventory is complete when:

- every in-scope artifact and public export appears exactly once;
- grouped rows do not hide unrelated ownership;
- no row remains `unclassified` or `unresolved`;
- each row has an accepted classification and canonical/retained owner;
- consumer evidence is sufficient for priority;
- a short ordered `P0`/`P1` queue exists;
- likely removals and consolidations are recorded instead of automatically migrated;
- project-specific and generic UI are explicitly retained outside the official library.

## Update rule

Update an affected row whenever classification, priority, owner, dependencies, queue state, or completion evidence changes.

Do not copy detailed implementation findings from local family/domain documentation into this inventory. Do not reorder priority merely because a component is currently being discussed.

## Current state

Status: `planned`

Population owner: roadmap milestone `M3 — Sequential migration`.

Buttons and Switch remain accepted pilot families. Exhaustive inventory population is a program completion requirement, not a blocker for completing the active Button pilot.