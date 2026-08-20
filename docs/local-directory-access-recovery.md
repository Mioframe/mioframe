# Local directory access recovery — architecture handoff

This document is the implementation contract for PR #211.

## Goal

Recover a remembered local-directory root that can no longer be opened without changing the general directory/reactivity architecture, applying a confirmation to the wrong mounted provider, exposing an unverifiable replacement through the old live path, settling cached writes against a different provider that later reuses the same mounted path, or letting a removed provider publish actionable permission recovery after replacement.

## Confirmed current behavior and evidence

- `directoryContent$` already surfaces directory read failures and re-reads after VFS/provider events; its broader loading/refresh model is separate work.
- Persisted local-directory records are `{ name, handle }`; `name` is a mounted display/path locator, not immutable identity.
- `DeviceFileSystemProvider` keys active mounted roots by name, so a removed name can later identify a different provider.
- Automerge repositories use a VFS adapter bound to a textual repository path; each storage IO resolves the provider currently mounted at that path rather than retaining a provider instance.
- Current reconnect/relocation re-find a record by `spaceName`, which is insufficient across picker/confirmation pauses.
- Canonical Mioframe marker interpretation belongs behind the fileSystem service boundary; features do not own storage marker facts.
- Locator-different relocation allocates a new name while the old name is still occupied, persists first, then removes the old runtime mount and mounts the selected folder only at the new path.
- Web File System permission recovery awaits browser work before invoking its provider-bound `onAccessRequired` callback. Unmounting/replacing a provider does not cancel an already-started provider operation, so a callback from the removed provider can arrive after the topology mutation commits.
- Pending access requests are keyed by `{ spaceName, mode }`; a late stale callback for a reused `spaceName` can overwrite a request that belongs to the current provider unless fileSystem rejects the stale callback before registry mutation.

## Non-goals

- redesigning `directoryContent$`, loading/refreshing state, external rclone observation, or Repository Explorer query composition;
- VFS route identity/binding, `StaleIdentity`, hierarchical or cross-runtime locking, provider cancellation, repository retirement, Repo generations, or document lifecycle changes;
- persistent UUID/schema migration for mounted-directory records;
- general cross-runtime synchronization of the IndexedDB mounted-directory list;
- fixing unrelated future reuse of a textual VFS path by a cached Repo outside the bounded same-entry recovery settlement described here;
- marker-format changes, Google Drive/OPFS changes, or shared UI changes.

## Affected user scenarios

1. Missing/revoked permission -> existing `Permission required` recovery.
2. Permission granted but remembered root enumeration fails -> `Folder unavailable` + `Reconnect folder`.
3. Picker/confirmation cancel -> zero mutation.
4. Same mounted provider emits equivalent unavailable-root errors -> one logical recovery target.
5. Provider is removed/replaced, including reuse of the same `spaceName`, while picker/confirmation is pending -> old action becomes stale and cannot mutate the replacement.
6. `isSameEntry() === true` -> persist/remount under the same mounted name/path, clear stale requests, and settle existing cached repository writes while that mounted path cannot be reassigned by another same-runtime topology mutation.
7. Same-entry settlement failure -> reconnect stays committed; return warning status and show Snackbar. The topology queue is released after the settlement attempt completes.
8. False/missing/throwing `isSameEntry()` + missing Mioframe marker -> expected invalid candidate, zero mutation.
9. False/unverifiable identity + valid marker -> explicit confirmation.
10. Marker disappears after confirmation but before the confirmed relocation terminal decision or persistence begins -> relocation rejects with zero mutation.
11. Confirmed candidate already mounted elsewhere -> zero mutation; return/open that existing current mount.
12. Confirmed unique candidate -> replace the remembered record with a new unique mounted name/path; selected storage is never reachable through the old path.
13. A same-runtime mounted-directory add/remove/replace starts while confirmed relocation is running -> mutations are serialized so relocation cannot decide from a stale duplicate/unique snapshot.
14. A same-runtime mounted-directory add/remove/replace starts while same-entry write settlement is running -> it waits until settlement completes, so cached writes cannot be routed to another physical provider that reuses the same mounted path.
15. A mounted provider is removed or replaced by `addDeviceDirectory()` -> provider-owned recovery state for the removed/replaced provider, including pending permission requests and `recoveryKey`, is invalidated after the replacement commits.
16. An access check started by the old provider is still pending when that provider is removed/replaced -> when the old check later completes as non-granted, its callback must not create or overwrite a pending permission request for the removed provider. If the current provider has already registered its own request under the reused name/mode, that current request remains authoritative.

## Boundaries and ownership

- `webFileSystemProvider`: permission vs unavailable-root classification; transfer-safe unavailable-root payload. It may let its owner decline an access-recovery callback when the provider is no longer an actionable recovery target.
- `fileSystem` service: mounted-provider recovery identity, persisted records, canonical marker inspection orchestration, same-entry reconnect, relocation, stale-target validation, mounted-directory mutation serialization, and mount/request lifecycle, including rejecting late access-recovery callbacks from removed/replaced providers.
- `automergeAdapter`: low-level canonical marker-file inspection algorithm and VFS-backed storage adapter only; no recovery orchestration or UI ownership.
- `mountedDirectories` entity: typed facade for service inspection/reconnect actions.
- `localDirectoryReconnect` feature: picker, confirmation, action-local pending/feedback state, Snackbar; no marker parsing or storage identity inference.
- `mioframeSpacePick` feature: consumes service/entity marker inspection instead of reading the marker directly.
- `repositories`: existing Repo cache semantics plus generic write-recovery settlement only. Repository code performs the settlement; it does not own mounted-directory topology or locking.
- `RepositoryExplorerWidget`: branch rendering and post-action navigation applicability.

## Source of truth and state shape

- `spaceName` is a safe mounted display/path locator only.
- Unavailable-root recovery carries `{ spaceName, recoveryKey }`.
- `recoveryKey` is an opaque, transfer-safe, runtime-only key owned by the fileSystem service for the specific mounted local-directory provider instance that emitted the recovery error.
- The key is not persisted, not shown in ordinary directory listings, and not a physical-directory identity.
- Equivalent errors from the same mounted provider reuse the same key. Provider removal/replacement creates or exposes a different current key, even when the mounted name is reused.
- Feature-local target state is keyed by `recoveryKey`; `spaceName` is used only for copy/path arguments.
- Within one fileSystem service instance, service-owned mounted-directory topology mutations are serialized through one runtime-only mutation queue. This is not a persisted identity, VFS lock, or cross-runtime synchronization mechanism.
- For same-entry reconnect only, the same queue also protects the bounded post-remount write-settlement interval. This is necessary because cached repositories write through VFS paths that resolve the currently mounted provider on each IO.
- Pending browser permission requests are provider-owned runtime recovery state. `clearForSpace()` removes requests that are already registered when a provider is committed out of topology, but that point-in-time cleanup is not sufficient by itself because an operation begun on the old provider can finish later.
- A provider-bound access-recovery callback may mutate the pending-request registry only while that callback's provider `recoveryKey` is still the current key for its mounted `spaceName`. A late callback from a removed/replaced provider is non-actionable and cannot create or overwrite a request.

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
- The provider-bound `onAccessRequired` callback closes over that same runtime key. Before it registers a pending request, fileSystem verifies that `{ spaceName, recoveryKey }` is still the current mounted provider. If it is stale, the callback declines actionable recovery and does not call `registry.upsertRequest()`. The provider then fails closed through its ordinary non-actionable permission error path.
- This late-callback guard applies to both read and write access recovery because both modes share the same provider-bound callback. It must protect a current same-name provider request from being overwritten by a late callback from the removed provider.
- `clearForSpace()` remains required at committed provider removal/replacement to invalidate requests already present at commit time; the provider-currentness guard complements it by preventing later re-registration. No new registry generation, persistent identity, provider cancellation, or cross-runtime protocol is required.
- Feature validity checks compare `recoveryKey`, not Error object identity or `spaceName`. Same-key re-emissions preserve target-local feedback; a missing/different key aborts unfinished work.
- Service validates the supplied `{ spaceName, recoveryKey }` before reconnect work and again immediately before any persisted/runtime mutation. A stale pair returns `staleRecovery` with zero mutation.
- `reconnectDeviceDirectory` owns the first canonical marker inspection when `isSameEntry()` is false/unavailable: missing marker returns `invalidCandidate`; valid marker returns `confirmationRequired`.
- User confirmation is completed before entering the final relocation mutation. The service does not hold a mutation queue across picker or confirmation UI.
- Service-owned mounted-directory topology mutations (`addDeviceDirectory`, `removeDeviceDirectory`, same-entry reconnect, and confirmed relocation) are serialized within the current fileSystem service instance using one simple async mutation queue. The queue must release on both success and failure.
- After confirmation, `relocateRememberedDeviceDirectory` performs its current recovery-target validation and duplicate-handle detection within that serialized mutation scope, then performs the canonical marker inspection as the final external asynchronous preflight before any terminal relocation decision or persistence begins. Because the queue keeps same-runtime topology stable while marker inspection is pending, the duplicate/unique decision remains current; because marker inspection is last, a marker that disappears during earlier duplicate detection cannot be accepted.
- After that final marker inspection: invalid marker -> `invalidCandidate`; valid current duplicate -> `alreadyMounted`; valid current unique candidate -> persist the replacement first, then update runtime mounts. No duplicate/unique decision may be carried from outside the serialized mutation turn.
- Same-entry reconnect proves physical identity before entering its serialized mutation turn. Inside that turn it revalidates the recovery target, persists/remounts the proven-identical handle at the same mounted path, clears stale provider recovery requests, and then invokes the registered repository write-recovery settlement while the same topology queue is still held. The queue is released only after the settlement attempt completes, whether it flushes or returns a non-flushed result.
- Holding the existing queue through same-entry settlement is a topology-stability boundary, not repository ownership transfer: repository code still owns queued saves and `repo.flush()`, and fileSystem still interacts only through the existing registered recovery-handler contract.
- Failed settlement, including rejecting `repo.flush()` as normalized by the repository handler, is a non-flushed result; reconnect remains committed and is not rolled back.
- A successful `addDeviceDirectory()` that removes or replaces an existing provider invalidates the old provider's runtime recovery state together: old `recoveryKey` and pending access requests must not survive the committed provider replacement. Failed persistence must leave the previous provider/recovery state intact.
- Cross-runtime/other-window IndexedDB synchronization remains outside this PR; the runtime queue and provider-currentness guard protect only state owned by the current fileSystem service instance.
- Unexpected marker-inspection failures are wrapped at the fileSystem boundary in a privacy-safe `DomainError` with a service-local stable code and raw cause. Features may report an already-safe `DomainError`; they must not expose raw browser messages.
- After a mutating service result is returned (`reconnected`, `reconnectedWithWriteRecoveryFailure`, `relocated`), that committed result is authoritative even if recovery disappears because of the mutation. `alreadyMounted`, `invalidCandidate`, `staleRecovery`, and `missingRecord` are zero-mutation outcomes and apply target-local feedback/navigation only while the initiating `recoveryKey` is still current.
- Locator-different relocation keeps the old name occupied while allocating the new name, persists the replacement first, then removes the old runtime mount and mounts the selected handle only under the new path.
- Repository cache/lifecycle stays at the pre-PR model; no retirement/no-op gate or VFS DELETE/RENAME retirement.

## Rejected approaches

- `spaceName` as recovery identity: names are reusable locators.
- Error/recovery object identity: reactive rereads create new objects for the same provider.
- Confirmation token created only after the first service call: it does not protect the picker gap before that call.
- Persistent mounted-record UUID/schema migration: stronger than required; runtime provider identity is sufficient for this user action.
- Marker validation in feature/UI: violates storage ownership and leaves commit-time revalidation outside the service.
- Marker as physical-directory identity: it proves only that the candidate looks like a Mioframe space.
- Repeated snapshot/recheck logic without same-runtime mutation serialization: each asynchronous `isSameEntry()` / marker step opens another window for service-owned topology mutation, so carrying or recomputing snapshots alone does not provide a complete terminal duplicate/unique decision.
- Marker inspection before asynchronous duplicate detection: the mutation queue stabilizes service topology but cannot stabilize external filesystem contents, so a marker checked too early can become stale before the terminal decision.
- Releasing the topology queue immediately after same-entry remount and settling cached repositories afterward: unsafe because the repository storage adapter resolves the current VFS mount on each IO; a remove/add sequence can reuse the same textual path while settlement is still writing.
- `clearForSpace()` as the complete provider-removal recovery fix: it is only a point-in-time cleanup and cannot prevent an already-started old-provider permission check from calling back after replacement and re-registering the stale handle.
- Cancelling all old provider operations, adding provider generations to the registry, or introducing a second lifecycle manager for late callbacks: broader than required. The existing per-provider runtime recovery key already supplies the currentness fact the callback needs.
- Binding cached repositories to provider generations/leases or introducing VFS route identity for this recovery: broader than required. Holding the existing same-runtime topology queue for the bounded settlement interval provides the needed invariant with fewer concepts.
- VFS route binding, Repo generation/lease/tombstone, hierarchical locking, or cross-runtime locking: broader than the required fileSystem-local mutation invariant.

## Confirmation copy

- headline: `Reconnect this Mioframe space?`
- supporting text: `Mioframe can't verify that this is the same folder it remembers. Continue only if you recognize the selected Mioframe space. Mioframe will reconnect the selected space without transferring unsaved in-memory changes from the unavailable location.`
- confirm: `Reconnect`
- cancel: `Cancel`

## Acceptance matrix / required proof

- Provider/transport: same provider -> stable `recoveryKey`; replacement provider, including same-name replacement -> different/stale key; serialization never exposes handles/raw paths.
- File-system service: stale key before same-entry reconnect -> zero mutation; stale key before relocation -> zero mutation; same-entry behavior/settlement unchanged apart from the required topology-stability interval.
- Provider recovery lifecycle: successful remove/rename/replacement clears recovery state owned by the removed provider; failed persistence does not clear the still-current provider's recovery state. If an old provider's deferred permission check completes after removal/replacement, its callback cannot create a stale request or overwrite a request already registered by the current same-name provider; preparing the request after the race yields the current provider handle or no request when no current request exists.
- Marker ownership: service inspection reports marker present/absent; unexpected inspection failure is a safe `DomainError`; no reconnect/picker feature imports marker-file logic.
- Confirmation boundary: valid marker -> confirmation required; marker removed after confirmation or while duplicate detection is pending -> final relocation marker inspection returns `invalidCandidate`, zero mutation.
- Relocation: current duplicate physical mount -> `alreadyMounted`, zero mutation; current unique candidate persists first and is reachable only under the new path.
- Same-runtime topology serialization: while confirmed relocation is in its serialized mutation turn, add/remove/replace operations cannot invalidate the duplicate/unique decision; when queued mutations run first, relocation observes their resulting current topology instead of an earlier snapshot.
- Same-entry settlement atomicity: after the proven-identical remount commits, a queued remove/add/replace operation cannot begin its topology turn until registered write-recovery settlement has completed. Settlement failure still releases the queue and returns the existing committed-warning outcome.
- Feature: identity/lifetime checks use `recoveryKey`; same key re-emission continues and preserves feedback; same `spaceName` with a new key aborts; zero-mutation stale/invalid/missing/already-mounted results cannot overwrite or navigate a newer target; committed mutation results/Snackbar remain authoritative.
- Existing Mioframe space open/create flows preserve behavior while consuming service/entity marker inspection.
- Widget: navigate only if initiating `directoryPath` is still current.
- Final real Chrome/PWA proof: permission loss, granted-unavailable root, cancel, same-entry, locator-different confirmation/relocation, invalid marker, already-mounted candidate, navigation, settlement warning, and same-name stale-action safety where practically reproducible.

## Risks

- Runtime recovery keys, the service-local mutation queue, and the provider-currentness callback guard intentionally do not solve general multi-window/worker synchronization of the persisted record list; that is a pre-existing broader storage-lifecycle concern.
- The queue protects topology mutations owned by this fileSystem service instance; it cannot prevent the external filesystem itself from changing independently while browser handles are in use.
- An already-started stale provider read may still complete after replacement as part of the broader directory-query race that this PR explicitly does not redesign. The required invariant here is narrower: such a stale provider must not leave an actionable pending permission request or overwrite the current provider's request.
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
- mutating relocation without final marker revalidation after the confirmation pause and after topology-dependent asynchronous preflight;
- carrying a duplicate/unique decision across asynchronous relocation preflight without same-runtime topology stability;
- releasing same-runtime topology stability between a committed same-entry remount and completion of its registered write-recovery settlement;
- registering or overwriting a pending access request from a provider whose runtime recovery key is no longer current for that mounted name;
- VFS route-binding/identity infrastructure, repository retirement, fileSystem -> repositories lease/guard, same-path locator-different replacement, provider-cancellation infrastructure, hierarchical/cross-runtime locking, or directory-reactivity redesign.

## Implementation readiness

- Product behavior: resolved.
- Dependency on directory-state redesign: none.
- Recovery target identity: resolved as fileSystem-owned runtime `recoveryKey`.
- Marker ownership/commit-time validation: resolved at fileSystem service; the final marker check follows topology-dependent async preflight.
- Same-runtime mounted-directory mutation atomicity: resolved as one fileSystem-local async mutation queue; no cross-runtime lock or persistent identity.
- Same-entry settlement topology safety: resolved by keeping the existing fileSystem mutation turn active through registered settlement; no provider generation/lease is required.
- Provider recovery lifecycle on committed replacement: resolved architecturally as point-in-time request cleanup plus a provider-currentness guard on late access-recovery callbacks; the current implementation still needs that late-callback guard.
- Unresolved architecture blockers: none.
- Verdict: **ready**.
