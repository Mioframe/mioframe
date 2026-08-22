# Database virtualization capability stability correction preflight

Status: **ready**.

Authoring source: `docs/database-virtualization-stability-handoff.md`.

## Problem

Two required browser contracts are known intermittent:

- shared non-zero `surfaceOffset` deep geometry;
- database above-viewport resize anchor stability.

The implementation/public API is accepted. This task corrects proof synchronization only.

## Files allowed

Primary:

- `src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts`
- `src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts`

Only if public DOM observables prove insufficient for deterministic setup:

- the corresponding capability fixture(s), with the smallest evidence-backed change.

Do not edit production virtualization or database runtime code for this correction unless the browser proof exposes a real settled runtime defect. Stop and report that evidence instead.

## Shared `surfaceOffset` correction

Replace the post-deep-scroll sequence of separate live reads with a single browser-side snapshot helper.

The snapshot should synchronously read the current public/DOM state needed for the contract, including:

- leading/total/trailing extents;
- last mounted logical item index/identity;
- last item's public offset/size;
- viewport scrollHeight.

Poll the complete observable invariant instead of only `leadingSize > 100000`.

A valid settled state must simultaneously satisfy:

1. deep leading extent reached;
2. valid tail item/range present;
3. trailing formula within the existing `GEOMETRY_TOLERANCE_PX`;
4. physical `scrollHeight` formula within the existing `STRUCTURAL_TOLERANCE_PX`.

Keep the existing initial surface-offset/public-offset proof and baseline total-size contract unless evidence shows a separate defect.

Do not introduce a wider tolerance. If a single valid snapshot can still be transient, require valid consecutive observations with the same logical tail/range instead of delaying by time.

## Database anchor correction

Introduce a narrow local snapshot/poll helper for this test only.

### Settled baseline

After setting the programmatic scroll target, poll one synchronous browser-side snapshot until it has:

- the requested/deep actual scroll position;
- at least one mounted row fully above the viewport within overscan;
- at least one row overlapping the viewport;
- a deterministic middle overlapping anchor;
- stable selected above-row identity, anchor identity, and anchor Y across consecutive observations.

Capture `aboveViewportIndex`, `anchorIndex`, and `anchorYBefore` only from that settled baseline.

### Settled result

After triggering row growth, poll observable public/DOM state until:

- target row public `data-row-size` is materially larger than its settled initial size;
- the original anchor row remains mounted;
- anchor Y has settled across consecutive observations after the size change.

Then compare the settled final anchor Y against `anchorYBefore` using the existing `ANCHOR_TOLERANCE_PX`.

Do not let the final assertion succeed from an early pre-correction frame merely because anchor movement is momentarily small.

## Constraints

- No architecture/API changes.
- No `useVirtualCollection`/`vItem` changes.
- No new fixture protocol unless normal public DOM observables are demonstrably insufficient.
- No new ResizeObserver, measurement cache, range state, or scroll-correction logic.
- No private TanStack assertions.
- No sleeps or fixed frame waits.
- No tolerance widening.
- No timeout inflation.
- No retries used as acceptance.

## Acceptance

- The two original contracts remain semantically unchanged.
- Their assertions are based on settled, self-consistent public/DOM state.
- The correction cannot pass before the relevant asynchronous measurement/scroll correction has settled.
- Existing required Chromium/Firefox coverage remains intact.
- No unrelated capability tests are weakened or removed.

## Verification

Use the task-specific stability diagnostic after the correction:

```bash
pnpm verify --only storybook-behavior --files \
  src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts \
  src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts \
  --repeat 10
```

Required: every repetition passes with no flaky/retry classification.

Focused type-check/lint may be used if the test edits require feedback. Do not run a broad final repository gate; exact-head GitHub CI is architect-owned.

## Handoff result

Report implementation status using the repository coding-agent result format. If any repetition fails, report the exact failing contract and observable values; do not call the task complete.
