# Directory state reactivity — sticky repository error correction

Status: **ready for implementation; one repository lifecycle blocker remains**.

This correction closes one implementation deviation discovered after the completed semantic review of PR #215. It does not reopen the accepted two-coordinator architecture, ownership, public API, worker boundary, storage policy, Repo lifecycle, or #211 recovery design.

## Authority

- `docs/directory-state-reactivity.md` remains the architecture source of truth.
- `docs/directory-state-reactivity-implementation-preflight.md` remains the implementation scope/ownership record.
- `src/shared/service/repositories/REVIEW.md` contains the active evidence-backed finding.

## Problem

The accepted repository lifecycle requires a canonical directory error to remain visible while repository recovery is still pending.

The current repository coordinator preserves `error(E)` when a clean directory retry publishes `ready` and starts replacement derivation. However, if the directory is invalidated again before that derivation succeeds, the filesystem publishes `reading` and the repository coordinator currently calls `publishLoadingLike()`. That can replace the current error with `loading` or `refreshing(previousSnapshot)` before any replacement repository snapshot has been accepted.

The production sequence is therefore:

1. repository has `error(E)`;
2. directory retry succeeds with `ready(entries)`;
3. replacement repository derivation starts while `error(E)` remains visible;
4. directory is invalidated again and publishes `reading`;
5. current implementation clears `error(E)` prematurely.

## Required final state

While current `RepositoryState` is `error(E)`:

- directory `reading` preserves `error(E)` and invalidates any active derivation;
- accepted directory `ready(entries)` may start/queue replacement derivation but does not itself clear `error(E)`;
- a newer canonical directory error may publish `error(E2)`;
- only an accepted successful repository derivation may replace the error with `ready(snapshot)`.

Normal non-error behavior remains unchanged:

- `loading + reading` remains loading;
- `ready(S) + reading` becomes `refreshing(S)`;
- `refreshing(S) + reading` remains refreshing;
- stale/non-publishable derivation completion never publishes.

## Architecture decision

Use the existing current `RepositoryState` as the source of truth for error precedence.

No new lifecycle state, boolean flag, generation, token, lease, retry manager, coordinator, cache, or public contract is required.

The correction belongs only to `src/shared/service/repositories`.

Expected production scope:

- `src/shared/service/repositories/repositoryState.ts`

Expected proof scope:

- `src/shared/service/repositories/repositoryState.test.ts`

No other production file is expected to change.

## Proof

Add deterministic coordinator proof for the missing sequence:

1. establish an accepted repository snapshot;
2. publish directory `error(E)` and prove repository state is `error(E)`;
3. publish replacement directory `ready(entries)` and prove replacement derivation starts while `error(E)` remains current;
4. before that derivation settles, publish directory `reading`;
5. prove the same `error(E)` remains current and the in-flight derivation is non-publishable;
6. settle that stale derivation and prove it does not clear the error;
7. publish a newer accepted directory `ready(entries)`;
8. complete its replacement derivation successfully and prove the repository reaches `ready(snapshot)`.

Retain existing proof for:

- normal `ready -> reading -> refreshing` behavior;
- sticky error during the first replacement derivation;
- newer directory error superseding the previous error;
- stale completion suppression;
- derivation concurrency/latest-pending behavior.

## Verification

Use focused verifier-managed feedback only when useful:

```text
pnpm verify --only unit-tests --files src/shared/service/repositories/repositoryState.test.ts
pnpm verify --only type-check --files src/shared/service/repositories/repositoryState.ts src/shared/service/repositories/repositoryState.test.ts
pnpm verify --only oxlint --files src/shared/service/repositories/repositoryState.ts src/shared/service/repositories/repositoryState.test.ts
```

Exact-head GitHub CI remains architect-owned after semantic re-review.

## Forbidden

- Do not redesign either coordinator.
- Do not modify filesystem coordinator behavior.
- Do not add state fields, flags, generations, tokens, leases, managers, schedulers, or retry registries.
- Do not change `RepositoryState` or `DirectoryState` contracts.
- Do not change worker/public API or `setupMainService`.
- Do not change repository storage discovery/classification/concurrency.
- Do not change Repo cache/lifetime or DocumentService.
- Do not change #211 recovery/topology behavior, VFS, providers, or Google Drive behavior.
- Do not weaken or replace already-accepted lifecycle tests.
- Do not add sleeps, polling, timeout inflation, or test-only production hooks.
- Do not edit `REVIEW.md`, architecture docs, PR metadata, CI, or release state from the coding pass.
