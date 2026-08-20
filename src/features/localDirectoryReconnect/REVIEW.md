# Review

Verdict: blocked

## Scope reviewed

- Local-directory reconnect feature behavior and final browser proof for PR #211.

## Blockers

### B1 — Final real Chrome/PWA recovery proof is still missing

Owner: `src/features/localDirectoryReconnect`

Problem: mocked File System Access handles cannot prove the browser behavior that motivated the fallback from strict `isSameEntry()` identity.

Required final state: after code corrections, verify the final head in real Chrome/PWA for permission loss, granted-but-unavailable remembered root, picker/confirmation cancel, proven same-entry reconnect, locator-different confirmed relocation, invalid marker, already-mounted candidate, navigation, and same-entry settlement warning.

Verification: operator proof against the final implementation/head.

## Major issues

### M1 — Pre-commit staleness uses recovery object identity instead of the stable recovery key

Owner: `src/features/localDirectoryReconnect`

Problem: `parseFileSystemUnavailableRootRecovery()` creates a transfer-safe `{ spaceName }` value, but the action currently compares `recovery.value === currentRecovery`. A reactive reread can emit a new Error/recovery object for the same remembered mount and unnecessarily cancel the in-progress action even though the target is unchanged.

Evidence:

- [Reconnect action](useLocalDirectoryReconnectAction.ts) uses reference equality around picker, inspection, confirmation, and error-message applicability.
- [Unavailable-root recovery parser](../../shared/lib/fileSystem/fileSystemUnavailableRootRecovery.ts) defines `spaceName` as the transfer-safe recovery identity.

Basis:

- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) defines action validity by the stable `spaceName` target and intentionally keeps recovery independent of the future directory-state implementation.

Required final state:

- pre-mutation checks verify that the current unavailable-root recovery still targets the same `spaceName`;
- semantically identical re-emissions for the same mount do not cancel the action;
- a missing recovery or a different `spaceName` still aborts before mutation;
- committed service results remain authoritative after the mutation returns;
- keep the current concise confirmation copy; no copy correction is required.

Verification: deterministic feature tests replace the recovery Error/object with a new equivalent recovery for the same `spaceName` while picker/inspection is pending and prove the action continues; a different/missing `spaceName` still aborts before mutation.

## Minor issues

None.

## Accepted risks / deferred work

- General directory loading/refresh state and external filesystem observation are separate work.

## Unresolved questions

None.
