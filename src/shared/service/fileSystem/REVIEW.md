# Review

Verdict: blocked

## Scope reviewed

- PR #211 local-directory recovery target identity, marker ownership, and commit-time safety.

## Blockers

### B1 — `spaceName` is not a safe recovery target identity

Owner: `src/shared/service/fileSystem`

Problem: unavailable-root recovery currently exposes only `spaceName`, and both reconnect service operations locate the remembered record again by that name. A mounted name can be removed and later reused by another runtime provider, so an in-flight picker/confirmation flow can apply to a different target with the same name.

Evidence:

- [Persisted records](setupFileSystemDirectoryHandleService.ts) store `name` as the mounted display name, not an immutable record identity.
- [File-system service](useFileSystemService.ts) resolves reconnect/relocation with `records.find(record => record.name === spaceName)`.
- [Device provider](../../lib/deviceFileSystemProvider/DeviceFileSystemProvider.ts) stores active mounted roots in a name-keyed map and replaces/removes them by name.

Basis:

- [Local-directory recovery handoff](../../../../docs/local-directory-access-recovery.md) requires the service to reject stale recovery targets before mutation.
- [Root architecture rules](../../../../AGENTS.md) require explicit ownership/source of truth and the minimum complete design for storage mutations.

Risk: confirmation initiated for one unavailable mounted provider can mutate another provider that later reuses the same mounted name.

Required final state: unavailable-root recovery carries an opaque fileSystem-owned runtime recovery key identifying the mounted local-directory provider instance that emitted the error. `spaceName` remains display/locator data only. Reconnect and relocation validate the same `{spaceName, recoveryKey}` immediately before mutation and return a zero-mutation stale outcome when it no longer identifies the current mounted provider.

Verification: deterministic service and feature tests replace/remove/recreate a provider under the same `spaceName` while picker/confirmation is pending and prove the old recovery key cannot mutate the replacement; equivalent re-emissions from the same provider key remain valid.

### B2 — Marker validation is owned by UI and is not revalidated at relocation commit

Owner: `src/shared/service/fileSystem`

Problem: `localDirectoryReconnect` currently imports Automerge marker inspection directly and decides whether a picked folder is a Mioframe space. This derives a storage fact in a feature. The marker is also checked before the confirmation pause but not again immediately before relocation.

Evidence:

- [Reconnect feature](../../../features/localDirectoryReconnect/useLocalDirectoryReconnectAction.ts) calls the shared Automerge marker inspector directly.
- [Mioframe space picker](../../../features/mioframeSpacePick/useOpenMioframeSpace.ts) and [create flow](../../../features/mioframeSpacePick/useCreateMioframeSpace.ts) also consume the PR-extracted shared marker inspector directly.
- [Source ownership rules](../../../AGENTS.md) prohibit UI/features from inferring storage facts by inspecting marker files and require service/entity APIs for those facts.

Basis:

- [Source ownership rules](../../../AGENTS.md) explicitly assign storage/protocol facts to service/worker ownership.
- [Local-directory recovery handoff](../../../../docs/local-directory-access-recovery.md) requires invalid candidates to remain zero-mutation through the confirmed relocation boundary.

Risk: storage protocol knowledge leaks into feature code, and a candidate can stop satisfying the Mioframe marker condition during the confirmation pause without being rejected before mutation.

Required final state: canonical marker inspection executes behind the fileSystem service boundary. UI/features consume only a typed inspection/reconnect result. Reconnect validates the marker before offering confirmation, and relocation revalidates it immediately before any persisted/runtime mutation. Missing marker is an expected zero-mutation result; unexpected inspection failures are privacy-safe `DomainError`s with raw cause preserved.

Verification: service tests prove marker-present/absent/error behavior and marker removal between confirmation-required and relocation; feature tests prove no direct marker parsing, expected invalid-candidate UX, and diagnostics only for unexpected failures.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- General directory loading/refresh state, stale-read serialization, external filesystem/rclone observation, and general cross-runtime persisted-record synchronization remain separate architecture work.
- Generic stale-Repo behavior for unrelated future reuse of the same textual VFS path remains outside PR #211.

## Unresolved questions

None.
