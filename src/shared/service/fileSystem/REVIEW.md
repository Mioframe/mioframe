# Review

Verdict: blocked

## Scope reviewed

- Complete PR #211 architecture and implementation from provider classification/transport through fileSystem recovery identity, permission-request lifecycle, mounted-directory serialization, repository settlement, marker ownership, entity/feature/widget consumers, diagnostics/privacy, regression proof, and exact-head CI.

## Blockers

### B1 — removed provider can re-register stale permission recovery after replacement

Owner: `src/shared/service/fileSystem`

Problem: committed provider removal/replacement clears pending requests that already exist, but an operation started on the old provider can still complete afterward and invoke that provider's `onAccessRequired` callback. The callback currently calls `registry.upsertRequest()` unconditionally. Because registry identity is only `{ spaceName, mode }`, a late callback from the removed provider can recreate stale recovery state or overwrite a pending request that already belongs to the current same-name provider.

Evidence:

- [File-system service](useFileSystemService.ts) — each local provider closes over its runtime `recoveryKey`, but `onAccessRequired` currently ignores that identity and always calls `registry.upsertRequest()` with the provider's handle and refresh callback.
- [Web File System provider](../../lib/webFileSystemProvider/WebFileSystemProvider.ts) — `ensureAccess()` and write-side recovery await `queryPermission()` before invoking `onAccessRequired`, so the callback can run after a concurrent service-owned provider replacement has already committed.
- [Access-request registry](fileSystemAccessRequestRegistry.ts) — requests are keyed by `{ spaceName, mode }`, and `upsertRequest()` overwrites the existing entry for that key without provider identity.
- [Main-thread permission broker](../../serviceClient/fileSystem/useFileSystemAccessPermissionBroker.ts) — the broker prepares the handle stored in that registry entry and calls `requestPermission()` on it, so a stale overwritten request can prompt against the removed provider's handle.

Basis:

- [File-system service rules](AGENTS.md) — service-owned provider recovery state must define stale/provider-removed lifecycle and be cleaned up; provider, VFS, persisted handles, and recovery lifecycle must remain aligned.
- [Local-directory recovery handoff](../../../../docs/local-directory-access-recovery.md) — provider-bound access recovery is valid only while that provider's runtime recovery key is current; point-in-time `clearForSpace()` must be complemented by a late-callback currentness guard.

Risk: after same-name provider replacement, a late permission failure from the removed provider can replace the current provider's pending request. A subsequent user permission action can then call `requestPermission()` on the old directory handle and invoke the old unmounted provider's refresh callback. This breaks provider ownership and can ask the user to grant access to the wrong folder.

Required final state: retain the existing runtime `recoveryKey` and request registry. A provider-bound `onAccessRequired` callback may register a request only while its closed-over `{ spaceName, recoveryKey }` is still current. A stale callback must fail closed without creating or overwriting actionable recovery state. `clearForSpace()` remains the commit-time cleanup for already-registered requests. Do not introduce persistent provider IDs, registry generations, provider cancellation infrastructure, VFS identity, or another lifecycle manager.

Verification: add deterministic service proof with an old provider permission check held pending across removal/replacement. After the current provider registers its own same-name request, release the old check and prove the prepared request still contains the current provider handle rather than the old one. Also prove a late callback after removal with no replacement leaves no pending request. Cover the shared read/write callback behavior at the lowest faithful level, preserve current provider recovery, and run the canonical final `pnpm verify`.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- The previously found topology/settlement, relocation ordering, recovery-key lifecycle, and point-in-time pending-request cleanup defects remain resolved; this finding is specifically about callbacks that arrive after that cleanup.
- General stale directory-query completion ordering remains part of the separate directory/reactivity work. PR #211 only needs to ensure a stale provider completion cannot leave actionable permission recovery for a removed provider.
- The old generic `Add Local Directory` UI was intentionally replaced by Mioframe-space create/open flows in PR #68, and it has no current consumer. Legacy arbitrary mounted-directory compatibility is therefore not being added as a new PR #211 requirement without a separate confirmed product decision.
- Persistent mounted-record IDs, provider generations, VFS route identity, repository retirement, hierarchical/cross-runtime locking, and generic multi-window mounted-record synchronization remain outside PR #211.

## Unresolved questions

None.
