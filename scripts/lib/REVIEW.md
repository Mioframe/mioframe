# Review

Verdict: blocked

## Scope reviewed

- Full PR #216 verifier-modernization semantic review against current repository rules and target architecture.
- Specialized impact planners, verifier orchestration/output, release execution inventory, real release execution dependencies, CI topology, and changed proof/workflow guidance.

## Blockers

### B1 — Shared release-execution runtime can silently skip release proof

Owner: `scripts/lib/releaseRisk.ts`

Problem: the source-impact release planner owns the top-level release runners and production-build inputs, but it does not own the current shared repository runtime used by those runners. A change to that shared execution runtime can therefore resolve `skip` even though it changes how real `build`, `artifact`, `release-smoke`, or `managed-updates` checks execute.

Evidence:

- [`releaseRisk.ts`](./releaseRisk.ts) — current exact/full/build/fixture/runtime rules do not classify the shared command-runtime files below, so they fall through to the final `skip` result.
- [`../release/buildArtifact.mjs`](../release/buildArtifact.mjs) — the real release build imports `localCommandGuard.ts`, `processResult.ts`, and `runLocalCommand.ts`.
- [`../release/managedUpdatesProof.mjs`](../release/managedUpdatesProof.mjs) and [`../release/runManagedReleaseDataCompatibilityProof.mjs`](../release/runManagedReleaseDataCompatibilityProof.mjs) — managed-update release execution imports `runLocalCommand.ts` and process-result handling.
- [`../playwrightContainer.ts`](../playwrightContainer.ts) — the release Playwright container path imports `localCommandGuard.ts`, `processResult.ts`, and `runLocalCommand.ts`.
- [`localCommandGuard.ts`](./localCommandGuard.ts) — the shared guard imports `commandLock.ts` and `runLocalCommand.ts`.
- [`runLocalCommand.ts`](./runLocalCommand.ts) — the shared child-process runner imports `signalForward.ts`.

The current bounded transitive shared release-execution population is therefore:

```text
scripts/lib/commandLock.ts
scripts/lib/localCommandGuard.ts
scripts/lib/processResult.ts
scripts/lib/runLocalCommand.ts
scripts/lib/signalForward.ts
```

Basis:

- [`../../docs/testing/verify-target-architecture.md`](../../docs/testing/verify-target-architecture.md) — proof helpers shared by release checks must select every actual consumer or conservatively full when the consumer set is not safely bounded; unknown significant source inside a confirmed release-sensitive boundary must not silently skip.
- [`../../AGENTS.md`](../../AGENTS.md) — repeated ownership-completeness failures require returning to architecture instead of continuing example-by-example patching.

Risk: a PR can modify the mechanism that launches, locks, signals, or propagates the result of real release checks while `verification-release` selects no source-impact release proof. Exact-head CI can then be green without exercising the release behavior affected by the change, violating the verifier exit criterion that no known required proof is silently missed.

Required final state: release-impact ownership must be closed over the complete current shared release-execution support mechanism, not a hand-picked example list. The current confirmed five-file support population has the truthful focused consumer set `artifact + build + managed-updates + release-smoke`. `release-config` and `publisher-node-import` do not consume this command-runtime mechanism. Any future repository-relative runtime dependency added to the audited release execution roots must be classified in the same change. Keep unrelated `scripts/lib/**` outside release impact; do not add a generic import graph or broad directory fallback.

Verification: use a fresh independent test-author pass in `releaseRisk.test.ts`. First perform a bounded transitive runtime-import audit from the accepted release execution roots and record the exhausted population. Prove at least one direct shared dependency (`runLocalCommand.ts`) and one transitive dependency (`commandLock.ts` or `signalForward.ts`) are meaningful RED against the current planner, then prove the complete current population selects exactly the focused four consumers. Include a nearby unrelated `scripts/lib/**` negative so the correction cannot become a broad directory fallback. Preserve all existing release-spec, build-input, fixture, publisher, managed-update, timeout, and CI-topology proofs.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- A generic dependency/import graph for release planning is not required.
- A broad `scripts/lib/**` release fallback is not required.
- Benchmark execution is deferred until this semantic blocker is closed and the full PR review is clean again.

## Unresolved questions

None.
