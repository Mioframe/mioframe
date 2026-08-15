# Mioframe Material migration roadmap

This file owns current repository-local Material milestone status, repository-visible technical blockers, and the next Material pipeline action. Every recorded state must be derivable from current repository contents. Durable workflow rules live in the canonical Material docs and skills.

## Current state

Last updated: 2026-08-16

Current milestone: `M3 — sequential component migration`

Status: `in-progress`

Implemented canonical runtime families in the current repository tree:

- Loading Indicator;
- Button;
- Switch;
- Checkbox;
- Floating Action Button.

These existing families were produced by the previous staged workflow and may still contain legacy DESIGN/ARCHITECTURE/IMPLEMENTATION/MIGRATION/REVIEW artifacts. The current workflow does not bulk-rewrite them; each family is converted to `contract.ts`, `tokens.css`, `BEHAVIOR.md`, and developer-facing `README.md` when that family is next materially processed.

The existing Checkbox evidence records an official-source conflict where a keyboard table uses Chips terminology. The current implementation therefore does not add an Enter workaround. When Checkbox is next processed, the behavior contract worker must derive the current result from Material 3 MCP; if the source remains contradictory, the behavior contract is blocked rather than guessed from legacy evidence.

The Floating Action Button runtime family selects the standalone icon-only FAB. The existing `RepoExplorerPane.vue` usage remains `MDExtendedFab`, which belongs to Extended FAB and remains legacy Material ownership under `src/shared/ui/Button`.

No repository-local blocker prevents selecting the next M3 family.

## Milestones

| ID  | Milestone                            | Status        |
| --- | ------------------------------------ | ------------- |
| M0  | focused Material definition workflow | `complete`    |
| M1a | Loading Indicator dependency family  | `complete`    |
| M1  | Button action family                 | `complete`    |
| M2  | Switch stateful pilot                | `complete`    |
| M3  | sequential component migration       | `in-progress` |

## Known non-blocking follow-up

`RelationValueFieldData.vue` still has the pre-existing accessible-name gap on its standalone relation-selection checkbox.

## Next Material pipeline action

Run `material-component Extended FAB` using the focused three-contract plus usage-guidance workflow.
