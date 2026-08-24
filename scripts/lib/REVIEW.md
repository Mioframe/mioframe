# Review

Verdict: blocked

## Scope reviewed

- Full PR #216 verifier-modernization semantic review against current repository rules and target architecture.
- Specialized impact planners, verifier orchestration/output, mutation ownership, release execution inventory, real release execution dependencies, CI topology, and changed proof/workflow guidance.
- External reviewer finding against production head `32e33108ea91eb17c4d6960e97ede1c32e84dae7`, independently rechecked against the current branch implementation before consolidation here.

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

Detailed architecture: [`../../docs/testing/verify-release-impact-correction.md`](../../docs/testing/verify-release-impact-correction.md).

### B2 — Mutation ownership loses canonical changed identity and diverges from real Vitest discovery

Owners: `scripts/verify.ts`, `scripts/lib/mutationTargets.ts`; shared Vitest test-path ownership is resolved in `docs/testing/verify-mutation-impact-correction.md`.

Problem A — changed-path identity loss:

- `changedPaths.ts` preserves deleted paths and projects both old/new sides of a rename.
- `buildCommands()` then filters the flat projection through `fileExists` into `existingChangedFiles` and passes that reduced list to `resolveMutationPlan()`.
- a deleted `stryker.config.mjs`, or the old side of a rename away from that path, therefore disappears before the mutation planner sees it even though the mutation contract requires registry/Stryker execution-config changes to select all registered targets or fail invalid, never silently skip.

Problem B — false Vitest ownership heuristic:

- `validateMutationRegistry()` currently accepts an owning test solely when its path ends in `.test.ts`.
- the real [`../../vitest.config.ts`](../../vitest.config.ts) includes `scripts/**/*.test.mjs` and `tests/e2e/**/*.test.mjs` in addition to the `.test.ts` roots, plus root `playwright.*.test.ts` and `eslint.config.test.ts`.
- real repository test `scripts/agentEnvironment.test.mjs` is therefore Vitest-owned but the mutation validator would reject it.
- conversely, an arbitrary existing `.test.ts` outside the configured include roots can be accepted despite not being Vitest-owned.
- `unitRisk.ts` already contains a separate, more accurate copy of the Vitest path contract, demonstrating that keeping another local mutation heuristic would preserve duplicated ownership and future drift.

Additional confirmed mutation-execution owner:

- `stryker.config.mjs` explicitly sets `testRunner: 'vitest'`, `vitest.configFile: 'vitest.config.ts'`, and `vitest.related: true`.
- therefore a change to `vitest.config.ts` affects mutation execution semantics and must select all registered mutation targets rather than skip.

Basis:

- [`../../docs/testing/verify-target-architecture.md`](../../docs/testing/verify-target-architecture.md) — `changedPaths.ts` is the sole Git identity/status owner; mutation registry validation requires owning tests to be real Vitest-owned tests; mutation registry/execution config changes must select all registered targets or invalid, never silent skip.
- [`../../docs/testing/verify-mutation-impact-correction.md`](../../docs/testing/verify-mutation-impact-correction.md) — resolved minimum correction architecture.

Risk: mutation verification can silently skip when its own execution config is deleted/renamed, while registry validation can reject real unit owners or accept tests Vitest will never discover. Green mutation execution therefore does not prove the intended mutation ownership contract.

Required final state:

1. keep `resolveMutationPlan()` identity-based and pass the canonical flat `changedFiles` projection directly from `buildCommands()`; do not gate mutation planning through current-tree existence;
2. introduce one narrow shared Vitest test-path owner used by `vitest.config.ts`, `unitRisk.ts`, and `mutationTargets.ts` instead of duplicating include-shape logic;
3. treat that shared Vitest path owner as full-unit infrastructure;
4. treat `stryker.config.mjs`, `scripts/lib/mutationTargets.ts`, `vitest.config.ts`, and the shared Vitest path owner as mutation execution-semantic changes selecting all registered targets after validation;
5. keep the seven current audited mutation targets and Stryker mutate surface unchanged.

Verification:

- fresh independent test-author pass before implementation;
- integration proof through canonical changed-path projection plus `buildCommands()` for deleted `stryker.config.mjs` and rename old-side `stryker.config.mjs`; direct `resolveMutationPlan(['stryker.config.mjs'])` alone is insufficient because it already passes and misses the orchestration defect;
- positive Vitest-owned `.test.mjs` case using a real repository path such as `scripts/agentEnvironment.test.mjs`;
- negative `.test.ts` outside the real Vitest include roots;
- `vitest.config.ts` and the shared Vitest path owner select all registered mutation targets;
- the shared Vitest path owner selects full unit;
- existing registry validity, seven target entries, Stryker mutate surface, unit related/file-as-data/scan/status behavior, timeouts, and CI topology remain unchanged.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- A generic dependency/import graph for release planning is not required.
- A broad `scripts/lib/**` release fallback is not required.
- A second Git/status parser or status-bearing mutation planner API is not required: canonical flat changed identity is sufficient for current mutation semantics.
- A generic test registry or duplicated Vitest include heuristic is not required.
- Benchmark execution is deferred until both semantic blockers are closed and a new full PR semantic review is clean.

## Unresolved questions

None.
