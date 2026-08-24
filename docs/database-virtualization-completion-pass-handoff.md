# Database virtualization completion pass handoff

Status: **implementation pass completed; follow-up proof correction required**.

This document records the consolidated PR #217 virtualization completion pass.

## Completed implementation

### Pass A — top-level moving-surface diagnosis

The authorized numeric diagnosis did not reproduce a supplied-vs-physical offset mismatch. Reported values matched at every checkpoint:

- initial top: vertical `178`, horizontal `16`;
- first deep: vertical `178`, horizontal `16`;
- dismiss while deep: vertical `0`, horizontal `16`;
- returned top: vertical `0`, horizontal `16`;
- second deep: vertical `0`, horizontal `16`.

Both deep phases reached logical row `46`. Temporary diagnostics were removed.

The shared deep-state `surfaceOffset` capability also proves the generic `deep -> change while deep -> top -> deep` lifecycle on the same root/list. No production geometry/cache/lifecycle correction was selected.

### Pass B — relation local-root invariant

`RelationValueFieldData` renders the loading indicator and `DatabaseDataTable` mutually exclusively. Explicit local `verticalSurfaceOffset=0` and `horizontalSurfaceOffset=0` are truthful whenever the table is mounted.

An owner-local component test proves loading/table mutual exclusion and transition to the table. Relevant relation/database E2E remained green.

### Pass C — sticky action/header stacking

`DatabaseDataTable` body action cells remain sticky/right at local `z-index: 0`, below the shared sticky `thead` plane. The header action cell remains locally elevated inside the header.

The existing sticky native-table product E2E uses real browser hit-testing after combined vertical + horizontal scrolling to prove body-right action ownership, top-right header/action ownership, and an ordinary header band above body action cells.

No shared `MDTable` change was required.

## Follow-up exact-head finding

GitHub Actions run #4334 on `3fb69ea622edf53837587c67e9fb9b4e9e218d7a` failed only the moving-surface application E2E on desktop Chromium. All three attempts exhausted the normal 30-second per-test timeout, but at different phases; Mobile Chrome passed.

The scenario creates the real five-row Weekly Plan starter example and then performs forty sequential full add-item dialog flows before its geometry assertions. The failure is therefore classified as an over-budget proof design until a proportional setup disproves that classification.

Required next correction is test-only and is defined in `docs/database-virtualization.md` and `src/entities/databaseData/REVIEW.md`:

- keep the real success-card lifecycle;
- use a compact deterministic desktop viewport;
- create only enough extra rows to guarantee a virtualized deep range before and after dismiss;
- preserve bounded-range, physical-movement, top, and logical-tail assertions;
- do not increase timeout or change production geometry.

If that proportional proof still fails with meaningful budget remaining, production architecture must be reopened from the new evidence.

## Preserved architecture

- TanStack Virtual remains the sole range/measurement/cache/scroll-correction engine.
- `useVirtualCollection` remains unchanged.
- Physical scroll-root owners supply explicit surface offsets.
- `DatabaseDataTable` does not rediscover upper-layer ancestor/sibling geometry.
- Relation loading does not introduce geometry observation.
- Sticky correction remains local to Database table integration.

Residual heterogeneous-content Chromium jank and other non-virtualization freeze causes remain deferred to later PRs.
