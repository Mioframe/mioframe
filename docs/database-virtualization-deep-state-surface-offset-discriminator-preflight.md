# Database virtualization deep-state surface-offset discriminator preflight

Authoring source: `docs/database-virtualization-deep-state-surface-offset-discriminator-handoff.md`.

## Goal / non-goals

Strengthen only the shared browser proof so it matches the exact failing lifecycle: `deep -> surfaceOffset change while deep -> top -> deep`. Do not change production code or fix the separate relation-value zero-offset blocker in this pass.

## Confirmed current behavior

- Existing `DynamicSurfaceOffset` story already owns one reactive `surfaceOffset` transition (`240 -> 96`) on the same mounted fixture.
- Existing browser test currently scrolls back to top before clicking `vcc-change-surface-offset`; this is weaker than the product E2E.
- Exact-head product E2E repeatedly fails only when preceding content is removed while the real Database root is already deep.

## Owners / entry points

- Primary proof: `src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts`.
- Existing driver: `src/shared/ui/virtualization/VirtualCollectionCapability.stories.ts` → `DynamicSurfaceOffset`.
- Existing fixture: `VirtualCollectionCapabilityFixture.vue`; change only if the current public controls cannot express the required sequence.
- `useVirtualCollection.ts` and all Database/feature production files: read-only for this task.

## Minimum implementation design

Reuse the existing story and test helpers. Move the surface-offset action so it occurs after initial settled deep geometry and before returning to index `0`.

While still deep, prove through observable DOM that:

- viewport/list identity did not change;
- pre-surface physical extent becomes approximately `96px`;
- viewport remains in a non-top scroll state;
- public total/trailing geometry and physical scroll extent settle consistently for the new offset.

Then return to top, prove item `0` and public offset `0`, scroll to end again, and prove item index `9999` plus the existing geometry invariants.

Simpler alternative selected: reorder/strengthen the existing test. Do not add another story or fixture state unless required by observable proof.

## Expected files

Expected change:

- `src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts`

Conditional only if required:

- `src/shared/ui/virtualization/VirtualCollectionCapability.stories.ts`
- `src/shared/ui/virtualization/VirtualCollectionCapabilityFixture.vue`

Architect-owned, do not edit:

- `docs/database-virtualization*.md`
- `src/shared/ui/virtualization/REVIEW.md`
- `src/entities/databaseData/REVIEW.md`
- `src/features/relationValueEdit/REVIEW.md`
- PR metadata.

## Pass order

1. Update only the shared capability proof to reproduce the exact deep-state transition.
2. Run focused Storybook behavior for the owning spec.
3. If it fails, capture the observable failing geometry/state and STOP. Do not change production code.
4. If it passes, run a bounded `--repeat 3` Storybook-behavior diagnostic for this spec because the corresponding product defect is repeatedly CI-visible.
5. Run focused format/lint if the proof file changed.
6. Run `pnpm verify --base origin/develop` once and report the result. The known product E2E may still fail; do not correct production in this discriminator task.

## TEST IMPACT

- Contract/scenario: reactive `surfaceOffset` changes while the same collection is already in a deep range.
  - Primary proof owner: `src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts`.
  - Additional proof: existing Database moving-surface application E2E remains unchanged.
  - Existing proof: same-root offset change only after returning top.
  - New/updated proof: exact `deep -> change while deep -> top -> deep` ordering with root/list identity and geometry invariants.
  - Risk/platform matrix: Chromium real layout/scroll behavior; no visual, accessibility, persistence, or performance claim.
  - Durable ownership/impact updates: architect-owned shared/database reviews and canonical architecture already identify this discriminator.

## Verification

Focused:

`pnpm verify --only storybook-behavior --files src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts`

Stability diagnostic after a focused pass:

`pnpm verify --only storybook-behavior --files src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts --repeat 3`

Final branch observation:

`pnpm verify --base origin/develop`

No `--profile github-actions` in the normal local gate.
