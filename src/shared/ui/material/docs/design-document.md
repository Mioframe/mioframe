# Material component design document

## Purpose

Every official Material family under `src/shared/ui/material/components/<family>` owns one `DESIGN.md`.

`DESIGN.md` is the complete normalized workspace snapshot of official Material 3 Expressive documentation. It answers only:

```text
What does official Material define for this component?
```

Mioframe demand, Vue API, m3e mapping, implementation, migration, proof, and review belong to later stages.

## Durable control fields

Every design artifact begins with:

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
Design contract revision: none | YYYY-MM-DDTHH:mm:ss.sssZ
Status: current | stale | blocked
Source revision: <exact source/cache revision>
Source checked at: YYYY-MM-DD
Refresh check after: YYYY-MM-DD
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none
Required return stage: none
```

`Artifact revision` is the file-update identity. It changes whenever the document is rewritten or refreshed.

`Design contract revision` is the normalized official-contract identity. It changes only when official component content changes or the normalized document adds or corrects an omitted official rule.

Downstream architecture and review reference the design contract revision, not the artifact revision.

## Refresh policy

The interval is fixed:

```text
Refresh check after = Source checked at + 30 calendar days
```

A known newer official revision or canonical source-change evidence triggers an immediate refresh.

When refresh finds no normalized contract change:

- update artifact revision and source-check metadata;
- preserve design contract revision exactly;
- do not invalidate downstream stages;
- record `Normalized contract changed: no` in the stage result.

Change design contract revision when official facts, token tables, geometry, states, behavior, motion, accessibility, related contracts, or normalized completeness change.

## Authority and source acquisition

Official Material documentation is authoritative. Use the source chain:

1. current official Material source service;
2. official cache refresh and route index;
3. direct official routes;
4. newest complete workspace or source-cache snapshot;
5. associated official token resources.

A failed refresh helper is tooling evidence, not evidence that official content changed.

The source ledger records exact official routes and titles, source snapshot date, source revision, page availability, refresh attempts, selected fallback, conflicts, and extraction gaps.

## Status lifecycle

- `current` — successful terminal result; every required official source is represented completely from the newest acquired revision and no newer material revision is known;
- `stale` — external pre-run invalidation marker only; the design worker must consume it and must not return it;
- `blocked` — genuine terminal result; required content remains unavailable, contradictory, or incomplete after every fallback.

A blocked design always uses:

```text
Remaining blockers: <exact blocker>
Required return family: none
Required return stage: none
```

Design cannot route to `self/design`. A fixable design omission or normalization defect must be corrected in the current worker. If it remains impossible after fallbacks are exhausted, the workflow stops on the terminal blocker.

A transient refresh failure does not block architecture when the newest complete snapshot remains complete and no newer revision is known.

For a successful initial design, create both artifact and design contract revisions. For a blocked first design with no complete contract, use contract revision `none`.

## Required headings

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

## Completeness contract

### Identity and purpose

Record official name, role, intended use, distinction from adjacent components, and expressive changes.

### Anatomy and content

Record required and optional parts, content roles, label/icon/supporting-content rules, ordering, and allowed combinations.

### Variants and configurations

Record every official variant, configuration, size, shape, default, selection mode, combination, and constraint.

### Geometry and layout

Record dimensions, padding, spacing, icon and target sizes, outlines, shapes, alignment, density/adaptive behavior, and composed geometry.

### States and behavior

Record every documented state and combination, activation and selection behavior, transitions, motion, shape morphing, elevation, state layers, and restoration.

### Usage guidance

Record intended use, prohibited use, placement, hierarchy, content guidance, do/don’t rules, and related-component selection.

### Accessibility

Record semantic role, native behavior, accessible name/state, keyboard and pointer interaction, focus, target size, contrast, and platform guidance.

### Complete official token catalogue

Record every official token path, display name, alias, value, variant, size, state, part, disabled value, motion, shape, elevation, typography, spacing, and unresolved value. Never guess missing values.

### Source conflicts and unknowns

Record official disagreements, missing guidance, deprecated material, unavailable values, and extraction limitations without making a Mioframe decision.

### Related official contracts

Record required official dependencies, related foundations, alternatives, and links to existing family design artifacts.

## Full does not mean verbatim

Preserve the complete contract through structured paraphrase, exact names, measurements, values, tables, and source references. Do not copy whole official pages or replace coverage with links and a short summary.

## Separation from later stages

`DESIGN.md` must not contain Mioframe demand, selected/deferred decisions, Vue API, renderer details, defects, workarounds, code paths, proof plans, migration state, review state, roadmap state, Git, or PR facts.

## Completion gate

Design is complete only when:

- control fields and required headings are present;
- design contract revision is non-`none`;
- refresh date is exactly 30 calendar days after source checked date;
- every applicable official source is represented;
- the complete official surface is described;
- every official token is included or explicitly unavailable;
- exact measurements, defaults, states, and accessibility rules are preserved;
- conflicts and extraction gaps are explicit;
- no Mioframe or renderer decision leaked into the artifact;
- status is `current`;
- blockers and route are `none`.

The design worker returns after writing the artifact. Architecture begins in a fresh worker and records the exact design contract revision.
