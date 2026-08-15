# Mioframe Material migration roadmap

This file owns current repository-local Material milestone status, family-stage status, repository-visible technical blockers, and the next Material pipeline action. Every recorded state must be derivable from current repository contents. Durable workflow rules live in the canonical Material docs and skills.

## Current state

Last updated: 2026-08-14

Current milestone: `M3 — sequential component migration`

Status: `in-progress`

Completed canonical families in the current repository tree:

- Loading Indicator;
- Button;
- Switch;
- Checkbox;
- Floating Action Button.

The official Material Checkbox cache contains a keyboard table copied from Chips terminology. `DESIGN.md` records it as a source conflict, so the `Space or Enter` row is not treated as reliable Checkbox-specific evidence and no Enter workaround is added.

The Floating Action Button family selects the standalone icon-only FAB. The existing `RepoExplorerPane.vue` usage remains `MDExtendedFab`, which belongs to the separate Extended FAB family and remains legacy Material ownership under `src/shared/ui/Button`.

No repository-local blocker prevents selecting the next M3 family.

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

## Next Material pipeline action

Run `material-component Extended FAB`.
