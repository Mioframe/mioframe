# Review

Verdict: accepted; no shared production change required.

## Scope reviewed

- `useVirtualCollection.ts` surface-offset forwarding and surface-relative public geometry.
- Dynamic same-root `surfaceOffset` browser proof added in PR #217 at code head `5c1feb51102c8923fb23370de099e62e482b65d5`.
- TanStack Virtual measurement dependencies and Vue adapter option reactivity.

## Resolved — dynamic same-root surfaceOffset

The capability proof now mounts one physical root and one logical collection, establishes top/deep geometry with a non-zero surface offset, changes only the reactive offset from 240px to 96px, proves the same root/list instances remain mounted, and then proves top/deep public geometry and logical tail correctness again.

`useVirtualCollection.ts` did not change.

This directly protects the documented contract that `surfaceOffset` may change while root identity and logical collection identity remain stable.

## Engine contract

No cache-reset extension is required:

- TanStack includes `scrollMargin` in measurement-layout dependencies;
- changed margin rebuilds item starts while measured item sizes remain engine-owned;
- the Vue adapter reactively forwards changed options.

Do not add `virtualizer.measure()`, expose the virtualizer, or create a Mioframe cache invalidation protocol for this scenario.

## Remaining PR dependency

Database/feature consumers must supply truthful root-to-surface offsets from the owner of each physical scroll root. Shared virtualization has no remaining blocker for this correction.

## Forbidden

- public TanStack virtualizer exposure;
- unconditional `measure()` / cache reset;
- second geometry/range/measurement cache;
- Database-specific behavior in shared virtualization.
