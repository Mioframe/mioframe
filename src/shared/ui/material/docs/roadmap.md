# Mioframe Material migration roadmap

This file owns only the current sequence, milestone state, blocker, and next action. Durable rules live in `architecture.md` and `component-adapter.md`.

## Current state

Last updated: 2026-07-26

Current milestone: `M1 — MDButton adapter pilot`

Status: `verification`

Owner: current architecture-reset branch

Blocker: none. The correction pass fixed both source-interpretation errors: text toggle is enabled (no prohibition existed — only incomplete token coverage, which is not evidence), and indeterminate loading is implemented as a Button-owned Material composition backed by `m3e-loading-indicator`, with `aria-busy` on the interactive owner and color inherited via `currentColor`. The separate `LoadingButton` is removed; its 3 consumers (`RepositoryExplorerWidget.vue`, `VfsActivityStatusChip.vue`, `DialogForm.vue`) use `MDButton` directly. Unused link/form surface (`href`, `download`, `target`, `rel`, `name`, `value`) was also removed since no current consumer used it. Determinate progress-in-button remains deferred: no current consumer passes a real fractional value to a Button.

Next action: run focused and final `pnpm verify`, then request operator visual/motion review of the corrected `MDButton.stories.ts` (text toggle, `LoadingIndicatorPresentation`). Move status to `complete` only after both pass.

Implementation ownership remains `migrating` until verification and operator acceptance land; see `components/button/README.md` for the accepted matrix.

## Milestones

| ID  | Milestone                         | Status         | Depends on | Exit gate                                                                                                                                                                                                                                                                 |
| --- | --------------------------------- | -------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | m3e-backed architecture reset     | `verification` | none       | Material-first public boundary; private m3e renderer boundary; evidence-gated contract-matrix workflow; package-derived typing; final verification                                                                                                                        |
| M1  | `MDButton` adapter pilot          | `verification` | M0         | accepted source-backed Material–m3e–Vue matrix; text toggle supported; loading/progress Button composition resolved in Material ownership; demand-driven official Vue API; correct owner for every selected gap; migrated consumers; verification and operator acceptance |
| M2  | `MDSwitch` stateful adapter pilot | `planned`      | M1         | source-backed Material matrix; selected Material API; controlled state and event order; m3e gap ownership; verification and operator acceptance                                                                                                                           |
| M3  | sequential component migration    | `planned`      | M2         | one official Material component at a time; demand-driven Material API; explicit m3e mapping and gap ownership; no accidental extensions or renderer leakage                                                                                                               |

## M1 — MDButton pilot

Implementation evidence:

- `@m3e/web@^2.6.2` resolves to `2.6.2`; Button and Loading indicator entry points are used directly;
- application, Storybook, and tests recognize `m3e-button` and `m3e-loading-indicator`;
- the m3e-backed `MDButton` owner and public export exist; renderer typing derives from package exports;
- text toggle is supported (no normalization/warning);
- indeterminate loading is a Button-owned composition (`loading` prop, internal `m3e-loading-indicator`, `aria-busy` on the interactive owner, `currentColor` inheritance); determinate progress-in-button is deferred (no current numeric consumer);
- unused `href`, `target`, `rel`, `download`, `name`, and `value` surface is removed;
- the separate `LoadingButton` is removed; all 3 former consumers use `MDButton` directly;
- native click bubbling is preserved; focused component-contract tests and visual stories cover the corrected contract.

Remaining before `complete`: final `pnpm verify` and operator visual/motion acceptance of `MDButton.stories.ts` (see `components/button/README.md`).

M1 must not restore the legacy renderer, infer prohibitions from missing tokens, search only the selected component page, copy the m3e API into Vue, preserve unused public surface for completeness, access private shadow DOM, or build a parallel renderer.

## Later milestones

For every later component:

1. inspect official overview, specs, guidelines, and accessibility;
2. follow related-component placement and composition references;
3. require positive evidence for restrictions and `not-material` decisions;
4. select the current required subset;
5. create the Material–m3e–Vue matrix;
6. define the public Vue API from Material terminology;
7. use m3e directly where conformant;
8. assign gaps to wrapper or m3e according to ownership;
9. migrate consumers and verify.

Only after M1 and M2 may repeated concrete adapter code be considered for extraction.

## Update protocol

Update only the current milestone/status, exact blocker, single next action, and exit gate when implementation evidence changes it. Do not turn this file into a component inventory or implementation log.
