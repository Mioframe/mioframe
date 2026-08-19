# Local directory access recovery — architecture handoff

This document is the implementation contract for recovering access to a remembered user-selected local directory without deleting or silently replacing the mounted space.

## Goal

When a remembered local directory can no longer be read, Mioframe must distinguish missing browser permission from an unavailable saved root and provide an explicit recovery flow. Reconnect must preserve repository-write safety when the mounted VFS path is rebound to a new browser handle.

## Confirmed current behavior

- `WebFileSystemProvider` distinguishes missing permission from a granted root-enumeration failure and emits the typed unavailable-root recovery error.
- `DeviceFileSystemProvider.upsertRecord()` can replace the provider while preserving the mounted name.
- `isSameEntry() === true` is the automatic same-locator reconnect fast path; false/unverifiable identity enters marker inspection plus explicit confirmation.
- `inspectMioframeSpaceDirectory()` is shared under `src/shared/lib/fileSystem` and checks the canonical `storage-adapter-id.automerge` marker.
- `repositoriesService` caches Automerge `Repo` + retrying storage adapters by VFS path. Failed access-required saves remain queued until repository settlement runs.
- `fileSystemAccessRequestRegistry` owns registered write-recovery handlers; today they run only from permission-request resolution.
- Real Chrome/PWA verification proved that the intended recovery directory can compare unequal through `isSameEntry()`.
- Semantic review proved that clearing the old access request during provider replacement can orphan queued repository writes unless reconnect coordinates the existing repository lifecycle.

## Non-goals

- recovery from an already-open/cached repository when locator identity is not proven;
- transferring live Automerge state between physically different storage directories;
- changing document-not-found semantics;
- Repository Explorer loading-state redesign;
- changing `PersistedDeviceDirectoryRecord` format;
- adding a persistent Mioframe space ID or persisting the Automerge storage-adapter ID;
- changing the Automerge marker format;
- multi-window/provider synchronization redesign;
- generic recovery managers, state machines, or shared UI primitives.

## Affected user scenarios

1. Saved handle is `prompt`/`denied`: existing `Permission required` recovery.
2. Permission is still granted but root enumeration fails: `Folder unavailable` + `Reconnect folder`.
3. Picker cancelled: no mutation.
4. `isSameEntry() === true`: replace the handle under the same mounted name, then settle cached repository writes through the new handle.
5. Same-entry repository settlement fails: the folder remains reconnected, failure is surfaced explicitly, and stale old-handle access requests are not retained.
6. `isSameEntry()` false/unavailable/throws: no mutation; inspect the selected directory.
7. No Mioframe marker: reject without mutation.
8. Mioframe marker present: require explicit replacement confirmation.
9. Confirmation cancelled: no mutation.
10. Confirmation accepted while a repository is cached under the mount: reject replacement without mutation and instruct the user to reload Mioframe before retrying.
11. Confirmation accepted with no cached repository under the mount: persist and mount the selected handle under the existing name.
12. Nested file/path failure on an otherwise readable root keeps its original semantics.

## Ownership

| Owner                                  | Responsibility                                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/shared/lib/webFileSystemProvider` | Permission/root-read semantics and provider-owned unavailable-root error                                           |
| `src/shared/lib/fileSystem`            | Canonical Mioframe marker inspection                                                                               |
| `src/shared/service/fileSystem`        | Persisted handle replacement, provider remount, access-request cleanup, service-internal reconnect lifecycle hooks |
| `src/shared/service/repositories`      | Source of truth for cached repository presence; repository settlement after proven same-entry remount              |
| `src/entities/mountedDirectories`      | Narrow UI-facing reconnect/replacement mutations                                                                   |
| `src/features/localDirectoryRecovery`  | Picker, marker inspection, confirmation, pending/result/error UX                                                   |
| `src/widgets/RepositoryExplorerWidget` | Recovery precedence/rendering only                                                                                 |
| page/pane                              | No change                                                                                                          |
| shared UI                              | No API/primitive change                                                                                            |

`fileSystem` must not import `repositories`. Cross-service coordination uses narrow service-internal registration, following the existing write-recovery-handler direction: repositories register lifecycle behavior with fileSystem.

## Source of truth

- Permission: remembered root handle at provider boundary.
- Persisted mounted key/current handle: `PersistedDeviceDirectoryRecord` by stable `name`.
- Same-locator proof: `FileSystemHandle.isSameEntry()`.
- Fallback candidate classification: shared Mioframe marker inspection.
- Historical sameness when locator proof is lost: explicit user confirmation, never marker/name heuristics.
- Cached/live repository presence: `repositoriesService` repo cache keyed by VFS path.
- Queued/in-memory repository writes: cached `Repo` + retrying storage adapter; repository settlement is the only owner allowed to flush them.

## Public and service-internal contracts

### `ReconnectDeviceDirectoryResult`

`reconnectDeviceDirectory({ spaceName, handle })` returns:

- `{ status: 'reconnected', name }` — same-entry replacement completed and repository settlement succeeded/no cached repo existed;
- `{ status: 'reconnectedWithWriteRecoveryFailure', name }` — same-entry provider replacement completed but repository settlement did not fully flush;
- `{ status: 'confirmationRequired' }` — locator equality is false/unavailable/throws; zero mutation;
- `{ status: 'missingRecord' }` — remembered record missing; zero mutation.

`reconnectedWithWriteRecoveryFailure` is a successful provider rebind with an explicit repository-write warning, not a rollback signal.

### `ReplaceRememberedDeviceDirectoryResult`

`replaceRememberedDeviceDirectory({ spaceName, handle })` returns:

- `{ status: 'reconnected', name }`;
- `{ status: 'repositoryStateActive' }` — at least one repository is cached at/under the mounted path; zero persisted/runtime/access-request mutation;
- `{ status: 'missingRecord' }`.

### Service-internal repository lifecycle

Add the minimum narrow coordination required by this feature:

1. `fileSystemAccessRequestRegistry` exposes one internal method that runs the already registered write-recovery handlers for a mount without requiring a pending permission request. `resolve()` and same-entry reconnect must share this execution path rather than duplicate handler loops.
2. `fileSystem` exposes one internal confirmed-replacement guard registration. `repositoriesService` registers a guard that reports blocked when its repo cache contains any path at or below the target mount.

Do not expose these lifecycle hooks through `@shared/service`, entities, or UI contracts.

## Minimum sufficient design

### Provider detection

Existing provider behavior remains unchanged:

1. pre-check read permission;
2. on failed root enumeration, re-query read permission once;
3. non-granted => existing permission recovery;
4. still granted => unavailable-root recovery;
5. nested failures remain ordinary failures.

### Same-entry reconnect

When `isSameEntry() === true`:

1. persist replacement record first;
2. remount provider under the same name;
3. clear stale access requests referencing the old handle;
4. run registered repository write-recovery handlers for the mounted path;
5. synchronize display state and rely on existing VFS invalidation;
6. return `reconnected` when settlement is flushed, otherwise `reconnectedWithWriteRecoveryFailure`.

Clearing old requests before settlement is intentional: if settlement hits a new permission failure, the new provider creates a fresh request containing the new handle. Do not retain an old-handle request.

No repository cache reset is required here because `isSameEntry() === true` proves the cached VFS path still refers to the same filesystem entry.

### Locator-different/unverifiable fallback

Feature behavior remains:

1. inspect selected handle for the Mioframe marker;
2. missing marker => expected rejection;
3. marker present => explicit `Replace location` confirmation;
4. cancellation => no mutation;
5. after confirmation call the explicit replacement mutation.

Marker presence is only candidate validation; it never proves historical identity.

### Confirmed remembered-location replacement

Before any persisted/runtime mutation:

1. await mounted-directory hydration and find the remembered record;
2. run the registered confirmed-replacement guards for `/Device Files/<spaceName>`;
3. if repositories reports cached state at/under the mount, return `repositoryStateActive` and change nothing;
4. otherwise persist the selected handle under the existing record name;
5. remount provider;
6. clear stale old-handle access requests;
7. synchronize display state and rely on existing VFS invalidation.

Do **not** replay or carry cached repository state into a locator-different replacement. The user must reload Mioframe and retry after `repositoryStateActive`; reload is the existing runtime boundary that guarantees old cached Repo/DocHandle state is gone.

The guard must be checked immediately before persistence. No new cross-service cache manager or repository migration is introduced.

If persistence fails, the old runtime provider remains mounted.

### Feature result handling

- `repositoryStateActive`: expected, no diagnostic exception; show `Mioframe still has this space open in memory. Reload Mioframe, then reconnect the folder again.`
- `reconnectedWithWriteRecoveryFailure`: expected service outcome; show `The folder is reconnected, but some pending changes could not be saved.` Do not report a second feature exception when repository/file-system diagnostics already own the failure.
- Existing picker/inspection/proxy unexpected failures keep the privacy-safe `DomainError` wrapping already defined for the feature.

## Rejected approaches

- Hard fail on `isSameEntry() !== true`: failed real-browser proof.
- Marker presence as historical identity: unsafe.
- Replay cached old Repo state into a locator-different confirmed replacement: can write old in-memory/queued data into an unrelated valid Mioframe space.
- Silently discard cached repository state before replacement: risks data loss.
- Attempt to migrate/rebind live Repo/DocHandle objects to another physical storage in this bug fix: unnecessary complexity and outside the confirmed requirement.
- Persist a new space/storage-adapter ID: does not solve legacy broken records and changes storage contracts.
- Import `repositoriesService` directly from `fileSystem`: wrong dependency direction/cycle.
- Add a generic lifecycle manager: the two narrow internal hooks above are sufficient.

## Shared UI blast radius

None. Reuse existing dialog, `MDButton`, and `MDEmptyState` APIs.

## Acceptance matrix

| Scenario                                                   | Required result                                                      |
| ---------------------------------------------------------- | -------------------------------------------------------------------- |
| permission `prompt`/`denied`                               | existing permission recovery                                         |
| granted root enumeration failure                           | unavailable-folder recovery                                          |
| picker cancelled                                           | no mutation                                                          |
| same entry, no cached writes                               | reconnected                                                          |
| same entry with queued/cached writes, settlement succeeds  | reconnected; writes flushed through new handle                       |
| same entry, settlement not fully flushed                   | provider remains reconnected; explicit write-recovery warning/result |
| locator differs/unverifiable                               | `confirmationRequired`; zero mutation                                |
| fallback candidate lacks marker                            | reject; zero mutation                                                |
| confirmation cancelled                                     | zero mutation                                                        |
| confirmed fallback with cached repository                  | `repositoryStateActive`; zero mutation                               |
| confirmed fallback after clean reload/no cached repository | persisted handle/provider replaced under same name                   |
| persistence failure                                        | old runtime provider remains mounted                                 |
| remembered record missing                                  | `missingRecord`; no new mount                                        |
| stale feature recovery target                              | no replacement/state overwrite                                       |
| nested child failure                                       | original semantics                                                   |

## Risk matrix

- **Data safety — high:** never replay cached old repository state into locator-different storage.
- **Pending writes — high:** same-entry reconnect must deterministically invoke existing settlement after remount.
- **Persistence consistency — high:** persist before runtime replacement.
- **Legacy recovery — high:** existing `{ name, handle }` records work without migration.
- **Feature race/staleness — medium:** preserve current stale-target guards.
- **Diagnostics privacy — medium:** no raw path/name/handle/external text in reportable metadata.
- **Performance — low:** repository guard/settlement runs only on explicit reconnect.

## Required proof

Implementation preflight owns exact `TEST IMPACT`; resulting proof must include:

- existing provider unavailable-root/permission/nested-error tests;
- shared marker inspection and `mioframeSpacePick` consumers;
- file-system safe attempt: true => reconnect; false/missing/throw => `confirmationRequired` with zero mutation;
- registry: direct write-recovery-handler execution shares the same handler semantics as permission `resolve()`;
- repositories: cached-path detection covers exact mount and descendants, not sibling mounts;
- same-entry cross-service proof: cached repository with queued writes is settled after provider remount; stale old request removed; success and non-flushed result covered;
- confirmed replacement: cached repository => `repositoryStateActive` with zero persistence/remount/request cleanup; clean cache => normal persistence-first replacement;
- feature: `repositoryStateActive` and `reconnectedWithWriteRecoveryFailure` UX are expected/non-diagnostic; existing confirmation/stale/error paths remain covered;
- widget/worker/diagnostics existing recovery proof remains valid.

Real Chrome/PWA operator verification remains required after correction, including the previously failing locator-different scenario and a reload/retry if `repositoryStateActive` is encountered.

## Required verification

- Run implementation preflight before code edits.
- Use focused verifier-managed checks while correcting.
- Final coding-agent handoff: one stable `pnpm verify`.
- Re-run `project-review` on the complete affected scope.
- Exact-head GitHub CI and real Chrome/PWA operator proof are required before merge readiness.

## Forbidden

- No `requestPermission()` in provider/service code.
- No picker/dialog in provider/service/entity/widget/page code.
- No `addDeviceDirectory()` reuse.
- No silent locator-different replacement.
- No marker-as-identity shortcut.
- No confirmed replacement while repository state is cached under the mount.
- No replay/discard/migration of cached Repo/DocHandle state into locator-different storage.
- No direct `fileSystem` -> `repositories` service import.
- No new persisted identity/record migration.
- No duplicated marker inspection or write-recovery handler loop.
- No raw browser/path/folder/handle values in diagnostics.
- No generic recovery/lifecycle manager or shared UI primitive change.

## Implementation readiness

- Product behavior: resolved.
- Repository lifecycle on same-entry reconnect: resolved — remount, clear stale request, run existing settlement.
- Repository lifecycle on locator-different confirmed replacement: resolved — block while repository cache exists; reload/retry is the supported boundary.
- Ownership/dependency direction: resolved through narrow service-internal registration.
- Persisted state/public API: resolved; no storage migration.
- Required proof: resolved at contract level.
- Unresolved blockers: none at architecture level; implementation/review findings remain until code matches this handoff.
- Verdict: **ready**.
