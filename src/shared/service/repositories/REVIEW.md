# Review

Verdict: blocked

## Scope reviewed

- `repositoryState.ts` repository lifecycle handling after directory error and during replacement derivation.
- Canonical directory/repository lifecycle contract in `docs/directory-state-reactivity.md`.

## Blockers

### B1 — Directory `reading` can clear sticky repository error before recovery succeeds

Owner: `src/shared/service/repositories`

Problem: after a directory error has published `RepositoryState.error`, a replacement `ready` may start a repository derivation while that error remains visible. If another directory invalidation publishes `reading` before the replacement derivation succeeds, `handleDirectoryState()` calls `publishLoadingLike()`, which can replace the sticky error with `loading` or `refreshing(previousSnapshot)`. No accepted replacement repository snapshot exists yet, so recovery is reported prematurely.

Evidence:

- [`repositoryState.ts`](./repositoryState.ts) — `handleDirectoryState()` handles every `reading` by calling `publishLoadingLike()`; `publishLoadingLike()` derives public state from `previousSnapshot` rather than preserving an already-published error.
- [`../../../../docs/directory-state-reactivity.md`](../../../../docs/directory-state-reactivity.md) — repository lifecycle requires an error to remain visible while replacement derivation is pending and now defines the complete transition precedence explicitly.

Basis:

- [`../../../../docs/directory-state-reactivity.md`](../../../../docs/directory-state-reactivity.md) — canonical repository lifecycle contract: directory retry/invalidation cannot clear a repository error; only a newer directory error or an accepted successful repository derivation may replace it.
- [`../../../../.agents/skills/crdt-storage/SKILL.md`](../../../../.agents/skills/crdt-storage/SKILL.md) — lifecycle changes must define and prove the applicable state-transition matrix and preserve recoverable error-as-state behavior.

Risk: recovery UI can disappear and the repository can regress to loading or retained-content refresh state even though no replacement repository snapshot has been accepted. Repeated invalidation can therefore expose stale or misleading lifecycle state.

Required final state: implementation matches the canonical transition matrix. While `RepositoryState` is `error(E)`, directory `reading` and `ready`/replacement-derivation start preserve `error(E)`; a newer directory error may publish `error(E2)`, and only an accepted successful repository derivation may publish `ready(snapshot)`. Normal `ready -> reading -> refreshing` behavior remains unchanged.

Verification: deterministic repository coordinator tests must cover the complete directory-to-repository transition matrix, including `error -> ready/replacement derivation pending -> reading`, stale/non-publishable settlement, newer-error replacement, and normal `ready -> reading -> refreshing` continuity.

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
