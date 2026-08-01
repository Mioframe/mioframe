# Material component design document

## Purpose

Every official Material component family under `src/shared/ui/material/components/<family>` owns one `DESIGN.md`.

`DESIGN.md` is the complete normalized workspace snapshot of official Material 3 Expressive documentation. It answers only:

```text
What does official Material define for this component?
```

Mioframe demand, Vue API, m3e mapping, implementation, migration, proof, and review belong to later stages.

## Durable control fields

Every design artifact begins with:

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
Status: current | stale | blocked
Source revision: <exact source/cache revision>
Source checked at: YYYY-MM-DD
Refresh check after: YYYY-MM-DD
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self
Required return stage: none | design
```

`Artifact revision` is a UTC ISO 8601 timestamp with milliseconds. The design worker writes a new value whenever it rewrites or refreshes the artifact. Downstream architecture records this exact value.

`Source revision` identifies the official source or cache snapshot. It is not the artifact revision.

A due `Refresh check after` triggers a source refresh attempt. Age alone does not make a complete artifact stale or blocked.

## Authority and source acquisition

Official Material documentation is authoritative. Use the available source chain instead of stopping after the first failed helper:

1. current official Material source service;
2. official cache refresh and route index;
3. direct official routes;
4. newest complete workspace or source-cache snapshot;
5. associated official token resources.

A failed refresh helper is tooling evidence, not evidence that official content changed.

The source ledger records exact official routes and titles, source snapshot date, source revision, page availability, refresh attempts, selected fallback, conflicts, and extraction gaps.

## Status lifecycle

- `current` — every required official source is represented completely from the newest successfully acquired revision and no newer material revision is known;
- `stale` — affirmative evidence shows official content changed after the recorded snapshot;
- `blocked` — required content remains unavailable, contradictory, or incomplete after all fallbacks.

A transient refresh failure does not block architecture when the newest complete snapshot remains complete and no newer revision is known.

## Required headings

Every design artifact contains these exact headings:

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

Record every official variant, color/configuration, size, shape, default, selection mode, combination, and constraint.

### Geometry and layout

Record dimensions, padding, spacing, icon and target sizes, outlines, shapes, alignment, density/adaptive behavior, and composed geometry.

### States and behavior

Record every documented state and state combination, activation and selection behavior, transitions, motion, shape morphing, elevation, state layers, and restoration.

### Usage guidance

Record when to use, when not to use, placement, hierarchy, content guidance, do/don’t rules, and related-component selection.

### Accessibility

Record semantic role, native behavior, accessible name/state, keyboard and pointer interaction, focus, target size, contrast, and platform guidance.

### Complete official token catalogue

Record every official token path, display name, aliases, values, variants, sizes, states, parts, disabled values, motion, shape, elevation, typography, spacing, and unresolved values. Preserve exact paths and values; never guess missing values.

### Source conflicts and unknowns

Record official disagreements, missing guidance, deprecated material, unavailable values, and extraction limitations without making a Mioframe decision.

### Related official contracts

Record required official dependencies, related foundations, alternatives, and links to existing family design artifacts.

## Full does not mean verbatim

Preserve the complete contract through structured paraphrase, exact names, exact measurements and values, tables for enumerations, and source references. Do not copy whole official pages or replace coverage with links and a short summary.

## Separation from later stages

`DESIGN.md` must not contain current Mioframe demand, selected/deferred decisions, Vue API, renderer details, defects, workarounds, code paths, proof plans, migration state, review state, roadmap state, Git, or PR facts.

## Update rule

Refresh design when official content is known to have changed, a newer source revision is available, an unavailable page becomes available, review finds an omission, or `Refresh check after` is due.

Implementation, migration, and review changes alone do not modify design.

## Completion gate

Design is complete only when:

- control fields and exact required headings are present;
- every applicable official source is listed and represented;
- the complete official surface is described regardless of demand;
- every official token is included or explicitly unavailable;
- exact measurements, defaults, states, and accessibility rules are preserved;
- source conflicts and extraction gaps are explicit;
- no Mioframe or renderer decision leaked into the artifact;
- status is `current`.

The design worker returns after writing the artifact. Architecture begins in a fresh worker and records the exact design artifact revision.