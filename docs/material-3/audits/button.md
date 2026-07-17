# Button Material 3 Expressive compliance audit

- Requested name: button
- Resolved family: Button (`MDButton` — common/toggle buttons: elevated, filled, tonal, outlined, text). Icon Buttons and FAB/Extended FAB are separate official Material components with their own doc pages and are out of scope for this audit; they retain their own status in `component-registry.md` and `component-family-audit.md`.
- Audit date: 2026-07-17
- Implementation ref: `fix/md-button-material-token-contract`
- Implementation commit: `064b8a765e7e88caca3e3870d38e090c1661d5d7`
- Current owner: `src/shared/ui/Button/MDButton.vue`
- Canonical owner: `src/shared/ui/Button/MDButton.vue` (same file; no legacy/duplicate owner found)
- Compliance result: `partially-compliant`
- Operator visual status: required

## Official evidence

- `material3` MCP server, `get_component_tokens('button')` — full current token graph, including the non-deprecated `md.comp.button.{filled,elevated,tonal,outlined,text}` and per-size (`md.comp.button.{xsmall,small,medium,large,xlarge}`) token sets, plus the legacy/deprecated `md.comp.{text-button,filled-button,outlined-button,elevated-button,filled-tonal-button}` sets (used only to confirm they are not the current contract).
- `material3` MCP server, `get_component_docs('buttons')` — `components/buttons/overview.md`, `components/buttons/specs.md`, `components/buttons/guidelines.md`, `components/buttons/accessibility.md`, `components/all-buttons.md` (captured `2026-06-30T05:48:50.423Z`).
- Repository's own verified fallback snapshot (`Vyachean/m3-docs-cache`, commit `49ffae58a61f86c28b23720696dc9d07b6945483`, captured `2026-07-13T12:48:04.850Z`, `coverageHealth: verified`), as recorded in `docs/material-3/component-family-audit.md`, was cross-checked against the live MCP token graph pulled in this review rather than trusted as-is.
- `components/buttons/guidelines.md` was flagged in `component-registry.md` as "not checked" by the prior review; it was read in full during this audit (see Confirmed findings / Rule defects).

## Claimed supported surface

Per `component-registry.md` and `component-family-audit.md`, and verified by direct inspection of `MDButton.vue`, `MDButton.test.ts`, `MDButton.stories.ts`, and `tests/e2e/visual/shared-ui/md-button.spec.ts`:

- 5 color styles (`elevated`, `filled`, `tonal`, `outlined`, `text`) × 5 sizes (`extra-small`, `small`, `medium`, `large`, `extra-large`) × 2 shapes (`round`, `square`) × `default`/`toggle` variants.
- `color="text"` + `variant="toggle"` normalizes to `default` with a dev warning (documented as unsupported by the current token graph).
- Every public `--md-comp-button-*` token routes through a `--md-private-button-*`/`--md-button-*` private variable with a Material/system fallback instead of being assigned as a direct default on `.md-button_color-*`.
- Native form semantics (`nativeType`), `disabled`, `aria-pressed` toggle semantics, `aria-label`/`aria-busy`, expanded hit target, keyboard focus, ripple/state-layer, and a Mioframe `loading` extension (indeterminate/determinate, clamped `[0,1]`, dev warnings for invalid input).
- Split Button, Standard Button Group, and Connected Button Group are explicitly unsupported and out of scope.

## Required consumer scenarios

Derived from 21 real production consumers under `src/features`, `src/widgets`, `src/entities`, and `src/pages` (e.g. dialog/form primary and secondary actions in `DatabaseViewAddForm.vue`, `DatabaseQueryFilterForm.vue`; toolbar actions in `DatabaseToolbar.vue`; sheet actions in `DatabaseViewsSheet.vue`/`DatabasePropertiesSheet.vue`; card/prompt actions in `DiagnosticsErrorPrompt.vue`, `DatabaseExampleDocumentCreateSuccessCard.vue`; toggle-style filter/sort controls in `DatabaseItemSortingListSection.vue`):

- primary/secondary/tertiary emphasis buttons inside forms, dialogs, sheets, and toolbars (filled/tonal/outlined/text styles);
- toggle-style filter/selection controls (`variant="toggle"` with `selected`);
- disabled and loading states during async form/database operations;
- light and dark theme rendering (the app ships both).

## Confirmed findings

1. Severity: medium
   Area: color / system-token ownership (dark theme)
   Official requirement: Material's dark theme system-color mapping requires `md.sys.color.inverse-surface`/`md.sys.color.inverse-on-surface` to resolve to genuinely different, inverted values under the dark scheme (that is the entire purpose of the "inverse" role pair) — this is standard Material color-role behavior, not a button-specific token.
   Official source and snapshot: Material 3 color-roles system-token semantics (role definition, not a page-specific button token — the `inverse-*` role pair is a foundation-level system token consumed by `MDButton`'s outlined selected-toggle route).
   Implementation evidence: `src/shared/lib/md/tokens.css:155-159` (light block) and `src/shared/lib/md/tokens.css:484-488` (dark block, inside the file's dark-theme selector) both define `--md-sys-color-inverse-surface: var(--md-ref-palette-neutral20, …)` and `--md-sys-color-inverse-on-surface: var(--md-ref-palette-neutral95, …)` — identical values in both blocks.
   Observed mismatch: `--md-sys-color-inverse-surface`/`--md-sys-color-inverse-on-surface` do not actually invert between light and dark theme. `MDButton`'s outlined selected-toggle route consumes these system tokens by design, so that specific route renders incorrect (non-inverted) colors under dark theme.
   Required correction: fix the dark-theme block in `src/shared/lib/md/tokens.css` so `inverse-surface`/`inverse-on-surface` resolve to the correct inverted palette references for dark theme. This is foundation-owned work (`src/shared/lib/md/tokens.css`), not a change inside `MDButton.vue`, and it affects other consumers of these two system tokens equally, not only `MDButton`.

2. Severity: low
   Area: verification completeness / evidence proof
   Official requirement: none (project rule — `docs/material-3/source-of-truth.md` PR expectation for named sources/snapshots, and the override-contract itself claimed as "verified for inline-style, ordinary-CSS-class, and ancestor-inherited overrides").
   Official source and snapshot: n/a (repository verification-completeness observation, not a Material contract).
   Implementation evidence: `tests/e2e/visual/shared-ui/md-button.spec.ts:1158-1175` verifies the class-selector and ancestor-inherited override routes on `--md-comp-button-filled-container-color`/`--md-comp-button-filled-label-text-color`; the inline-style route is verified separately at `tests/e2e/visual/shared-ui/md-button.spec.ts:1189-1195` but on a different token (`--md-comp-button-filled-container-shadow-color`).
   Observed mismatch: the three override routes (inline style, class, ancestor inheritance) are proven collectively across two different token families rather than all three being proven on one representative token. This does not indicate a routing defect — both tokens use the identical `--md-private-*: var(--md-comp-*, fallback)` pattern — but it is a minor evidence-completeness gap relative to the stronger claim of "verified... for a state-specific override" implying uniform per-route proof.
   Required correction: optional — add (or repoint) one inline-style assertion onto the same `--md-comp-button-filled-container-color` token already covered by the class/inherited tests, for symmetry. Not required to unblock the family.

## Evidence gaps

- Final rendered `box-shadow` color re-derivation through the shared `--md-private-elevation-shadow-color` → `--md-sys-elevation-levelN` bridge (`src/shared/lib/md/tokens.css`) is explicitly not asserted end-to-end for a shadow-color-only override; `tests/e2e/visual/shared-ui/md-button.spec.ts:1198-1250` deliberately scopes to the private bridge variable and elevation-level geometry only, with an inline comment documenting the discovered browser limitation. This is a disclosed, narrow gap (shared foundation code, affects the whole Button family identically), not a hidden defect.
- Live Material Design Kit (Figma) verification of exact expressive geometry/anatomy was not performed in this review (no Figma MCP access was exercised); published `components/buttons/specs.md` and `overview.md` text/tables were treated as sufficient for the token- and behavior-level surface reviewed here. No visual-geometry decision in this review depended on Design Kit-only detail.

## Rule defects

- `docs/material-3/component-registry.md:60` states "`guidelines` was not checked" for the Buttons row. This review checked `components/buttons/guidelines.md` directly via MCP and found no contract-level requirement beyond what `MDButton` already implements or correctly leaves to consumer composition (button choice/hierarchy/placement, toggle-button icon-fill guidance, label sentence-case/no-wrap, text-button-vs-chip visual caution — all consumer/product-usage guidance, not component API surface). Recommended correction: update that registry line to record the guidelines page as checked, with this audit as the reference, so a future reviewer does not re-flag it as an open gap.

## Verified compliant areas

- Override contract: every inspected `--md-comp-button-*` token (color, elevation, state-layer color/opacity, disabled color/opacity) is routed through a `--md-private-button-*` (or `--md-button-*` for geometry) private variable with a Material/system fallback; no direct default assignment onto `.md-button_color-*` selectors was found across the full style block. Backed by a real Playwright test proving the class-selector and ancestor-inheritance routes actually work (not just that the CSS pattern looks right).
- `color="text"` + `variant="toggle"` normalization is independently verified correct: the current (non-deprecated) `md.comp.button.text` token set in the live MCP token graph contains zero `selected`/`unselected` entries, while `md.comp.button.{filled,elevated,outlined,tonal}` all do. The only text-toggle-shaped tokens in the graph live under the deprecated `md.comp.text-button` set.
- Outlined/text container-elevation being a private-only constant (no public token) is independently verified correct: `md.comp.button.text` and `md.comp.button.outlined` in the current token graph publish no `container.elevation` token; the only `text`/`outlined` elevation tokens in the graph belong to the deprecated `md.comp.text-button`/`md.comp.outlined-button` sets.
- Outlined selected state having no distinct selected-outline-color token is independently verified correct: the current `md.comp.button.outlined` set has `unselected`-qualified outline-color tokens (hover/focus/pressed/disabled) but no `selected`-qualified outline-color token; `MDButton`'s choice to follow the selected container color instead of inventing one is a reasonable, explicitly documented substitute.
- Accessibility: native `<button>` gives correct `Tab`/`Space`/`Enter` keyboard behavior for free; `aria-label` is set to the same text as the visible label, matching `components/buttons/accessibility.md`'s "accessibility label... should match the visible label text" guidance; `aria-pressed`/`aria-busy` are applied correctly and only when relevant.
- Text button has no visible container by default (no `--md-private-button-container-color` set in `.md-button_color-text`), matching the guidelines page ("the container isn't visible until someone interacts with the button").
- Loading extension is honestly scoped as a Mioframe extension (not an official Material contract), clamps invalid numeric input with dev warnings, and keeps the label present with `opacity: 0` under an absolutely-positioned progress indicator marked `aria-hidden`.
- Broad, real production adoption: 21 files across `features`, `widgets`, `entities`, and `pages` consume `MDButton`; no parallel/duplicate button primitive was found competing for the same role. `MDSegmentedButtons.vue` is an empty stub and correctly not exported from `index.ts`.
- Storybook coverage is broad and specific (24 stories including dedicated token-routing matrices, toggle-role matrices, override-contract routes, shadow-color-override routes, and loading/accessibility stories), backed by a real `MDButton.test.ts` unit suite and browser-level `tests/e2e/visual/shared-ui/md-button.spec.ts` assertions rather than screenshots alone.

## Recommended next action

- resolve the confirmed medium finding: fix the dark-theme `--md-sys-color-inverse-surface`/`--md-sys-color-inverse-on-surface` values in `src/shared/lib/md/tokens.css` (foundation-owned, affects other consumers beyond `MDButton`), then run `material-component button` (or the relevant foundation workflow) to implement and re-verify;
- after that fix lands and `pnpm verify` passes, complete the pending M1 operator visual acceptance step recorded in `docs/material-3/library-roadmap.md` before the family can move from `partial`/`partially-compliant` toward `aligned`/`compliant`.
