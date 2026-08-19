# Review

Verdict: blocked

## Scope reviewed

- Unavailable-root reconnect action, committed-result handling, warning UX, confirmation UX, and required real-browser proof for PR #211.

## Blockers

### B1 — Committed reconnect/relocation results are still invalidated by the pre-action recovery source

Owner: `src/features/localDirectoryReconnect`

Problem: `reconnectFolder()` snapshots the current provider-derived recovery object and rechecks `recovery.value === currentRecovery` after `reconnectDirectory()` and again after `relocateRememberedDirectory()`. Both service calls may successfully mutate the filesystem state that produced that recovery error. The expected reactive consequence is that the unavailable-root recovery can disappear/change before the action continuation processes the committed result. The feature can therefore discard a successful relocation target and can also lose the required same-entry write-recovery warning.

The current warning is additionally stored only as `reconnectMessageOverride`, while the widget renders that message only inside the `hasUnavailableRootRecovery` empty-state. A successful same-entry reconnect is expected to make that recovery branch disappear, so the warning has no durable visible owner after commit.

Evidence:

- [Reconnect feature](useLocalDirectoryReconnectAction.ts) — post-await recovery identity checks run before processing both reconnect and relocation results; `reconnectedWithWriteRecoveryFailure` only sets `reconnectMessageOverride`.
- [File-system service](../../shared/service/fileSystem/useFileSystemService.ts) — same-entry reconnect remounts/synchronizes the provider before returning; relocation removes the old runtime root and synchronizes state before returning `relocated`.
- [Repository Explorer recovery composition](../../widgets/RepositoryExplorerWidget/useRepositoryExplorerRecovery.ts) — `hasUnavailableRootRecovery` is derived from provider errors, and the warning message is only exposed through that recovery branch.
- [Repository Explorer widget](../../widgets/RepositoryExplorerWidget/RepositoryExplorerWidget.vue) — navigation occurs only when the feature returns a mounted name; reconnect text is rendered only in the unavailable-root empty-state.
- [Reconnect feature tests](useLocalDirectoryReconnectAction.test.ts) — stale-target proof does not model the recovery disappearing because the mutating service action itself committed.

Basis:

- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) — provider recovery freshness guards pre-commit work only; an explicit committed service result remains authoritative. The same-entry write-recovery warning must use the existing Snackbar mechanism because the unavailable-root state is expected to disappear after reconnect.
- [Feature rules](../AGENTS.md) — the feature owns loading/cancel/success/error/result orchestration for its action.

Risk: a successful relocation may leave the UI on the removed old VFS path, while a successful same-entry reconnect with unsaved changes may silently lose its required warning. Behavior depends on scheduling between worker mutation results and reactive invalidation.

Required final state: provider-derived recovery state may cancel stale work only before a mutating service action commits. After `reconnectDirectory()` or `relocateRememberedDirectory()` returns an explicit result, the feature processes that result even if its source recovery disappeared because of the mutation. `reconnectedWithWriteRecoveryFailure` must show exactly `The folder is reconnected, but some pending changes could not be saved.` through the existing Snackbar API, independent of the unavailable-root empty-state. Relocated/already-mounted results must return the mounted name to the widget. Navigation applicability remains widget-owned.

Verification: add deterministic feature tests where recovery errors disappear/change while reconnect/relocation is pending and the service then resolves an explicit result; prove relocation/already-mounted still returns its target, same-entry warning is added to Snackbar, and no diagnostic exception is emitted for that expected result.

### B2 — Final real Chrome/PWA recovery proof is still missing

Owner: `src/features/localDirectoryReconnect`

Problem: mocked `FileSystemDirectoryHandle` fixtures cannot prove the browser behavior that originally invalidated the strict `isSameEntry()` design. The final implementation has not yet been operator-verified in real Chrome/PWA.

Evidence:

- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) — final real Chrome/PWA proof is a merge gate.
- [Reconnect action](useLocalDirectoryReconnectAction.ts) — picker identity, unavailable-root recovery, and confirmed relocation depend on real File System Access behavior.

Basis:

- [Project review workflow](../../../.agents/skills/project-review/SKILL.md) — required but missing risk-specific proof blocks acceptance.

Risk: the final implementation could still differ from actual persisted-handle, permission, picker, or installed-PWA behavior in the scenario that motivated the PR.

Required final state: after code findings are resolved, verify the final implementation in real Chrome/PWA: revoked permission; granted-but-unavailable root; picker/confirmation cancellation; proven same-entry reconnect; same-entry settlement warning; locator-different confirmed relocation to a new mounted identity; invalid marker; already-mounted candidate; and navigation to the recovered mount.

Verification: operator proof against the final implementation/head; any discrepancy is treated as a product/architecture finding, not patched around in the UI.

## Major issues

### M1 — Confirmation copy promises deletion in the `alreadyMounted` zero-mutation scenario

Owner: `src/features/localDirectoryReconnect`

Problem: every marker-valid locator-different candidate currently receives confirmation text saying Mioframe will remove the unavailable remembered location. The service only discovers `alreadyMounted` after confirmation, and that required outcome performs zero mutation.

Evidence:

- [Reconnect feature](useLocalDirectoryReconnectAction.ts) — confirmation happens before `relocateRememberedDirectory()` and unconditionally promises removal.
- [File-system relocation contract](../../shared/service/fileSystem/fileSystemContracts.ts) — `alreadyMounted` means zero persistence/runtime/request/display mutation.

Basis:

- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) — confirmation copy is now explicitly resolved to cover both relocation and already-mounted outcomes truthfully.

Risk: the user confirms removal that Mioframe may intentionally not perform.

Required final state: use the exact handoff copy:

`Mioframe can't verify that this is the same folder it remembers. Continue only if you recognize the selected Mioframe space. Mioframe will open the selected space at a safe mounted location. If it isn't already mounted, the unavailable remembered location will be replaced. Unsaved in-memory changes from the unavailable location cannot be transferred.`

Keep headline `Reconnect this Mioframe space?`, confirm `Reconnect`, cancel `Cancel`.

Verification: feature test asserts the exact confirmation copy and the `alreadyMounted` branch remains zero mutation/non-diagnostic.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None. Post-commit/stale-result ownership is resolved in `docs/local-directory-access-recovery.md`.
