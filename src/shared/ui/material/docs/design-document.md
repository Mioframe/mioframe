# Material component design document

## Purpose

Every official Material component family under `src/shared/ui/material/components/<family>` owns `DESIGN.md` as the complete normalized workspace snapshot of the official Material 3 Expressive component documentation.

It answers only:

```text
What does official Material define for this component?
```

Mioframe demand, Vue API, renderer mapping, implementation, migration, proof, and review belong to later artifacts.

## Control fields

Every `DESIGN.md` begins with:

```text
Status: current | stale | blocked
Source revision: <exact source/cache revision>
Source checked at: YYYY-MM-DD
Refresh check after: YYYY-MM-DD
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self
Required return stage: none | design
```

`Source checked at` records the date of the latest complete source-check pass, including fallback evaluation. `Refresh check after` is seven calendar days later.

Age is a refresh trigger, not evidence that official content changed. On or after that date the orchestrator runs the design stage. The worker may retain `Status: current` when it completes all source fallbacks, finds no newer material revision, and still owns a complete newest-known snapshot.

## Authority and source acquisition

Official Material documentation is authoritative. The design stage autonomously uses this fallback chain:

1. current official Material MCP/source service;
2. official cache refresh and route index;
3. direct official component routes;
4. newest complete workspace or MCP cache snapshot;
5. associated official token resources.

A failed route index, refresh script, or freshness check is tooling evidence, not proof of a Material change. Continue through available fallbacks.

## Status lifecycle

- `current` — every required official source is represented completely from the newest successfully acquired revision and there is no affirmative evidence of newer component content;
- `stale` — affirmative evidence shows official content or its material source revision changed after the recorded snapshot;
- `blocked` — required official content remains unavailable, contradictory, or incompletely extracted after all fallbacks.

A missing, stale, blocked, structurally invalid, or refresh-due design blocks use by later stages until the design worker completes its check.

## Required source set

Inspect every applicable official page, including at minimum:

- overview;
- specifications;
- guidelines;
- accessibility;
- complete component-token tables;
- expressive-update notes;
- related-component references;
- delegated foundation contracts;
- platform or adaptive guidance when present.

Do not omit a source because Mioframe does not currently consume its capability.

## Required document structure

After control fields, use these exact headings:

```text
## Source ledger
## Identity and purpose
## Anatomy and content
## Variants and configurations
## Geometry and layout
## States and behavior
## Usage guidance
## Accessibility
## Complete official token catalogue
## Source conflicts and unknowns
## Related official contracts
```

Every heading is required. Use explicit `none`, `not documented`, or `unavailable from the recorded source revision` rather than omitting a section.

### Source ledger

Record:

- exact official routes and source titles;
- source snapshot date;
- exact cache/source revision;
- required page availability;
- refresh attempts and fallback selected;
- extraction limitations.

### Identity and purpose

Include official name, role, intended use, adjacent-component distinctions, and expressive-update differences.

### Anatomy and content

Include required and optional parts, content roles, ordering, labels, icons, supporting content, and valid/invalid combinations.

### Variants and configurations

Include every official variant, color/configuration, size, shape, default, selection/toggle mode, and combination constraint.

### Geometry and layout

Include exact heights, widths, padding, spacing, icon and target sizes, outlines, shapes, alignment, density/adaptive behavior, and standalone/composed differences.

### States and behavior

Include all documented states, state combinations and precedence, activation/selection/progress/navigation behavior, transitions, motion, shape morphing, elevation, state layer, and restoration.

### Usage guidance

Include when to use or avoid, placement, hierarchy, content-writing guidance, do/don't rules, and related-component selection guidance.

### Accessibility

Include semantic role, native behavior, accessible name/state, keyboard and pointer interaction, focus, target size, contrast, and platform/screen-reader guidance.

### Complete official token catalogue

Include every published token path across variants, sizes, states, parts, selection modes, disabled values, motion, shape, elevation, typography, spacing, and contrast variants.

For each token preserve:

- exact official path;
- official display name;
- system/reference aliases;
- documented values by mode;
- unresolved or omitted values without guessing.

### Source conflicts and unknowns

Record disagreements, unresolved values, missing guidance, deprecated/superseded guidance, and refresh/extraction limitations without Mioframe or renderer decisions.

### Related official contracts

Record required official dependencies, related foundations, alternative components, and links to family design documents when they exist.

## Full does not mean verbatim

Preserve the complete official contract without copying whole source pages.

Use structured paraphrase for guidance, exact names and values for enumerable facts, complete tables for tokens/configurations, and source references for every section.

Do not replace complete coverage with a selected-surface summary or external links.

## Separation from later artifacts

| Artifact            | Question answered                                         | Scope                                |
| ------------------- | --------------------------------------------------------- | ------------------------------------ |
| `DESIGN.md`         | What does official Material define?                       | complete official component contract |
| `ARCHITECTURE.md`   | What must Mioframe implement now and how?                 | demand-scoped Material–Vue–m3e plan  |
| `IMPLEMENTATION.md` | Was the accepted component architecture implemented?      | component code/proof handoff         |
| `MIGRATION.md`      | Were consumers migrated and legacy ownership removed?     | application adoption                 |
| `REVIEW.md`         | Does the complete result satisfy all contracts and gates? | independent review                   |
| `README.md`         | Where are artifacts and runtime entry points?             | short index only                     |

`DESIGN.md` must not contain:

- current Mioframe demand or `implement-now`/`defer` decisions;
- Vue props, emits, slots, or exports;
- m3e properties, events, types, tags, variables, revision, defects, or workarounds;
- code paths, test files, migration status, roadmap, Git/PR facts, or verification results.

## Update rule

Refresh `DESIGN.md` when:

- `Refresh check after` is due;
- official content is known to have changed;
- a newer cache/source revision is available;
- a previously unavailable page became available;
- review found an omitted official capability, token, state, measurement, or guidance rule.

Implementation, migration, and review changes alone do not modify official design facts.

## Completion gate

A design document is complete only when:

- every control field is valid;
- source revision and dates are exact;
- all required headings exist;
- all applicable official pages are listed and represented;
- the complete official surface is described regardless of current demand;
- every official token is included or explicitly unavailable;
- exact measurements, defaults, states, and accessibility rules are preserved;
- no Mioframe or renderer decision is mixed into the artifact;
- source conflicts and extraction gaps are explicit;
- status is `current`, blockers are `none`, and both return fields are `none`.

The design stage then returns control to the outer orchestrator. Architecture begins in a fresh worker context.
