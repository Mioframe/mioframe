---
name: material-component-design
description: 'Use with only an official Material component name to create or refresh that family DESIGN.md as a complete source-backed snapshot of the official Material 3 Expressive documentation, without Mioframe demand, renderer, architecture, implementation, or migration decisions.'
---

# Material component design

Create or refresh one family `DESIGN.md` before architecture or implementation.

## Input contract

The only required input is the Material component name.

Accept official names and repository aliases such as:

```text
Button
MDButton
Loading indicator
MDLoadingIndicator
```

Resolve the official component and canonical family path from repository and official evidence. Ask for clarification only when the name genuinely maps to multiple distinct official Material components.

## Output artifact

Write exactly one primary artifact:

```text
src/shared/ui/material/components/<family>/DESIGN.md
```

Follow `src/shared/ui/material/docs/design-document.md`.

The artifact is a complete normalized official-design snapshot. It is not an implementation brief, architecture plan, adapter matrix, renderer audit, migration report, or review result.

## Read first

- applicable parent `AGENTS.md` files;
- `src/shared/ui/material/AGENTS.md`;
- `src/shared/ui/material/docs/design-document.md`;
- the existing family `DESIGN.md`, when present;
- the official Material source cache/index and exact applicable component pages.

Do not read the current family README, architecture, implementation, stories, tests, m3e package, current consumers, migration record, review, or roadmap before the official design ledger is complete. Those sources can bias a supposedly complete official snapshot toward the currently implemented subset.

## Required official source pass

Inspect every applicable official source, including:

- overview;
- specs;
- guidelines;
- accessibility;
- complete token tables;
- expressive-update notes;
- related components and delegated foundation guidance;
- adaptive/platform guidance when present.

Record exact source routes, titles, capture date, and cache/source revision.

If a required page is missing or extraction is incomplete, do not silently summarize around the gap. Set the document status to `blocked`, list the missing source, and report the exact gap.

## Completeness rules

The document must describe the complete official component contract, including unsupported-by-Mioframe capability.

Cover:

- identity and intended use;
- differences from adjacent components and earlier Material versions;
- anatomy and content roles;
- all variants and configurations;
- all sizes, shapes, defaults, and valid combinations;
- complete geometry, spacing, target, typography, elevation, and motion specifications;
- every documented state and state combination;
- behavior, selection, activation, dismissal, progress, or navigation semantics;
- usage guidance and do/don't rules;
- accessibility and input behavior;
- complete official component-token catalogue;
- source conflicts, unresolved values, and unavailable guidance;
- official dependencies and related components.

Do not omit a variant, state, part, size, token, measurement, or guidance rule because no current Mioframe consumer needs it.

## Token extraction

For every official component token, preserve:

- exact official path;
- official display name;
- system and reference aliases;
- documented values for light, dark, high contrast, and other published modes;
- unresolved or absent values exactly as unresolved/absent.

Do not rename tokens into Mioframe CSS names and do not select a supported subset. Selection belongs to `material-component-architecture`.

## Separation rules

`DESIGN.md` must not contain:

- current product demand;
- `implement-now`, `defer`, or migration decisions;
- Vue API design;
- m3e API, mappings, fallback chains, defects, or workarounds;
- implementation paths;
- tests or verification plans;
- PR or roadmap status.

Use structured paraphrase for prose. Preserve exact names, paths, measurements, token values, and source references. Do not copy entire official pages verbatim.

## Review

Before reporting complete, verify that:

1. every applicable official page is represented;
2. the document includes the full official surface, not only a selected subset;
3. all component tokens from the official specs are present;
4. no Mioframe or renderer decision leaked into the artifact;
5. source conflicts and extraction gaps are explicit;
6. status is truthfully `current`, `stale`, or `blocked`.

Do not proceed into architecture or implementation from this skill. The completed design document is the handoff artifact for a later `material-component-architecture` invocation.

## Report

```text
MATERIAL DESIGN RESULT
Input artifact:
Resolved official component:
Canonical family:
DESIGN.md path:
Official routes inspected:
Source snapshot date:
Source/cache revision:
Complete variants/configurations:
Complete states/behavior:
Complete geometry/specs:
Complete accessibility guidance:
Official token rows captured:
Source conflicts or extraction gaps: none | <details>
Document status: current | stale | blocked
Next stage: architecture | design correction required
Status: complete | partial (<exact remainder>) | blocked (<exact reason>)
```

## Forbidden

- Producing only a summary or demand-scoped subset.
- Using the family README as the official design source.
- Deriving official facts from current code, stories, tests, m3e, or consumers.
- Mixing architecture, implementation, renderer, migration, verification, or review decisions into `DESIGN.md`.
- Omitting unused official capability.
- Treating links to official pages as a substitute for the complete local description.
- Guessing missing measurements, tokens, defaults, or behavior.
- Running the architecture or any later stage in the same invocation.
