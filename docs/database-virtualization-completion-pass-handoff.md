# Database virtualization completion pass handoff

## Goal

Finish the remaining PR #217 virtualization correctness and presentation blockers without expanding into residual non-virtualization performance work.

## Confirmed current behavior and evidence

- Shared `useVirtualCollection(surfaceOffset)` deep-state capability passes `deep -> change while deep -> top -> deep` on the same root/list; shared/TanStack production is not the current owner candidate.
- Top-level moving-surface product E2E previously failed 3/3 on desktop Chromium, then later passed without a production correction. The instability remains unresolved and requires numeric consumer diagnosis before another fix.
- `RelationValueFieldData` renders a loading indicator before `DatabaseDataTable` while still passing vertical offset `0`; that invariant is false during loading.
- `MDTable thead` is sticky at `z-index: 1`; Database body action cells are sticky at `z-index: 2`, so body action cells can paint above the sticky header. Operator inspection confirms the defect.

## Non-goals

- heterogeneous-content Chromium jank, Number/value-type cost, or other residual freeze causes;
- shared virtualization/TanStack changes;
- MDTable redesign;
- worker/query/storage changes;
- speculative moving-surface correction before numeric evidence.

## Affected scenarios

1. Top-level Database with success card: deep -> dismiss while deep -> top -> deep.
2. Relation value editor while relation properties are still loading.
3. Database with simultaneous vertical + horizontal scroll: sticky header, sticky body action column, and top-right header/action intersection.

## Ownership

- widget: `DatabaseViewWidget` owns top-level root-to-layout offset; diagnosis target only until evidence selects a correction.
- feature: `RelationValueFieldData` owns loading/table composition and must make local zero offset truthful.
- entity: `DatabaseDataTable` owns local sticky action-column integration.
- shared: unchanged; `MDTable` and `useVirtualCollection` remain accepted owners of their generic contracts.
- service/worker/page: unchanged.

## Source of truth / state

- Moving-surface diagnosis compares the widget-supplied numeric offset with the current DOM-derived root-to-layout content offset; no permanent diagnostic state/API.
- Relation local offset remains explicit `0/0` only when the mounted table is the first unpadded content in its local root.
- Sticky behavior is CSS stacking only; no new state.

## Public API / entry points

No public API change. Existing internal surface-offset props remain unchanged.

## Minimum sufficient design

### Pass A — top-level numeric diagnosis

Follow `docs/database-virtualization-widget-surface-offset-diagnosis-handoff.md` exactly. Capture supplied vs physical offsets at initial top, first deep, dismiss while deep, returned top, and second deep. Temporary instrumentation must be removed.

Decision:

- supplied != physical: report first divergence and numeric trace; do not implement a moving-surface correction in this pass;
- supplied == physical through a reproduced failure: report trace and stop that correction path for architecture reconsideration.

Independent Passes B/C may still proceed after Pass A evidence because they do not depend on the top-level diagnosis.

### Pass B — relation loading invariant

When `isLoading && !propertiesIdList`, render the existing progress indicator and do not mount `DatabaseDataTable`. Otherwise mount the table with explicit `0/0` offsets. Do not add geometry observation or a hard-coded spinner offset.

### Pass C — sticky stacking

Correct stacking locally in `DatabaseDataTable`:

- body action cells remain sticky/right and paint above ordinary body cells horizontally;
- body action cells remain below the shared sticky `thead` plane;
- the header action cell remains above sibling header cells inside the header plane.

Prefer the minimum z-index correction. Do not change `MDTable` unless browser proof demonstrates the local consumer stacking model cannot satisfy all three requirements.

## Rejected approaches

- entity ancestor/sibling geometry discovery;
- `virtualizer.measure()`/cache reset/exposed virtualizer;
- nextTick/rAF/timer/observer moving-surface workaround before diagnosis;
- feature-local geometry tracking for relation loading;
- shared Table change to compensate for a local body-action z-index;
- retries, sleeps, timeout inflation, remount or force recovery.

## Shared UI blast radius

None expected. Shared production remains unchanged.

## Acceptance matrix

- Pass A returns one coherent numeric moving-surface diagnosis with no permanent instrumentation.
- Relation loading never mounts spinner and `DatabaseDataTable` simultaneously when properties are unavailable; whenever the table exists, local vertical/horizontal zero is truthful.
- At combined vertical + horizontal scroll, browser hit-testing/observable stacking proves header content is above body action cells; body action remains the right-edge body surface; top-right header action remains the top header intersection.
- Existing bounded DOM, deep rows/columns, spacers/bootstrap, relation persistence, inline edit, ARIA, native table frame and sticky positions remain green.

## Required proof

- moving-surface: existing `tests/e2e/databaseVirtualizationFlows.spec.ts` scenario, diagnostic-only additions temporary;
- relation loading: lowest faithful feature/component contract proving spinner/table exclusivity, plus existing relation/database product proof;
- sticky stacking: existing Database virtualization application E2E, extending the sticky native-table scenario with real browser hit-testing/stacking proof under simultaneous vertical + horizontal scroll.

## Required verification

Use focused verifier runs after each pass. A targeted focused `--profile github-actions` run is allowed only for Pass A diagnosis if normal profile does not reproduce. Final handoff requires `pnpm verify --base origin/develop` with the normal local profile.

## Forbidden

Residual jank work; shared virtualization/TanStack production changes; MDTable changes without local-stacking impossibility proof; permanent diagnostic DOM/API; entity observer fallback; feature geometry observer; test weakening; retry-as-success; sleeps/timeouts; raw browser commands; mutating Git workflow; `--profile github-actions` on the final branch gate; `pnpm verify --full` as handoff gate.

## Implementation readiness

- Pass A diagnosis: ready; correction intentionally unresolved.
- Pass B relation correction: ready.
- Pass C sticky correction: ready.
- Unresolved blocker: moving-surface production correction depends on Pass A evidence.
- Verdict: **ready for consolidated pass with the stated stop condition**.
