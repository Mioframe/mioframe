# Review

Verdict: blocked

## Scope reviewed

- Complete PR #211 fileSystem recovery architecture and implementation after the settlement/topology and provider-recovery lifecycle correction, including queue boundaries, provider replacement semantics, pending access-request lifecycle, recovery identity, focused tests, repository settlement integration, and downstream contracts.

## Blockers

### B1 — provider-recovery lifecycle correction is not fully proven

Owner: `src/shared/service/fileSystem`

Problem: the implementation now contains the required provider-recovery cleanup logic, but the focused regression proof does not cover all branch conditions that define whether an `addDeviceDirectory()` call replaces the mounted provider. The new successful-cleanup test exercises only the rename branch. The same-name/new-handle branch (`existingRecord.handle !== nextRecord.handle`) is not directly proven, and the failed-persistence test says recovery identity is preserved but only checks the pending request and mounted display state; it does not prove that the existing `recoveryKey` remains current. The true non-replacement branch (same mounted name and same handle reference) is likewise not proven to preserve its still-valid pending request.

Evidence:

- [File-system service](useFileSystemService.ts) — `isProviderReplacement` has two independent conditions: name change or handle-reference change; cleanup runs only when that predicate is true.
- [File-system service tests](useFileSystemService.test.ts) — the new pending-request cleanup proof uses `Projects` -> `Archive`, so the name-change condition alone makes the branch true; there is no equivalent pending-request proof for a same-name/new-handle provider replacement.
- [File-system service tests](useFileSystemService.test.ts) — `failed persistence during addDeviceDirectory() preserves the current provider pending request and recovery identity` verifies the request and display record after rejection but never captures or re-validates the pre-existing `recoveryKey`.

Basis:

- [Local-directory recovery handoff](../../../../docs/local-directory-access-recovery.md) — committed provider replacement must invalidate provider-owned recovery state, failed persistence must preserve the still-current provider state, and the provider-recovery lifecycle is part of the required acceptance proof.
- [Root project rules](../../../../AGENTS.md) — required contract proof must exist before handoff; green verification does not replace missing risk-specific verification.
- [Project review workflow](../../../../.agents/skills/project-review/SKILL.md) — missing required risk-specific proof is a review finding even when automated checks are green.

Risk: a regression in the handle-reference half of `isProviderReplacement`, or premature `recoveryKey` invalidation on persistence failure, could pass the current focused tests while violating the provider-lifecycle contract that this correction was intended to protect.

Required final state: keep the current production architecture unless a focused test exposes a defect, and add faithful regression proof that (1) same mounted name + physically same entry represented by a different handle object replaces the provider and clears the old pending request, (2) a true non-replacement using the same handle reference preserves its still-valid pending request, and (3) failed persistence preserves the pre-existing recovery identity as well as the pending request/runtime mount.

Verification: focused fileSystem service tests for those three cases, followed by the canonical final `pnpm verify`.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- The B1 data-integrity defect from the previous review is resolved: same-entry repository settlement now completes inside the existing fileSystem topology mutation turn, and deterministic tests prove queued remove/add operations cannot begin until flushed or non-flushed settlement completes.
- The M1 implementation defect from the previous review is resolved: committed `addDeviceDirectory()` provider replacement clears pending access requests together with the old runtime recovery identity after persistence succeeds.
- General directory loading/refresh state, external filesystem/rclone observation, persistent mounted-record IDs, VFS route identity, repository generations/retirement, hierarchical or cross-runtime locking, and generic cross-runtime mounted-record synchronization remain outside PR #211.
- `.env.example`, `.gitconfig`, and `.gitmodules` are not part of the current PR changed-file set; any local workspace artifacts reported by the coding agent are not present on the reviewed GitHub head.

## Unresolved questions

None.
