# Review

Verdict: blocked

## Scope reviewed

- Unavailable-root reconnect action, committed-result handling, confirmation UX, and required real-browser proof for PR #211.

## Blockers

### B1 — Committed reconnect/relocation results are invalidated by the pre-action recovery source

Owner: `src/features/localDirectoryReconnect`

Problem: `reconnectFolder()` snapshots the current provider-derived recovery object and rechecks `recovery.value === currentRecovery` after `reconnectDirectory()` and again after `relocateRememberedDirectory()`. Both service calls may successfully mutate the filesystem state that produced that recovery error: same-entry reconnect remounts the old path, while relocation removes the old path entirely. The expected reactive consequence is that the old unavailable-root recovery can disappear/change before the action continuation observes the committed result. The feature can therefore discard a successful `relocated`/`alreadyMounted` target instead of returning it for navigation, and can discard `reconnectedWithWriteRecoveryFailure` instead of surfacing its warning.

Evidence:

- [Reconnect feature](useLocalDirectoryReconnectAction.ts) — post-await identity checks run before processing both reconnect and relocation results.
- [File-system service](../../shared/service/fileSystem/useFileSystemService.ts) — same-entry reconnect remounts/synchronizes the provider before returning; relocation removes the old runtime record/path and synchronizes display state before returning `relocated`.
- [Repository Explorer widget](../../widgets/RepositoryExplorerWidget/RepositoryExplorerWidget.vue) — navigation occurs only when the feature returns a mounted name.
- [Reconnect feature tests](useLocalDirectoryReconnectAction.test.ts) — stale-target proof covers picker, marker inspection, and confirmation, but not recovery invalidation caused during the mutating reconnect/relocation calls.

Basis:

- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) — successful relocation must navigate to the recovered mount; same-entry non-flushed settlement must surface the explicit warning; stale-target protection must prevent unrelated navigation/state overwrite, not suppress the result of the action's own committed mutation.
- [Feature rules](../AGENTS.md) — the feature owns success/error/result orchestration for its action.

Risk: a successful relocation may leave the UI on the removed old VFS path, and a successful same-entry reconnect with unsaved changes may lose its required warning. Behavior depends on relative scheduling between worker mutation results and reactive error invalidation.

Required final state: provider-derived recovery state guards the action only until a mutating service call is committed. A successful committed service result is authoritative even if that mutation removes the source recovery error. The feature must reliably return the relocation/already-mounted target and reliably surface the same-entry write-recovery warning after commit. Stale user navigation while the mutation is pending must be prevented at the navigation owner rather than by discarding a committed result.

Verification: add deterministic feature tests where the recovery errors disappear/change while `reconnectDirectory()` or `relocateRememberedDirectory()` is pending and the service then resolves a committed result; prove relocation still returns its target and the non-flushed same-entry result remains visibly surfaced.

### B2 — Final real Chrome/PWA recovery proof is still missing

Owner: `src/features/localDirectoryReconnect`

Problem: mocked `FileSystemDirectoryHandle` fixtures cannot prove the browser behavior that originally invalidated the strict `isSameEntry()` design. The reset implementation has not yet been operator-verified in real Chrome/PWA.

Evidence:

- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) — final real Chrome/PWA proof is a merge gate.
- [Reconnect action](useLocalDirectoryReconnectAction.ts) — picker identity, unavailable-root recovery, and confirmed relocation depend on real File System Access behavior.

Basis:

- [Project review workflow](../../../.agents/skills/project-review/SKILL.md) — required but missing risk-specific proof blocks acceptance.

Risk: the final implementation could still differ from actual persisted-handle, permission, picker, or installed-PWA behavior in the scenario that motivated the PR.

Required final state: after code findings are resolved, verify the final implementation in real Chrome/PWA: revoked permission; granted-but-unavailable root; picker/confirmation cancellation; proven same-entry reconnect; locator-different confirmed relocation to a new mounted identity; invalid marker; already-mounted candidate; and navigation to the recovered mount.

Verification: operator proof against the final implementation/head; any discrepancy is treated as a product/architecture finding, not patched around in the UI.

## Major issues

### M1 — Confirmation copy promises deletion in the `alreadyMounted` zero-mutation scenario

Owner: `src/features/localDirectoryReconnect`

Problem: every marker-valid locator-different candidate receives the same confirmation text saying Mioframe "will reconnect it as a new location and remove the unavailable remembered location." The service only discovers `alreadyMounted` after confirmation, and that required outcome performs zero mutation, leaving the unavailable remembered record untouched while navigating to the existing mount.

Evidence:

- [Reconnect feature](useLocalDirectoryReconnectAction.ts) — confirmation happens before `relocateRememberedDirectory()` and unconditionally promises removal.
- [File-system relocation contract](../../shared/service/fileSystem/fileSystemContracts.ts) — `alreadyMounted` explicitly means zero persistence/runtime/request/display mutation.
- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) — the already-mounted candidate scenario is explicitly zero mutation.

Basis:

- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) — user confirmation must accurately describe the operation being authorized and its expected outcomes.

Risk: the user confirms a destructive-sounding removal that Mioframe may intentionally not perform, leaving a stale remembered mount contrary to the message they approved.

Required final state: confirmation copy truthfully covers both allowed outcomes without promising removal when the selected folder is already mounted elsewhere. No extra preflight service API is required.

Verification: feature test asserts the final confirmation copy and the `alreadyMounted` branch remains zero mutation/non-diagnostic.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
