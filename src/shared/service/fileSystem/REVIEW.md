# Review

Verdict: blocked

## Scope reviewed

- File-system-owned local-directory recovery identity and confirmed relocation behavior for PR #211 after synchronizing with current `develop`.

## Blockers

### B1 — `alreadyMounted` bypasses required post-confirmation revalidation

Owner: `src/shared/service/fileSystem`

Problem: `relocateRememberedDeviceDirectory()` returns `alreadyMounted` immediately after the asynchronous duplicate-handle lookup, before revalidating the canonical Mioframe marker and the initiating recovery target after the confirmation pause.

Evidence:

- [File-system service](useFileSystemService.ts) — `relocateRememberedDeviceDirectory()` returns `alreadyMounted` before `inspectMioframeSpaceCandidate()` and before the final persisted-record / `recoveryKey` recheck.
- [File-system service tests](useFileSystemService.test.ts) — the duplicate-mount test explicitly asserts that marker inspection is not called on the `alreadyMounted` path.

Basis:

- [Local-directory recovery handoff](../../../../docs/local-directory-access-recovery.md) — after confirmation, relocation must revalidate both the recovery target and canonical marker after all asynchronous preflight; marker removal must return `invalidCandidate` with zero mutation.
- [Source ownership rules](../../../AGENTS.md) — storage/protocol facts and lifecycle invariants must be enforced by the service owner rather than compensated for in a feature.

Risk: while confirmation or duplicate detection is pending, the candidate can cease to be a valid Mioframe space or the initiating provider can become stale, yet the service may still return an existing mount as applicable and allow downstream navigation for an invalid action.

Required final state: every confirmed relocation terminal result, including `alreadyMounted`, is produced only after the post-confirmation canonical marker and current recovery target have been revalidated after asynchronous preflight. Invalid marker or stale/missing target remains zero mutation and cannot produce `alreadyMounted`.

Verification: focused service regression tests cover an already-mounted candidate whose marker becomes invalid and an already-mounted path whose recovery target becomes stale during asynchronous work; both must remain zero mutation and must not return `alreadyMounted`. Existing valid duplicate-mount behavior must remain unchanged.

## Major issues

### M1 — provider rename leaves stale runtime recovery identity behind

Owner: `src/shared/service/fileSystem`

Problem: `addDeviceDirectory()` removes the old runtime provider when the same physical directory is remounted under a different name, but does not remove the old name from `recoveryKeysByName`.

Evidence:

- [File-system service](useFileSystemService.ts) — the `existingRecord.name !== nextRecord.name` branch calls `deviceFileSystemProvider.removeRecord(existingRecord.name)` without the matching recovery-key cleanup used by relocation and disconnect paths.

Basis:

- [Local-directory recovery handoff](../../../../docs/local-directory-access-recovery.md) — `recoveryKey` belongs to a mounted local-directory provider instance; provider removal/replacement must invalidate/replace the current key for that mounted name.
- [Service rules](../AGENTS.md) — service contracts own lifecycle and must remain deterministic about mutation/invalidation behavior.

Risk: removed provider instances leave ghost runtime identity entries for the service lifetime, violating the recovery-key lifecycle invariant and allowing stale internal state to accumulate across provider renames.

Required final state: removal or replacement of a mounted local-directory provider invalidates its old recovery key on every service-owned lifecycle path, including the rename path in `addDeviceDirectory()`, without introducing persistent IDs or a broader lifecycle subsystem.

Verification: add the narrowest faithful regression proof for rename/removal lifecycle behavior without exposing recovery-key internals as a new public API; run the service-focused verifier scope and the final canonical `pnpm verify`.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- General directory loading/refresh state, external filesystem observation, persistent mounted-record IDs, VFS route identity, repository retirement/generations, and generic cross-runtime mounted-record synchronization remain outside PR #211.

## Unresolved questions

None.
