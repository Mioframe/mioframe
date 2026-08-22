# Review

Verdict: blocked

## Scope reviewed

- PR #216 verifier modernization: changed-path classification, unit impact, application E2E discovery/applicability, Storybook behavior/visual selection, mutation targets, release impact, verifier output, CI topology, and agent workflow contracts.
- Current implementation and tests at the reviewed PR head, plus the relevant repository rules and canonical testing documentation.

## Blockers

### B1 — `artifact` can be terminated before its owning Playwright container deadline

Owner: `scripts/verify.ts`

Problem: the `artifact` release-impact check is a Playwright-container-backed command (`pnpm e2e:release --label artifact ...` -> `scripts/e2eReleaseContainer.mjs` -> `runPlaywrightInContainer`), but `COMMAND_TIMEOUT_MS_BY_LABEL.artifact` is fixed at 8 minutes while the canonical Playwright container hard timeout is 15 minutes. `resolvePlaywrightCommandTimeoutMs()` explicitly defines the outer verifier contract as the container timeout plus orchestration allowance so the verifier cannot kill a still-valid Playwright run before the container reports its own result. The current test suite incorrectly excludes `artifact` from `playwrightBackedLabels` and instead asserts that its 8-minute fixed limit is an unrelated unchanged timeout.

Evidence:

- [`verify.ts`](./verify.ts) — `resolvePlaywrightCommandTimeoutMs`, `COMMAND_TIMEOUT_MS_BY_LABEL`, and `RELEASE_CHECK_COMMANDS`: the documented outer-timeout invariant is applied to `release-smoke` but not to `artifact`, even though both use `pnpm e2e:release`.
- [`e2eReleaseContainer.mjs`](./e2eReleaseContainer.mjs) — the release command delegates to the shared Playwright container runner and does not establish a smaller artifact-specific container deadline.
- [`../config/tooling.json`](../config/tooling.json) — `verification.playwrightContainer.timeoutSeconds` is `900` seconds.
- [`verify.test.ts`](./verify.test.ts) — `COMMAND_TIMEOUT_MS_BY_LABEL` tests classify `artifact` under `unrelatedLabelsWithFixedLimits` and omit it from `playwrightBackedLabels`, so the proof cannot reject this mismatch.
- [`../.github/workflows/verify.yml`](../.github/workflows/verify.yml) — this PR's dedicated `verification-release` job now runs `pnpm verify --verbose --only release-impact`, making the affected `artifact` command part of the ordinary source-impact merge gate when selected.

Basis:

- [`../docs/testing/architecture.md`](../docs/testing/architecture.md) — automatic verification must execute the faithful owning proof and remain reliable rather than substituting or truncating the owning proof environment.
- [`../docs/testing/verify-target-architecture.md`](../docs/testing/verify-target-architecture.md) — `pnpm verify` owns deterministic, fail-closed selection/execution of the existing proof lanes; release impact reuses the existing release checks rather than weakening their execution contract.
- [`verify.ts`](./verify.ts) — `resolvePlaywrightCommandTimeoutMs()` documents the concrete invariant that an outer verifier deadline must stay strictly greater than the canonical container timeout so a completed Playwright run is not killed before it can report normally.

Risk: a valid artifact proof that takes between 8 and 15 minutes can be killed by `verify` before its own bounded Playwright container deadline. This creates a false merge-gate failure and can replace the owning container's normal result/diagnostics with an outer verifier timeout. The new release-impact CI topology therefore does not preserve the existing Playwright proof execution contract for `artifact`.

Required final state: every release-impact check that delegates to the shared Playwright container runner must have an outer verifier timeout compatible with that runner's canonical deadline. For `artifact`, the outer deadline must not preempt the 15-minute container deadline unless the project defines and enforces a separate artifact-owned inner deadline that is strictly smaller. The timeout tests must classify `artifact` according to its real execution path, and the `verification-release` job timeout envelope must remain sufficient after correction.

Verification: add/adjust focused verifier tests so `artifact` is recognized as Playwright-container-backed and its outer timeout is strictly greater than `verification.playwrightContainer.timeoutSeconds`; keep the release-job timeout-envelope assertion valid with the corrected value; then require exact-head `verification-release` and aggregate `verify` CI success.

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
