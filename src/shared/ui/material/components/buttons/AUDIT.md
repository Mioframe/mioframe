# Buttons implementation audit

Reviewed: 2026-07-19
Result: non-compliant
Canonical source status: snapshot-complete-stale
Official capability inventory: snapshot-complete (material3 MCP cache captured 2026-06-30T05:53:04.916Z; independently re-queried this run via `material_docs_cache_status` — same capture, no newer snapshot exists; age ~18.9 days against a 7-day TTL, `coverageHealth: "partial"`; currentness remains unverified)
Official coverage: unresolved
Project implementation documentation: README.md
Visual review: rejected

## Evidence

### Independently inspected this run

- `MDButton.vue` (full 1717 lines: script, template, every color/size/state/shape CSS branch), `MDButton.test.ts` (full), `MDButton.stories.ts` (full), `index.ts`.
- `README.md` and the prior `AUDIT.md` (dated 2026-07-18 22:13, commit `ef82d756`) — read independently before forming conclusions, not assumed correct.
- `docs/material-3/source-of-truth.md`, `component-architecture.md`, `component-tokens.md`, `component-testing.md`, `autonomous-review.md`, and the applicable `AGENTS.md` chain (`/`, `/src`, `/src/shared`, `/src/shared/ui`, `/src/shared/ui/material`, `/src/shared/ui/material/components`).
- `src/shared/ui/State/usePressed.ts`, `useStateLayer.ts`, `MDStateLayer.vue` (transition ownership).
- `src/shared/lib/md/index.css` (the `.md` base class and its `* { transition-duration }` rule).
- Root-class inventory of real consumer wrappers, read directly, not asserted: `src/shared/ui/Layout/MDPane.vue` (`.md md-pane__surface`), `src/shared/ui/Dialog/DialogForm.vue` (`.md md-dialog__container`), `src/shared/ui/Snackbar/MDSnackbar.vue` (`.md md-snackbar`, `.md md-snackbar__close-button`), `src/shared/ui/AppBar/MDAppBar.vue` (`.md md-app-bar`).
- Consumer inventory: 19 non-family `.vue` importers of `MDButton` across `widgets`, `features`, `pages`, `entities`, `shared/ui` (`grep` across `src`), including how many route through an `MDPane`/`DialogForm`-style `.md`-classed ancestor (16 page-level `*Pane.vue` files use `MDPane`; `DialogForm` is a separate `.md`-classed ancestor for dialog-hosted buttons).
- `tests/e2e/storybook/md-button-family.spec.ts` and `tests/e2e/visual/shared-ui/md-button.spec.ts` — full test-name inventory via search, plus a full read of `MDButton pressed shape starts releasing immediately after a quick pointer press` (lines 235–266), the only real-pointer press/release test for this family.
- `git log`/`git diff` for `src/shared/ui/material/components/buttons`: working tree is clean and no commit has touched this family since the prior audit's own commit — production, README, tests, and stories are byte-identical to what the prior audit reviewed.
- `material3` MCP, fresh calls this run: `material_docs_cache_status` (confirms no newer snapshot exists) and `get_component_tokens('buttons')` (fresh full structured pull, ~384k characters), spot-checked independently: `md.comp.button.xsmall.container.height` exists; no `md.comp.button.text.selected.*`/`.text.unselected.*` token exists; no `md.comp.button.outlined.selected.*.outline.color` token exists (only `outlined.unselected.{hovered,focused,pressed,disabled}.outline.color` do).

### Operator feedback considered

- README status: `rejected`. No new operator message was supplied in this review's task input, so per policy (silence does not imply acceptance) the status is preserved unchanged.
- Latest operator feedback (persisted in README, unchanged since prior audit): the button's expanded target geometry was inconsistent with the visible button, and corners still became visually straight during press.
- Independent re-check of the pressed-shape CSS (unchanged since prior audit) finds no code path that renders a straight/unrounded corner for any size, shape, color, or toggle-selected combination: every pressed rule (`&.md-button_pressed:not(.md-state_disabled):not(:disabled)`, `&:active:not(:disabled)`) resolves `--md-private-button-border-radius` to a non-zero per-size `corner-small`/`corner-medium`/`corner-large` alias, and the selected-shape rule is explicitly excluded while pressed so pressed always wins.

## Contradictions

None found. Production, README, stories, and test-name/assertion inventory agree with each other; no superseded anatomy, no test title claiming an untested branch, no owner-shopping between documents.

## Objective findings

### Finding 1 (carried forward, independently re-verified and refined) — Minimum-duration pressed state-layer hold is not causally connected to a real transition owner

Severity: medium

Independently confirmed the underlying mechanism: `usePressed.ts`'s `getTransitionDuration()` reads `getComputedStyle(el).getPropertyValue('transition-duration')` on `el = unrefElement(target)` — the `<button class="md-button">` host itself. `.md-button` declares no own `transition-duration`; `.md-button__container` (which owns the real `border-radius`/`box-shadow`/color transitions) and `.md-state-layer` (which owns the real state-layer `background-color` transition, independently bound to `--md-private-state-layer-transition-duration`) are never read. The host's computed value only becomes non-zero (`0.2s`, `--md-sys-motion-duration-short4`) when some ancestor happens to carry the incidental `.md` class, via the unrelated global rule `.md * { transition-duration: var(--md-sys-motion-duration-short4, 0.2s); }` in `src/shared/lib/md/index.css`.

**Refinement of the prior audit's "practical impact: bounded... common case 0s" characterization.** That characterization checked only `src/app/MainApp.vue`'s root and `.storybook/preview.ts` for a `.md` ancestor and found none — which is correct as far as it goes, but does not establish that a `.md` ancestor is rare in real usage. Independently inspecting actual consumer wrapper components shows the opposite: `MDPane` (used by 16 page-level `*Pane.vue` files), `DialogForm`, `MDSnackbar`, and `MDAppBar` all render a `.md`-classed element as an ancestor of their content. Most of the 19 real `MDButton` consumers are composed inside one of these wrappers, so in a materially large share of real production renders the host likely _does_ inherit a non-zero `transition-duration` and the minimum-hold timeout does not collapse to ~0ms as the prior "common case" framing implied.

This does not close the finding — it relocates its exact weight. Two things remain true and are the actual defect:

1. The connection is accidental cascade inheritance from an unrelated generic reset selector, not an explicit route to the button's or state layer's own transition — it is coincidence, not ownership, and would silently break again if `.md`'s `* { transition-duration }` rule or its ancestor markup ever changes for unrelated reasons.
2. The mechanism is **completely untestable through this project's own required browser-behavior proof surface**: Storybook's canonical stories and `.storybook/preview.ts` never supply a `.md`-classed ancestor (confirmed by direct inspection), so every isolated-Storybook Playwright test for this family — including the one real-pointer press/release test, `MDButton pressed shape starts releasing immediately after a quick pointer press` — necessarily runs with the host's `transition-duration` at its unset `0s` initial value. The project cannot currently write a passing Storybook test that observes the "working" (production, `.md`-ancestor) path at all; only an app-level E2E test wrapped in a real `.md`-classed page could exercise it, and none does.

Required correction: read the transition duration from a source actually connected to the state layer's own transition (a documented constant, or `.md-state-layer`'s/`.md-button__container`'s own computed style) instead of an ancestor-cascade side effect on the host. This is a shared `usePressed`/`useStateLayer` primitive issue (`src/shared/ui/State`), surfaced here because Button's own README and stories make an explicit "independently controls" claim about it.

### Finding 2 (carried forward, confirmed unchanged) — Two private custom properties name CSS mechanism instead of Material semantic role

Severity: medium

Independently re-read in `MDButton.vue`: `--md-private-button-border-radius` (semantic concept is _shape_/_corner-size_, e.g. `md.comp.button.<size>.container.shape.round`) and `--md-private-button-padding-left`/`-padding-right` (semantic concept is _leading-space_/_trailing-space_). Structurally valid private routes (real per-size/per-state configuration), but named after the CSS property rather than the Material role, which `component-tokens.md` explicitly requires review to report.

Required correction: rename to `--md-private-button-shape` (or `-corner-size`) and `--md-private-button-leading-space`/`-trailing-space`.

### Finding 3 (carried forward, confirmed unchanged) — Two private custom properties are unnecessary aliases for a constant

Severity: low

Independently confirmed: `--md-private-button-border-style` (line 216, redeclared identically at line 1026 inside `.md-button_color-outlined`) and `--md-private-button-box-sizing` (line 217, redeclared identically at line 1027) never vary — always `solid` and `border-box` respectively, in every branch of the file. `component-tokens.md` disallows routing a one-use constant through a private variable.

Required correction: declare `border-style: solid;` and `box-sizing: border-box;` directly on `.md-button__container` instead of through indirection.

### Finding 4 (carried forward, confirmed unchanged) — Shared elevation route still lacks representative MDCard/MDSwitch proof

Severity: medium

Independently re-confirmed via `grep`: `MDCard` and `MDSwitch` both consume `--md-private-elevation-shadow-color` (alongside `MDButton`, `MDFab`, `MDExtendedFab`), but only `tests/e2e/visual/shared-ui/md-button.spec.ts` and `tests/e2e/visual/shared-ui/md-fab-family.spec.ts` exercise the route. No test exercises it for `MDCard` or `MDSwitch`. Button's own proof is unaffected; this is a cross-family gap the shared elevation route's owner must close.

### Operator-rejected pressed-shape item (unchanged — preserves `high`-severity non-compliant status per policy)

No reproducible straight-corner code path exists under independent re-inspection of every pressed CSS branch (see "Operator feedback considered" above), and the full local visual/behavior verification suite passes, including exact-pixel pressed-radius assertions. Per `autonomous-review.md`, "unchanged operator-rejected behavior" is a `high`-severity item by definition regardless of technical evidence, and only explicit operator acceptance — not passing tests or an inability to reproduce the symptom — can change the recorded status. This keeps the overall result `non-compliant`.

## Evidence gaps

- The available complete Material 3 Button snapshot (captured 2026-06-30) remains 18.9 days past its own 7-day cache TTL; no current-complete family source is available this run either, so this audit still cannot certify current official inventory or full current coverage.
- The operator-rejected pressed-corner symptom has no reproducible code path under independent technical review; only the operator can convert `rejected` to `accepted`. This review adds no new technical evidence on that specific symptom beyond re-confirming the prior audit's check.
- Finding 1's real-world frequency (how often a live `MDButton` render actually inherits a `.md`-classed ancestor) is inferred from consumer wrapper source code, not measured at runtime; no test currently observes the connected (non-zero) path in either direction.
- Design Kit inspection was not used; the published family pages and structured token graph resolved every applicable objective decision for this review.

## Operator status

Status: `rejected` (unchanged; no new operator message this run).

## Required next work

1. Ask the operator to re-look at the current build's pressed/release behavior and explicitly accept or reject it — do not infer acceptance from this or the prior review's inability to reproduce a straight corner.
2. Fix or re-scope the minimum-duration pressed state-layer mechanism in `src/shared/ui/State/usePressed.ts` so it reads a duration actually connected to the state layer's own transition, then add an app-level E2E test (not Storybook, which structurally cannot supply a `.md` ancestor) that exercises the timing under a real `.md`-classed wrapper such as `MDPane`.
3. Rename `--md-private-button-border-radius` and `--md-private-button-padding-left`/`-padding-right` to semantic-role names; collapse `--md-private-button-border-style` and `--md-private-button-box-sizing` to direct declarations.
4. Add or deliberately resolve representative `MDCard` and `MDSwitch` elevation override proof through the owning elevation foundation workflow.
5. Refresh or directly verify all current official Button family pages and structured token sources before claiming `current-complete`, a complete current inventory, or full current coverage.
6. After any production or README correction, run an independent `material-component-review buttons` again and replace this audit.
