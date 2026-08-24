# Review

Verdict: blocked

## Scope reviewed

- PR #216 verifier-modernization semantic blockers under `scripts/lib`.
- Mutation B2 implementation at `7dc95007adce210f9ab7346fd2fdfb5867ccbcf1`, including changed-path orchestration, Vitest discovery ownership, unit integration, mutation registry validation, Stryker ownership, tests, and TypeScript project inclusion.
- Existing release-impact B1 remains open and was not reimplemented in the mutation pass.

## Blockers

### B1 — Shared release-execution runtime can silently skip release proof

Owner: `scripts/lib/releaseRisk.ts`

Problem: the release-impact planner still does not own the complete current shared command/runtime support used by real release execution.

Evidence:

- [`releaseRisk.ts`](./releaseRisk.ts) — current planner rules can let the shared support paths fall through to `skip`.
- [`../release/buildArtifact.mjs`](../release/buildArtifact.mjs), [`../release/managedUpdatesProof.mjs`](../release/managedUpdatesProof.mjs), [`../release/runManagedReleaseDataCompatibilityProof.mjs`](../release/runManagedReleaseDataCompatibilityProof.mjs), and [`../playwrightContainer.ts`](../playwrightContainer.ts) — real release execution consumes the shared runtime.
- Current bounded support population: `commandLock.ts`, `localCommandGuard.ts`, `processResult.ts`, `runLocalCommand.ts`, `signalForward.ts`.

Basis:

- [`../../docs/testing/verify-release-impact-correction.md`](../../docs/testing/verify-release-impact-correction.md) — accepted shared release-execution ownership architecture.
- [`../../docs/testing/verify-target-architecture.md`](../../docs/testing/verify-target-architecture.md) — required proof must not silently disappear for confirmed release-sensitive ownership.

Risk: a change to release execution mechanics can pass exact-head CI without selecting the release proof it changes.

Required final state: close release-impact ownership over the complete current shared release-execution support mechanism with truthful focused consumers `artifact + build + managed-updates + release-smoke`, without broad `scripts/lib/**` fallback or a generic import graph.

Verification: fresh bounded audit/proof in `releaseRisk.test.ts`, then implementation and complete Pass E re-review per `verify-release-impact-correction.md`.

### B2 — Shared Vitest owner still duplicates the discovery contract internally

Owner: `scripts/lib/vitestTestPaths.ts`

Problem: the mutation correction fixed changed-path identity and moved Vitest discovery ownership into one module, but that module still contains two independently editable representations of the same contract: `VITEST_TEST_INCLUDE` / `VITEST_TEST_EXCLUDE` arrays and a separately hard-coded imperative `isVitestOwnedTestPath()` predicate. The accepted architecture requires those public surfaces to derive from one local rule definition.

Evidence:

- [`vitestTestPaths.ts`](./vitestTestPaths.ts) — glob arrays are declared independently from the prefix/suffix/regex branches in `isVitestOwnedTestPath()`.
- [`vitestTestPaths.test.ts`](./vitestTestPaths.test.ts) — tests assert the arrays and representative predicate outcomes separately; they do not establish mechanical coupling between the two representations.
- [`../../vitest.config.ts`](../../vitest.config.ts), [`unitRisk.ts`](./unitRisk.ts), and [`mutationTargets.ts`](./mutationTargets.ts) consume different public surfaces from this shared owner, so internal drift would again split real Vitest discovery from planner/registry ownership.

Basis:

- [`../../docs/testing/verify-mutation-impact-correction.md`](../../docs/testing/verify-mutation-impact-correction.md) — the include/exclude exports and predicate must be mechanically derived from one local rule population.
- [`../../AGENTS.md`](../../AGENTS.md) — do not duplicate non-trivial constants/ownership logic; prefer the minimum complete source of truth.

Risk: a future Vitest discovery change can update the config-facing glob list while leaving unit/mutation path classification stale, recreating the same ownership drift this correction was intended to remove.

Required final state: one narrow local declarative rule population in `vitestTestPaths.ts` mechanically drives both the existing glob exports and `isVitestOwnedTestPath()`, with no behavior change and no generic discovery framework.

Verification: existing `vitestTestPaths.test.ts` public-behavior proof remains green; focused type/static checks pass; architect verifies the duplicate representation is actually removed rather than merely colocated.

Resolved parts of the original B2 are not findings anymore: canonical deleted/rename identity reaches mutation planning; real `.test.mjs` ownership is accepted; invalid external `.test.ts` is rejected; `vitest.config.ts` and `vitestTestPaths.ts` select all mutation targets; `vitestTestPaths.ts` selects full unit; seven mutation targets/Stryker mutate surface are unchanged. The `tsconfig.node.json` include addition is justified by the new `vitest.config.ts` import.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- No new RED phase is required for B2: the remaining correction is behavior-preserving and existing public-contract tests already cover the intended outputs.
- No generic glob engine, test registry, dependency graph, or cross-lane abstraction is required.
- Benchmark execution remains deferred until semantic blockers are closed and a new full PR semantic review is clean.

## Unresolved questions

None.
