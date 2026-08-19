# Local directory access recovery — architecture handoff

This document is the implementation contract for recovering access to a remembered user-selected local directory without deleting or silently replacing the mounted space.

## Goal

When a remembered local directory can no longer be read, Mioframe must distinguish missing browser permission from an unavailable saved root and provide an explicit recovery flow that also works when browser locator equality can no longer prove that a newly selected directory is the remembered entry.

## Confirmed current behavior

- `WebFileSystemProvider` checks `queryPermission()` before read/write operations and emits `WebFileSystemAccessRequiredError` when permission is not granted.
- A granted root-enumeration failure is already represented by the provider-owned `WebFileSystemUnavailableRootError` and rendered as `Folder unavailable` with `Reconnect folder`.
- Browser permission prompts and directory pickers are owned by explicit feature actions.
- Persisted local directory handles and mounted provider replacement are owned by `src/shared/service/fileSystem`.
- `DeviceFileSystemProvider.upsertRecord()` replaces the nested provider when the handle changes while keeping the mounted root name.
- The current reconnect service uses `FileSystemHandle.isSameEntry()` as a hard identity gate.
- Real Chrome/PWA operator verification showed that the intended recovery directory can return `isSameEntry() === false`, so locator equality is not sufficient as the only recovery identity mechanism.
- Mioframe already recognizes an existing Mioframe storage directory by the stable `storage-adapter-id.automerge` marker used by Automerge storage.

## Non-goals

- recovery from an already-open document;
- changing document-not-found semantics;
- Repository Explorer loading-state redesign or transient-empty retries;
- changing the persisted directory-record format;
- introducing or persisting a new Mioframe space identifier in this PR;
- changing the Automerge storage marker format or contents;
- generic recovery managers, registries, retry frameworks, or shared UI primitives;
- automatically proving that two locator-different directories are the same historical directory when the browser cannot provide that proof.

## Affected user scenarios

1. Saved handle reports `prompt` or `denied`: show the existing `Permission required` state and preserve `Read only` / `Grant full access`.
2. Saved root reports read permission `granted`, but root directory enumeration fails: show `Folder unavailable` with `Reconnect folder`.
3. Reconnect picker is cancelled: keep the remembered space unchanged and leave recovery available.
4. Selected directory satisfies `isSameEntry()` against the remembered handle: reconnect immediately without additional confirmation.
5. `isSameEntry()` returns `false`, is unavailable, or throws: do not mutate yet; inspect the selected directory as a Mioframe storage directory.
6. Locator-different/unverifiable selection has no Mioframe storage marker: reject it without mutation and keep recovery available.
7. Locator-different/unverifiable selection is an existing Mioframe storage directory: explain that Mioframe cannot prove it is the same historical location and require explicit user confirmation before replacing the remembered location.
8. User cancels that confirmation: do not mutate persisted or runtime state.
9. User explicitly confirms replacement: persist the selected handle under the existing mounted name, replace the mounted provider, clear stale access requests, and let existing VFS invalidation retry reads.
10. A nested file/path fails after the root is readable: preserve the original error semantics; do not classify arbitrary child I/O failures as reconnect-required.

## Boundaries and ownership

| Owner | Responsibility |
| --- | --- |
| `src/shared/lib/webFileSystemProvider` | Permission checks, root-directory read semantics, provider-owned unavailable-root error, raw cause preservation |
| `src/shared/lib/fileSystem` | Canonical browser-handle inspection for the Mioframe/Automerge storage marker; no feature-to-feature import or duplicated marker algorithm |
| `src/shared/service/fileSystem` | Persisted handle lookup, `isSameEntry()` fast-path classification, explicit remembered-handle replacement, mounted provider replacement, stale recovery-request cleanup |
| `src/entities/mountedDirectories` | Narrow UI-facing access to reconnect classification and explicit confirmed replacement mutations |
| `src/features/localDirectoryRecovery` | Picker action, marker-inspection orchestration, explicit confirmation UI, pending/cancel/result/error state |
| `src/widgets/RepositoryExplorerWidget` | Recovery precedence and rendering only |
| page/pane | No change |
| shared UI | No primitive/API change; reuse the existing dialog and Material controls |

Move the existing `inspectMioframeSpaceDirectory()` implementation out of `src/features/mioframeSpacePick` into `src/shared/lib/fileSystem/mioframeSpaceDirectoryInspection.ts`, export it from `@shared/lib/fileSystem`, and move its focused tests with it. `mioframeSpacePick` and `localDirectoryRecovery` must consume this one shared helper. Preserve its current marker-present / marker-missing / unexpected-browser-failure semantics.

## Source of truth

- Permission state: the remembered root handle at the provider boundary.
- Remembered mount key and current persisted handle: `PersistedDeviceDirectoryRecord`, selected by stable mounted `name`.
- Same-locator proof: `FileSystemHandle.isSameEntry()`. A `true` result is sufficient to reconnect automatically.
- Existing-Mioframe-directory classification for the fallback path: `inspectMioframeSpaceDirectory()` in `src/shared/lib/fileSystem`, backed by the canonical Automerge storage marker (`storage-adapter-id.automerge`).
- Historical sameness after locator equality is lost: not inferred from folder name, marker presence, or heuristics. The user becomes the authority through an explicit confirmation that replaces the remembered location.
- Recovery UI state: typed provider errors and explicit feature state; widgets do not infer browser causes from raw messages.

Marker presence means only “this is an existing Mioframe/Automerge storage directory”. It does **not** prove that the directory is the previously remembered one.

## State and public contracts

Keep permission recovery and unavailable-root recovery distinct.

Preserve the existing unavailable-root transport/error contracts.

Revise the reconnect service contract into two explicit stages.

### `reconnectDeviceDirectory({ spaceName, handle })`

Return `ReconnectDeviceDirectoryResult`:

- `{ status: 'reconnected', name }` — `isSameEntry()` returned `true`; persistence-first replacement completed;
- `{ status: 'confirmationRequired' }` — locator equality was false or could not be established; no mutation occurred;
- `{ status: 'missingRecord' }` — no remembered record exists for `spaceName`; no mutation occurred.

Remove the old `mismatch` and `identityUnverified` result variants. They now have the same safe next state: `confirmationRequired`.

### `replaceRememberedDeviceDirectory({ spaceName, handle })`

Add a separate narrow service mutation for the explicit post-confirmation replacement. Return `ReplaceRememberedDeviceDirectoryResult`:

- `{ status: 'reconnected', name }` — replacement completed;
- `{ status: 'missingRecord' }` — the remembered record disappeared before replacement; no new mount is created.

This mutation may be called only by the explicit recovery flow after `inspectMioframeSpaceDirectory()` succeeded and the user confirmed replacement. It does not perform marker inspection or display confirmation UI.

Expose these through `src/entities/mountedDirectories` as `reconnectDirectory()` and `replaceRememberedDirectory()` respectively. Do not expose handles through ordinary display records.

## Minimum sufficient design

### Provider detection

For user-selected directories only:

1. Check read permission before the operation as today.
2. For root directory enumeration (`readDirectory('/')`), if enumeration throws after the pre-check was `granted`, re-query root read permission once.
3. If the re-check is no longer `granted`, emit the existing permission-required error.
4. If the re-check remains `granted`, emit the unavailable-root error with the original enumeration failure as cause.
5. Do not convert nested lookup/read failures into unavailable-root recovery merely because they threw after a granted permission check.

This part of the existing implementation remains unchanged.

### Safe reconnect attempt

`reconnectDeviceDirectory()` must:

1. await mounted-directory hydration;
2. find the persisted record by stable mounted `spaceName`;
3. when callable, evaluate `existingRecord.handle.isSameEntry(selectedHandle)`;
4. if it resolves `true`, use the existing persistence-first replacement path and return `reconnected`;
5. if it resolves `false`, is unavailable, or throws, return `confirmationRequired` without changing persistence, runtime provider state, pending access requests, or mounted display state;
6. return `missingRecord` when the remembered record no longer exists.

`isSameEntry()` remains a fast-path proof, not a hard fail-closed terminal gate.

### Fallback candidate inspection and confirmation

When the safe attempt returns `confirmationRequired`, `useLocalDirectoryReconnectAction` must:

1. inspect the already selected handle with shared `inspectMioframeSpaceDirectory()`;
2. treat `looksLikeExistingSpace: false` as an expected invalid selection: show a clear retryable message and perform no mutation;
3. wrap unexpected browser/File System API inspection failures in the existing privacy-safe `DomainError` pattern before diagnostics;
4. if `looksLikeExistingSpace: true`, use the existing `useDialog().confirm()` API to show an explicit confirmation explaining that Mioframe cannot verify this is the same historical folder and that continuing will make the selected folder the remembered location for the current mounted space;
5. use a clear commit-style action label such as `Replace location`, with `Cancel` as the cancel action;
6. treat confirmation cancellation as expected: no mutation and no diagnostic exception;
7. re-check that the recovery target is still current before invoking `replaceRememberedDirectory()`;
8. only after confirmation call `replaceRememberedDirectory({ spaceName, handle })`.

The confirmation is the authority for locator-different/unverifiable replacement. It must not be implicit in picker selection alone.

### Confirmed remembered-location replacement

`replaceRememberedDeviceDirectory()` must:

1. await mounted-directory hydration;
2. find the persisted record by `spaceName`;
3. build the replacement record with the same persisted/mounted `name` and the selected handle;
4. persist the replacement record list **before** changing runtime state;
5. replace the mounted provider through `DeviceFileSystemProvider.upsertRecord()`;
6. clear pending file-system access requests for that space because they reference the old handle;
7. synchronize the UI-facing display records;
8. rely on existing VFS mount/provider events for read invalidation; do not add a second refresh mechanism.

If persistence fails, the old runtime provider must remain mounted.

Share the persistence-first replacement block locally inside the file-system service so the same-entry fast path and confirmed replacement cannot drift. Do not introduce a manager or generic replacement framework.

## Diagnostics and privacy

Keep diagnostics thin and privacy-safe:

- keep the existing root-read stage/permission breadcrumbs;
- preserve the real caught `DOMException`/`Error` as raw `DomainError.cause` where unexpected browser/service failures are reported;
- do not add raw browser messages, paths, filenames, handles, selected folder names, or mounted space names to diagnostic context;
- do not derive `errorClass`, `domExceptionName`, VFS codes, or similar classifiers for this flow;
- picker cancellation, confirmation cancellation, missing marker, `confirmationRequired`, and `missingRecord` are expected states and are not diagnostic exceptions;
- unexpected picker, marker-inspection, persistence, or proxy failures are wrapped with project-controlled safe messages/codes before `captureDiagnosticException`.

## Rejected approaches

- **Hard fail on `isSameEntry() !== true`:** real Chrome/PWA proof showed this can reject the intended recovery directory.
- **Treat marker presence as identity proof:** the same marker exists in every Mioframe storage directory and cannot prove historical sameness.
- **Silently replace on any selected Mioframe directory:** risks rebinding the remembered mount to an unrelated space without informed user intent.
- **Persist a new Mioframe space ID in this PR:** existing broken remembered records do not have such metadata, so a legacy fallback would still be required; it also changes persisted state without being necessary for the current recovery requirement.
- **Persist/compare Automerge `storage-adapter-id` in remembered records now:** it could improve future automatic identity, but existing records lack the old value and the unavailable handle may not be readable enough to backfill it. Explicit confirmation is still required for the current broken scenario.
- **Reuse `addDeviceDirectory()`:** it owns open/add behavior and may rename/create a separate mount instead of replacing the remembered location.
- **Import marker inspection from `mioframeSpacePick`:** feature-to-feature dependency is the wrong ownership direction.
- **Duplicate marker inspection in both features:** creates two owners for the same storage-format boundary behavior.
- **Add a generic recovery manager/state machine:** no current requirement needs it.

## Shared UI blast radius

No shared UI contract change. Reuse the existing dialog API, `MDButton`, and `MDEmptyState`. Only the local-directory recovery flow composes the confirmation.

## Acceptance matrix

| Scenario | Required result |
| --- | --- |
| read permission `prompt` | existing `Permission required`; no generic folder error |
| read permission `denied` | existing `Permission required`; no generic folder error |
| granted + root enumeration failure + permission still granted | `Folder unavailable` with `Reconnect folder` |
| permission revoked between pre-check and failed root read | existing permission recovery, not reconnect recovery |
| picker cancelled | remembered record and runtime mount unchanged |
| same locator selected (`isSameEntry() === true`) | reconnect immediately; no marker fallback dialog; same mounted name |
| locator differs or equality cannot be verified | no mutation; service returns `confirmationRequired` |
| fallback candidate has no Mioframe marker | reject with retryable message; no mutation |
| fallback candidate is a Mioframe directory; confirmation cancelled | no persisted/runtime replacement |
| fallback candidate is a Mioframe directory; confirmation accepted | selected handle becomes remembered handle under the same mounted name; provider replaced; reads invalidate/retry |
| confirmed replacement persistence fails | old runtime provider remains mounted; safe retryable error shown |
| remembered record disappears before safe attempt/replacement | `missingRecord`; no new mount created |
| recovery target changes while picker/inspection/confirmation is pending | stale action must not replace or overwrite state for the new recovery target |
| nested file/path error while root remains usable | original non-reconnect error semantics |

## Risk matrix

- **Data/identity safety — high:** locator-different replacement is allowed only after marker validation plus explicit user confirmation; never silently substitute.
- **Legacy recovery — high:** the design must work for existing persisted records that contain only `name` + `handle`.
- **Permission classification — high:** preserve the provider re-check after failed root enumeration.
- **Persistence consistency — high:** persist first, then replace runtime provider.
- **Feature race/staleness — medium:** do not apply confirmation/replacement to a recovery target that changed while the action was pending.
- **Worker/service boundary — medium:** handles remain only in explicit mutation contracts, never display records.
- **Diagnostics privacy — medium:** no path/name/handle/raw external text in reportable metadata.
- **Shared UI — none:** no primitive changes.
- **Performance — low:** marker inspection and confirmation happen only on the exceptional `confirmationRequired` path; same-entry recovery keeps the direct fast path.

## Required proof

Implementation preflight owns exact `TEST IMPACT`, but the resulting proof must cover:

- provider: existing `prompt`, `denied`, granted root read failure, permission-revocation race, and nested failure staying non-reconnect;
- `src/shared/lib/fileSystem/mioframeSpaceDirectoryInspection.test.ts`: marker present, marker missing, and unexpected browser failure;
- `mioframeSpacePick`: consumes shared `inspectMioframeSpaceDirectory()` and preserves existing open/create guardrail behavior;
- file-system service safe attempt: same-entry automatic reconnect; false/missing/throwing `isSameEntry()` => `confirmationRequired` with zero mutation; missing record;
- file-system service confirmed replacement: same mounted name, persistence-first ordering, provider invalidation, stale pending-request cleanup, missing record, and persistence failure leaving runtime unchanged;
- `useLocalDirectoryReconnectAction`: picker cancel; same-entry success without confirmation; non-Mioframe fallback rejection; valid Mioframe fallback confirmation cancel; confirmation accept invoking `replaceRememberedDirectory`; unexpected inspection/replacement failure; pending reset; stale recovery-target protection;
- widget: permission precedence, unavailable-folder recovery rendering/action, generic error fallback; no provider/storage logic added;
- diagnostics: expected fallback/cancel states are unreported; unexpected boundary failures use safe `DomainError` wrappers with raw causes.

Real Chrome/PWA operator verification remains required after the correction. It must specifically repeat the scenario that previously produced the mismatch message and confirm that the intended locator-different/unverifiable Mioframe directory can be explicitly rebound after confirmation.

## Required verification

- Run implementation preflight before production edits and follow its `TEST IMPACT`.
- Use focused verifier-managed checks only when useful during implementation.
- Final coding-agent handoff must run `pnpm verify` once after the implementation is stable.
- Re-run `project-review` on the complete affected scope after implementation.
- Exact-head GitHub CI and the real Chrome/PWA operator proof are required before merge readiness.

## Forbidden

- No `requestPermission()` in provider/service code.
- No picker or confirmation dialog in provider/service/entity/widget/page code.
- No `addDeviceDirectory()` reuse for reconnect.
- No silent replacement when `isSameEntry()` is false or unverifiable.
- No treating marker presence as proof that the candidate is the historical remembered directory.
- No replacement of a marker-valid candidate without explicit user confirmation.
- No feature-to-feature import from `localDirectoryRecovery` to `mioframeSpacePick` or vice versa.
- No duplicated Mioframe marker-inspection algorithm.
- No new persisted space ID, persisted storage-adapter ID, record-format migration, recovery token, or generic recovery infrastructure in this PR.
- No removal/recreation of the remembered mount as recovery.
- No raw browser messages, paths, folder names, mounted names, or handles in diagnostic payloads.
- No catch-all conversion of child I/O errors to reconnect recovery.
- No shared UI primitive changes unless new evidence proves existing primitives insufficient.

## Implementation readiness

- Product behavior: resolved — locator-different/unverifiable recovery is allowed only through marker validation plus explicit confirmation.
- Ownership and source of truth: resolved.
- State shape and public boundaries: resolved; persisted record format remains unchanged.
- Shared marker-inspection owner: resolved — `src/shared/lib/fileSystem/mioframeSpaceDirectoryInspection.ts`.
- Service API: resolved — `reconnectDeviceDirectory()` safe attempt plus `replaceRememberedDeviceDirectory()` explicit confirmed replacement.
- Browser identity rule: resolved — `isSameEntry() === true` is an automatic fast-path proof, not a terminal gate; explicit confirmation is the fallback authority when locator equality is unavailable.
- Legacy remembered-record behavior: resolved without migration.
- Required proof categories: resolved; exact impact metadata beyond the named focused proof is deferred to implementation preflight.
- Unresolved blockers: none for implementation; current `REVIEW.md` remains blocked until the corrected implementation and real-browser proof are complete.
- Verdict: **ready**.
