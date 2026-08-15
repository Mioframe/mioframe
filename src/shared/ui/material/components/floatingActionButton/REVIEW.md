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

Reviewed the complete current `floatingActionButton` family after the DEV-diagnostic wording correction. The selected library-only contract remains an icon-only Medium FAB in Primary-container color, with a required accessible action label and native activation. There is still no product consumer; `MDExtendedFab`/`FabContainer` remain separately owned and unchanged.

This review specifically re-checks whether the latest correction — removing the word "decorative" from the `warn(...)` string emitted by `MDFab.vue` and updating the two matching assertions in `MDFab.test.ts` — resolves the single minor issue recorded by the prior review, without introducing a new defect and without unauthorized scope creep.

## Official design compliance

No design fact changed. The selected Material facts remain represented correctly:

- Medium FAB is selected because Material recommends it for most situations; it is not described as an official default size.
- Primary-container / on-primary-container remains the documented Material default color mapping.
- FAB icon content is icon-only, using filled Material-compatible artwork.
- Unavailable actions remain omitted rather than exposed as disabled.

`DESIGN.md` is unchanged from the prior review pass; no design correction is required.

## Architecture compliance

`ARCHITECTURE.md` is unchanged from the prior review pass and remains ready. It correctly distinguishes the three independent facts (Material recommends Medium; Material documents Primary-container as the default color mapping; `@m3e/web@2.7.4` independently defaults its renderer size input to `medium`), correctly classifies the direct-SVG composition, and correctly documents decorative accessibility, `viewBox`, `currentColor`, and filled-versus-outlined artwork as caller-contract/review requirements rather than runtime-validated properties (`ARCHITECTURE.md`, "Public Vue API" `#icon` slot row; "Implementation passes" #2, #8; "Acceptance criteria"; "Forbidden").

The current correction stays inside this contract: it changes only the diagnostic's wording to match the already-architected runtime check, and does not add new runtime SVG-shape/semantic validation, a new public prop/slot/token, or any renderer strategy change. No architecture defect remains and no architecture rerun is required.

## Implementation compliance

Verified the current `MDFab.vue` and `MDFab.test.ts` directly (not merely the pass description):

- The DEV check itself is unchanged:

  ```ts
  children.length !== 1 ||
    !(icon instanceof SVGSVGElement) ||
    icon.namespaceURI !== 'http://www.w3.org/2000/svg';
  ```

- The warning string now reads exactly: `"MDFab: the \`icon\` slot must render exactly one direct inline SVG root."`— it no longer claims "decorative," and it describes precisely the condition the runtime check validates (exactly one direct child, that child is an`SVGSVGElement`in the SVG namespace). It makes no claim about`aria-hidden`, absence of interactive descendants, `viewBox`, `currentColor`, or filled-versus-outlined artwork.
- `MDFab.test.ts`'s two DEV-warning assertions (`'warns in DEV when the icon slot is empty'` and `'warns in DEV when the icon slot is bare text...'`) both now assert `expect.stringContaining('must render exactly one direct inline SVG root')`, which matches the corrected production string exactly.
- No other line in either file changed: the renderer constants, host-attribute allow-list, click forwarding, `label`/`aria-label` mapping, and the `#icon` slot TSDoc (which already correctly separates the caller-contract filled/decorative requirements from the runtime-validated SVG-root condition) are all unchanged from the prior review pass.
- Ran the full `MDFab.test.ts` suite directly (`npx vitest run src/shared/ui/material/components/floatingActionButton/MDFab.test.ts`) as independent verification rather than accepting the implementation pass's report alone: all 13 tests pass, including both DEV-warning assertions against the corrected string.
- Repository-wide search confirms no other production or documentation file asserts the old "exactly one direct decorative inline SVG root" wording as current behavior. The two remaining occurrences are historical: `ARCHITECTURE.md`'s "Implementation passes" #8 quotes the old wrong wording only to describe the defect that was corrected, and the previous `REVIEW.md` (now replaced by this file) recorded the same historical finding.
- `MDFab.stories.ts`'s comment "shares this one decorative direct-SVG glyph" describes the artwork's caller-contract decorative role (consistent with `ARCHITECTURE.md`'s own use of "decorative" to describe the selected content contract), not the DEV runtime check; it is accurate and unrelated to this correction.

This is a precise implementation-owned fix of exactly the recorded minor issue, with no new runtime SVG-shape/semantic validation added (satisfying `ARCHITECTURE.md`'s "Forbidden" list) and no public API change.

`IMPLEMENTATION.md` was not touched by this pass. Its existing text already describes the DEV validation precisely ("runtime validation checks only that exactly one direct SVG root exists as a child of the host") and contains no reference to the old "decorative" wording that the current runtime string would now contradict, so nothing in `IMPLEMENTATION.md` is stale or inaccurate as a result of this change.

## Migration and legacy removal

Unchanged from the prior review. `MIGRATION.md` remains current: the correction is family-local and does not invalidate it. There is still no canonical product consumer, the legacy plain `MDFab` owner remains removed, and the separate `MDExtendedFab` scenario remains unchanged. No migration rerun is required.

## Proof and stage verification

- Independently re-ran `MDFab.test.ts` (13/13 passed), confirming the corrected warning string and its two matching test assertions are mutually consistent and that no other test regressed.
- The remaining focused proof recorded by implementation (`type-check`, `format`, `eslint`, `storybook-build`, `storybook-behavior`, `visual`) is unaffected by a warning-string-only change to a DEV-only code path and a matching test-string update; none of those checks depend on the literal wording of this message. No part of that proof needed to be rerun to validate this correction, and this review did not fabricate or claim to have rerun a broad or podman-backed pipeline.
- `MDFab.browser.spec.ts` and `MDFab.visual.spec.ts` remain owner-local per `docs/testing/migration-plan.md` (Stage S1–S4 conventions for a canonical Material family migration) and are unaffected by this change; neither file was modified.
- Authoritative GitHub CI on the exact PR head remains outside this review's scope and does not override or substitute for this finding.

Preserved operator evidence remains unchanged from the prior review: ripple behavior was reported visually correct; the earlier wrong-size/bare-text composition defect is resolved by the direct-SVG path and numeric geometry proof. No new operator defect was reported during this pass.

## Blockers

None.

## Major issues

None.

## Minor issues

None. The previously recorded minor issue (the DEV diagnostic in `MDFab.vue` claiming "decorative" semantics that the runtime check does not validate) is resolved: the warning string now describes only the SVG-root condition actually checked, and the two matching `MDFab.test.ts` assertions were updated to match. Independent test execution confirms the family's proof remains internally consistent after the change.

## Accepted risks

None.

## Items not required

- No architecture rerun.
- No migration rerun.
- No new icon abstraction or `m3e-icon` exposure.
- No broader FAB size/color/disabled/link/form/tooltip/FAB-menu API.
- No runtime SVG artwork or accessibility parser — none was added, consistent with `ARCHITECTURE.md`'s "Forbidden" list.
- No update to `IMPLEMENTATION.md` was required, since its existing DEV-validation description was already accurate and not contradicted by the corrected runtime string.

## Routing evidence

No route required. The family is complete: design and architecture are current and unchanged, the implementation correction precisely matches the diagnostic wording to the actual runtime-validated condition without adding new validation or changing public API, migration remains valid with no consumers, and independent test execution confirms the fix. No blocker, major issue, or minor issue remains.
