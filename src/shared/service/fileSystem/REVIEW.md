# Review

Verdict: blocked

## Scope reviewed

- File-system-owned local-directory recovery identity, confirmed relocation, duplicate-mount handling, and same-runtime mounted-directory topology mutations for PR #211.

## Blockers

### B1 — mounted-directory topology mutations are not serialized

Owner: `src/shared/service/fileSystem`

Problem: `relocateRememberedDeviceDirectory()` performs asynchronous marker inspection, recovery validation, and duplicate-handle detection while `addDeviceDirectory()`, `removeDeviceDirectory()`, same-entry reconnect commit, and relocation can independently change the same mounted-directory topology. The current implementation therefore cannot guarantee that its final `alreadyMounted` versus unique-relocation decision reflects the current same-runtime topology.

Evidence:

- [File-system service](useFileSystemService.ts) — `matchedOtherRecord` is derived from the initial persisted-record snapshot and reused after later asynchronous marker and recovery checks; service-owned add/remove/reconnect/relocation mutations are not serialized with this preflight/commit sequence.
- [File-system service tests](useFileSystemService.test.ts) — current regressions cover invalid marker and stale initiating recovery target, but not a duplicate disappearing/replacement or a previously unique candidate becoming mounted during relocation preflight.

Basis:

- [Local-directory recovery handoff](../../../../docs/local-directory-access-recovery.md) — same-runtime mounted-directory topology mutations must use one fileSystem-local async mutation queue; confirmed relocation must run marker revalidation, current recovery validation, duplicate detection, and commit within one serialized mutation turn.
- [Service rules](../AGENTS.md) — services own lifecycle/canonical storage state and mutation contracts must be deterministic about invalidation and missing/current data behavior.

Risk: a removed/replaced duplicate can still produce stale `alreadyMounted` navigation, or a candidate mounted concurrently by another service-owned mutation can be persisted again as a duplicate mount.

Required final state: serialize service-owned mounted-directory topology mutations within the current fileSystem service instance through one runtime-only async queue. User picker/confirmation remains outside the queue. Confirmed relocation enters the queue only after confirmation and performs marker revalidation, current recovery validation, duplicate detection, and persistence/runtime commit within that mutation turn. Add/remove and the topology-changing same-entry reconnect commit use the same queue. The queue releases after success and failure; write-recovery settlement does not hold it after reconnect has committed.

Verification: focused service tests prove both orderings: (1) a queued remove/replace that runs before relocation is observed by relocation and cannot yield a stale `alreadyMounted`; (2) a queued add of the candidate that runs before relocation causes current `alreadyMounted` rather than duplicate persistence. Also prove that topology mutations do not interleave with a relocation turn, queue failure does not block later mutations, and existing reconnect/settlement/relocation behavior remains unchanged.

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
