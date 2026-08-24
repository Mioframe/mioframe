# Review

Verdict: blocked by missing proof of the documented dynamic `surfaceOffset` contract; no shared production change is currently justified.

## Scope reviewed

- `useVirtualCollection.ts` surface-offset forwarding and surface-relative public geometry.
- `VirtualCollectionCapability.browser.spec.ts` current non-zero-surface proof.
- TanStack Virtual core measurement dependencies and Vue adapter option reactivity.
- Exact-head PR #217 moving-surface CI failure on `2889a1d6598850a4a8886d6d1a7d95a40f8cd1da`.

## Blocker — dynamic same-root surfaceOffset is not directly proved

`README.md` defines `surfaceOffset` as reactive distance from the physical scroll-root origin to the logical collection-surface origin, but the capability proof currently establishes only a non-zero offset, not a changed offset on the same mounted root.

This matters because the PR #217 product failure occurs after the Database table surface moves while the scroll root identity remains unchanged.

Required proof:

- mount a collection with one physical root and non-zero `surfaceOffset`;
- establish top/deep public and DOM geometry;
- change only the reactive `surfaceOffset` while retaining the same root and logical collection;
- prove top/deep range and surface-relative extents remain correct without remount/retry.

## Engine contract review

A shared cache-reset extension is not currently supported by evidence:

- TanStack measurement options include `scrollMargin` as a measurement-layout dependency;
- when `scrollMargin` changes, starts are rebuilt from the new margin while measured item sizes remain in the engine-owned size cache;
- the Vue adapter watches reactive options and forwards them through `setOptions()` / `_willUpdate()`.

Therefore do not add `virtualizer.measure()`, expose the virtualizer, or create a Mioframe cache invalidation protocol merely because `surfaceOffset` changes.

If the new capability proof fails with the current implementation, stop and return the failure as architecture evidence before changing shared production code.

## Required final state

If the capability proof passes:

- `useVirtualCollection.ts` remains unchanged;
- the documented dynamic same-root `surfaceOffset` behavior becomes directly protected by browser proof;
- the Database consumer correction occurs at the physical root/composition owner that supplies the offset.

If the capability proof fails:

- shared production ownership must be reconsidered before implementation proceeds;
- no consumer workaround is accepted.

## Verification

Focused verifier-managed Storybook/browser behavior for the shared capability, followed by the PR branch gate after the complete correction.

## Major issues

None beyond the blocker above.

## Minor issues

None.

## Forbidden

- public TanStack virtualizer exposure;
- unconditional `measure()` / cache reset;
- second geometry/range/measurement cache;
- Database-specific behavior in shared virtualization;
- retry/remount/timing recovery presented as contract proof.
