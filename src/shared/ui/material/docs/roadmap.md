# Mioframe Material migration roadmap

This file owns only the current sequence, milestone state, blocker, and next action. Durable rules live in `architecture.md` and `component-adapter.md`.

## Current state

Last updated: 2026-07-27

Current milestone: `M1 — MDButton adapter pilot`

Status: `correction`

Owner: current architecture-reset branch

Blocker: `MDButton` directly imports and renders `m3e-loading-indicator`. Loading indicator is a separate official Material component with its own overview, specs, guidelines, accessibility, tokens, geometry, and motion contract, so it requires a canonical `MDLoadingIndicator` adapter before Button may compose it. The current implementation also still suppresses native bubbling with `@click.stop`, exposes renderer-shaped selected-label slot naming, does not normalize Loading indicator sizing to Button icon geometry, leaves the indicator accessibility-label contract unresolved, uses handwritten ambient typing instead of the exported renderer element type, and does not record the exact m3e reduced-motion and size-token divergences.

Next action: implement `MDLoadingIndicator` first through the full `material-component-adapter` workflow, then correct `MDButton` to compose `MDLoadingIndicator` through its public Vue API. Remove raw `@m3e/web/loading-indicator`, `m3e-loading-indicator`, its ambient renderer declaration, and private `--m3e-loading-indicator-*` mapping from `MDButton`. Resolve normal click bubbling, selected-label naming, loading precedence, accessibility, sizing, disabled/selected combinations, renderer divergences, focused proof, and final verification before operator review.

Implementation ownership remains `migrating`.

The current CI run is green, but it proves only the current implementation. It does not approve the unresolved component ownership and public-contract blockers.

## Milestones

| ID | Milestone | Status | Depends on | Exit gate |
| --- | --- | --- | --- | --- |
| M0 | m3e-backed architecture reset | `verification` | none | Material-first public boundary; private m3e renderer boundary; evidence-gated contract-matrix workflow; canonical adapters for official Material dependencies; package-derived typing; final verification |
| M1a | `MDLoadingIndicator` dependency adapter | `required` | M0 | accepted Loading indicator Material–m3e–Vue matrix; demand-scoped public Vue API; official accessibility and token contract; exact renderer typing; geometry and divergence ownership; stories, tests, visual/motion review |
| M1 | `MDButton` adapter pilot | `correction` | M1a | accepted Button matrix; text toggle supported; loading composition delegates to `MDLoadingIndicator`; no raw dependency m3e usage; normalized Vue API; migrated consumers; verification and operator acceptance |
| M2 | `MDSwitch` stateful adapter pilot | `planned` | M1 | source-backed Material matrix; selected Material API; controlled state and event order; m3e gap ownership; verification and operator acceptance |
| M3 | sequential component migration | `planned` | M2 | one official Material component at a time; dependency adapters implemented first; demand-driven Material API; explicit m3e mapping and gap ownership; no renderer leakage |

## M1a — MDLoadingIndicator prerequisite

Required result:

- canonical component path and public export for `MDLoadingIndicator`;
- its own README with overview/specs/guidelines/accessibility sources and Material–m3e–Vue matrix;
- a demand-scoped API covering the current uncontained short-loading scenario and required accessible purpose labeling;
- selected official `--md-comp-loading-indicator-*` token boundary needed by current consumers and Button composition;
- private exact-version `@m3e/web/loading-indicator` import, package-derived element typing, and typed public mappings inside `MDLoadingIndicator` only;
- explicit assessment of m3e 2.6.2 geometry, documented-versus-implemented size CSS input mismatch, progressbar semantics, contrast, animation, and missing or present reduced-motion behavior;
- colocated contract tests, browser accessibility behavior, stories, visual baseline, and operator motion review.

Do not implement the complete Loading indicator catalog. Contained presentation and standalone scenarios may remain deferred unless required for a coherent selected API.

## M1 — MDButton pilot

Reusable evidence:

- the m3e-backed Button owner and public export exist;
- text toggle is enabled;
- unused link/form surface is removed;
- current loading consumers have been identified;
- the separate non-Material `LoadingButton` is removed;
- current tests and visual stories provide reusable fixtures.

Required correction after M1a:

1. import and render `MDLoadingIndicator`, not `m3e-loading-indicator`;
2. keep `loading` on `MDButton` only as documented parent composition state;
3. hand off accessible loading purpose, size, inherited color/public token, and placement through the `MDLoadingIndicator` public contract;
4. define loading precedence over both normal and selected icon routes;
5. preserve normal native click bubbling;
6. rename the public selected label slot to explicit Material/Vue terminology and map it privately to m3e;
7. cover disabled plus loading, selected plus loading, icon restoration, accessibility tree, Button-size geometry, and parent bubbling;
8. remove dependency renderer types, raw tags, private CSS variables, and ambient declarations from Button ownership;
9. update both dependency and parent matrices accurately;
10. run focused checks, final `pnpm verify`, then operator visual/motion review.

M1 must not restore the legacy renderer, embed raw official dependency elements, infer prohibitions from missing tokens, copy m3e APIs into Vue, preserve unused public surface for completeness, access private shadow DOM, or build parallel renderers.

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
