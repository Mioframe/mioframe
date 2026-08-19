# Local directory access recovery — architecture handoff

This document is the implementation contract for PR #211.

## Goal

Recover a remembered user-selected local directory when its saved root becomes unavailable, without silently aliasing different physical storage behind an existing live repository/VFS identity, and keep repository resources reactive to VFS identity lifecycle.

## Confirmed current behavior

- `WebFileSystemProvider` correctly separates missing read permission from a granted-but-unreadable mounted root; nested failures keep their ordinary semantics.
- `isSameEntry() === true` is sufficient for a live same-path reconnect.
- Real Chrome/PWA proof showed the intended recovery folder can be false/unverifiable through `isSameEntry()`, so strict locator equality cannot be the only recovery path.
- `src/shared/lib/automergeAdapter` owns the stable `storage-adapter-id.automerge` marker and Automerge storage-format policy.
- `src/shared/service/fileSystem` owns persisted directory handles, mounted names/paths, provider mount/unmount, and access-request cleanup.
- `src/shared/service/repositories` owns Repo/cache/retrying-storage lifecycle and the generic write-recovery settlement hook.
- Repository facts/document lists are already reactive to `directoryContent$`, which is backed by `vfs.watch()`.
- The current `Repo` cache is not fully reactive to VFS identity: it caches one stateful `Repo` by path and may retain it for the idle timeout even after the directory/mount identity at that path has ended.
- `createVFSAdapter()` routes every storage operation through the current VFS path, so reusing a stale Repo after that path acquires a different storage identity is unsafe.
- The previous locator-different live-rebind lease design is rejected: fileSystem must not coordinate repository cache ownership for one recovery feature.

## Non-goals

- persistent Mioframe/storage IDs or persisted-record schema changes;
- transferring/replaying/discarding live Repo/DocHandle state into locator-different storage;
- repository-aware relocation locks, leases, reservations, or fileSystem replacement guards;
- making Repo instances restart for ordinary file writes or every VFS event;
- generic recovery/lifecycle managers or mutex infrastructure;
- changing Automerge marker format;
- changing Google Drive, OPFS, nested-path, or ordinary document-not-found behavior;
- shared UI primitive changes.

## Affected scenarios

1. Saved handle is `prompt`/`denied`: existing permission recovery.
2. Permission is granted but mounted-root enumeration fails: `Folder unavailable` + `Reconnect folder`.
3. Picker cancelled: no mutation.
4. `isSameEntry() === true`: persist/remount under the existing mounted name/path, preserve the current repository identity, clear stale requests, then run repository write settlement.
5. Same-entry settlement is not fully flushed: keep the proven-identical reconnect and report the explicit warning after the unavailable-root UI disappears.
6. `isSameEntry()` is false/missing/throws: zero mutation; inspect the selected folder for the Mioframe/Automerge marker.
7. Marker missing: expected rejection, zero mutation.
8. Marker present: explicit confirmation; marker presence is candidate validation, never historical identity proof.
9. Confirmation cancelled: zero mutation.
10. Confirmed candidate is already represented by another persisted mount: zero mutation; return the existing mounted name.
11. Confirmed unique candidate: relocate the remembered record to a new mounted identity/name/path, never reuse the old live VFS path for locator-different storage.
12. Relocation persistence fails: old persisted/runtime mount remains unchanged.
13. Relocation succeeds: persist first, then remove the old mounted root, mount the selected handle under the new unique name, clear stale old-name requests, sync display, and navigate the Repository Explorer to the new path when the initiating navigation context is still current.
14. Removing/renaming a directory or mounted root ends the repository identity for cached Repo instances at or below that path; stale Repo resources are retired immediately from reuse.
15. If the same VFS path later represents a new directory/mount identity, repository access creates a fresh Repo instead of reviving the retired path-only cache entry.
16. Ordinary content events and transient access/read failures do not by themselves create a new repository identity.
17. Remembered record disappears or feature recovery becomes stale before mutation: no unintended mutation/state overwrite.
18. Provider-derived recovery disappears because the action itself committed: the committed service result remains authoritative; it is not discarded as stale.

## Ownership

| Owner                                  | Responsibility                                                                                                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/shared/lib/webFileSystemProvider` | Permission/root-read semantics and provider-owned unavailable-root error                                                                                          |
| `src/shared/lib/automergeAdapter`      | Canonical marker filename and reusable marker-presence inspection policy                                                                                          |
| `src/shared/service/fileSystem`        | Persisted-handle uniqueness, mounted-name allocation, same-entry reconnect, locator-different relocation, provider mount/unmount, request cleanup                 |
| `src/shared/service/repositories`      | Repo/cache/retrying-storage lifecycle, VFS-identity-driven Repo retirement, generic write-recovery settlement; no local-directory relocation protocol             |
| `src/entities/mountedDirectories`      | Narrow UI-facing reconnect/relocation mutations                                                                                                                   |
| `src/features/localDirectoryRecovery`  | Permission-grant recovery action only                                                                                                                             |
| `src/features/localDirectoryReconnect` | Unavailable-root parsing, picker, marker inspection, confirmation, reconnect/relocation action state, committed-result handling, feature-owned warning notification |
| `src/widgets/RepositoryExplorerWidget` | Recovery branch precedence/rendering and navigation applicability after relocation; no provider-error parsing                                                     |
| page/pane                              | No new responsibility                                                                                                                                             |

## Source of truth and state

- Permission/root failure: provider error contract.
- Remembered mounts: `PersistedDeviceDirectoryRecord[]` (`name`, `handle`).
- Current filesystem contents and directory/mount lifecycle: VFS plus its event stream.
- Mounted path identity is not just the path string: one lifetime of the directory/mount behind that path is one repository resource identity.
- Proven same physical entry: `FileSystemHandle.isSameEntry() === true`.
- Fallback candidate validity: canonical Automerge marker inspection.
- Locator-different authority: explicit user confirmation authorizes reconnecting the candidate, but does not make it the same live VFS/repository identity.
- One physical directory must not be persisted under two mounted names; fileSystem enforces this with the existing handle-identity mechanism.
- Repo/cache/DocHandle lifecycle is repository-owned. FileSystem does not query, lock, reserve, or invalidate repository cache directly.
- Queued/in-memory repository writes are settled only for proven same-entry reconnect.

## Public contracts

### Safe reconnect

`reconnectDeviceDirectory({ spaceName, handle })` returns `ReconnectDeviceDirectoryResult`:

- `{ status: 'reconnected', name }`;
- `{ status: 'reconnectedWithWriteRecoveryFailure', name }`;
- `{ status: 'confirmationRequired' }`;
- `{ status: 'missingRecord' }`.

False/missing/throwing `isSameEntry()` always returns `confirmationRequired` with zero persistence/runtime/request/display mutation.

### Locator-different relocation

`relocateRememberedDeviceDirectory({ spaceName, handle })` returns `RelocateRememberedDeviceDirectoryResult`:

- `{ status: 'relocated', name }` — target record moved to a new mounted identity/path;
- `{ status: 'alreadyMounted', name }` — selected physical directory is already represented by another persisted mount; zero mutation;
- `{ status: 'missingRecord' }` — target remembered record disappeared; zero mutation.

There is no `repositoryStateActive`, relocation lease, guard, reservation, or repository-specific file-system status.

`src/entities/mountedDirectories` exposes `reconnectDirectory()` and `relocateRememberedDirectory()` only.

## Minimum sufficient design

### Provider detection

Keep the current provider implementation: pre-check read permission; after failed root enumeration re-check once; non-granted routes to existing permission recovery; still-granted routes to unavailable-root recovery; nested failures are untouched.

### Repository lifecycle follows VFS identity

Repository read models and stateful Repo resources have different reactivity:

- repository facts/document lists continue reacting to ordinary VFS content events through `directoryContent$`;
- a stateful Repo is reused for ordinary content changes and transient provider/access errors while the underlying directory/mount identity still exists;
- the idle timeout may retain a Repo only inside that same VFS identity lifetime.

`src/shared/service/repositories` must own one VFS lifecycle subscription and retire cached Repo resources when their storage identity ends.

Identity-ending events include:

- directory `DELETE` for a path equal to or ancestral to a cached repository path;
- directory `RENAME` away from a path equal to or ancestral to a cached repository path;
- a real owning VFS mount removal when it removes the route used by a cached repository.

Provider-internal `MOUNT`/`UNMOUNT` refresh events alone are not identity-ending. In particular, proven same-entry reconnect keeps the mounted root logically present and must preserve the current Repo/DocHandle resource.

Retirement is stronger than deleting a `Map` entry:

1. mark the cached repository resource retired synchronously before it can be reused;
2. remove it from reusable path cache immediately;
3. prevent new Automerge storage operations owned by that retired Repo from being routed through a later storage identity at the same path;
4. terminate/finalize the active Repo observable resource and clean up its owned Repo/network/listener lifecycle;
5. treat expected teardown failures caused by the already-removed storage as retirement behavior, not as a user-facing reconnect failure;
6. a later repository request for a recreated path constructs a fresh Repo/resource.

Use a narrow repository-owned lifecycle gate/resource around the storage adapter as needed to make step 3 true. Do not put this state in fileSystem and do not add a fileSystem→repositories callback. The exact implementation must remain local to repository resource ownership; do not introduce a generic lifecycle manager.

### Same-entry reconnect

1. Read target persisted record.
2. Require `isSameEntry() === true`; otherwise return `confirmationRequired` with zero mutation.
3. Persist replacement handle first under the same mounted name.
4. Remount/refresh provider under the same path without ending the mounted-root identity.
5. Clear stale old-handle access requests.
6. Sync display/invalidation.
7. Run the existing registered write-recovery handlers for that mount.
8. Every expected repository-storage failure during settlement, including `repo.flush()` rejection, is normalized to a non-flushed `WriteAccessRecoveryResult`; it must not reject the already-committed reconnect.
9. Return `reconnected` or `reconnectedWithWriteRecoveryFailure` without rollback.

This is the only recovery path allowed to preserve the same live VFS/repository identity because physical identity is proven.

### Locator-different/unverifiable fallback

`src/features/localDirectoryReconnect`:

1. derives unavailable-root recovery from supplied error candidates;
2. opens the writable directory picker;
3. runs safe reconnect;
4. on `confirmationRequired`, inspects the selected handle using the marker helper owned by `@shared/lib/automergeAdapter`;
5. missing marker => expected retryable rejection;
6. marker present => explicit confirmation;
7. after confirmation calls `relocateRememberedDirectory()`;
8. returns the new/existing mounted target to the widget when navigation is required;
9. uses provider-derived recovery freshness only before committing a mutating service action;
10. after `reconnectDirectory()` or `relocateRememberedDirectory()` returns an explicit result, that result is authoritative even if the provider-derived recovery disappeared because of the mutation;
11. unexpected pre-commit picker/inspection/service failures keep privacy-safe `DomainError` wrapping with raw cause.

Confirmation copy:

- headline: `Reconnect this Mioframe space?`
- supporting text: `Mioframe can't verify that this is the same folder it remembers. Continue only if you recognize the selected Mioframe space. Mioframe will open the selected space at a safe mounted location. If it isn't already mounted, the unavailable remembered location will be replaced. Unsaved in-memory changes from the unavailable location cannot be transferred.`
- confirm: `Reconnect`
- cancel: `Cancel`

Picker cancel, confirmation cancel, missing marker, `alreadyMounted`, `confirmationRequired`, and `missingRecord` are expected outcomes and are not diagnostic exceptions.

For `reconnectedWithWriteRecoveryFailure`, the old unavailable-root recovery is expected to disappear because the folder is now connected. Therefore the warning must not depend on the recovery empty-state remaining rendered. The reconnect feature uses the existing Snackbar mechanism to show exactly:

`The folder is reconnected, but some pending changes could not be saved.`

Do not keep the recovered folder in an error empty-state merely to preserve this warning.

### Relocation

`relocateRememberedDeviceDirectory()`:

1. hydrate/read persisted records and resolve the target by `spaceName`;
2. missing target => `missingRecord`;
3. compare selected handle with every other persisted record using the existing file-system handle identity mechanism;
4. matching other record => `alreadyMounted` with that record name and zero mutation;
5. unexpected identity-comparison failure => abort with zero mutation and surface through existing safe feature error handling;
6. allocate `newName` from `handle.name` using existing unique-name rules while the old target name still counts as occupied, so `newName !== oldName` even when the physical folder has the same basename;
7. build one next persisted record list replacing the old target with `{ name: newName, handle }`;
8. persist that list first;
9. only after persistence succeeds: remove old runtime record/path, mount the new record/path, clear pending requests for the old name, sync display/invalidation;
10. return `{ status: 'relocated', name: newName }`.

Removing the old runtime root emits the VFS lifecycle transition that repositories consumes to retire any cached Repo under the old identity. Relocation never calls repositories directly. The selected storage is mounted only under the new path and receives a fresh Repo on demand.

### Feature/widget stale-result boundary

- Before a mutating service call has committed, the reconnect feature may abort when its provider-derived recovery target changes.
- After an explicit service result returns, provider recovery disappearance is an expected consequence of success and must not discard that result.
- `RepositoryExplorerWidget` captures the `directoryPath` that initiated `reconnectFolder()`.
- When a mounted name is returned, the widget navigates to `/Device Files/<name>` only if the current `directoryPath` still equals the initiating path.
- If the user navigated elsewhere while the action was pending, the committed storage result remains valid but no stale navigation is emitted.

### Feature/widget ownership

- Keep `src/features/localDirectoryRecovery` as the permission action. It receives error candidates and derives its own read-permission recovery.
- Keep reconnect orchestration in the separate `src/features/localDirectoryReconnect` feature. It receives error candidates and derives unavailable-root recovery internally.
- `RepositoryExplorerWidget` passes collected recovery errors to both features, owns branch precedence, and owns applicability of post-action navigation.
- Same-entry reconnect stays on the current path; relocation/already-mounted may navigate to the returned mounted target.

## Rejected approaches

- hard fail when `isSameEntry() !== true` — contradicted real-browser recovery;
- marker as identity proof — unsafe;
- live locator-different replacement under the old VFS path — crosses storage identity and service ownership;
- repository guard/lease/reservation around fileSystem replacement — workaround for the rejected live-rebind design;
- path-only Repo cache lifetime — a path may later represent a new VFS identity;
- recreating Repo for every file event — destroys useful stateful resource reuse and is not required;
- persisted-only replacement followed by reload — requires additional pending/restart state and complicates same-session actions;
- replay/migrate/discard cached Repo state into locator-different storage — unsafe/data-loss prone;
- persistent new space ID/schema migration — unnecessary for this bug;
- moving marker policy to generic `shared/lib/fileSystem` merely to deduplicate feature code — wrong owner;
- keeping permission and reconnect as one umbrella feature — violates one-action feature ownership.

## Acceptance matrix

| Scenario                                      | Required result                                                                                                        |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| permission `prompt`/`denied`                  | existing permission recovery                                                                                           |
| granted root enumeration failure              | unavailable-root recovery                                                                                              |
| picker/confirmation cancel                    | zero mutation                                                                                                          |
| same entry                                    | same mounted/repository identity; persist/remount; same Repo remains eligible; settlement runs                         |
| same entry, settlement fails                  | provider stays reconnected; service returns warning status; Snackbar shows warning                                    |
| false/unverifiable identity                   | `confirmationRequired`; zero mutation before fallback                                                                  |
| candidate lacks marker                        | reject; zero mutation                                                                                                  |
| candidate already mounted elsewhere           | `alreadyMounted`; zero mutation; existing target can be opened                                                         |
| confirmed unique candidate                    | old persisted record replaced by new unique mounted name/path; old runtime identity ends; new identity mounted         |
| cached Repo under removed old root             | retired immediately from reuse; cannot issue new storage IO through a later identity at the old path                   |
| same path recreated after identity end         | fresh Repo/resource; retired Repo is never returned                                                                     |
| ordinary content write/create/delete file      | repository facts update; Repo identity is preserved                                                                     |
| transient permission/read failure              | recoverable read state; Repo identity is not ended solely by the error                                                   |
| candidate basename equals old name            | new unique mounted name differs from old path                                                                          |
| relocation persistence fails                  | old persisted/runtime mount unchanged                                                                                  |
| old path after relocation                     | cannot route repository reads/writes to selected storage                                                               |
| new path after relocation                     | routes to selected handle and fresh repository resource on demand                                                      |
| recovery disappears after committed mutation  | committed result still processed                                                                                        |
| user navigates away while action is pending   | mutation result remains valid; no stale `clickPath`                                                                     |
| nested provider failure                       | existing semantics                                                                                                     |
| widget                                        | no provider recovery parsing                                                                                            |
| repositories                                  | no local-directory relocation lease/reservation protocol                                                               |

## Required proof

Implementation preflight owns exact `TEST IMPACT`. The resulting proof must include:

- retained provider permission/unavailable-root/nested-error and worker-transform proof;
- marker present/missing/unexpected-failure tests under `src/shared/lib/automergeAdapter`, with both `mioframeSpacePick` and reconnect consumers using that owner;
- safe reconnect true/false/missing/throw/missing-record and zero-mutation proof;
- repository lifecycle proof driven by real VFS events: ordinary content events preserve Repo reuse; transient error state does not end identity; directory/root deletion retires exact/descendant cached repos; sibling repos remain; later same-path access creates a fresh Repo; an old retired resource cannot perform new storage IO into the recreated identity;
- same-entry deterministic cross-service proof using actual fileSystem/repositories registration: no fixed sleeps; root refresh must preserve the Repo resource; queued write settlement must be proven by a direct storage effect through the rebound handle; `repo.flush()`/other settlement failure returns `reconnectedWithWriteRecoveryFailure` rather than rejecting;
- relocation service proof: already-mounted candidate zero mutation; unique new name always differs from old; persistence-first ordering; persistence failure leaves old runtime intact; success removes old root identity and mounts selected handle only at new path; old-path VFS access cannot reach selected storage; missing record;
- relocation/repository integration proof: removal of the old mounted root causes repository retirement through VFS events with no direct fileSystem→repositories coordination; access to the new path constructs a different Repo;
- feature proof split by action: permission feature handles permission recovery; reconnect feature handles picker/marker/confirmation/relocation, exact confirmation copy, expected outcomes, pre-commit stale target, committed-result authority, Snackbar warning, and privacy-safe unexpected errors;
- widget proof: branch precedence from feature-facing state only; navigation to relocated/already-mounted target when initiating path is still current; no navigation when `directoryPath` changes while the action is pending;
- absence proof: no confirmed-replacement lease/provider/guard/reservation, `repositoryStateActive`, lease-specific error, or relocation-specific repository/fileSystem callback remains.

Real Chrome/PWA operator proof remains mandatory after implementation: revoked permission; granted-but-unavailable root; picker/confirmation cancellation; proven same-entry reconnect; same-entry settlement warning; locator-different confirmed relocation to a new mount identity; invalid marker; already-mounted candidate; navigation to the recovered mount.

## Required verification

- Run implementation preflight before production edits.
- Use focused verifier-managed checks during correction.
- Final coding-agent handoff: `pnpm verify`.
- Re-run complete `project-review` across the whole PR, not only the correction diff.
- Exact-head GitHub CI and real Chrome/PWA operator proof are merge gates.

## Forbidden

- No locator-different live rebind under the old VFS path.
- No fileSystem-owned repository lease/guard/reservation/cache invalidation.
- No direct `fileSystem -> repositories` import.
- No path-only reuse of a Repo after its VFS directory/mount identity ended.
- No continued storage IO from a retired Repo into a later storage identity at the same path.
- No recreating Repo for ordinary content events or transient access errors.
- No replay/migration/discard of old cached repository state into the selected folder.
- No duplicate persisted mounts for one physical directory.
- No marker-as-identity shortcut.
- No marker policy in generic `shared/lib/fileSystem`.
- No provider-error parsing in `RepositoryExplorerWidget`.
- No reconnect action inside the permission-recovery feature module.
- No post-commit result rejection merely because provider recovery disappeared.
- No `requestPermission()` in provider/service code.
- No new persisted schema/ID, generic lifecycle manager, mutex framework, or shared UI primitive.

## Implementation readiness

- Product behavior: resolved.
- Repository/VFS lifecycle invariant: resolved — stateful Repo resources are scoped to one VFS identity lifetime and retire from VFS lifecycle events.
- Same-entry behavior: resolved — identity and Repo are preserved; settlement failures are normalized after the committed remount.
- Locator-different behavior: resolved — old identity ends and selected storage receives a new path/Repo identity.
- Feature/widget stale-result behavior: resolved — pre-commit freshness belongs to the feature; post-commit navigation applicability belongs to the widget; warning uses existing Snackbar.
- Ownership/source of truth/public contracts: resolved.
- Simpler alternative comparison: VFS-driven repository retirement plus new mount identity removes fileSystem↔repository feature synchronization and is preferred.
- Unresolved blockers: none in architecture; current production code still violates this handoff and must be corrected.
- Verdict: **ready**.
