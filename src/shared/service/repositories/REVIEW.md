# Review

Verdict: ready

## Scope reviewed

- Repository service state/public-boundary documentation after PR #215 unifies repository lifecycle and hides raw Observable internals from the worker client.

## Blockers

None.

## Major issues

None.

## Minor issues

### M1 — Internal projection TSDoc points UI layers at a forbidden raw Observable API

Owner: `src/shared/service/repositories`

Problem: The new `documentIds$` comment correctly says the projection is not UI-facing, but then tells UI layers to consume `repositoryState`/`repositoryState$`. The accepted contract explicitly makes `repositoryState$` service-internal and exposes only the `repositoryState` query through the worker-facing API.

Evidence:

- [repositoriesService.ts](./repositoriesService.ts) — `documentIds$` TSDoc says “consume `repositoryState`/`repositoryState$` from UI layers.”

Basis:

- [directory-state-reactivity.md](../../../../docs/directory-state-reactivity.md) — defines `repositoryState$` as an internal entry point, `repositoryState` as worker-facing, and forbids raw Observable RPC.
- [directory-state-reactivity-worker-boundary-correction.md](../../../../docs/directory-state-reactivity-worker-boundary-correction.md) — records the completed correction that specifically removed `repositoryState$` from the public worker/client surface.

Risk: The implementation is correct, but its nearest API documentation directs future consumers toward the exact boundary violation this PR corrected, increasing the chance that the raw Observable surface is re-exposed or imported from an upper layer later.

Required final state: The comment states that `documentIds$` and `repositoryState$` are same-worker service internals and directs UI-facing consumers only to the public `repositoryState` query.

Verification: Focused static/type verification for the touched service documentation is sufficient; no runtime behavior or coordinator test should change.

## Accepted risks

None.

## Items not required

- General cleanup of unrelated legacy raw `$` service members remains outside PR #215.

## Unresolved questions

None.
