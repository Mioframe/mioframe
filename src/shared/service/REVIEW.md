# Review

Verdict: blocked

## Scope reviewed

- Complete PR #211 local-directory recovery path from provider detection through worker/service contracts, persisted/runtime mount state, repository lifecycle, entity/feature/widget composition, and required proof.

## Blockers

### B1 — Locator-different recovery has crossed service ownership because it live-rebinds the current runtime

Owner: `src/shared/service`

Problem: the current design treats a user-confirmed locator-different folder as a live VFS replacement in the current runtime. That forces fileSystem to own repository-specific states and callbacks (`ConfirmedReplacementLeaseProvider`, `repositoryStateActive`, `confirmedReplacementLeaseUnavailable`), forces repositories to understand a file-system/user-confirmed replacement scenario, and adds worker-surface filtering solely to hide that internal coupling. The lease only gates Repo creation; a repository operation started before/during replacement is deliberately resumed after release against the new physical storage, so the old operation intent can cross the storage-identity boundary.

Evidence:

- [File-system service](fileSystem/useFileSystemService.ts) — fileSystem defines/registers a confirmed-replacement repository lease and holds it around persistence + provider remount.
- [File-system public contracts](fileSystem/fileSystemContracts.ts) — a file-system replacement result exposes `repositoryStateActive` and prescribes a reload/retry user workflow.
- [File-system invariant error](fileSystem/fileSystemServiceErrorCode.ts) — fileSystem has a repository-lease availability invariant solely for this flow.
- [Repositories service](repositories/repositoriesService.ts) — generic Repo lookup/cache creation contains `confirmed-replacement` reservation behavior and waits before retrying against the post-release mount.
- [Worker setup](setupMainService.ts) — a new negative projection exists to hide the lifecycle registration APIs introduced/used by this cross-service design.
- [Cross-service proof](fileSystemRepositoriesReplacement.integration.test.ts) — a repository operation started while replacement is active is expected to resume against the new physical mount after lease release.

Basis:

- [Root architecture rules](../../../AGENTS.md) — keep behavior with the owner, prefer the minimum complete design, and return to architecture after repeated ownership drift/workaround growth.
- [Service rules](AGENTS.md) — services expose infrastructural capabilities with narrow contracts; do not spread mixed responsibilities or wrapper infrastructure without a required invariant.
- [File-system service rules](fileSystem/AGENTS.md) — fileSystem owns persisted handles, providers, VFS mounts and access recovery; Automerge pending/cache state remains repository ownership.
- [Architecture handoff workflow](../../../.agents/skills/architect-handoff/SKILL.md) — repeated rounds adding protocols/conditions or showing mixed responsibilities require stopping patches and simplifying the architecture.
- [CRDT/storage workflow](../../../.agents/skills/crdt-storage/SKILL.md) — provider/runtime ownership and repository/cache lifecycle must remain explicit and separate.

Risk: the current solution couples two service owners around one feature scenario, keeps adding synchronization protocol, and still cannot establish that every path-keyed operation belongs to the post-replacement storage generation. A stale operation may continue after the physical storage behind the same VFS path changes.

Required final state: redo the handoff around the simpler boundary: `isSameEntry() === true` may remain a live reconnect because physical identity is proven; locator-different/unverifiable user-confirmed replacement must not live-remount a different physical directory into the current runtime. Persist the selected replacement as the next-runtime location and require a clean restart/reload boundary before it becomes the active provider. fileSystem owns that persisted-vs-runtime transition; repositories must not own or register a confirmed-replacement lease. Remove repository-specific replacement statuses/hooks/errors from the file-system contract and remove lease/reservation logic from repositories. Same-entry reconnect may continue to invoke the existing generic registered write-recovery handlers after the proven-identical remount.

Verification: the revised handoff must prove that locator-different replacement changes persisted location without exposing the new physical storage to current-runtime Repo/DocHandle/path operations, and that a fresh service/runtime hydrates the replacement normally. Same-entry reconnect keeps deterministic queued-write settlement proof.

### B2 — Confirmed replacement can persist one physical directory under two mounted names

Owner: `src/shared/service/fileSystem`

Problem: `addDeviceDirectory()` already enforces the persisted-handle uniqueness invariant by finding an existing `isSameEntry()` record and reusing/replacing it. `replaceRememberedDeviceDirectory()` does not check the selected handle against other persisted records before replacing the target record. Selecting a Mioframe directory already connected under another mounted name can therefore persist two records for the same physical directory.

Evidence:

- [File-system service](fileSystem/useFileSystemService.ts) — `addDeviceDirectory()` calls `findRecordByHandle()` while `replaceRememberedDeviceDirectory()` only finds the target by `spaceName` and writes the selected handle into that record.
- [File-system service tests](fileSystem/useFileSystemService.test.ts) — existing add-directory proof explicitly verifies that the same handle is reused instead of duplicated; replacement proof contains no already-mounted-candidate scenario.

Basis:

- [File-system service rules](fileSystem/AGENTS.md) — persisted handles, provider registration and mount lifecycle are fileSystem-owned invariants.
- [Root architecture rules](../../../AGENTS.md) — one source of truth and complete storage lifecycle behavior must be preserved; fixes must not introduce conflicting ownership/state.
- [CRDT/storage workflow](../../../.agents/skills/crdt-storage/SKILL.md) — storage/provider state and cache lifecycle are data-safety state.

Risk: two VFS paths can point at the same Automerge storage. They can then acquire independent repository instances/caches and write the same physical files through different logical mounts. The current replacement lease only protects the target path and does not protect an already-mounted sibling path.

Required final state: the revised replacement contract must preserve the existing one-physical-directory/one-persisted-mount invariant. A candidate already represented by another mounted record is an expected rejection with zero mutation; do not silently merge, rename, disconnect, or alias the other mount.

Verification: add focused service proof for an already-mounted selected handle and confirm persisted records/runtime mounts remain unchanged.

### B3 — Same-entry repository settlement proof is not deterministic or effect-based

Owner: `src/shared/service`

Problem: the new cross-service integration test uses fixed `20 ms`/`250 ms` waits as lifecycle synchronization. In the same-entry success case it asserts the reconnect status but does not assert that the deliberately queued write actually reached storage through the rebound handle.

Evidence:

- [Cross-service integration proof](fileSystemRepositoriesReplacement.integration.test.ts) — fixed `wait()` calls are used to infer Automerge-save and replacement state; the success case has no direct assertion on the queued write's post-remount storage effect.

Basis:

- [Testing architecture](../../../docs/testing/architecture.md) — deterministic multi-module outcomes use direct observable boundaries; arbitrary sleeps are not valid proof and failures must remain visible.
- [Local directory recovery handoff](../../../docs/local-directory-access-recovery.md) — same-entry reconnect requires proof that queued writes are settled after provider remount.
- [Project review workflow](../../../.agents/skills/project-review/SKILL.md) — missing/non-faithful mandatory proof is a blocker.

Risk: scheduler timing can determine test success, and a regression that reports `flushed` without actually persisting the queued change can remain green.

Required final state: keep only the cross-service proof still required by the revised architecture and make it deterministic. For same-entry reconnect, use explicit test-controlled barriers/events and assert a direct post-remount storage effect for the queued write, not only the returned status.

Verification: the test must fail if the real repository recovery handler is not registered/invoked or if the queued write does not reach the rebound same-entry storage.

### B4 — Final real Chrome/PWA recovery proof is missing

Owner: `src/features/localDirectoryRecovery`

Problem: the browser behavior that motivated this PR cannot be proven by mocked `FileSystemDirectoryHandle` fixtures. The final implementation has not yet passed the required real Chrome/PWA scenarios.

Evidence:

- [Local directory recovery handoff](../../../docs/local-directory-access-recovery.md) — real Chrome/PWA operator proof is a merge gate.

Basis:

- [Project review workflow](../../../.agents/skills/project-review/SKILL.md) — required but missing proof blocks acceptance.

Risk: the final recovery semantics may still differ from real persisted-handle/picker behavior.

Required final state: after the architecture and implementation are stable, run the revised real-browser matrix including revoked permission, granted-but-unavailable root, cancellation, proven same-entry recovery, locator-different confirmed recovery across the clean-runtime boundary, invalid candidate, and already-mounted candidate.

Verification: operator proof on the final implementation/head.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Do not expand this PR into a general cleanup of every pre-existing file-system worker-client capability. If the revised architecture no longer needs the new lease-registration hiding workaround, remove that PR-specific machinery rather than broadening this bug fix into a service-API redesign.

## Unresolved questions

None. The next step is architecture redesign, not another lease correction.
