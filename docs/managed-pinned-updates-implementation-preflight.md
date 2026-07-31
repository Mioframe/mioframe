# Managed pinned application updates — implementation preflight

**Status: ready for staged implementation.**

Authoritative architecture: [`docs/managed-pinned-updates.md`](./managed-pinned-updates.md).

Existing code and tests are reusable evidence, not compatibility contracts. The feature has not shipped; old descriptor/state/protocol formats are removed rather than migrated.

## Owner map

| Owner                        | Responsibility                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| Release contract/publication | Node publisher validator, runtime schema, shared corpus, retained archive, `latest.json`        |
| Pure lifecycle               | `contracts.ts`, `controllerState.ts`, `stateTransitions.ts`, snapshot/protocol release payloads |
| Worker runtime               | PWA config, `src/sw.ts`, install probes, preparation, fetch, activation, cleanup                |
| Client/UI                    | service client, entity projection, existing features, settings/widget/pane                      |
| Verification                 | colocated tests, real worker wiring, existing managed-update E2E and verify metadata            |

Reuse `OperationQueue`, `PreparationCoordinator`, exact-release restoration, marker-last release caches, watchdog, channel isolation, response-before-follow-up ordering, and existing FSD owners.

Minimum design: one `/sw.js`, one active + optional candidate state, no bridge, no persistent bootstrap marker. The active predecessor is identified by bounded managed and Workbox read-only probes.

## Pass order

1. **Atomic release contract and pure state**
   - replace UUID + sequence with positive safe-integer `releaseNumber` in publisher and runtime together;
   - update shared corpus, archive layout, cache identity, watchdog literals, state/snapshot/protocol types, and pure transitions;
   - leave the repository type-safe and descriptor-parity green.

2. **Same-path bootstrap and worker runtime**
   - keep managed stable/develop at `/sw.js`;
   - implement concurrent 5-second managed-controller and empty-`CACHE_URLS` Workbox probes;
   - support the exact frozen pre-managed `generateSW` configuration family across build revisions;
   - implement crash-safe bootstrap retry, Automatic reconciliation, orchestration, fetch, activation, broadcasts, restoration, and cleanup;
   - do not add a bridge or persistent bootstrap marker.

3. **Client, entity, features, and UI**
   - add explicit `success | timeout | unavailable` outcomes;
   - apply 10-second short and 120-second long UI transport deadlines;
   - project one candidate while preserving entry points and FSD ownership.

4. **Complete scenario proof**
   - rewrite existing fixtures/specs in place;
   - prove native Workbox → managed same-path transition, supported legacy revisions, ambiguous-predecessor rejection, interrupted install retry, release-1 recovery path, first managed rollback, Automatic/Manual, restoration, isolation, uncontrolled windows, and cross-engine lifecycle.

Do not begin the next pass before focused repository verification and architect review of the previous pass.

## TEST IMPACT

**Changed contracts:** release identity/layout; descriptor parity; persisted lifecycle; predecessor identification; first managed bootstrap boundary; worker orchestration/fetch; client outcomes; UI candidate projection; rollback data compatibility.

**Primary proof owners:**

- publisher/runtime/shared-corpus/state/protocol/cache deterministic tests;
- frozen Workbox artifact and probe contract tests;
- real `src/sw.ts` install/fetch/ordering tests;
- app-update client/entity/feature/widget component tests;
- `tests/e2e/appUpdatesNavigation.spec.ts`;
- existing `tests/e2e/release/managedUpdates*.spec.ts` and fixtures;
- watchdog parity tests.

**Required proof:**

- publisher/runtime descriptor parity in Pass 1;
- safe allocation, overflow/pre-write rejection, append-only archive, `latest.json` last;
- complete single-candidate transition matrix;
- frozen stable/develop Workbox artifacts return exactly `true` to empty `CACHE_URLS` and perform no mutation;
- managed controller returns the exact managed probe and never answers `CACHE_URLS`;
- valid state is preserved; invalid state rejects; active managed + absent rejects; supported Workbox + absent bootstraps; unknown/conflicting/timeout evidence rejects;
- state-write interruption retries without selecting another release;
- release 1 is transition-only and a later fixed release can be discovered/prepared by first-navigation reconciliation even if app boot fails;
- release 2 proves normal `BOOT_OK`, rollback, and exact restoration;
- timeout clears busy without losing snapshot/capability;
- stale completion, fetch pass-through, cache protection, isolation, and data compatibility are covered.

Update `scripts/verify.mjs`, `scripts/lib/e2eRisk.mjs`, or other impact metadata only when durable source/spec ownership changes. Keep one mutation owner: rewritten `stateTransitions.ts`.

## Verification

After each pass, run the smallest repository-managed focused verification for all changed owners and report exact results. Pass 1 must include both Node and runtime parity/type/unit owners.

After Pass 4:

```text
pnpm verify --full --only managed-updates
pnpm verify:release
```

GitHub CI or raw underlying commands do not replace the final gate.

Unresolved blockers: none.

Verdict: **ready for Pass 1 task only**.
