# Review

Verdict: blocked

## Scope reviewed

- Complete local-directory reconnect feature behavior and required browser proof for PR #211 after the repository-lifecycle correction.

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

Required final state: after code findings are resolved, verify the final head in real Chrome/PWA for permission loss, granted-but-unavailable remembered root, picker/confirmation cancellation, proven same-entry reconnect, locator-different confirmed relocation, invalid marker, already-mounted candidate, navigation, and same-entry settlement warning.

Verification: operator proof against the final implementation/head; any behavioral discrepancy becomes a new implementation or architecture finding.

## Major issues

### M1 — Stable recovery identity is not applied consistently to feature-owned state

Owner: `src/features/localDirectoryReconnect`

Problem: mutation checkpoints now correctly compare `spaceName`, but the feature still watches the whole parsed recovery object and resets `reconnectMessageOverride` whenever an equivalent recovery object is re-emitted for the same `spaceName`. In addition, `missingRecord` is a zero-mutation result but its message is applied unconditionally after an asynchronous service call, so a target change while that call is pending can apply stale feedback to the new recovery target. The required pre-mutation disappearance case also has no deterministic test.

Evidence:

- [Reconnect action](useLocalDirectoryReconnectAction.ts) — `isCurrentTarget()` uses `spaceName`, while `watch(recovery, ...)` still keys message lifetime to recovery-object identity; both `missingRecord` result branches update the override without checking the initiating target.
- [Reconnect feature tests](useLocalDirectoryReconnectAction.test.ts) — prove equivalent same-`spaceName` re-emissions continue through picker/inspection/confirmation and different targets abort, but do not prove same-target feedback survives re-emission or that recovery disappearance before mutation prevents the mutating call.
- [Unavailable-root recovery parser](../../shared/lib/fileSystem/fileSystemUnavailableRootRecovery.ts) — defines `{ spaceName }` as the transfer-safe recovery identity.

Basis:

- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) — recovery identity is the stable `spaceName`; the feature owns pending/result/error state; semantically identical re-emissions must not change action validity, while missing/different targets must abort before mutation.
- [Root architecture rules](../../../AGENTS.md) — state ownership and public behavior must have one explicit source of truth and required contract proof must exist before handoff.

Risk: an ordinary reactive reread for the same unavailable folder can erase a picker/inspection/validation retry message even though the target did not change; a zero-mutation `missingRecord` result can transiently show stale feedback for another target; and one explicitly required target-disappearance path is unproven.

Required final state:

- use `spaceName` consistently for target-local feature-state lifetime, so equivalent same-target recovery re-emissions preserve `reconnectMessageOverride`;
- reset target-local feedback when the recovery target actually changes or disappears;
- apply zero-mutation `missingRecord` feedback only while the initiating `spaceName` is still current;
- keep returned results from completed mutating reconnect/relocation operations authoritative as currently specified;
- keep current confirmation copy and Snackbar behavior unchanged.

Verification: deterministic feature tests prove (1) a same-`spaceName` recovery re-emission preserves target-local error/validation feedback, (2) disappearance before each mutation-capable checkpoint prevents the mutating call, (3) different target still aborts, and (4) a delayed `missingRecord` cannot overwrite feedback for a new target; existing committed-result tests remain green.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- General directory loading/refresh state, stale-read serialization, and external filesystem/rclone observation remain separate architecture work.
- Generic stale-Repo behavior for unrelated future reuse of the same textual VFS path remains outside PR #211.

## Unresolved questions

None.
