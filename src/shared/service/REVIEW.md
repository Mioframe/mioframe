# Review

Verdict: blocked

## Scope reviewed

- Remembered local-directory unavailable-root detection, two-stage reconnect/replacement, shared Mioframe-space inspection, persisted/runtime provider replacement, repository persistence recovery, Repository Explorer recovery composition, diagnostics, and focused proof.

## Blockers

### B1 — Reconnect implementation does not apply the repository lifecycle contract

Owner: `src/shared/service`

Problem: `persistAndMountReplacement()` currently remounts the provider and clears old access requests without coordinating cached Automerge repository state. The updated architecture now distinguishes two safe cases: proven same-entry reconnect must settle cached repository writes after remount; locator-different confirmed replacement must be rejected while a repository is cached under the mount.

Evidence:

- [File-system replacement](fileSystem/useFileSystemService.ts) — current replacement remounts and calls `registry.clearForSpace()` without settlement or a confirmed-replacement cache guard.
- [Access-request registry](fileSystem/fileSystemAccessRequestRegistry.ts) — registered write-recovery handlers currently run only from permission `resolve()`.
- [Repositories service](repositories/repositoriesService.ts) — cached `Repo` instances are keyed by VFS path and existing settlement already owns `flushPendingSaves()` + `repo.flush()`.
- [Retrying storage adapter](../../lib/automergeAdapter/createRetryingStorageAdapter.ts) — access-blocked saves remain queued until settlement.

Basis:

- [Local directory access recovery architecture](../../../docs/local-directory-access-recovery.md) — same-entry remount must invoke repository settlement; locator-different replacement must return `repositoryStateActive` with zero mutation while repository state is cached.
- [CRDT and storage workflow](../../../.agents/skills/crdt-storage/SKILL.md) — caches, pending writes, provider recovery, and cleanup are lifecycle-managed and require explicit transition proof.
- [Root architecture rules](../../../AGENTS.md) — storage/service changes must preserve complete lifecycle behavior and dependency ownership.

Risk: Same-entry reconnect can orphan queued saves when the old access request is cleared. Locator-different confirmed replacement can let an old cached Repo continue operating through the unchanged VFS path against a different physical Mioframe storage directory.

Required final state: Implement the architecture contract without a direct `fileSystem` → `repositories` dependency: reuse the registered write-recovery handlers after proven same-entry remount; add a narrow service-internal confirmed-replacement guard registered by repositories; block confirmed replacement while the target mount has cached repository state; preserve zero mutation on that block.

Verification: Focused cross-service proof must cover same-entry settlement success/non-flushed outcomes, stale old-request cleanup, exact/descendant cached-repository blocking for confirmed replacement, sibling isolation, and zero persistence/runtime mutation when replacement is blocked.

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
