# Review

Verdict: blocked by missing proof for `surfaceOffset` changing while the same collection is already in a deep range.

## Scope reviewed

- `useVirtualCollection.ts` surface-offset forwarding and surface-relative public geometry.
- Current dynamic `surfaceOffset` capability proof added for PR #217.
- TanStack Virtual core measurement dependencies and Vue adapter option reactivity.
- Exact-head PR #217 E2E failure on `dcb72917f2fcd49c58a1caa9f8f6cc7ade58bd4a`.

## Resolved — simple same-root dynamic surfaceOffset

The capability proves one reactive `surfaceOffset` transition from 240px to 96px while retaining the same physical root and list. `useVirtualCollection.ts` remains unchanged.

However, that proof changes the surface only after returning the collection to the logical top. It does not reproduce the failing product lifecycle.

## Blocker — deep-state surface movement is unproved

The exact product failure occurs in this order:

1. mount with non-zero preceding content;
2. reach the logical deep/end range;
3. while still deep, remove preceding content so the same collection surface moves upward;
4. return to logical top;
5. scroll deep again;
6. the second deep transition must reach the logical end.

Current shared capability instead does:

1. deep;
2. return to top;
3. change `surfaceOffset`;
4. deep again.

That is materially weaker because it excludes browser scroll anchoring/clamping and virtualizer state interaction when root content before the collection changes while the root is already deeply scrolled.

Required proof before another production ownership decision:

- retain the same physical root and logical collection;
- establish a deep logical range;
- change the physical pre-surface extent and reactive `surfaceOffset` while still deep;
- prove the physical surface moved;
- then return to top and prove first logical identity;
- scroll deep again and prove the logical end plus self-consistent public/DOM geometry.

If this stronger capability fails with current `useVirtualCollection`, stop and return the evidence to architecture before changing Database/widget code again.

If it passes, the remaining defect is consumer-owned and the widget offset lifecycle must be diagnosed against observable supplied-offset state rather than patched speculatively.

## Engine contract review

Do not assume a cache reset is required. TanStack measurement options include `scrollMargin`, and changing it rebuilds measurement starts while measured sizes stay engine-owned. The Vue adapter reactively forwards changed options.

Source inspection alone does not prove browser behavior for simultaneous deep-scroll plus preceding-layout movement. The strengthened browser capability is the required discriminator.

## Verification

Focused verifier-managed Storybook/browser behavior for the strengthened capability. No Database production change until that discriminator is known.

## Forbidden

- unconditional `virtualizer.measure()` or cache reset;
- exposing the TanStack virtualizer;
- second geometry/range/measurement cache;
- Database-specific behavior in shared virtualization;
- retry/remount/sleep/timeout recovery;
- treating the existing top-state dynamic proof as sufficient for the deep-state product failure.
