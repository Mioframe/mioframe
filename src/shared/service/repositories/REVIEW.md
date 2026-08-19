# Review

Verdict: blocked

## Scope reviewed

- Repository write-recovery settlement used by proven same-entry local-directory reconnect in PR #211.

## Blockers

### B1 — `repo.flush()` failure escapes the post-reconnect settlement result contract

Owner: `src/shared/service/repositories`

Problem: `settleCachedRepository()` converts `flushPendingSaves()` non-flushed outcomes into `WriteAccessRecoveryResult`, but then awaits `repo.flush()` without handling its rejection. A same-entry reconnect has already persisted and remounted the replacement handle before this handler runs, so a storage failure from `repo.flush()` can reject `reconnectDeviceDirectory()` after the folder was successfully rebound instead of returning `reconnectedWithWriteRecoveryFailure`.

Evidence:

- [Repositories service](repositoriesService.ts) — `settleCachedRepository()` calls `await repo.flush()` after pending-save replay and returns `flushed` only if that promise resolves.
- [File-system service](../fileSystem/useFileSystemService.ts) — same-entry reconnect persists/remounts first and only then calls the registered write-recovery handlers, mapping non-flushed handler results to `reconnectedWithWriteRecoveryFailure`.
- [Retrying storage adapter](../../lib/automergeAdapter/createRetryingStorageAdapter.ts) — failed underlying saves are rethrown even when access-required saves are queued for retry.
- [Locked Automerge Repo version](../../../../pnpm-lock.yaml) — this repository uses `@automerge/automerge-repo` 2.5.6. Its `Repo.flush()` writes cached handles through `StorageSubsystem.saveDoc()` and rejects when those saves reject.

Basis:

- [Local-directory recovery handoff](../../../../docs/local-directory-access-recovery.md) — after a proven same-entry persist/remount, incomplete repository settlement must keep the reconnect and return the explicit write-recovery warning result without rollback.
- [Repository/service rules](../AGENTS.md) — service boundaries must normalize errors and expose deterministic failure contracts to upper layers.

Risk: Mioframe can report `Could not reconnect this folder` even though the new handle is already persisted and mounted. The public result no longer describes the actual committed state, and a hard/transient storage failure during `repo.flush()` bypasses the intended non-flushed recovery path.

Required final state: every repository-storage failure encountered while settling cached repositories after a successful same-entry remount is represented as a non-flushed `WriteAccessRecoveryResult`; expected settlement failure must not escape as an exception from the reconnect operation. Existing repository diagnostics remain the owner of the underlying storage failure, and the file-system reconnect remains committed.

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

None.
