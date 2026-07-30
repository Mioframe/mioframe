# Button review

Review ref/commit: working tree on `refactor/material-docs-ownership` at `239ec9999eccf2e29db60f025dc1bebe9067acc8`
Review date: 2026-07-30
DESIGN.md status: `current`
ARCHITECTURE.md status: `ready`
IMPLEMENTATION.md status: `complete`
MIGRATION.md status: `complete`
Operator visual status: required
Verdict: blocked

## Goal and scenarios reviewed

Reviewed the complete demand-scoped Button family: filled, outlined, and text actions; extra-small and small sizes; required label and optional leading icon; native button/submit behavior; disabled behavior; loading composition; 48 dp target geometry; keyboard, pointer, focus, press, and reduced-motion behavior; contextual text tokens; Snackbar action integration; and all current product consumers inventoried by the migration.

The review also checked deferred official surface against current demand. Toggle behavior, elevated and tonal colors, medium through extra-large sizes, square shape, trailing icons, links, form-data fields, and disabled-interactive behavior remain correctly excluded rather than partially exposed.

## Official design compliance

`DESIGN.md` records all four official Button tabs and the complete associated Button token resource, separates official facts from renderer and product demand, and documents its verified newest-known source snapshot. Its source cache is older than the nominal freshness threshold, but the failed 2026-07-30 refresh preserved a complete verified snapshot and found no evidence of a newer Button revision. This is an accepted source-tooling risk, not an omitted design fact.

The selected implementation is consistent with the documented official subset: label-first anatomy, optional leading icon, selected colors and sizes, round shape, native action semantics, minimum target, state feedback, disabled presentation, and official contextual text token paths.

## Architecture compliance

The ready architecture selects the narrowest complete surface required by current consumers and keeps the single `m3e-button` host as the interaction and native-semantics owner. It does not duplicate renderer press state, motion, ripple, focus, or disabled behavior. Renderer types, elements, and private variables remain confined to the Material family.

Loading remains presentation-only. Button owns icon replacement, decorative semantics, `aria-busy`, 24 px geometry, and `currentColor`; consumers retain disabled and re-entry ownership. The completed Loading Indicator family satisfies the declared dependency gate.

The seven contextual text tokens are demand-backed by Snackbar. Their official public names and defaults are family-owned, while exact `--m3e-*` mappings remain private. The simpler alternative of retaining only the resting token would not preserve Snackbar's rendered transient label and state-layer colors, and the broader alternative of exposing unconsumed Button tokens is correctly rejected.

No architecture deviation or unresolved coding decision was found.

## Implementation compliance

`MDButton.vue` exposes the accepted Vue API only: required `label`; selected `color`, `size`, `nativeType`, `disabled`, and `loading` props; optional leading `icon`; and `click(MouseEvent)`. Defaults and exact optional typing agree with the architecture. False Boolean values are property-bound, global/native attributes fall through to the semantic host, and click payloads remain native.

The implementation contains no descendant color cascade, `!important`, shadow-DOM access, duplicate interaction state, timing hack, compatibility alias, contextual icon token, or public renderer vocabulary. Token declarations, renderer mappings, and `token-api.md` agree on exactly seven selected public tokens.

Component contract proof covers defaults, retained values, Boolean mapping, fallthrough, submit mapping, event forwarding, icon/label composition, loading restoration, decorative accessibility, busy semantics, and independent disabled ownership. Real-browser proof covers activation, native form behavior, focus, disabled suppression, loading activation, minimum target behavior, color anatomy, and interaction states.

No implementation finding requires return to the implementation stage.

## Migration and legacy removal

The migration inventory covers all 22 source files importing the root `MDButton` export and the relevant raw renderer/token searches. Existing consumers already fit the canonical API. Snackbar is the only required consumer edit and now supplies inverse-primary to all seven selected contextual tokens while leaving its distinct Icon Button ownership unchanged.

Obsolete provisional Button token names are removed from executable source, no aliases remain, and no consumer outside `src/shared/ui/material` imports the renderer Button package, renders `m3e-button`, consumes renderer Button types, or uses private Button variables. Native controls and other Material families remain with their existing owners.

Product-owned browser/provider waits retain pending text, disabled-conflict guards, re-entry protection, and live status instead of being converted to Button loading. No consumer or legacy-removal finding requires return to migration.

## Proof and verification

Proof ownership is proportional and faithful: component contracts own the Vue adapter; Storybook behavior owns real browser interaction and rendered anatomy; bounded visual tests own stable appearance; Snackbar proof owns the contextual consumer handoff; app E2E preserves complete product scenarios.

The contextual behavior tests inspect the rendered `.md-button__label-text` owner for resting, hover, keyboard focus, and pointer press. Snackbar additionally asserts each selected public transient label/state-layer token. The visual lane contains bounded Button and Snackbar baselines for the same states. Review inspection of the new contextual and changed Snackbar pressed baselines found the intended inverse-primary label/state feedback without geometry or surrounding-anatomy drift.

The current-tree final completion gate recorded by migration is `pnpm verify:release`. Its logs show all 14 checks completed successfully, including 3,172 unit tests, 110 app E2E tests across the retained desktop/mobile matrix, 34 Storybook behavior tests, 219 visual tests, build/artifact/release checks, and release smoke tests. Existing lint warnings were non-failing and are unrelated to this family.

Automated proof is complete, but it does not substitute for the required operator assessment of visual quality and renderer-owned motion.

## Blockers

- Operator visual/motion acceptance is not recorded. The operator must assess selected Button variants, sizes, loading composition, pointer/keyboard state feedback, pressed-shape restoration, reduced-motion behavior, rapid successive activation, and Snackbar contextual states in the browser.

## Major issues

None.

## Minor issues

None.

## Accepted risks

- Official Web Expressive availability is documented as unavailable, so the installed m3e renderer is accepted only for the selected subset backed by observable browser proof.
- Rapid successive activation remains a subjective motion risk because official guidance does not provide normative Web parameters.
- The verified official source cache exceeded its freshness threshold; the 2026-07-30 refresh helper could not obtain a usable route list, but the complete prior snapshot was preserved and no newer Button revision was found.
- Loading Indicator retains dependency-owned exact-version workarounds M3E-001 and M3E-002; a future m3e update must revalidate them.

## Items not required

- No toggle, elevated, tonal, medium/large/extra-large, square, trailing-icon, link, form-data, or disabled-interactive API without new demand and revised architecture.
- No Button-owned browser/provider operation state, status messaging, disabled guard, or re-entry guard.
- No contextual icon token without a confirmed Button icon consumer.
- No renderer compatibility layer, interaction clone, descendant cascade, or private shadow-DOM contract.
- No migration of Icon Button, FAB, navigation, menu, or ordinary native HTML controls.

## Required return stage

Operator. No design, architecture, implementation, or migration correction is required. After explicit visual/motion acceptance is recorded, a fresh independent review must confirm that gate against the then-current resulting tree.

## Merge readiness

Should not merge until blockers are fixed. Automated gates and the resulting family review are otherwise complete, but repository policy requires explicit operator visual/motion acceptance before review completion and merge readiness.
