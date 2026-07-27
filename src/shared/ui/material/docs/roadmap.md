# Mioframe Material migration roadmap

This file owns only the current sequence, milestone state, blocker, and next action. Durable rules live in `architecture.md` and `component-adapter.md`.

## Current state

Last updated: 2026-07-27

Current milestone: `M1 — MDButton adapter pilot`

Status: `verification`

Owner: current architecture-reset branch

Blocker: none. `MDLoadingIndicator` is the canonical dependency adapter (`components/loading-indicator/MDLoadingIndicator.vue`), now exposing a constrained numeric `size` (dp mapped to px, default `48`, clamped to `24..240`, with non-finite input — `NaN`/`Infinity`/`-Infinity` — normalized to `48`) instead of an arbitrary CSS-length string, root-exported from `src/shared/ui/material/index.ts`, and typed against the package-derived `M3eLoadingIndicatorElement` instead of a generic `HTMLElement`. Both the finite-range clamp and the non-finite fallback emit a development-mode warning and never forward an invalid value to the renderer. `MDButton` composes it through this corrected public API and now gives `loading` precedence over **both** the normal icon route and the selected-icon route — the `selected-icon` slot is not rendered at all while loading (not merely hidden), so the toggle + selected + `selected-icon` + loading combination correctly shows the Loading indicator instead of the selected icon, and restores the correct icon once loading ends. The Button-to-Loading-indicator size composition is an explicit Mioframe mapping (`24/24/24/32/40`), distinguished from the official Button icon-size tokens. Real-browser accessibility proof now exists for both the standalone indicator (`tests/e2e/storybook/md-loading-indicator.spec.ts`) and the Button composition, including disabled-plus-loading and the full toggle/selected/selected-icon/loading combination (`tests/e2e/storybook/md-button-family.spec.ts`). Executable standalone visual-regression proof for the Loading indicator now exists at `tests/e2e/visual/shared-ui/md-loading-indicator.spec.ts` (Playwright `toHaveScreenshot`), with committed and visually inspected baselines covering the `24`/`32`/`40`/default-`48` size matrix and inherited color, independently of any Button screenshot; the Storybook stories it captures remain presentation fixtures, not proof by themselves. The confirmed m3e 2.6.2 size-variable-naming divergence and the unresolved reduced-motion source gap remain recorded in `components/loading-indicator/README.md`.

Next action: run final `pnpm verify` and obtain operator visual/motion acceptance for both `MDButton` and `MDLoadingIndicator` (renderer-owned shape-morph animation; no reduced-motion path found in m3e 2.6.2). No further production-code corrections are currently known for M1/M1a; verification and operator review are the remaining gates.

Implementation ownership: `migrating`, pending final verification and operator sign-off.

## Milestones

| ID  | Milestone                               | Status         | Depends on | Exit gate                                                                                                                                                                                                                                                                                                                 |
| --- | --------------------------------------- | -------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | m3e-backed architecture reset           | `verification` | none       | Material-first public boundary; private m3e renderer boundary; evidence-gated contract-matrix workflow; canonical adapters for official Material dependencies; package-derived typing; final verification                                                                                                                 |
| M1a | `MDLoadingIndicator` dependency adapter | `verification` | M0         | accepted Loading indicator Material–m3e–Vue matrix; demand-scoped public Vue API; official accessibility and token contract; exact renderer typing; geometry and divergence ownership; tests, presentation stories, executable visual-regression spec with inspected baselines, and pending visual/motion operator review |
| M1  | `MDButton` adapter pilot                | `verification` | M1a        | accepted Button matrix; text toggle supported; loading composition delegates to `MDLoadingIndicator`; no raw dependency m3e usage; normalized Vue API; migrated consumers; verification and operator acceptance                                                                                                           |
| M2  | `MDSwitch` stateful adapter pilot       | `planned`      | M1         | source-backed Material matrix; selected Material API; controlled state and event order; m3e gap ownership; verification and operator acceptance                                                                                                                                                                           |
| M3  | sequential component migration          | `planned`      | M2         | one official Material component at a time; dependency adapters implemented first; demand-driven Material API; explicit m3e mapping and gap ownership; no renderer leakage                                                                                                                                                 |

## M1a — MDLoadingIndicator prerequisite

Result:

- canonical component path and public export for `MDLoadingIndicator` exist, root-exported from `src/shared/ui/material/index.ts` in addition to its local `index.ts`;
- its own README has overview/specs/guidelines/accessibility sources and an accepted Material–m3e–Vue matrix;
- the demand-scoped API covers the current uncontained short-loading scenario and required accessible purpose labeling: `label` (required) and a constrained numeric `size` (dp mapped to px, default `48`, clamped to the official `24..240` range with a development-mode warning on out-of-range input; non-finite input — `NaN`/`Infinity`/`-Infinity` — normalizes to `48` with its own development-mode warning and is never forwarded to the renderer);
- no public `--md-comp-loading-indicator-*` token is exposed yet — current demand is satisfied through the `label`/`size` props and inherited `currentColor`; a public token boundary is deferred until a consumer needs CSS-level customization;
- private exact-version `@m3e/web/loading-indicator` import is inside `MDLoadingIndicator` only; the Vue custom-element glue (`m3eLoadingIndicator.d.ts`) is typed directly against the package-exported `M3eLoadingIndicatorElement`, not a generic `HTMLElement`; no renderer property is currently mapped (`variant` deferred);
- m3e 2.6.2 geometry, the documented-versus-implemented size CSS input mismatch (`--m3e-loading-indicator-active-indicator-size` documented vs. `--m3e-loading-indicator-size` implemented, recorded as an accepted `temporary-renderer-workaround` with a removal trigger), progressbar semantics, and contrast are assessed and recorded; no reduced-motion path was found in the renderer source, and no official Material source was found requiring one for this component;
- colocated contract tests, presentation stories (`24`/`32`/`40`/default `48`, plus inherited color), an executable standalone visual-regression spec with committed and inspected baselines (`tests/e2e/visual/shared-ui/md-loading-indicator.spec.ts`), and standalone real-browser accessibility proof (`tests/e2e/storybook/md-loading-indicator.spec.ts`: browser-resolved `progressbar` role and accessible name) exist; operator visual/motion review is pending.

Contained presentation remains deferred.

## M1 — MDButton pilot

Result:

1. `MDButton` imports and renders `MDLoadingIndicator`, not `m3e-loading-indicator`;
2. `loading` on `MDButton` remains only documented parent composition state;
3. accessible loading purpose (`label`), a Mioframe Button-to-Loading-indicator size mapping (`24/24/24/32/40`, distinct from the official Button icon-size tokens), and inherited color are handed off through the `MDLoadingIndicator` public contract;
4. loading takes precedence over **both** the normal icon route and the selected-icon route: while loading, the `selected-icon` slot is not rendered into the light DOM at all, so the toggle + selected + `selected-icon` + loading combination is supported (verified, not assumed unreachable);
5. normal native click bubbling is preserved (`@click`, no `.stop`);
6. the public selected label slot is renamed to `selected-label` and mapped privately to m3e's `selected` slot;
7. disabled plus loading, the full toggle/selected/`selected-icon`/loading combination, icon restoration to the correct route, the real-browser accessibility tree (nested `progressbar` role/name, not attribute presence alone), Button-size geometry, and parent bubbling are covered by `MDButton.test.ts` and `tests/e2e/storybook/md-button-family.spec.ts`;
8. dependency renderer types, raw tags, private CSS variables, and the Loading indicator ambient declaration are removed from Button ownership;
9. both dependency and parent matrices are updated;
10. focused checks and type-check pass; final `pnpm verify` and operator visual/motion review remain.

No legacy renderer was restored, no raw official dependency element was embedded, no prohibition was inferred from a missing token, no m3e API was copied into Vue, no unused public surface was preserved for completeness, no private shadow DOM was accessed, no parallel renderer was built, and the selected-plus-loading combination was corrected rather than dismissed as unused.

## Later milestones

For every later component:

1. inspect official overview, specs, guidelines, and accessibility;
2. follow related-component placement and composition references;
3. identify required official Material dependency adapters;
4. implement or complete dependencies first using the same full workflow;
5. require positive evidence for restrictions and `not-material` decisions;
6. select the current required subset;
7. create each owning family's Material–m3e–Vue matrix;
8. define public Vue APIs from Material terminology;
9. use m3e only inside the corresponding canonical adapter;
10. migrate consumers and verify.

Only after M1 and M2 may repeated concrete adapter code be considered for extraction.

## Update protocol

Update only the current milestone/status, exact blocker, single next action, and exit gate when implementation evidence changes it. Do not turn this file into a component inventory or implementation log.
