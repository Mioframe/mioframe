# Database virtualization branch E2E correction preflight

Authoring source: `docs/database-virtualization-branch-e2e-correction-handoff.md`.

Status: **ready**.

## Goal / non-goals

Resolve the two remaining Database virtualization application-E2E blockers from branch-wide verification while preserving the accepted TanStack/native-table architecture and the completed cold-bootstrap correction.

Do not continue residual Chrome performance attribution and do not redesign shared virtualization.

## Confirmed evidence

### Moving-surface failure

Owning scenario:

`tests/e2e/databaseVirtualizationFlows.spec.ts` — `keeps real preceding Database content connected to the table-owned surface range`.

Confirmed sequence in exact-head CI:

- table is displaced by real preceding success-card content;
- first top -> deep range reaches the final logical row;
- success card is removed;
- product DOM proves the root-relative table surface offset changed;
- after top reset, the second deep scroll does not reach the final logical row;
- failure reproduced on the initial attempt and both retries.

Current production path:

- `DatabaseDataTable.vue` derives root/table bounds with `useElementBounding`;
- root child-list mutation and component update call `updateSurfaceBounds()`;
- reactive vertical/horizontal surface offsets are passed to `useVirtualCollection`;
- `useVirtualCollection` maps that offset to TanStack `scrollMargin`.

The failure proves that the end-to-end geometry contract is not yet reliable. It does **not** by itself prove which step is stale.

### Interior-spacer failure

Owning scenario:

`tests/e2e/databaseVirtualizationFlows.spec.ts` — `virtualizes the real Database root across deep native-table row and property ranges`.

Current test uses half of physical `scrollHeight` / `scrollWidth` as an assumed interior point. CI shows that assumption is false/reliability-sensitive: the mounted state can still be boundary-like.

The required proof is logical, not pixel-based. Existing `aria-rowindex` and `aria-colindex` values are sufficient observable product facts to classify start/interior/end ranges.

## Owners

Primary production owner if a production defect is confirmed:

- `src/entities/databaseData/DatabaseDataTable.vue`.

Primary proof owner:

- `tests/e2e/databaseVirtualizationFlows.spec.ts`.

Regression proof that must stay green:

- `tests/e2e/databaseViewsAndQueryFlows.spec.ts` relation-filter persistence scenario.

Shared `useVirtualCollection` is **not authorized for modification in this pass**. If focused evidence proves it cannot consume an already-correct reactive `surfaceOffset`, stop and return that evidence to the architect.

## Minimum implementation sequence

### Pass 1 — classify moving-surface failure

Run the owning E2E through verifier and inspect only verifier-managed observable state needed to answer:

1. after the success card is removed, does the physical root-relative table offset change as expected? (already observed in CI, preserve this fact);
2. does the mounted logical range after the second deep scroll remain stale/boundary-incomplete?;
3. does the existing entity-local bound/offset observation fail to propagate the composition movement before the later scroll, or does the shared virtualizer fail despite receiving a correct reactive offset?

If the problem is entity-local observation/update, correct the minimum existing path.

If evidence selects shared virtualization/public-contract ownership, STOP. Do not patch shared code.

### Pass 2 — correct interior proof precondition

Change the E2E so it does not equate `physical scroll range / 2` with logical interior.

Use mounted logical row/property indices to prove that the current range is strictly interior before asserting two-sided spacers. The test may move the physical scroll position as needed through product scrolling, but must remain deterministic and must not depend on exact-pixel equality, sleeps, retries, or production test hooks.

If a true logical interior range has missing leading/trailing spacers, treat that as production evidence and correct only the entity-local table integration if possible.

### Pass 3 — focused regression feedback

Use focused verifier runs for the corrected contracts, for example:

- `pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts`
- `pnpm verify --only e2e --files tests/e2e/databaseViewsAndQueryFlows.spec.ts` when needed to confirm cold-bootstrap persistence;
- `pnpm verify --only type-check` when production TypeScript/Vue changes.

No direct Playwright/Vite/browser execution.

### Pass 4 — mandatory cumulative branch gate

After focused feedback is clean, run:

`pnpm verify --base origin/develop`

If it finds another PR-caused in-contract failure:

1. diagnose it;
2. fix it;
3. use the smallest focused verifier run for fast feedback;
4. rerun `pnpm verify --base origin/develop`.

Repeat until the branch gate passes cleanly.

## Expected final files

Likely:

- `tests/e2e/databaseVirtualizationFlows.spec.ts`;
- `src/entities/databaseData/DatabaseDataTable.vue` only if the moving-surface failure or confirmed logical-interior evidence requires an entity-local production correction.

Do not broaden the file set without evidence.

Do not edit architect-owned review/architecture/handoff documents or PR metadata.

## Required preservation

- TanStack remains sole virtual range/measurement/cache owner.
- `useVirtualCollection` public API unchanged.
- transient row/column bootstrap remains derived from `source non-empty && virtual items empty`.
- settled spacers remain positive-distance-only.
- `physicalColumnCount` remains truthful.
- zero-distance boundary styling correction remains intact.
- relation roots remain independent.
- no materialization of the logical row × property cross product.

## Acceptance

Ready for handoff only when:

- both current E2E blockers pass without retry/flaky classification;
- cold relation bootstrap remains green;
- focused relevant feedback is green;
- `pnpm verify --base origin/develop` passes cleanly;
- no architecture/owner expansion was required.
