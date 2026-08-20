# Review

Verdict: blocked

## Scope reviewed

- Cross-boundary VFS route binding, repository lifetime, and active document-handle retirement for PR #211.

## Blockers

### B1 — Current code does not implement the ready VFS route-binding contract

Owner: `src/shared` across `lib/virtualFileSystem`, `lib/deviceFileSystemProvider`, `lib/automergeAdapter`, `service/repositories`, and `service/document`

Problem: current production code still relies on `(vfs, path)` Automerge IO plus a repository-local retirement boolean. That cannot fence an operation already queued inside VFS before provider resolution. It also removes a Repo from reuse without forcing the application read-model to stop observing a previously issued `DocHandle`: `useDocumentService` creates a long-lived `repo.find()` branch, so upstream Repo completion alone is insufficient.

Required final state:

- `VirtualFileSystem.bindRoute(path)` returns an identity-bearing route binding; no separate public identity token is required.
- Bound IO revalidates after lock wait and executes against the captured route target rather than resolving a later route by path.
- Stale bound IO rejects `FileSystemError.StaleIdentity`, never succeeds as a no-op.
- `DeviceFileSystemProvider` exposes the nested mounted-root route to outer VFS binding and distinguishes explicit identity-preserving refresh from remove/re-add.
- `createVFSAdapter` consumes the route binding.
- Repository invalidation removes the exact cache entry and publishes an inactive Repo state so active downstream consumers switch away from the old Repo.
- `shared/service/document` cancels its old `repo.find()`/DocHandle observation when that inactive state arrives and detaches listeners through observable teardown.
- `Repo.shutdown()` remains best-effort cleanup only; storage safety comes from the stale route binding.
- Proven same-entry refresh preserves the same binding/Repo; locator-different remove/re-add invalidates the old binding.

Verification:

- deterministic queued-old-operation vs same-path new-route proof;
- composite Device Files nested-route proof, including an inner-lock wait;
- same-entry refresh preserves binding/Repo proof;
- stale retained Repo/DocHandle storage rejects without replacement-provider IO;
- active document read-model retires old handle/listeners;
- same-path new route creates a fresh Repo while siblings and same-route idle reuse remain unaffected.

### B2 — Required real relocation/repository/document integration proof is missing

Owner: `src/shared/service`

Problem: existing tests cover fileSystem relocation and repository lifecycle separately, while the handoff requires the real seam from fileSystem relocation through VFS route invalidation to repository/document retirement and fresh new-path Repo creation.

Required final state: one deterministic integration proof exercises real fileSystem relocation together with real VFS binding, repository lifecycle wiring, and document-handle retirement, with no direct fileSystem -> repositories coordination.

Verification: prove old route invalidates, active old Repo/document state retires, old stale IO cannot reach selected storage, and repository access at the relocated path creates a fresh Repo.

## Major issues

None in this owner scope.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Arbitrary nested directory inode identity inside an unchanged provider route.
- Hierarchical filesystem locking or provider-wide cancellation.

## Unresolved questions

None. `docs/local-directory-access-recovery.md` now contains a ready architecture contract.
