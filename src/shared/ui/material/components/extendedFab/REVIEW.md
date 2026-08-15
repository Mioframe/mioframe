# Extended FAB review

```text
Verdict: compliant-with-listed-risks
Required return family: none
Required return stage: none
Completion status: complete
Final workflow verification readiness: ready
Operator visual status: no-reported-defect
Blockers: none
Major issues: none
Minor issues: none
Accepted risks: (1) no official focus-indicator token path exists for the Primary-container/any-size combination; (2) no official minimum-width/leading-space geometry is documented for the label-only (no-icon) configuration; (3) every `direct` renderer classification is pinned to the exact installed `@m3e/web@2.7.4` artifact and requires revalidation on the next consumed renderer upgrade.
```

## Goal and scenarios reviewed

Reviewed the complete current `extendedFab` family: `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, `MDExtendedFab.vue`, `MDExtendedFab.test.ts`, `MDExtendedFab.browser.spec.ts`, `MDExtendedFab.visual.spec.ts` plus its four colocated baselines, `MDExtendedFab.stories.ts`, `index.ts`, the root `@shared/ui/material` barrel, the shared `m3eFab.d.ts` Vue template-type shim, and both migrated consumers (`src/pages/RepoExplorer/RepoExplorerPane.vue` + its test, `src/shared/ui/Button/FabContainer.stories.ts`). Confirmed legacy removal (`src/shared/ui/Button/MDExtendedFab.{vue,test.ts,stories.ts}`, its barrel export, `tests/e2e/visual/shared-ui/md-fab-family.spec.ts`, and the `MDExtendedFab` block of `tests/e2e/storybook/focusIndicator.spec.ts`) by direct filesystem/grep inspection rather than trusting the migration narrative alone.

Scenario: `RepoExplorerPane`'s "Add" action — one fixed small, primary-container Extended FAB with a required visible/accessible "Add" label and an optional decorative inline-SVG icon, composed through `FabContainer` (unchanged, non-Material). This is the only confirmed product scenario; `FabContainer.stories.ts`'s three fixture usages are a non-product Storybook consumer requiring no independent architecture decision (same fixed configuration).

Operator observations for this invocation: none beyond the family name itself. No visual/motion/accessibility/interaction/geometry defect was supplied. `Operator visual status: no-reported-defect` (not `not-applicable` — the component has a real renderer-owned visual/motion surface: state layer, elevation, focus ring).

## Official design compliance

`DESIGN.md` is source-backed (m3.material.io `extended-fab` route, distinct from `floating-action-button`/`fab-menu`; token table `designSystems/20543ce18892f7d9/components/36500f77b86d20a5`, 12 resolved token sets), current (`Source checked at: 2026-08-15`, refresh not due), and complete: identity/purpose, anatomy, all four size variants and eight color styles, per-size geometry, placement, elevation, states (Enabled/Hovered/Focused/Pressed only — Disabled/Dragged explicitly recorded as undocumented, not omitted), motion (qualitative, no component-scoped tokens), usage guidance, accessibility (including the "accessible name must include the same first word as the visible label" rule), the full token catalogue, five explicit source-conflict/unknown entries, and related contracts. No missing-official-fact defect found; no design-stage correction is required.

## Architecture compliance

`ARCHITECTURE.md` demand-scopes exactly the confirmed `RepoExplorerPane` scenario (small size, primary-container color, required label, optional icon) and defers every unselected official surface with an explicit reason traced to a `DESIGN.md` section. The "Selected and deferred Material surface" and "Renderer mapping and gaps" tables use the required Decision/Status vocabulary (`implement-now`/`defer`, `direct`/`missing`/`not-applicable`) throughout, with exact-version evidence cited for every `direct` row.

Independently re-verified against the installed artifact (not merely trusted from the architecture's own citations):

- `node_modules/@m3e/web/package.json` confirms `2.7.4`, matching the declared `Renderer revision`.
- `FabElement.d.ts`'s class JSDoc documents `@slot - Renders the icon` (default slot) and `@slot label` exactly as cited, with a worked extended-FAB example (`<m3e-fab extended><m3e-icon>add</m3e-icon><span slot="label">Add</span></m3e-fab>`) structurally identical to the selected composition.
- `M3eFabElement.variant` JSDoc default is literally `"primary-container"`, confirming the "documented Material default" claim.
- `FabVariant` (`FabVariant.d.ts`) is `"primary" | "primary-container" | "secondary" | "secondary-container" | "tertiary" | "tertiary-container" | "surface"` — no `"branded"` member, independently confirming the architecture's `missing`-at-renderer classification for the branded color style DESIGN.md documents.
- The compiled `fab.js` shadow stylesheet contains `::slotted(svg:not([slot])) { width: 1em; height: 1em; }` and `::slotted(:not([slot])) { font-size: inherit !important; flex: none; }`, confirming the `direct` icon-slot classification with real package evidence (not slot-name similarity).
- `FabSizeToken.small` in `fab.js` resolves `containerHeight` to `56px` (`DesignToken.density.calc(-3)` term is `0` at density scale 0), `iconSize`/`extendedIconSize` to `24px`, `extendedLeadingSpace`/`extendedTrailingSpace` to `MeasurementToken.space200`, and `iconLabelSpace` to `MeasurementToken.space100`. Independently traced `space(unit) = 8 * (unit/100)px` in `all.js`, giving `space200 = 16px` and `space100 = 8px` — an exact match to DESIGN.md's small-size catalogue (56/24/16/8/16) with no adjustment, and distinct from the unrelated `M3E-006` Button defect (which uses `space250 = 20dp`, not `space200`). No new `m3e-defects.md` entry is warranted for this family; the architecture's claim of no divergence is confirmed, not merely asserted.

Ownership, public Vue API, token contract (correctly selects no `--md-comp-extended-fab-*` token — no confirmed contextual customization scenario), state precedence/restoration (no controlled renderer state, so accepted/rejected-intent tracing is correctly not-applicable), migration plan, acceptance criteria, risks, and forbidden list are all present and internally consistent. The shared `m3eFab.d.ts` Vue template-type shim (pre-existing infrastructure already used by `floatingActionButton`) is extended by one additional `Pick` member (`extended`) rather than duplicated — a minimal, package-derived, backward-compatible addition consistent with `docs/component-adapter.md`'s renderer-typing rules, not a new adapter framework.

No architecture-owned defect found.

## Implementation compliance

`MDExtendedFab.vue` matches every architecture decision: single raw `m3e-fab` host, `inheritAttrs: false`, pinned `size="small"`/`variant="primary-container"`/`extended="true"` renderer constants typed against exported `FabSize`/`FabVariant`/`M3eFabElement`, explicit `label`→named-slot-text+`aria-label` mapping, optional `#icon` slot projected to the renderer default slot with a DEV-only single-direct-SVG validation that correctly excludes the `label`-slotted span from its "icon content" scan, and an explicit host-attribute allow-list (`id`, `title`, `data-*`, merged `class`/`style`) rejecting every other attribute/listener including `aria-label`, `disabled`, `disabled-interactive`, `lowered`, `size`, `variant`, and link/form attributes. No shadow-DOM inspection, no `m3e-icon`/`MDSymbol` dependency, no public token, no `!important`.

`MDExtendedFab.test.ts` (20 tests) independently re-run and passed: renderer-constant pinning, label→text/`aria-label`, icon-present/omitted paths, DEV-warning true/false paths (empty→no warning, bare text→warning, multi-element→warning), click forwarding, and the full host-attribute boundary (static, merge, reactive add/remove/re-add, rejection, undeclared listener).

`MDExtendedFab.browser.spec.ts` (4 tests) independently re-run and passed: accessible name + pointer activation via the icon, Enter/Space keyboard activation, rejected dynamic renderer-state fallthrough (including across repeated toggles, reading real custom-element properties, not attributes), and the 56/24/16/8/16 numeric geometry contract measured from real rendered boxes. This satisfies `src/shared/ui/material/AGENTS.md`'s requirement that fixed official geometry get browser-level numeric proof, not merely a visual baseline.

`MDExtendedFab.stories.ts` fixtures are production-valid for every semantic role actually exercised (a real filled SVG "add" glyph shared across every icon-bearing fixture — never placeholder text or an outlined icon), correctly tagged (`visual` only on `VisualStates`/`RealInteractionFeedback`), titled per the catalogue convention (`Material 3/Components/Extended FAB/MDExtendedFab`), and use `autodocs` consistent with the established selective-Autodocs convention.

## Migration and legacy removal

`MIGRATION.md`'s consumer inventory is independently reproducible: `RepoExplorerPane.vue` (product) and `FabContainer.stories.ts` (Storybook fixture) were the only two legacy `MDExtendedFab` references; both are now confirmed migrated to the canonical `MDExtendedFab` imported from `@shared/ui/material`. `FabContainer.stories.ts`'s use of the fixed canonical configuration required no new architecture decision and was correctly folded into migration rather than routed back.

Legacy-to-canonical translation (`size`/`color` defaults → fixed constants; `label` → `label`; `md-symbol="add"` ligature → inline filled SVG `#icon` slot; unused `tooltip`/`loading` dropped) is faithfully applied at both call sites with byte-identical canonical SVG path data. Confirmed by direct inspection: `RepoExplorerPane.vue:194-206` renders `<MDExtendedFab label="Add" @click="onClickAdd">` with an inline `<svg>` `#icon`; `RepoExplorerPane.test.ts` correctly splits its single `@shared/ui/Button` mock into separate `@shared/ui/Button` (FabContainer only) and `@shared/ui/material` (MDExtendedFab) mocks.

Legacy removal independently confirmed by filesystem inspection: `src/shared/ui/Button/` no longer contains `MDExtendedFab.vue`/`.test.ts`/`.stories.ts`; its barrel export is gone; `tests/e2e/visual/shared-ui/` no longer contains `md-fab-family.spec.ts`; `tests/e2e/storybook/focusIndicator.spec.ts` retains only its `MDButton`/`MDIconButton` blocks with no `MDExtendedFab`/`extended-fab` reference remaining. No compatibility alias exists.

Preserved-scenario proof (`RepoExplorerPane.test.ts`'s 26 existing cases, including the `true`/`false`/`undefined` visibility-guard matrix) and blast-radius proof (`fab-container.spec.ts`'s pane-anchoring geometry assertions against the migrated `FabContainer` + `MDExtendedFab` composition) are the correct existing proof tier for this page (no pre-existing `RepoExplorerPane` application E2E), matching `docs/testing/architecture.md`'s "shared change does not automatically require every product suite" rule.

## Proof and stage verification

Independently re-ran (not merely trusted from prior stage reports) the following verifier-managed focused checks in this review's own environment, all passed:

- `pnpm verify --only type-check` — passed.
- `pnpm verify --only unit-tests --files src/shared/ui/material/components/extendedFab/MDExtendedFab.test.ts src/pages/RepoExplorer/RepoExplorerPane.test.ts` — passed.
- `pnpm verify --only storybook-behavior --files src/shared/ui/material/components/extendedFab/MDExtendedFab.browser.spec.ts` — passed (4/4), including the real-browser numeric geometry contract.
- `pnpm verify --files src/shared/ui/material/components/extendedFab/MDExtendedFab.visual.spec.ts --profile local --only visual` — **passed** (4/4) against the four existing colocated baselines (`md-extended-fab-states-linux.png`, `-hover-`, `-focus-`, `-pressed-linux.png`).

**Resolution of the flagged verification gap**: `IMPLEMENTATION.md`'s "Stage verification" records that the implementation-stage worker's sandbox could not start the Podman-backed Playwright container needed for the `visual` lane — the command failed at container launch, before any per-test screenshot comparison, and that session generated no baselines. This review's own environment does not have that limitation: the identical verifier-managed visual command (`pnpm verify --files .../MDExtendedFab.visual.spec.ts --profile local --only visual`) started the Podman-backed container successfully and all four tests passed against the four baseline PNGs already present in `MDExtendedFab.visual.spec.ts-snapshots/`. This confirms (a) the podman failure recorded in `IMPLEMENTATION.md` was a session/environment-specific limitation, not a defect in the spec, fixtures, or component — consistent with the task context's observation that a different visual spec ran successfully in the migration-stage worker's own session; and (b) the four baselines already colocated in the family directory are valid, current, and match the present rendered output — they required no regeneration or operator action in this review. No residual visual-proof gap remains for this family; `IMPLEMENTATION.md`'s pre-merge operator instruction is superseded by this review's own passing run and does not block completion.

No component-owned proof gap remains. `docs/testing/storybook.md`/`docs/testing/migration-plan.md` correctly place `MDExtendedFab.browser.spec.ts` and `MDExtendedFab.visual.spec.ts` at the owner-local colocated path for a canonical Material family migration (not central legacy location).

## Blockers

None.

## Major issues

None.

## Minor issues

None.

## Accepted risks

1. **Focus-indicator source-conflict** (carried from `ARCHITECTURE.md` "Risks", still valid): `DESIGN.md` documents no distinct official focus-indicator token path for the Primary-container (tonal-container) color set at any size. The renderer's shared, non-variant-scoped `m3e-focus-ring` default is accepted as-is without an exact official token trace. This is an official-catalogue gap, not an implementation shortcut, and is explicitly recorded rather than silently treated as `direct`.
2. **No documented label-only geometry** (carried from `ARCHITECTURE.md` "Risks", still valid): `DESIGN.md` documents no official minimum-width/leading-space value for the label-only (no-icon) small/medium/large configurations. The label-only rendering path is implemented and covered by the `VisualStates` screenshot for visual completeness, but carries no numeric geometry proof obligation beyond what the renderer naturally produces. A future confirmed label-only scenario should revisit this gap.
3. **Exact-version pinning**: every `direct` classification (icon-slot sizing/color handoff, small-size geometry constants, `extended`/`label`-slot composition, `primary-container` default) is confirmed against the exact installed `@m3e/web@2.7.4` artifact. A future consumed renderer upgrade must revalidate these before the family artifacts can be reused as-is, per `docs/m3e-defects.md`'s "every consumed renderer update revalidates non-resolved entries" rule (no entry currently exists for this family, and none is warranted today).

None of these represent missing proof, unresolved findings, incomplete migration, or deferred required work — each is a bounded, explicitly documented, non-blocking limitation already present in `ARCHITECTURE.md` and confirmed still accurate by this review's own independent renderer-artifact inspection.

## Items not required

Correctly deferred with no current-scenario demand (verified against `ARCHITECTURE.md`'s "Selected and deferred Material surface" and independently against the installed renderer where applicable): medium/large sizes; secondary/tertiary/non-container-primary/non-container-secondary/non-container-tertiary/surface color styles; the branded color style (`missing` at the renderer — `FabVariant` has no `"branded"` member, independently confirmed); baseline (pre-Expressive) geometry; disabled state (the product omits the action rather than rendering a disabled Extended FAB — matches DESIGN.md's undocumented Disabled state); lowered elevation; tooltip and loading/busy presentation; link/form renderer capability; any `--md-comp-extended-fab-*` public token; FAB↔Extended-FAB scroll-collapse/container-transform motion and FAB-menu (owned by `floatingActionButton`/future `fab-menu`, not composed here); a dependency relationship on `floatingActionButton`'s public `MDFab` (confirmed independent — no shared token namespace, no composition through `MDFab`).

## Routing evidence

No routing required. `Required return family: none`, `Required return stage: none`. No official-fact defect (routes to design), no demand/API/ownership/renderer-strategy/proof-ownership/migration-plan defect (routes to architecture), no component-code/token/mapping/export/fixture/local-proof defect (routes to implementation), and no consumer/scenario/legacy-removal/migration-proof defect (routes to migration) was found during this independent review. The one verification gap named in this invocation's context (the implementation-stage Podman/visual-lane limitation) is resolved directly by this review's own passing re-run against the existing baselines, per "Proof and stage verification" above, and requires no stage correction.
