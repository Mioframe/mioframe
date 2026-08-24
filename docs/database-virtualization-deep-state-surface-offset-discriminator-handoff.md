# Database virtualization deep-state surface-offset discriminator handoff

## Goal

Determine whether the shared `useVirtualCollection(surfaceOffset)` contract remains correct when the collection surface moves while the same physical scroll root is already in a deep range.

## Confirmed current behavior and evidence

- Exact-head CI on `dcb72917f2fcd49c58a1caa9f8f6cc7ade58bd4a` fails only `tests/e2e/databaseVirtualizationFlows.spec.ts` → `keeps real preceding Database content connected to the table-owned surface range` on desktop Chromium, initial attempt plus both retries; Mobile Chrome passes.
- The product sequence is `deep -> remove preceding content while still deep -> top -> deep`; the second deep transition does not reach the logical tail.
- The current shared capability proves only `deep -> top -> change surfaceOffset -> deep`.
- Therefore the current shared proof does not establish the failing lifecycle and no further production owner is selected yet.

## Non-goals

- no `DatabaseViewWidget`, `DatabaseViewLayout`, `DatabaseDataTable`, relation-value, `MDTable`, worker/query/storage, or value/performance changes;
- no `useVirtualCollection` production change in this pass;
- no cache reset, exposed TanStack virtualizer, retry, timeout, sleep, remount, or force-update workaround.

## Affected scenario

One reusable browser contract: same root + same logical collection + non-zero physical pre-surface extent, enter deep range, shrink that extent and reactive `surfaceOffset` while still deep, then recover top and deep correctly.

## Ownership matrix

- shared: owns the reusable browser capability proof and the existing `surfaceOffset` contract;
- entity/widget/feature/page/service/worker: unchanged in this discriminator pass.

## Source of truth and state shape

Use the existing `DynamicSurfaceOffset` story and capability fixture. Keep one reactive numeric `surfaceOffset` (`240 -> 96`) and the same root/list identities. No new persistent state or test-only production API.

## Public API / entry points

`useVirtualCollection(..., { surfaceOffset })` remains unchanged.

## Minimum sufficient design

Update the existing browser capability test so the offset-control action occurs while the viewport is still at the settled logical tail. Prove the physical pre-surface extent changes on the same root/list, then return to top, prove the first logical item, scroll to end again, and prove tail identity plus self-consistent `leadingSize` / `trailingSize` / `totalSize` / scroll extent.

Do not add another story or fixture mechanism unless the existing `DynamicSurfaceOffset` story cannot express this sequence truthfully.

## Rejected approaches

- another Database/widget production correction before the discriminator;
- `virtualizer.measure()` based only on source inspection;
- changing test timeouts/retries or weakening the product E2E;
- adding a production diagnostic seam solely to inspect virtualizer internals.

## Shared UI blast radius

Test/proof only. Shared production API and implementation remain unchanged in this pass.

## Acceptance matrix

- same viewport and list DOM identities survive the offset change;
- the offset changes `240 -> 96` while the viewport is still deeply scrolled;
- the physical pre-surface extent reflects the new value before returning top;
- top recovery exposes logical item `0` with surface-relative offset `0`;
- second deep transition reaches logical item `9999`;
- public geometry and physical scroll extent are self-consistent after the change.

## Risk matrix

Desktop Chromium deep-scroll/layout interaction is the only primary risk. Mobile/product behavior remains protected by existing E2E and is not reimplemented in Storybook.

## Required test proof

Primary owner: `src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts` using the existing `DynamicSurfaceOffset` story. Run verifier-managed Storybook behavior; a bounded repeat is justified because the corresponding product failure is repeatedly CI-visible.

## Required verification

Focused discriminator first. Because this changes repository proof while PR #217 still contains a known product blocker, run the cumulative branch gate afterward and report its exact result; do not patch production from that result in this task.

## Forbidden

Production changes; shared API changes; `virtualizer.measure()`; second geometry/range/cache state; raw Playwright/Vite/browser commands; raw or mutating Git workflow; sleeps; timeout inflation; retry-as-success; assertion weakening; relation-value correction in this pass.

## Implementation readiness

- Product behavior: confirmed.
- Proof owner: resolved.
- Production owner after the discriminator: intentionally unresolved until this proof runs.
- Unresolved blockers before test implementation: none.
- Verdict: **ready for discriminator proof only**.
