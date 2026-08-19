# Review

Verdict: blocked

## Scope reviewed

- Cross-boundary VFS route identity / repository lifecycle implementation and required integration proof for PR #211.

## Blockers

### B1 — Current implementation does not implement the ready VFS route-identity contract

Owner: `src/shared/lib/virtualFileSystem` first; then `src/shared/lib/deviceFileSystemProvider`, `src/shared/lib/automergeAdapter`, and `src/shared/service/repositories` consume that lower-level contract.

Problem: architecture is now resolved, but current code still uses a repository-local boolean/no-op gate plus raw `DELETE`/`RENAME` cache retirement. The gate can be passed before an operation waits in `LockManager`; VFS may then resolve the same path after its backing route changed. It also treats arbitrary directory lifecycle as Repo identity, while the reviewed contract now scopes Repo identity to `(repository path, VFS storage-route lifetime)`.

Evidence:

- [Repository retirement gate](service/repositories/repositoryLifecycle.ts) — stale operations become no-ops before delegating to the live path adapter.
- [Repositories service](service/repositories/repositoriesService.ts) — raw directory `DELETE`/`RENAME` events drive retirement and the shared Repo observable remains path-cache based.
- [VFS-backed Automerge adapter](lib/automergeAdapter/createVFSAdapter.ts) — every operation resolves through the current VFS path with no route binding.
- [VirtualFileSystem](lib/virtualFileSystem/VirtualFileSystem.ts) and [LockManager](lib/virtualFileSystem/LockManager.ts) — provider resolution for lock-delayed operations happens after waiting.
- [DeviceFileSystemProvider](lib/deviceFileSystemProvider/DeviceFileSystemProvider.ts) — mounted records currently have no stable runtime route identity that survives identity-preserving provider refresh and changes on remove/re-add.

Basis:

- [Ready local-directory recovery handoff](../../docs/local-directory-access-recovery.md) — defines `VfsRouteIdentity`, `bindRoute(path)`, stale-route fencing, nested Device Files route identity, Automerge binding ownership, and Repo observable retirement.
- [CRDT/storage workflow](../../.agents/skills/crdt-storage/SKILL.md) — storage adapters, Repo/DocHandle resources, subscriptions, and caches require explicit lifecycle and invalidation semantics.

Risk: a stale or queued old Repo operation can still reach a later backing provider at the same VFS path, or stale DocHandle storage can appear to succeed through the current no-op gate. Conversely, retiring on arbitrary directory events expands lifecycle semantics beyond what this PR needs.

Required final state: implement the ready handoff exactly. VFS owns opaque route identity and an identity-bound IO primitive; delayed VFS operations revalidate route identity before provider resolution; Device Files same-entry refresh preserves nested route identity while remove/re-add changes it; the Automerge adapter uses the binding; repositories retire the cache/observable from binding invalidation and stale retained storage operations reject `FileSystemError.StaleIdentity` rather than succeeding or reaching a later route. Ordinary content/access changes preserve the Repo.

Verification: deterministic VFS lock-queue replacement proof, identity-preserving remount proof, Device nested-route identity proof, bound Automerge adapter proof, repository observable/cache retirement proof, stale retained Repo/DocHandle storage rejection proof, same-path fresh Repo proof, and sibling/unchanged-route proof.

### B2 — Required relocation/repository route-lifecycle integration proof is missing

Owner: `src/shared/service`

Problem: the handoff requires one real cross-service proof that locator-different fileSystem relocation ends the old Device Files route identity, repository retirement follows through the VFS binding/event seam only, and repository access at the relocated path creates a fresh Repo. Current integration tests cover same-entry reconnect/write settlement only.

Evidence:

- [Same-entry integration](service/fileSystemRepositoriesReconnect.integration.test.ts) — proves same-entry queued-write settlement.
- [Repositories/fileSystem integration](service/repositories/repositoriesFileSystemIntegration.test.ts) — proves same-entry `repo.flush()` result mapping.
- [File-system relocation tests](service/fileSystem/useFileSystemService.test.ts) and [repository lifecycle tests](service/repositories/repositoriesService.test.ts) — prove separate halves, not the real relocation-to-repository seam.

Basis:

- [Ready local-directory recovery handoff](../../docs/local-directory-access-recovery.md) — explicitly requires real relocation -> old route invalidation -> repository retirement -> fresh new-path Repo proof without direct fileSystem/repositories coordination.
- [Testing architecture](../../docs/testing/architecture.md) — cross-owner behavior requires the lowest faithful integration proof.

Risk: component tests can remain green while nested route identity forwarding, binding invalidation, or fresh Repo creation is wired incorrectly.

Required final state: after B1 is implemented, add one deterministic integration test using real fileSystem and repositories wiring that proves old route retirement and fresh Repo construction at the relocated path.

Verification: no arbitrary sleeps; assert identity/resource effects directly.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Inode/entry identity for arbitrary nested directory delete/recreate inside one unchanged provider route is outside PR #211. Do not add hierarchical locks or provider-wide cancellation to solve it here.

## Unresolved questions

None. Architecture is ready; implementation remains blocked on B1/B2.
