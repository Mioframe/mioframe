# Review

Verdict: blocked

## Scope reviewed

- PR #217 dedicated Database virtualization application E2E ownership.
- Exact-head GitHub E2E run `32646599790` on `b560a4629c12cbe47ae42cd14b23f8e956cce585`.
- The large inline-edit virtualization scenario on desktop Chromium and Mobile Chrome.
- The additional current failure in the historical Database property flow.

## Blockers

### B1 — The inline-edit virtualization product scenario exceeds the normal per-test budget on both projects

Owner: `tests/e2e`

Problem: `preserves a lifted inline draft across virtual eviction and resolves it before view and configuration changes` combines cancellation, vertical eviction, horizontal eviction, previous-cell resolution, view switching, three configuration surfaces, and current-view removal in one stateful test. On the exact-head CI run it reaches the final views-sheet close path only as the normal 30-second Playwright test timeout expires. All three Chromium attempts and all three Mobile Chrome attempts fail. The evidence does not show that the close operation itself is the root cause; it shows that the scenario as a whole cannot currently complete within the repository's normal test budget.

Evidence:

- [`databaseVirtualizationFlows.spec.ts`](./databaseVirtualizationFlows.spec.ts) — one scenario owns the complete multi-stage inline-edit/eviction/view/configuration sequence.
- [`../../playwright.config.ts`](../../playwright.config.ts) — no per-test timeout override exists; CI retries are diagnostic only and `failOnFlakyTests` is enabled.
- [Exact-head verify run](https://github.com/Mioframe/mioframe/actions/runs/32646599790) — the scenario times out on every Chromium and Mobile Chrome attempt at the end of the sequence; retry logs show the close control already resolved as visible/enabled/stable before the overall timeout in some attempts.

Basis:

- [`../../AGENTS.md`](../../AGENTS.md) — split tests by behavior when setup becomes conditional or failures no longer identify one contract; known flaky behavior is failed proof; timeout inflation and retry-as-success are forbidden.
- [`../../.agents/skills/project-review/SKILL.md`](../../.agents/skills/project-review/SKILL.md) — application E2E must faithfully prove the required product contracts and missing/unstable proof remains a blocker.

Risk: the current proof cannot distinguish which sub-contract consumed the budget or failed, and exact-head CI remains red on both supported Database virtualization projects. Simply raising the timeout would conceal either an oversized proof owner or a real runtime slowdown.

Required final state: keep all required product contracts, but make each E2E proof behavior-focused enough to complete reliably within the normal budget and identify its own failure. If focused diagnosis shows a runtime/geometry slowdown rather than only scenario size, fix that production owner instead of weakening the test. Do not duplicate scenarios, inflate timeouts, add sleeps, force actions, or accept retry passes.

Verification: run the smallest focused Database virtualization E2E scope on both Chromium and Mobile Chrome with zero reliance on retry success, then require green exact-head GitHub E2E.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

- The same exact-head E2E lane also times out three times in Chromium in the pre-existing `databasePropertyFlows.spec.ts` scenario `shows relation settings during property creation and requires a related document`, waiting for the document-pane Back action near the end. That scenario passed cleanly on the recent PR #215 exact-head E2E run under the same normal budget. It is therefore not safe to dismiss the new timeout as an unrelated one-off, but the available CI log does not identify whether PR #217 introduced a runtime slowdown, whether another current interaction keeps the pane in a different state, or whether the failure has a separate cause. Diagnose this before final merge readiness; do not weaken the historical test to make the lane green.
