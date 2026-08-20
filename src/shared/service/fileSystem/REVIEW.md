# Review

Verdict: blocked

## Scope reviewed

- Complete PR #211 architecture and implementation from provider classification/transport through fileSystem recovery identity, permission-request lifecycle, mounted-directory serialization, repository settlement, marker ownership, entity/feature/widget consumers, diagnostics/privacy, regression proof, and current exact-head CI state.

## Blockers

### B1 — granted permission resolution can lose topology identity during refresh/write settlement

Owner: `src/shared/service/fileSystem`

Problem: the latest correction correctly closes both previously identified provider-identity races: a removed provider can no longer register a late actionable request, and a permission prompt prepared from an old provider can no longer consume a replacement provider's current request. However, once `fileSystemAccessRequestRegistry.resolve()` accepts a matching `recoveryKey` with `permissionState: 'granted'`, it deletes the request, awaits `refreshProvider()`, and for write recovery awaits registered repository settlement while `resolveFileSystemAccessRequest` remains outside the existing fileSystem mounted-topology mutation queue. A same-runtime remove/add/reconnect/relocation can therefore change the mounted path after identity validation but before write settlement finishes.

Evidence:

- [File-system service](useFileSystemService.ts) — the existing `enqueueMutation()` serializes mounted-directory add/remove/reconnect/relocation, but the public service surface still exposes `resolveFileSystemAccessRequest: registry.resolve` directly rather than routing a granted resolution through that queue.
- [Access-request registry](fileSystemAccessRequestRegistry.ts) — `resolve()` correctly checks `request.recoveryKey === recoveryKey` before mutation, then calls `deleteRequest()`, awaits `request.refreshProvider()`, and for write recovery awaits `runWriteRecoveryHandlers()`; there is no topology stabilization around those asynchronous steps.
- [Repository service](../repositories/repositoriesService.ts) — the registered write-recovery handler settles cached repositories by VFS `mountPath`, including `flushPendingSaves()` and `repo.flush()`.
- [VFS-backed Automerge adapter](../../lib/automergeAdapter/createVFSAdapter.ts) and [Device File System provider](../../lib/deviceFileSystemProvider/DeviceFileSystemProvider.ts) — storage IO resolves the provider currently mounted for the textual path; mounted child providers are replaceable by name.
- The latest focused tests correctly prove stale registration and stale prepared-prompt rejection, but do not hold a successful current-provider granted write resolution pending while a topology mutation attempts to remove/reuse the same mounted path.

Basis:

- [File-system service rules](AGENTS.md) — fileSystem owns provider/VFS/mounted-directory lifecycle alignment and service-owned provider recovery lifecycle.
- [Testing architecture](../../../../docs/testing/architecture.md) — required data-safety/concurrency behavior needs faithful proof; green verification does not replace a missing risk-specific contract.
- [Local-directory recovery handoff](../../../../docs/local-directory-access-recovery.md) — the same existing topology queue must protect a successfully correlated granted permission resolution from request/key validation through provider refresh and registered write settlement; the browser prompt itself stays outside the queue.

Risk: a granted write-permission result can be valid for provider A when resolution starts, but provider A's mounted path can be removed/reused by provider B while the recovery handler is still flushing cached repository writes. Because those writes resolve the current VFS provider by textual path, remaining pending writes can be routed to the wrong physical provider. Read recovery can likewise report a successful refresh after the provider that was validated has already been replaced.

Required final state:

- Keep the completed `recoveryKey` registration and prepare/prompt/resolve correlation exactly as the provider identity mechanism; do not introduce another ID, generation, lease, or queue.
- Keep `requestPermission()` and the browser/user-activation wait outside fileSystem topology serialization.
- At the service boundary, a `permissionState === 'granted'` resolution must run through the existing fileSystem `enqueueMutation()` turn so request/key validation, request deletion, provider refresh, and registered write-recovery settlement observe one stable same-runtime mounted topology.
- Ordering must be deterministic: if a topology mutation is already queued first, granted resolution runs afterward and observes the resulting missing/different request; if granted resolution is queued first, add/remove/reconnect/relocation waits until refresh/settlement completes.
- A non-granted (`denied`/`prompt`) resolution performs no provider refresh, deletion, or write settlement and does not need to hold the topology queue merely for symmetry.
- The queue must release after flushed, non-flushed, or rejected resolution work; existing safe status mapping and repository ownership remain unchanged.
- Do not fix this with a recheck after `refreshProvider()`: topology can still change while the asynchronous write-recovery handler runs.

Verification:

1. Register a current-provider readwrite request, prepare its current `recoveryKey`, and register a deterministic write-recovery handler whose Promise is held pending.
2. Start a granted `resolveFileSystemAccessRequest()` and wait until that handler has entered.
3. Queue `removeDeviceDirectory()` and then an add/replacement that can reuse the same displayed mounted name. Prove neither topology turn starts while settlement is pending.
4. Release the handler and prove granted resolution completes, then the queued topology mutations proceed in order.
5. Cover at least one non-flushed settlement result and prove the queue still releases; preserve the existing generic rejected-queue proof.
6. Queue a provider removal/replacement before a granted old-key resolution and prove the later resolution returns the existing stale/missing outcome without settlement.
7. Preserve the newly added late-registration and stale prepared-prompt read/readwrite tests, current-provider granted/denied/cancelled behavior, and all existing reconnect/relocation/settlement proof.
8. Run the canonical final `pnpm verify`.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- The latest correction's provider-currentness guard, request-owned `recoveryKey`, broker round-trip, and stale-key registry resolve behavior are accepted and should not be redesigned.
- Preventing an already prepared temporary handle from ever becoming stale before the main thread actually invokes the browser permission prompt would require cross-boundary topology leasing across user activation. PR #211 instead requires that stale registration/result is non-authoritative; the topology queue must not be held across the browser prompt.
- Previously fixed same-entry settlement atomicity, relocation ordering, marker ownership, reconnect `recoveryKey` lifetime, and committed point-in-time pending-request cleanup remain resolved.
- General stale directory-query completion ordering remains part of the separate directory/reactivity work.
- The old generic `Add Local Directory` UI was intentionally replaced by Mioframe-space create/open flows in PR #68 and has no current consumer. Legacy arbitrary mounted-directory relocation compatibility is not a new PR #211 requirement without a separate product decision.
- Persistent mounted-record IDs, a second provider-generation system, provider cancellation infrastructure, VFS route identity, repository retirement, hierarchical/cross-runtime locking, and generic multi-window mounted-record synchronization remain outside PR #211.

## Unresolved questions

None.
