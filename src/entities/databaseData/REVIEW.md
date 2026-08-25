# Review

Verdict: virtualization implementation and the proportional moving-surface proof correction are accepted; merge is blocked by a reproducible relation-table readiness flake, operator visual reinspection, exact-head CI, and final resulting-PR review.

## Scope reviewed

- PR #217 Database virtualization/native-table integration.
- Shared deep-state `surfaceOffset` capability.
- Top-level `DatabaseViewWidget` numeric offset diagnosis.
- Relation-value local-root loading correction.
- Sticky action/header stacking correction and real-browser hit-testing proof.
- Moving-surface E2E proof correction after exact-head GitHub Actions run #4334.
- Exact-head GitHub Actions run #4348 on `cf2d9c246c324193bf0398327a1268edfad75426`.

## Resolved — shared deep-state contract

The shared browser capability proves `deep -> change surfaceOffset while deep -> top -> deep` on the same root/list, reaching the logical tail before and after with bounded mounted work and consistent geometry. Shared production remains unchanged.

No shared/TanStack production correction is justified.

## Resolved — top-level supplied offsets are truthful in the diagnosed lifecycle

The coding-agent diagnosis reported truthful supplied-vs-physical offsets at every required checkpoint:

- initial top: vertical `178`, horizontal `16`;
- first deep: vertical `178`, horizontal `16`;
- dismiss while deep: vertical `0`, horizontal `16`;
- returned top: vertical `0`, horizontal `16`;
- second deep: vertical `0`, horizontal `16`.

Both first and second deep phases reached logical row `46`. Temporary diagnostics were removed.

Together with the accepted shared deep-state capability, there is no current evidence supporting another production geometry/cache/lifecycle correction.

## Resolved — moving-surface product proof setup

The proportional product proof now uses a compact deterministic viewport and 16 additional rows while preserving the real success-card lifecycle, bounded mounted ranges, physical surface movement, and both logical-tail checks.

Exact-head run #4348 confirms the corrected moving-surface scenario passes in both desktop Chromium and Mobile Chrome. The previous moving-surface finding remains closed.

## Blocker — relation table readiness is flaky

Exact-head run #4348 failed only application E2E with:

`tests/e2e/databaseViewsAndQueryFlows.spec.ts:269` -> `uses default relation view inline and switches to a selected relation view`.

The first Chromium attempt failed before switching to the explicit descending view. The initial default-view order assertion observed no mounted relation data rows (`joined === ""`). The whole-test retry passed, so Playwright classified the scenario as flaky and the repository correctly failed the lane.

The same scenario had already failed during the coding-agent branch verification after the moving-surface proof correction. It can no longer be treated as unrelated noise.

### Relevant PR-owned lifecycle

`RelationValueFieldData` now mounts `DatabaseDataTable` only through `v-else` after `isLoading && !propertiesIdList` becomes false. Because `useDatabaseData()` is owned inside `DatabaseDataTable`, this changes startup from parallel properties/data observation to properties-first then data-query mount.

Separately, `DatabaseDataTable` renders only an `aria-hidden` row bootstrap whenever its logical item list is non-empty but TanStack currently exposes no mounted rows.

The observed empty relation-row set is therefore compatible with at least two PR-relevant hypotheses:

1. delayed `DatabaseDataTable` mount delays the `filteredIdList` query enough to expose a readiness race;
2. logical item data is already present but the nested relation virtualizer remains temporarily in its bootstrap/no-mounted-items state.

Neither hypothesis is confirmed yet.

### Required next step

Do not patch the E2E timeout or helper.

Run a narrow relation-readiness discriminator that captures, at the initial default-view checkpoint:

- whether `RelationValueFieldData` is still in properties-loading state;
- whether the real `DatabaseDataTable` is mounted;
- table `aria-rowcount`;
- mounted non-bootstrap row count;
- presence of row-bootstrap DOM;
- whether the expected logical item count has already arrived at the table boundary;
- current selected/effective relation view.

The discriminator must distinguish delayed data-query start from virtualizer bootstrap/range readiness before selecting a production correction.

If delayed table mount is confirmed as the cause, revisit the mutually-exclusive loading implementation without reintroducing a false surface offset. Prefer preserving concurrent data-query startup with the smallest truthful DOM/loading composition; do not add duplicate preload queries.

If logical items are present while mounted rows remain absent, investigate the nested relation virtualizer/root bootstrap lifecycle instead; do not add sleeps, retries, forced remounts, or `virtualizer.measure()` as a first response.

## Resolved — relation local-root surface invariant

The geometric requirement remains valid: explicit local `verticalSurfaceOffset=0` and `horizontalSurfaceOffset=0` must be truthful whenever the relation table participates in layout. Any readiness correction must preserve this invariant.

Owner review: `src/features/relationValueEdit/REVIEW.md`.

## Resolved — sticky body action cells covering the header

`DatabaseDataTable` keeps body action cells sticky/right at local `z-index: 0`, below the shared sticky `thead` plane (`z-index: 1`). The header action cell remains locally elevated inside the header plane.

The product E2E uses actual `document.elementFromPoint()` hit-testing after combined vertical + horizontal scrolling and proves body-right, top-right header/action intersection, and ordinary header-band ownership.

No shared `MDTable` change was required.

## Preserved ownership

- `DatabaseViewWidget` owns top-level composition/layout facts;
- `DatabaseViewLayout` forwards offsets;
- `DatabaseDataTable` owns table virtualization presentation and local bootstrap rendering;
- `RelationValueFieldData` owns relation-loading composition around the entity table;
- `useVirtualCollection` forwards `surfaceOffset`;
- TanStack owns range/measurement/cache/scroll correction;
- shared `MDTable` owns generic native table frame/header behavior.

The removed entity ancestor/sibling geometry-discovery path must not return.

## Remaining gates

1. resolve the relation-table readiness flake from a narrow discriminator and required owner-local correction;
2. coding-agent `pnpm verify --base origin/develop` clean after that correction;
3. operator reinspection of the real Database table, especially borders/corners and combined sticky header/action behavior;
4. exact-head GitHub CI green with no retry/flaky classification;
5. final full resulting-PR review.

Residual heterogeneous-content Chromium jank and other non-virtualization performance causes remain explicitly deferred to later PRs.

## Blockers

- relation-table initial readiness is reproducibly flaky in local branch verification and exact-head CI.