---
name: material-component-design
description: 'Use with an official Material component name to create or refresh the complete source-backed family DESIGN.md without Mioframe demand, renderer, architecture, implementation, migration, or review decisions.'
---

# Material component design

Create or refresh one family `DESIGN.md` and return control to the outer orchestrator.

This stage owns official Material source normalization only.

## Input

The only required input is the Material component name.

Resolve the official component and canonical family path from official and readable workspace evidence. Ask for clarification only when the name genuinely maps to multiple distinct official components.

## Worker boundary

Run in a fresh isolated worker context.

Use official source tools, task-relevant readable workspace files, applicable rules, and documented project commands. Do not depend on Git history, diff, branch, worktree/index state, commit identifiers, pull-request metadata, or external checks.

Do not read family implementation, tests, renderer package, consumers, migration, review, or roadmap before the official source ledger is complete. Those sources can bias the design toward current demand.

## Output

Write exactly:

```text
src/shared/ui/material/components/<family>/DESIGN.md
```

Follow `src/shared/ui/material/docs/design-document.md`.

The artifact begins with exact control fields:

```text
Status: current | stale | blocked
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return stage: none | design
```

Do not append prose to an enum value.

## Official source pass

Inspect every applicable official source, including:

- overview, specifications, guidelines, and accessibility;
- expressive update notes;
- complete token tables;
- related components and delegated foundation guidance;
- adaptive/platform guidance when present.

Use available fallbacks in order:

1. current official Material source service;
2. official cache refresh and route index;
3. direct official routes;
4. newest complete source-cache or workspace snapshot;
5. associated official token resources.

A failed refresh helper is not itself a blocker when a complete newest-known official snapshot exists and no newer material revision is known.

Use statuses exactly:

- `current` — complete newest successfully acquired official revision, with no evidence of a newer material revision;
- `stale` — affirmative evidence shows official content changed after the snapshot;
- `blocked` — required content remains missing or incomplete after all available fallbacks.

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

`DESIGN.md` contains no:

- Mioframe demand or `implement-now`/`defer` decisions;
- Vue API;
- renderer mapping, defect, or workaround;
- implementation path;
- test or verification plan;
- migration, review, roadmap, Git, or PR status.

## Completion

`Status: current` is valid only when the full official surface is represented, all required sources and tokens are accounted for, and no Mioframe or renderer decision leaked into the artifact.

If official content remains incomplete, use `Status: blocked`, record exact blockers, and set `Required return stage: design`.

Return to the orchestrator after writing the artifact. Do not execute architecture in the same context.

## Report

```text
MATERIAL DESIGN RESULT
Input component:
Resolved official component:
Canonical family:
DESIGN.md path:
Official routes inspected:
Source snapshot and revision:
Refresh attempts and fallback:
Official token rows captured:
Source conflicts or extraction gaps: none | <details>
Document status: current | stale | blocked
Remaining blockers: none | <details>
Required return stage: none | design
Status: complete | blocked
```

## Forbidden

- Producing a demand-scoped summary.
- Deriving official facts from current code, renderer artifacts, stories, tests, or consumers.
- Mixing later-stage decisions into `DESIGN.md`.
- Omitting unused official capability.
- Guessing missing facts.
- Asking the operator to rerun the same component command.
