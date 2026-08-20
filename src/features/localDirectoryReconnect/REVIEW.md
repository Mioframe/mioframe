# Review

Verdict: blocked

## Scope reviewed

- Complete local-directory reconnect behavior after the runtime `recoveryKey`, marker-ownership, and zero-mutation result corrections, plus required final browser proof for PR #211.

## Blockers

### B1 — Final real Chrome/PWA recovery proof is incomplete

Owner: `src/features/localDirectoryReconnect`

Problem: mocked File System Access handles cannot prove the browser behavior that motivated the recovery flow. Partial operator proof now exists for confirmed locator-different relocation in the deployed PR preview, but the complete required Chrome/PWA matrix has not yet been demonstrated.

Evidence:

- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) requires final real Chrome/PWA proof for the complete recovery matrix.
- [Reconnect action](useLocalDirectoryReconnectAction.ts) depends on real `showDirectoryPicker()`, persisted `FileSystemDirectoryHandle` behavior, `isSameEntry()`, and unavailable-root recovery.
- Operator verification on the deployed PR preview confirmed the observable relocation fallback: reconnect required explicit replacement confirmation, the remembered original mount was removed after confirmation, and the selected Mioframe space was mounted under a new unique locator with the `(2)` suffix. This is consistent with the false/unverifiable-identity relocation branch required by the architecture contract.
- [PWA build configuration](../../../config/plugins/pwa.ts) documents that PR previews pass `disablePwa: true`, so preview verification does not establish installed-PWA behavior.

Basis:

- [Project review workflow](../../../.agents/skills/project-review/SKILL.md) treats required but missing risk-specific proof as blocking acceptance.
- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) includes real Chrome/PWA verification in required proof.

Risk: the preview result establishes the basic confirmation/relocation behavior but does not establish the rest of the required matrix, including persisted-handle behavior in an installed PWA, permission loss, proven same-entry reconnect, cancellation/zero-mutation paths, invalid/duplicate candidates, same-entry settlement warning, or same-name stale-action safety where practically reproducible.

Required final state: complete operator proof on the final implementation for the remaining real Chrome/PWA matrix: permission loss, granted-but-unavailable remembered root, picker/confirmation cancellation, proven same-entry reconnect, invalid marker, already-mounted candidate, navigation, same-entry settlement warning, same-name stale-action safety where practically reproducible, and installed-PWA behavior. The already-observed locator-different confirmed relocation path does not need to be repeated unless the final implementation changes.

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
