# Review

Verdict: blocked

## Scope reviewed

- Remembered local-directory unavailable-root detection, two-stage reconnect/replacement, persisted/runtime provider replacement, repository cache/write-recovery coordination, worker-service surface, feature result handling, and required deterministic proof.

## Blockers

### B1 — Point-in-time repository guard cannot protect the asynchronous replacement transition

Owner: `src/shared/service/fileSystem` + `src/shared/service/repositories`

Problem: `replaceRememberedDeviceDirectory()` currently checks repository cache once and then performs asynchronous persisted-record read/write and provider remount work. `repoByPath$()` can create/cache a Repo while those awaits are in progress, so a clean boolean guard can become stale before the locator-different rebind completes.

Evidence:

- [File-system service](fileSystem/useFileSystemService.ts) — `replaceRememberedDeviceDirectory()` awaits `isConfirmedReplacementBlocked()` and then enters asynchronous `persistAndMountReplacement()`.
- [Repositories service](repositories/repositoriesService.ts) — `repoByPath$()` inserts a new cached repository whenever the path is not already cached; it has no replacement exclusion state.
- [Persisted handle service](fileSystem/setupFileSystemDirectoryHandleService.ts) — persisted replacement is asynchronous IndexedDB-backed work.

Basis:

- [Local directory access recovery architecture](../../../docs/local-directory-access-recovery.md) — locator-different replacement now requires a repository-owned exclusive lease held through persistence/remount, and Repo creation under that mount must wait for lease release.
- [CRDT and storage workflow](../../../.agents/skills/crdt-storage/SKILL.md) — caches and provider/repository lifecycle transitions are lifecycle-managed data-safety state and require explicit cleanup and transition proof.

Risk: The same VFS path can be rebound to different physical storage while an old Repo/DocHandle becomes active, allowing old in-memory state to observe or write through the new storage path.

Required final state: Replace the boolean confirmed-replacement guard with the ready architecture lease contract. Repositories atomically checks its cache and reserves the mount before returning the lease; fileSystem holds that lease through persistence/remount/cleanup and releases it in `finally`; repository access under a reserved mount cannot create/cache a Repo until release. Pre-existing cached repository state still returns `repositoryStateActive` with zero mutation.

Verification: Add deterministic concurrency proof that holds confirmed replacement at a deferred persistence boundary, attempts real repository access while the lease is active, proves no Repo is created/cached during the critical section, and proves repository access resumes only after release on both success/failure paths.

### B2 — Required cross-service repository recovery proof is absent

Owner: `src/shared/service`

Problem: Current tests prove fileSystem and repositories independently but never exercise their actual same-runtime registration together. `useFileSystemService.test.ts` installs artificial recovery handlers, while `repositoriesService.test.ts` mocks the file-system service. The required scenario with a real cached repository/queued write being settled by same-entry reconnect is therefore not covered.

Evidence:

- [File-system service tests](fileSystem/useFileSystemService.test.ts) — same-entry settlement proof manually registers a mock write-recovery handler.
- [Repositories service tests](repositories/repositoriesService.test.ts) — file-system lifecycle registration is mocked.

Basis:

- [Local directory access recovery architecture](../../../docs/local-directory-access-recovery.md) — required proof explicitly includes actual fileSystem/repositories registration for same-entry queued-write settlement and locator-different replacement concurrency.
- [Testing architecture](../../../docs/testing/architecture.md) — deterministic multi-module outcomes belong in unit tests when they can faithfully prove the boundary; green verification does not replace missing contract proof.
- [Project review skill](../../../.agents/skills/project-review/SKILL.md) — missing required proof is a blocker.

Risk: Registration/wiring, ordering, queued-save settlement, or replacement exclusion can regress while mutually mocked service tests remain green.

Required final state: Add faithful deterministic multi-module proof using the actual file-system/repositories coordination: same-entry reconnect settles a real cached repository/queued save after remount, and locator-different replacement excludes concurrent repository creation while its lease is active.

Verification: The proof must fail if repositories does not register its real lifecycle callbacks, reconnect does not invoke settlement after remount, queued writes are not settled through the rebound same-entry mount, or repository creation bypasses an active confirmed-replacement lease.

## Major issues

### M1 — Repository lifecycle registration leaks into the worker client surface

Owner: `src/shared/service`

Problem: lifecycle registration functions are returned from `useFileSystemService()`, while `setupMainService()` publishes that complete object. `defineWorkerClient` recursively exposes its functions as remote client methods. Background-only repository/file-system coordination therefore leaks into the UI-visible worker API.

Evidence:

- [File-system service](fileSystem/useFileSystemService.ts) — lifecycle registration is part of the returned internal service object.
- [Main service setup](setupMainService.ts) — `fileSystem: useFileSystemService()` publishes the complete object without a public projection.
- [Worker client](../lib/wrapWorker/defineWorkerClient.ts) and [proxy types](../lib/proxyService/types.ts) — the complete setup object is recursively mapped into client-callable functions.

Basis:

- [Local directory access recovery architecture](../../../docs/local-directory-access-recovery.md) — write-recovery and confirmed-replacement lease registration must remain background-service internal; `setupMainService()` must publish a narrower file-system projection.
- [Service rules](AGENTS.md) — `@shared/service` is a narrow public worker-service client contract; background implementation details must not be leaked upward.

Risk: Upper layers can participate in repository/file-system lifecycle coordination they do not own, and internal callback contracts become accidental public API.

Required final state: Internal services retain direct same-runtime access through `useFileSystemService()`, while `setupMainService().fileSystem` / `useMainServiceClient().fileSystem` omit write-recovery and confirmed-replacement lease registration capabilities.

Verification: Add/update a type or contract test for the published worker file-system surface and retain focused internal lifecycle tests.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
