# Mioframe Material migration roadmap

This file owns only the current sequence, milestone state, blocker, and next action. Durable rules live in `architecture.md` and `component-adapter.md`.

## Current state

Last updated: 2026-07-26

Current milestone: `M1 — MDButton adapter pilot`

Status: `correction`

Owner: current architecture-reset branch

Blocker: the latest Material-first pass is not ready for operator review. The Button matrix incorrectly rejects text toggle although official Material exposes default and toggle variants across all five color configurations. It also publishes unused link/form surface without current demand or an explicit non-Material decision. The new `LoadingButton` places `aria-busy` on a wrapper instead of the interactive owner, duplicates renderer color logic, and documents its non-Material presentation under the `MDButton` Storybook family.

Next action: correct the Button matrix and implementation, keep text toggle supported, reduce the public API to the selected Material surface plus required native adaptation, fix `LoadingButton` DOM/accessibility/color ownership and colocated stories, restore native click bubbling, then rerun focused and final verification before operator review.

Implementation ownership remains `migrating`.

## Milestones

| ID  | Milestone                         | Status         | Depends on | Exit gate                                                                                                                                                                                                                |
| --- | --------------------------------- | -------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M0  | m3e-backed architecture reset     | `verification` | none       | Material-first public boundary; private m3e renderer boundary; contract-matrix workflow; package-derived typing; final verification                                                                                      |
| M1  | `MDButton` adapter pilot          | `correction`   | M0         | accepted Material–m3e–Vue matrix; demand-driven official Material Vue API; non-Material requirements explicitly resolved; correct owner for every selected gap; migrated consumers; verification and operator acceptance |
| M2  | `MDSwitch` stateful adapter pilot | `planned`      | M1         | source-backed Material matrix; selected Material API; controlled state and event order; m3e gap ownership; verification and operator acceptance                                                                          |
| M3  | sequential component migration    | `planned`      | M2         | one official Material component at a time; demand-driven Material API; explicit m3e mapping and gap ownership; no accidental extensions or renderer leakage                                                              |

## M1 — MDButton pilot

### Reusable implementation work

- `@m3e/web@^2.6.2` resolves to `2.6.2`;
- application, Storybook, and tests recognize `m3e-*`;
- the m3e-backed `MDButton` owner and public export exist;
- renderer typing derives from package exports;
- consumers use the canonical owner;
- native, controlled-state, visual, and motion-assessment work exists;
- the obsolete legacy renderer is removed;
- loading has been separated into a non-MD shared component.

This work remains reusable but does not complete the public contract.

### Required correction work

1. Correct the matrix: Material supports text toggle; remove the normalization and warning that disable it.
2. Keep only currently required Material API and required Vue/native adaptation. Defer unused `href`, `target`, `rel`, `download`, `name`, and `value` surface unless separately justified.
3. Normalize selected-state content naming to Material/Vue terminology rather than exposing the renderer slot name directly.
4. Preserve native click propagation; do not stop bubbling without an accepted requirement.
5. Make `LoadingButton` put `aria-busy` on the actual interactive owner and avoid an unnecessary wrapper when the `MDButton` root can own the component.
6. Let the progress indicator follow the rendered icon color instead of duplicating per-color renderer logic; cover disabled loading behavior.
7. Give `LoadingButton` its own colocated non-Material Storybook documentation and keep Material Button stories limited to `MDButton`.
8. Update focused contracts and browser/visual coverage, then run final `pnpm verify`.
9. Request operator visual and renderer-owned motion review only after these corrections pass.

M1 must not restore the legacy renderer, copy the m3e API into Vue, preserve legacy API merely for compatibility, add a non-Material public option silently, access private shadow DOM, or build a parallel renderer.

## Later milestones

For every later component:

1. inspect official Material first;
2. select the current required subset;
3. create the Material–m3e–Vue matrix;
4. define the public Vue API from Material terminology;
5. resolve non-Material requirements separately;
6. use m3e directly where conformant;
7. assign gaps to wrapper or m3e according to ownership;
8. migrate consumers and verify.

Only after M1 and M2 may repeated concrete adapter code be considered for extraction.

## Update protocol

Update only the current milestone/status, exact blocker, single next action, and exit gate when implementation evidence changes it. Do not turn this file into a component inventory or implementation log.
