# Review

Verdict: blocked

## Selected next correction

Finish **B2 Vitest rule semantic equivalence only**.

Authoritative handoff: [`../../docs/testing/verify-mutation-impact-correction.md`](../../docs/testing/verify-mutation-impact-correction.md).

Production owner:

```text
scripts/lib/vitestTestPaths.ts
```

Do not include B1 release-impact work in the same coding pass.

## Scope reviewed

- PR #216 verifier-modernization semantic blockers under `scripts/lib`.
- Mutation B2 implementation through `225183571bef9854d7eb7f72b8b19d94277a884f`.
- Shared Vitest discovery population, glob rendering, predicate matching semantics, existing behavioral proof, and downstream unit/mutation consumers.
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

### B2 — One Vitest rule kind does not match the glob it renders

Owner: `scripts/lib/vitestTestPaths.ts`

Problem: the latest correction successfully replaces duplicated discovery populations with one declarative rule population, but `rootPrefixSuffix` still derives two non-equivalent behaviors from the same rule. `ruleToGlob()` renders `playwright.*.test.ts`, while `ruleMatches()` requires the wildcard middle to be non-empty. Standard glob `*` matches zero or more non-separator characters, so the rendered glob accepts `playwright..test.ts` while the planner predicate rejects it.

Evidence:

- [`vitestTestPaths.ts`](./vitestTestPaths.ts) — `rootPrefixSuffix` renders `${prefix}*${suffix}` but returns `middle.length > 0 && !middle.includes('/')`.
- [`vitestTestPaths.test.ts`](./vitestTestPaths.test.ts) — current representative tests cover a normal `playwright.lanes.test.ts` path but do not cover the zero-length wildcard boundary.

Basis:

- [`../../docs/testing/verify-mutation-impact-correction.md`](../../docs/testing/verify-mutation-impact-correction.md) — generated glob exports and `isVitestOwnedTestPath()` must express the same discovery semantics from the same rule population.
- Picomatch wildcard semantics used by the ecosystem: `*` matches any character zero or more times, excluding path separators.

Risk: config-facing discovery and planner-facing ownership can still disagree for a path admitted by the exported Vitest include glob, so the source-of-truth invariant is not yet closed.

Required final state: each local `DiscoveryRule` kind must have matcher semantics equivalent to the glob syntax it renders. For `rootPrefixSuffix`, zero-length wildcard content must be handled consistently with `*`; slash crossing must remain rejected. Do not change the exported glob contract or reintroduce a second discovery population.

Verification: add the smallest independent regression proof for the zero-length `*` boundary, then keep all existing Vitest path, unit, mutation, type, and static checks green. Architect rechecks semantic equivalence before closing B2.

Resolved B2 parts are not findings anymore: canonical deleted/rename identity reaches mutation planning; real `.test.mjs` ownership is accepted; invalid external `.test.ts` is rejected; `vitest.config.ts` and `vitestTestPaths.ts` select all mutation targets; `vitestTestPaths.ts` selects full unit; seven mutation targets/Stryker mutate surface are unchanged; one declarative Vitest rule population now owns include/exclude data.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- No generic glob engine, new dependency, test registry, dependency graph, or cross-lane abstraction is required.
- Do not reopen already accepted mutation/unit ownership decisions.
- Benchmark execution remains deferred until semantic blockers are closed and a new full PR semantic review is clean.

## Unresolved questions

None.
