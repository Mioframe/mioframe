# Review

Verdict: blocked

## Scope reviewed

- Remembered local-directory unavailable-root detection, two-stage reconnect/replacement, persisted/runtime provider replacement, repository lease/write-recovery coordination, public worker-service projection, feature result handling, deterministic multi-service proof, and required real-browser proof.

## Blockers

### B1 — Confirmed-replacement lease is not exclusive across concurrent acquisitions

Owner: `src/shared/service/repositories`

Problem: `acquireConfirmedReplacementLease()` checks only `repoObservableCache` before writing `reservedMountReleaseGates.set(mountPath, gate)`. It does not reject or serialize an already-active reservation for the same mount. A second acquisition can therefore overwrite the first gate. When either holder releases, `delete(mountPath)` can remove the other holder's reservation and allow repository creation while the other locator-different replacement is still in progress.

Evidence:

- [Repositories service](repositories/repositoriesService.ts) — lease acquisition checks cached repositories but not `reservedMountReleaseGates` before replacing the map entry; `release()` deletes by mount path rather than by lease identity.
- [Repositories service tests](repositories/repositoriesService.test.ts) — existing lease tests cover cached state, sibling isolation, and repository access gating, but not repeated/concurrent acquisition for one mount.

Basis:

- [Local directory access recovery architecture](../../../docs/local-directory-access-recovery.md) — the repository-owned lease is required to be exclusive for the complete locator-different persistence/remount transition and no Repo may be created under the reserved mount until release.
- [CRDT and storage workflow](../../../.agents/skills/crdt-storage/SKILL.md) — lifecycle/cache changes must cover multiple independent callers when applicable and lifecycle-managed resources require explicit cleanup semantics.

Risk: Two confirmed replacements for the same mount can both enter the critical section; one release can prematurely remove the other's exclusion and permit an old/new Repo to be created while the mount is still being rebound. This defeats the core data-safety invariant of the lease architecture.

Required final state: At most one confirmed-replacement lease may own a mount at a time. An overlapping acquisition must not overwrite or release another holder's reservation, and repository creation must remain blocked until the actual active holder releases. The behavior of a second confirmed replacement must be explicit and must not reuse stale persisted-record state.

Verification: Add deterministic repeated/concurrent-acquisition proof for the same mount, including release ordering, and prove repository access cannot resume until the owning lease is released.

### B2 — Required cross-service proof is timing-dependent and does not fully prove queued-write settlement

Owner: `src/shared/service`

Problem: `fileSystemRepositoriesReplacement.integration.test.ts` now exercises the real service registration, but its mandatory lifecycle proof relies on arbitrary `setTimeout` waits (`20 ms` and `250 ms`) to infer when Automerge saves, lease acquisition, and deferred persistence have reached the desired state. The same-entry success case also does not assert that the deliberately queued document bytes were actually written through the rebound handle; it only asserts the returned reconnect status.

Evidence:

- [Cross-service integration proof](fileSystemRepositoriesReplacement.integration.test.ts) — `wait(250)` is used to let background saves settle and `wait(20)` is used to infer lease/persistence state before concurrency assertions.
- [Testing architecture](../../../docs/testing/architecture.md) — required deterministic multi-module proof must use direct observable boundaries and explicitly forbids arbitrary sleeps that can hide timing defects.

Basis:

- [Local directory access recovery architecture](../../../docs/local-directory-access-recovery.md) — requires deterministic same-entry proof that a real cached repository queued write is settled after remount, plus deterministic locator-different lease concurrency proof.
- [Testing architecture](../../../docs/testing/architecture.md) — failures must remain visible; arbitrary sleeps are not valid synchronization, and deterministic multi-module outcomes should use the lowest faithful deterministic proof.
- [Project review skill](../../../.agents/skills/project-review/SKILL.md) — missing or non-faithful mandatory proof is a blocker.

Risk: The tests can pass or fail based on scheduler/runtime timing rather than the contract, and a regression where the queued save is not actually persisted through the rebound provider may still satisfy the current status-only assertion.

Required final state: Replace timing sleeps with explicit deferred barriers/observable events owned by the test, and assert the queued write reaches the rebound same-entry storage (or another direct storage effect proving the same contract). Lease-concurrency proof must know deterministically when persistence has started and when repository access is blocked/released.

Verification: The cross-service test must fail deterministically if real lifecycle registration is missing, if the queued write is not persisted after same-entry remount, if repository creation occurs during a locator-different lease, or if release does not unblock it.

### B3 — Final real Chrome/PWA recovery proof is still required

Owner: `src/features/localDirectoryRecovery`

Problem: The architecture contract still requires real Chrome/PWA verification after the final recovery implementation because mocked `FileSystemDirectoryHandle` behavior cannot prove actual permission persistence, picker identity behavior, or installed/browser reconnect behavior. The previously observed browser mismatch drove the architecture changes, but the final lease-based implementation has not yet been reported as operator-verified.

Evidence:

- [Local directory access recovery architecture](../../../docs/local-directory-access-recovery.md) — final real Chrome/PWA proof remains mandatory, including the previously failing locator-different scenario and reload/retry behavior when repository state is active.

Basis:

- [Project review skill](../../../.agents/skills/project-review/SKILL.md) — missing proof is a finding when the project requires that proof.

Risk: The PR could be accepted without proving the browser behavior that motivated the recovery feature and its revised identity/reconnect flow.

Required final state: The final implementation passes the architecture handoff's real Chrome/PWA operator scenarios without revealing a new implementation or architecture defect.

Verification: Repeat the required revoked-access, unavailable-root, cancellation, same-entry, locator-different confirmed replacement, active-repository reload/retry, and non-Mioframe selection scenarios in real Chrome/PWA.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

- The architecture currently requires an exclusive lease but does not explicitly choose whether a second same-mount confirmed replacement waits, returns a dedicated expected result, or is otherwise rejected. Resolve that behavior before coding the B1 correction so stale pre-lease record state cannot be reused.
