# Local directory access recovery — architecture handoff

This document is the implementation contract for PR #211.

## Goal

Recover a remembered local-directory root that can no longer be opened, without changing the general directory/reactivity architecture and without ever mounting an unverifiable replacement under the old live path.

## Confirmed current behavior

- `directoryContent$` already surfaces directory read failures as values and re-reads after VFS/provider events.
- `WebFileSystemProvider` distinguishes missing permission from a granted-but-unreadable selected root.
- Directory loading/refresh state is incomplete and external filesystem changes are not generally observed; that is a separate architecture problem, not required for reconnect correctness.
- `Repo` is a document-storage tool/cache, not the source of truth for whether a directory is loading/available.
- Locator-different relocation already allocates a name different from the old remembered name, persists first, removes the old runtime mount, then mounts the selected folder only under the new path.

## Non-goals

- redesigning `directoryContent$`, loading/refreshing state, external rclone observation, or Repository Explorer query composition;
- VFS route identity/binding, `StaleIdentity`, hierarchical locking, provider cancellation, or repository retirement infrastructure;
- fixing the pre-existing generic case where an unrelated future mount reuses a path while an old cached Repo still exists;
- persistent storage IDs/schema changes, marker-format changes, Google Drive/OPFS changes, or shared UI changes.

## Affected scenarios

1. Missing/revoked permission -> existing `Permission required` recovery.
2. Permission granted but remembered root enumeration fails -> `Folder unavailable` + `Reconnect folder`.
3. Picker/confirmation cancel -> zero mutation.
4. `isSameEntry() === true` -> persist/remount under the same mounted name/path, clear stale requests, settle existing cached repository writes.
5. Same-entry settlement failure -> reconnect stays committed; return warning status and show Snackbar.
6. False/missing/throwing `isSameEntry()` -> zero mutation; validate the selected folder with the canonical Automerge marker and explicit confirmation.
7. Confirmed candidate already mounted elsewhere -> zero mutation; return/open that existing mount.
8. Confirmed unique candidate -> replace the remembered record with a new unique mounted name/path; selected storage is never reachable through the old path.

## Ownership / source of truth

- `webFileSystemProvider`: permission vs unavailable-root classification.
- `fileSystem` service: persisted handle records, same-entry reconnect, relocation, mount/request lifecycle.
- `automergeAdapter`: canonical Mioframe/Automerge marker inspection.
- `repositories`: existing Repo cache semantics plus generic write-recovery settlement only.
- `localDirectoryReconnect` feature: picker, marker validation, confirmation, pending/result/error state, Snackbar.
- `RepositoryExplorerWidget`: branch rendering and post-action navigation applicability.
- Recovery identity is the transfer-safe `{ spaceName }` key, not JavaScript object identity of an emitted Error/recovery object.

## Minimum sufficient design

- Keep the existing directory query/state flow unchanged in this PR.
- On root enumeration failure, provider re-checks read permission once; non-granted uses permission recovery, still-granted emits unavailable-root recovery.
- Feature may abort before a mutating call only when the current unavailable-root target no longer has the same `spaceName`; a semantically identical re-emitted Error must not cancel the action.
- After a service mutation returns an explicit result, that committed result is authoritative even if the recovery error disappears because of the mutation.
- Same-entry reconnect persists first, remounts the proven-identical handle at the same path, clears stale requests, then runs registered write-recovery settlement. `repo.flush()` storage failure is represented as a non-flushed result; no rollback.
- Locator-different fallback performs marker validation + confirmation, then relocation. The old name remains occupied while allocating the new name, so the new mounted path always differs from the old one. Persistence succeeds before runtime mount mutation.
- Restore repository cache/lifecycle behavior to the pre-PR model; remove the repository retirement/no-op gate and VFS DELETE/RENAME retirement logic. They are not required by this recovery flow.

Confirmation copy remains the current concise contract:

- headline: `Reconnect this Mioframe space?`
- supporting text: `Mioframe can't verify that this is the same folder it remembers. Continue only if you recognize the selected Mioframe space. Mioframe will reconnect the selected space without transferring unsaved in-memory changes from the unavailable location.`
- confirm: `Reconnect`
- cancel: `Cancel`

## Acceptance / required proof

- Provider tests: permission-required vs granted-unavailable root.
- File-system service tests: same-entry in-place reconnect; false/unverifiable zero mutation; unique relocation persists first and selected storage is reachable only at the new path; duplicate physical mount returns `alreadyMounted` with zero mutation.
- Repository tests/integration: same-entry queued writes settle through the rebound handle; failed settlement including rejecting `repo.flush()` returns `reconnectedWithWriteRecoveryFailure` without rollback.
- Feature tests: stale-target checks compare `spaceName`, committed results survive recovery disappearance, marker/cancel/error paths are non-mutating, Snackbar warning is emitted.
- Widget test: navigation occurs only if the initiating `directoryPath` is still current.
- Final real Chrome/PWA proof remains required for permission loss, granted-unavailable remembered root, same-entry reconnect, locator-different relocation, cancel, invalid marker, already-mounted candidate, and settlement warning.

## Deferred directory-reactivity work

The separate redesign should address serialized/coalesced directory refresh, explicit initial-loading vs refreshing state, stale-read races, external storage invalidation/revalidation, and simplifying repository/UI projections. PR #211 must not create a temporary parallel state/lifecycle model in anticipation of that work.

## Forbidden

- VFS route-binding/identity infrastructure or repository retirement for this PR;
- fileSystem -> repositories invalidation/lease/guard;
- same-path locator-different replacement;
- marker as physical-identity proof;
- relying on Error/recovery object reference equality for action validity;
- expanding #211 into directory loading/external-watch redesign.

## Implementation readiness

- Product behavior: resolved.
- Dependency on directory-state redesign: none.
- Ownership/source of truth/public contracts: resolved.
- Unresolved architecture blockers: none.
- Verdict: **ready**.
