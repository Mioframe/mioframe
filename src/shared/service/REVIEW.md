# Review

Verdict: blocked

## Scope reviewed

- Remembered local-directory unavailable-root detection, two-stage reconnect/replacement, persisted/runtime provider replacement, repository cache/write-recovery coordination, worker-service surface, feature result handling, and required deterministic proof.

## Blockers

### B1 — Confirmed-replacement guard is not adjacent to persistence

Owner: `src/shared/service/fileSystem`

Problem: `replaceRememberedDeviceDirectory()` checks `isConfirmedReplacementBlocked()` and then calls `persistAndMountReplacement()`, which performs another awaited `getRecordList()` before persistence begins. The repository-cache guard is therefore a stale snapshot rather than the required check immediately before the locator-different replacement mutation.

Evidence:

- [File-system service](fileSystem/useFileSystemService.ts) — `replaceRememberedDeviceDirectory()` awaits the guard and then enters `persistAndMountReplacement()`, whose first operation is another `await getRecordList()` before `updateRecordList()`.
- [Persisted handle service](fileSystem/setupFileSystemDirectoryHandleService.ts) — `getRecordList()` is an async IndexedDB-backed observable read.

Basis:

- [Local directory access recovery architecture](../../../docs/local-directory-access-recovery.md) — confirmed replacement must be blocked while repository state is cached, the guard must be checked immediately before persistence, and data safety forbids replaying cached old repository state into locator-different storage.
- [CRDT and storage workflow](../../../.agents/skills/crdt-storage/SKILL.md) — caches and provider/repository lifecycle transitions are explicit data-safety state and require faithful transition handling.

Risk: Repository state can become cached after the guard reports clean but before persistence/remount begins. The same VFS path can then be rebound to different physical storage while an old Repo/DocHandle is active, defeating the safety invariant the guard was introduced to enforce.

Required final state: The confirmed-replacement guard decision and start of persisted replacement must form one serialized transition with no intervening async read/check window. If repository state is active before mutation begins, replacement returns `repositoryStateActive` with zero mutation.

Verification: Add a deterministic concurrency test that attempts to activate repository state between the replacement preflight and persistence and proves that the locator-different replacement cannot commit after a stale clean guard result.

### B2 — Required cross-service repository recovery proof is absent

Owner: `src/shared/service`

Problem: Current tests prove the two services independently but never exercise the real file-system ↔ repositories registration together. `useFileSystemService.test.ts` installs an artificial write-recovery handler, while `repositoriesService.test.ts` mocks the file-system service. The required scenario with a real cached repository/queued write being settled by same-entry reconnect is therefore not covered.

Evidence:

- [File-system service tests](fileSystem/useFileSystemService.test.ts) — same-entry settlement proof manually registers a mock write-recovery handler.
- [Repositories service tests](repositories/repositoriesService.test.ts) — the file-system service, write-recovery registration, and confirmed-replacement registration are mocked.

Basis:

- [Local directory access recovery architecture](../../../docs/local-directory-access-recovery.md) — required proof explicitly includes a same-entry cross-service scenario with cached repository/queued writes settled after provider remount.
- [Testing architecture](../../../docs/testing/architecture.md) — deterministic multi-module outcomes belong in unit tests when they can faithfully prove the boundary; green verification does not replace missing contract proof.
- [Project review skill](../../../.agents/skills/project-review/SKILL.md) — missing required proof is a blocker.

Risk: Registration/wiring, ordering, or real queued-save interaction between the two services can regress while all current mocked tests remain green.

Required final state: Add one faithful deterministic multi-module proof using the actual file-system/repositories coordination for the same-entry reconnect lifecycle, including cached repository queued-write settlement after remount and the non-flushed outcome.

Verification: The test must fail if repositories does not register its real recovery handler with fileSystem, if reconnect does not invoke it after remount, or if queued writes are not settled through the rebound same-entry mount.

## Major issues

### M1 — Confirmed-replacement registration leaks into the worker client surface

Owner: `src/shared/service`

Problem: `registerConfirmedReplacementGuard` is returned from `useFileSystemService()`. `setupMainService()` publishes the complete file-system service object, and `defineWorkerClient` recursively exposes every function in that object as a remote client method. The new repository lifecycle callback is therefore not service-internal as required.

Evidence:

- [File-system service](fileSystem/useFileSystemService.ts) — `registerConfirmedReplacementGuard` is part of the returned service object.
- [Main service setup](setupMainService.ts) — `fileSystem: useFileSystemService()` is published without a narrower projection.
- [Worker client](../lib/wrapWorker/defineWorkerClient.ts) and [proxy types](../lib/proxyService/types.ts) — the complete setup object is recursively mapped into client-callable functions.

Basis:

- [Local directory access recovery architecture](../../../docs/local-directory-access-recovery.md) — repository lifecycle hooks must remain service-internal and must not be exposed through `@shared/service`, entities, or UI contracts.
- [Service rules](AGENTS.md) — `@shared/service` is a narrow public worker-service client contract; background implementation details must not be leaked upward.

Risk: An internal callback-registration capability becomes part of the UI-visible worker API and lets upper layers participate in repository/file-system lifecycle coordination that they do not own.

Required final state: Repositories must retain same-runtime access to the confirmed-replacement registration mechanism, while `useMainServiceClient().fileSystem` must not expose that lifecycle hook.

Verification: Add or update a type/contract proof for the public worker client surface and retain focused repositories/file-system lifecycle tests.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
