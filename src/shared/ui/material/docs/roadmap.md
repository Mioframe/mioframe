# Mioframe Material migration roadmap

This file owns only the current sequence, milestone state, blocker, and next action. Durable rules live in `architecture.md`, `component-adapter.md`, and `m3e-defects.md`.

## Current state

Last updated: 2026-07-27

Current milestone: `M1 — MDButton adapter pilot`

Status: `correction`

Owner: current architecture-reset branch

Blocker: operator review confirmed that the selected Button pressed-feedback contract is incomplete on the lockfile-resolved `@m3e/web` `2.6.2`: Button activation and host pressed state work, but the visible ripple is absent. `M3E-003` records the exact cause: m3e `2.6.2` inserts the unitless Material system opacity value `0.1` into a `color-mix()` percentage position, making the ripple background invalid. The m3e showcase works with its `10%` fallback. m3e `2.6.3` fixes the representation by applying color and opacity separately, so Mioframe must consume the fixed version rather than implement a second ripple or rewrite the Material system token.

Next action: update the lockfile-resolved `@m3e/web` version to `2.6.3`, revalidate `M3E-001`, `M3E-002`, and `M3E-003` against the consumed package, add observable browser proof for visible pointer and Space-key ripple feedback without inspecting private renderer DOM, inspect Button and Loading indicator visual/motion changes, then run final `pnpm verify` and obtain operator acceptance.

Implementation ownership: `migrating`.

## Milestones

| ID  | Milestone                               | Status         | Depends on | Exit gate                                                                                                                                                                                                                                               |
| --- | --------------------------------------- | -------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | m3e-backed architecture reset           | `verification` | none       | Material-first public boundary; private m3e renderer boundary; evidence-gated contract-matrix workflow; canonical defect registry; canonical adapters for official Material dependencies; package-derived typing; final verification                    |
| M1a | `MDLoadingIndicator` dependency adapter | `correction`   | M0         | accepted Loading indicator Material–m3e–Vue matrix; demand-scoped public Vue API; official accessibility and token contract; exact renderer typing; corrected geometry; `M3E-001`/`M3E-002` revalidated against consumed m3e; tests and operator review |
| M1  | `MDButton` adapter pilot                | `correction`   | M1a        | accepted Button matrix; visible pressed feedback restored through upstream-fixed m3e; text toggle supported; Loading indicator composition delegated correctly; migrated consumers; verification and operator acceptance                                |
| M2  | `MDSwitch` stateful adapter pilot       | `planned`      | M1         | source-backed Material matrix; selected Material API; controlled state and event order; m3e gap ownership; confirmed-defect registry integration; verification and operator acceptance                                                                  |
| M3  | sequential component migration          | `planned`      | M2         | one official Material component at a time; dependency adapters implemented first; demand-driven Material API; explicit m3e mapping and gap ownership; confirmed defects tracked centrally; no renderer leakage                                          |

## M1a — MDLoadingIndicator prerequisite

Confirmed architecture and completed work:

- canonical `MDLoadingIndicator` component and root export exist;
- `MDButton` composes it through its public Vue API rather than raw m3e;
- package-derived renderer typing, browser accessibility proof, state-combination coverage, visual-runner specs, and committed baselines exist;
- `size` is a constrained numeric overall Material size with default `48` and accepted range `24..240`;
- non-finite input normalizes to `48` with a development warning;
- the m3e `2.6.2` documented-versus-effective CSS variable-name mismatch is recorded as controlled defect `M3E-001`;
- the m3e `2.6.2` uncontained-host-width coupling is recorded as controlled defect `M3E-002`;
- both defects remain dependency-owned.

Implemented geometry correction:

- the public overall size sets the host width and height;
- the private m3e active-size input receives `overallSize * 38 / 48`;
- m3e's internal `0.842` shape scale remains renderer-owned and is not inverted or compensated;
- browser geometry tests and regenerated, inspected visual baselines prove the corrected mapping on `2.6.2`.

Required after the m3e upgrade:

- revalidate `M3E-001` and `M3E-002` against `2.6.3`;
- retain, update, or remove each exact-version workaround only from new evidence;
- rerun Loading indicator contract, browser, and visual proof.

Contained presentation remains deferred.

## M1 — MDButton pilot

The Button adapter architecture remains accepted:

1. `MDButton` imports and renders `MDLoadingIndicator`, not raw `m3e-loading-indicator`;
2. loading takes precedence over normal and selected icon routes and restores the correct route;
3. normal native click bubbling is preserved;
4. text toggle remains supported;
5. Button hands off the action label as the loading-purpose label because the indicator represents progress of that same named action;
6. Button uses the accepted overall Loading indicator size mapping `24/24/24/32/40` and does not access dependency-private m3e inputs;
7. Button references dependency defects only through the Loading indicator contract;
8. `M3E-003` owns the confirmed missing-ripple defect and is `fixed` upstream / `awaiting-upgrade` in Mioframe.

Current correction:

- consume `@m3e/web` `2.6.3` rather than creating a wrapper ripple or changing the Material opacity token;
- prove that pointer press and Space activation produce visible feedback;
- inspect the `2.6.3` ripple presentation and the Button pressed-duration change;
- update only affected proof and documentation;
- complete final verification and operator review.

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
