# Review

Verdict: blocked

## Scope reviewed

- Remembered local-directory unavailable-root detection, two-stage reconnect/replacement, shared Mioframe-space inspection, persisted/runtime provider replacement, repository persistence recovery, Repository Explorer recovery composition, diagnostics, and focused proof.

## Blockers

### B1 — Reconnect replacement drops write-recovery coordination for cached repositories

Owner: `src/shared/service`

Problem: A successful local-directory replacement persists and remounts the new handle, then calls `registry.clearForSpace()`. That removes any pending read/write access requests for the old handle but does not run the registered write-recovery handlers. `repositoriesService` keeps Automerge `Repo` instances and retrying storage adapters cached by the unchanged VFS path, and retrying adapters retain queued failed saves until `flushPendingSaves()` is invoked. Therefore a reconnect can remove the pending write-recovery trigger while leaving queued repository saves alive and unflushed behind the same mount path.

Evidence:

- [File-system replacement](fileSystem/useFileSystemService.ts) — `persistAndMountReplacement()` remounts the provider and then calls `registry.clearForSpace()` without repository/write-recovery settlement.
- [Access-request registry](fileSystem/fileSystemAccessRequestRegistry.ts) — `clearForSpace()` only deletes requests; registered `WriteAccessRecoveryHandler`s are invoked only by `resolve()` after a granted write-access request.
- [Repositories service](repositories/repositoriesService.ts) — repository instances are cached by path and `registerWriteAccessRecoveryHandler()` wires `settleCachedRepositoriesUnderPath()`, which flushes queued saves and then `repo.flush()`.
- [Retrying storage adapter](../../lib/automergeAdapter/createRetryingStorageAdapter.ts) — failed access-required saves remain in `pendingSaves` until `flushPendingSaves()` succeeds.

Basis:

- [Local directory access recovery architecture](../../../docs/local-directory-access-recovery.md) — confirmed replacement is required to preserve the remembered mounted path and recover the selected historical space; recovery must not leave storage/runtime behavior incomplete.
- [CRDT and storage workflow](../../../.agents/skills/crdt-storage/SKILL.md) — caches and pending resources are lifecycle-managed, provider recovery must define retry/cleanup behavior, and cache/recovery transitions require focused proof.
- [Root architecture rules](../../../AGENTS.md) — storage/service changes must preserve ownership, invalidation, required user scenarios, and complete lifecycle behavior rather than relying on green verification alone.

Risk: Previously queued Automerge saves can remain stranded after reconnect and be lost if the runtime ends before another settlement trigger. A later settlement can also replay stale queued work only after an unrelated action, making reconnect completion nondeterministic. Clearing the old request without coordinating the repository recovery lifecycle breaks the existing guarantee that write-access recovery settles cached repository state.

Required final state: The reconnect/replacement architecture must explicitly define what happens to cached repository state and queued saves when a remembered mount is rebound. After a successful reconnect of the user-confirmed historical space, pending repository writes must have a deterministic recovery/settlement path tied to that reconnect, and recovery failures must remain observable instead of being silently orphaned by clearing the old request. Ownership and ordering between file-system replacement and repository recovery must be explicit before another code correction.

Verification: Add focused cross-service proof with a cached repository containing queued saves under the recovered mount. Reconnect/replacement must demonstrate the chosen settlement lifecycle, including success and recovery failure, and prove that no pending write is silently orphaned when the old access request is cleared.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

- The exact cross-service ordering/contract for repository settlement versus provider replacement is not resolved by the current architecture handoff. This must be resolved architecturally before coding resumes.
