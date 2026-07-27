# Mioframe Material migration roadmap

This file owns only the current sequence, milestone state, blocker, and next action. Durable rules live in `architecture.md`, `component-adapter.md`, and `m3e-defects.md`.

## Current state

Last updated: 2026-07-27

Current milestone: `M1 — MDButton adapter pilot`

Status: `verification`

Owner: current architecture-reset branch

Blocker: resolved. `MDLoadingIndicator` now sets the rendered custom element's host width/height from the public overall `size` and maps the private m3e active-size input to `size * 38 / 48`, preserving the official 38dp/48dp active-indicator/overall ratio. m3e 2.6.2's internal `0.842` rotation-safe scale is left renderer-owned and uncompensated. The CSS-variable-name mismatch and the uncontained-host-width defect are recorded as `M3E-001` and `M3E-002` in the canonical m3e defect registry, with `workaround-active` / `unreported` lifecycle status and independent removal triggers.

Next action: run the required instruction compatibility regeneration and final `pnpm verify`, then obtain operator visual/motion acceptance for the regenerated Loading indicator and Button-loading baselines.

Implementation ownership: `migrating`.

## Milestones

| ID  | Milestone                               | Status         | Depends on | Exit gate                                                                                                                                                                                                                                      |
| --- | --------------------------------------- | -------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | m3e-backed architecture reset           | `verification` | none       | Material-first public boundary; private m3e renderer boundary; evidence-gated contract-matrix workflow; canonical defect registry; canonical adapters for official Material dependencies; package-derived typing; final verification           |
| M1a | `MDLoadingIndicator` dependency adapter | `verification` | M0         | accepted Loading indicator Material–m3e–Vue matrix; demand-scoped public Vue API; official accessibility and token contract; exact renderer typing; corrected overall/active geometry; linked `M3E-001`/`M3E-002`; tests, visual/motion review |
| M1  | `MDButton` adapter pilot                | `verification` | M1a        | accepted Button matrix; text toggle supported; loading composition delegates to `MDLoadingIndicator`; no raw dependency m3e usage; normalized Vue API; migrated consumers; verification and operator acceptance                                |
| M2  | `MDSwitch` stateful adapter pilot       | `planned`      | M1         | source-backed Material matrix; selected Material API; controlled state and event order; m3e gap ownership; confirmed-defect registry integration; verification and operator acceptance                                                         |
| M3  | sequential component migration          | `planned`      | M2         | one official Material component at a time; dependency adapters implemented first; demand-driven Material API; explicit m3e mapping and gap ownership; confirmed defects tracked centrally; no renderer leakage                                 |

## M1a — MDLoadingIndicator prerequisite

Confirmed architecture and completed work:

- canonical `MDLoadingIndicator` component and root export exist;
- `MDButton` composes it through its public Vue API rather than raw m3e;
- package-derived renderer typing, browser accessibility proof, state-combination coverage, visual-runner specs, and committed baselines exist;
- `size` is a constrained numeric overall Material size with default `48` and accepted range `24..240`;
- non-finite input normalizes to `48` with a development warning;
- the m3e 2.6.2 documented-versus-effective CSS variable-name mismatch is recorded as controlled defect `M3E-001`;
- the m3e 2.6.2 uncontained-host-width coupling is recorded as controlled defect `M3E-002`;
- both defects are `workaround-active` in Mioframe and `unreported` upstream, and remain dependency-owned.

Correction implemented:

- the public overall size sets the host width and height;
- the private m3e active-size input receives `overallSize * 38 / 48`;
- m3e's internal `0.842` shape scale remains renderer-owned and is not inverted or compensated;
- browser geometry tests (`tests/e2e/storybook/md-loading-indicator.spec.ts`) and regenerated, inspected visual baselines (`md-loading-indicator-sizes.png`, `md-loading-indicator-inherited-color.png`) prove the corrected mapping.

Contained presentation remains deferred.

## M1 — MDButton pilot

The Button adapter architecture remains accepted:

1. `MDButton` imports and renders `MDLoadingIndicator`, not raw `m3e-loading-indicator`;
2. loading takes precedence over normal and selected icon routes and restores the correct route;
3. normal native click bubbling is preserved;
4. text toggle remains supported;
5. Button hands off the action label as the loading-purpose label because the indicator represents progress of that same named action;
6. Button uses the accepted overall Loading indicator size mapping `24/24/24/32/40` and does not access dependency-private m3e inputs;
7. Button references `M3E-001` and `M3E-002` only through the Loading indicator dependency contract and does not own their lifecycle.

M1's dependency geometry correction is implemented and its regenerated `md-button-loading.png` baseline is inspected; final `pnpm verify` and operator visual/motion acceptance remain.

## Later milestones

For every later component:

1. inspect official overview, specs, guidelines, and accessibility;
2. follow related-component placement and composition references;
3. identify required official Material dependency adapters;
4. implement or complete dependencies first using the same full workflow;
5. require positive evidence for restrictions and `not-material` decisions;
6. select the current required subset;
7. create each owning family's Material–m3e–Vue matrix;
8. classify m3e absence as `missing` and confirmed incorrect behavior as `divergent` with a stable `M3E-*` record;
9. define public Vue APIs from Material terminology;
10. use m3e only inside the corresponding canonical adapter;
11. migrate consumers and verify.

Only after M1 and M2 may repeated concrete adapter code be considered for extraction.

## Update protocol

Update only the current milestone/status, exact blocker, single next action, and exit gate when implementation evidence changes it. Do not turn this file into a component inventory or implementation log.
