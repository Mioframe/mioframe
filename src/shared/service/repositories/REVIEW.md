# Review

Verdict: blocked

## Scope reviewed

- Repository/VFS lifecycle and proven same-entry write-recovery settlement used by PR #211.

## Blockers

### B1 — Cached `Repo` lifetime is keyed only by path, not by VFS identity lifetime

Owner: `src/shared/service/repositories`

Problem: `repoObservableCache` stores one shared `Repo` observable per path and retains it across the idle timeout. The cache has no invalidation tied to VFS directory/mount identity ending. `createVFSAdapter()` performs storage IO by resolving the current VFS route for that path. If a cached path is removed and later represents a different directory/mount identity, the stale Repo can be reused against storage it was never created for.

Evidence:

- [Repositories service](repositoriesService.ts) — `repoObservableCache` is keyed by string path; `createRepoObservable()` emits one stateful Repo and keeps it alive until ref-count idle cleanup; there is no VFS lifecycle subscription/invalidation.
- [VFS adapter](../../lib/automergeAdapter/createVFSAdapter.ts) — the Automerge adapter stores `vfs + path` and routes each load/save/remove through that path rather than capturing a historical physical provider.
- [File-system service](../fileSystem/useFileSystemService.ts) — repository facts are already reactive through `directoryContent$`/`vfs.watch()`, while relocation removes one mounted root and creates another.
- [Device Files provider](../../lib/deviceFileSystemProvider/DeviceFileSystemProvider.ts) — root removal emits a directory `DELETE`; adding a root emits `CREATE`; refreshing an existing same-name root remounts its nested provider without emitting a root `DELETE`/`CREATE` pair.
- [Repository cache tests](repositoriesService.test.ts) — current proof covers path reuse inside the idle timeout and cleanup after timeout, but not directory/mount identity destruction followed by recreation.

Basis:

- [Local-directory recovery handoff](../../../../docs/local-directory-access-recovery.md) — a stateful Repo belongs to one VFS identity lifetime; identity-ending VFS events must retire exact/descendant cached repositories, while proven same-entry refresh preserves the current identity.
- [CRDT/storage workflow](../../../../.agents/skills/crdt-storage/SKILL.md) — caches, subscriptions, handles, and storage resources are lifecycle-managed; cache invalidation/cleanup must be explicit and stale resources must not hide or cross underlying storage changes.
- [Service rules](../AGENTS.md) — data-changing flows require deterministic invalidation and service-owned lifecycle/error normalization.

Risk: a stale Repo/DocHandle can be returned for a later storage identity at the same path and route Automerge state into unrelated physical storage. The current 60-second idle retention makes this possible even after all normal subscribers have temporarily gone away.

Required final state: repository resources react to VFS identity lifecycle without fileSystem callbacks. Ordinary content events and transient provider/access errors preserve the current Repo. A directory/root identity-ending `DELETE`/rename/removal retires cached repos at/under that path synchronously from reuse, prevents retired Repo storage operations from targeting a later identity, finalizes the old observable/resource lifecycle, and ensures later same-path repository access constructs a fresh Repo. Proven same-entry provider refresh must not retire the Repo.

Verification: add deterministic VFS-driven lifecycle proof covering ordinary content event reuse, transient error preservation, exact/descendant retirement, sibling isolation, active resource finalization, later same-path fresh Repo creation, and proof that a retired resource cannot perform new storage IO into the recreated identity. Extend relocation integration proof so old-root removal drives retirement through VFS events with no direct fileSystem→repositories coordination.

### B2 — `repo.flush()` failure escapes the post-reconnect settlement result contract

Owner: `src/shared/service/repositories`

Problem: `settleCachedRepository()` converts `flushPendingSaves()` non-flushed outcomes into `WriteAccessRecoveryResult`, but then awaits `repo.flush()` without handling its rejection. A same-entry reconnect has already persisted and remounted the replacement handle before this handler runs, so a storage failure from `repo.flush()` can reject `reconnectDeviceDirectory()` after the folder was successfully rebound instead of returning `reconnectedWithWriteRecoveryFailure`.

Evidence:

- [Repositories service](repositoriesService.ts) — `settleCachedRepository()` calls `await repo.flush()` after pending-save replay and returns `flushed` only if that promise resolves.
- [File-system service](../fileSystem/useFileSystemService.ts) — same-entry reconnect persists/remounts first and only then calls the registered write-recovery handlers, mapping non-flushed handler results to `reconnectedWithWriteRecoveryFailure`.
- [Retrying storage adapter](../../lib/automergeAdapter/createRetryingStorageAdapter.ts) — failed underlying saves are rethrown even when access-required saves are queued for retry.
- [Locked Automerge Repo version](../../../../pnpm-lock.yaml) — this repository uses `@automerge/automerge-repo` 2.5.6; its `Repo.flush()` rejects when storage saves reject.

Basis:

- [Local-directory recovery handoff](../../../../docs/local-directory-access-recovery.md) — after a proven same-entry persist/remount, incomplete repository settlement must keep the reconnect and return the explicit write-recovery warning result without rollback.
- [Service rules](../AGENTS.md) — service boundaries must normalize errors and expose deterministic failure contracts to upper layers.

Risk: Mioframe can report a generic reconnect failure even though the new handle is already persisted and mounted. The public result no longer describes the actual committed state.

Required final state: every expected repository-storage failure encountered while settling cached repositories after a successful same-entry remount is represented as a non-flushed `WriteAccessRecoveryResult`; expected settlement failure must not escape as an exception from the reconnect operation. Existing repository diagnostics remain the owner of underlying storage failure, and the file-system reconnect remains committed.

Verification: add focused repository proof for a rejecting `repo.flush()` and extend the real fileSystem/repositories same-entry integration proof so a post-remount flush failure returns `reconnectedWithWriteRecoveryFailure` rather than rejecting.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None. The required repository/VFS lifecycle is resolved in `docs/local-directory-access-recovery.md`.
