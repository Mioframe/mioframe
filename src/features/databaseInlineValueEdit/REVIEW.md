# Review

Verdict: blocked

## Scope reviewed

- PR #217 feature-owned inline-edit lifecycle after the review correction.
- Explicit success/error resolution, cause preservation, feedback/diagnostics, serialization, retry, cancel, and focused tests.

## Blockers

### B1 — Raw persistence-cause identity is implemented but not faithfully proved

Owner: `src/features/databaseInlineValueEdit`

Problem: the implementation correctly wraps a non-`DomainError` persistence rejection with the original thrown value as `DomainError.cause`, but the focused test only asserts that `cause` is some `Error`. It would still pass if the implementation replaced the original thrown object with a different `Error`, which violates the accepted cause-preservation contract.

Evidence:

- [`useDatabaseInlineEditSession.ts`](./useDatabaseInlineEditSession.ts) passes the caught `cause` directly into the feature-local `DomainError`.
- [`useDatabaseInlineEditSession.test.ts`](./useDatabaseInlineEditSession.test.ts) checks `cause: expect.any(Error)` / `toBeInstanceOf(Error)` rather than identity with the rejected object.

Required final state: reject with a named raw error object and assert that the returned feature error has `cause === rawError`. Keep the existing exact `DomainError` preservation, recoverable draft, single feedback/diagnostic emission, independent retry, cancel, and fresh-resolution proofs.

Verification: focused feature unit test and existing mutation target.

### B2 — Exact-head oxlint rejects two unhandled `commit()` promises in the focused test

Owner: `src/features/databaseInlineValueEdit`

Problem: `commit()` now intentionally returns the explicit resolution result, but two test calls ignore the returned promise. Exact-head CI run `32661076560` reports `typescript(no-floating-promises)` at the two calls.

Required final state: await/assert the returned results where the test exercises wrong-cell and exact-cell commit behavior; do not suppress the rule or use a meaningless `void` when the result is part of the contract being tested.

Verification: focused oxlint plus the feature unit test.

## Major issues

None. The previous persistence-error semantic defect is resolved: failure is explicit, the original `DomainError` is preserved, raw failures are wrapped with a feature-local stable code and raw cause, draft recovery remains exact, feedback is feature-owned, and retry/serialization behavior is preserved.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
