# Local directory access recovery — architecture handoff

This document is the implementation contract for PR #211.

## Goal

Recover a remembered user-selected local directory whose saved root is unavailable, without ever routing a live or stale repository through a different VFS storage route, while preserving proven same-entry reconnect in place.

## Confirmed current behavior

- `WebFileSystemProvider` already separates missing read permission from granted-but-unreadable mounted-root access.
- Real Chrome/PWA behavior proved `FileSystemHandle.isSameEntry()` can be false/unverifiable for the intended moved/renamed recovery folder.
- Repository facts/document lists are reactive through `directoryContent$`/`vfs.watch()`.
- A stateful Automerge `Repo` is cached by path and may survive subscriber gaps for 60 seconds.
- The current repository-local retirement gate is insufficient: a VFS operation can pass the gate, wait in `LockManager`, then resolve the same path after its backing route changed.
- `Repo.shutdown()` in the locked Automerge Repo 2.5.6 does not revoke already-issued `DocHandle` objects; storage safety therefore cannot rely on shutdown alone.

## Non-goals

- persistent new space IDs, persisted-record schema changes, or marker-format changes;
- inode/entry identity for arbitrary nested directory delete/recreate inside one unchanged provider route;
- hierarchical filesystem locking or cancellation across every provider;
- repository/fileSystem leases, guards, reservations, or callbacks;
- migrating/replaying old in-memory Repo state into locator-different storage;
- changing Google Drive, OPFS, shared Material primitives, or unrelated repository behavior.

## Ownership

| Owner | Responsibility |
| --- | --- |
| `shared/lib/virtualFileSystem` | runtime VFS route identity, identity-bound IO, stale-route fencing after lock waits |
| `shared/lib/deviceFileSystemProvider` | stable nested mounted-root route identity; identity-preserving provider refresh vs remove/re-add |
| `shared/lib/automergeAdapter` | adapt an identity-bound VFS route to Automerge storage; marker policy |
| `shared/service/repositories` | Repo/cache lifetime, subscription retirement, retrying-storage diagnostics, write settlement |
| `shared/service/fileSystem` | persisted handles, mounted names, same-entry reconnect, locator-different relocation |
| `features/localDirectoryReconnect` | picker, marker inspection, confirmation, committed-result handling, Snackbar warning |
| `RepositoryExplorerWidget` | recovery composition and post-action navigation applicability |

## Source of truth and state

- Remembered local mounts: persisted `{ name, handle }` records.
- Physical same-entry proof: `isSameEntry() === true` only.
- Candidate validity fallback: Automerge marker presence; never identity proof.
- **VFS route identity:** opaque runtime identity of the backing route selected for a path. A route identity may survive provider-object refresh, but remove/re-add or identity-changing mount replacement creates a different identity.
- Repo resource identity: `(repository path, VFS route identity)`.
- FileSystem never reads or invalidates repository cache directly.

## Public/low-level contracts

### VFS route identity

`VirtualFileSystem` owns an opaque runtime `VfsRouteIdentity` and exposes `bindRoute(path): VfsRouteBinding`.

`VfsRouteBinding` is root-scoped and exposes only the IO needed by storage adapters (`readFile`, `readDirectory`, `writeFile`, `delete`), `onInvalidated(callback)`, and `dispose()`.

Required semantics:

1. `bindRoute(path)` captures the current route identity; binding a missing route fails.
2. A bound operation succeeds only while the current route identity still equals the captured identity.
3. A stale bound operation rejects with `VfsError(FileSystemError.StaleIdentity)`; it never becomes a successful no-op.
4. VFS lock-delayed operations capture route identity at invocation and re-check immediately after waiting and before provider resolution. Therefore an operation queued before route replacement cannot resolve the replacement provider.
5. Operations that already entered provider execution before route identity changed may finish against that provider; VFS does not attempt cross-provider cancellation after execution has begun.
6. Plain mounted providers use the VFS mount identity. Composite providers may expose the more specific nested route identity for a path through a narrow provider contract.
7. Replacing a mounted provider while explicitly retaining the same route identity is atomic from the binding's perspective: the route is never observed as ended between old and new provider objects.

### Device Files nested routes

Each `DeviceFileSystemProvider` mounted-root record owns one runtime route identity.

- first add -> fresh identity;
- proven identity-preserving same-name refresh -> keep identity while replacing the provider object;
- remove -> identity ends;
- later add under the same name -> fresh identity;
- locator-different recovery never refreshes the old identity: it removes the old record and mounts the selected storage under the newly allocated name.

The composite provider must expose its mounted-root identity to the outer VFS so `/Device Files/<name>/...` binds to the nested root identity, not merely to the long-lived `/Device Files` provider object.

### Automerge adapter and Repo lifecycle

`createVFSAdapter` consumes a `VfsRouteBinding`; it does not implement its own boolean retirement/no-op gate.

For each cached Repo, repositories owns the binding and subscribes to `onInvalidated`:

1. synchronously remove the cache entry from reuse;
2. complete/retire the shared Repo observable so active service consumers stop observing that Repo as current;
3. keep the binding permanently stale so any retained old `Repo`/`DocHandle` storage operation rejects `StaleIdentity` rather than reaching a later route or silently succeeding;
4. run best-effort Repo cleanup; teardown failure caused by the already-ended route is not a reconnect rollback;
5. later access to the same path binds the current route and creates a fresh Repo.

The existing 60-second idle reuse remains unchanged while the route identity remains current.

Ordinary content events and transient permission/read failures do not change route identity and do not recreate the Repo.

## Recovery behavior

### Same-entry reconnect

1. Resolve persisted record and require `isSameEntry() === true`; false/missing/throw -> `confirmationRequired`, zero mutation.
2. Persist replacement handle first under the same mounted name.
3. Refresh that mounted provider **with the existing VFS route identity**.
4. Clear stale access requests and sync display state.
5. Run registered repository write-recovery settlement.
6. Any expected settlement failure, including `repo.flush()` rejection, returns `reconnectedWithWriteRecoveryFailure`; the committed reconnect is not rolled back.

This is the only path that preserves both mounted path and Repo identity.

### Locator-different/unverifiable recovery

1. Feature opens picker and first calls safe reconnect.
2. `confirmationRequired` -> inspect canonical Automerge marker.
3. Missing marker -> expected rejection, zero mutation.
4. Marker present -> explicit confirmation.
5. Confirmed candidate already mounted elsewhere -> `alreadyMounted`, zero mutation, return existing mounted name.
6. Confirmed unique candidate -> allocate a name different from the old mounted name, persist record replacement first, then remove old runtime route and mount selected storage only under the new name.
7. Removing the old route invalidates all Repo bindings below it through VFS route identity; no fileSystem->repositories coordination.
8. No old in-memory Repo/DocHandle state is transferred to the selected locator-different storage.

Confirmation copy:

- headline: `Reconnect this Mioframe space?`
- supporting text: `Mioframe can't verify that this is the same folder it remembers. Continue only if you recognize the selected Mioframe space. Mioframe will open the selected space at a safe mounted location. If it isn't already mounted, the unavailable remembered location will be replaced. Unsaved in-memory changes from the unavailable location cannot be transferred.`
- confirm: `Reconnect`
- cancel: `Cancel`

`reconnectedWithWriteRecoveryFailure` uses Snackbar text exactly:

`The folder is reconnected, but some pending changes could not be saved.`

Committed service results remain authoritative after recovery state disappears. Widget navigation occurs only if `directoryPath` still equals the initiating path.

## Rejected approaches

- hard fail for `isSameEntry() !== true`;
- marker presence/value as physical identity proof;
- locator-different live replacement under the old VFS path;
- repository/fileSystem lease or reservation;
- repository-local boolean/no-op storage gate without VFS fencing;
- treating every file/directory event as Repo identity replacement;
- hierarchical VFS locks or provider-wide cancellation for arbitrary nested inode identity;
- runtime mount-name tombstones to avoid fixing route identity;
- reload-only recovery.

## Acceptance matrix

| Scenario | Required result |
| --- | --- |
| permission missing | existing `Permission required` recovery |
| granted root unavailable | `Folder unavailable` + explicit reconnect |
| picker/confirmation cancel | zero mutation |
| proven same entry | same path, same VFS route identity, same Repo, settlement runs |
| same-entry settlement fails | reconnect stays committed; warning status + Snackbar |
| false/unverifiable entry | confirmation fallback; no mutation before confirmation |
| confirmed candidate already mounted | zero mutation; existing mount returned |
| confirmed unique candidate | old route ends; selected storage mounted only under new unique path |
| old Repo call after route end | rejects `StaleIdentity`; no storage IO |
| old operation queued before route end | fails before resolving a later route/provider |
| same old path later receives a new route | old binding stays stale; new access creates fresh Repo |
| ordinary content/access change | route identity and Repo remain current |
| user navigates away during recovery | committed mutation remains; no stale navigation |

## Required proof

- VFS unit proof: hold an operation in the lock queue, change route identity, release it, assert `StaleIdentity` and zero calls to the replacement provider.
- VFS unit proof: identity-preserving remount keeps the binding current and queued operation may continue through the refreshed provider.
- Device provider proof: same-record refresh preserves nested route identity; remove/re-add same name creates a new one.
- Automerge adapter proof: all storage operations use the bound route and stale binding never becomes a no-op.
- Repository lifecycle proof: binding invalidation evicts cache, completes active Repo observable, stale retained Repo storage rejects, sibling/unchanged routes survive, and same-path new identity gets a fresh Repo.
- Existing deterministic same-entry fileSystem/repositories integration remains effect-based and proves Repo preservation + queued-write settlement.
- Add real relocation integration: fileSystem relocation -> old route invalidation -> repository retirement -> new path fresh Repo, with no direct service coordination.
- Feature/widget focused proof for committed results, Snackbar, exact confirmation copy, and stale navigation.
- Final real Chrome/PWA operator matrix remains mandatory.

## Required verification

Implementation preflight determines focused impact. Final coding handoff runs `pnpm verify`; exact-head CI and real Chrome/PWA proof are separate merge gates.

## Forbidden

- fileSystem -> repositories invalidation/lease/guard;
- silent stale storage no-ops;
- persistent identity/schema migration;
- marker as identity proof;
- same-path locator-different live rebind;
- generic hierarchical locking/cancellation introduced only for this recovery;
- changing nested directory/inode identity semantics as part of PR #211;
- weakening privacy-safe diagnostics or provider permission behavior.

## Implementation readiness

- Product behavior: resolved.
- Ownership and route-identity boundary: resolved.
- Required proof: resolved.
- Unresolved blockers: none at architecture level.
- Verdict: **ready**.
