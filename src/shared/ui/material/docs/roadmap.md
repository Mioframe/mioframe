# Mioframe Material migration roadmap

This file owns only the current sequence, milestone state, blocker, and next action. Durable rules live in `architecture.md` and `component-adapter.md`.

## Current state

Last updated: 2026-07-27

Current milestone: `M1 — MDButton adapter pilot`

Status: `verification`

Owner: current architecture-reset branch

Blocker: none. `MDLoadingIndicator` is implemented as the canonical dependency adapter (`components/loading-indicator/MDLoadingIndicator.vue`) and `MDButton` now composes it through its public Vue API (`label`, `size`) instead of rendering raw `m3e-loading-indicator`. Native click bubbling is restored (`@click`, no `.stop`), the selected-label slot is renamed to `selected-label`, Loading indicator sizing is normalized to the official Button icon-size tokens, the accessibility-label handoff is resolved (Button `label` → indicator `aria-label`), package-derived ambient typing is used for both adapters, and the confirmed m3e 2.6.2 size-variable-naming divergence plus the unresolved reduced-motion source gap are recorded in `components/loading-indicator/README.md`.

Next action: run final `pnpm verify` and obtain operator visual/motion acceptance for both `MDButton` and `MDLoadingIndicator` (renderer-owned shape-morph animation; no reduced-motion path found in m3e 2.6.2). No further implementation work is required for M1 unless verification or operator review surfaces a regression.

Implementation ownership: `migrated`, pending final verification and operator sign-off.

## Milestones

| ID  | Milestone                               | Status         | Depends on | Exit gate                                                                                                                                                                                                                   |
| --- | --------------------------------------- | -------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | m3e-backed architecture reset           | `verification` | none       | Material-first public boundary; private m3e renderer boundary; evidence-gated contract-matrix workflow; canonical adapters for official Material dependencies; package-derived typing; final verification                   |
| M1a | `MDLoadingIndicator` dependency adapter | `verification` | M0         | accepted Loading indicator Material–m3e–Vue matrix; demand-scoped public Vue API; official accessibility and token contract; exact renderer typing; geometry and divergence ownership; stories, tests, visual/motion review |
| M1  | `MDButton` adapter pilot                | `verification` | M1a        | accepted Button matrix; text toggle supported; loading composition delegates to `MDLoadingIndicator`; no raw dependency m3e usage; normalized Vue API; migrated consumers; verification and operator acceptance             |
| M2  | `MDSwitch` stateful adapter pilot       | `planned`      | M1         | source-backed Material matrix; selected Material API; controlled state and event order; m3e gap ownership; verification and operator acceptance                                                                             |
| M3  | sequential component migration          | `planned`      | M2         | one official Material component at a time; dependency adapters implemented first; demand-driven Material API; explicit m3e mapping and gap ownership; no renderer leakage                                                   |

## M1a — MDLoadingIndicator prerequisite

Result:

- canonical component path and public export for `MDLoadingIndicator` exist;
- its own README has overview/specs/guidelines/accessibility sources and an accepted Material–m3e–Vue matrix;
- the demand-scoped API covers the current uncontained short-loading scenario and required accessible purpose labeling (`label`, `size`);
- no public `--md-comp-loading-indicator-*` token is exposed yet — current demand is satisfied through the `label`/`size` props and inherited `currentColor`; a public token boundary is deferred until a consumer needs CSS-level customization;
- private exact-version `@m3e/web/loading-indicator` import and package-derived ambient typing are inside `MDLoadingIndicator` only; no renderer property is currently mapped (`variant` deferred), so `M3eLoadingIndicatorElement` is not yet imported by the ambient declaration;
- m3e 2.6.2 geometry, the documented-versus-implemented size CSS input mismatch (`--m3e-loading-indicator-active-indicator-size` documented vs. `--m3e-loading-indicator-size` implemented), progressbar semantics, and contrast are assessed and recorded; no reduced-motion path was found in the renderer source, and no official Material source was found requiring one for this component;
- colocated contract tests and stories exist; browser accessibility proof is covered via the `MDButton` behavior-contract story/spec (Loading indicator has no standalone consumer yet); operator motion review is pending.

Contained presentation and standalone scenarios remain deferred.

## M1 — MDButton pilot

Result:

1. `MDButton` imports and renders `MDLoadingIndicator`, not `m3e-loading-indicator`;
2. `loading` on `MDButton` remains only documented parent composition state;
3. accessible loading purpose (`label`), size, and inherited color are handed off through the `MDLoadingIndicator` public contract;
4. loading takes precedence over the normal icon route (selected-icon route is unaffected, since selected and loading are not combined by current consumers);
5. normal native click bubbling is preserved (`@click`, no `.stop`);
6. the public selected label slot is renamed to `selected-label` and mapped privately to m3e's `selected` slot;
7. disabled plus loading, selected plus loading, icon restoration, the accessibility tree, Button-size geometry, and parent bubbling are covered by `MDButton.test.ts` and `tests/e2e/storybook/md-button-family.spec.ts`;
8. dependency renderer types, raw tags, private CSS variables, and the Loading indicator ambient declaration are removed from Button ownership;
9. both dependency and parent matrices are updated;
10. focused checks and type-check pass; final `pnpm verify` and operator visual/motion review remain.

No legacy renderer was restored, no raw official dependency element was embedded, no prohibition was inferred from a missing token, no m3e API was copied into Vue, no unused public surface was preserved for completeness, no private shadow DOM was accessed, and no parallel renderer was built.

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
