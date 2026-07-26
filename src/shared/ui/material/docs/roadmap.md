# Mioframe Material migration roadmap

This file owns only the current sequence, milestone state, blocker, and next action. Durable rules live in `architecture.md` and `component-adapter.md`.

## Current state

Last updated: 2026-07-26

Current milestone: `M1 — MDButton adapter pilot`

Status: `correction`

Owner: current architecture-reset branch

Blocker: the latest pass misinterpreted official Material sources. It rejected text toggle from incomplete token coverage despite positive Button overview/guideline evidence, and classified loading as non-Material without checking Loading indicator and Progress indicator placement guidance. The resulting separate `LoadingButton` is not accepted final ownership and also has DOM, ARIA, color, story, and bubbling defects.

Next action: rerun `material-component-adapter` for `MDButton`. Correct the matrix with positive source evidence, keep text toggle enabled, treat loading/progress inside Button as official cross-component Material composition, inspect exact m3e Button/Loading indicator/Progress indicator entry points, normalize the demand-driven Vue API, remove the separate `LoadingButton` unless the corrected matrix proves it necessary, migrate consumers, and rerun focused plus final verification before operator review.

Implementation ownership remains `migrating`.

## Milestones

| ID  | Milestone                         | Status         | Depends on | Exit gate                                                                                                                                                                                                                                                                 |
| --- | --------------------------------- | -------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | m3e-backed architecture reset     | `verification` | none       | Material-first public boundary; private m3e renderer boundary; evidence-gated contract-matrix workflow; package-derived typing; final verification                                                                                                                        |
| M1  | `MDButton` adapter pilot          | `correction`   | M0         | accepted source-backed Material–m3e–Vue matrix; text toggle supported; loading/progress Button composition resolved in Material ownership; demand-driven official Vue API; correct owner for every selected gap; migrated consumers; verification and operator acceptance |
| M2  | `MDSwitch` stateful adapter pilot | `planned`      | M1         | source-backed Material matrix; selected Material API; controlled state and event order; m3e gap ownership; verification and operator acceptance                                                                                                                           |
| M3  | sequential component migration    | `planned`      | M2         | one official Material component at a time; demand-driven Material API; explicit m3e mapping and gap ownership; no accidental extensions or renderer leakage                                                                                                               |

## M1 — MDButton pilot

### Reusable implementation work

- `@m3e/web@^2.6.2` resolves to `2.6.2`;
- application, Storybook, and tests recognize `m3e-*`;
- the m3e-backed `MDButton` owner and public export exist;
- renderer typing derives from package exports;
- consumers use the canonical Material owner or the provisional loading wrapper;
- native, controlled-state, visual, and motion-assessment work exists;
- the obsolete legacy renderer is removed.

The separate `LoadingButton` commit is evidence and may contain reusable consumer/test changes, but its ownership decision is reopened.

### Required correction work

1. Correct the evidence process: token-table absence cannot prohibit a positively documented Material combination.
2. Keep text toggle supported and remove its normalization/warning.
3. Add Loading indicator and Progress indicator pages to the Button matrix as official cross-component sources.
4. Resolve the exact demand-driven Vue API for indeterminate loading and determinate progress without copying legacy shape automatically.
5. Inspect exact m3e `button`, `loading-indicator`, and `progress-indicator` entry points and use them maximally where conformant.
6. Keep documented indicator composition in the Material Button owner unless a source-backed architecture comparison proves another owner simpler and semantically correct.
7. Remove unused `href`, `target`, `rel`, `download`, `name`, and `value` surface unless current demand or an explicit decision justifies it.
8. Normalize selected-state content names to Material/Vue terminology rather than renderer slot vocabulary.
9. Preserve native click bubbling.
10. Put busy/native semantics on the interactive Button owner, inherit indicator color from rendered label/icon state, and cover disabled plus loading/progress.
11. Keep Material Button stories limited to the final `MDButton` contract; remove obsolete provisional `LoadingButton` stories/components when ownership returns to Button.
12. Run focused verification, final `pnpm verify`, and only then request operator visual/motion review.

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
