# Database virtualization final proof correction handoff

Status: **ready**.

This contract owns only the remaining PR #217 proof/verification work after the accepted review correction.

## Goal

Close the remaining semantic-test fidelity, exact-head static, and current-geometry performance blockers without changing accepted runtime architecture.

## Confirmed current state

- Inline-edit error semantics, retry/serialization, widget gating, E2E decomposition, and the historical property-flow test-state fix are accepted.
- `src/features/databaseInlineValueEdit/REVIEW.md` has two remaining proof/static findings: raw-cause identity and two ignored `commit()` promises.
- `src/widgets/DocumentView/Database/REVIEW.md` has one remaining boolean dependency-wiring proof gap.
- `tests/e2e/REVIEW.md` has one unused-binding oxlint failure.
- Current S0/G1 acceptance is open because the accepted measurement predates the current `DatabaseDataTable` geometry implementation.

## Non-goals

- no runtime, geometry, virtualization, service/worker, entity API, or widget behavior change unless the final S0/G1 measurement exposes a real regression;
- no new permanent benchmark/test infrastructure;
- no unrelated lint cleanup.

## Ownership

- `features/databaseInlineValueEdit`: focused lifecycle/error proof only;
- Database widget: focused boolean dependency-wiring proof only;
- `tests/e2e`: remove the unused binding only; keep the accepted three-scenario decomposition unchanged;
- performance evidence: task-specific S0/G1 production measurement against the final runtime head.

## Minimum sufficient design

1. In the raw-failure feature test, reject with a named `rawError` and assert `result.error.cause === rawError`.
2. Await/assert both `commit()` results currently rejected by `no-floating-promises`; do not suppress or discard the result.
3. Make mocked `toggleBoolean` return a value distinguishable from a direct toggle of the stored input and assert every activation persists that exact mock result.
4. Remove the unused `fixture` destructuring from the third virtualization E2E scenario.
5. Run the required focused verifier-managed checks before reporting completion.
6. Reproduce the established S0/G1 task-specific production measurement with a temporary, non-committed runner/spec based on existing Playwright/E2E helpers. Remove it before handoff.

## Performance acceptance

For S0 (100×8) and G1 (30,000×300), collect three fresh Chromium samples each using the established production Vite build/preview, 640×480 viewport, real short-view → Full-view action, MessageChannel yield, first rAF, switch-to-usable, Long Tasks, mounted rows/headers/cells, and deep final row/property/value sentinels.

G1 must keep mounted expensive work bounded and must not materialize 9,000,000 logical intersections. Treat the existing `68a71e89...` results as comparison baseline only.

If S0/G1 exposes a material regression, stop and report it; do not redesign geometry in this pass.

## Acceptance

- all active semantic/static review findings above are closed;
- required focused `pnpm verify --only ...` commands pass;
- temporary measurement tooling is absent from the final diff;
- six S0/G1 samples and exact measured head/environment are reported;
- no runtime/geometry source changed unless returned as a blocker for architecture review.

## Forbidden

Direct `vitest`, `playwright`, `eslint`, or `oxlint` invocation for the required verification checks; rule suppression; `void` merely to silence a meaningful `commit()` result; timeout inflation; sleeps; force; retry-as-success; mutation/config weakening; production test seams; committed benchmark framework; unrelated cleanup; edits to `REVIEW.md`, canonical virtualization docs, performance-results docs, or PR metadata.

Implementation readiness: **ready**. Unresolved architecture decisions: **none**.
