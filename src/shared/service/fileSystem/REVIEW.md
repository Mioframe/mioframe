# Review

Verdict: blocked

## Scope reviewed

- Complete PR #211 architecture and implementation from provider classification/transport through fileSystem recovery identity, permission-request lifecycle, mounted-directory serialization, repository settlement, marker ownership, entity/feature/widget consumers, diagnostics/privacy, regression proof, and exact-head CI.

## Blockers

### B1 — permission recovery is not provider-identity-safe across same-name replacement

Owner: `src/shared/service/fileSystem` with the existing main-thread bridge in `src/shared/serviceClient/fileSystem`.

Problem: provider removal/replacement currently invalidates permission recovery only at a point in time. The complete asynchronous permission lifecycle is still addressed by reusable `{ spaceName, mode }` rather than by the provider instance that owns the request. This leaves two race windows with the same root cause:

1. an old provider can finish a deferred access check after replacement and register its stale handle/callback under the reused name;
2. an old provider's permission request can be prepared before replacement, then its browser prompt can resolve after a new same-name provider request has been registered, causing the old prompt result to resolve the new request.

Evidence:

- [File-system service](useFileSystemService.ts) — each mounted local provider already closes over a runtime `recoveryKey`, but `onAccessRequired` currently ignores that identity and calls `registry.upsertRequest()` unconditionally.
- [Web File System provider](../../lib/webFileSystemProvider/WebFileSystemProvider.ts) — read and write access paths await browser/provider work before invoking `onAccessRequired`, so an old provider callback can arrive after a committed replacement.
- [Access-request registry](fileSystemAccessRequestRegistry.ts) — pending requests are selected by `{ spaceName, mode }`; `upsertRequest()` overwrites the entry for that key, `prepareHandle()` returns no provider identity, and `resolve()` selects/deletes/refreshes the current entry without proving it is the same provider request that was prepared.
- [Main-thread permission broker](../../serviceClient/fileSystem/useFileSystemAccessPermissionBroker.ts) — the broker prepares a handle, awaits `handle.requestPermission()`, then calls `resolveFileSystemAccessRequest()` with only `{ operation, spaceName, permissionState }`. The provider can be replaced while that prompt is pending.

Basis:

- [File-system service rules](AGENTS.md) — service-owned provider recovery state must define stale/provider-removed lifecycle and keep provider, VFS, persisted handles, and recovery lifecycle aligned.
- [Main-thread file-system client rules](../../serviceClient/fileSystem/AGENTS.md) — temporary handles belong to one explicit user action and browser permission prompting remains in the main-thread adapter.
- [Local-directory recovery handoff](../../../../docs/local-directory-access-recovery.md) — one existing runtime `recoveryKey` must identify the provider throughout registration and one-shot prepare/prompt/resolve correlation; `spaceName` is not identity.

Risk: after same-name provider replacement, the user can be prompted on an old directory handle, or a permission result obtained from that old handle can delete/refresh/settle a request that belongs to the replacement provider. In the write case, this can also run repository write-recovery settlement under a permission result that was granted for the wrong provider instance.

Required final state:

- Reuse the existing fileSystem-owned runtime `recoveryKey`; do not introduce another provider identity mechanism.
- A provider-bound `onAccessRequired` callback may register a request only while its closed-over `{ spaceName, recoveryKey }` is still current. A stale callback must not create or overwrite actionable recovery state.
- Store the owning `recoveryKey` on each pending registry request.
- Keep the feature/UI permission action contract unchanged: callers still request permission with `{ operation, spaceName, requestedMode }` and never handle `recoveryKey`.
- `prepareHandle()` returns the pending request's handle plus its owning `recoveryKey` only to the main-thread serviceClient for that explicit user action.
- The broker must round-trip that same key when calling `resolveFileSystemAccessRequest()` after `requestPermission()` completes.
- `resolve()` must compare the supplied key with the key stored on the currently pending `{ spaceName, mode }` request before deleting anything or invoking `refreshProvider`/write-recovery handlers.
- If no request exists or the keys differ, return the existing stale/missing outcome and leave any current same-name request untouched.
- `clearForSpace()` remains the committed replacement/removal cleanup for already-registered requests.
- Current-provider permission recovery behavior, safe status mapping, write replay behavior, and unavailable-root recovery must remain unchanged.

Verification:

1. Hold an old provider read permission check pending across same-name provider replacement; let the current provider register its own request, then release the old check. Prove the stale callback cannot overwrite the current request and `prepareHandle()` yields the current handle/key.
2. Hold an old provider access check pending across removal with no replacement; release it and prove no actionable pending request appears.
3. Prepare an old provider request and hold `requestPermission()` pending. Replace the provider and register a current same-name request. Resolve the old browser prompt and prove the service returns the existing stale/missing result without deleting, refreshing, or replaying the current request.
4. After that stale resolve, prepare and resolve the current request normally and prove it uses the current handle/key and current provider refresh callback.
5. Cover the identity invariant for read and readwrite requests at the lowest faithful level; for write, prove a stale old prompt cannot invoke registered write-recovery handlers for the replacement request.
6. Preserve existing successful/denied/cancelled/current-provider permission behavior and existing provider replacement/recovery-key tests.
7. Run the canonical final `pnpm verify`.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Previously fixed topology serialization, same-entry settlement atomicity, relocation ordering, marker ownership, reconnect `recoveryKey` lifetime, and committed point-in-time pending-request cleanup remain resolved.
- General stale directory-query completion ordering remains part of the separate directory/reactivity work. PR #211 only requires that stale provider completion cannot create actionable permission recovery and stale permission results cannot consume a current provider request.
- The old generic `Add Local Directory` UI was intentionally replaced by Mioframe-space create/open flows in PR #68 and has no current consumer. Legacy arbitrary mounted-directory relocation compatibility is not a new PR #211 requirement without a separate product decision.
- Persistent mounted-record IDs, a second provider-generation system, provider cancellation infrastructure, VFS route identity, repository retirement, hierarchical/cross-runtime locking, and generic multi-window mounted-record synchronization remain outside PR #211.

## Unresolved questions

None.
