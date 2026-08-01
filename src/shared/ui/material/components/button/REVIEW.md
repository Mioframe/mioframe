# Button review

Artifact revision: 2026-08-01T12:37:48.586Z
DESIGN.md contract revision: 2026-08-01T09:54:01.860Z
ARCHITECTURE.md revision: 2026-08-01T11:51:42.309Z
IMPLEMENTATION.md revision: 2026-08-01T12:02:58.888Z
MIGRATION.md revision: 2026-08-01T12:15:27.037Z
Verdict: blocked
Required return family: none
Required return stage: none
Completion status: blocked
Final workflow verification readiness: blocked
Operator visual status: no-reported-defect
Blockers: `pnpm verify` exited 1 because the unrelated shared-reorder Storybook behavior test `tests/e2e/storybook/reorderDocumentViewportFallback.spec.ts:231:3` timed out in both its initial run and retry; 36 tests and the Button smoke passed, and no Button or Loading Indicator stage owns this command failure.
Major issues: none
Minor issues: none
Accepted risks: none

## Goal and scenarios reviewed

This fresh full independent review re-evaluated the complete current `button` family after dependency-review propagation. It covered filled, outlined, and text actions; extra-small and small round geometry; native button and submit behavior; required labels and optional leading icons; disabled and presentation-only loading precedence; 48 dp targets; keyboard, pointer, focus, form, and ref behavior; the strict renderer-host boundary; the seven contextual text-Button tokens; Snackbar inverse-surface composition; Navigation Path geometry and horizontal overflow; overlay and menu targets; consumer-owned pending and re-entry guards; Loading Indicator composition; renderer-owned state, motion, and accessibility; legacy removal; and stage-scoped proof.

Elevated, tonal, medium through extra-large, square, toggle, trailing-icon, link, form-data, Button-group, Icon Button, and FAB surfaces remain intentionally outside current demand. The simplest viable implementation remains the thin single-host adapter plus public `MDLoadingIndicator` composition. No generic adapter, compatibility layer, wrapper-owned interaction system, or padding API is required.

No positive operator acknowledgement was assumed or required. No concrete operator-reported visual or motion defect was found.

## Official design compliance

`DESIGN.md` contract revision `2026-08-01T09:54:01.860Z` is current, complete, and source-backed. It records Button identity, anatomy, configurations, geometry, states, usage, accessibility, the complete official token catalogue, source conflicts, and related contracts. The selected action-Button subset and explicit deferrals are supported by that contract. No missing or incorrect official fact was identified.

## Architecture compliance

`ARCHITECTURE.md` revision `2026-08-01T11:51:42.309Z` references the current design contract, installed `@m3e/web@2.6.3`, and current compliant Loading Indicator review revision `2026-08-01T11:50:04.390Z`. That dependency review has route `none/none`, completion `complete`, and final-verification readiness `ready`; the Button dependency queue is therefore empty.

The architecture resolves the minimum demand, one-host renderer boundary, public Vue API, exact host-attribute allow-list, state precedence, loading composition, seven contextual tokens, private mappings, consumer ownership, implementation passes, proof owners, migration inventory, risks, and forbidden approaches without leaving a coding decision open. Loading remains presentation/accessibility composition only; m3e owns transient interaction, Loading Indicator owns standalone indicator behavior, Button owns composition, and consumers own operation state, disabled and re-entry guards, surrounding layout, and contextual token values.

Both prior ownership findings remain cleared. Final workflow verification is exclusively assigned to the outer `material-component` orchestrator after current independent review. Navigation Path's former undefined `--md-button-horizontal-padding: 8px` is correctly classified as inert obsolete consumer ownership, with removal assigned to migration and canonical small Button geometry plus owner-container overflow selected as proof. The architecture forbids a replacement compatibility token, private renderer input, descendant override, or new prop.

## Implementation compliance

`IMPLEMENTATION.md` revision `2026-08-01T12:02:58.888Z` references the current architecture and dependency review and records no deviation. Direct inspection confirms one semantic `m3e-button` host, package-derived renderer typing, explicit Boolean/property mappings, selected variants and sizes, native type behavior, required label, optional leading icon, decorative public `MDLoadingIndicator` composition, `aria-busy` independent from disabled state, exact live host-attribute filtering, and owner-local mapping of exactly seven public contextual tokens.

Component and browser proof cover defaults and reactive mappings, native form behavior, click propagation, disabled suppression, loading replacement and restoration, decorative child semantics, target and visible geometry, focus and input behavior, renderer-surface rejection, native host refs, rendered label and indicator ownership, contextual Snackbar states, and renderer-owned interaction without private DOM access. Implementation correctly left Navigation Path cleanup to migration and did not run the outer final gate. No component-code, token, export, renderer-boundary, dependency-composition, or component-owned proof defect was found.

## Migration and legacy removal

`MIGRATION.md` revision `2026-08-01T12:15:27.037Z` references the current implementation and records a complete audit of all 22 application, shared-UI, and existing development consumers outside the canonical family. Current source inspection confirms those consumers use the root `@shared/ui/material` entry point and only selected props, slots, emits, refs, classes, or approved contextual tokens. Product pending, disabled, re-entry, status, result, and failure-path ownership remains outside Button; overlays and menus retain host-ref positioning; Snackbar retains exactly seven inverse-primary overrides.

The former Navigation Path padding finding is durably resolved. `MDNavigationPathSegmentButton.vue` no longer declares `--md-button-horizontal-padding`; it uses the canonical default small text Button without replacement surface. Navigation Path retains its own flex layout, 4 px gap, non-wrapping labels, and horizontal-scroll container. Its focused Storybook proof compares rendered segment geometry with an explicit canonical small Button, proves overflow and actual scrolling, and activates the final long-path segment.

Repository-wide inspection found no raw renderer Button import/tag/token outside Material, deep family import, duplicate wrapper, provisional contextual token name, contextual Button icon token, compatibility alias, or remaining undefined padding declaration. No consumer, scenario, or legacy-removal gap remains.

## Proof and stage verification

The proof matrix matches the architecture's primary owners. Implementation records passing focused component-contract, type-check, Storybook behavior, and the 219-reference visual lane without baseline updates. Migration records passing focused format, representative consumer and impact-registry unit tests, Navigation Path browser behavior, Snackbar rendered-color behavior, and the 219-reference visual lane without baseline updates.

Inspected browser proof establishes public small-size mapping, canonical Navigation Path geometry, non-wrapping overflow, positive scroll movement, final-segment activation, selected Button API behavior, strict renderer boundaries, contextual rendered anatomy, loading composition, and consumer-owned activation guards. The current Loading Indicator review supplies standalone semantics, geometry, exact-version workaround, motion, and visual ownership without duplicating that proof in Button.

No expected/actual/diff artifact required inspection because recorded focused visual runs passed without baseline updates. No concrete operator-reported defect exists.

The outer orchestrator ran the exact final command `pnpm verify`; it exited 1 in the Storybook behavior lane. Agent-environment, format, oxlint, eslint, type-check, unit-tests, and all 110 application E2E tests passed. ESLint emitted one non-failing warning at `scripts/agentEnvironment.mjs:394:8`: `Missing JSDoc comment  jsdoc/require-jsdoc`. The Storybook lane passed 36 tests, including the Button smoke, but `tests/e2e/storybook/reorderDocumentViewportFallback.spec.ts:231:3` timed out after 90 seconds in both the initial run and retry while `observeReleaseScrollTops` awaited `page.evaluate`. The Playwright container exited 1, so visual and mutation lanes were skipped. Full evidence is in `.verify/logs/storybook-behavior.log`.

## Blockers

`pnpm verify` exited 1 because the shared-reorder document-viewport autoscroll fallback timed out in both attempts. The failed test and its `src/shared/lib/reorder/ReorderDocumentViewportStoryHarness.vue` fixture are outside the Button and Loading Indicator families; their design, architecture, implementation, and migration stages cannot correct or validate this failure. This invocation is therefore terminally blocked with route `none/none` pending the verifier-prescribed focused Storybook-behavior retry and then the original read-only command.

## Major issues

None. The prior final-verification ownership and Navigation Path padding findings remain corrected through the current architecture, implementation, and migration chain.

## Minor issues

None.

## Accepted risks

None. Renderer-owned motion and internal accessibility, exact-version dependency workarounds, strict-boundary consumer sensitivity, loading-duration applicability, contextual contrast ownership, and the renderer's Web Expressive status are explicit constraints with assigned owners and proof, not unresolved review limitations.

## Items not required

- No production edit, upstream artifact rewrite, baseline update, padding token or prop, compatibility alias, generic adapter, private renderer access, or descendant override belongs in this review.
- No expansion to deferred Button variants, sizes, shapes, toggle behavior, links, form-data surface, Button groups, Icon Buttons, or FABs is required.
- No positive operator visual acknowledgement is required in the absence of a reported defect.
- No Git, pull-request, commit, branch, or diff interpretation belongs to this review worker.
- No Button or Loading Indicator stage may fix the unrelated shared-reorder timeout or the unrelated non-failing ESLint warning.

## Routing evidence

The current revision chain remains exact: design contract `2026-08-01T09:54:01.860Z`, architecture `2026-08-01T11:51:42.309Z` recording Loading Indicator review `2026-08-01T11:50:04.390Z`, implementation `2026-08-01T12:02:58.888Z`, and migration `2026-08-01T12:15:27.037Z`. The final `pnpm verify` failure is not a Button-family or Loading-Indicator-family contract failure: the selected Button smoke passed, while the sole failing test owns shared reorder document-viewport autoscroll behavior and failed on both attempts. The verifier printed `pnpm verify --base origin/develop --profile local --only storybook-behavior` as the focused action, followed by the original read-only scope; it separately directed a focused ESLint correction for the warning. Because no Material family stage owns either unrelated item, the final-verifier route is terminal `none/none`, completion remains blocked, and visual and mutation evidence remain unavailable for this final command.
