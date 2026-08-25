# Database virtualization moving-surface proof correction handoff

Status: **implemented; exact-head CI pending**.

## Goal

Make the existing moving-surface product proof proportional and deterministic within the repository's normal per-test budget without changing the production virtualization implementation or weakening the product contract.

## Confirmed evidence

Exact-head GitHub Actions run #4334 on `3fb69ea622edf53837587c67e9fb9b4e9e218d7a` failed only application E2E.

Owning scenario:

`tests/e2e/databaseVirtualizationFlows.spec.ts` -> `keeps real preceding Database content connected to the table-owned surface range`.

Desktop Chromium exhausted the normal 30-second test timeout on the initial attempt and both retries, at different phases. Mobile Chrome passed.

The previous scenario:

1. created the real Weekly Plan starter example;
2. kept the real `Example created` card before the Database table;
3. started with the five real starter rows;
4. performed 40 sequential full Add Item dialog flows;
5. only then performed the moving-surface geometry/range lifecycle.

The repeated setup dominated the test budget and was not part of the contract being proved.

Independent evidence already accepted:

- shared `useVirtualCollection(surfaceOffset)` proves `deep -> change while deep -> top -> deep` on the same root/list;
- top-level numeric diagnosis found widget-supplied offsets equal to physical root-to-layout offsets at all required checkpoints;
- production geometry/shared virtualization therefore must not be changed from this CI failure alone.

## Implemented correction

Only `tests/e2e/databaseVirtualizationFlows.spec.ts` changed.

The moving-surface scenario now:

- uses `640 x 360` on desktop;
- preserves the Mobile Chrome project width (`393px` in the current project) and uses height `360px`;
- keeps the five real Weekly Plan starter rows;
- adds exactly 16 additional Task rows through the existing public Add Item flow;
- therefore exercises 21 real data rows (`aria-rowcount=22` including the header);
- preserves the real `Example created` / `Got it` lifecycle;
- preserves physical surface movement proof;
- proves mounted rows are fewer than logical data rows at top/deep states;
- reaches logical tail `22/22` before and after the surface moves.

No production code changed.

## Contract owned by this E2E

The product proof retains the complete real lifecycle:

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

## Verification correction

The earlier handoff incorrectly required:

`pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts --repeat 3`

That command is not supported by the current verifier. Repository verification policy defines `--repeat` as a bounded **Storybook-behavior-only** diagnostic requiring `--only storybook-behavior` and explicit files. It is not an E2E option.

Therefore the unsupported repeat command is removed from acceptance criteria.

Required evidence for this E2E correction is:

1. focused verifier-managed E2E:
   `pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts`;
2. normal branch-diff handoff gate:
   `pnpm verify --base origin/develop`;
3. exact-head GitHub CI as the authoritative controlled-environment merge gate.

The coding agent reported the focused moving-surface proof clean in multiple independent executions. Its branch gate stopped on a different existing `databaseViewsAndQueryFlows.spec.ts` relation-view failure, as required by repository rules for a failure assessed as outside the assigned correction. Exact-head CI must determine the published-head merge state.

A retry-pass/flaky classification of the **moving-surface scenario itself** remains unacceptable.

## Stop condition

If the proportional moving-surface proof itself fails to reach logical tail, loses boundedness, or reports incorrect surface movement with meaningful test budget remaining, production architecture must be reopened from that concrete evidence.

Do not respond by:

- increasing the test timeout;
- adding sleeps;
- adding retries/recovery loops;
- changing production geometry;
- changing `useVirtualCollection`;
- calling `virtualizer.measure()`;
- adding observers/remounts/cache resets.

If the fixed 16-row setup does not produce a bounded virtualized range in one project, report mounted/logical row counts rather than silently increasing dataset size or changing project applicability.

## Expected changed file

Only:

- `tests/e2e/databaseVirtualizationFlows.spec.ts`

No production file is expected to change.

## Remaining PR gates

- exact-head CI confirms the proportional moving-surface scenario without retry/flaky classification;
- operator visual reinspection;
- final resulting-PR review.

Any unrelated repository flake is handled by its truthful owner and must not be patched inside this proof correction.
