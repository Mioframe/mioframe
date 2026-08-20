# Review

Verdict: blocked

## Scope reviewed

- File-system-owned local-directory recovery identity, confirmed relocation, duplicate-mount handling, same-runtime mounted-directory mutation serialization, and marker commit-time validation for PR #211.

## Blockers

### B1 — marker revalidation is not the final asynchronous relocation preflight

Owner: `src/shared/service/fileSystem`

Problem: the new mutation queue correctly stabilizes same-runtime mounted-directory topology, but `relocateRememberedDeviceDirectory()` inspects the Mioframe marker before the asynchronous duplicate-handle scan. The candidate marker can therefore disappear while `findRecordByHandle()` is pending, after the last marker inspection but before `alreadyMounted` or persistence is accepted.

Evidence:

- [File-system service](useFileSystemService.ts) — inside the serialized relocation turn, `inspectMioframeSpaceCandidate(handle)` runs before `findRecordByHandle(otherRecords, handle)`; no marker inspection occurs after that asynchronous duplicate scan before either `alreadyMounted` or `updateRecordList()`.
- [File-system service tests](useFileSystemService.test.ts) — queue regressions prove topology ordering and queue release, while marker regressions only cover a marker already invalid when relocation inspection runs; they do not cover the marker becoming invalid while duplicate detection is pending.

Basis:

- [Local-directory recovery handoff](../../../../docs/local-directory-access-recovery.md) — confirmed relocation owns commit-time canonical marker validation and must reject a candidate that no longer looks like a Mioframe space before a terminal relocation result or persistence.
- [Source ownership rules](../../../AGENTS.md) — canonical storage/protocol facts and their mutation invariants must be enforced at the service boundary.

Risk: a candidate that stops being a Mioframe space during the asynchronous duplicate scan can still yield `alreadyMounted` navigation or be persisted as a relocated remembered space, defeating the post-confirmation safety check.

Required final state: keep the existing fileSystem-local mutation queue. Within a confirmed relocation turn, complete topology-dependent asynchronous preflight (current target validation and duplicate-handle detection) before performing the final canonical marker inspection. Marker inspection must be the last external asynchronous validation before the terminal `alreadyMounted` decision or persistence starts. Invalid marker returns `invalidCandidate` with zero mutation. No additional queue, lock, persistent identity, or snapshot/recheck chain is required.

Verification: add focused service regression proof where duplicate detection is held pending, the marker becomes invalid, then duplicate detection resolves; relocation must return `invalidCandidate` with zero mutation and must not return `alreadyMounted` or persist. Preserve queue-ordering, valid `alreadyMounted`, unique relocation, stale/missing recovery, reconnect settlement, and recovery-key lifecycle tests.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- General directory loading/refresh state, external filesystem observation, persistent mounted-record IDs, VFS route identity, repository retirement/generations, hierarchical/cross-runtime locking, and generic cross-runtime mounted-record synchronization remain outside PR #211.

## Unresolved questions

None.
