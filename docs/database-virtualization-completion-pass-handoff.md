# Database virtualization completion pass handoff

Status: **completed**.

This document records the final consolidated PR #217 virtualization completion pass.

## Goal

Finish the remaining virtualization correctness and presentation blockers without expanding into residual non-virtualization performance work.

## Final result

### Pass A — top-level moving-surface diagnosis

The historical failure was not reproduced in the authorized diagnosis. Supplied widget offsets matched current physical root-to-layout offsets at every required checkpoint:

- initial top: vertical `178`, horizontal `16`;
- first deep: vertical `178`, horizontal `16`;
- dismiss while deep: vertical `0`, horizontal `16`;
- returned top: vertical `0`, horizontal `16`;
- second deep: vertical `0`, horizontal `16`.

Both deep phases reached logical row `46`. Temporary diagnostics were removed.

The shared deep-state `surfaceOffset` capability already proves the generic `deep -> change while deep -> top -> deep` lifecycle on the same root/list. Therefore current evidence does not justify another production geometry/cache/lifecycle correction. Any new exact-head reproduction must reopen the finding from concrete evidence rather than speculative recovery logic.

### Pass B — relation local-root invariant

`RelationValueFieldData` now renders the loading indicator and `DatabaseDataTable` mutually exclusively. Explicit local `verticalSurfaceOffset=0` and `horizontalSurfaceOffset=0` are truthful whenever the table is mounted.

An owner-local component test proves loading/table mutual exclusion and transition to the table. Relevant relation/database E2E remained green.

### Pass C — sticky action/header stacking

`DatabaseDataTable` body action cells remain sticky/right but use local `z-index: 0`, below the shared sticky `thead` plane. The header action cell remains locally elevated inside the header.

The existing sticky native-table product E2E now uses real browser hit-testing after combined vertical + horizontal scrolling to prove body-right action ownership, top-right header/action ownership, and an ordinary header band above body action cells.

No shared `MDTable` change was required.

## Preserved architecture

- TanStack Virtual remains the sole range/measurement/cache/scroll-correction engine.
- `useVirtualCollection` remains unchanged.
- Physical scroll-root owners supply explicit surface offsets.
- `DatabaseDataTable` does not rediscover upper-layer ancestor/sibling geometry.
- Relation loading does not introduce geometry observation.
- Sticky correction remains local to Database table integration.

## Verification

Coding agent reports focused unit/E2E/relation E2E/format/ESLint/Oxlint/type-check green and final:

`pnpm verify --base origin/develop`

passed in one iteration.

Exact-head GitHub CI remains architect-owned.

## Remaining PR gates

- operator visual reinspection of borders/corners and combined sticky surfaces;
- exact-head GitHub CI without retry/flaky classification;
- final resulting-PR review.

Residual heterogeneous-content Chromium jank and other non-virtualization freeze causes remain deferred to later PRs.