# Mioframe Material migration roadmap

This file is the only owner of the current sequence, milestone state, blockers, and next action. Durable rules live in `architecture.md`, `component-adapter.md`, `component-tokens.md`, `token-api.md`, and `m3e-defects.md`.

## Current state

Last updated: 2026-07-28

Current milestone: `M0/M1 — m3e architecture reset, token ownership, and MDButton pilot`

Status: `correction`

Owner: PR #162 / `refactor/material-docs-ownership`

Implementation ownership: `migrating`

### Implemented and verified on head `3d09f420`

- `MDButton` and `MDLoadingIndicator` implement the selected demand-scoped contracts through private installed `@m3e/web` `2.6.3` renderers.
- Button composes the canonical Loading indicator adapter and does not own dependency renderer details.
- The four shared state-opacity roles use `8%`/`10%`/`10%`/`16%` and work across selected current CSS grammars.
- Browser and visual proof covers native form behavior, controlled toggle state, accessibility, expanded target, pointer hover, keyboard focus, pointer ripple, Space ripple, Loading indicator geometry, and independent presentation.
- `M3E-001` and `M3E-002` remain controlled dependency-owned workarounds revalidated against installed `2.6.3`.
- The provisional `M3E-003` was withdrawn as a pre-merge misclassification and its ID retired.
- Retained Material reference/system declarations moved to canonical foundation/theme owners; `src/shared/lib/md/tokens.css` was deleted without an alias.
- `token-api.md` is populated for the retained supported public surface.
- Current consumers use the canonical `MDButton` export.
- The intentional dependency refresh, including `@m3e/web`, is part of this PR and remains in scope.
- CI run 2860 passed format, oxlint, eslint, type-check, unit, E2E, Storybook behavior, visual, mutation, version, and preview build on head `3d09f420`.
- Operator visual/motion review is performed manually during development. No unresolved operator-reported visual or motion issue is currently recorded; a reported issue reopens the affected milestone.

### Remaining correction work

1. Make Button Vue custom-element glue derive from `M3eButtonElement`, not `HTMLElement`.
2. Connect the new fixed-point `scripts/ciAutofix.mjs` implementation to the `ci:autofix` package script and verify the workflow integration.
3. Remove no-op dark elevation overrides and the matching duplicate-owner test exception.
4. Remove stale `2.6.2` wording from Loading indicator production comments; reference current defect IDs/consumed range instead.
5. Run focused checks and the exact final branch-scope verification required by root policy on the resulting head.
6. Perform the final full-PR architecture and merge-readiness review.

## Milestones

| ID | Milestone | Status | Depends on | Exit gate |
| --- | --- | --- | --- | --- |
| M0 | m3e-backed architecture reset and token foundation | `correction` | none | canonical owners/catalogue; no duplicate/no-op owner exceptions; tooling integration complete; final branch-scope verification |
| M1a | `MDLoadingIndicator` dependency adapter | `correction` | M0 | accepted contract; package-derived typing; accessibility/geometry proof; current controlled defect records; no unresolved reported operator issue |
| M1 | `MDButton` adapter pilot | `correction` | M1a | package-derived renderer glue; canonical dependency composition; visible interaction proof; migrated consumers; final verification |
| M2 | `MDSwitch` stateful adapter pilot | `planned` | M1 | source-backed matrix; controlled state/event order; renderer-gap ownership; verification |
| M3 | sequential component migration | `planned` | M2 | one official component at a time; dependencies first; demand-scoped API/tokens; explicit gap ownership |

## Accepted foundation structure

```text
material/foundation/tokens.css
  → supported renderer-independent reference/system foundations

material/foundation/theme.css
  → default palette and light/dark system-color assignments

material/components/<family>/tokens.css
  → selected supported official component tokens
  → private family-local renderer mappings

material/docs/token-api.md
  → complete supported consumer catalogue
```

One public token has one semantic declaration owner. Theme may override theme-owned roles inside `theme.css`; no-op duplicates of foundation-owned roles are not accepted.

## M1a — Loading indicator

Selected implementation:

- required `label` and optional numeric overall `size` API;
- independent root export and package-derived renderer source type;
- browser role/name and host-geometry proof;
- independent size and inherited-color visual baselines;
- Button composition through the public Vue boundary;
- owner-local `M3E-001`/`M3E-002` workarounds.

Contained presentation remains deferred.

## M1 — Button

Selected implementation:

- default and controlled toggle actions;
- five color configurations, five sizes, and round/square shapes;
- leading and selected content roles;
- native button/submit/reset behavior and normal event bubbling;
- disabled and loading combinations;
- canonical Loading indicator composition with `24/24/24/32/40` overall-size handoff;
- renderer-owned state layer, ripple, focus, and pressed presentation;
- current consumer migration.

## Next component process

For each later component:

1. inspect official overview/specs/guidelines/accessibility and related components;
2. select current demand and complete official dependencies first;
3. create the accepted Material–m3e–Vue matrix;
4. implement the minimum canonical adapter and selected token surface;
5. keep m3e private and route gaps to the correct owner;
6. migrate consumers and remove replaced target ownership;
7. verify through the faithful proof owners and exact branch/task scope.

Consider shared adapter extraction only after M1 and M2 demonstrate repeated concrete code, not merely repeated documentation structure.
