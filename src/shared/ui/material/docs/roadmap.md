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

The Floating Action Button family selected the single unambiguous no-consumer default (medium size, primary container color, required icon and accessible label) because no product code currently consumes a plain FAB; `RepoExplorerPane.vue`'s existing Extended FAB usage is a separate, out-of-scope official family and is unaffected. Independent review accepted one bounded risk: the podman-backed `storybook-behavior`/`visual` Playwright lanes for two edited legacy-proof files (`tests/e2e/storybook/focusIndicator.spec.ts`, `tests/e2e/visual/shared-ui/md-fab-family.spec.ts`) were not re-run in-sandbox after migration's subtractive edits; exact-head CI covers this before merge.

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

Select and run `material-component <next-family>` for the next M3 family; hand the completed Floating Action Button family (review verdict `compliant-with-listed-risks`, PR/CI readiness `ready`) to the architect for PR creation and exact-head CI first.
