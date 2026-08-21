# Review

Verdict: blocked

## Scope reviewed

- Repository derivation coordinator, repository service integration, storage-policy reuse, Repo/document-id projections, and deterministic proof required by the directory-state-reactivity handoff.

## Blockers

### B1 — Repository coordinator proof does not cover all accepted lifecycle and IO invariants

Owner: `src/shared/service/repositories`

Problem: The implementation is structurally aligned with the handoff, but the required deterministic proof is incomplete. The accepted contract requires normalized-equivalent path sharing, sticky `error` through the first replacement derivation, zero duplicate canonical directory listings, and rediscovery even when a newly accepted directory listing is value-equal to the previous one. Current `repositoryState.test.ts` covers active-derivation serialization, latest-pending suppression, directory-error suppression, zero-demand abandonment, and atomic snapshots, but it does not cover normalized path sharing, the error -> replacement-derivation sticky interval, or equal-listing rediscovery. Its “zero canonical read” case mocks `getRepositoryFacts`, so it cannot prove that the real repository storage helper receives and uses the accepted listing without falling back to `vfs.readDirectory()`.

Evidence:

- [repositoryState.test.ts](./repositoryState.test.ts) — current primary coordinator proof omits normalized-equivalent path sharing, sticky error recovery, and equal-listing rediscovery; `getRepositoryFacts` is mocked in the zero-listing case.
- [repositoriesService.test.ts](./repositoriesService.test.ts) — service integration preserves Repo error/recovery and idle/reuse behavior, but does not assert normalized coordinator sharing or zero canonical `readDirectory()` during repository derivation.
- [repositoryStorageFiles.ts](./repositoryStorageFiles.ts) — the real `getRepositoryFacts` accepts a pre-read listing but still has a fallback `vfs.readDirectory(path)` path when no listing is supplied, so the no-duplicate-listing contract needs real-boundary proof rather than only a mocked call assertion.
- [directory-state-reactivity.md](../../../../docs/directory-state-reactivity.md) — repository proof explicitly requires complete lifecycle coverage, zero duplicate canonical listings, normalized-equivalent path sharing, stale/zero-demand suppression, and recovery/error behavior.

Basis:

- [directory-state-reactivity.md](../../../../docs/directory-state-reactivity.md) — these are explicit accepted repository invariants and proof requirements.
- [AGENTS.md](../../../../AGENTS.md) — required contract proof must exist before handoff; automated green checks do not substitute for missing risk-specific proof.

Risk: Regressions in normalized-path ownership, recovery-state stickiness, or canonical listing reuse could pass the current suite while reintroducing duplicate derivation/IO or prematurely clearing the recoverable error state. Equal directory emissions could also become accidentally deduplicated without a test protecting required rediscovery.

Required final state: Preserve the current two-coordinator architecture and add focused deterministic proof for: normalized-equivalent repository paths sharing one coordinator/derivation; directory `error` remaining published while the first replacement repository derivation is in flight and clearing only on accepted success (or replacement terminal directory error); accepted equal listings still causing a fresh repository derivation; and real repository derivation using the accepted directory snapshot with zero additional canonical `readDirectory()`.

Verification: Run the focused verifier-managed repository unit/service proof. Production changes are required only if these tests expose an actual defect.

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
