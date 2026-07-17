# Buttons implementation audit

Reviewed: 2026-07-18
Result: partially-compliant
Official capability inventory: complete
Official coverage: partial
Project implementation documentation: `README.md`
Visual review: required

## Evidence

### Project documentation reviewed

- `README.md` beside the Button implementation.
- `MDButton.stories.ts` component doc block (colocated implementation evidence).
- `docs/material-3/foundation-registry.md` (Elevation and Motion entries).
- `docs/material-3/library-roadmap.md` (M1 Button milestone entry).
- `docs/material-3/component-architecture.md`, `docs/material-3/component-testing.md`, `docs/material-3/autonomous-review.md` (applicable project policy, unchanged since the prior audit).
- Git history for `src/shared/ui/material/components/buttons/MDButton.vue` and `src/shared/lib/md/tokens.css` (`git log -S`, `git show`) to independently verify README claims about what predates or was introduced by this Button work.
- Applicable shared motion and elevation ownership in `src/shared/lib/md/tokens.css`.
- Cross-family consumer check of `--md-private-elevation-shadow-color` across `MDCard.vue`, `MDFab.vue`, `MDExtendedFab.vue`, `MDSwitch.vue`.

### Material 3 Expressive evidence

- `material3` MCP local documentation cache (source `m3.material.io`, captured `2026-06-30T05:53:04.916Z`, cache status `partial`/`isFresh: false` but internally consistent; no fresher cache available in this session).
- Pages read directly in full this pass: `components/buttons/overview.md`, `components/buttons/guidelines.md`, `components/buttons/accessibility.md`, `components/buttons/specs.md` (Filled color token table and Xsmall/Small size token tables read verbatim; remaining size/color token tables cross-checked through the structured token graph below rather than re-reading the full raw page, which exceeds single-fetch handling).
- `get_component_tokens("buttons")` structured token graph (12,107 lines), spot-verified for: pressed-shape spring stiffness (`800`)/damping (`0.6`) at `xsmall` and `medium`; selected-shape round/square corner tokens at `xsmall` and `medium`; presence of `container-elevation`/`container-shadow-color` only for `filled`/`elevated`/`tonal` (confirmed absent for `outlined`/`text`); absence of any `md.comp.button.text.*selected/unselected*` token; absence of `md.comp.button.outlined.selected.outline.color`; presence of `md.comp.button.outlined.unselected.{hovered,focused,pressed,disabled}.outline.color` and absence of a resting `unselected.outline.color`.
- Superseded prior fallback snapshot: `Vyachean/m3-docs-cache` commit `49ffae58a61f86c28b23720696dc9d07b6945483`, captured `2026-07-13T12:48:04.850Z` — still cited by `MDButton.stories.ts` (see Stage 1 findings); the MCP cache above is the current source of record for this audit.
- Official pressed-shape source values confirmed via structured token graph: `md.sys.motion.spring.fast.spatial.stiffness = 800`, `md.sys.motion.spring.fast.spatial.damping = 0.6`.
- `components/buttons/overview.md` confirms `Web: Expressive` platform availability is `Unavailable`, corroborating the project's position that no official CSS-consumable spring adaptation exists and a documented Web approximation is required instead.

## Official capability coverage

### Implemented and verified

- Common `MDButton` surface with elevated, filled, tonal, outlined, and text styles — colors, elevation/shadow-color routes, and disabled/hover/focus/pressed token routing independently verified against the structured token graph for `filled`; the same routing pattern is applied uniformly per color branch in code.
- Extra-small, small, medium, large, and extra-large sizes — height, icon size, leading/trailing space, icon-label space, and outlined outline-width verified against the token graph for `xsmall`/`small`; `medium`/`large`/`xlarge` verified for shape-morph tokens (see below) and trusted for the remaining dimensional tokens given the uniform per-size structure already spot-checked twice.
- Round and square shapes, including the official pressed-shape corner morph (spring stiffness `800`/damping `0.6`, confirmed at `xsmall` and `medium`) and the official selected-shape corner morph (round→size's square-family corner, square→fully-rounded corner, confirmed at `xsmall`: round-selected=`corner-medium`, square-selected=`corner-full`; and `medium`: round-selected=`corner-large`, square-selected=`corner-full`).
- Default action and controlled toggle modes.
- Native button ownership, type, disabled behavior, accessible name, controlled `aria-pressed`, and loading `aria-busy`.
- Motion: per-size pressed-corner spring component tokens are documented as source evidence only (a single comment beside the root duration/easing declarations) and are not declared as unconsumed CSS custom properties; the `border-radius` transition is wired to the project's one honest Web adaptation. Verified in code: no `--md-private-button-*-spring-*` custom property exists, and the transition's `border-radius` entry consumes only `--md-private-button-corner-motion-duration`/`-easing`.
- Elevation shadow-color routing: `MDButton`'s local `--md-private-elevation-shadow-color` overrides (`elevated`, `filled`, `tonal` color branches) now reach the final rendered `box-shadow`, verified by the dedicated e2e assertion "MDButton container shadow-color routes an override into the shared elevation bridge" in `tests/e2e/visual/shared-ui/md-button.spec.ts`. See Stage 1 finding 1 for a documentation-accuracy issue in how this fix is attributed, not a functional defect.
- Numeric loading extension at `0`: `loading=0` (and any numeric input that clamps to `0`, including negative, `NaN`, and infinite values) renders the same indeterminate visual as `loading={true}` and does not emit a development warning for plain `0`; the value is forwarded to `MDCircularProgressIndicator` as `undefined` rather than a fake determinate `0`. Verified in code (`normalizedLoadingProgress`, `isInvalidLoadingNumber`) and by the parameterized test at `MDButton.test.ts:206-233`.
- Canonical ownership, public export (`@shared/ui/material` → `./components/buttons` → `MDButton.vue`), consumer migration, and legacy MDButton removal — verified: no `MDButton*` file remains under `src/shared/ui/Button`, and every repository consumer of `MDButton` imports it from `@shared/ui/material`.
- Text-style toggle buttons correctly identified as unsupported and normalized to `variant="default"` with a development warning — verified against the token graph (no `md.comp.button.text.*selected*`/`*unselected*` token exists) and against code/tests.
- Outlined toggle outline-color routing: resting unselected outline correctly falls back to the base (non-branch-qualified) `outlined.outline.color` token, since the token graph confirms no resting `outlined.unselected.outline.color` token exists while `hovered`/`focused`/`pressed`/`disabled` unselected-qualified outline tokens do exist and are consumed. Selected outline correctly has no dedicated color token and instead follows the selected container color, confirmed absent from the token graph.
- Elevation/shadow-color route absence for `outlined` and `text`: confirmed via the token graph that only `filled`, `elevated`, and `tonal` publish `container.elevation`/`container.shadow-color` tokens.

### Partial / defective / unverified

None confirmed by this review. The prior audit's three "partial/defective/unverified" items (motion runtime, elevation impact evidence, numeric loading at zero) are now independently verified as resolved (see above); the residual "full source-backed guidelines interpretation" item from the prior audit is superseded by the direct full-page reads performed in this pass (see Evidence), though see Stage 1 finding 2 for a colocated documentation artifact that has not been updated to match.

### Not implemented

Current independently confirmed absent official capability:

- Text-style toggle buttons — confirmed absent from the token graph (see above); correctly normalized with a warning rather than silently mis-rendered.
- Rapid-click modified motion curve — `components/buttons/accessibility.md` (`### Rapid clicks`) states: "On the web, you can use a modified motion curve to avoid resonant effects from overlapping animations. This provides a smoother experience for interactions where you anticipate multiple clicks or taps in succession." `MDButton` applies the same fast-spatial pressed-shape adaptation on every press regardless of click cadence; no rapid-click-specific curve adjustment exists in code.

This list is mandatory regardless of current Mioframe consumer demand. Independently reconstructed against every current `components/buttons/*` page and the structured token graph; no additional absent capability was found beyond what the README already discloses.

### Unresolved evidence

None. The `material3` MCP cache used for this pass (captured `2026-06-30T05:53:04.916Z`) is stale relative to its own TTL (`isFresh: false`) but is the best available source in this session and is internally consistent with the fallback snapshot cited by the prior audit; no conflicting evidence was found between the two.

### Outside this family boundary

Confirmed unchanged from the prior audit, independently re-verified this pass:

- Split Button (`components/split-button`) — no implementation found anywhere in the repository.
- Standard Button Group and Connected Button Group (`components/button-groups`) — no implementation found anywhere in the repository.
- Icon Button and Toggle Icon Button (`components/icon-buttons`) — implemented at the legacy `src/shared/ui/Button/MDIconButton.vue`, confirmed still present outside the canonical Material root.
- Segmented Button (`components/segmented-buttons`, deprecated by Material in favor of the connected button group) — implemented at the legacy `src/shared/ui/Button/MDSegmentedButtons.vue`, confirmed still present.
- FAB and Extended FAB — implemented at the legacy `src/shared/ui/Button/MDFab.vue` and `MDExtendedFab.vue`, confirmed still present.

## Stage 1 — implementation vs project documentation

### Findings

#### 1. README misattributes the origin of the shared elevation universal-selector mechanism

Severity: medium

Project requirement: family documentation must record known issues and dependencies honestly, and a shared/root-level mechanism change must be traceable to its real owner and history so a future reviewer can correctly judge blast radius (`src/AGENTS.md` diagnostics/ownership expectations; `src/shared/ui/material/AGENTS.md` "Assess cross-family impact before changing root/system tokens, universal selectors...").

Implementation evidence: `git log -S` and `git show` on `src/shared/lib/md/tokens.css` show that the declaration of `--md-sys-elevation-level0`–`level5` on the universal selector (`*, ::before, ::after`, replacing a `:root`-only declaration) was introduced in commit `baa657c6` ("feat(button): add MDButton component..."), the same body of work that added `MDButton`. Before that commit, `--md-sys-elevation-level*` was declared only on `:root`. `MDCard.vue`, `MDFab.vue`, and `MDSwitch.vue` already set `--md-private-elevation-shadow-color` locally on their own selectors before this commit (predating it, per `git log -S` on those files), meaning their local shadow-color overrides relied on exactly the `:root`-only declaration that the same commit's own code comment says does not work ("a descendant overriding `--md-private-elevation-shadow-color` only inherits the already-resolved (frozen) string instead of recomputing it").

Implementation-to-project mismatch: `README.md`'s "Elevation (resolved)" note states "This mechanism predates this Button work and is already the exact pattern `MDCard`, `MDFab`, `MDExtendedFab`, and `MDSwitch` rely on." This is inaccurate: the _pattern_ of setting a local `--md-private-elevation-shadow-color` override predates Button work, but the universal-selector _mechanism that makes that override actually reach the final `box-shadow`_ was introduced by this Button work, not inherited from an existing contract. `docs/material-3/foundation-registry.md`'s Elevation entry correctly attributes this ("Bridge verification is resolved: ... verified by `MDButton`'s shadow-color test ..., 2026-07-17") and `docs/material-3/library-roadmap.md`'s M1 entry explicitly discloses it as a fix landed during Button migration ("root-caused to a real CSS custom-property inheritance/freezing behavior... benefits `MDButton`, `MDIconButton`, `MDFab`, and `MDExtendedFab` identically") — so the change itself is properly tracked at its correct owning documents. Only the Button family's own `README.md` states the imprecise "predates" framing, which understates that this was a live cross-family behavior change bundled into Button work, and could mislead a reader who consults only the Button family README (the primary Stage 1 evidence source for this audit) about whether a cross-family risk was introduced.

Note: no test or story exists for `MDCard`/`MDFab`/`MDExtendedFab`/`MDSwitch` that exercises a shadow-color override (`grep -rl shadow-color` finds it only in their `.vue` implementation files, never in a `.test.ts`/`.stories.ts`), so "these four pre-existing consumers continuing to pass their own tests/visual coverage unchanged" (also in the README) is true but does not constitute representative proof that the routing fix is correct for those four families specifically — their tests were never exercising the mechanism at all, before or after.

Required correction: correct the "Elevation (resolved)" note in `README.md` to state plainly that this Button work introduced/fixed the universal-selector mechanism (consistent with `foundation-registry.md`'s and `library-roadmap.md`'s existing, accurate framing), rather than implying it predated Button work unchanged. Optionally, note the absence of representative shadow-color-override tests for the other four consumers as a residual, low-risk evidence gap rather than implying it is closed by "unchanged" test results.

#### 2. Colocated Storybook documentation still claims the Buttons guidelines page was not checked, contradicting the README

Severity: medium

Project requirement: family documentation and its colocated implementation evidence (stories) must not present contradictory source records for the same claim; the prior audit's Stage 2 finding 2 required this exact contradiction to be eliminated project-wide, not relocated.

Implementation evidence: `MDButton.stories.ts`'s `meta.parameters.docs.description.component` block states: "Checked against the verified `Vyachean/m3-docs-cache` snapshot (commit `49ffae58a61f86c28b23720696dc9d07b6945483`, captured `2026-07-13T12:48:04.850Z`): `pages/components/buttons/{overview,specs,accessibility}.md` ... `guidelines` was not checked."

Implementation-to-project mismatch: `README.md`'s official documentation mapping now states all four pages — `overview.md`, `guidelines.md`, `accessibility.md` (via the `material3` MCP cache, captured `2026-06-30T05:53:04.916Z`) and `specs.md` (via the token-table graph) — were inspected, and its "Documentation consistency (resolved)" note explicitly claims: "`guidelines.md` has now been inspected directly through the `material3` MCP cache in this pass; the snapshot above is the single current source of record." The colocated Storybook documentation was not updated to match and still asserts the opposite (`guidelines` not checked) while citing a different, superseded evidence source (the `Vyachean/m3-docs-cache` fallback snapshot rather than the `material3` MCP cache). A consumer reading the Storybook docs page — which is user-facing implementation documentation, not merely internal notes — sees a claim that directly contradicts the family README.

Required correction: update `MDButton.stories.ts`'s component doc block to cite the same current `material3` MCP cache snapshot as `README.md` and to state that `guidelines.md` was inspected, removing the stale "`guidelines` was not checked" sentence, so the two colocated documentation surfaces agree.

### Verified agreement

- The implementation provides the documented five styles, five sizes, round/square shapes, and default/toggle modes; independently spot-checked against the structured Material token graph for `xsmall`, `small`, and `medium`.
- Native button ownership, `nativeType`, disabled state, accessible name, controlled `aria-pressed`, and loading `aria-busy` are represented in implementation and colocated contract coverage.
- Canonical Button ownership and the curated `@shared/ui/material` export exist; no legacy `MDButton` file or export remains, and every direct repository consumer imports from `@shared/ui/material`.
- Motion runtime: the per-size spring tokens are documented as evidence-only via a single code comment, not declared as unconsumed CSS custom properties; the actual `border-radius` transition is wired to the shared expressive fast-spatial duration/easing adaptation. No test asserts spring-token consumption that does not exist.
- Elevation shadow-color routing functionally works for `MDButton` and is proven by a dedicated e2e test (see Stage 1 finding 1 for the separate documentation-attribution issue, which does not affect functional correctness).
- Numeric loading value `0` (and other values that clamp to `0`) is coherent: an active loading state (`aria-busy`, hidden label/icon) rendered with the indeterminate visual, not a fake determinate `0`; correctly does not emit a development warning for exactly `0`, and does emit one for out-of-range or non-finite numeric input.
- The README explicitly records the currently known absent text-toggle, Split Button, Standard Button Group, and Connected Button Group capability, plus the newly surfaced rapid-click motion-curve gap.
- The outlined-toggle outline-color fallback behavior and the absence of a selected outline-color token are both accurately documented and match the token graph.

## Stage 2 — project documentation vs Material 3 Expressive

### Findings

None beyond the two Stage 1 findings above, which are documentation-accuracy issues internal to the project's own records rather than a divergence from Material 3 Expressive itself. No canonical Material requirement was found to be missing, misrepresented, or invented in the currently documented implemented surface.

### Verified agreement

- Official family choice and documentation mapping (`components/buttons`) are correct; the family boundary list (Split Button, Button Groups, Icon Buttons, Segmented Button, FAB/Extended FAB as separate families) is independently confirmed accurate against the `material3` MCP cache's component listing and search results.
- The five documented color styles, five sizes, round/square shapes, default/toggle variants, and their relative emphasis ordering (elevated → filled → tonal → outlined → text) match `components/buttons/overview.md` and `guidelines.md`.
- Pressed-shape spring values (stiffness `800`, damping `0.6`) and selected-shape corner morph targets are correctly transcribed from the structured token graph at every size spot-checked (`xsmall`, `medium`).
- The absence of a text-style toggle route, the absence of a selected outlined-outline-color token, and the presence/absence pattern of `container-elevation`/`container-shadow-color` tokens across the five color styles are all independently confirmed against the token graph and correctly reflected in code and documentation.
- The rapid-click modified-motion-curve accessibility guidance is correctly transcribed from `components/buttons/accessibility.md` and correctly classified as an open, unimplemented official capability rather than being silently omitted.
- The `Web: Expressive` "Unavailable" platform-availability note on `components/buttons/overview.md` supports the project's position that no official CSS-consumable spring implementation exists, justifying the documented Web adaptation approach rather than a literal spring-token runtime dependency.
- The documentation distinguishes canonical Material behavior from the Mioframe `loading` extension, and the numeric-loading-at-zero behavior is coherently defined and tested.

## Evidence gaps

- No representative shadow-color-override test or story exists for `MDCard`, `MDFab`, `MDExtendedFab`, or `MDSwitch` to directly confirm the universal-selector elevation change (introduced during this Button work) has no visible regression for those families; risk is assessed as low because their resting shadow-color values equal the same default in both the old (`:root`-only) and new (universal-selector) mechanism, but this remains unverified by a targeted test.
- The `material3` MCP documentation cache used for this review (captured `2026-06-30T05:53:04.916Z`) is stale relative to its own 7-day TTL; no fresher cache was available in this session, and no conflicting content was found relative to the prior audit's fallback snapshot.
- Full manual re-verification of every remaining per-size token (icon size, leading/trailing space, outline width for `large`/`xlarge`) was not repeated beyond the `xsmall`/`small`/`medium` spot checks in this pass; risk is assessed as low given the uniform per-size code structure already matched at three sizes against the token graph.

## Required next work

1. Correct `README.md`'s "Elevation (resolved)" note to accurately attribute the universal-selector mechanism to this Button work (matching `foundation-registry.md`'s and `library-roadmap.md`'s existing accurate framing) instead of stating it predates Button work.
2. Update `MDButton.stories.ts`'s component doc block to cite the current `material3` MCP cache snapshot and state that `guidelines.md` was inspected, removing the stale "`guidelines` was not checked" sentence.
3. Optionally add a minimal shadow-color-override check for `MDCard`, `MDFab`, `MDExtendedFab`, or `MDSwitch` to close the representative-proof evidence gap for the cross-family elevation mechanism change (low priority; no known defect).
4. Update `README.md`, run applicable local verification, and rerun `material-component-review Button` after the above documentation corrections.
5. Perform operator visual review; it is no longer blocked by unresolved rendering-affecting findings (both remaining findings are documentation-only).
