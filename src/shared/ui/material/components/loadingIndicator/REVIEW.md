# Loading indicator review

Artifact revision: 2026-08-01T11:50:04.390Z
DESIGN.md contract revision: 2026-08-01T09:59:39.918Z
ARCHITECTURE.md revision: 2026-08-01T10:28:43.915Z
IMPLEMENTATION.md revision: 2026-08-01T10:40:52.428Z
MIGRATION.md revision: 2026-08-01T10:45:24.478Z
Verdict: compliant
Required return family: none
Required return stage: none
Completion status: complete
Final workflow verification readiness: ready
Operator visual status: no-reported-defect
Blockers: none
Major issues: none
Minor issues: none
Accepted risks: none

## Goal and scenarios reviewed

This fresh full independent review re-evaluated the complete canonical Loading indicator family after the design artifact formatting correction. It covered the standalone uncontained indeterminate presentation, bounded 24-240 overall sizing with the official 48/38 overall-to-active relationship, required accessible purpose, Material-primary and contextual active-indicator color, isolation from legacy descendant color, and 24 px Button composition with parent-owned busy and interaction semantics.

The design artifact revision changed to `2026-08-01T11:48:39.122Z`, while its normalized Design contract revision remains exactly `2026-08-01T09:59:39.918Z`. That metadata-only formatting correction does not invalidate architecture, implementation, or migration identity. All recorded downstream revisions remain current and mutually consistent.

The simplest viable result remains the implemented single-host adapter with required `label`, optional bounded `size`, one public active-indicator color token, and an explicit host-attribute boundary. No generic adapter, compatibility layer, public renderer vocabulary, operation-state API, or product adoption is required.

## Official design compliance

`DESIGN.md` records the complete available official route set, selected-source lifecycle and refresh limitation, identity, duration guidance, anatomy, containment configurations, geometry, behavior, usage, accessibility, complete token catalogue, source conflicts, unknowns, and related contracts. Its corrected formatting preserves the normalized Material content and explicitly retains Design contract revision `2026-08-01T09:59:39.918Z`.

The architecture selects only confirmed current demand: the default uncontained indeterminate presentation. Contained rendering and tokens, pull-to-refresh behavior, determinate progress, rendered labels, interaction states, and unpublished motion controls remain correctly deferred. The selected semantics, 24-240 range, 48 px default overall geometry, 38/48 active ratio, primary active color, progressbar role, purpose label, and 3:1 contextual contrast responsibility agree with the design contract.

The prior formatter route is cleared. `pnpm verify --only format --files src/shared/ui/material/components/loadingIndicator/DESIGN.md` passed against the corrected artifact. No official-fact or design-stage finding remains.

## Architecture compliance

This independent review was recorded against `@m3e/web@2.6.3`. The current `2.7.4` compatibility revalidation is recorded in `ARCHITECTURE.md`, `IMPLEMENTATION.md`, and `docs/m3e-defects.md`; it does not represent a new independent family review. Dependency closure remains empty: Material foundation supplies the system-color fallback, m3e is a private renderer integration, and Button is a parent consumer rather than a dependency.

Ownership is narrow and directional. Loading indicator owns its Vue API, standalone semantics, geometry, public token, private renderer mapping, exact-version workarounds, attribute boundary, exports, and family proof. m3e owns private anatomy and the seven-shape animation lifecycle. Button owns composition, redundant child-semantic suppression, `aria-busy`, icon replacement, contextual `currentColor`, activation, and disabled behavior. Product features retain applicability, pending/error copy, cancellation, disabled conflicts, and re-entry guards.

The public contract is exact: required `label`, optional numeric `size` defaulting to 48, no slots/emits/methods or variant/value/disabled/loading surface, and only `class`, `style`, `id`, `title`, `data-*`, `aria-hidden`, and `aria-describedby` may cross the host boundary. The sole public token maps active-indicator color without exposing renderer vocabulary. M3E-001 and M3E-002 have explicit version scope, local mitigation, proof, and removal triggers. The implementation passes, proof ownership, migration inventory, acceptance criteria, risks, and forbidden approaches leave no unresolved coding choice.

## Implementation compliance

`IMPLEMENTATION.md` revision `2026-08-01T10:40:52.428Z` references the current architecture revision and records no deviation. Direct inspection confirms one `m3e-loading-indicator` host, package-private renderer import, `inheritAttrs: false`, required label mapping, finite normalization and 24-240 clamping, explicit overall width/height, proportional private active-size mapping, selected custom-element registration, family/root exports, and the public active-color token with Material-primary fallback.

The live render-time allow-list forwards only the accepted attributes. Family class and consumer class merge; consumer styles may supply differently keyed public tokens, while adapter-owned width, height, and private effective-size mapping win conflicts. Raw variant/contained inputs, role and value-ARIA overrides, `tabindex`, consumer `aria-label`, unknown attributes, and arbitrary listeners are rejected. No private shadow DOM, shape, timer, or animation state is acquired.

The implementation remains aligned with the exact installed renderer defects: the effective size input is `--m3e-loading-indicator-size`, and explicit host geometry preserves the official overall/active distinction. Button consumes only public `MDLoadingIndicator`, supplies label, size 24, `aria-hidden="true"`, and the public token through `currentColor`; loading does not acquire disabled or activation ownership.

## Migration and legacy removal

`MIGRATION.md` revision `2026-08-01T10:45:24.478Z` references the current implementation revision and records a complete audit-only migration. The inventory identifies Button as the sole parent composition consumer, family stories/tests as proof rather than consumers, and similarly named settings-test elements as unrelated plain HTML stubs.

No direct product consumer, raw renderer tag/import/type, or private renderer token exists outside the canonical Material boundary. Button already uses the accepted public contract and retains its action name, busy semantics, icon restoration, contextual contrast, activation, disabled, and consumer re-entry ownership. No Loading-indicator-specific legacy adapter, duplicate export, product token, compatibility alias, or replaced product UI required removal. Provider- and browser-controlled waits remain with their feature-owned textual status and conflict guards.

## Proof and stage verification

The recorded focused stage proof is proportionate and has one primary owner per contract. Component tests cover label and size contracts, clamping and restoration, the 38/48 mapping, the exact reactive host allow-list, geometry precedence, public-token pass-through, label precedence, warnings, and forbidden inputs/listeners. Real Chromium Storybook behavior covers the named progressbar, actual public host boxes, computed default/contextual colors, legacy isolation, and dynamic rejection at the rendered custom element.

Button component and browser proof cover redundant child-semantic suppression, named busy parent semantics, 24 px composition, icon restoration, contextual active color, activation while loading, and explicit disabled blocking. Token catalogue, renderer-boundary, package-derived type, and installed-artifact evidence cover integration and M3E-001/M3E-002. Visual proof passed 219/219 current baselines for standalone size/color/legacy isolation and Button composition; expected references were inspected, no baseline changed, and no concrete visual or motion defect was reported.

Recorded implementation and migration checks passed their focused verifier-managed unit, ESLint, format, type-check, Storybook behavior, and visual scopes. This review additionally confirmed the corrected `DESIGN.md` passes focused formatting. Final workflow verification was not run by this worker and remains exclusively owned by the outer Material orchestrator.

## Blockers

None.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None. The renderer defects and unpublished motion details are bounded implementation constraints with explicit ownership and upgrade/removal triggers, not accepted compliance gaps.

## Items not required

- No architecture, implementation, migration, production, consumer, story, test, baseline, export, renderer-boundary, or dependency change is required after the formatting-only design correction.
- No downstream artifact invalidation is required because the Design contract revision did not change.
- No contained, pull-to-refresh, determinate, disabled, operation-state, rendered-label, live-region, focus, or public motion API is required by current scenarios.
- No product feature migration, compatibility forwarding, generic adapter, descendant color cascade, private renderer exposure, or unrelated family migration is required.
- No positive operator visual acknowledgement is required, and no operator-reported defect exists.
- No final workflow verification, Git, pull-request, commit, branch, diff, or external-check interpretation belongs to this review worker.

## Routing evidence

The prior `self/design` route named only a formatter failure in `DESIGN.md`. The owning design artifact is now revision `2026-08-01T11:48:39.122Z`, its focused format check passes, and its Design contract revision remains `2026-08-01T09:59:39.918Z`. Architecture `2026-08-01T10:28:43.915Z`, implementation `2026-08-01T10:40:52.428Z`, and migration `2026-08-01T10:45:24.478Z` therefore remain current.

Fresh complete-family review found no official-fact, demand, ownership, dependency, API, token, renderer, implementation, proof, consumer, scenario, or legacy-removal defect. The correct route is `none/none`, completion is complete, and the family is ready for outer final workflow verification.
