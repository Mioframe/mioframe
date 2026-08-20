# Review

Verdict: blocked

## Scope reviewed

- Complete PR #211 fileSystem recovery architecture and implementation, including provider classification/transport, recovery identity, mounted-directory mutation serialization, same-entry write settlement, provider recovery lifecycle, relocation, repository settlement integration, and downstream feature/widget contracts.

## Blockers

### B1 — same-entry settlement runs after topology protection is released

Owner: `src/shared/service/fileSystem`

Problem: `reconnectDeviceDirectory()` commits the proven same-entry persist/remount inside `enqueueMutation()`, then releases the fileSystem topology queue before running registered write-recovery settlement. Cached repositories are not bound to that provider instance: their VFS storage adapter resolves the provider currently mounted at the textual repository path for each IO. A same-runtime remove/add sequence can therefore reuse the same mounted path while pending repository writes are still being settled.

Evidence:

- [File-system service](useFileSystemService.ts) — the same-entry `enqueueMutation()` returns immediately after `persistAndRemountSameEntry()`, and `registry.runWriteRecoveryHandlers()` executes afterward, outside the serialized mutation turn.
- [Repository service](../repositories/repositoriesService.ts) — the registered write-recovery handler settles already-cached repositories and calls `repo.flush()` for the recovered mount path.
- [VFS Automerge adapter](../../lib/automergeAdapter/createVFSAdapter.ts) — repository storage operations call `vfs.readFile`, `vfs.writeFile`, and `vfs.delete` using the textual repository path on every IO.
- [Virtual file system](../../lib/virtualFileSystem/VirtualFileSystem.ts) — each write resolves the provider currently mounted for the path when that write starts; mount identity is not retained by the adapter.

Basis:

- [Local-directory recovery handoff](../../../../docs/local-directory-access-recovery.md) — same-entry reconnect must keep the existing same-runtime topology mutation turn active through registered write-recovery settlement so the recovered mounted path cannot be reassigned while cached writes are being flushed.
- [File-system service rules](AGENTS.md) — fileSystem owns mounted-provider lifecycle and recovery state, and changes here must keep provider, VFS, persisted handles, and recovery lifecycle aligned.

Risk: after the reconnect has remounted the proven-identical folder but before settlement finishes, another same-runtime action can remove that mount and add a different physical directory under the same name. Remaining queued/in-memory Automerge writes can then resolve through VFS to the replacement provider, writing user data to the wrong physical folder.

Required final state: the existing fileSystem mutation queue remains the only same-runtime topology serialization mechanism, but the same-entry reconnect mutation turn must remain active from final recovery-target validation through persist/remount and completion of registered write-recovery settlement. Repository code continues to own settlement through the existing handler contract. The queue releases after settlement completes with either `flushed` or a non-flushed result; reconnect remains committed on settlement failure. Do not introduce provider generations, leases, VFS route identity, or repository lifecycle changes.

Verification: add deterministic service proof with a deferred write-recovery handler showing that remove/add/replace topology operations queued after a same-entry reconnect cannot begin until settlement resolves, and that they proceed after both flushed and non-flushed settlement completion. Preserve existing persist-before-settlement ordering, committed-warning behavior, queue-failure release, and repository `repo.flush()` rejection proof.

## Major issues

### M1 — `addDeviceDirectory()` can leave pending permission recovery owned by a removed provider

Owner: `src/shared/service/fileSystem`

Problem: when `addDeviceDirectory()` successfully renames or replaces an already mounted provider, it updates persistence and provider topology and invalidates the old `recoveryKey`, but it does not clear pending access requests registered by the removed/replaced provider. Those registry entries retain the old directory handle and `refreshProvider` callback.

Evidence:

- [File-system service](useFileSystemService.ts) — the successful existing-record rename/replacement path removes/replaces the provider and deletes the old recovery key without calling `registry.clearForSpace()` for the removed/replaced provider identity.
- [Access request registry](fileSystemAccessRequestRegistry.ts) — pending requests store `FileSystemDirectoryHandle` plus the provider refresh callback and remain addressable by `{ spaceName, mode }` until explicitly resolved, cancelled, or cleared.
- [File-system service tests](useFileSystemService.test.ts) — rename/replacement tests prove mounted-name and recovery-key cleanup, but do not prove cleanup of provider-owned pending access requests on the same lifecycle path.

Basis:

- [File-system service rules](AGENTS.md) — service-owned provider recovery state must be deduplicated and cleaned up, with lifecycle defined for stale and provider-removed requests.
- [Local-directory recovery handoff](../../../../docs/local-directory-access-recovery.md) — a committed provider removal/replacement invalidates provider-owned runtime recovery state, including pending permission requests and runtime recovery identity.

Risk: a completed provider replacement can leave a stale permission-recovery entry pointing at an orphaned handle/provider callback. A later permission action can prepare or resolve recovery for a provider that is no longer mounted, and stale recovery state can accumulate for renamed mounted names.

Required final state: after persistence succeeds, every `addDeviceDirectory()` path that removes or replaces an existing mounted provider invalidates the pending access requests owned by that removed/replaced provider together with its old recovery identity. A failed persistence attempt must leave the still-current provider and its recovery state intact. A true no-replacement/reuse path must not discard still-valid requests merely for convenience.

Verification: add focused service tests that create pending provider access recovery, perform the relevant successful rename/replacement through `addDeviceDirectory()`, and prove the old request can no longer be fetched/prepared/resolved while the new mount remains correct. Preserve existing remove/reconnect/relocation request cleanup and recovery-key lifecycle tests.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- General directory loading/refresh state, external filesystem/rclone observation, persistent mounted-record IDs, VFS route identity, repository generations/retirement, hierarchical or cross-runtime locking, and generic cross-runtime mounted-record synchronization remain outside PR #211.
- The implementation-preflight read-only Git discipline added during this PR is a deliberate repository workflow improvement prompted by a repeated agent failure mode; it is not part of the storage runtime architecture and does not require removal from this PR.

## Unresolved questions

None.
