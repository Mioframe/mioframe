# Local directory access recovery — architecture handoff

This document is the implementation contract for PR #211.

## Goal

Recover remembered local Mioframe directories safely across asynchronous browser/provider work without allowing a stale provider action to mutate its replacement or allowing recovery settlement to write through a mounted path after that path has been reassigned.

## Confirmed current behavior and evidence

- Persisted local-directory records are `{ name, handle }`; the mounted `name` is a display/path locator and can be reused.
- `DeviceFileSystemProvider` owns the provider currently mounted under a name. A new handle object for the same name creates a new provider instance.
- `WebFileSystemProvider` may await `queryPermission()` before reporting access recovery; old provider operations are not cancelled by unmount/replacement.
- Browser `requestPermission()` must remain on the main thread in `serviceClient/fileSystem`.
- Automerge repository storage is VFS-path based: storage IO resolves the provider currently mounted for that textual path.
- Repository write-recovery settlement is already exposed to fileSystem through the registered write-recovery-handler contract.
- Current permission-recovery consumers either refresh current UI/save state or perform a later ordinary VFS/repository command after `requestAccess()` returns.

## Non-goals

- redesign `directoryContent$`, loading/refresh state, stale query completion, or rclone/external-filesystem observation;
- generic binding of every VFS operation to a provider generation or historical mount;
- holding topology stability across a feature callback after a recovery API has returned;
- generic stale cached-Repo handling after a removed textual path is reused later;
- provider cancellation, persistent mounted IDs/schema migration, VFS route identity, repository retirement/generations/leases, hierarchical or cross-runtime locking;
- general multi-window synchronization of persisted mounted-directory records;
- marker format, Google Drive, OPFS, or shared-UI redesign.

## Affected user scenarios

1. Missing/revoked permission -> existing `Permission required` recovery.
2. Provider operation completes its permission check after that provider was removed/replaced -> no actionable stale request.
3. Permission prompt was prepared for provider A, then provider A was replaced -> the old prompt result cannot consume provider B's request.
4. Current-provider permission grant -> refresh and write settlement complete against stable same-runtime topology.
5. Denied/dismissed permission -> request remains retryable; no topology lock is needed.
6. Granted-but-unreadable remembered root -> `Folder unavailable` + explicit reconnect.
7. `isSameEntry() === true` reconnect -> persist/remount at the same path and settle cached writes while topology is stable.
8. Locator-different reconnect candidate -> marker validation + confirmation + serialized relocation to a new unique mounted path.
9. Provider removal/replacement -> all service-owned actionable recovery for the removed provider becomes stale.
10. A feature starts another VFS/repository command after recovery returns -> that command follows ordinary current-path VFS semantics; recovery does not create a cross-feature topology lease.

## Boundaries and ownership

| Owner                       | Responsibility                                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `webFileSystemProvider`     | Browser handle operations, permission classification, unavailable-root detection, provider-local errors.                                                                             |
| `service/fileSystem`        | Mounted-provider runtime identity, persisted mount records, provider lifecycle, pending access registry, topology serialization, reconnect/relocation, granted-resolution stability. |
| `serviceClient/fileSystem`  | One-shot temporary handle use and user-activation-bound `requestPermission()`; round-trip service-issued correlation only.                                                           |
| `service/repositories`      | Pending Automerge save and `repo.flush()` settlement behind the existing handler contract.                                                                                           |
| `automergeAdapter`          | Canonical marker inspection algorithm and VFS-backed storage adapter.                                                                                                                |
| `mountedDirectories` entity | Typed service facade.                                                                                                                                                                |
| features                    | User action, picker/confirmation, loading/feedback, and any later ordinary retry command. No provider identity/source of truth.                                                      |
| widget/page                 | Composition/navigation only.                                                                                                                                                         |

## Source of truth and state shape

- `spaceName`: reusable mounted display/path locator; never sufficient provider identity.
- `recoveryKey`: opaque runtime-only identity for one mounted local-directory provider instance.
- `recoveryKeysByName`: fileSystem-owned current provider identity map for this runtime.
- Pending permission request: `{ spaceName, mode, handle, refreshProvider, recoveryKey }` inside fileSystem only.
- `recoveryKey` is not persisted, diagnostic context, ordinary display data, or feature/UI permission state.
- One fileSystem-local topology queue serializes service-owned mounted-directory topology decisions and bounded recovery settlement that depends on a stable mounted path.

## Provider lifecycle invariants

1. **One provider identity.** Every mounted local provider instance has exactly one runtime `recoveryKey`; replacing/removing the provider makes that key non-current.
2. **Stale results are non-authoritative.** Any asynchronous result originating from a provider may create or consume actionable recovery only while its provider identity is still current or still owns the pending request being resolved.
3. **User waits do not hold topology.** Picker, confirmation, `queryPermission()` completion, temporary-handle preparation, and browser `requestPermission()` may outlive a provider. They rely on identity revalidation, not a long-lived lock.
4. **Stable commit/settlement.** Once service-side recovery accepts a current target and starts asynchronous work whose correctness depends on the mounted path remaining bound to that provider, the existing topology queue stays held until that bounded work completes.
5. **Replacement invalidates recovery atomically at runtime.** After persistence succeeds, provider replacement/removal updates runtime topology, current `recoveryKey`, and already-registered pending requests without an asynchronous gap between those runtime mutations. Failed persistence leaves the old runtime/provider recovery state intact.
6. **A stale action never mutates replacement-owned state.** It cannot overwrite/delete a replacement request, refresh the replacement provider, run write settlement on its behalf, or perform reconnect/relocation mutation.
7. **Recovery has an explicit end.** When a recovery service/client call returns, its topology-stability interval is over. A later feature retry is a new normal VFS/repository operation and resolves current topology according to existing VFS semantics. Extending historical provider identity across arbitrary feature operations would require a different general VFS contract and is outside this PR.
8. **External filesystem state is not lockable.** For locator-different relocation, canonical marker inspection remains the final external asynchronous preflight before the terminal relocation decision/persistence.

## Public API / entry points

- Unavailable-root transport exposes transfer-safe `{ spaceName, recoveryKey }`.
- `reconnectDeviceDirectory({ handle, spaceName, recoveryKey })` returns `reconnected`, `reconnectedWithWriteRecoveryFailure`, `confirmationRequired`, `invalidCandidate`, `staleRecovery`, or `missingRecord`.
- `relocateRememberedDeviceDirectory({ handle, spaceName, recoveryKey })` returns `relocated`, `alreadyMounted`, `invalidCandidate`, `staleRecovery`, or `missingRecord`.
- UI-facing permission request remains `{ operation, spaceName, requestedMode }`; features do not receive `recoveryKey`.
- `getTemporaryFileSystemAccessHandle({ operation, spaceName })` may return `{ handle, operation, spaceName, recoveryKey }` only to the main-thread serviceClient.
- `resolveFileSystemAccessRequest(...)` receives the same `recoveryKey` back from serviceClient.
- Ordinary mounted-directory display records remain handle/key-free.

## Minimum sufficient design

### Permission detection and registration

- A mounted local provider closes over its own `recoveryKey`.
- Before `onAccessRequired` calls `registry.upsertRequest()`, fileSystem synchronously checks that `{ spaceName, recoveryKey }` is still current.
- If stale, the callback returns no actionable recovery details and the provider fails closed through its ordinary non-actionable permission error.
- `clearForSpace()` remains commit-time cleanup for requests already registered when a provider is removed/replaced.

### Prepare, browser prompt, and resolution

- Registry stores the owning `recoveryKey` on each request.
- `prepareHandle()` returns the request handle plus that key for one explicit user action.
- serviceClient calls `requestPermission()` outside the topology queue and returns the same key unchanged to service resolution.
- Registry resolution first compares the supplied key with the current pending request's stored key. Missing/mismatch -> existing `missing` outcome and zero mutation of any current request.
- `denied`/`prompt` with matching identity remains a direct non-mutating registry outcome; the pending request stays retryable.
- `granted` resolution is routed by fileSystem through the existing topology queue. Inside the same turn: request/key validation -> request deletion -> provider refresh -> registered write-recovery settlement. Queue release occurs after flushed, non-flushed, or rejected completion.
- If a topology mutation was queued first, it commits first and the later old-key resolve observes missing/stale state. If granted resolve entered first, add/remove/reconnect/relocation wait until refresh/settlement finishes.

### Remembered-root reconnect

- Feature target validity uses unavailable-root `recoveryKey`, not `spaceName` or Error-object identity.
- `isSameEntry() === true` is the only in-place physical identity proof. It may run before the queue, but fileSystem revalidates `{ spaceName, recoveryKey }` inside the queued commit.
- Same-entry commit: persist replacement handle -> remount same path -> clear old pending requests -> settle registered cached writes while the same topology turn is held. Settlement failure is a committed warning, not rollback.
- False/unverifiable identity: service-owned canonical marker inspection; invalid marker -> zero mutation; valid marker -> confirmation required.
- Confirmation occurs outside the queue.
- Confirmed relocation runs current-target validation and duplicate-handle detection inside the queue, then performs marker inspection as the final external asynchronous preflight. Invalid -> `invalidCandidate`; valid duplicate -> `alreadyMounted`; valid unique -> persist first, remove old runtime mount, mount selected handle only under a new unique name.

### Mounted-directory mutations

- `addDeviceDirectory`, `removeDeviceDirectory`, same-entry reconnect commit/settlement, confirmed relocation, and granted permission resolution share the same topology queue.
- No second queue, lease, generation, or provider-lifecycle manager is introduced.
- Normal VFS reads/writes are not globally serialized by this queue.
- Once `requestAccess()`/service resolution has returned, feature-owned retries such as create/import are not part of the recovery critical section. They execute as ordinary VFS/repository calls against whatever topology is current when they start. This preserves the pre-existing VFS contract and avoids inventing a provider lease spanning main-thread feature work.

## Simplest viable alternative comparison

- `recoveryKey` is required because `spaceName` is reusable and browser/serviceClient waits can outlive provider replacement.
- The existing topology queue is required only where asynchronous service work depends on a stable mounted path.
- A unified provider manager, persistent ID, VFS route binding, provider cancellation, or cross-feature lease would add state/ownership without a current scenario that requires it.
- A recheck after `refreshProvider()` is insufficient for write settlement because topology could change during the later asynchronous flush.

## Rejected approaches

- `spaceName` or Error object identity as provider identity.
- request-specific generated identity separate from the existing provider `recoveryKey`.
- marker validation in feature/widget or marker as physical identity.
- `clearForSpace()` without late-callback and prompt-resolution identity guards.
- key comparison without topology stability through granted refresh/write settlement.
- holding the queue across browser prompts, pickers, or confirmation.
- carrying a topology lease across feature return/retry.
- provider generations, persistent UUIDs, VFS route identity, repository retirement/leases, provider cancellation, hierarchical/cross-runtime locking.

## Shared UI blast radius

None. Existing Material/UI contracts and copy remain unchanged except already-defined reconnect/confirmation feedback.

## Acceptance matrix

- Same provider re-emission -> stable unavailable-root `recoveryKey`; provider replacement -> old key stale.
- Deferred old-provider read/write permission check after replacement -> cannot create/overwrite actionable request.
- Old prepared prompt resolves after same-name replacement -> `missing`; replacement request remains intact; no replacement refresh/write settlement.
- Current read/readwrite prompt -> broker round-trips current key; feature/UI request type contains no key.
- Granted resolution while settlement is pending -> queued add/remove/reconnect/relocation cannot begin topology mutation.
- Topology mutation queued before granted old-key resolution -> old resolution returns `missing` and runs no settlement.
- Non-flushed/rejected granted settlement -> topology queue still releases; existing safe result/error mapping remains intact.
- Committed provider replacement clears old current key and already-registered requests; failed persistence preserves them.
- Same-entry reconnect -> persist/remount + settlement under one topology turn; queued topology mutation waits.
- Relocation -> current duplicate/unique decision and final marker preflight under one topology turn; persistence precedes runtime relocation.
- Picker/confirmation/browser-prompt cancel -> zero topology mutation.
- No `recoveryKey` in persistence, ordinary display DTOs, UI copy, or diagnostics.
- A feature retry that starts after successful recovery is not claimed to preserve historical provider identity; it follows current VFS topology exactly like the same command started without recovery.

## Risk matrix

- **Cross-runtime/multi-window topology:** intentionally not protected; existing broader storage-lifecycle issue.
- **External filesystem/remount changes:** cannot be serialized by app queue; final marker preflight and browser errors are the bounded protection available here.
- **Later feature retry after recovery returns:** uses ordinary current VFS path semantics; no historical provider lease is promised.
- **Generic stale cached Repo after future path reuse:** separate repository/VFS lifecycle problem; this PR only protects cached writes executed inside its explicit recovery settlement intervals.

## Required test proof

- Deterministic provider/service tests for stale late registration, stale prepared prompt, request ownership, committed replacement cleanup, and failed persistence preservation.
- Deterministic service concurrency tests for queue ordering around granted resolution, same-entry settlement, add/remove, and relocation.
- Registry tests for current/stale `recoveryKey`, denied/prompt retention, read/readwrite independence, and write-handler behavior.
- serviceClient tests proving one-shot handle/key round-trip while public feature request/response contracts remain key-free.
- Real fileSystem/repositories integration proof for queued Automerge write settlement through the intended mounted provider.
- Existing reconnect/relocation/feature/widget tests remain required.
- Final real Chrome/PWA operator proof remains required for File System Access browser behavior and the complete user recovery matrix.

## Required verification

- implementation preflight;
- focused verifier-managed tests during correction as useful;
- final coding-agent `pnpm verify`;
- complete PR `project-review` after implementation;
- exact-head GitHub CI;
- final real Chrome/PWA operator proof.

## Forbidden

- using `spaceName` as sole reconnect/provider-resolution identity;
- exposing/logging/persisting permission correlation `recoveryKey` outside the defined internal boundaries;
- a second provider identity/generation/token system;
- a second topology queue or topology lease across browser/UI waits;
- releasing topology stability while same-entry or granted-permission registered write settlement is still running;
- feature/widget marker parsing or provider-state ownership;
- VFS route binding, repository retirement/lease/generation, provider cancellation, persistent mounted IDs, hierarchical/cross-runtime locking, or directory-reactivity redesign.

## Implementation readiness

- Product behavior: resolved.
- Ownership/source of truth: resolved.
- Provider lifecycle identity: resolved as existing runtime `recoveryKey`.
- Browser wait boundary: resolved outside topology queue with identity revalidation afterward.
- Stable service commit/settlement boundary: resolved using the existing topology queue.
- Reconnect/relocation marker and mutation ordering: resolved.
- Post-return feature retry semantics: explicitly ordinary current-path VFS behavior; no recovery lease.
- Unresolved architecture blockers: none.
- Architecture-defined implementation: complete on the reviewed PR head; granted permission resolution now uses the existing topology queue through refresh/write settlement.
- Remaining acceptance gates: exact-head GitHub CI and final real Chrome/PWA operator proof, plus cleanup of any active review-only quality findings before merge.
- Verdict: **ready**.
