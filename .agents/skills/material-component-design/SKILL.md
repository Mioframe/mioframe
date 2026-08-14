---
name: material-component-design
description: 'Use with an official Material component name to create or refresh the complete source-backed family DESIGN.md without Mioframe demand, renderer, architecture, implementation, migration, or review decisions.'
---

# Material component design

Create or refresh one family `DESIGN.md` and return control to the orchestrator.

This stage owns official Material source normalization only.

## Input

The only required input is the Material component name.

Resolve the official component and canonical family from official and readable workspace evidence. Ask only when the name maps to multiple materially different official components.

## Worker boundary

Run in a fresh isolated context.

Use official source tools, task-relevant readable workspace files, applicable rules, and documented project commands. Do not depend on Git, PR, commit, or external-check state.

Do not read implementation, renderer, consumers, migration, review, or roadmap before the official source ledger is complete.

## Output

Write exactly:

```text
src/shared/ui/material/components/<family>/DESIGN.md
```

Follow `src/shared/ui/material/docs/design-document.md`.

Control fields:

```text
Status: current | blocked
Source revision: <exact source/cache revision>
Source checked at: YYYY-MM-DD
Refresh check after: YYYY-MM-DD
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none
Required return stage: none
```

Do not create artifact timestamps, design-contract revision counters, hashes, or other workflow identities.

Legacy revision fields in an existing DESIGN are ignored and removed when this stage rewrites the file.

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

## Official source pass

Inspect every applicable official source, including overview, specifications, guidelines, accessibility, expressive updates, complete token tables, delegated foundations, related components, and adaptive/platform guidance.

Use fallbacks in order:

1. current official Material source service;
2. official cache refresh and route index;
3. direct official routes;
4. newest complete source-cache or workspace snapshot;
5. associated official token resources.

A failed refresh helper is not itself a blocker when a complete newest-known official snapshot exists and no newer Material revision is known.

The refresh interval is fixed:

```text
Refresh check after = Source checked at + 30 calendar days
```

When refresh finds no normalized contract change, update source metadata/evidence, preserve the normalized contract, and say so in `Revision summary`.

When normalized official content changes, update the design contract content and summarize the exact change. No downstream version identity is required because later stages execute fresh in the current invocation.

## Required content

Capture the complete official component contract, including unused capability:

- identity, intended use, and adjacent-component distinctions;
- anatomy and content roles;
- every variant, configuration, size, shape, default, and valid combination;
- geometry, spacing, targets, typography, elevation, and motion;
- every documented state and state combination;
- behavior and usage guidance;
- accessibility and input behavior;
- complete official component-token catalogue;
- official dependencies and related components;
- source conflicts, missing values, and unavailable guidance.

Preserve exact official token paths, display names, aliases, documented values, and unresolved values. Never guess missing facts.

## Terminal-state rules

### Success

Return `Status: current` only when the complete official surface, sources, tokens, headings, dates, and separation rules are satisfied.

Use:

```text
Remaining blockers: none
Required return family: none
Required return stage: none
```

### Genuine blocker

After exhausting every official-source fallback, if required content remains unavailable, contradictory, or incomplete, return:

```text
Status: blocked
Remaining blockers: <exact blocker>
Required return family: none
Required return stage: none
```

This is terminal for the invocation. Do not return `self/design`.

A fixable design-document omission, formatting defect, or source-normalization defect owned by this stage must be corrected before this worker returns.

## Separation

`DESIGN.md` contains no Mioframe demand, selected surface, Vue API, renderer mapping, defect, workaround, implementation path, proof plan, migration, review, roadmap, Git, or PR status.

Return after writing the artifact. Do not execute architecture in this context.

## Report

```text
MATERIAL DESIGN RESULT
Input component:
Resolved official component:
Canonical family:
DESIGN.md path:
Official routes inspected:
Source revision:
Source checked at:
Refresh check after:
Normalized contract changed: yes | no | unknown
Source conflicts or extraction gaps: none | <details>
Document status: current | blocked
Remaining blockers: none | <details>
Required return family: none
Required return stage: none
Status: complete | blocked
```

## Forbidden

- Returning `self/design`.
- Leaving a current-stage fixable omission unresolved.
- Producing a demand-scoped summary.
- Deriving official facts from code, renderer artifacts, stories, tests, or consumers.
- Mixing later-stage decisions into `DESIGN.md`.
- Omitting unused official capability.
- Adding timestamp/hash/revision bookkeeping as a workflow identity.
- Choosing another refresh interval.
- Asking the operator to rerun the same component command.
