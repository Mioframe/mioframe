# Managed pinned application updates — implementation preflight

**Status: ready for staged implementation.**

Authoritative architecture: [`docs/managed-pinned-updates.md`](./managed-pinned-updates.md).

Existing code and tests are reusable evidence, not compatibility contracts. The feature has not shipped; old descriptor/state/protocol formats are removed rather than migrated.

## Owner map

| Owner                        | Responsibility                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| Release contract/publication | Node publisher validator, runtime schema, shared corpus, retained archive, `latest.json`        |
| Pure lifecycle               | `contracts.ts`, `controllerState.ts`, `stateTransitions.ts`, snapshot/protocol release payloads |
| Worker runtime               | PWA config, `src/sw.ts`, predecessor probes, reconciliation, preparation, fetch, activation     |
| Client/UI                    | service client, entity projection, existing features, settings/widget/pane                      |
| Verification                 | colocated tests, real worker wiring, existing managed-update E2E and verify metadata            |

Reuse `OperationQueue`, `PreparationCoordinator`, exact-release restoration, marker-last release caches, watchdog, channel isolation, response-before-follow-up ordering, and existing FSD owners.

Minimum design: one `/sw.js`, one active plus optional candidate, no bridge, no persistent bootstrap marker, no new scheduler. Concurrent work is deduplicated only while in flight.

## Pass order

1. **Atomic release contract and pure state**
   - replace UUID plus sequence with positive safe-integer `releaseNumber` in publisher and runtime together;
   - update shared corpus, archive layout, cache identity, watchdog literals, state/snapshot/protocol types, and pure transitions;
   - preserve additive compatibility rules for controller/state/protocol/watchdog contracts;
   - leave descriptor parity, type checking, and focused unit verification green.

2. **Same-path bootstrap and worker runtime**
   - keep stable/develop managed worker at `/sw.js`;
   - implement concurrent 5-second managed and compatible-Workbox probes against `registration.active`;
   - treat Workbox `CACHE_URLS` with an empty list as compatibility evidence, not unique historical identity;
   - preserve valid state, reject invalid state, reject active-managed plus absent state, and support crash-safe retry after state write;
   - trigger reconciliation on every owned top-level navigation and after Manual → Automatic; coalesce only concurrent operations;
   - implement Manual discovery without background preparation and Automatic discovery/preparation;
   - implement clean-launch activation, fetch routing, restoration, broadcasts, watchdog handling, and cleanup;
   - do not add a bridge, marker, manager, polling, or once-per-worker latch.

3. **Client, entity, features, and UI**
   - add explicit `success | timeout | unavailable` outcomes;
   - apply 10-second short and 120-second long UI transport deadlines;
   - preserve the last valid snapshot on timeout;
   - project one candidate and preserve existing feature entry points/FSD ownership;
   - show Manual `available` notifications from worker-owned background discovery.

4. **Complete scenario proof**
   - rewrite existing fixtures/specs in place;
   - prove native Workbox → managed same-path bootstrap, ambiguous-predecessor rejection, interrupted install retry, delayed release-1 recovery, Manual discovery, controller compatibility with pinned releases, clean-launch semantics, first managed rollback, restoration, isolation, uncontrolled windows, and cross-engine lifecycle.

Do not begin the next pass before focused repository verification and architect review of the previous pass.

## TEST IMPACT

**Changed contracts:** release identity/layout; descriptor parity; persisted lifecycle; predecessor compatibility; launch reconciliation; Manual discovery; controller backward compatibility; clean-launch activation; `BOOT_OK`; client outcomes; UI candidate projection; rollback data compatibility.

**Primary proof owners:**

- publisher/runtime/shared-corpus/state/protocol/cache deterministic tests;
- frozen Workbox artifact and probe contract tests;
- real `src/sw.ts` install/fetch/reconciliation/activation tests;
- boot watchdog parity and app bootstrap tests;
- app-update client/entity/feature/widget component tests;
- `tests/e2e/appUpdatesNavigation.spec.ts`;
- existing `tests/e2e/release/managedUpdates*.spec.ts` and fixtures.

**Required proof:**

- publisher/runtime descriptor parity, safe allocation, overflow/pre-write rejection, append-only archive, and `latest.json` last;
- complete single-candidate transition matrix;
- every frozen known Workbox artifact returns exactly `true` to empty `CACHE_URLS` without mutation;
- managed controller returns only the managed probe and never answers Workbox identity;
- valid state is preserved; invalid state rejects; managed plus absent rejects; compatible Workbox plus absent bootstraps; timeout/conflict/unknown rejects;
- interrupted bootstrap retries without selecting another release;
- a failed release-1 check is repeated on a later navigation and discovers a release published afterward;
- concurrent launch reconciliation is deduplicated only while in flight;
- Manual launch discovery persists `available` without preparation; Automatic prepares to `ready`;
- controller upgrades continue serving pinned older app/watchdog/protocol/state contracts;
- controlled and uncontrolled same-channel windows block activation; sole-window reload qualifies; concurrent navigations create only one activation transition; foreign channels do not participate;
- `BOOT_OK` occurs only after root mount, initial routing, and first render;
- release 2 proves normal commit, failed-boot rollback, and exact restoration;
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
