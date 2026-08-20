# Review

Verdict: blocked

## Scope reviewed

- Complete local-directory reconnect feature behavior after the runtime `recoveryKey` correction, plus required final browser proof for PR #211.

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

Required final state: after code review is clean, verify the final head in real Chrome/PWA for permission loss, granted-but-unavailable remembered root, picker/confirmation cancellation, proven same-entry reconnect, locator-different confirmed relocation, invalid marker, already-mounted candidate, navigation, same-entry settlement warning, and same-name stale-action safety where practically reproducible.

Verification: operator proof against the final implementation/head; any behavioral discrepancy becomes a new implementation or architecture finding.

## Major issues

### M1 — `alreadyMounted` is incorrectly treated as a committed result

Owner: `src/features/localDirectoryReconnect`

Problem: `alreadyMounted` is a zero-mutation relocation result, but the feature applies its message and returns its mounted name without checking that the initiating `recoveryKey` is still current. A test explicitly preserves this result after recovery disappears, which contradicts the current recovery contract.

Evidence:

- [Reconnect action](useLocalDirectoryReconnectAction.ts) handles `relocateResult.status === 'alreadyMounted'` by setting `reconnectMessageOverride` and returning `relocateResult.name` unconditionally.
- [Reconnect tests](useLocalDirectoryReconnectAction.test.ts) include `preserves a committed alreadyMounted result even when its source recovery disappears because the relocation itself committed`, classifying a zero-mutation result as committed.

Basis:

- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) defines `alreadyMounted` as a zero-mutation outcome and requires zero-mutation feedback/navigation to apply only while the initiating `recoveryKey` is still current.

Risk: if the unavailable provider is replaced or recovery disappears while relocation is pending, a stale action can still return another mounted name and trigger navigation even though the initiating target is no longer valid. Same-name replacement can also evade the widget's path-only stale-navigation guard.

Required final state: apply `alreadyMounted` feedback and return its mounted name only when the initiating `recoveryKey` is still current. If recovery disappeared or changed key before the result is applied, return no navigation target and do not write stale target-local feedback. Keep `alreadyMounted` itself zero-mutation and non-diagnostic.

Verification: deterministic feature tests delay an `alreadyMounted` result, replace the recovery with the same `spaceName` but a different `recoveryKey` (and separately remove recovery), and prove no stale message or navigation target is produced; the current-target `alreadyMounted` behavior remains unchanged.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- General directory loading/refresh state, stale-read serialization, external filesystem/rclone observation, and general cross-runtime mounted-record synchronization remain separate architecture work.
- Generic stale-Repo behavior for unrelated future reuse of the same textual VFS path remains outside PR #211.

## Unresolved questions

None.
