# Database virtualization moving-surface proof correction handoff

Status: **ready for implementation**.

## Goal

Make the existing moving-surface product proof proportional and deterministic within the repository's normal per-test budget without changing the production virtualization implementation or weakening the product contract.

## Confirmed evidence

Exact-head GitHub Actions run #4334 on `3fb69ea622edf53837587c67e9fb9b4e9e218d7a` failed only application E2E.

Owning scenario:

`tests/e2e/databaseVirtualizationFlows.spec.ts` -> `keeps real preceding Database content connected to the table-owned surface range`.

Desktop Chromium exhausted the normal 30-second test timeout on the initial attempt and both retries, at different phases. Mobile Chrome passed.

The scenario currently:

1. creates the real Weekly Plan starter example;
2. keeps the real `Example created` card before the Database table;
3. starts with the five real starter rows;
4. performs 40 sequential full Add Item dialog flows;
5. only then performs the moving-surface geometry/range lifecycle.

The repeated setup dominates the test budget and is not part of the contract being proved.

Independent evidence already accepted:

- shared `useVirtualCollection(surfaceOffset)` proves `deep -> change while deep -> top -> deep` on the same root/list;
- top-level numeric diagnosis found widget-supplied offsets equal to physical root-to-layout offsets at all required checkpoints;
- production geometry/shared virtualization therefore must not be changed from this CI failure alone.

## Contract owned by this E2E

The product proof must retain the complete real lifecycle:

1. real Weekly Plan starter creation;
2. real success card visibly precedes the Database surface;
3. the collection is genuinely virtualized and bounded;
4. first deep scroll reaches the logical tail while the card is present;
5. real `Got it` action removes the card;
6. the physical table surface moves upward;
7. returning to top reaches the first logical row;
8. second deep scroll reaches the logical tail again;
9. mounted work remains bounded.

Large-dataset stress is not owned here. Separate virtualization proofs already own 160-row deep ranges and the 30,000 x 300 bounded-scale contract.

## Architecture decision

This is a **test-only proof correction**.

Production code is unchanged.

### Viewport

Before launching the app, set a compact viewport height of `360px` for this scenario.

- Desktop Chromium: use `640 x 360`.
- Mobile Chrome: preserve the project's existing mobile viewport width and set only the height to `360px`.

Do not change persistent project applicability. The scenario remains eligible for both projects.

The compact height is part of deterministic test setup: it guarantees the small dataset still exercises a true virtualized range.

### Rows

Keep the five real Weekly Plan starter rows and add exactly **16** additional Task rows through the existing public Add Item flow.

Total data rows after setup: 21.

This is intentionally small enough to avoid the 40-dialog setup cost while still exceeding the compact viewport's mounted range under the current Database row virtualization (`48px` estimate, overscan `4`). The existing bounded assertions remain the authoritative proof that the collection is actually virtualized; do not replace them with assumptions from those constants.

Use one named constant in the test, e.g. `additionalSurfaceRangeRowCount = 16`, rather than a magic number repeated across assertions.

## Required assertions retained

Do not remove or weaken:

- non-zero initial horizontal surface offset;
- non-zero initial vertical surface offset;
- top range has mounted rows and starts at logical row index `2`;
- top mounted range is smaller than the logical data-row count;
- first deep phase reaches `lastRowIndex === rowCount`;
- first deep mounted range remains bounded;
- real success card is dismissed through `Got it`;
- dismissed physical vertical surface offset is smaller than the original offset;
- moved top range starts at logical row index `2` and remains bounded;
- second deep phase reaches `lastRowIndex === rowCount`;
- second deep mounted range remains bounded.

Update any setup-size-specific arithmetic so it derives from the real total data-row count (`5 + additionalSurfaceRangeRowCount`) rather than the old 40-row array length.

Prefer `rowCount`/existing observable table contracts where they already express the same requirement.

## Stop condition

After the proportional setup is implemented, run the focused proof.

If the test now fails because the logical tail is not reached, surface movement is incorrect, or another owned geometry/range assertion fails **without first consuming the global 30-second setup budget**, STOP and report the exact browser-observable state.

That result reopens production architecture.

Do not respond by:

- increasing the test timeout;
- adding sleeps;
- adding retries/recovery loops;
- changing production geometry;
- changing `useVirtualCollection`;
- calling `virtualizer.measure()`;
- adding observers/remounts/cache resets.

If the fixed 16-row setup unexpectedly does not produce a bounded virtualized range in one project, STOP and report mounted/logical row counts rather than silently increasing dataset size or changing project applicability.

## Expected changed file

Only:

- `tests/e2e/databaseVirtualizationFlows.spec.ts`

No production file is expected to change.

## Verification

Focused feedback:

`pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts`

Then bounded stability proof:

`pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts --repeat 3`

If the normal profile passes, do not force the GitHub-Actions profile merely to create another environment.

If the normal profile does not reproduce the GitHub-specific execution pressure and the task needs confirmation before handoff, one focused run with `--profile github-actions` is authorized:

`pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts --profile github-actions`

Final cumulative branch gate:

`pnpm verify --base origin/develop`

The final branch gate uses the normal local profile and must not add `--profile github-actions`.

## Acceptance criteria

- only the moving-surface E2E proof changes;
- desktop viewport is `640 x 360`;
- mobile project width is preserved while its height is `360px`;
- exactly 16 additional rows are created;
- success-card lifecycle remains real;
- both deep phases reach logical tail;
- both top/deep phases prove bounded mounted work;
- physical surface movement remains asserted;
- focused proof passes without retry/flaky classification;
- `--repeat 3` passes cleanly;
- `pnpm verify --base origin/develop` passes;
- no timeout/sleep/retry/production recovery is introduced.

## Forbidden

- production code changes;
- shared virtualization or TanStack changes;
- Database geometry changes;
- changing relation or sticky corrections;
- changing E2E project applicability;
- increasing the per-test timeout;
- `test.slow()` or equivalent timeout multiplication;
- sleeps;
- retry-as-success;
- force actions;
- recovery loops;
- direct Playwright/Vite/browser commands;
- raw/mutating Git workflow;
- `pnpm verify --full` as handoff gate;
- editing architect-owned review/architecture documents;
- unrelated cleanup.
