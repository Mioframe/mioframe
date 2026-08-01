---
name: material-component-design
description: 'Use with an official Material component name to create or refresh the complete source-backed family DESIGN.md without Mioframe demand, renderer, architecture, implementation, migration, or review decisions.'
---

# Material component design

Create or refresh one family `DESIGN.md` and return control to the orchestrator.

This stage owns official Material source normalization only.

## Input

The only required input is the Material component name.

Resolve the official component and canonical family from official and readable workspace evidence. Ask for clarification only when the name maps to multiple materially different official components.

## Worker boundary

Run in a fresh isolated worker context.

Use official source tools, task-relevant readable workspace files, applicable rules, and documented project commands. Do not depend on Git, PR, commit, or external-check state.

Do not read family implementation, renderer package, consumers, migration, review, or roadmap before the official source ledger is complete.

## Output

Write exactly:

```text
src/shared/ui/material/components/<family>/DESIGN.md
```

Follow `src/shared/ui/material/docs/design-document.md`.

The artifact begins with:

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
Design contract revision: none | YYYY-MM-DDTHH:mm:ss.sssZ
Status: current | stale | blocked
Source revision: <exact source/cache revision>
Source checked at: YYYY-MM-DD
Refresh check after: YYYY-MM-DD
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self
Required return stage: none | design
```

Use a new UTC artifact revision whenever the file is written or refreshed.

Use a new design contract revision only when normalized official Material content changes. Preserve the existing design contract revision when refresh changes only source metadata, source ledger details, or check dates.

For a successful initial design, create both revisions. For a blocked initial design with no complete normalized contract, use `Design contract revision: none`.

Required headings:

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

## Official source pass

Inspect every applicable official source, including overview, specifications, guidelines, accessibility, expressive updates, complete token tables, delegated foundations, related components, and adaptive/platform guidance.

Use available fallbacks in order:

1. current official Material source service;
2. official cache refresh and route index;
3. direct official routes;
4. newest complete source-cache or workspace snapshot;
5. associated official token resources.

A failed refresh helper is not itself a blocker when a complete newest-known official snapshot exists and no newer Material revision is known.

Use statuses exactly:

- `current` — complete newest successfully acquired official revision with no evidence of a newer material revision;
- `stale` — affirmative evidence shows official content changed after the snapshot;
- `blocked` — required content remains missing or incomplete after all fallbacks.

The refresh interval is fixed by workflow:

```text
Refresh check after = Source checked at + 30 calendar days
```

Do not select another interval.

Run an immediate refresh when the workflow provides explicit evidence of a newer official revision or changed official content.

## Contract-change classification

Change `Design contract revision` only when normalized official content changes, including:

- an official fact is added, removed, or corrected;
- token paths, values, aliases, or completeness change;
- states, behavior, geometry, motion, accessibility, or related official contracts change;
- a previously omitted official rule is added to the normalized document.

Do not change it when only these change:

- `Source checked at`;
- `Refresh check after`;
- source retrieval timestamps or availability notes;
- source ledger bookkeeping;
- a source revision identifier that resolves to semantically identical normalized content.

When no contract change is found, state that explicitly in `Revision summary` and preserve the exact contract revision.

## Required content

Capture the complete official component contract, including unused capability:

- identity, intended use, and adjacent-component distinctions;
- anatomy and content roles;
- every variant, configuration, size, shape, default, and valid combination;
- geometry, spacing, target, typography, elevation, and motion;
- every documented state and state combination;
- behavior and usage guidance;
- accessibility and input behavior;
- complete official component-token catalogue;
- official dependencies and related components;
- source conflicts, missing values, and unavailable guidance.

For every official token preserve exact official path, display name, aliases, documented values, and unresolved values.

## Separation

`DESIGN.md` contains no Mioframe demand, selected surface, Vue API, renderer mapping, defect, workaround, implementation path, proof plan, migration, review, roadmap, Git, or PR status.

## Completion

`Status: current` is valid only when:

- the complete official surface is represented;
- required sources and tokens are accounted for;
- all required headings exist;
- no Mioframe or renderer decision leaked into the artifact;
- design contract revision is non-`none`;
- refresh date is exactly 30 calendar days after source checked date.

If official content remains incomplete, use `Status: blocked`, record exact blockers, and route to `self/design`.

Return after writing the artifact. Do not execute architecture in the same context.

## Report

```text
MATERIAL DESIGN RESULT
Input component:
Resolved official component:
Canonical family:
DESIGN.md path:
Artifact revision:
Design contract revision:
Official routes inspected:
Source revision:
Source checked at:
Refresh check after:
Normalized contract changed: yes | no | unknown
Source conflicts or extraction gaps: none | <details>
Document status: current | stale | blocked
Remaining blockers: none | <details>
Required return family: none | self
Required return stage: none | design
Status: complete | blocked
```

## Forbidden

- Producing a demand-scoped summary.
- Deriving official facts from current code, renderer artifacts, stories, tests, or consumers.
- Mixing later-stage decisions into `DESIGN.md`.
- Omitting unused official capability.
- Guessing missing facts.
- Changing design contract revision for metadata-only refresh.
- Choosing a family-specific refresh interval.
- Reusing an artifact revision after the file changed.
- Asking the operator to rerun the same component command.
