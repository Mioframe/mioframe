# Floating action button review

Verdict: compliant
Required return family: none
Required return stage: none
Completion status: complete
Final workflow verification readiness: ready
Operator visual status: defect-reported
Blockers: none
Major issues: none
Minor issues: none
Accepted risks: none

## Goal and scenarios reviewed

Full independent re-review of the complete `floatingActionButton` family after the architecture and implementation correction round that followed the prior `blocked` review. Reviewed as a fresh, isolated worker with no memory of and no dependence on the workers that authored or corrected `ARCHITECTURE.md`/`IMPLEMENTATION.md`; every artifact and code file was read directly rather than trusted from prior summaries.

Scope: the complete no-consumer, icon-only canonical `MDFab` — Medium size, Primary-container color, required accessible action label, ordinary native activation — plus its Storybook/test/browser/visual proof, `MIGRATION.md`'s no-consumer and legacy-removal claims, and the separately owned `MDExtendedFab`/`FabContainer`/`RepoExplorerPane` scenario (checked only to confirm it remains untouched and out of scope).

The two prior blockers under independent re-verification:

1. the canonical icon contract/fixtures must use filled Material-compatible artwork, not outlined/stroke-only artwork;
2. architecture/implementation text must not describe the selected Medium/Primary-container configuration as a single "official standalone default."

Plus the prior minor issue: `IMPLEMENTATION.md`'s DEV-validation wording must describe precisely what the runtime check inspects.

## Official design compliance

`DESIGN.md` is unchanged by this correction round and remains current under the repository workflow. Independently re-confirmed against the live Material3 MCP source (not merely re-read from `DESIGN.md`'s own restatement):

- `components/floating-action-button/guidelines.md` (fetched fresh this review): "### Icon ... Use a filled icon instead of an outlined icon." — matches `DESIGN.md`'s "Anatomy and content" guidance verbatim in substance.
- The same guidelines page: "There are three FAB sizes: 1. FAB 2. Medium FAB (most recommended) 3. Large FAB" — Medium is described as "most recommended," never as a documented default size. Matches `DESIGN.md`'s "Variants and configurations" table and the corrected architecture wording.
- The structured token/spec data independently sampled for the sibling Extended FAB family (`/components/extended-fab/specs`) explicitly labels "Primary container & on primary container (default)" among its color roles, corroborating `DESIGN.md`'s "Primary container & on-primary container is the documented default" claim for this family's own equivalent color-role list.
- `@m3e/web@2.7.4`'s installed `FabElement.d.ts` independently confirms `variant` `@default "primary-container"` and `size` `@default "medium"` — the renderer's own independent default, consistent with, but not the source of, the Material recommendation/default facts above.

No design-stage defect. `DESIGN.md` needs no correction.

## Architecture compliance

Read the complete current `ARCHITECTURE.md`, not only the sections the correction summary claimed to touch.

**Filled-icon contract**: the Goal, Selected/deferred surface table, Public Vue API (`#icon` slot row), Implementation pass 2 and 4, Acceptance criteria, and Forbidden section all now require filled, Material-compatible icon artwork and explicitly reject outlined/stroke-only artwork. The requirement is correctly scoped as a caller-contract/fixture-selection requirement, not new runtime SVG-shape validation (consistent with `AGENTS.md`'s renderer-boundary and forbidden-approach rules).

**"Official standalone default" wording**: grepped the complete file. The literal phrase appears only in negation/prohibition contexts (Acceptance criteria, Forbidden, and the "Implementation readiness" narrative describing what was corrected) — never as a positive claim anywhere in the document, including the Goal, the Selected/deferred surface table, the renderer-mapping table, or any other section not explicitly called out by the correction summary. The document now consistently states the three-fact distinction (Medium = Material's most-recommended size, not a documented default size; Primary-container = the documented Material default color mapping; `medium` = the independent `@m3e/web@2.7.4` renderer default) everywhere the pair is discussed, including the Goal paragraph and the renderer-mapping table row, which are outside the two rows the revision summary called out.

**Renderer mapping classification** (independently re-verified against the installed `@m3e/web@2.7.4` package, not accepted merely because implementation matches architecture's claim):

- `dist/src/fab/FabElement.d.ts`'s own JSDoc `@example` shows `<m3e-fab><m3e-icon>add</m3e-icon></m3e-fab>` as the illustrated usage — the renderer's own example uses `m3e-icon`, not a raw SVG.
- However, the installed `dist/fab.js` stylesheet independently proves a raw direct SVG is an equally valid, CSS-supported composition: `.close-icon, ::slotted(svg:not([slot])), ::slotted(svg[slot="close-icon"]) { width: 1em; height: 1em; }` sizes any directly slotted `<svg>` without a `slot` attribute, and the per-size rule `:host([size="medium"]:not([extended])) .icon { font-size: ${FabSizeToken.medium.iconSize}; ... }` resolves `iconSize` to `var(--m3e-fab-medium-icon-size, var(--m3e-fab-icon-size, ${space(350)}))` where `space(350) = 8 * (350/100) = 28px`, matching `DESIGN.md`'s 28dp medium icon size exactly. The rendered `<slot class="icon" aria-hidden="true">` wrapping the default slot is also renderer-marked `aria-hidden`, corroborating the decorative-icon-slot contract.
- This satisfies `AGENTS.md`'s renderer-composition-contract option 2 ("prove with package evidence and browser-level result that the alternative child content is equivalent") rather than merely inferring equivalence from slot-name or markup shape. The existing browser proof (`MDFab.browser.spec.ts`) independently confirms the resulting public 28×28 CSS-px icon box at runtime. The `direct` classification is genuinely earned, not merely asserted.
- Container geometry (`min-height` `var(--m3e-fab-medium-container-height, var(--m3e-fab-container-height, 80px))`) matches `DESIGN.md`'s 80dp medium container height; the actual rendered 80×80 CSS-px host box is independently confirmed by the same browser spec's numeric assertions.

No architecture defect remains.

## Implementation compliance

`MDFab.vue`, `MDFab.stories.ts`, `MDFab.test.ts`, `MDFab.browser.spec.ts`, `MDFab.visual.spec.ts`, and `index.ts` were read directly.

- **Icon artwork**: every canonical fixture — `MDFab.stories.ts`'s single shared `AddIcon` helper (used by `Default`, `VisualStates`, `BehaviorContracts`, `HostAttributeBoundary`, `GeometryContract`, and `RealInteractionFeedback`) and `MDFab.test.ts`'s `directSvgIcon`/`DynamicAttrsWrapper` fixtures — now render `<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />` with `fill="currentColor"` and no `stroke`/`fill="none"` attribute. This is the standard Material Icons/Material Symbols "add" glyph: a single closed filled contour, geometrically a plus shape with 2-unit-wide bars in a 24-unit viewBox. No fixture retains the previous stroke-only `M12 4v16m8-8H4` path, and no `stroke` attribute or `fill="none"` appears anywhere in the family's stories/tests/production code except in comments describing the now-retired artwork.
- **DEV-validation wording**: `IMPLEMENTATION.md` now states precisely that runtime validation checks only "that exactly one direct SVG root exists as a child of the host." Read against the actual `MDFab.vue` `onMounted` check — `children.length !== 1 || !(icon instanceof SVGSVGElement) || icon.namespaceURI !== 'http://www.w3.org/2000/svg'` — the wording is exact: it does not claim to validate decorative semantics, `viewBox`, `currentColor`, or filled-versus-outlined artwork, which remain caller-contract/TSDoc-documented requirements. No new runtime SVG-shape/semantic validation was added.
- **"Official standalone default" in production code**: grepped `MDFab.vue` and `MDFab.stories.ts`; the phrase does not appear. `MDFab.vue`'s renderer-constants comment and `MDFab.stories.ts`'s Autodocs component description both state the three-fact distinction.
- **Geometry/composition proof intact**: `MDFab.browser.spec.ts` unchanged in structure — still proves accessible role/name, pointer activation through the visible icon, Enter/Space activation, an 80×80 CSS-px host box, a 28×28 CSS-px icon box, and rejected dynamic renderer-state fallthrough across add/remove/re-add. `MDFab.visual.spec.ts` unchanged in structure — still screenshots only resting/hover/focus/pressed appearance with no behavior assertions. Both consume the same canonical Storybook fixtures by story id, so both automatically exercise the new filled artwork; neither needed direct edits, consistent with `IMPLEMENTATION.md`'s account. The colocated snapshot PNGs were inspected directly (`md-fab-states-linux.png` and the three interaction-state baselines) and show a plausible filled plus-glyph render at the documented geometry; source-level inspection of the fixture markup (not the screenshot) is the primary compliance evidence per the skill's rule against treating a visual baseline as the sole oracle.
- **No scope creep**: no new prop, slot, emit, token, size/color option, disabled/extended/lowered/link/form surface, generic icon abstraction, or runtime SVG semantic validation was introduced. `MDFab.vue`'s public API, host-attribute allow-list, and renderer constants are byte-for-byte the same shape as before the correction, only the TSDoc/comment wording and the fixture artwork changed. This matches `ARCHITECTURE.md`'s Forbidden section.

No implementation defect remains.

## Migration and legacy removal

`MIGRATION.md` is unchanged by this correction round (per the workflow, migration does not automatically rerun unless the correction changes consumer-facing semantics, and this correction changed only icon artwork and documentation wording — no consumer-facing semantic changed). Independently re-verified rather than accepted on the strength of the artifact's own claim:

- `rg`-equivalent search across `src/pages`, `src/widgets`, `src/features`, `src/entities` for `MDFab`/`m3e-fab`/`floatingActionButton` found no import or rendered instance.
- The only production reference to `MDFab` outside the family directory is the intended public barrel re-export in `src/shared/ui/material/index.ts` (`export { MDFab } from './components/floatingActionButton/index';`).
- `FabContainer.vue`/`FabContainer.stories.ts`'s two `MDFab` mentions are prose/TSDoc describing the container's generic slot contract, not imports or rendered instances — confirmed by direct inspection of both files.
- `src/shared/ui/Button/` contains no `MDFab.vue`/`.test.ts`/`.stories.ts`; only the separately owned `FabContainer.*` and `MDExtendedFab.*` files remain.
- `tests/e2e/storybook/focusIndicator.spec.ts` contains no `MDFab`/`m3e-fab` reference. `tests/e2e/visual/shared-ui/md-fab-family.spec.ts` still exists but every test title and reference inside it is `MDExtendedFab`-only — no `MDFab` or raw `m3e-fab` reference remains, matching `MIGRATION.md`'s precise claim.

No migration or legacy-removal defect remains.

## Proof and stage verification

`IMPLEMENTATION.md` and `MIGRATION.md` record focused verifier-managed passes (unit-tests, type-check, format, eslint, storybook-build, storybook-behavior, visual) covering exactly the changed files. This review did not re-execute those commands (not required for independent review completion under the workflow — GitHub CI on the exact PR head remains the authoritative final gate), but independently confirmed their premises are true by reading the actual current source: the fixture artwork genuinely changed as claimed, the DEV-check wording genuinely matches the runtime code, and the browser/visual spec files genuinely retain their pre-correction assertions unweakened.

**Preserved operator evidence** (carried forward verbatim per the correction workflow, not reinterpreted): the operator-reported ripple/state-layer behavior was previously reported and is accepted as visually correct; this review found nothing that would reopen it. The previously reported size/bare-text-icon composition defect was already resolved by the direct-SVG composition correction in an earlier round, and this review's independent geometry/composition inspection (above) confirms that resolution remains intact — it is not reopened or re-litigated here.

## Blockers

None.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- A generic icon abstraction or `m3e-icon` exposure — the filled-artwork requirement is satisfied by fixture selection, not a new component.
- Broader FAB size/color/disabled/extended/lowered/link/form API — explicitly deferred, no current scenario selects it.
- Runtime SVG-shape/semantic validation to distinguish filled from outlined artwork — remains a documented caller-contract requirement, correctly not runtime-enforced.
- Re-running migration — no consumer-facing semantic changed by this correction round; the existing no-consumer inventory and legacy-removal record remain accurate on independent re-check.
- Tooltip composition, adaptive placement/sizing, transforms, Extended FAB, FAB menu, alternate colors/sizes, lowered elevation, and public FAB tokens — outside the accepted no-consumer library scope.

## Routing evidence

No route required. Both prior blockers (filled-icon contract/fixtures; "official standalone default" wording) and the prior minor issue (DEV-validation wording precision) are independently confirmed resolved across the complete current `ARCHITECTURE.md`, `IMPLEMENTATION.md`, and all production/proof files — not only the sections the correction summaries claimed to touch. No new defect, scope creep, or ownership drift was found. The family is ready for architect-owned PR creation and exact-head GitHub CI.
