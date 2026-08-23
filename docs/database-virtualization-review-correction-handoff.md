# Database virtualization review correction handoff

Status: **ready**.

This is the implementation contract for the active PR #217 review findings. It supersedes older correction documents where they conflict.

## Goal

Close the remaining inline-edit error/lifecycle proof, Database widget proof, E2E stability, and final geometry performance-proof gaps without reopening the accepted virtualization architecture.

## Non-goals

- no `useVirtualCollection`, source/query, service/worker, relation-root, Material, or shared UI redesign;
- no new edit/configuration/geometry manager, provider, registry, or second canonical state;
- no timeout inflation, retry-as-success, sleeps, force, or broad unrelated Database cleanup.

## Confirmed current behavior

- `features/databaseInlineValueEdit` owns one lifted session and serializes writes, but rejected persistence is collapsed to `false` and its cause is discarded from the feature result.
- owner-local feature tests still miss exact non-resolving cancel and a fresh second persistence operation after a completed resolve.
- Database widget tests still have false/weak keyboard, boolean, ARIA, sizing, and exact-documentId assertions.
- the combined inline-edit virtualization E2E exceeds the normal 30-second test budget on Chromium and Mobile Chrome; the same exact-head lane also shows a new repeated timeout in the historical relation-property flow.
- final S0/G1 measurement predates the current `DatabaseDataTable` bounding/mutation/update geometry path.

## Ownership

- `features/databaseInlineValueEdit`: edit session, serialized persistence, explicit persistence result, safe user feedback, and unexpected-error diagnostics.
- `entities/databaseValue`: unchanged narrow write boundary.
- Database widget: unchanged cross-feature resolve-before-view/configuration composition; no raw error ownership.
- `tests/e2e`: behavior-focused application proof and diagnosis of test-owned failures.
- `entities/databaseData`: current table geometry remains unchanged unless focused diagnosis proves a runtime defect.
- architect docs/review/PR metadata: architect-owned.

## Inline-edit failure contract

Keep the session shape `{ itemId, propertyId, initialValue, draft, resolving }`; do not add persistent error state.

`resolve()` returns one explicit discriminated result:

```ts
{ status: 'success' } | { status: 'error'; error: DomainError }
```

Rules:

- an existing `DomainError` is preserved as the result error;
- any other thrown value is wrapped once in a feature-local `DomainError` with a stable feature error code, a project-controlled safe message, and the raw thrown value as `cause`;
- the same in-flight resolution promise/result is reused for concurrent callers;
- rejection restores the exact draft with `resolving: false` and returns the error result;
- the feature shows one safe snackbar for the failed persistence operation;
- only an unexpected non-`DomainError` failure is captured through the existing diagnostics wrapper, preserving the real cause;
- no stale error is stored after the attempt; a later retry produces its own result;
- `request()` switches cells only after a successful prior resolution;
- `commit()` may expose/forward the resolution result, but error presentation/diagnostics remain feature-owned;
- widget view/configuration gating checks only the explicit success result.

## E2E proof design

Keep `tests/e2e/databaseVirtualizationFlows.spec.ts` as the single product owner, but split the oversized scenario into three behavior-focused scenarios:

1. Escape plus lifted draft survival across vertical and horizontal virtual eviction;
2. resolution before another-cell activation and explicit view switching;
3. resolution before one representative non-view configuration surface plus the distinct current-view-removal path.

Do not repeat sort/filter/properties gating in the same product test: toolbar/component proof owns exact surface routing and existing product flows own those surfaces. Preserve both Chromium and Mobile Chrome applicability.

Diagnose the repeated `databasePropertyFlows.spec.ts` relation-property timeout separately. Change production code only if evidence identifies a PR-caused runtime defect; change E2E/helper code only if evidence identifies a test-owned defect. Do not weaken the historical scenario.

## Performance proof

Do not rerun performance until all runtime/geometry corrections are finished. If focused E2E diagnosis does not require geometry changes, keep the current geometry implementation.

Then rerun only the established production S0 and G1 protocol against the final implementation: three controlled samples each, mounted row/header/cell counts, switch-to-usable timing, Long Tasks, and deep row/property/value sentinels. Full R/C matrix is not required unless S0/G1 reveals a scale-dependent regression.

## Acceptance

- failed inline persistence retains the exact draft and exposes a cause-preserving feature result with safe feedback;
- exact cancel clears without persistence; a later changed edit performs a distinct new persistence operation;
- widget tests faithfully prove real key-modifier wiring and exact boolean/ARIA/sizing/document-id contracts;
- required virtualization E2E contracts pass within the existing per-test budget on both projects and identify failures locally;
- the historical relation-property flow has no unresolved PR-caused regression;
- final S0/G1 proves the final geometry implementation without materializing the logical cross product;
- no accepted architecture boundary is broadened.

## Required verification

Use focused verifier-managed unit/mutation/E2E checks during correction and the existing task-specific S0/G1 measurement protocol after the last runtime change. Exact-head GitHub CI and merge readiness remain architect-owned.

## Forbidden

Changing mutation thresholds/config/exclusions; test-only production seams; persistent feature error store; feature-local error classifiers/synthetic safe-cause wrappers; widget-owned persistence/error handling; new generic abstractions; geometry changes without diagnostic evidence; duplicated product scenarios; timeout inflation/sleeps/force/retry acceptance; editing active `REVIEW.md`, canonical virtualization docs, performance-results docs, or PR metadata during the coding pass.

## Readiness

Required behavior, ownership, state shape, error contract, proof ownership, pass order, and performance gate are resolved.

Verdict: **ready**.
