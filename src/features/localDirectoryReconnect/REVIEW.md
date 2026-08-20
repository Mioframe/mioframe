# Review

Verdict: blocked

## Scope reviewed

- Complete local-directory reconnect feature behavior and required browser proof for PR #211 after the final feature-state correction.

## Blockers

### B1 — Final real Chrome/PWA recovery proof is still missing

Owner: `src/features/localDirectoryReconnect`

Problem: mocked File System Access handles cannot prove the real browser behavior that motivated the fallback from strict `isSameEntry()` identity.

Evidence:

- [Reconnect action](useLocalDirectoryReconnectAction.ts) — the user flow depends on `showDirectoryPicker()`, real `FileSystemDirectoryHandle` identity behavior, marker inspection, and provider recovery.
- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) — explicitly requires final real Chrome/PWA proof for the complete recovery matrix.

Basis:

- [Project review workflow](../../../.agents/skills/project-review/SKILL.md) — required but missing risk-specific proof blocks acceptance.
- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) — real Chrome/PWA proof is part of the required proof for this feature.

Risk: mocks cannot establish that persisted handles, root enumeration failures, `isSameEntry()`, picker behavior, and installed-PWA behavior match the scenario that caused the defect.

Required final state: verify the final head in real Chrome/PWA for permission loss, granted-but-unavailable remembered root, picker/confirmation cancellation, proven same-entry reconnect, locator-different confirmed relocation, invalid marker, already-mounted candidate, navigation, and same-entry settlement warning.

Verification: operator proof against the final implementation/head; any behavioral discrepancy becomes a new implementation or architecture finding.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- General directory loading/refresh state, stale-read serialization, and external filesystem/rclone observation remain separate architecture work.
- Generic stale-Repo behavior for unrelated future reuse of the same textual VFS path remains outside PR #211.

## Unresolved questions

None.
