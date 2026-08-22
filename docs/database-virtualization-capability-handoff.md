# Database virtualization capability handoff

Status: **ready**.

## Goal

Implement the selected `@tanstack/vue-virtual` shared adapter and prove, before database production migration, that Mioframe's native-table-first virtualization model is viable in Chromium and Firefox.

## Confirmed evidence

- `docs/virtualization-library.md`: TanStack Virtual is selected and must stay behind `shared/ui/virtualization`.
- `docs/database-virtualization.md`: two independent dynamic axes, native-table-first DOM, no duplicate geometry caches.
- `docs/database-virtualization-browser-proof.md`: Firefox native `<tr>` measurement is a confirmed risk and requires real-browser proof.
- Current Storybook behavior runner is Chromium-only; owner-local `src/**/*.browser.spec.ts` discovery is executable.
- Current production database still fully materializes rows × properties; this task does not migrate it.

## Non-goals

- no `DatabaseDataTable` production migration;
- no worker/query/read/batching/paging/index changes;
- no performance timing harness or persistent timing budget;
- no editor/relation/toolbar product clone in synthetic fixtures;
- no `VirtualGrid`, `VirtualTable`, pinning API, manual size cache, or custom virtualizer.

## Affected scenarios

- large one-axis collections with dynamic item sizes;
- two virtual axes using one scroll root;
- two virtual axes using different roots;
- native table virtual spacer rows/columns;
- dynamic table row/column measurement;
- deep scroll/navigation;
- logical accessibility metadata with partial DOM;
- Firefox dynamic table measurement.

## Boundaries / ownership

| Layer | Capability-task ownership |
| --- | --- |
| feature | N/A |
| entity | `databaseData` owns only the synthetic native-table capability fixture/spec. |
| widget | N/A |
| page/pane | N/A |
| shared | `shared/ui/virtualization` owns production TanStack adapter/API and reusable browser proof. |
| service/worker | unchanged |

`playwright.storybook.config.ts` may gain one narrowly scoped Firefox project only for the virtualization capability specs.

## Source of truth / state

Logical items and stable keys remain consumer-owned. TanStack owns ephemeral virtual geometry, element observation, measured-size cache, range calculation, and scroll correction. No second geometry state is added.

## Public API

Implement `src/shared/ui/virtualization/useVirtualAxis.ts` under the contract in `docs/virtualization-library.md`.

Required surface:

- reactive `count`;
- `getItemKey(index)`;
- `getScrollElement()`;
- `orientation`;
- `estimateSize(index)`;
- narrow `overscan`;
- reactive `scrollMargin`, `scrollPaddingStart`, `scrollPaddingEnd`;
- readonly `virtualItems`;
- readonly `totalSize`;
- Mioframe measurement binding that receives logical `index + element` and hides TanStack `data-index`/`indexAttribute`;
- `scrollToIndex`.

Do not expose TanStack instances/types/options or `resizeItem`.

## Minimum sufficient design

- add `@tanstack/vue-virtual` current stable `3.13.35` line (`^3.13.35`) and lock the resolved dependency;
- implement one thin Vue composable adapter;
- let TanStack own its required element index marker privately;
- add deterministic Storybook fixtures for shared-axis and native-table capability;
- add a narrow Firefox Playwright project that runs only those capability specs;
- record results in `docs/database-virtualization-capability-result.md`.

If Firefox needs a custom mounted-element size reader, first prove the need. A narrow generic measurement callback may be added only if it replaces TanStack's default size read while TanStack still owns ResizeObserver, cache, offsets, and correction.

## Rejected approaches

- direct TanStack imports in entity/widget code;
- separate element→item registry or ResizeObserver;
- manual `resizeItem`/column width cache;
- fixed-height Firefox fallback;
- changing the whole Storybook suite to Firefox;
- production database migration before this gate passes.

## Shared UI blast radius

New isolated `src/shared/ui/virtualization` only. No changes to `MDTable`, `MDList`, or Material primitives in this task.

## Acceptance matrix

| Contract | Required outcome |
| --- | --- |
| Adapter boundary | Consumers use Mioframe API only; no TanStack DOM/API leakage. |
| Scale | 10,000+ logical items keep mounted items bounded by viewport/overscan. |
| Dynamic size | Repeated post-mount resize updates geometry. |
| Identity | Index remapping preserves correct stable-key measurement association. |
| Navigation | Deep `scrollToIndex` reaches correct logical item. |
| Scroll geometry | margin/padding and same/different root fixtures remain correct. |
| Native table | Spacer rows/columns maintain deep offsets and dynamic `<tr>/<th>` measurement. |
| Firefox | Dynamic row measurement works without fixed-size correctness assumptions. |
| Accessibility | Partial DOM exposes logical counts/indices; spacers are presentation-only. |
| Simplicity | No second virtualization/measurement engine or geometry cache is introduced. |

## Risk matrix

- High: Firefox table-row size semantics.
- High: native table spacer/auto-layout interaction with deep offsets.
- Medium: measurement identity across reorder/remount.
- Medium: shared/different scroll-root cleanup.
- Medium: accessibility semantics of spacer DOM.
- Low: dependency/API mapping.

## Required proof

- `src/shared/ui/virtualization/useVirtualAxis.test.ts`: deterministic validation/API behavior only.
- `src/shared/ui/virtualization/VirtualizationCapability.stories.ts` + `.browser.spec.ts`: reusable adapter browser contract.
- `src/entities/databaseData/DatabaseVirtualizationCapability.stories.ts` + `.browser.spec.ts`: synthetic native-table capability.
- Chromium runs through ordinary Storybook behavior ownership.
- Firefox runs only these capability specs through a narrow project in `playwright.storybook.config.ts`.
- No screenshots or visual-regression proof.
- No application E2E in this capability task.
- Structural bounded-mounted-item assertions are the performance proof; no wall-clock budget is claimed.

## Required verification

- type-check/static verification for changed production/test/config files;
- focused unit proof for `useVirtualAxis.test.ts`;
- focused Storybook behavior proof for both capability specs, including the narrow Firefox project;
- Storybook build as selected by verifier;
- final `pnpm verify` on the task diff if the focused verifier plan does not already cover all changed paths.

## Forbidden

- sleeps, `force`, broad retries, or repeated-action recovery;
- product services/persistence/workers in capability stories;
- hidden full-dataset measurement;
- custom offset/range/anchor algorithms;
- generic abstractions not required by the acceptance matrix;
- changing production database rendering in this task.

## Implementation readiness

Required architecture, dependency, boundaries, API responsibilities, proof ownership, and fallback threshold are resolved.

Unresolved blockers: **none for capability implementation**.

Verdict: **ready**.
