# Buttons implementation audit

Reviewed: 2026-07-18
Result: partially-compliant
Canonical source status: snapshot-complete-stale
Official capability inventory: snapshot-complete (material3 cache captured 2026-06-30T05:53:04.916Z; currentness unverified)
Official coverage: unresolved
Project implementation documentation: README.md
Visual review: awaiting re-review

## Evidence

### Project documentation reviewed

- `README.md`, including its official family mapping, capability inventory, API, token/property ownership, extension and deviation notes, consumer migration statement, verification statement, and operator-feedback record.
- `docs/material-3/source-of-truth.md`, `docs/material-3/autonomous-review.md`, `docs/material-3/component-tokens.md`, `docs/material-3/accessibility.md`, `docs/material-3/library-architecture.md`, and `docs/material-3/library-roadmap.md` where directly applicable.
- The root repository instructions and the `material-component-review` workflow.

### Material 3 Expressive evidence

- `https://m3.material.io/components/buttons/overview`
- `https://m3.material.io/components/buttons/specs`
- `https://m3.material.io/components/buttons/guidelines`
- `https://m3.material.io/components/buttons/accessibility`
- The structured Button component-token graph and family resource graph exposed by the `material3` MCP cache.
- Cache capture: `2026-06-30T05:53:04.916Z`; family pages captured at `2026-06-30T05:48:50.423Z`.
- All four family pages and the structured token tables were available and inspected, but the cache is stale and reports partial repository-wide route coverage. This evidence is snapshot-complete for Buttons, not current-complete.

### Operator feedback considered

- README status: `awaiting re-review`.
- Latest feedback: the prior press/release shape animation was visibly incorrect and a technically connected CSS transition did not resolve the perceived Material 3 Expressive motion mismatch.
- Implementation response: shape geometry now follows raw press state and starts reversing immediately on release while state-layer minimum-duration feedback remains independent. No explicit operator acceptance or new rejection was provided in the current task, so `awaiting re-review` is preserved.

## Official capability coverage

### Implemented and verified

- One common Button component with native `<button>` semantics and a safe default `type="button"`.
- Default action and controlled toggle variants, with `aria-pressed` limited to the supported toggle route.
- Elevated, filled, tonal, outlined, and text color styles.
- Extra-small, small, medium, large, and extra-large sizes with their documented container heights, icon sizes, inline spacing, icon-label gaps, outline widths, typography routes, and size-dependent square corners.
- Round and square shapes, selected shape morphs for supported toggle styles, and pressed shape precedence.
- Optional leading icon and a single-line visible label whose accessible name matches the label.
- Disabled, hover, focus-visible, pressed, selected, and loading output; disabled controls suppress interactive state visuals.
- Component-token routing to the final owners of container color, label color/opacity, icon color/opacity, outline color, elevation, state-layer color/opacity, size geometry, and shape.
- State layer, ripple, focus indicator, and shared elevation consumption through generic foundation contracts rather than component-specific coupling in the shared primitives.
- Extra-small and small 48dp minimum pointer targets, with a real-pointer browser check proving the expanded target activates the native button.
- Real keyboard focus proof and final focus-indicator geometry for the Button host.
- Focused browser/visual proof for the Button token routes, size geometry, typography, states, public overrides, loading rendering, shadow recomputation, raw press acquisition, immediate release, and motion endpoint.
- Public export through `@shared/ui/material` and current direct consumers using that owner.
- Explicit Mioframe `loading` extension with documented boolean/numeric normalization, `aria-busy`, preserved accessible name, and decorative progress indicator.

### Partial / defective / unverified

- Corrected pressed-shape motion is technically exercised by real pointer input, immediate-release polling, and endpoint evidence, but its perceptual match remains unverified until the operator re-reviews press, release, and interrupted quick-click behavior.
- The shared elevation shadow-color/formula route has focused override proof for Button, FAB, and Extended FAB, but not for the currently affected MDCard and MDSwitch contract classes.
- Current canonical completeness is unverified because the complete available Button snapshot is stale.

### Not implemented

none confirmed in the complete 2026-06-30 Button snapshot

### Officially unsupported / invalid combinations

- Text-style toggle Button: the official Button token matrix provides no selected/unselected text-style route. The component coherently normalizes it to the default action variant and emits a development warning.
- `selected` on a default action Button: it has no official semantic or visual route, is ignored, and emits a development warning.
- Multiple icons in one Button are invalid under the reviewed anatomy guidance.
- A trailing-icon public slot is not part of the resolved common Button anatomy; the reviewed overview and anatomy guidance identify the optional icon as leading.

### Unresolved evidence

- Whether the current live Material 3 Expressive Button family differs from the complete 2026-06-30 snapshot.
- Operator acceptance or rejection of the corrected pressed-shape motion.

### Outside this family boundary

- Split Button: official Split Button family.
- Button Groups: official Button Groups family.
- Icon Buttons: official Icon Buttons family.
- Segmented Buttons: official Segmented Buttons family.
- Floating Action Button: official FAB family.
- Extended FAB: official Extended FAB family.
- `loading`: explicit Mioframe extension, not an official Button capability.
- Shared color, elevation, icons, motion, shape, typography, state-layer, ripple, and focus contracts: their respective Material foundation/style owners.

## Stage 1 — implementation vs project documentation

### Findings

#### Shared elevation route lacks representative affected-family proof

Severity: medium

Project requirement: A shared root/system-token or formula route is resolved only when current affected families are identified and representative tests exercise the route across affected contract classes.

Implementation evidence: `MDButton.vue` consumes `--md-private-elevation-shadow-color` through shared `--md-sys-elevation-level*` shadows, and focused browser proof covers Button, FAB, and Extended FAB. Current code also routes MDCard and MDSwitch through the shared elevation contract, but the README accurately records that focused equivalent override proof for those two classes is absent.

Implementation-to-project mismatch: The Button implementation is directly proved, but the shared route's documented cross-family resolution requirement is not yet satisfied across all affected contract classes.

Required correction: Add focused representative override proof for MDCard and MDSwitch through the owning elevation foundation/style workflow, or explicitly narrow the shared route only if current code evidence supports a narrower affected set. Do not change Button-local ownership to compensate.

### Verified agreement

- The documented public API, defaults, controlled-toggle semantics, invalid-combination normalization, loading extension, native semantics, exports, and current consumer migration match current code.
- The documented five styles, five sizes, two shapes, optional leading icon, selected/pressed shape rules, and token/property owners are present in `MDButton.vue` and proportionally exercised by component and browser/visual tests.
- The root owns container geometry, border, background, elevation, and shape transitions; descendants own rendered label/icon color and opacity; `MDStateLayer` consumes only its generic private bridge.
- Raw native press state controls shape geometry, while minimum-duration pressed state independently controls state-layer feedback. The current real-pointer check proves press acquisition, immediate release progression, and the resting endpoint; forced-state screenshots are used only for appearance.
- The README accurately preserves operator rejection of the previous perceptual result and the subsequent implementation response. It does not infer acceptance from passing checks.
- The README accurately marks the official-source freshness limit, shared elevation proof gap, and open operator review.
- No obsolete Button owner or direct legacy import was found in current consumers.

## Stage 2 — project documentation vs Material 3 Expressive

### Findings

none

### Verified agreement

- The README maps `MDButton` to the official common Buttons family and correctly keeps Split Button, Button Groups, Icon Buttons, Segmented Buttons, FAB, and Extended FAB outside this family boundary.
- It accurately documents default and toggle variants; elevated, filled, tonal, outlined, and text styles; five Expressive sizes; round and square shapes; optional leading icon; selected and pressed shape morphs; concise single-line labels; native activation; and accessibility labeling.
- The default small size, 16dp recommended small padding, per-size geometry, state meanings, and exact public component-token routes agree with the inspected snapshot and structured Button token graph.
- The text-toggle normalization is classified as an invalid/unsupported combination rather than an absent capability. The official token matrix has selected/unselected routes for supported toggle styles and no equivalent text-style route.
- Rapid-click motion guidance is correctly documented as conditional Web guidance, not inflated into an unconditional missing capability.
- The Web motion implementation is explicitly documented as a project adaptation rather than literal spring-physics consumption.
- `loading` is clearly labeled as a project extension and is not presented as canonical Material.
- The README's `snapshot-complete-stale` source status, snapshot-complete inventory wording, and unresolved current coverage are honest for the available evidence.

## Evidence gaps

- The available complete Material 3 Button snapshot was captured on 2026-06-30 and is stale on the review date. No current-complete family source was available, so the audit cannot certify current official inventory or full current coverage.
- The corrected pressed-shape motion has technical browser evidence but no explicit operator re-review outcome.
- Shared elevation override behavior lacks representative focused proof for MDCard and MDSwitch, so the cross-family shared route is not fully closed.
- The audit did not use Design Kit inspection because the published family pages and structured token graph resolved the applicable Button decisions; operator perception remains the outstanding visual decision.

## Required next work

1. Ask the operator to exercise press, release, and interrupted quick-click behavior in the canonical `SizeGeometryMatrix` story and explicitly accept or reject the corrected motion.
2. Add or deliberately resolve representative MDCard and MDSwitch elevation override proof through the owning foundation/style workflow.
3. Refresh or directly verify all current official Button family pages and structured token sources before claiming `current-complete`, a complete current inventory, or full current coverage.
4. After any production or README correction, run an independent `material-component-review Button` again and replace this audit.
