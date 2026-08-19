# Local directory access recovery — architecture handoff

This document is the implementation contract for recovering access to a remembered user-selected local directory without deleting or silently replacing the mounted space.

## Goal

When a remembered local directory can no longer be read, Mioframe must distinguish missing browser permission from an unavailable saved root and provide the matching explicit recovery action.

## Confirmed current behavior

- `WebFileSystemProvider` already checks `queryPermission()` before read/write operations and emits `WebFileSystemAccessRequiredError` when permission is not granted.
- Browser permission prompts are already owned by the explicit `localDirectoryRecovery` user action through the main-thread permission broker.
- Persisted local directory handles and mounted provider replacement are owned by `src/shared/service/fileSystem`.
- `DeviceFileSystemProvider.upsertRecord()` replaces the nested provider when the handle changes while keeping the mounted root name.
- `RepositoryExplorerWidget` already renders the existing `Permission required` recovery state before the generic folder error state.

## Non-goals

- recovery from an already-open document;
- changing document-not-found semantics;
- Repo Explorer loading-state redesign or transient-empty retries;
- changing the persisted directory-record format;
- introducing a persistent Mioframe space identifier;
- generic recovery managers, registries, retry frameworks, or shared UI changes;
- guaranteeing recovery after an OS-level move/rename when the browser cannot prove entry identity.

## Affected user scenarios

1. Saved handle reports `prompt` or `denied`: show the existing `Permission required` state and preserve `Read only` / `Grant full access`.
2. Saved root reports read permission `granted`, but root directory enumeration fails: show a neutral unavailable-folder state with `Reconnect folder`.
3. Reconnect picker is cancelled: keep the remembered space unchanged and leave recovery available.
4. The same directory is selected and identity is confirmed: persist the replacement handle under the same mounted name, replace the provider, and let existing VFS invalidation retry reads.
5. A different directory is selected, or identity cannot be confirmed: do not change persisted or mounted state; show a clear retryable message.
6. A nested file/path fails after the root is readable: preserve the original error semantics; do not classify arbitrary child I/O failures as reconnect-required.

## Boundaries and ownership

| Owner | Responsibility |
| --- | --- |
| `src/shared/lib/webFileSystemProvider` | Permission checks, root-directory read semantics, provider-owned typed unavailable-root error, raw cause preservation |
| `src/shared/service/fileSystem` | Persisted handle lookup/replacement, `isSameEntry()` identity verification, mounted provider replacement, stale recovery-request cleanup |
| `src/entities/mountedDirectories` | Narrow UI-facing access to the reconnect service mutation |
| `src/features/localDirectoryRecovery` | Explicit picker action, pending/cancel/result state, user-facing reconnect outcome |
| `src/widgets/RepositoryExplorerWidget` | Recovery precedence and rendering only |
| page/pane | No change |
| shared UI | No change |

## Source of truth

- Permission state: the remembered root handle at the provider boundary.
- Remembered directory identity and current handle: the persisted `PersistedDeviceDirectoryRecord` selected by stable mounted `name`.
- Entry equality: `FileSystemHandle.isSameEntry()`; the WHATWG File System Standard defines it as true only when both handles represent the same locator/entry.
- Recovery UI state: typed provider errors propagated through the existing service/client error boundary; widgets do not infer browser causes from messages.

## State and public contracts

Keep permission recovery and reconnect recovery distinct.

- Preserve `FileSystemAccessRecovery` for permission-required state.
- Add one transfer-safe provider-owned unavailable-root error carrying only the stable mounted `spaceName` plus safe error identity; preserve the original caught `Error`/`DOMException` as `cause` before transport.
- Add one narrow parser/read model for unavailable-root recovery rather than widening the permission-recovery type into a generic state manager.
- Add a file-system service mutation equivalent to `reconnectDeviceDirectory({ spaceName, handle })` with explicit result statuses for success, missing remembered record, different directory, and unverified identity.
- Expose that mutation through the mounted-directories entity facade.
- Extend `localDirectoryRecovery` with a reconnect action; do not reuse `addDeviceDirectory()` for this flow.

Exact exported names may follow existing local naming conventions, but ownership and result semantics above are fixed.

## Minimum sufficient design

### Provider detection

For user-selected directories only:

1. Check read permission before the operation as today.
2. For root directory enumeration (`readDirectory('/')`), if enumeration throws after the pre-check was `granted`, re-query root read permission once.
3. If the re-check is no longer `granted`, emit the existing permission-required error.
4. If the re-check remains `granted`, emit the new unavailable-root error with the original enumeration failure as cause.
5. Do not convert nested lookup/read failures into unavailable-root recovery merely because they threw after a granted permission check.

This handles permission revocation races without treating every granted-state I/O error as a permission error or reconnect request.

### Reconnect mutation

The service mutation must:

1. await mounted-directory hydration;
2. find the persisted record by the stable mounted `spaceName`;
3. verify identity with the remembered handle's `isSameEntry(selectedHandle)` when callable;
4. reject a confirmed mismatch and fail closed when identity cannot be verified;
5. persist the replacement handle while preserving the same record name;
6. replace the mounted provider through the existing `DeviceFileSystemProvider.upsertRecord()` path;
7. clear pending permission requests for that space because they reference the old handle;
8. rely on the existing VFS mount/provider events to invalidate reads rather than adding a second refresh mechanism.

Persist before replacing runtime state so a storage-write failure cannot leave an unpersisted replacement mounted for the session.

### User action

`Reconnect folder` is an explicit feature action and may call `showDirectoryPicker()` only from the user gesture. Use the same writable-directory intent as existing local-directory mounting. Cancellation is an expected result and must not be reported as an exception or mutate state.

## Diagnostics

Keep diagnostics thin and privacy-safe:

- record technical breadcrumbs for the root-read stage and permission state;
- preserve the real caught `DOMException`/`Error` so native exception type/name remains available to diagnostics when an unexpected provider failure is captured by the owning upper boundary;
- do not add custom `domExceptionName`, raw message, path, filename, handle, or folder-name diagnostic fields;
- expected picker cancellation, identity mismatch, and permission-required states are not diagnostic exceptions.

## Rejected approaches

- Reusing `addDeviceDirectory()`: it may create a second mount when identity does not match.
- Handling raw `DOMException` in the widget: duplicates provider semantics and breaks ownership.
- Classifying every granted-state read failure as reconnect-required: mislabels child/file errors.
- Adding a generic recovery manager or new persisted recovery state: no current requirement needs it.
- Falling back to folder name or repository marker for identity: neither proves that the selected directory is the remembered entry.
- Adding a persistent space ID in this bug fix: it changes storage identity and is unnecessary for the confirmed scenarios.

## Shared UI blast radius

None. Reuse existing Material button and empty-state components. No `src/shared/ui` contract or visual primitive changes are required.

## Acceptance matrix

| Scenario | Required result |
| --- | --- |
| read permission `prompt` | existing `Permission required`; no generic folder error |
| read permission `denied` | existing `Permission required`; no generic folder error |
| granted + root enumeration failure + permission still granted | unavailable-folder state with `Reconnect folder` |
| permission revoked between pre-check and failed root read | existing permission recovery, not reconnect recovery |
| picker cancelled | remembered record and mount unchanged |
| same entry selected | persisted handle replaced under same name; provider replaced; reads retry through existing invalidation |
| different entry selected | no persisted/runtime replacement; retryable mismatch message |
| identity API unavailable/fails to confirm | fail closed; no replacement |
| nested file/path error while root remains usable | original non-reconnect error semantics |
| reconnect storage update fails | old runtime provider remains mounted; error is surfaced safely |

## Risk matrix

- **Data/identity safety — high:** never replace a remembered mount without confirmed identity.
- **Permission classification — high:** re-check after failed root enumeration to cover revocation races.
- **Worker/service boundary — medium:** keep handles only in explicit service mutation/request contracts, never display records.
- **Diagnostics privacy — medium:** no paths, names, raw messages, handles, or synthetic error classifiers.
- **Shared UI — none:** no primitive changes.
- **Performance — low:** one additional permission query occurs only after a failed root enumeration; normal reads have no new retry loop.

## Required proof

Implementation preflight owns exact `TEST IMPACT`, but the resulting proof must cover:

- provider: `prompt`, `denied`, granted root read failure, permission-revocation race, and nested failure staying non-reconnect;
- service: same-entry replacement, different-entry rejection, identity-unverified rejection, persistence failure leaving runtime unchanged, stale pending-request cleanup, and provider invalidation after replacement;
- feature: picker success, cancel, mismatch/unverified result, pending-state reset, and safe failure message;
- widget: permission recovery precedence, unavailable-folder recovery rendering/action, and generic error fallback;
- diagnostics: safe stage/permission breadcrumbs and no private data added by the new path.

Real Chrome/PWA operator verification remains required for revoking site access and reconnecting an installed app because mocked handles do not prove browser permission persistence behavior.

## Required verification

- Run implementation preflight before production edits and follow its `TEST IMPACT`.
- Use focused verifier-managed checks only when useful during implementation.
- Final coding-agent handoff must run `pnpm verify` once after the implementation is stable.
- Architect review and exact-head GitHub CI remain required before merge.

## Forbidden

- No `requestPermission()` in provider/service code.
- No picker calls in provider/service/entity/widget/page code.
- No `addDeviceDirectory()` reuse for reconnect.
- No replacement on folder name, marker presence, or other heuristic identity.
- No removal/recreation of the remembered space as recovery.
- No raw browser messages, paths, folder names, or handles in diagnostic payloads.
- No catch-all conversion of child I/O errors to reconnect recovery.
- No generic recovery abstraction, persistent recovery state, compatibility path, or storage-format change.
- No shared UI changes unless new evidence proves the existing primitives insufficient.

## Implementation readiness

- Product behavior: resolved.
- Ownership and source of truth: resolved.
- State shape and public boundaries: resolved.
- Browser identity rule: resolved; `isSameEntry()` confirmation is required and failure is fail-closed.
- Required proof categories: resolved; exact test paths deferred to implementation preflight.
- Unresolved blockers: none.
- Verdict: **ready**.
