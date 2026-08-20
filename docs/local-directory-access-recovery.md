# Local directory access recovery — architecture handoff

This document is the implementation contract for PR #211.

## Goal

Recover a remembered user-selected local directory whose saved root is unavailable without ever routing an existing Automerge repository resource through a different physical storage route, while preserving proven same-entry reconnect in place.

## Confirmed current behavior

- `WebFileSystemProvider` already separates missing read permission from a granted-but-unreadable mounted root.
- Real Chrome/PWA behavior proved `FileSystemHandle.isSameEntry()` can be false or unverifiable for the intended moved/renamed recovery folder.
- Repository facts/document lists already react to VFS content changes.
- Stateful Automerge `Repo` instances are cached by path and may survive subscriber gaps for 60 seconds.
- A repository-local boolean gate cannot fence an operation that already delegated into VFS and is waiting in `LockManager`, because provider resolution happens later.
- `Repo.shutdown()` in the locked Automerge Repo 2.5.6 does not revoke already-issued `DocHandle` objects.
- `useDocumentService` keeps a `repo.find()` handle observable alive after a Repo emission, so merely completing the upstream Repo observable is not sufficient to detach an already-issued handle.

## Non-goals

- persistent new space/storage IDs or persisted-record schema changes;
- inode/entry identity for arbitrary nested delete/recreate inside one unchanged provider route;
- hierarchical filesystem locking or provider-wide cancellation;
- repository/fileSystem leases, guards, reservations, or callbacks;
- replaying/migrating old in-memory Repo state into locator-different storage;
- changing Google Drive, OPFS, marker format, shared Material primitives, or unrelated repository behavior.

## Ownership

| Owner | Responsibility |
| --- | --- |
| `shared/lib/virtualFileSystem` | identity-bound route capability and stale-route fencing around VFS locks |
| `shared/lib/deviceFileSystemProvider` | mounted-root route lifetime; explicit identity-preserving refresh vs remove/re-add |
| `shared/lib/automergeAdapter` | Automerge storage over a bound VFS route; marker policy |
| `shared/service/repositories` | Repo/cache lifetime, invalidation signal, retrying-storage diagnostics, write settlement |
| `shared/service/document` | stop observing a `DocHandle` when its owning Repo resource is retired |
| `shared/service/fileSystem` | persisted handles, mounted names, same-entry reconnect, locator-different relocation |
| `features/localDirectoryReconnect` | picker, marker inspection, confirmation, committed-result handling, Snackbar warning |
| `RepositoryExplorerWidget` | recovery composition and post-action navigation applicability |

## Source of truth and state

- Remembered local mounts: persisted `{ name, handle }` records.
- Physical same-entry proof: `isSameEntry() === true` only.
- Candidate validity fallback: canonical Automerge marker presence; never identity proof.
- A repository resource belongs to one **VFS route lifetime**: the backing route selected for its repository path.
- The identity-bearing object exposed to consumers is the route binding itself; no separate public `VfsRouteIdentity` token is required.
- Repo resource identity is `(repository path, VfsRouteBinding lifetime)`.
- FileSystem never reads, locks, reserves, or invalidates repository cache directly.

## Minimum sufficient design

### VFS route binding

`VirtualFileSystem.bindRoute(path)` returns a root-scoped `VfsRouteBinding` for the current backing route.

The binding exposes only the IO needed by Automerge storage (`readFile`, `readDirectory`, `writeFile`, `delete`), plus invalidation subscription and disposal.

Required semantics:

1. Binding a missing route fails.
2. The binding itself is the identity-bearing capability for one route lifetime.
3. Plain VFS mount/unmount creates/ends route lifetimes normally; no generic identity-preserving remount API is added for this PR.
4. Every bound operation enters the normal VFS lock/activity path, then revalidates its captured route immediately after lock wait and before backing-provider execution.
5. A stale binding rejects with `VfsError(FileSystemError.StaleIdentity)`; stale IO is never a successful no-op.
6. A queued old operation cannot resolve a provider from a later route lifetime at the same path.
7. Once backing-provider execution has actually begun, that operation may finish against the provider it already entered; this PR does not add cross-provider cancellation.
8. Bound execution must use the captured route target after revalidation, not call the ordinary path resolver again and thereby select a later route.

### Composite provider boundary

A composite provider that can dynamically route one VFS mount to different nested backing providers may expose a narrow route-binding hook. `DeviceFileSystemProvider` is the only implementation required by this PR.

For `/Device Files/<name>/...`, the outer VFS binding must bind the mounted-root record route, not merely the long-lived `/Device Files` provider object. Bound IO must therefore remain fenced even if the composite provider has its own internal VFS/locks.

Each mounted-root record owns one runtime route cell/lifetime:

- first add -> fresh route lifetime;
- explicit same-entry refresh -> preserve the same route lifetime while replacing the current backing provider/handle;
- remove -> invalidate that route lifetime synchronously;
- later add under the same name -> fresh route lifetime;
- locator-different relocation uses remove old + add new name and never refreshes the old lifetime.

Prefer explicit add/refresh/remove semantics over an ambiguous same-name upsert that could accidentally preserve identity for a different physical directory.

### Automerge adapter

`createVFSAdapter` consumes a `VfsRouteBinding`, not `(vfs, path)` plus a repository-local retirement gate.

All storage operations go through the binding. When the binding is stale, Automerge storage rejects `StaleIdentity`; it never reaches a later provider and never reports stale writes as successfully persisted.

### Repository lifecycle

Each cached repository entry owns its binding and listens for binding invalidation.

On invalidation, repositories must synchronously:

1. remove that exact cache entry from reuse;
2. make the active repository stream publish an inactive state (`undefined` is sufficient) so downstream `switchMap` consumers cancel work based on the old Repo;
3. keep the old binding permanently stale;
4. run best-effort Repo cleanup; `Repo.shutdown()` is cleanup only, not the safety boundary;
5. allow later access to the same path to bind the then-current route and create a fresh Repo.

`getRepo$` may therefore become `Observable<Repo | undefined>` (or an equivalent existing-state shape), but do not introduce a new generic repository-resource manager only for this flow.

The existing 60-second idle reuse remains unchanged while the binding remains current. Ordinary file content events and transient permission/read failures do not invalidate the binding or recreate the Repo.

### Document-handle retirement

`shared/service/document` must treat the inactive Repo emission as authoritative lifecycle state:

- cancel the active `repo.find()` branch;
- emit no current handle for the retired resource;
- detach existing `change`/`delete` listeners through normal observable teardown;
- a later fresh Repo emission for the same path may create/find a fresh handle.

This prevents the application read-model from continuing to present a retired `DocHandle` as current. Any independently retained stale handle remains storage-safe because its old binding rejects `StaleIdentity`.

### Same-entry reconnect

1. Resolve persisted record and require `isSameEntry() === true`; false/missing/throw -> `confirmationRequired`, zero mutation.
2. Persist the replacement handle first under the same mounted name.
3. Perform the explicit mounted-root refresh that preserves its current route lifetime.
4. Clear stale access requests and sync display state.
5. Run registered repository write-recovery settlement.
6. Any expected settlement failure, including `repo.flush()` rejection, returns `reconnectedWithWriteRecoveryFailure`; the committed reconnect is not rolled back.

This is the only recovery path that preserves both mounted path and Repo resource lifetime.

### Locator-different/unverifiable recovery

1. Feature opens picker and first calls safe reconnect.
2. `confirmationRequired` -> inspect canonical Automerge marker.
3. Missing marker -> expected rejection, zero mutation.
4. Marker present -> explicit confirmation.
5. Candidate already mounted elsewhere -> `alreadyMounted`, zero mutation, return existing mounted name.
6. Confirmed unique candidate -> allocate a name different from the old mounted name, persist the record replacement first, then remove the old mounted-root route and add the selected storage under the new name.
7. Removing the old route invalidates old Repo bindings through VFS only; no fileSystem -> repositories coordination.
8. No old in-memory Repo/DocHandle state is transferred to locator-different storage.

Confirmation copy:

- headline: `Reconnect this Mioframe space?`
- supporting text: `Mioframe can't verify that this is the same folder it remembers. Continue only if you recognize the selected Mioframe space. Mioframe will open the selected space at a safe mounted location. If it isn't already mounted, the unavailable remembered location will be replaced. Unsaved in-memory changes from the unavailable location cannot be transferred.`
- confirm: `Reconnect`
- cancel: `Cancel`

`reconnectedWithWriteRecoveryFailure` uses Snackbar text exactly:

`The folder is reconnected, but some pending changes could not be saved.`

Committed service results remain authoritative after recovery state disappears. Widget navigation occurs only if `directoryPath` still equals the initiating path.

## Simpler alternatives considered and rejected

- **Never reuse a path / mount-name tombstones:** feature-specific, leaks lifecycle policy into naming, and does not retire active `DocHandle` state.
- **Repository generation/boolean gate:** cannot fence work already queued inside VFS before provider resolution.
- **Capture one provider object in the Automerge adapter:** breaks proven same-entry reconnect because the same Repo must follow the refreshed provider for the same physical directory.
- **Make mount/unmount participate in hierarchical file locks:** much larger VFS concurrency redesign and still does not by itself retire active Repo/DocHandle consumers.
- **fileSystem -> repositories invalidation/lease:** wrong dependency direction and duplicates the route owner.
- **Separate public identity token plus binding:** unnecessary; the binding lifetime itself is sufficient identity.

## Acceptance matrix

| Scenario | Required result |
| --- | --- |
| permission missing | existing `Permission required` recovery |
| granted root unavailable | `Folder unavailable` + reconnect |
| proven same entry | same route binding lifetime, same Repo, settlement runs |
| same-entry settlement fails | reconnect stays committed; warning status + Snackbar |
| locator-different unique candidate | old binding invalidates; selected storage exists only under new route/path |
| old operation queued before route end | `StaleIdentity`; replacement provider receives no old IO |
| stale retained Repo/DocHandle write | `StaleIdentity`; no later-route IO and no silent success |
| active document read-model on route end | old handle branch is cancelled and no longer presented as current |
| same old path later gets a new route | fresh binding + fresh Repo |
| ordinary content/access change | binding and Repo remain current |
| user navigates away during recovery | committed mutation remains; no stale navigation |

## Required proof

- VFS: hold a bound operation in the lock queue, end route, recreate same path, release; assert `StaleIdentity` and zero replacement-provider IO.
- VFS: same bound operation across an explicit identity-preserving Device root refresh remains valid and uses the refreshed provider.
- Device provider: add -> refresh preserves route binding; remove/re-add same name invalidates old binding and creates a fresh one.
- Composite-route proof: bound `/Device Files/<name>/...` IO cannot escape into a later nested record through inner VFS locking.
- Automerge adapter: all storage operations use binding; stale binding rejects and never no-ops.
- Repositories: invalidation evicts exact cache entry, emits inactive Repo state, preserves sibling/same-route idle reuse, and same-path new route creates fresh Repo.
- Document service: inactive Repo state cancels the old `repo.find()`/DocHandle observation and detaches listeners; fresh Repo can later produce a fresh handle.
- Existing deterministic same-entry fileSystem/repositories settlement proof remains effect-based.
- Add real relocation integration: fileSystem relocation -> old binding invalidation -> Repo/document retirement -> new-path fresh Repo, with no direct service coordination.
- Feature/widget focused proof for committed results, Snackbar, exact confirmation copy, and stale navigation.
- Final real Chrome/PWA operator matrix remains mandatory.

## Required verification

Implementation preflight determines focused impact. Final coding handoff runs `pnpm verify`; exact-head CI and real Chrome/PWA proof are separate merge gates.

## Forbidden

- fileSystem -> repositories invalidation/lease/guard;
- silent stale storage no-ops;
- path tombstones as a substitute for route identity;
- persistent identity/schema migration;
- marker as identity proof;
- same-path locator-different live rebind;
- generic hierarchical locking/cancellation introduced only for this recovery;
- changing arbitrary nested inode identity semantics in PR #211;
- relying on `Repo.shutdown()` alone to revoke DocHandles;
- weakening privacy-safe diagnostics or provider permission behavior.

## Implementation readiness

- Product behavior: resolved.
- Ownership and route-binding boundary: resolved.
- Active Repo/DocHandle retirement propagation: resolved.
- Required proof: resolved.
- Unresolved blockers: none at architecture level.
- Verdict: **ready**.
