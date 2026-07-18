# Buttons implementation audit

Reviewed: 2026-07-18
Result: partially-compliant
Canonical source status: snapshot-complete-stale
Official capability inventory: snapshot-complete (material3 cache captured 2026-06-30T05:53:04.916Z; currentness unverified)
Official coverage: unresolved
Project implementation documentation: README.md
Visual review: required

## Evidence

### Project documentation reviewed

- `README.md`.
- `src/shared/ui/material/AGENTS.md`, `docs/material-3/source-of-truth.md`, `docs/material-3/autonomous-review.md`, `docs/material-3/library-roadmap.md`, and the directly applicable foundation, testing, and verification contracts named by those documents.
- Current implementation evidence: `MDButton.vue`, the public family and Material root exports, current repository consumers, `MDButton.test.ts`, `MDButton.stories.ts`, the Button Storybook/e2e suites, the shared state, ripple, focus, motion, typography, elevation, and progress-indicator owners, and current shadow-color consumers and focused tests.
- The previous `AUDIT.md` was inspected, but every conclusion below was independently re-evaluated from current workspace and official evidence. No source-control or remote metadata was used.

### Material 3 Expressive evidence

- Official family: Buttons — common default and toggle buttons.
- Official path: `m3.material.io/components/buttons`.
- All four family tabs were resolved and read from the `material3` MCP cache: `components/buttons/overview.md`, `specs.md`, `guidelines.md`, and `accessibility.md`.
- Structured Button token tables were inspected for the five color sets and five size sets, including state, toggle, geometry, shape-morph, elevation, shadow-color, typography-alias, and motion-spring records.
- Cache source: `https://m3.material.io`; cache captured `2026-06-30T05:53:04.916Z`; family pages captured `2026-06-30T05:48:50.423Z`; no failed or suspicious cached pages were reported.
- The cache is stale relative to its seven-day TTL and reports overall `coverageHealth: partial`. The four Button pages are present and internally consistent, so the known snapshot family inventory is complete, but currentness is unverified.
- Context7 `/websites/m3_material_io` was queried as a current documentation corroboration source. It confirmed the active M3 Expressive system and separate Split Button and Button Group families, but did not provide enough Button-family detail to refresh or supersede the stale official snapshot.
- Official Design Kit evidence was not required to decide the documentation-classification findings in this review. Exact visual fidelity still requires operator comparison.

## Official capability coverage

### Implemented and verified

- Default and controlled toggle Button variants.
- Elevated, filled, tonal, outlined, and text color configurations for their officially supported variant combinations.
- Extra-small, small, medium, large, and extra-large sizes, including official height, icon size, leading/trailing space, icon-label space, outline width, typography route, and minimum target treatment.
- Round and square shapes, pressed shape morph, and selected toggle shape morph for every size.
- Optional single leading icon, concise visible label ownership, bidirectional leading placement through normal inline layout direction, and no invented trailing-icon API.
- Native `<button>` semantics; safe default `type="button"`; native disabled, focus, keyboard, and activation behavior; accessible name matching the visible label; and controlled `aria-pressed` for toggles.
- Hover, focus, pressed, selected, and disabled final-property routes for container, label, icon, outline, elevation, state layer, ripple, and focus indication.
- Public `--md-comp-button-*` override routes reach the final owned properties. Button shadow-color overrides reach the shared elevation bridge and the computed `box-shadow`.
- The documented Web motion adaptation consumes the shared fast-spatial and fast-effects contracts on the properties that actually render them. Focused browser evidence covers the pressed shape route, intermediate transition behavior, endpoint, and interruption/settlement behavior without claiming literal CSS spring-physics consumption.
- Canonical ownership at `src/shared/ui/material/components/buttons`, curated export through `@shared/ui/material`, current direct consumers, and removal of the legacy `MDButton` owner.
- The project loading extension: boolean and normalized numeric progress, preserved accessible name, `aria-busy`, decorative progress indicator, enabled click behavior, disabled color/opacity routing, and the documented indeterminate rendering for values normalized to zero.

### Partial / defective / unverified

none

### Not implemented

none confirmed in the available official snapshot

### Officially unsupported / invalid combinations

- Text-style toggle Button: the official color/token matrix publishes no text selected or unselected route. `MDButton` coherently normalizes this combination to the default action variant and emits a development warning.
- `selected` on the default action variant: selection has no applicable semantic or visual route and is ignored with a development warning.
- Multiple icons or a trailing icon are not part of the resolved common Button anatomy; the public family API exposes one optional leading icon slot.

### Unresolved evidence

- Current canonical completeness. The complete known Button snapshot is stale, and the available current corroboration did not expose the four detailed family pages or a current structured token graph.

### Outside this family boundary

- Split Button — official owner `components/split-button`; not implemented in the canonical Material library.
- Standard and Connected Button Groups — official owner `components/button-groups`; not implemented in the canonical Material library.
- Icon Button and Toggle Icon Button — official owner `components/icon-buttons`; current legacy implementation remains under `src/shared/ui/Button`.
- Segmented Button — official owner `components/segmented-buttons`, deprecated in M3 Expressive in favor of Connected Button Group; current legacy implementation remains under `src/shared/ui/Button`.
- FAB and Extended FAB — separate official FAB families; current legacy implementations remain under `src/shared/ui/Button`.

## Stage 1 — implementation vs project documentation

### Findings

#### 1. The README's cross-family elevation proof inventory is stale

Severity: medium

Project requirement: shared root/system token and universal-selector routes must identify current affected families and current representative proof accurately; unchanged tests that do not exercise a route are not proof.

Implementation evidence: `README.md` says `MDCard`, `MDFab`, `MDExtendedFab`, and `MDSwitch` have no test or story directly exercising a non-default shadow-color override. Current `tests/e2e/visual/shared-ui/md-fab-family.spec.ts` contains focused shadow-color bridge checks for both `MDFab` and `MDExtendedFab`. No equivalent focused override proof was found for `MDCard` or `MDSwitch`.

Implementation-to-project mismatch: the documented residual evidence gap is broader than the current implementation evidence. It incorrectly groups two now-proven FAB routes with the two still-unverified Card and Switch routes.

Required correction: update `README.md` to record the focused `MDFab` and `MDExtendedFab` proof and limit the remaining representative cross-family gap to `MDCard` and `MDSwitch` unless further current proof is added.

### Verified agreement

- The public API, defaults, normalization behavior, controlled toggle model, native semantics, accessibility attributes, leading-icon anatomy, loading extension, exports, and current consumers match `README.md`.
- All five supported color configurations, five sizes, two shapes, pressed and selected morphs, state routes, and public token override contracts documented as implemented exist at their final property owners.
- The Button-specific elevation override route has focused final-computed-property proof.
- The README truthfully records the stale canonical source and outstanding operator visual review.
- The current Storybook description and README now cite the same `material3` snapshot and both record that all four Button pages were inspected.
- The implementation does not pretend that CSS consumes the official spring stiffness/damping values. Its documented Web adaptation and focused browser evidence agree.

## Stage 2 — project documentation vs Material 3 Expressive

### Findings

#### 1. The README misclassifies an unsupported combination as missing capability

Severity: medium

Material 3 Expressive requirement: capability classification must distinguish a real supported capability from an officially unsupported or invalid combination. The Button token graph publishes selected/unselected routes for elevated, filled, tonal, and outlined configurations, but none for text.

Project documentation claim: `README.md` lists “Text-style toggle buttons” under `Not implemented`, while also explaining that the verified token graph contains no supported text-toggle color route.

Project-to-Material mismatch: the same evidence establishes that text toggle is an unsupported combination, not an absent official capability. Listing it under `Not implemented` overstates the official inventory and conflicts with the project's classification rules.

Required correction: move text-style toggle Buttons from `Not implemented` to an explicit `Officially unsupported / invalid combinations` section and retain the documented normalization behavior.

#### 2. Optional rapid-click guidance is inflated into a missing capability

Severity: medium

Material 3 Expressive requirement: `components/buttons/accessibility.md` says that on Web a modified motion curve “can” be used to avoid resonant effects where multiple clicks or taps are anticipated, and the caption qualifies it with “if rapid click or pointer interactions are expected.” This is conditional, non-normative guidance; the available source does not publish a required curve, token, algorithm, cadence threshold, or universal Button behavior.

Project documentation claim: `README.md` classifies a “Rapid-click modified motion curve” as an unimplemented official capability, calls it an open gap, and uses it as the sole reason for `Official coverage: partial`.

Project-to-Material mismatch: the documentation converts optional, context-dependent guidance into a mandatory family capability without an identified current consumer scenario that anticipates rapid repeated activation. Under the repository's inventory rules, optional guidance does not reduce coverage unless it is required for the implemented surface.

Required correction: remove rapid-click motion adaptation from `Not implemented` and from the coverage calculation. Record it, if still useful, as optional guidance or a future product-context choice; only promote it to required work when a concrete supported scenario needs it and the intended curve/behavior is authoritatively resolved.

### Verified agreement

- The official family mapping and separate ownership of Split Button, Button Groups, Icon Buttons, Segmented Buttons, and FAB families are correct.
- The documented default/toggle variants; five color configurations; five sizes; round/square shapes; pressed and selected shape changes; optional leading icon; label guidance; native activation; labeling; contrast; and state meanings agree with the available official pages and structured token graph.
- The implementation's lack of a literal CSS spring-physics route is explicitly documented as a Web adaptation, consistent with the snapshot's `Web: Expressive — Unavailable` status rather than presented as canonical runtime behavior.
- The loading API and its zero-progress behavior are explicitly identified as a project extension rather than Material capability.

## Evidence gaps

- The complete Button family snapshot is stale. Currentness of the four official pages and token graph could not be established, so current official coverage remains unresolved even though every actual capability in the available snapshot is implemented and verified.
- Operator visual acceptance is not durably recorded. Geometry, spacing, shape, color, typography, elevation, state composition, focus indication, and perceived motion quality remain `required` for operator comparison.
- Focused cross-family elevation override proof remains absent for `MDCard` and `MDSwitch`. This is a foundation evidence gap, not a confirmed Button defect.

## Required next work

1. Correct `README.md` classification: move text toggle to officially unsupported/invalid combinations and treat rapid-click curve guidance as optional unless a concrete required scenario is established.
2. Recalculate the README coverage claim without treating unsupported combinations or optional guidance as missing capability; keep canonical currentness explicit.
3. Update the README's shared elevation proof note to acknowledge current `MDFab` and `MDExtendedFab` focused coverage and limit the remaining gap to the families actually lacking proof.
4. Run `material-component-review Button` again after those authoring corrections.
5. Complete and durably record operator visual acceptance using the prepared canonical Button evidence.
