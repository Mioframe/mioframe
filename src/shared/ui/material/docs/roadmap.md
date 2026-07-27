# Mioframe Material migration roadmap

This file owns only the current sequence, milestone state, blocker, and next action. Durable rules live in `architecture.md`, `component-adapter.md`, `component-tokens.md`, `token-api.md`, and `m3e-defects.md`.

## Current state

Last updated: 2026-07-27

Current milestone: `M0/M1 — token ownership and MDButton pilot correction`

Status: `correction`

Owner: current architecture-reset branch

Blockers:

1. Material reference, system, theme, private, application, and component declarations are still mixed in `src/shared/lib/md/tokens.css`, outside the canonical Material owner. The public token catalogue is not populated from the retained runtime surface.
2. `@m3e/web` is resolved to `2.6.3`, but operator verification still finds no visible Button ripple with `--md-sys-state-pressed-state-layer-opacity: 0.1`; changing the same value to `10%` restores the effect. The selected state-opacity consumers and their CSS grammars have not yet been fully audited.
3. `M3E-003` was advanced from upstream source comparison without proof from the installed artifact and observable runtime result. Its final inclusion and ownership classification remain under revalidation.

Next action: perform one controlled correction in two passes. First migrate token ownership without intentional visual changes: create Material foundation/theme owners, move selected component tokens to families, move `--app-*` outside Material, co-locate private bridges, populate `token-api.md`, switch the global import, and remove the legacy file. Then audit state-opacity consumers, choose the compatible foundation representation or narrowest owner-local mapping, correct `M3E-003`, prove visible hover/focus/pointer/Space feedback, revalidate `M3E-001` and `M3E-002` against installed m3e `2.6.3`, run final `pnpm verify`, and obtain operator acceptance.

Implementation ownership: `migrating`.

## Milestones

| ID  | Milestone                                          | Status       | Depends on | Exit gate                                                                                                                                                                                                                |
| --- | -------------------------------------------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M0  | m3e-backed architecture reset and token foundation | `correction` | none       | Material-first component boundary; private m3e boundary; canonical foundation/theme and family token owners; complete public token catalogue; legacy mixed-owner token file removed; defect registry; final verification |
| M1a | `MDLoadingIndicator` dependency adapter            | `correction` | M0         | accepted matrix and public Vue/token API; exact renderer typing; corrected geometry; `M3E-001`/`M3E-002` revalidated against consumed m3e; tests and operator review                                                     |
| M1  | `MDButton` adapter pilot                           | `correction` | M1a        | accepted Button matrix; visible hover/focus/pressed/ripple feedback; correct state-opacity ownership; Loading indicator composition; migrated consumers; verification and operator acceptance                            |
| M2  | `MDSwitch` stateful adapter pilot                  | `planned`    | M1         | source-backed matrix; selected Vue/token API; controlled state and event order; m3e gap ownership; verification and operator acceptance                                                                                  |
| M3  | sequential component migration                     | `planned`    | M2         | one component at a time; dependencies first; demand-driven Vue/token APIs; explicit m3e mapping and gap ownership; no renderer or token-owner leakage                                                                    |

## M0 — token foundation correction

Accepted architecture:

```text
material/foundation/tokens.css
  → supported reference/system foundations

material/foundation/theme.css
  → default palette and light/dark color roles

material/components/<family>/tokens.css
  → selected official component tokens
  → private family m3e mappings

material/docs/token-api.md
  → complete supported consumer catalogue
```

Required correction:

- inventory every retained declaration and import from `src/shared/lib/md/tokens.css`;
- move Material foundation and theme declarations to the canonical library owner;
- move selected component tokens to their families;
- move `--app-*` outside Material;
- co-locate retained `--md-private-*` bridges with their actual owner;
- preserve behavior during the ownership pass;
- update the single global import;
- populate `token-api.md` with every retained supported public token;
- remove the legacy file without a compatibility alias or duplicate owner.

Do not copy the complete Material component-token catalogue or m3e defaults.

## M1a — MDLoadingIndicator prerequisite

Confirmed architecture and completed work:

- canonical `MDLoadingIndicator` component and root export exist;
- `MDButton` composes it through its public Vue API rather than raw m3e;
- package-derived renderer typing, browser accessibility proof, state-combination coverage, visual-runner specs, and committed baselines exist;
- `size` is a constrained numeric overall Material size with default `48` and accepted range `24..240`;
- non-finite input normalizes to `48` with a development warning;
- `M3E-001` and `M3E-002` remain dependency-owned and use controlled workarounds on the last proven version.

Implemented geometry correction:

- public overall size sets host width and height;
- private active-size input receives `overallSize * 38 / 48`;
- m3e internal shape scaling remains renderer-owned;
- browser geometry tests and inspected baselines prove the selected mapping on the previously consumed version.

Required now:

- revalidate `M3E-001` and `M3E-002` against the installed `2.6.3` package artifact and browser result;
- retain, update, or remove each workaround only from new evidence;
- rerun affected Loading indicator contract, browser, and visual proof.

Contained presentation remains deferred.

## M1 — MDButton pilot

The Button adapter architecture remains accepted:

1. `MDButton` imports and renders `MDLoadingIndicator`, not raw `m3e-loading-indicator`;
2. loading takes precedence over normal and selected icon routes and restores the correct route;
3. native click bubbling is preserved;
4. text toggle remains supported;
5. Button hands off the action label as loading purpose for the selected composition;
6. Button uses the accepted overall Loading indicator size mapping `24/24/24/32/40`;
7. Button references dependency defects only through the Loading indicator contract;
8. Button does not own a ripple implementation or component-local public state-opacity token.

Current correction:

- audit installed m3e ripple/state-layer artifacts and all selected state-opacity consumers;
- determine whether one percentage foundation representation preserves all selected current contracts;
- otherwise use the narrowest owner-local renderer mapping;
- correct or remove `M3E-003` according to the registry inclusion boundary;
- prove visible pointer hover, keyboard focus, pointer ripple, and Space-key ripple without private renderer DOM inspection;
- update only affected proof and baselines;
- complete final verification and operator review.

## Later milestones

For every later component:

1. inspect official overview, specs, guidelines, accessibility, and token sources;
2. follow related-component placement and composition references;
3. identify required official dependency adapters;
4. implement or complete dependencies first;
5. select current component and token surface;
6. create each family's Material–m3e–Vue matrix;
7. add supported family tokens to the canonical family owner and `token-api.md`;
8. keep unsupported official tokens `deferred` rather than declaring placeholders;
9. classify m3e absence as `missing` and incorrect behavior as `divergent` with `M3E-*`;
10. use m3e only inside the corresponding canonical adapter;
11. migrate consumers and verify.

Only after M1 and M2 may repeated concrete adapter code be considered for extraction.

## Update protocol

Update only the current milestone/status, exact blocker, single next action, and exit gate when implementation evidence changes. Do not turn this file into a component inventory or implementation log.
