# Review

Verdict: blocked

## Scope reviewed

- Complete local-directory reconnect behavior after the runtime `recoveryKey`, marker-ownership, and zero-mutation result corrections, plus the browser-specific File System Access proof still required for PR #211.

## Blockers

### B1 — Browser-specific File System Access proof is incomplete

Owner: `src/features/localDirectoryReconnect`

Problem: deterministic mocks prove Mioframe-owned branching, stale-action safety, topology ordering, settlement outcomes, invalid/duplicate candidates, and navigation semantics, but they cannot prove the Chrome-owned behavior of persisted `FileSystemDirectoryHandle` objects, permission persistence/revocation, real `showDirectoryPicker()`, `isSameEntry()`, or a granted-but-unavailable remembered root. Operator proof now exists for the real reconnect fallback/relocation path in the deployed PR preview.

Evidence:

- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) requires real-browser proof for File System Access behavior that mocks cannot faithfully establish.
- [Reconnect action](useLocalDirectoryReconnectAction.ts) uses real `showDirectoryPicker()` and branches on service results derived from `FileSystemHandle.isSameEntry()` and unavailable-root detection.
- [Persisted handle service](../../shared/service/fileSystem/setupFileSystemDirectoryHandleService.ts) stores remembered `FileSystemDirectoryHandle` objects in the same ordinary IndexedDB-backed record store; it does not namespace records by PWA install state, release channel, or URL path.
- Operator verification on the deployed PR preview confirmed the observable false/unverifiable-identity fallback: reconnect required explicit replacement confirmation, the remembered original mount was removed after confirmation, and the selected Mioframe space was mounted under a new unique locator with the `(2)` suffix.
- [Chrome persistent File System Access permissions](https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api/) documents one install-state-specific browser difference that does matter: installed web apps automatically persist granted File System Access permissions. Therefore installed-PWA coverage is relevant only to the permission persistence/revocation boundary, not as a reason to repeat the whole reconnect matrix.

Basis:

- [Project review workflow](../../../.agents/skills/project-review/SKILL.md) requires risk-specific proof at the lowest faithful level and treats missing required browser proof as blocking acceptance.
- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) requires browser proof for platform behavior that deterministic service/provider tests cannot establish.

Risk: the implementation has strong deterministic proof, and the real relocation fallback is confirmed, but acceptance still lacks direct evidence for the remaining browser-owned assumptions that motivated the feature: persisted-handle/permission lifecycle, granted-but-unavailable detection, and real same-entry behavior where reproducible.

Required final state: complete only the remaining platform-specific operator proof on the final implementation: (1) remembered-handle permission persistence/revocation in Chrome, including installed-PWA behavior because Chrome changes permission persistence for installed apps; (2) a granted-but-unavailable remembered root produces the unavailable-folder recovery action; (3) picker cancellation leaves the remembered mount unchanged; and (4) `isSameEntry() === true` keeps the same mounted path when that browser state is practically reproducible. The already-observed locator-different confirmed relocation path does not need to be repeated unless implementation changes.

Verification: operator proof against the final implementation/head for those browser-owned behaviors. Synthetic race, settlement-failure, invalid/duplicate-candidate, stale-action, and navigation cases remain owned by the existing deterministic tests rather than manual PWA duplication. Any browser discrepancy becomes a new implementation or architecture finding.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Repeating the complete deterministic recovery matrix in an installed PWA is not required; install state is relevant only where Chrome changes File System Access permission behavior.
- General directory loading/refresh state, stale-read serialization, external filesystem/rclone observation, and general cross-runtime mounted-record synchronization remain separate architecture work.
- Generic stale-Repo behavior for unrelated future reuse of the same textual VFS path remains outside PR #211.

## Unresolved questions

None.
