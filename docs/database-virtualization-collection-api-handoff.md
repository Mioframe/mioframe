# Database virtualization collection API capability handoff

Status: **completed**.

This document records the completed implementation handoff for the shared `useVirtualCollection` capability and database native-table proof. The final evidence and verdict are in `docs/database-virtualization-collection-api-result.md`.

## Goal

Establish one minimal shared `useVirtualCollection` API over `@tanstack/vue-virtual`, prove the database native-table model against that public API, and close the capability gate before production database migration.

## Accepted architecture

- `useVirtualCollection` is the only Mioframe virtualization API.
- Consumers own rendering and DOM topology.
- The shared layer owns collection mapping, collection-relative geometry, and a per-instance measurement directive only.
- TanStack remains the sole owner of ranges, measurement observation/cache, offsets, and scroll correction.
- Database composes independent row and property collections and keeps native table semantics.
- No generic list/table/grid component, second geometry engine, observer, cache, registry, or range coordinator was introduced.

## Completed capability proof

The capability stage proved:

- bounded large single-axis collection rendering;
- public item/value/key/index mapping;
- dynamic grow/shrink through public virtual geometry;
- stable-key remap measurement at the new index;
- non-zero `surfaceOffset` with collection-relative extents;
- valid in-bounds `undefined` source values;
- actual `MDTable` row/column dynamic geometry in Chromium and Firefox;
- deep vertical and horizontal virtualization;
- column remount minimum after widening content is removed;
- above-viewport resize anchor stability;
- native table accessibility semantics;
- bounded actual mounted logical `<td>` DOM at initial and deep 2D ranges, with no retained/duplicated cells outside the settled row × column intersection.

The dedicated fixed-size wrapper remains the accepted physical scroll root for the capability fixture, and the phantom min-content spacer remains the accepted narrow native-table normalization.

## Final state

- Shared virtualization architecture: **accepted**.
- Shared collection API capability: **passed**.
- Database native-table capability: **passed**.
- Capability blockers: **none**.
- Production database migration: **not implemented**; this is the next separate stage.
- Product performance profiling/acceptance: **pending production migration**.

Do not use this completed handoff as an active coding task. New production migration work requires its own architecture/preflight based on `docs/database-virtualization.md` and the final capability result.
