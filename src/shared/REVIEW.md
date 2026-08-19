# Review

Verdict: blocked

## Scope reviewed

- Cross-boundary VFS/repository identity lifecycle and required integration proof for PR #211.

## Blockers

### B1 — Repository retirement is not a hard VFS identity boundary

Owner: `src/shared` architecture boundary between `lib/virtualFileSystem` and `service/repositories`

Problem: the new repository retirement gate only checks `retired` before delegating an adapter operation to the path-based VFS adapter. A save that starts before retirement can already have delegated into `vfs.writeFile()` but still be waiting in the VFS path lock. VFS resolves the owning provider only after that wait. If the old identity is removed and the same path is recreated before the queued callback runs, the old Repo operation can resolve the later provider and write into a different storage identity. Retirement also removes the path cache and calls `Repo.shutdown()`, but active `getRepo$` subscribers remain attached to the old `concat(of(repo), NEVER)` observable. With the locked `@automerge/automerge-repo` 2.5.6 API, `shutdown()` disconnects network adapters and flushes; it does not unload/remove DocHandles or detach their storage-save listeners. The retired adapter then turns later stale-handle storage operations into successful no-ops, so stale in-memory edits can be silently discarded rather than the resource being observably retired.

Evidence:

- [Repository retirement gate](service/repositories/repositoryLifecycle.ts) — each operation checks `retired` only before calling the underlying adapter.
- [Repositories service](service/repositories/repositoriesService.ts) — retirement gates storage, deletes the reusable cache entry and calls `repo.shutdown()`, but does not terminate existing shared observable subscribers.
- [VFS-backed Automerge adapter](lib/automergeAdapter/createVFSAdapter.ts) — every storage operation is routed by path through the live `VirtualFileSystem`.
- [VirtualFileSystem](lib/virtualFileSystem/VirtualFileSystem.ts) — `writeFile()` resolves the provider inside the path-lock callback, after any earlier queued operation finishes.
- [LockManager](lib/virtualFileSystem/LockManager.ts) — an operation may wait in the per-path promise queue before its callback executes.
- [Locked Automerge Repo version](../../pnpm-lock.yaml) and [upstream 2.5.6 Repo implementation](https://github.com/automerge/automerge-repo/blob/v2.5.6/packages/automerge-repo/src/Repo.ts) — `shutdown()` does not retire DocHandles or their save listeners.

Basis:

- [Local-directory recovery handoff](../../docs/local-directory-access-recovery.md) — retirement must prevent old repository operations from reaching a later identity at the same path and must terminate/finalize the active Repo resource.
- [CRDT/storage workflow](../../.agents/skills/crdt-storage/SKILL.md) — repositories, handles, subscriptions and caches are lifecycle-managed resources with explicit cleanup/invalidation requirements.

Risk: an old Repo can write Automerge bytes into a different physical storage directory that later reuses the same VFS path. Separately, stale DocHandles can remain usable after identity retirement while their storage writes are silently discarded. Both violate the storage-identity/data-safety invariant this PR is intended to establish.

Required final state: repository identity retirement must form an atomic hard boundary at the point where a VFS operation selects/uses its backing identity. An operation owned by an ended identity, including one that began before retirement but had not yet resolved its provider, must never access a later identity at the same path. Existing subscribers must stop observing the retired Repo as a live reusable resource, and stale DocHandle changes must not silently appear successfully persisted. Proven same-entry refresh must continue preserving the same identity. The VFS/repository ownership and API needed for this fence must be resolved in architecture before another coding correction.

Verification: add deterministic proof that holds an old Repo write before provider resolution, ends the identity, recreates the same path with a different provider, releases the held operation, and proves the new provider receives no old write. Also prove active Repo subscribers transition away from the retired resource, stale DocHandles cannot silently persist/no-op as if still live, same-path recreation creates a fresh Repo, siblings remain unaffected, and proven same-entry refresh preserves the current Repo.

### B2 — Required relocation/repository lifecycle integration proof is still missing

Owner: `src/shared/service`

Problem: the handoff requires a cross-service proof that real fileSystem relocation removes the old mounted root, repository retirement follows only from the resulting VFS event, and repository access at the relocated path creates a different Repo. The current integration tests cover same-entry reconnect/write settlement only. File-system relocation tests and repository lifecycle tests prove their halves separately, but not the required seam.

Evidence:

- [Same-entry integration](service/fileSystemRepositoriesReconnect.integration.test.ts) — covers real fileSystem/repositories registration for queued-write settlement, not locator-different relocation.
- [Repositories/fileSystem integration](service/repositories/repositoriesFileSystemIntegration.test.ts) — covers same-entry `repo.flush()` outcome with a mocked Repo, not relocation-driven retirement.
- [Repository lifecycle tests](service/repositories/repositoriesService.test.ts) — inject VFS lifecycle events directly rather than exercising the relocation event path.

Basis:

- [Local-directory recovery handoff](../../docs/local-directory-access-recovery.md) — explicitly requires relocation/repository integration proof with no direct fileSystem→repositories coordination.
- [Testing architecture](../../docs/testing/architecture.md) — required cross-boundary behavior must be proven at the lowest environment that faithfully reproduces the integration seam.

Risk: unit tests can stay green while the actual nested provider → outer VFS event forwarding, retirement matching, or new-path Repo creation is wired incorrectly.

Required final state: after the lifecycle architecture is corrected, one deterministic integration proof must exercise real fileSystem relocation together with real repository lifecycle wiring and establish old-identity retirement plus fresh repository creation at the new path without direct service coordination.

Verification: add the required deterministic integration test without arbitrary sleeps.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

- The current handoff does not yet define a VFS identity/fencing primitive that can protect operations already delegated into VFS but not yet resolved to a provider. Architecture must resolve that boundary before the next coding task.
