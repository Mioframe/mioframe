# Floating action button review

Verdict: blocked
Required return family: self
Required return stage: architecture
Completion status: blocked
Final workflow verification readiness: blocked
Operator visual status: defect-reported
Blockers: The selected icon contract and canonical visual fixture do not yet fully match the recorded Material guidance: DESIGN.md requires a filled icon, while the shared AddIcon fixture is a stroke-only path. Architecture also overstates Medium as an official standalone default instead of a selected recommended size.
Major issues: The canonical AddIcon used by every selected Storybook/browser/visual fixture renders `<path fill="none" stroke="currentColor">`. DESIGN.md records the official FAB guidance that the icon should use a filled icon rather than an outlined one. Because architecture omitted that selected content requirement, current visual proof can be stable while proving the wrong icon treatment.
Minor issues: Architecture repeatedly calls the medium primary-container configuration the "official standalone default". DESIGN.md distinguishes these facts: Medium is the most recommended size for general use; Primary container/on-primary-container is the documented color default. `@m3e/web@2.7.4` separately defaults its renderer size to `medium`. These must not be conflated into an official Material default-size claim.
Accepted risks: none

## Goal and scenarios reviewed

Reviewed the complete selected canonical `MDFab` family: a no-consumer, icon-only FAB using the selected Medium size and Primary-container color, with a required accessible action label and ordinary native activation. The separately owned `MDExtendedFab`/`FabContainer` product scenario was reviewed only to confirm it is not a canonical FAB consumer.

This review distinguishes full Material guidance from the demand-scoped library contract. Product placement, adaptive sizing, scroll behavior, transforms, and tooltip composition remain explicitly deferred; therefore `compliant` can only mean compliant with the selected contract, not exhaustive implementation of every FAB guideline.

## Official design compliance

`DESIGN.md` is current under the repository workflow and records the verified Material snapshot used by this family. It establishes:

- Medium: 80dp × 80dp with a 28dp icon and large-increased/20dp shape;
- Medium is the most recommended size for general use, not an explicitly documented default size;
- Primary container / on-primary-container is the documented default color mapping;
- FAB content is icon-only and the icon should be clear, understandable, and filled rather than outlined;
- unavailable actions should omit the FAB rather than render it disabled;
- on web, tooltip guidance exists but remains outside the currently selected library scope.

The geometry, color, label, enabled-only availability, and icon-only anatomy are represented correctly. The filled-icon guidance is not: the canonical `AddIcon` is stroke-only.

The live Material FAB routes currently require JavaScript and could not be independently text-extracted during this architect audit. Therefore this verdict is grounded in the repository's recorded official snapshot, whose last successful content is 2026-07-20 and whose 2026-08-14 refresh attempt is explicitly recorded as failed; no claim is made that we independently re-read newer live FAB prose.

## Architecture compliance

The minimum library API (`label`, constrained `icon` slot, native `click`, narrow generic host-attribute allow-list) remains appropriately demand-scoped. The direct-SVG restriction is a Mioframe/m3e integration contract, not an official Material content-format requirement; architecture is allowed to impose it because exact `@m3e/web@2.7.4` artifact behavior and browser proof establish the required selected geometry, color handoff, accessibility, and interaction without exposing renderer vocabulary.

The renderer evidence itself is sound: `@m3e/web@2.7.4` documents the FAB default slot as the icon role, documents renderer defaults `size="medium"` and `variant="primary-container"`, and its installed FAB stylesheet explicitly sizes a direct slotted SVG to `1em` while the medium size token resolves the icon size to 28px and the container height to 80px.

Two architecture corrections are required:

1. Carry the Material filled-icon guidance into the selected public/canonical icon contract and proof requirements. This does not require a new icon abstraction or renderer dependency; a caller-owned direct SVG remains the simplest mapping, but selected canonical fixtures must use filled Material-compatible artwork.
2. Replace "official standalone default" language with the exact source distinction: Medium is the selected recommended size; Primary-container is the documented Material color default; `medium` is also independently the renderer's default size.

## Implementation compliance

The production adapter correctly remains one typed `m3e-fab` host with explicit medium/primary-container renderer values, `inheritAttrs: false`, label-owned `aria-label`, native click forwarding, direct icon projection, and local attribute filtering. No renderer state, ripple, focus, elevation, motion, or geometry is recreated.

The previous geometry/composition defect is genuinely closed: all selected fixtures now use the same direct SVG path; browser proof exercises that same path and confirms an 80px × 80px public host and 28px × 28px public SVG icon; pointer activation is exercised through the visible SVG; the operator-reported ripple behavior remains accepted as correct.

However, the shared canonical `AddIcon` currently contains:

```html
<path d="M12 4v16m8-8H4" fill="none" stroke="currentColor" stroke-width="2" />
```

This is stroke-only artwork and therefore does not satisfy the recorded filled-icon guidance. The current visual baselines prove renderer stability around that artwork, not Material compliance of the artwork itself.

`IMPLEMENTATION.md` also slightly overstates DEV validation when it says the required icon composition is "exactly one direct decorative inline SVG root". Runtime validation only proves that exactly one direct SVG root exists; decorative semantics, `viewBox`, `currentColor`, and absence of interactive descendants remain caller-contract requirements rather than fully runtime-validated properties. This wording should be corrected when implementation is refreshed; adding complex semantic SVG validation is not required.

## Migration and legacy removal

No product consumer exists. Current migration evidence still shows no canonical `MDFab`, raw `m3e-fab`, or FAB renderer-token use in product layers. The former plain `src/shared/ui/Button/MDFab.*` owner remains removed, and `RepoExplorerPane` continues to use the separately owned `MDExtendedFab` through `FabContainer`.

The required correction is family-local and does not invalidate the no-consumer migration inventory. Under the scoped correction workflow, migration does not need to rerun unless the corrected architecture/implementation unexpectedly changes consumer-facing semantics.

## Proof and stage verification

Existing focused verification is meaningful for the contracts it covers: unit/type/lint/format/Storybook build/browser/visual lanes passed on the direct-SVG geometry correction. Numeric geometry proof is now appropriate and uses the same canonical composition path as visual proof.

Those green checks do not close the filled-icon finding because no current test or visual oracle compares the icon artwork against the recorded Material content guidance. The next implementation pass should replace the canonical story-local artwork with filled Material-compatible SVG artwork, keep the same 28px/80px geometry proof, refresh only affected FAB visual baselines after inspection, and rerun the focused owner-local checks.

## Blockers

1. Architecture does not carry the recorded Material filled-icon guidance into the selected icon contract/proof, and all canonical visual fixtures currently use stroke-only `AddIcon` artwork.
2. Architecture inaccurately describes Medium as part of an "official standalone default" instead of a selected recommended size; source wording must be corrected before the family can claim design compliance.

## Major issues

Canonical visual proof currently normalizes stroke-only icon artwork even though DESIGN.md explicitly records filled-icon guidance. This is a real Material-content mismatch, not a renderer defect.

## Minor issues

- Separate Material recommendation/default facts from renderer defaults: Medium = most recommended Material size for general use; Primary-container = documented Material color default; `medium` = independent `@m3e/web@2.7.4` renderer default.
- Correct implementation prose so DEV validation is not described as validating SVG semantics that the runtime check does not actually inspect.

## Accepted risks

None.

## Items not required

- Do not add a generic icon abstraction or expose `m3e-icon` merely to fix the artwork.
- Do not broaden FAB size/color APIs.
- Do not add runtime SVG-shape analysis to distinguish filled versus outlined artwork; document the caller contract and use production-valid canonical fixtures.
- Tooltip composition, adaptive placement/sizing, transforms, Extended FAB, FAB menu, alternate colors/sizes, lowered elevation, form/link behavior, and public FAB tokens remain outside the accepted no-consumer scope.

## Routing evidence

Route to `self/architecture` because the earliest defect is in selected-contract interpretation: the architecture omitted DESIGN.md's filled-icon content guidance and mischaracterized the Medium recommendation as an official default. After architecture is corrected, implementation should update the slot documentation/fixture artwork and affected proof, then a fresh independent review must re-evaluate the complete family. The existing MIGRATION.md may be preserved unless that correction changes consumer-facing semantics.
