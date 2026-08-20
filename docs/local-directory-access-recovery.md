# Local directory access recovery — architecture handoff

This document is the implementation contract for PR #211.

## Goal

Recover a remembered local-directory root that can no longer be opened without changing the general directory/reactivity architecture, applying a confirmation to the wrong mounted provider, or exposing an unverifiable replacement through the old live path.

## Confirmed current behavior and evidence

- `directoryContent$` already surfaces directory read failures and re-reads after VFS/provider events; its broader loading/refresh model is separate work.
- Persisted local-directory records are `{ name, handle }`; `name` is a mounted display/path locator, not immutable identity.
- `DeviceFileSystemProvider` keys active mounted roots by name, so a removed name can later identify a different provider.
- Current reconnect/relocation re-find a record by `spaceName`, which is insufficient across picker/confirmation pauses.
- Current PR moved canonical Automerge marker inspection into `shared`, but features call it directly; `src/AGENTS.md` requires storage/marker facts to be service-owned.
- Locator-different relocation already allocates a new name while the old name is still occupied, persists first, then removes the old runtime mount and mounts the selected folder only at the new path.

## Non-goals

- redesigning `directoryContent$`, loading/refreshing state, external rclone observation, or Repository Explorer query composition;
- VFS route identity/binding, `StaleIdentity`, hierarchical locking, provider cancellation, repository retirement, Repo generations, or document lifecycle changes;
- persistent UUID/schema migration for mounted-directory records;
- general cross-runtime synchronization of the IndexedDB mounted-directory list;
- fixing unrelated future reuse of a textual VFS path by a cached Repo;
- marker-format changes, Google Drive/OPFS changes, or shared UI changes.

## Affected user scenarios

1. Missing/revoked permission -> existing `Permission required` recovery.
2. Permission granted but remembered root enumeration fails -> `Folder unavailable` + `Reconnect folder`.
3. Picker/confirmation cancel -> zero mutation.
4. Same mounted provider emits equivalent unavailable-root errors -> one logical recovery target.
5. Provider is removed/replaced, including reuse of the same `spaceName`, while picker/confirmation is pending -> old action becomes stale and cannot mutate the replacement.
6. `isSameEntry() === true` -> persist/remount under the same mounted name/path, clear stale requests, settle existing cached repository writes.
7. Same-entry settlement failure -> reconnect stays committed; return warning status and show Snackbar.
8. False/missing/throwing `isSameEntry()` + missing Mioframe marker -> expected invalid candidate, zero mutation.
9. False/unverifiable identity + valid marker -> explicit confirmation.
10. Marker disappears during confirmation -> relocation rejects with zero mutation.
11. Confirmed candidate already mounted elsewhere -> zero mutation; return/open that existing mount.
12. Confirmed unique candidate -> replace the remembered record with a new unique mounted name/path; selected storage is never reachable through the old path.

## Boundaries and ownership

- `webFileSystemProvider`: permission vs unavailable-root classification; transfer-safe unavailable-root payload.
- `fileSystem` service: mounted-provider recovery identity, persisted records, canonical marker inspection orchestration, same-entry reconnect, relocation, stale-target validation, mount/request lifecycle.
- `automergeAdapter`: low-level canonical marker-file inspection algorithm only; no UI ownership.
- `mountedDirectories` entity: typed facade for service inspection/reconnect actions.
- `localDirectoryReconnect` feature: picker, confirmation, action-local pending/feedback state, Snackbar; no marker parsing or storage identity inference.
- `mioframeSpacePick` feature: consumes service/entity marker inspection instead of reading the marker directly.
- `repositories`: existing Repo cache semantics plus generic write-recovery settlement only.
- `RepositoryExplorerWidget`: branch rendering and post-action navigation applicability.

## Source of truth and state shape

- `spaceName` is a safe mounted display/path locator only.
- Unavailable-root recovery carries `{ spaceName, recoveryKey }`.
- `recoveryKey` is an opaque, transfer-safe, runtime-only key owned by the fileSystem service for the specific mounted local-directory provider instance that emitted the recovery error.
- The key is not persisted, not shown in ordinary directory listings, and not a physical-directory identity.
- Equivalent errors from the same mounted provider reuse the same key. Provider removal/replacement creates or exposes a different current key, even when the mounted name is reused.
- Feature-local target state is keyed by `recoveryKey`; `spaceName` is used only for copy/path arguments.

## Public API / entry points

- unavailable-root transport/parser exposes `{ spaceName, recoveryKey }`.
- `reconnectDeviceDirectory({ handle, spaceName, recoveryKey })` returns one of:
  - `reconnected`;
  - `reconnectedWithWriteRecoveryFailure`;
  - `confirmationRequired`;
  - `invalidCandidate`;
  - `staleRecovery`;
  - `missingRecord`.
- `relocateRememberedDeviceDirectory({ handle, spaceName, recoveryKey })` returns one of:
  - `relocated`;
  - `alreadyMounted`;
  - `invalidCandidate`;
  - `staleRecovery`;
  - `missingRecord`.
- fileSystem exposes a typed Mioframe-space inspection action for existing picker flows; UI does not import marker-file logic directly.

## Minimum sufficient design

- Keep the existing directory query/state flow unchanged.
- When a mounted local-directory provider is created, fileSystem assigns it an opaque runtime recovery key and uses that same key for unavailable-root errors from that provider. Removal/replacement invalidates/replaces the current key for that mounted name.
- Feature validity checks compare `recoveryKey`, not Error object identity or `spaceName`. Same-key re-emissions preserve target-local feedback; a missing/different key aborts unfinished work.
- Service validates the supplied `{ spaceName, recoveryKey }` before reconnect work and again immediately before any persisted/runtime mutation. A stale pair returns `staleRecovery` with zero mutation.
- `reconnectDeviceDirectory` owns the first canonical marker inspection when `isSameEntry()` is false/unavailable: missing marker returns `invalidCandidate`; valid marker returns `confirmationRequired`.
- After confirmation, `relocateRememberedDeviceDirectory` revalidates both the recovery target and the canonical marker after all asynchronous preflight and before persistence. Marker removal returns `invalidCandidate` with zero mutation.
- Unexpected marker-inspection failures are wrapped at the fileSystem boundary in a privacy-safe `DomainError` with a service-local stable code and raw cause. Features may report an already-safe `DomainError`; they must not expose raw browser messages.
- After a mutating service result is returned (`reconnected`, `reconnectedWithWriteRecoveryFailure`, `relocated`), that committed result is authoritative even if recovery disappears because of the mutation. Non-mutating results apply target-local feedback only while the initiating `recoveryKey` is still current.
- Same-entry reconnect persists first, remounts the proven-identical handle at the same path, clears stale requests, then runs registered write-recovery settlement. Failed settlement, including rejecting `repo.flush()`, is a non-flushed result; no rollback.
- Locator-different relocation keeps the old name occupied while allocating the new name, persists the replacement first, then removes the old runtime mount and mounts the selected handle only under the new path.
- Repository cache/lifecycle stays at the pre-PR model; no retirement/no-op gate or VFS DELETE/RENAME retirement.

## Rejected approaches

- `spaceName` as recovery identity: names are reusable locators.
- Error/recovery object identity: reactive rereads create new objects for the same provider.
- Confirmation token created only after the first service call: it does not protect the picker gap before that call.
- Persistent mounted-record UUID/schema migration: stronger than required; runtime provider identity is sufficient for this user action.
- Marker validation in feature/UI: violates storage ownership and leaves commit-time revalidation outside the service.
- Marker as physical-directory identity: it proves only that the candidate looks like a Mioframe space.
- VFS route binding, Repo generation/lease/tombstone, or hierarchical locking: unrelated to this recovery target contract.

## Confirmation copy

- headline: `Reconnect this Mioframe space?`
- supporting text: `Mioframe can't verify that this is the same folder it remembers. Continue only if you recognize the selected Mioframe space. Mioframe will reconnect the selected space without transferring unsaved in-memory changes from the unavailable location.`
- confirm: `Reconnect`
- cancel: `Cancel`

## Acceptance matrix / required proof

- Provider/transport: same provider -> stable `recoveryKey`; replacement provider, including same-name replacement -> different/stale key; serialization never exposes handles/raw paths.
- File-system service: stale key before same-entry reconnect -> zero mutation; stale key before relocation -> zero mutation; same-entry behavior/settlement unchanged.
- Marker ownership: service inspection reports marker present/absent; unexpected inspection failure is a safe `DomainError`; no reconnect/picker feature imports marker-file logic.
- Confirmation boundary: valid marker -> confirmation required; marker removed before confirmed relocation -> `invalidCandidate`, zero mutation.
- Relocation: duplicate physical mount -> `alreadyMounted`, zero mutation; unique candidate persists first and is reachable only under the new path.
- Feature: identity/lifetime checks use `recoveryKey`; same key re-emission continues and preserves feedback; same `spaceName` with a new key aborts; non-mutating stale/invalid results cannot overwrite a newer target; committed results/Snackbar remain authoritative.
- Existing Mioframe space open/create flows preserve behavior while consuming service/entity marker inspection.
- Widget: navigate only if initiating `directoryPath` is still current.
- Final real Chrome/PWA proof: permission loss, granted-unavailable root, cancel, same-entry, locator-different confirmation/relocation, invalid marker, already-mounted candidate, navigation, settlement warning, and same-name stale-action safety where practically reproducible.

## Risks

- Runtime recovery keys intentionally do not solve general multi-window/worker synchronization of the persisted record list; that is a pre-existing broader storage-lifecycle concern.
- The key is action identity only, not proof that two filesystem handles are physically identical; `isSameEntry() === true` remains the only in-place physical-identity proof.

## Required verification

- implementation preflight;
- focused verifier-managed service/feature tests during implementation as useful;
- final coding-agent `pnpm verify`;
- complete PR `project-review` after correction;
- exact-head GitHub CI;
- final real Chrome/PWA operator proof.

## Forbidden

- using `spaceName` as the sole reconnect target identity;
- persistent IDs/schema migration for this correction;
- exposing `recoveryKey` in ordinary mounted-directory display data or diagnostics;
- feature/widget marker-file inspection or direct storage-protocol inference;
- mutating relocation without marker revalidation after the confirmation pause;
- VFS route-binding/identity infrastructure, repository retirement, fileSystem -> repositories lease/guard, same-path locator-different replacement, or directory-reactivity redesign.

## Implementation readiness

- Product behavior: resolved.
- Dependency on directory-state redesign: none.
- Recovery target identity: resolved as fileSystem-owned runtime `recoveryKey`.
- Marker ownership/commit-time validation: resolved at fileSystem service.
- Unresolved architecture blockers: none.
- Verdict: **ready**.
