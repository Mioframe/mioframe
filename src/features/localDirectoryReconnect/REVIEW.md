# Review

Verdict: blocked

## Scope reviewed

- Complete local-directory reconnect behavior after the runtime `recoveryKey`, marker-ownership, and zero-mutation result corrections, plus required final browser proof for PR #211.

## Blockers

### B1 — Final real Chrome/PWA recovery proof is still missing

Owner: `src/features/localDirectoryReconnect`

Problem: mocked File System Access handles cannot prove the browser behavior that motivated the recovery flow.

Evidence:

- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) requires final real Chrome/PWA proof for the complete recovery matrix.
- [Reconnect action](useLocalDirectoryReconnectAction.ts) depends on real `showDirectoryPicker()`, persisted `FileSystemDirectoryHandle` behavior, `isSameEntry()`, and unavailable-root recovery.

Basis:

- [Project review workflow](../../../.agents/skills/project-review/SKILL.md) treats required but missing risk-specific proof as blocking acceptance.
- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) includes real Chrome/PWA verification in required proof.

Risk: mocks cannot establish persisted-handle behavior, real `isSameEntry()` behavior, granted-but-unavailable root handling, picker behavior, installed-PWA behavior, or same-name stale-action safety.

Required final state: verify the final head in real Chrome/PWA for permission loss, granted-but-unavailable remembered root, picker/confirmation cancellation, proven same-entry reconnect, locator-different confirmed relocation, invalid marker, already-mounted candidate, navigation, same-entry settlement warning, and same-name stale-action safety where practically reproducible.

Verification: operator proof against the final implementation/head; any behavioral discrepancy becomes a new implementation or architecture finding.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- General directory loading/refresh state, stale-read serialization, external filesystem/rclone observation, and general cross-runtime mounted-record synchronization remain separate architecture work.
- Generic stale-Repo behavior for unrelated future reuse of the same textual VFS path remains outside PR #211.

## Unresolved questions

None.
