# Review

Verdict: blocked

## Scope reviewed

- `repositoryState.ts` repository lifecycle handling after directory error and during replacement derivation.
- Existing repository-state lifecycle tests and the canonical directory/repository lifecycle contract.

## Blockers

### B1 — Repeated invalidation can clear a sticky repository error before replacement success

Owner: `src/shared/service/repositories`

Problem: after a directory error publishes `RepositoryState.error`, a clean directory retry can publish `ready` and start a replacement repository derivation while the repository error correctly remains visible. If the directory is invalidated again before that derivation succeeds, the filesystem publishes `reading`; `handleDirectoryState()` then calls `publishLoadingLike()`, which replaces the current error with `loading` or `refreshing(previousSnapshot)`. No replacement repository snapshot has been accepted, so the repository reports recovery too early.

Evidence:

- [`repositoryState.ts`](./repositoryState.ts) — every directory `reading` calls `publishLoadingLike()`, which derives state only from `previousSnapshot` and does not preserve an already-current `RepositoryState.error`.
- [`../fileSystem/directoryState.ts`](../fileSystem/directoryState.ts) — retry while directory state is `error` runs without publishing `reading`; after a clean `ready` result, a later invalidation does publish `reading`, so `error -> ready/replacement derivation pending -> reading` is a real production sequence.
- [`repositoryState.test.ts`](./repositoryState.test.ts) — existing proof covers sticky error through one replacement derivation and newer-error supersession, but does not cover a second `reading` invalidation while that replacement derivation is pending.

Basis:

- [`../../../../docs/directory-state-reactivity.md`](../../../../docs/directory-state-reactivity.md) — the accepted repository lifecycle requires a directory error to remain visible while replacement repository derivation is pending and forbids clearing recoverable error state merely because retry/invalidation activity began. The explicit precedence table clarifies this existing contract; it does not introduce a new lifecycle owner or state mechanism.
- [`../../../../.agents/skills/crdt-storage/SKILL.md`](../../../../.agents/skills/crdt-storage/SKILL.md) — recoverable subscription state must remain recoverable and applicable lifecycle transitions require focused proof.

Risk: repository error/recovery UI can disappear and regress to a spinner or retained stale content even though no replacement repository snapshot has succeeded. Repeated invalidation can therefore present a false recovery state.

Required final state: while the current `RepositoryState` is `error(E)`, directory `reading` during the pending recovery attempt must preserve `error(E)`. A newer canonical directory error may replace it, and an accepted successful repository derivation may replace it with `ready(snapshot)`. Normal non-error `ready -> reading -> refreshing` behavior must remain unchanged. No new lifecycle state, flag, generation, token, lease, or coordinator is required.

Verification: add deterministic coordinator proof for the missing sequence: establish a prior snapshot, publish directory `error(E)`, start a replacement derivation from `ready`, publish `reading` before it settles, and prove the same error remains visible and the stale/non-publishable settlement cannot clear it; then accept a newer ready input and prove replacement success reaches `ready`. Keep the already-accepted newer-error and normal `ready -> reading -> refreshing` proofs intact.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Redesigning the repository state machine or introducing additional recovery state is not required.
- Reworking already-accepted repository lifecycle tests outside the missing transition is not required.

## Unresolved questions

None.
