# Review

Verdict: blocked

## Scope reviewed

- Cross-service portion of PR #211: file-system persisted/runtime mount transition, repository lifecycle, worker/service contracts, and deterministic multi-service proof.

## Blockers

### B1 — Locator-different recovery has crossed service ownership because it live-rebinds the existing VFS path

Owner: `src/shared/service`

Problem: the current design treats a user-confirmed locator-different folder as a replacement backing store for the same live VFS path. That forces fileSystem to own repository-specific states and callbacks (`ConfirmedReplacementLeaseProvider`, `repositoryStateActive`, `confirmedReplacementLeaseUnavailable`), forces repositories to understand a file-system/user-confirmed replacement scenario, and adds worker-surface filtering solely to hide that internal coupling. The lease only gates Repo creation; a repository operation started before/during replacement is deliberately resumed after release against the new physical storage, so old operation intent crosses the storage-identity boundary.

Evidence:

- [File-system service](fileSystem/useFileSystemService.ts) — fileSystem defines/registers a confirmed-replacement repository lease and holds it around persistence + provider remount.
- [File-system public contracts](fileSystem/fileSystemContracts.ts) — a file-system replacement result exposes `repositoryStateActive` and prescribes a reload/retry user workflow.
- [File-system invariant error](fileSystem/fileSystemServiceErrorCode.ts) — fileSystem has a repository-lease availability invariant solely for this flow.
- [Repositories service](repositories/repositoriesService.ts) — generic Repo lookup/cache creation contains `confirmed-replacement` reservation behavior and waits before retrying against the post-release mount.
- [Worker setup](setupMainService.ts) — a new negative projection exists to hide lifecycle registration APIs introduced by this cross-service design.
- [Cross-service proof](fileSystemRepositoriesReplacement.integration.test.ts) — repository access started while replacement is active is expected to resume against the new physical mount after lease release.
- [Existing file-system behavior](fileSystem/useFileSystemService.ts) — `addDeviceDirectory()` already treats mounted name/path as replaceable presentation state and can move a proven-same handle to a new mounted name; the old mounted name is not a persistent domain identity that justifies rebinding different physical storage beneath it.

Basis:

- [Root architecture rules](../../../AGENTS.md) — keep behavior with the owner, prefer the minimum complete design, and return to architecture after repeated ownership drift/workaround growth.
- [Service rules](AGENTS.md) — services expose infrastructural capabilities with narrow contracts; do not spread mixed responsibilities or wrapper infrastructure without a required invariant.
- [File-system service rules](fileSystem/AGENTS.md) — fileSystem owns persisted handles, providers, VFS mounts and access recovery; Automerge pending/cache state remains repository ownership.
- [Architecture handoff workflow](../../../.agents/skills/architect-handoff/SKILL.md) — repeated rounds adding protocols/conditions or showing mixed responsibilities require stopping patches and simplifying the architecture.
- [CRDT/storage workflow](../../../.agents/skills/crdt-storage/SKILL.md) — provider/runtime ownership and repository/cache lifecycle must remain explicit and separate.

Risk: the current solution couples two service owners around one feature scenario, keeps adding synchronization protocol, and still cannot establish that every path-keyed operation belongs to the post-replacement storage generation. A stale operation can continue after the physical storage behind the same path changes.

Required final state: `isSameEntry() === true` may remain a live reconnect under the existing mounted path because physical identity is proven. When identity is false/unverifiable and the user explicitly accepts the candidate, fileSystem must recover it under a **different mounted VFS identity/path**, never replace the backing store under the old live path. Persist the record transition atomically, unmount the unavailable old path, and mount the selected handle under a unique new mounted name/path; if the selected physical directory is already represented by another persisted mount, return an expected already-mounted outcome with zero mutation. Repositories must not own or register any confirmed-replacement lease/reservation and must not contain local-directory relocation logic. Remove repository-specific replacement statuses/hooks/errors and the PR-specific lease worker-surface workaround. Same-entry reconnect may continue to invoke the existing generic registered write-recovery handlers after the proven-identical remount.

Verification: prove that locator-different recovery never exposes the selected storage at the old VFS path, that old path-keyed Repo/DocHandle operations cannot reach the recovered storage, that the persisted record moves to a unique new mount path, and that an already-mounted candidate performs zero mutation. Same-entry reconnect keeps deterministic queued-write settlement proof.

### B2 — Same-entry repository settlement proof is not deterministic or effect-based

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

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Do not expand this PR into a general cleanup of every pre-existing file-system worker-client capability. Once the lease design is removed, remove its PR-specific worker projection machinery unless another current requirement independently needs it.

## Unresolved questions

None. The next step is architecture redesign, not another lease correction.
