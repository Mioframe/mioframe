# Directory state reactivity — sticky repository error correction

Status: **completed; correction passed semantic re-review**.

This record closes one implementation defect discovered after the earlier semantic review of PR #215. It does not reopen or extend the accepted two-coordinator architecture.

## Problem

After a canonical directory error, repository recovery could start a replacement derivation and then receive another directory `reading` invalidation before that derivation settled. The repository coordinator invalidated the derivation correctly, but `publishLoadingLike()` could replace the still-current `RepositoryState.error` with `loading` or `refreshing(previousSnapshot)` before any replacement repository snapshot had succeeded.

## Final state

The repository coordinator now uses the existing current `RepositoryState` as the source of truth for error precedence:

- directory `reading` still makes an active derivation non-publishable;
- pending ready input is still cleared on that invalidation;
- when the current repository state is `error(E)`, `reading` leaves `error(E)` published;
- a newer canonical directory error may replace it;
- an accepted successful replacement derivation may recover to `ready(snapshot)`;
- normal non-error `ready -> reading -> refreshing` behavior is unchanged.

No new state field, flag, generation, token, lease, manager, coordinator, cache, public contract, worker API, or recovery mechanism was introduced.

## Implementation

Changed only:

- `src/shared/service/repositories/repositoryState.ts`;
- `src/shared/service/repositories/repositoryState.test.ts`.

The production correction is limited to suppressing `publishLoadingLike()` for a directory `reading` event while the already-published repository state is `error`.

## Proof

The focused coordinator test now proves the complete missing sequence:

1. establish an accepted repository snapshot;
2. publish directory `error(E)`;
3. start replacement derivation from a newer `ready` while `error(E)` remains current;
4. publish directory `reading` before settlement;
5. prove `error(E)` remains current;
6. settle the now-stale derivation and prove it cannot clear the error;
7. accept a newer directory `ready`;
8. complete its derivation successfully;
9. prove final `ready(snapshot)` recovery.

Existing proofs for normal refreshing, first replacement retry, newer-error supersession, stale suppression, and derivation serialization remain unchanged.

Coding-agent focused verification passed:

```text
pnpm verify --only unit-tests --files src/shared/service/repositories/repositoryState.test.ts
pnpm verify --only type-check --files src/shared/service/repositories/repositoryState.ts src/shared/service/repositories/repositoryState.test.ts
pnpm verify --only oxlint --files src/shared/service/repositories/repositoryState.ts src/shared/service/repositories/repositoryState.test.ts
```

Semantic re-review found no additional blocker, major issue, minor issue, or accepted risk from this correction. Exact-head GitHub CI remains the architect-owned final automatic merge gate.
