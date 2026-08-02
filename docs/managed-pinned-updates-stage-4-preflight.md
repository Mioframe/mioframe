# Managed pinned updates Stage 4 — implementation preflight

**Status:** ready. Stage 3 verification is idle and the accepted architecture has no unresolved Stage 4 decision.

- Authoring source: `docs/managed-pinned-updates.md`, the staged preflight, and the user-provided Stage 4 contract.
- Source/runtime owner: `updateDiscovery.ts` owns one fresh-state pass; `updateReconciliation.ts` owns only the shared promise and rerun flag.
- Protocol/composition owners: `workerMessages.ts` maps Check and changed-mode requests; `src/sw.ts` creates one reconciler and attaches navigation/message lifetimes.
- Persistence owner: existing `controllerState.ts`, `withState()`, `OperationQueue`, and Stage 2 transition functions remain unchanged.
- Preparation/cleanup owner: existing `PreparationCoordinator` retains exact-identity deduplication and cleanup arbitration only.
- Public entry points: the three explicit `UpdateReconciler` methods passed directly from `src/sw.ts`; no barrel, generic command, or service locator.
- Minimum design: one pass function plus one factory with exactly `inFlightPromise` and `rerunRequested`. A queue/trigger set/generation/state-machine alternative adds concepts without improving the required semantics and is rejected.
- Acceptance: navigation and Check join; changed mode requests a collapsed fresh rerun; each pass fixes its starting mode; Manual never prepares; Automatic is latest-first with the single available-candidate discovery-failure fallback; pinned candidates are no-ops.
- Failure/recovery: transient discovery/preparation errors are snapshot-only; long completions re-read state; stale preparations cannot persist and clean only unprotected caches; broadcast/cleanup stay best effort after persistence.
- Pass order: replace scheduler with red/green reconciliation proof; consolidate discovery/preparation pass; migrate protocol and worker wiring; update the existing release E2E; run static, deterministic, browser, mutation, then the single release gate.

## TEST IMPACT

Changed contracts: worker-local reconciliation concurrency, discovery/preparation mode policy, message response/follow-up ordering, and owned-navigation event lifetime.

Risks: premature shared-promise settlement, lost or extra reruns, stale mode/candidate writes, preparation before latest discovery, cache cleanup of a protected release, response delay, and once-per-worker suppression surviving in wiring.

Proof owners: deterministic service/worker behavior in `updateReconciliation.test.ts`, `updateDiscovery.test.ts`, `workerMessages.test.ts`, `activationDiscoveryOrchestration.test.ts`, and `src/sw.test.ts`; complete browser outcome in the existing `managedUpdatesAutomaticCheck.spec.ts`; focused mutation audit for reconciliation and discovery decisions.

Existing proof: Stage 2 transition tests and Stage 3 preparation, fetch, install, protocol, and restoration suites remain authoritative and are changed only for compile wiring where required.

New or changed tests: add the reconciliation sibling test; rewrite scheduler/discovery assertions in place; remove the scheduler sibling test; extend existing message, worker, orchestration, and release E2E owners with the required matrices and races.

Repository impact metadata updates: no spec is added, moved, renamed, or removed; verify mappings are inspected and changed only if the existing source-to-spec mapping does not already cover the new `updateReconciliation.ts` owner.

Task-specific measurements: none; no performance claim is introduced.
