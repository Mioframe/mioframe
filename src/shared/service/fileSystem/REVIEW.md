# Review

Verdict: blocked

## Scope reviewed

- Complete PR #211 local-directory provider lifecycle: provider creation/replacement, permission detection/registration, prepare/browser-prompt/resolve, mounted-topology serialization, repository settlement, unavailable-root reconnect/relocation, serviceClient boundary, feature consumers, diagnostics/privacy, and proof ownership.

## Blockers

### B1 — granted permission settlement is outside the topology-stability boundary

Owner: `src/shared/service/fileSystem`

Problem: the current implementation correctly protects late provider registration and stale prepared permission prompts with the existing provider `recoveryKey`, but `resolveFileSystemAccessRequest` still delegates directly to `registry.resolve`. After a matching `permissionState: 'granted'` request is accepted, registry resolution deletes the request, awaits provider refresh, and may await repository write settlement without holding the existing fileSystem topology queue.

Evidence:

- [File-system service](useFileSystemService.ts) — `addDeviceDirectory`, `removeDeviceDirectory`, same-entry reconnect, and confirmed relocation use one `enqueueMutation()` queue, while `resolveFileSystemAccessRequest` is still exposed directly as `registry.resolve`.
- [Access-request registry](fileSystemAccessRequestRegistry.ts) — matching granted resolution performs request deletion, `await refreshProvider()`, and write-recovery-handler execution after the identity check.
- [Repository service](../repositories/repositoriesService.ts) — write recovery settles cached repositories by textual VFS `mountPath` through pending-save flush and `repo.flush()`.
- [VFS adapter](../../lib/automergeAdapter/createVFSAdapter.ts) and [device provider](../../lib/deviceFileSystemProvider/DeviceFileSystemProvider.ts) — repository IO resolves the provider currently mounted for the textual path.

Basis:

- [File-system rules](AGENTS.md) — fileSystem owns provider/VFS/mounted-directory lifecycle alignment and provider recovery state.
- [Architecture handoff](../../../../docs/local-directory-access-recovery.md) — provider lifecycle invariant 4 requires stable topology through bounded service-side work that depends on the mounted path; granted resolution is explicitly such a boundary.
- [Testing architecture](../../../../docs/testing/architecture.md) — data-safety/concurrency contracts require faithful risk-specific proof; green verification alone is insufficient.

Risk: provider A can be current when its permission grant is accepted, then a same-runtime topology mutation can remove/reassign the mounted path while cached repository writes are still settling. Remaining path-based writes can then resolve against another provider.

Required final state:

- Keep the completed provider `recoveryKey` registration and prepare/prompt/resolve correlation unchanged.
- Keep browser `requestPermission()` outside topology serialization.
- Every service-side resolution attempt with `permissionState: 'granted'` must enter the existing fileSystem topology queue before request lookup/key validation. The queued turn then delegates to the existing registry resolution so request/key validation, request deletion, provider refresh, and registered write settlement complete within one topology-stable turn. Do not pre-check request existence or `recoveryKey` outside the queue.
- If a topology mutation is already queued first, it commits first and the later old-key resolve observes the resulting missing/stale request from inside its own queued turn.
- If granted resolution enters first, queued add/remove/reconnect/relocation waits for refresh/settlement completion.
- `denied`/`prompt` resolution remains outside the queue because it does not delete, refresh, settle, or mutate topology.
- Queue failure handling remains unchanged: later turns must continue after flushed, non-flushed, or rejected resolution work.
- Recovery topology stability ends when this service resolution returns. Do not carry a queue/lease across the browser prompt or across a later feature retry; that retry is a new ordinary VFS/repository command under existing current-path semantics.

Verification:

1. Register/prepare a current readwrite request, start granted resolution, and hold its write-recovery handler pending; prove queued remove/add/reconnect/relocation cannot start topology work until settlement releases.
2. Prove queue release after a non-flushed result and after a rejecting handler path without poisoning later topology work.
3. Queue provider removal/replacement first, then old-key granted resolution; prove resolution returns `missing` and runs no refresh/write settlement.
4. Preserve the existing late-registration and stale prepared-prompt tests for read/readwrite, current grant/deny/cancel behavior, same-entry settlement, relocation ordering, provider replacement cleanup, and failed-persistence preservation.
5. Run canonical final `pnpm verify`.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Provider-currentness guard on `onAccessRequired`, request-owned `recoveryKey`, broker key round-trip, and stale-key registry resolution are accepted and must not be redesigned.
- Recovery topology stability ends when the recovery call returns. A later feature retry is an ordinary new VFS/repository command using current path semantics; binding arbitrary feature work to historical provider identity would require a broader VFS lease/route-identity contract and is outside PR #211.
- `cancelFileSystemAccessRequest` has no current production consumer; no new identity/cancellation protocol is required for it in this PR.
- General stale directory-query completion, generic cached-Repo behavior after future textual-path reuse, provider cancellation, persistent IDs, VFS route identity, hierarchical/cross-runtime locking, and multi-window mounted-record synchronization remain separate architecture concerns.

## Unresolved questions

None.
