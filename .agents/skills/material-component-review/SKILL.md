---
name: material-component-review
description: 'Use for an independent full-PR review of one official Material component family after implementation. Reviews the complete result against the approved family contract and official evidence, writes the durable family audit, and returns merge readiness without modifying production implementation.'
---

# Material component review

Use this as the independent technical review for one implemented official Material family.

The reviewer must not be the context that implemented the change. Review the complete resulting PR, not only the latest correction patch or changed files from the latest round.

## Required inputs

Read:

1. root and applicable nested `AGENTS.md` files;
2. `src/shared/ui/material/docs/workflow.md`;
3. `src/shared/ui/material/docs/source-of-truth.md`;
4. `src/shared/ui/material/docs/component-architecture.md`;
5. `src/shared/ui/material/docs/component-testing.md`;
6. the approved family `README.md` contract;
7. the complete PR diff and current branch state;
8. current implementation, public exports, direct consumers, tests, stories, visual evidence, affected foundations, roadmap/inventory records, and prior family audit when present;
9. final verification state.

If the approved contract is missing, blocked, materially stale, or inconsistent with the implementation task, return `not enough information to decide` rather than inventing the intended architecture.

## Review boundary

This workflow is review-only for production implementation.

Allowed repository change:

```text
src/shared/ui/material/docs/audits/<family-slug>.md
```

Do not modify production code, tests, stories, snapshots, family contracts, registries, roadmap, inventory, or workflow policy during the review. Corrections begin through a separate implementation task.

## Review scope

Check the complete family and PR against:

- goal, non-goals, required scenarios, and accepted final behavior;
- current applicable Material 3 Expressive official evidence and recorded snapshot;
- family, foundation, state, anatomy, DOM, token, property, accessibility, and verification ownership;
- supported and unsupported surface;
- public API, slots, emits, invalid combinations, native semantics, and controlled-state contract;
- keyboard, focus, pointer, touch, target area, disabled/readonly, cancellation, cleanup, reduced motion, and browser behavior when applicable;
- token paths, configuration/state precedence, rendered property owners, typography, shape, elevation, state layer, ripple, focus indicators, and motion;
- shared UI blast radius and dependency direction;
- affected consumer compatibility and product-scenario preservation;
- migration completeness, public exports, obsolete owner removal, and approved compatibility state;
- proportional component, pure, browser, consumer, visual, and repository verification;
- simplicity, readability, and absence of workaround architecture or duplicated ownership.

Green CI proves only the checks that ran. It is not architecture or Material approval.

## Findings

Consolidate findings into:

- blockers;
- major issues;
- minor issues;
- not required for this PR.

Every confirmed finding contains:

```text
Severity: blocker | major | minor
Area:
Approved contract or official requirement:
Implementation evidence:
Observed mismatch:
Required correction:
Verification required:
```

Do not report speculative risks as findings. Separate unavailable evidence from confirmed defects.

One correction task must include all unresolved blocker and major findings from prior rounds. After correction, re-review the complete PR.

If two correction rounds still reveal ownership errors, missing scenarios, unstable public contracts, mixed responsibilities, architectural drift, or growing workaround logic, recommend redoing the architecture decision rather than continuing local patches.

## Durable audit

Create or replace exactly one file:

```text
src/shared/ui/material/docs/audits/<family-slug>.md
```

Follow `src/shared/ui/material/docs/audits/README.md`.

The audit records:

- requested and resolved family;
- review date;
- implementation branch/ref and commit;
- approved contract path and readiness;
- current and canonical owner;
- official sources and snapshot;
- supported surface and required consumer scenarios;
- confirmed findings and evidence gaps;
- verified compliant areas;
- operator visual status;
- merge recommendation.

Replace stale audit content instead of appending a review history.

## Merge recommendation

Return exactly one:

- `can merge`;
- `can merge with listed risks`;
- `should not merge until blockers are fixed`;
- `not enough information to decide`.

Use `can merge` only when:

- the approved contract is ready and fully implemented;
- ownership and public contracts are clear and stable;
- required scenarios and consumers are complete;
- applicable foundations are accepted;
- obsolete ownership and unapproved compatibility are removed;
- required technical proof and final verification pass;
- required operator visual acceptance is already recorded, or no new visual acceptance is required.

The reviewer must not claim operator visual acceptance unless it is durably recorded.

## Output

Finish with:

```text
MATERIAL COMPONENT REVIEW
Family:
Approved contract:
Implementation ref:
Official sources and snapshot:
Technical review: passed | blocked | insufficient evidence
Operator visual status: accepted | required | not applicable | blocked
Audit file: src/shared/ui/material/docs/audits/<family-slug>.md

Blockers:
- none | <finding>

Major issues:
- none | <finding>

Minor issues:
- none | <finding>

Not required for this PR:
- none | <item>

Verification:
Merge recommendation: can merge | can merge with listed risks | should not merge until blockers are fixed | not enough information to decide
Next action: none | <one consolidated correction or decision>
```

Do not implement corrections, weaken checks, or turn review into a second family contract.
