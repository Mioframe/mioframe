# Mioframe Material migration roadmap

This file owns current Material milestone status, family-stage status, technical blockers, and next operator action. Durable workflow rules live in the canonical Material docs and skills.

## Current state

Last updated: 2026-08-13

Current milestone: `M3 — sequential component migration`

Status: `in-progress`

Checkbox family status: `complete`.

PR #194 is open. The Checkbox architecture, implementation, migration, and independent review are complete. No production correction is required.

The official Material Checkbox cache contains a keyboard table copied from Chips terminology. `DESIGN.md` records it as a source conflict, so the `Space or Enter` row is not treated as reliable Checkbox-specific evidence and no Enter workaround is added.

## Durable invariants

1. Official Material documentation and the project MCP/cache define Material semantics.
2. m3e remains a private renderer and is not a semantic authority.
3. Source conflicts are recorded instead of guessed.
4. Public controlled props remain the source of truth.
5. Coding agents use focused local verification; exact-head PR CI is the repository gate.
6. Merge readiness belongs to the architect after CI and full PR review.

## Milestones

| ID  | Milestone                           | Status        |
| --- | ----------------------------------- | ------------- |
| M0  | workflow architecture and rules     | `complete`    |
| M1a | Loading Indicator dependency family | `complete`    |
| M1  | Button action family                | `complete`    |
| M2  | Switch stateful pilot               | `complete`    |
| M3  | sequential component migration      | `in-progress` |

## Known non-blocking follow-up

`RelationValueFieldData.vue` still has the pre-existing accessible-name gap on its standalone relation-selection checkbox.

## Next operator action

1. Let GitHub CI verify the current exact PR #194 head.
2. Perform the final full PR review.
3. Merge Checkbox if no blocker remains.
4. Select the next M3 family after merge.
