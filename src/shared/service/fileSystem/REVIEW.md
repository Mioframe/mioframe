# Review

Verdict: blocked

## Scope reviewed

- File-system-owned local-directory recovery identity, confirmed relocation, duplicate-mount handling, and recovery-key lifecycle for PR #211 after the latest correction.

## Blockers

### B1 — duplicate-mount result is derived from a stale preflight snapshot

Owner: `src/shared/service/fileSystem`

Problem: `relocateRememberedDeviceDirectory()` now revalidates the marker and initiating recovery target before returning `alreadyMounted`, but `matchedOtherRecord` is still computed from the initial `records` snapshot before those asynchronous checks and then reused afterwards. The duplicate decision itself is therefore not based on current mounted-directory state.

Evidence:

- [File-system service](useFileSystemService.ts) — `otherRecords` / `matchedOtherRecord` are derived before `inspectMioframeSpaceCandidate()` and the later `getRecordList()` recheck; the old `matchedOtherRecord` is returned after those awaits.
- [File-system service tests](useFileSystemService.test.ts) — current regressions cover invalid marker and stale initiating target, but do not cover the duplicate mount disappearing/replacement or a previously unique candidate becoming mounted while relocation preflight is pending.

Basis:

- [Local-directory recovery handoff](../../../../docs/local-directory-access-recovery.md) — a confirmed candidate already mounted elsewhere must return/open that existing mount, while a confirmed unique candidate may be relocated; confirmed relocation must make terminal decisions only after asynchronous preflight and current recovery validation.
- [Service rules](../AGENTS.md) — service mutation contracts must be deterministic about parameters, lifecycle, invalidation, and current canonical storage state.

Risk: if the initially matched mount is removed/replaced during marker/recovery revalidation, the service can return `alreadyMounted` with a stale name; if no duplicate existed initially but the candidate becomes mounted during the same interval, relocation can persist a second mount for the same physical directory. Both violate the required duplicate/unique relocation scenarios.

Required final state: the `alreadyMounted` versus unique-relocation decision must be derived from current service-owned mounted-directory state after the confirmation pause and required marker validation. No duplicate result may be carried across asynchronous preflight without proving that the matched mounted provider is still current, and a candidate that becomes mounted before persistence must not be duplicated. Keep the solution local to the existing fileSystem recovery/provider state; do not introduce persistent IDs, repository lifecycle, or general locking infrastructure.

Verification: focused service tests must cover (1) a duplicate mount that is removed/replaced while relocation preflight is pending and must not yield a stale `alreadyMounted`, and (2) a candidate that becomes mounted while relocation preflight is pending and must not be persisted as another mount. Preserve valid `alreadyMounted`, invalid marker, stale recovery, and unique relocation behavior.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- General directory loading/refresh state, external filesystem observation, persistent mounted-record IDs, VFS route identity, repository retirement/generations, general locking, and generic cross-runtime mounted-record synchronization remain outside PR #211.

## Unresolved questions

None.
