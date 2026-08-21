# Review

Verdict: blocked

## Scope reviewed

- Reactive directory coordinator implementation, service wiring, #211 topology ownership, and deterministic proof required by the directory-state-reactivity handoff.

## Blockers

### B1 — Missing proof that reactive directory reads stay outside the topology queue

Owner: `src/shared/service/fileSystem`

Problem: The accepted architecture requires proof that #211 topology serialization does not extend to reactive directory invalidation/rereads. `directoryState.test.ts` proves the coordinator in isolation, while `useFileSystemService.test.ts` proves topology mutations serialize with each other, but there is no integration proof that a `directoryState$` invalidation can start and settle while a topology mutation/recovery-settlement turn is held pending.

Evidence:

- [directoryState.test.ts](./directoryState.test.ts) — coordinator tests use a narrow standalone `DirectoryReadSource`, so they cannot detect accidental coupling to `enqueueMutation` in `useFileSystemService`.
- [useFileSystemService.ts](./useFileSystemService.ts) — the directory coordinator and the #211 `mutationQueueTail` coexist in the same service and must remain independent.
- [directory-state-reactivity.md](../../../../docs/directory-state-reactivity.md) — the acceptance proof explicitly requires “#211 invalidation without topology-queue extension”.

Basis:

- [directory-state-reactivity.md](../../../../docs/directory-state-reactivity.md) — the approved architecture makes topology-queue independence a required filesystem invariant and proof item.
- [AGENTS.md](../../../../AGENTS.md) — required contract proof must exist before handoff; green verification does not replace missing risk-specific proof.

Risk: A later or accidental wiring change could serialize reactive reads behind long reconnect/write-recovery topology work while all current coordinator and topology tests still pass, reintroducing stale/slow directory behavior in the exact recovery path this architecture must keep independent.

Required final state: Keep the current ownership unchanged and add deterministic service-level proof that, while a topology mutation/recovery settlement holds the queue, a matching reactive directory invalidation/reread is not queued behind it and can publish its clean result independently.

Verification: Run the focused verifier-managed unit proof for the filesystem service/coordinator. No browser proof is required.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
