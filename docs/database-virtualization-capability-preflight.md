# Database virtualization capability implementation preflight

Status: **ready**.

Authoring source: `docs/database-virtualization-capability-handoff.md` (`ready`) plus `docs/virtualization-library.md`, `docs/database-virtualization.md`, and `docs/database-virtualization-browser-proof.md`.

## Goal / non-goals

Implement the real shared TanStack adapter and only the isolated browser capability fixtures required to approve or reject native-table-first database migration.

Do not migrate production database rendering or implement secondary performance optimizations.

## Confirmed current state

- `@tanstack/vue-virtual` is not yet a dependency.
- `src/shared/ui/virtualization` does not exist.
- Storybook behavior discovers owner-local `src/**/*.browser.spec.ts` but currently runs Chromium only.
- Production `DatabaseDataTable` remains full native-table materialization and must stay unchanged in this capability task.

## Public entry point and API

Create:

- `src/shared/ui/virtualization/useVirtualAxis.ts`
- `src/shared/ui/virtualization/index.ts`

Use the following narrow Mioframe contract unless exact installed Vue/TanStack typing requires a type-only equivalent:

```ts
type VirtualAxisOrientation = 'vertical' | 'horizontal';
type VirtualAxisKey = string | number;
type VirtualAxisAlign = 'auto' | 'start' | 'center' | 'end';

interface UseVirtualAxisOptions<TKey extends VirtualAxisKey> {
  count: MaybeRefOrGetter<number>;
  getItemKey: (index: number) => TKey;
  getScrollElement: () => HTMLElement | null | undefined;
  orientation: VirtualAxisOrientation;
  estimateSize: (index: number) => number;
  overscan?: number;
  scrollMargin?: MaybeRefOrGetter<number>;
  scrollPaddingStart?: MaybeRefOrGetter<number>;
  scrollPaddingEnd?: MaybeRefOrGetter<number>;
}

interface VirtualAxisItem<TKey extends VirtualAxisKey> {
  index: number;
  key: TKey;
  start: number;
  size: number;
  end: number;
}

interface UseVirtualAxisResult<TKey extends VirtualAxisKey> {
  virtualItems: Readonly<ComputedRef<readonly VirtualAxisItem<TKey>[]>>;
  totalSize: Readonly<ComputedRef<number>>;
  measureElement(index: number, element: HTMLElement | null): void;
  scrollToIndex(index: number, options?: { align?: VirtualAxisAlign }): void;
}
```

Do not expose smooth-scroll behavior in the initial contract; dynamic-size correctness is more important and no current consumer requires it.

### Measurement identity

Configure a Mioframe-private TanStack `indexAttribute` (for example `data-mioframe-virtual-index`). `measureElement(index, element)` sets/updates that attribute before delegating to TanStack. Consumers never bind or know this attribute.

Use Vue function-ref lifecycle so current index is refreshed when virtual items are remapped. Do not add an element→item registry or independent ResizeObserver. The browser proof must demonstrate that reorder/index remapping remains correct; if Vue ref lifecycle cannot provide that with the two-argument function, stop and report before broadening the adapter API.

### Reactive mapping

Use Vue `toValue`/computed options only as needed so `count`, `scrollMargin`, and scroll padding changes update the TanStack options without recreating a second state model. `orientation` and `overscan` are not required to be runtime-reactive in this initial API.

### Invalid inputs

No DomainError or validation framework.

- `count`: finite non-negative integer;
- `overscan`: finite non-negative integer when provided;
- estimate result: finite and `> 0`;
- margin/padding: finite and `>= 0`;
- non-null measurement index: integer within current count;
- `scrollToIndex`: no-op only when count is zero; otherwise target must be within current count.

Fail deterministically with ordinary programmer-facing `TypeError`/`RangeError`; do not silently normalize invalid Mioframe inputs. Null measurement cleanup must still be forwarded safely.

## Dependency

Add `@tanstack/vue-virtual` on the current stable `3.13.35` line (`^3.13.35`) and update `pnpm-lock.yaml`. Do not add `@tanstack/virtual-core` directly; it is an adapter dependency.

## Expected files

Production/shared:

- `package.json`
- `pnpm-lock.yaml`
- `src/shared/ui/virtualization/useVirtualAxis.ts`
- `src/shared/ui/virtualization/index.ts`

Deterministic proof:

- `src/shared/ui/virtualization/useVirtualAxis.test.ts`

Reusable browser capability:

- `src/shared/ui/virtualization/VirtualizationCapability.stories.ts`
- `src/shared/ui/virtualization/VirtualizationCapability.browser.spec.ts`

Database DOM capability only:

- `src/entities/databaseData/DatabaseVirtualizationCapability.stories.ts`
- `src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts`

Browser runner:

- `playwright.storybook.config.ts` — preserve Chromium as normal Storybook behavior project and add one Firefox project whose `testMatch` is limited to the two virtualization capability specs.

Result:

- `docs/database-virtualization-capability-result.md`

Do not change `DatabaseDataTable.vue`, `DatabaseViewLayout.vue`, `DatabaseViewWidget.vue`, `EditableInlineValue.vue`, relation production code, worker/service code, `MDTable`, or Material components in this task.

## Implementation passes

1. Add dependency and implement `useVirtualAxis` + deterministic API/validation proof.
2. Add shared-axis Storybook fixture/spec and prove generic dynamic virtualization contracts in Chromium.
3. Add synthetic native-table fixture/spec under `databaseData`; no product services or persistence.
4. Add narrowly scoped Firefox Storybook project and run only the two capability specs there.
5. Fix only adapter/fixture-owned defects needed by the accepted contract. Do not migrate production database.
6. Record exact resolved dependency/browser versions and pass/fail conclusions in the result document.

If native table requires substantial custom geometry, stop with a failing result document; do not implement the fallback presentation in the same task.

## Simpler alternative comparison

Direct TanStack use in the synthetic entity fixture would be fewer files, but is rejected because it would fail to prove the actual Mioframe dependency boundary that production consumers will use. A custom virtualizer/measurement registry is more complex and unnecessary.

## Required removal

N/A. This task introduces the shared primitive and capability fixtures; no production path is replaced yet.

## TEST IMPACT

- Contract/scenario: Mioframe `useVirtualAxis` public adapter and invalid-input behavior.
  - Primary proof owner: `src/shared/ui/virtualization/useVirtualAxis.test.ts` for deterministic validation/API shape.
  - Additional proof: `VirtualizationCapability.browser.spec.ts` for real geometry/lifecycle.
  - Existing proof: none.
  - New/updated proof: files above.
  - Risk/platform matrix: Vue reactivity + Chromium/Firefox browser geometry where applicable.
  - Durable ownership/impact updates: owner-local unit/browser files; no registry metadata.

- Contract/scenario: bounded dynamic axis, deep navigation, stable-key remap, margin/padding, cleanup, same/different roots.
  - Primary proof owner: `src/shared/ui/virtualization/VirtualizationCapability.browser.spec.ts`.
  - Additional proof: none; do not duplicate TanStack internals.
  - Existing proof: none.
  - New/updated proof: shared capability story/spec.
  - Risk/platform matrix: Chromium full proof; Firefox only contracts shared with the narrow project where geometry differs.
  - Durable ownership/impact updates: owner-local Storybook browser discovery.

- Contract/scenario: native-table spacer rows/columns and dynamic `<tr>/<th>` measurement.
  - Primary proof owner: `src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts`.
  - Additional proof: Firefox project is mandatory because of confirmed table-row measurement risk.
  - Existing proof: none.
  - New/updated proof: synthetic entity capability story/spec.
  - Risk/platform matrix: Chromium + Firefox; desktop geometry only for this capability gate.
  - Durable ownership/impact updates: owner-local browser relation; Firefox `testMatch` remains exact/narrow.

- Contract/scenario: partial-DOM table accessibility metadata.
  - Primary proof owner: database capability browser spec.
  - Additional proof: none.
  - Existing proof: current table semantics are not virtualization-aware.
  - New/updated proof: logical row/column counts/indices and spacer exclusion assertions.
  - Risk/platform matrix: Chromium + Firefox capability engines.
  - Durable ownership/impact updates: none beyond owner-local spec.

- Performance claim: only structural bounded mounted work for 10,000+ logical items.
  - Primary proof owner: shared/database capability browser specs.
  - Metric: mounted logical item/cell count remains bounded by viewport + configured overscan as logical count grows.
  - No wall-clock budget, benchmark framework, CDP trace, or persistent timing gate in this task.

- Visual, release, persistence/data-safety: not applicable in this capability task.

## Verification

Run verifier-managed focused checks, not raw ad-hoc equivalents:

```bash
pnpm verify --only type-check --files \
  src/shared/ui/virtualization/useVirtualAxis.ts \
  src/shared/ui/virtualization/index.ts

pnpm verify --only unit-tests --files \
  src/shared/ui/virtualization/useVirtualAxis.test.ts

pnpm verify --only storybook-behavior --files \
  src/shared/ui/virtualization/VirtualizationCapability.browser.spec.ts \
  src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts
```

Also run the verifier-selected Storybook build/static checks for the changed stories/config. Run final `pnpm verify` for the full task diff if focused planning does not cover every changed path. Do not use retries/sleeps to obtain a pass.

## Stop conditions

Stop and record `not ready` in the capability result if any is true:

- native table cannot maintain deep dynamic offsets in Chromium or Firefox without a second geometry algorithm;
- Firefox requires fixed row sizes for correctness;
- measurement identity cannot stay correct across index remapping without adding a parallel registry/observer;
- horizontal native layout cannot produce stable measured widths with virtual spacer columns;
- required accessibility semantics cannot coexist with bounded table DOM.

Do not choose a new rendering architecture inside the coding task. Return evidence for architecture review.
