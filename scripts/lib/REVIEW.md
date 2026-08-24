# Review

Verdict: blocked

## Selected next correction

Implement the remaining **B2 source-of-truth correction only**.

Authoritative handoff: [`../../docs/testing/verify-mutation-impact-correction.md`](../../docs/testing/verify-mutation-impact-correction.md).

Production owner:

```text
scripts/lib/vitestTestPaths.ts
```

Existing behavioral tests are read-only constraints. No new RED/test-author pass is required because this follow-up is behavior-preserving.

Do not include B1 release-impact work in the same coding pass.

## Scope reviewed

- PR #216 verifier-modernization semantic blockers under `scripts/lib`.
- Mutation B2 implementation through `7dc95007adce210f9ab7346fd2fdfb5867ccbcf1`, including changed-path orchestration, Vitest discovery ownership, unit integration, mutation registry validation, Stryker ownership, tests, and TypeScript project inclusion.
- Existing release-impact B1 remains open.

## Blockers

### B1 — Shared release-execution runtime can silently skip release proof

Owner: `scripts/lib/releaseRisk.ts`

Problem: the release-impact planner still does not own the complete current shared command/runtime support used by real release execution.

Evidence:

- [`releaseRisk.ts`](./releaseRisk.ts) — current planner rules can let shared support paths fall through to `skip`.
- [`../release/buildArtifact.mjs`](../release/buildArtifact.mjs), [`../release/managedUpdatesProof.mjs`](../release/managedUpdatesProof.mjs), [`../release/runManagedReleaseDataCompatibilityProof.mjs`](../release/runManagedReleaseDataCompatibilityProof.mjs), and [`../playwrightContainer.ts`](../playwrightContainer.ts) consume the shared runtime.
- Current bounded support population: `commandLock.ts`, `localCommandGuard.ts`, `processResult.ts`, `runLocalCommand.ts`, `signalForward.ts`.

Basis:

- [`../../docs/testing/verify-release-impact-correction.md`](../../docs/testing/verify-release-impact-correction.md) — accepted shared release-execution ownership architecture.
- [`../../docs/testing/verify-target-architecture.md`](../../docs/testing/verify-target-architecture.md) — required proof must not silently disappear for confirmed release-sensitive ownership.

Risk: a change to release execution mechanics can pass exact-head CI without selecting the release proof it changes.

Required final state: close release-impact ownership over the complete current shared release-execution support mechanism with truthful focused consumers `artifact + build + managed-updates + release-smoke`, without broad `scripts/lib/**` fallback or a generic import graph.

Verification: fresh bounded audit/proof in `releaseRisk.test.ts`, then implementation and complete Pass E re-review per `verify-release-impact-correction.md`.

### B2 — Shared Vitest owner still duplicates the discovery contract internally

Owner: `scripts/lib/vitestTestPaths.ts`

Problem: the previous correction fixed the observable mutation/unit behavior, but `vitestTestPaths.ts` still owns the same discovery semantics twice: the `VITEST_TEST_INCLUDE` / `VITEST_TEST_EXCLUDE` glob arrays and a separately hand-written prefix/suffix/regex implementation in `isVitestOwnedTestPath()`.

Evidence:

- [`vitestTestPaths.ts`](./vitestTestPaths.ts) — config-facing globs and planner-facing predicate are independently editable representations.
- [`vitestTestPaths.test.ts`](./vitestTestPaths.test.ts) — representative behavior tests do not mechanically couple those representations.
- [`../../vitest.config.ts`](../../vitest.config.ts), [`unitRisk.ts`](./unitRisk.ts), and [`mutationTargets.ts`](./mutationTargets.ts) consume different public surfaces from the shared owner.

Basis:

- [`../../docs/testing/verify-mutation-impact-correction.md`](../../docs/testing/verify-mutation-impact-correction.md) — one local declarative rule population must mechanically drive the glob exports and predicate.
- [`../../AGENTS.md`](../../AGENTS.md) — avoid duplicated ownership logic and prefer the minimum complete source of truth.

Risk: a future Vitest discovery edit can update real config discovery while unit/mutation classification remains stale, recreating the ownership drift this correction exists to remove.

Required final state: one narrow local declarative rule population in `vitestTestPaths.ts` mechanically derives `VITEST_TEST_INCLUDE`, `VITEST_TEST_EXCLUDE`, and `isVitestOwnedTestPath()`, with no behavior change and no generic discovery framework/dependency.

Verification: keep existing behavioral tests unchanged and green; focused type/static checks pass; architect verifies the duplicate representation is actually removed.

Resolved parts of the original B2 are not findings anymore: canonical deleted/rename identity reaches mutation planning; real `.test.mjs` ownership is accepted; invalid external `.test.ts` is rejected; `vitest.config.ts` and `vitestTestPaths.ts` select all mutation targets; `vitestTestPaths.ts` selects full unit; seven mutation targets/Stryker mutate surface are unchanged; the `tsconfig.node.json` include is justified.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- No new RED phase or test-author pass is required for the remaining B2 correction.
- No generic glob engine, test registry, dependency graph, or cross-lane abstraction is required.
- Benchmark execution remains deferred until semantic blockers are closed and a new full PR semantic review is clean.

## Unresolved questions

None.
