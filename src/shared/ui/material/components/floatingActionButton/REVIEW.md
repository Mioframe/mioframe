# Floating action button review

Verdict: blocked
Required return family: self
Required return stage: architecture
Completion status: blocked
Final workflow verification readiness: blocked
Operator visual status: defect-reported
Blockers: canonical icon composition is not resolved consistently across the selected FAB proof; the dedicated geometry fixture uses renderer-compatible SVG content while canonical visual fixtures still use bare text content and exhibit the operator-reported wrong FAB size
Major issues: none
Minor issues: none
Accepted risks: none

## Goal and scenarios reviewed

Review the complete canonical plain Floating Action Button family for the selected no-consumer default: medium size, primary-container color, one icon, required accessible label, and native activation.

Operator evidence for this review:

- ripple behavior was visually checked and is correct;
- FAB size remains visually incorrect because the m3e library is being used with incorrect icon composition.

The size defect is unresolved and is part of the review input, not an optional positive-acceptance gate.

## Official design compliance

`DESIGN.md` remains the authority for the selected Medium FAB geometry: 80dp container and 28dp icon. No design-stage correction is required by this finding.

## Architecture compliance

The current architecture is incomplete for the selected icon role.

It classifies the public `icon` slot → m3e default slot mapping as `direct`, but does not fully define the production-valid child/content contract required for that classification. Exact-version `@m3e/web@2.7.4` evidence shows that FAB geometry depends on the slotted icon composition: the renderer applies its 28px icon sizing to the slot and has explicit sizing rules for supported icon-shaped content such as slotted SVG. A slot description alone does not prove that arbitrary text content is equivalent.

Architecture must define the supported canonical icon composition for `MDFab` and its proof fixtures, using the exact-version renderer documentation/examples and installed public styling contract. The public Vue API should remain renderer-independent; the correction must not leak `m3e-*` vocabulary to consumers.

This is an architecture finding because the current `direct` renderer-composition classification is underspecified. Route: `self → architecture`.

## Implementation compliance

The new `GeometryContract` story and browser test are individually useful: they use a slotted SVG and assert the selected 80×80 FAB / 28×28 icon geometry.

They do not close the actual defect because the canonical visual paths still use a different composition:

- `Default` uses bare `+` text for the icon role;
- `VisualStates` uses bare `+` text;
- `BehaviorContracts` uses bare `+` text;
- `HostAttributeBoundary` uses bare `+` text;
- `RealInteractionFeedback` uses bare `+` text.

`VisualStates` and `RealInteractionFeedback` therefore do not exercise the same production-valid icon composition as the geometry proof. A special proof-only fixture cannot establish correctness while the canonical visual fixtures continue to use content that bypasses the selected renderer composition contract.

After architecture resolves the icon composition, implementation must update the affected canonical stories/proof to use that same composition and keep the geometry assertion on the real selected path rather than a one-off alternative.

## Migration and legacy removal

No migration correction is currently required. The canonical plain FAB still has no product consumer; the legacy plain `MDFab` remains removed; `MDExtendedFab` is a separate family.

Per the scoped correction workflow, preserve the current `MIGRATION.md` unless the corrected architecture/implementation changes consumer-facing semantics or legacy disposition. The next independent review must verify that it remains valid.

## Proof and stage verification

Existing type/unit/build results do not resolve this finding. The issue is semantic consistency between renderer composition and the fixtures used as canonical visual proof.

Required correction proof:

- exact-version m3e documentation/artifact evidence for the selected icon child/content contract;
- production-valid canonical Storybook fixtures using that contract;
- browser numeric geometry proof for the same composition path: 80×80 host and 28×28 icon;
- visual proof for the corrected canonical FAB appearance;
- no private shadow-DOM inspection or renderer vocabulary leakage.

Exact-head CI remains architect-owned after the family returns from a successful independent review.

## Blockers

1. **Canonical icon composition is unresolved and visual proof uses an invalid/inconsistent path.**

   The dedicated geometry fixture proves correct geometry only with slotted SVG, while canonical visual stories continue to use bare `+` text. This contradicts the renderer-composition rules and matches the operator-reported wrong-size defect. Architecture must first define the valid icon composition; implementation must then make canonical proof use it consistently.

## Major issues

None beyond the blocker above.

## Minor issues

None.

## Accepted risks

None. Missing resolution of a reported visual/geometry defect is not an accepted risk.

## Items not required

- No ripple correction: operator visual inspection confirms current ripple behavior is correct.
- No expansion of the public FAB size/color API without demand.
- No `MDExtendedFab` migration in this family.
- No generic icon/adapter framework solely for this correction.

## Routing evidence

Earliest owning stage: `architecture`.

Correction capsule:

```text
family: floatingActionButton
origin stage: architect review / operator observation
target stage: architecture
finding: canonical FAB visual fixtures use an icon composition that produces the wrong visible size; a dedicated SVG geometry fixture passes but does not represent the canonical visual path
affected contract/proof: icon slot renderer composition; Medium FAB 80dp/28dp geometry; Storybook visual fixtures and browser geometry proof
operator observations: ripple behavior is visually correct; FAB size remains visually incorrect because the library is used incorrectly
```

Expected scoped path under the current workflow:

```text
architecture → implementation → independent review
```

Do not rerun migration unless the correction makes the preserved migration contract stale.
