# Local directory access recovery — architecture handoff

This document is the implementation contract for PR #211.

## Goal

Recover a remembered user-selected local directory when its saved root becomes unavailable, without silently aliasing a different physical storage directory behind an existing live VFS path.

## Confirmed current behavior

- `WebFileSystemProvider` correctly separates missing read permission from a granted-but-unreadable mounted root; nested failures keep their ordinary semantics.
- `isSameEntry() === true` is sufficient for a live same-path reconnect.
- Real Chrome/PWA proof showed the intended recovery folder can be false/unverifiable through `isSameEntry()`, so strict locator equality cannot be the only recovery path.
- `src/shared/lib/automergeAdapter` owns the stable `storage-adapter-id.automerge` marker and Automerge storage-format policy.
- `src/shared/service/fileSystem` owns persisted directory handles, mounted names/paths, provider mount/unmount, and access-request cleanup.
- `src/shared/service/repositories` owns Repo/cache/retrying-storage lifecycle and the existing generic write-recovery settlement hook.
- The current locator-different live-rebind lease design is rejected: it couples fileSystem and repositories around a feature scenario and allows old path-keyed intent to resume against different physical storage.

## Non-goals

- persistent Mioframe/storage IDs or persisted-record schema changes;
- transferring/replaying/discarding live Repo/DocHandle state into locator-different storage;
- repository-aware relocation locks, leases, reservations, or replacement guards;
- generic recovery/lifecycle managers or mutex infrastructure;
- changing Automerge marker format;
- changing Google Drive, OPFS, nested-path, or ordinary document-not-found behavior;
- shared UI primitive changes.

## Affected scenarios

1. Saved handle is `prompt`/`denied`: existing permission recovery.
2. Permission is granted but mounted-root enumeration fails: `Folder unavailable` + `Reconnect folder`.
3. Picker cancelled: no mutation.
4. `isSameEntry() === true`: persist/remount under the existing mounted name/path, clear stale requests, then run existing repository write settlement.
5. Same-entry settlement is not fully flushed: keep the proven-identical reconnect and return the existing explicit write-recovery warning result.
6. `isSameEntry()` is false/missing/throws: zero mutation; inspect the selected folder for the Mioframe/Automerge marker.
7. Marker missing: expected rejection, zero mutation.
8. Marker present: explicit confirmation; marker presence is candidate validation, never historical identity proof.
9. Confirmation cancelled: zero mutation.
10. Confirmed candidate is already represented by another persisted mount: zero mutation; return the existing mounted name.
11. Confirmed unique candidate: relocate the remembered record to a new mounted identity/name/path, never reuse the old live VFS path for locator-different storage.
12. Relocation persistence fails: old persisted/runtime mount remains unchanged.
13. Relocation succeeds: persist first, then unmount old path, mount selected handle under the new unique name, clear stale old-name access requests, sync display, and navigate the Repository Explorer to the new path.
14. Remembered record disappears or feature recovery becomes stale during async work: no unintended replacement/navigation/state overwrite.

## Ownership

| Owner                                  | Responsibility                                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/shared/lib/webFileSystemProvider` | Permission/root-read semantics and provider-owned unavailable-root error                                                                          |
| `src/shared/lib/automergeAdapter`      | Canonical marker filename and reusable marker-presence inspection policy                                                                          |
| `src/shared/service/fileSystem`        | Persisted-handle uniqueness, mounted-name allocation, same-entry reconnect, locator-different relocation, provider mount/unmount, request cleanup |
| `src/shared/service/repositories`      | Existing Repo/cache/retrying-storage behavior and generic write-recovery settlement only; no relocation knowledge                                 |
| `src/entities/mountedDirectories`      | Narrow UI-facing reconnect/relocation mutations                                                                                                   |
| `src/features/localDirectoryRecovery`  | Permission-grant recovery action only                                                                                                             |
| `src/features/localDirectoryReconnect` | Unavailable-root parsing, picker, marker inspection, confirmation, reconnect/relocation action state and result                                   |
| `src/widgets/RepositoryExplorerWidget` | Recovery branch precedence/rendering and navigation after relocation; no provider-error parsing                                                   |
| page/pane                              | No new responsibility                                                                                                                             |

## Source of truth and state

- Permission/root failure: provider error contract.
- Remembered mounts: `PersistedDeviceDirectoryRecord[]` (`name`, `handle`).
- Mounted VFS identity: persisted `name`; `/Device Files/<name>` is path identity, not historical space identity.
- Proven same physical entry: `FileSystemHandle.isSameEntry() === true`.
- Fallback candidate validity: canonical Automerge marker inspection.
- Locator-different authority: explicit user confirmation authorizes reconnecting the candidate, but does not make it the same live VFS identity.
- One physical directory must not be persisted under two mounted names; fileSystem enforces this with the existing handle-identity mechanism.
- Queued/in-memory repository writes remain repository-owned and are settled only for proven same-entry reconnect.

## Public contracts

### Safe reconnect

`reconnectDeviceDirectory({ spaceName, handle })` returns `ReconnectDeviceDirectoryResult`:

- `{ status: 'reconnected', name }`;
- `{ status: 'reconnectedWithWriteRecoveryFailure', name }`;
- `{ status: 'confirmationRequired' }`;
- `{ status: 'missingRecord' }`.

False/missing/throwing `isSameEntry()` always returns `confirmationRequired` with zero persistence/runtime/request/display mutation.

### Locator-different relocation

Replace `replaceRememberedDeviceDirectory()` with:

`relocateRememberedDeviceDirectory({ spaceName, handle })` returning `RelocateRememberedDeviceDirectoryResult`:

- `{ status: 'relocated', name }` — target record moved to a new mounted identity/path;
- `{ status: 'alreadyMounted', name }` — selected physical directory is already represented by another persisted mount; zero mutation;
- `{ status: 'missingRecord' }` — target remembered record disappeared; zero mutation.

There is no `repositoryStateActive`, lease, guard, reservation, or repository-specific file-system error/status.

`src/entities/mountedDirectories` exposes `reconnectDirectory()` and `relocateRememberedDirectory()` only.

## Minimum sufficient design

### Provider detection

Keep the current provider implementation: pre-check read permission; after failed root enumeration re-check once; non-granted routes to existing permission recovery; still-granted routes to unavailable-root recovery; nested failures are untouched.

### Same-entry reconnect

1. Read target persisted record.
2. Require `isSameEntry() === true`; otherwise return `confirmationRequired` with zero mutation.
3. Persist replacement handle first under the same mounted name.
4. Remount provider under the same path.
5. Clear stale old-handle access requests.
6. Sync display/invalidation.
7. Run the existing registered write-recovery handlers for that mount.
8. Return `reconnected` or `reconnectedWithWriteRecoveryFailure` without rollback.

This is the only recovery path allowed to preserve the same live VFS path because physical identity is proven.

### Locator-different/unverifiable fallback

`src/features/localDirectoryReconnect`:

1. derives unavailable-root recovery from supplied error candidates;
2. opens the writable directory picker;
3. runs safe reconnect;
4. on `confirmationRequired`, inspects the selected handle using the marker helper owned by `@shared/lib/automergeAdapter`;
5. missing marker => expected retryable rejection;
6. marker present => explicit confirmation explaining that Mioframe cannot prove historical identity, will reconnect the candidate under a new location, remove the unavailable remembered mount, and will not transfer old in-memory repository state;
7. after confirmation calls `relocateRememberedDirectory()`;
8. returns the new/existing mounted target to the widget when navigation is required;
9. preserves stale-target checks at every async boundary.

Picker cancel, confirmation cancel, missing marker, `alreadyMounted`, `confirmationRequired`, and `missingRecord` are expected outcomes and are not diagnostic exceptions. Unexpected picker/inspection/service failures keep privacy-safe `DomainError` wrapping with raw cause.

### Relocation

`relocateRememberedDeviceDirectory()`:

1. hydrate/read persisted records and resolve the target by `spaceName`;
2. missing target => `missingRecord`;
3. compare selected handle with every other persisted record using the existing file-system handle identity mechanism;
4. matching other record => `alreadyMounted` with that record name and zero mutation;
5. unexpected identity-comparison failure => abort with zero mutation and surface through existing safe feature error handling;
6. allocate `newName` from `handle.name` using existing unique-name rules **while the old target name still counts as occupied**, so `newName !== oldName` even when the physical folder has the same basename;
7. build one next persisted record list replacing the old target with `{ name: newName, handle }`;
8. persist that list first;
9. only after persistence succeeds: remove old runtime record/path, mount the new record/path, clear pending requests for the old name, sync display/invalidation;
10. return `{ status: 'relocated', name: newName }`.

Do not call or coordinate repositories during relocation. Old Repo/DocHandle instances remain bound to the old VFS path, which no longer routes to the selected storage. No old path-keyed operation may be resumed against the new mount.

### Feature/widget boundaries

- Keep `src/features/localDirectoryRecovery` as the permission action. It receives error candidates and derives its own read-permission recovery instead of making the widget parse provider payloads.
- Move reconnect orchestration into the separate `src/features/localDirectoryReconnect` feature. It receives error candidates and derives unavailable-root recovery internally.
- `RepositoryExplorerWidget` passes the collected recovery errors to both features, owns only branch precedence, and performs navigation after reconnect returns a changed/existing mounted target.
- Navigate to `/Device Files/<returned name>` after `relocated`; `alreadyMounted` may navigate to the already-mounted target. Same-entry reconnect stays on the current path.

## Rejected approaches

- hard fail when `isSameEntry() !== true` — contradicted real-browser recovery;
- marker as identity proof — unsafe;
- live locator-different replacement under the old VFS path — crosses storage identity and service ownership;
- repository guard/lease/reservation around replacement — workaround for the rejected live-rebind design;
- persisted-only replacement followed by reload — requires additional pending/restart state and still complicates same-session actions;
- replay/migrate/discard cached Repo state into locator-different storage — unsafe/data-loss prone;
- persistent new space ID/schema migration — unnecessary for this bug;
- moving marker policy to generic `shared/lib/fileSystem` merely to deduplicate feature code — wrong owner;
- keeping permission and reconnect as one umbrella feature — violates one-action feature ownership.

## Acceptance matrix

| Scenario                            | Required result                                                                                           |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| permission `prompt`/`denied`        | existing permission recovery                                                                              |
| granted root enumeration failure    | unavailable-root recovery                                                                                 |
| picker/confirmation cancel          | zero mutation                                                                                             |
| same entry                          | same mounted path; persist/remount; settlement runs                                                       |
| same entry, settlement fails        | provider stays reconnected; explicit warning                                                              |
| false/unverifiable identity         | `confirmationRequired`; zero mutation before fallback                                                     |
| candidate lacks marker              | reject; zero mutation                                                                                     |
| candidate already mounted elsewhere | `alreadyMounted`; zero mutation; existing target can be opened                                            |
| confirmed unique candidate          | old persisted record replaced by new unique mounted name/path; old runtime path removed; new path mounted |
| candidate basename equals old name  | new unique mounted name differs from old path                                                             |
| relocation persistence fails        | old persisted/runtime mount unchanged                                                                     |
| old path after relocation           | cannot route reads/writes to selected storage                                                             |
| new path after relocation           | routes to selected handle                                                                                 |
| stale feature target                | no navigation/state overwrite                                                                             |
| nested provider failure             | existing semantics                                                                                        |
| widget                              | no provider recovery parsing                                                                              |
| repositories                        | no confirmed-replacement lease/reservation/relocation logic                                               |

## Required proof

Implementation preflight owns exact `TEST IMPACT`. The resulting proof must include:

- retained provider permission/unavailable-root/nested-error and worker-transform proof;
- marker present/missing/unexpected-failure tests under `src/shared/lib/automergeAdapter`, with both `mioframeSpacePick` and reconnect consumers using that owner;
- safe reconnect true/false/missing/throw/missing-record and zero-mutation proof;
- same-entry deterministic cross-service proof using actual fileSystem/repositories registration: no fixed sleeps; queued write settlement must be proven by a direct storage effect through the rebound handle, plus non-flushed outcome;
- relocation service proof: already-mounted candidate zero mutation; unique new name always differs from old; persistence-first ordering; persistence failure leaves old runtime intact; success removes old path and mounts selected handle only at new path; old-path VFS access cannot reach selected storage; missing record;
- feature proof split by action: permission feature handles permission recovery; reconnect feature handles picker/marker/confirmation/relocation, expected outcomes, stale target, and privacy-safe unexpected errors;
- widget proof: branch precedence from feature-facing state only and navigation to relocated/already-mounted target without provider parsing;
- absence proof: no confirmed-replacement lease/provider/guard/reservation, `repositoryStateActive`, lease-specific error, or PR-specific worker projection remains unless independently required by pre-existing code.

Real Chrome/PWA operator proof remains mandatory after implementation: revoked permission; granted-but-unavailable root; picker/confirmation cancellation; proven same-entry reconnect; locator-different confirmed relocation to a new mount identity; invalid marker; already-mounted candidate; navigation to the recovered mount.

## Required verification

- Run implementation preflight before production edits.
- Use focused verifier-managed checks during correction.
- Final coding-agent handoff: `pnpm verify`.
- Re-run complete `project-review` across the whole PR, not only the correction diff.
- Exact-head GitHub CI and real Chrome/PWA operator proof are merge gates.

## Forbidden

- No locator-different live rebind under the old VFS path.
- No repository lease/guard/reservation/relocation logic.
- No direct `fileSystem -> repositories` import.
- No replay/migration/discard of old cached repository state into the selected folder.
- No duplicate persisted mounts for one physical directory.
- No marker-as-identity shortcut.
- No marker policy in generic `shared/lib/fileSystem`.
- No provider-error parsing in `RepositoryExplorerWidget`.
- No reconnect action inside the permission-recovery feature module.
- No `requestPermission()` in provider/service code.
- No new persisted schema/ID, generic lifecycle manager, mutex framework, or shared UI primitive.

## Implementation readiness

- Product behavior: resolved.
- Ownership/source of truth/public contracts: resolved.
- Simpler alternative comparison: new mount identity removes the cross-service synchronization protocol and is preferred.
- Unresolved blockers: none in architecture; current production code still violates this handoff and must be corrected.
- Verdict: **ready**.
