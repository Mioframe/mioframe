# Local directory access recovery — architecture handoff

This document is the implementation contract for recovering access to a remembered user-selected local directory without deleting or silently replacing the mounted space.

## Goal

When a remembered local directory can no longer be read, Mioframe must distinguish missing browser permission from an unavailable saved root and provide an explicit recovery flow. Reconnect must preserve repository-write safety when the mounted VFS path is rebound to a new browser handle.

## Confirmed current behavior

- `WebFileSystemProvider` distinguishes missing permission from a granted root-enumeration failure and emits the typed unavailable-root recovery error.
- `DeviceFileSystemProvider.upsertRecord()` can replace the provider while preserving the mounted name.
- `isSameEntry() === true` is the automatic same-locator reconnect fast path; false/unverifiable identity enters marker inspection plus explicit confirmation.
- `inspectMioframeSpaceDirectory()` is shared under `src/shared/lib/fileSystem` and checks the canonical `storage-adapter-id.automerge` marker.
- `repositoriesService` owns the Automerge `Repo` cache and retrying storage adapters by VFS path. Failed access-required saves remain queued until repository settlement runs.
- Same-entry reconnect now remounts first and invokes the existing registered repository settlement path.
- Locator-different confirmed replacement currently performs a point-in-time repository-cache guard before an asynchronous persisted-record read/write and remount.
- `repoByPath$()` can create/cache a repository while another service operation is awaiting persistence, so a point-in-time guard cannot protect the complete replacement transition.
- The current confirmed-replacement registration is returned from `useFileSystemService()` and therefore becomes part of the worker client shape through `setupMainService()`.
- Real Chrome/PWA verification proved that the intended recovery directory can compare unequal through `isSameEntry()`.

## Non-goals

- recovery from an already-open/cached repository when locator identity is not proven;
- transferring live Automerge state between physically different storage directories;
- changing document-not-found semantics;
- Repository Explorer loading-state redesign;
- changing `PersistedDeviceDirectoryRecord` format;
- adding a persistent Mioframe space ID or persisting the Automerge storage-adapter ID;
- changing the Automerge marker format;
- multi-window/provider synchronization redesign;
- generic mutexes, recovery managers, lifecycle managers, state machines, or shared UI primitives.

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
10. Confirmation accepted while a repository is already cached under the mount: reject replacement without mutation and instruct the user to reload Mioframe before retrying.
11. Confirmation accepted with no cached repository: reserve the mount against new repository creation, persist/remount, then release the reservation.
12. Repository access starts while that confirmed replacement is in progress: it must wait until the reservation is released and may only create/cache a Repo against the post-transition mount.
13. Persistence/remount fails after reservation acquisition: keep the old runtime provider when persistence did not complete, release the reservation in all cases, and surface the existing safe failure.
14. Nested file/path failure on an otherwise readable root keeps its original semantics.

## Ownership

| Owner                                  | Responsibility                                                                                                              |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `src/shared/lib/webFileSystemProvider` | Permission/root-read semantics and provider-owned unavailable-root error                                                    |
| `src/shared/lib/fileSystem`            | Canonical Mioframe marker inspection                                                                                        |
| `src/shared/service/fileSystem`        | Persisted handle replacement, provider remount, access-request cleanup, narrow service-internal lifecycle registration      |
| `src/shared/service/repositories`      | Repo cache/write settlement; confirmed-replacement reservation and gating of new Repo cache creation under a reserved mount |
| `src/entities/mountedDirectories`      | Narrow UI-facing reconnect/replacement mutations                                                                            |
| `src/features/localDirectoryRecovery`  | Picker, marker inspection, confirmation, pending/result/error UX                                                            |
| `src/widgets/RepositoryExplorerWidget` | Recovery precedence/rendering only                                                                                          |
| page/pane                              | No change                                                                                                                   |
| shared UI                              | No API/primitive change                                                                                                     |

`fileSystem` must not import `repositories`. Repositories register their lifecycle behavior with fileSystem inside the background service runtime. The registration capability is not a worker/client API.

## Source of truth

- Permission: remembered root handle at provider boundary.
- Persisted mounted key/current handle: `PersistedDeviceDirectoryRecord` by stable `name`.
- Same-locator proof: `FileSystemHandle.isSameEntry()`.
- Fallback candidate classification: shared Mioframe marker inspection.
- Historical sameness when locator proof is lost: explicit user confirmation, never marker/name heuristics.
- Cached/live repository presence: `repositoriesService` `repoObservableCache` keyed by VFS path.
- Confirmed-replacement exclusion state: repository-owned in-memory reservation keyed by mounted VFS path.
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
- `{ status: 'repositoryStateActive' }` — repository state was already cached at/under the mounted path when exclusive replacement was requested; zero persisted/runtime/access-request mutation;
- `{ status: 'missingRecord' }`.

### Service-internal repository lifecycle

Use two narrow internal coordination contracts only:

1. Existing write-recovery handlers: `fileSystemAccessRequestRegistry` runs the registered handlers both from permission `resolve()` and from proven same-entry reconnect. There is one handler execution implementation.
2. Confirmed-replacement lease provider: repositories register one provider with fileSystem. Acquiring a lease is atomic inside `repositoriesService`: it checks `repoObservableCache` for the target mount and descendants and, when clean, records the reservation before returning control. The acquired lease exposes only `release()`.

While a lease is active, repository access for the reserved mount or descendants must not create/cache a Repo. It waits for the active reservation to release, then retries cache lookup/creation against the resulting mount.

The lease exists only for the locator-different confirmed replacement critical section. It is not used for ordinary repository access, same-entry reconnect, permission recovery, or unrelated mounts.

The lease must be released in `finally` after success or failure.

`setupMainService()` must expose a narrow file-system worker/client projection that omits internal lifecycle registration capabilities, including write-recovery registration and confirmed-replacement lease-provider registration. Internal services still use `useFileSystemService()` directly inside the worker.

Do not expose lifecycle registration/lease objects through `@shared/service`, entities, features, widgets, or pages.

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

Clearing old requests before settlement is intentional: if settlement hits a new permission failure, the new provider creates a fresh request containing the new handle. No repository reservation is required because `isSameEntry() === true` proves the cached VFS path still denotes the same filesystem entry.

### Locator-different/unverifiable fallback

Feature behavior remains:

1. inspect selected handle for the Mioframe marker;
2. missing marker => expected rejection;
3. marker present => explicit `Replace location` confirmation;
4. cancellation => no mutation;
5. after confirmation call the explicit replacement mutation.

Marker presence is only candidate validation; it never proves historical identity.

### Confirmed remembered-location replacement

`replaceRememberedDeviceDirectory()` must:

1. await mounted-directory hydration and read the remembered record/current record list;
2. if the record is missing, return `missingRecord`;
3. acquire the repository-owned exclusive replacement lease for `/Device Files/<spaceName>`;
4. if acquisition reports already-cached repository state, return `repositoryStateActive` with zero mutation;
5. once acquired, perform no further repository-cache preflight; the reservation itself protects the transition;
6. persist the selected handle under the existing record name;
7. remount provider;
8. clear stale old-handle access requests;
9. synchronize display state and rely on existing VFS invalidation;
10. release the lease in `finally`.

The persisted replacement helper should consume the already-read record/list for this path instead of adding another pre-persistence read after lease acquisition.

Repository creation that begins after lease acquisition waits until release. After a successful replacement it therefore creates against the new physical storage; after a failed replacement it creates against the unchanged old storage.

Do **not** replay, migrate, or silently discard cached repository state into a locator-different replacement. If repository state existed before lease acquisition, replacement is blocked and the existing reload/retry UX remains the supported boundary.

If persistence fails, the old runtime provider remains mounted.

### Feature result handling

- `repositoryStateActive`: expected, no diagnostic exception; show `Mioframe still has this space open in memory. Reload Mioframe, then reconnect the folder again.`
- `reconnectedWithWriteRecoveryFailure`: expected service outcome; show `The folder is reconnected, but some pending changes could not be saved.` Do not report a second feature exception when repository/file-system diagnostics already own the failure.
- Existing picker/inspection/proxy unexpected failures keep the privacy-safe `DomainError` wrapping already defined for the feature.

## Rejected approaches

- Hard fail on `isSameEntry() !== true`: failed real-browser proof.
- Marker presence as historical identity: unsafe.
- Point-in-time repository-cache guard immediately before `updateRecordList()`: still fails because persistence/remount are asynchronous and a Repo can become cached during that interval.
- Guard before an additional async persisted-record read: stale before persistence even starts.
- Post-remount recheck/rollback: a newly cached Repo may already have observed or written through the rebound VFS path.
- Replay cached old Repo state into a locator-different confirmed replacement: can write old in-memory/queued data into an unrelated valid Mioframe space.
- Silently discard cached repository state before replacement: risks data loss.
- Move the entire replacement mutation into `repositoriesService`: persisted handles/providers remain file-system ownership; repositories only owns exclusion around its cache.
- Add a shared/generic mutex or lifecycle manager: only repository cache creation needs exclusion, so the reservation stays repository-local.
- Persist a new space/storage-adapter ID: does not solve legacy broken records and changes storage contracts.
- Import `repositoriesService` directly from `fileSystem`: wrong dependency direction/cycle.

## Shared UI blast radius

None. Reuse existing dialog, `MDButton`, and `MDEmptyState` APIs.

## Acceptance matrix

| Scenario                                                  | Required result                                                      |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| permission `prompt`/`denied`                              | existing permission recovery                                         |
| granted root enumeration failure                          | unavailable-folder recovery                                          |
| picker cancelled                                          | no mutation                                                          |
| same entry, no cached writes                              | reconnected                                                          |
| same entry with queued/cached writes, settlement succeeds | reconnected; writes flushed through new handle                       |
| same entry, settlement not fully flushed                  | provider remains reconnected; explicit write-recovery warning/result |
| locator differs/unverifiable                              | `confirmationRequired`; zero mutation                                |
| fallback candidate lacks marker                           | reject; zero mutation                                                |
| confirmation cancelled                                    | zero mutation                                                        |
| confirmed fallback with repository already cached         | `repositoryStateActive`; zero mutation                               |
| confirmed fallback with clean cache                       | exclusive lease acquired before persistence                          |
| repo access starts during confirmed replacement           | no Repo cached during lease; access resumes only after release       |
| confirmed replacement succeeds                            | persisted handle/provider replaced under same name; lease released   |
| confirmed replacement persistence fails                   | old runtime provider remains mounted; lease released                 |
| remembered record missing                                 | `missingRecord`; no new mount                                        |
| stale feature recovery target                             | no replacement/state overwrite                                       |
| nested child failure                                      | original semantics                                                   |
| public worker file-system client                          | no repository lifecycle registration/lease APIs                      |

## Risk matrix

- **Data safety — high:** exclusive reservation must cover the complete async locator-different persistence/remount transition.
- **Pending writes — high:** same-entry reconnect must deterministically invoke existing settlement after remount.
- **Persistence consistency — high:** persist before runtime replacement.
- **Repository lifecycle — high:** cache creation under a reserved mount waits until release; reservation cleanup is unconditional.
- **Public service boundary — medium:** internal lifecycle registration must not leak through the worker client.
- **Legacy recovery — high:** existing `{ name, handle }` records work without migration.
- **Feature race/staleness — medium:** preserve current stale-target guards.
- **Diagnostics privacy — medium:** no raw path/name/handle/external text in reportable metadata.
- **Performance — low:** reservation lookup runs only when creating a repository or during explicit confirmed replacement; no polling or global scanning loop.

## Required proof

Implementation preflight owns exact `TEST IMPACT`; resulting proof must include:

- existing provider unavailable-root/permission/nested-error tests;
- shared marker inspection and `mioframeSpacePick` consumers;
- file-system safe attempt: true => reconnect; false/missing/throw => `confirmationRequired` with zero mutation;
- registry: direct write-recovery-handler execution shares the same handler semantics as permission `resolve()`;
- repositories lease: pre-existing exact/descendant cached repository blocks acquisition; sibling cache does not; acquired lease prevents exact/descendant Repo cache creation until release; release unblocks access; failure cleanup releases;
- confirmed replacement: lease acquired before persistence; no post-acquire async record read; cached repository => `repositoryStateActive` with zero persistence/remount/request cleanup; clean cache => persistence-first replacement; persistence failure leaves runtime unchanged and releases lease;
- same-entry **cross-service deterministic test using the actual fileSystem/repositories registration**, not mutually mocked registration: cached repository with queued writes is settled after provider remount; success and non-flushed outcome covered;
- locator-different **cross-service deterministic concurrency test**: start confirmed replacement with a deferred persistence boundary, request repository access while lease is held, prove no Repo is cached/created against the old mount during the critical section, then prove access resumes only after release;
- worker/public-service contract proof: `setupMainService().fileSystem` / inferred worker client surface excludes internal write-recovery and confirmed-replacement lease registration APIs;
- feature: `repositoryStateActive` and `reconnectedWithWriteRecoveryFailure` remain expected/non-diagnostic; existing confirmation/stale/error paths remain covered;
- widget/worker-transform/diagnostics existing recovery proof remains valid.

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
- No locator-different replacement while repository state is already cached under the mount.
- No point-in-time boolean guard as the complete safety mechanism.
- No Repo creation/cache insertion under a mount while its confirmed-replacement lease is active.
- No replay/discard/migration of cached Repo/DocHandle state into locator-different storage.
- No direct `fileSystem` -> `repositories` service import.
- No lifecycle registration/lease APIs in the public worker/client file-system surface.
- No new persisted identity/record migration.
- No duplicated marker inspection or write-recovery handler loop.
- No raw browser/path/folder/handle values in diagnostics.
- No generic mutex/recovery/lifecycle manager or shared UI primitive change.

## Implementation readiness

- Product behavior: resolved.
- Repository lifecycle on same-entry reconnect: resolved — remount, clear stale request, run existing settlement.
- Repository lifecycle on locator-different confirmed replacement: resolved — acquire repository-owned exclusive lease, hold through persistence/remount, release unconditionally; block if repository state already exists.
- Concurrent repository access during replacement: resolved — wait for lease release before cache creation.
- Ownership/dependency direction: resolved through narrow background-service registration; no fileSystem -> repositories import.
- Worker/client surface: resolved — explicit public projection excludes internal lifecycle registration.
- Persisted state/public result API: resolved; no storage migration or new user-facing status required.
- Required proof: resolved at contract level, including real cross-service deterministic tests.
- Unresolved blockers: none at architecture level; implementation/review findings remain until code matches this handoff.
- Verdict: **ready**.
