# Mioframe Material migration roadmap

This file owns only the current sequence, milestone state, blocker, and next action. Durable rules live in `architecture.md`, `component-adapter.md`, `component-tokens.md`, `token-api.md`, and `m3e-defects.md`.

## Current state

Last updated: 2026-07-27

Current milestone: `M0/M1 — token ownership and MDButton pilot correction`

Status: `verification`

Owner: current architecture-reset branch

Blocker: token-ownership migration is still open. Material reference, system, theme, private, application, and component declarations remain mixed in `src/shared/lib/md/tokens.css`, outside the canonical Material owner, and the public token catalogue (`token-api.md`) is not yet populated from the retained runtime surface or the legacy file removed.

The previously blocking Button ripple/state-opacity issue is resolved. `@m3e/web` is resolved to `2.6.3`. Installed-artifact inspection (`node_modules/@m3e/web/dist/core.js`) found the actual cause of the previously observed missing hover/focus/pressed presentation: Mioframe's four canonical `--md-sys-state-*-state-layer-opacity` tokens (`src/shared/lib/md/tokens.css`) were unitless numbers (`0.08`/`0.1`/`0.1`/`0.16`), which is invalid in the color-weight position of `color-mix()` — the CSS function m3e's `M3eStateLayerElement` uses for hover/focus. The previously recorded `M3E-003` ripple defect did not reproduce against the installed `2.6.3` artifact (its ripple applies opacity/color as independent declarations, which already accept unitless numbers) and was removed as a pre-merge misclassification (`../../docs/m3e-defects.md#removed-records`).

Next action: complete the token-ownership migration in `src/shared/lib/md/tokens.css` — create Material foundation/theme owners, move selected component tokens to families, move `--app-*` outside Material, co-locate private bridges, populate `token-api.md`, switch the global import, and remove the legacy file — while preserving the already-validated percentage representation (`8%`/`10%`/`10%`/`16%`) for the four canonical state-opacity tokens. `M3E-001`/`M3E-002` were revalidated against the installed `2.6.3` artifact and retained unchanged; new real-browser interaction proof for pointer hover, keyboard focus, pointer-press ripple, and Space-key ripple was added (`tests/e2e/visual/shared-ui/md-button.spec.ts`, story `RealInteractionFeedback`) and its baselines were regenerated and inspected. Remaining: the physical token-ownership migration, a final `pnpm verify` after that migration, and operator visual/motion acceptance of the new interaction-feedback baselines and the `2.6.3` ripple/state-layer presentation.

Implementation ownership: `migrating`.

## Milestones

| ID  | Milestone                                          | Status         | Depends on | Exit gate                                                                                                                                                                                                                                                                              |
| --- | -------------------------------------------------- | -------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | m3e-backed architecture reset and token foundation | `correction`   | none       | Material-first component boundary; private m3e boundary; canonical foundation/theme and family token owners; complete public token catalogue; legacy mixed-owner token file removed; defect registry; final verification                                                               |
| M1a | `MDLoadingIndicator` dependency adapter            | `verification` | M0         | accepted Loading indicator Material–m3e–Vue matrix; demand-scoped public Vue API; official accessibility and token contract; exact renderer typing; corrected geometry; `M3E-001`/`M3E-002` revalidated against consumed m3e; tests and operator review                                |
| M1  | `MDButton` adapter pilot                           | `verification` | M1a        | accepted Button matrix; visible hover/focus/pressed feedback restored through the corrected Material state-opacity foundation token representation; text toggle supported; Loading indicator composition delegated correctly; migrated consumers; verification and operator acceptance |
| M2  | `MDSwitch` stateful adapter pilot                  | `planned`      | M1         | source-backed Material matrix; selected Material API; controlled state and event order; m3e gap ownership; confirmed-defect registry integration; verification and operator acceptance                                                                                                 |
| M3  | sequential component migration                     | `planned`      | M2         | one official Material component at a time; dependency adapters implemented first; demand-driven Material API; explicit m3e mapping and gap ownership; confirmed defects tracked centrally; no renderer leakage                                                                         |

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
- preserve behavior during the ownership pass, including the already-validated percentage representation (`8%`/`10%`/`10%`/`16%`) for the four canonical state-opacity tokens;
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

Completed after the m3e `2.6.3` upgrade:

- `M3E-001` and `M3E-002` were revalidated against the installed `2.6.3` artifact and retained unchanged, with a new revalidation-history row in `../../docs/m3e-defects.md`;
- Loading indicator contract, browser, and visual proof remain valid — no active-indicator geometry regression was found in `2.6.3`.

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
8. the canonical Material state-opacity foundation tokens (`src/shared/lib/md/tokens.css`) own the percentage representation Button's renderer-owned hover/focus/pressed feedback depends on; Button does not own a local opacity conversion or ripple implementation.

Completed in this correction:

- normalized the four canonical `--md-sys-state-*-state-layer-opacity` tokens to percentages rather than creating a wrapper ripple or a Button-local conversion;
- proved that pointer hover, keyboard focus, pointer press, and Space activation each produce visible renderer-owned feedback (`tests/e2e/visual/shared-ui/md-button.spec.ts`);
- inspected the resulting Button visual baselines (four new, zero regressed);
- updated affected proof and documentation;
- ran the final `pnpm verify --base origin/develop` completion gate: passed.

Remaining: the physical token-ownership migration (`M0`), and operator visual/motion review of the new interaction-feedback baselines and the `2.6.3` ripple/state-layer presentation.

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
