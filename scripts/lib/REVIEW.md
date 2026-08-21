# Review

Verdict: blocked

## Scope reviewed

- Complete verifier-modernization finish architecture as implemented on `refactor/verify-modernization-finish`, with emphasis on unit impact, release impact, verifier orchestration/output, CI topology, and the reported Pass G benchmark.

## Blockers

### B1 — Unit file-as-data ownership for `verify.yml` is incomplete

Owner: `scripts/lib/unitRisk.ts`

Problem: `.github/workflows/verify.yml` is mapped to three workflow tests, but `scripts/ciAutofix.test.ts` also reads that workflow directly through `fs.readFileSync`. Vitest `related` cannot discover this relation through the module graph, so a `verify.yml` change can run focused unit proof without executing a real owner of the changed workflow contract.

Evidence:

- [`unitRisk.ts`](unitRisk.ts) — `UNIT_FILE_AS_DATA_MAPPINGS` maps `.github/workflows/verify.yml` only to `buildDateWorkflow.test.mjs`, `managedDeploymentValidationWorkflow.test.mjs`, and `materializePrVersionWorkflow.test.mjs`.
- [`../ciAutofix.test.ts`](../ciAutofix.test.ts) — `workflow autofix commit detection` reads `.github/workflows/verify.yml` directly and asserts the `Handle autofix changes` workflow contract.

Basis:

- [`../../docs/testing/verify-target-architecture.md`](../../docs/testing/verify-target-architecture.md) — exact file-as-data mappings must cover tests that deliberately consume repository files outside the import relation; ordinary verify must not silently miss required unit proof.
- [`../../docs/testing/architecture.md`](../../docs/testing/architecture.md) — automatic planning must preserve the truthful proof owner and fail closed when ownership cannot be represented safely.

Risk: exact-head CI can report the unit lane green for a `verify.yml` change while skipping a unit test that directly owns part of that workflow behavior.

Required final state: the bounded file-as-data audit is complete for the changed workflow/config inputs. `.github/workflows/verify.yml` selects every confirmed direct-reading Vitest owner, including `scripts/ciAutofix.test.ts`, without introducing a generic dependency registry.

Verification: add/adjust independent unit-planner proof that a `verify.yml` change selects all confirmed direct file readers, then run the smallest focused verifier proof for `unitRisk`/verifier planning.

### B2 — Release focused mappings under-select real consumers

Owner: `scripts/lib/releaseRisk.ts`

Problem: several focused release mappings do not match the repository's real release consumer chains:

- `src/shared/service/appUpdate/releaseWireContract.ts` falls through `appUpdate/** -> managed-updates`, but it is also the terminal module of the plain-Node publisher import proof and therefore must select `publisher-node-import`.
- `scripts/release/buildArtifact.mjs` maps only to `build` + `artifact`, while `playwright.release.config.ts` invokes that script for release browser proof, including `release-smoke` and managed-update groups.
- every `tests/e2e/release/fixtures/**` path is currently treated as `managed-updates`, but artifact-owned fixtures such as `ordinaryBranchArtifactFixture.mjs` and `legacyGeneratedWorkboxPwaConfig.ts` are consumed by `productionArtifactSmoke.spec.ts`.

The corresponding releaseRisk tests encode the same narrowed assumptions, so green tests are correlated with the implementation rather than independent evidence of the real ownership graph.

Evidence:

- [`releaseRisk.ts`](releaseRisk.ts) — `isAppUpdateRuntimePath()` adds only `managed-updates`; `buildArtifact.mjs` is mapped only to `build`/`artifact`; `isManagedUpdatesReleaseFixturePath()` treats the whole release fixture directory as managed-update-only.
- [`../release/publisherWireContractImportProof.mjs`](../release/publisherWireContractImportProof.mjs) — documents and executes the plain-Node chain `releasePublish.mjs -> releaseDescriptor.mjs -> releaseWireContract.ts`.
- [`../../playwright.release.config.ts`](../../playwright.release.config.ts) — the release Playwright web server executes `node scripts/release/buildArtifact.mjs ...`, so browser release contracts are real consumers of that build script.
- [`../../tests/e2e/release/productionArtifactSmoke.spec.ts`](../../tests/e2e/release/productionArtifactSmoke.spec.ts) — owns production artifact proof and imports artifact-specific fixture/config inputs from `tests/e2e/release/fixtures/`.
- [`releaseRisk.test.ts`](releaseRisk.test.ts) — asserts `buildArtifact.mjs -> artifact + build` and treats sampled release fixtures as managed-update-only, reproducing the narrowed ownership rather than testing against the full real consumer set.

Basis:

- [`../../docs/testing/verify-target-architecture.md`](../../docs/testing/verify-target-architecture.md) — the publisher import seam explicitly includes `releaseWireContract.ts`; release proof helpers shared by several checks must select every actual consumer or conservatively full the source-impact plan; unknown significant release-sensitive ownership must fail closed rather than skip.
- [`../../docs/testing/architecture.md`](../../docs/testing/architecture.md) — one primary proof owner per contract and independent oracle quality are required; green correlated tests do not establish correctness.

Risk: ordinary verify can silently omit required release proof for changes to the wire contract, release build path, or artifact fixtures, creating false-green source-impact release planning.

Required final state: derive the affected release checks from the real current consumer chains. Every confirmed shared input selects all actual consumers; where a narrow consumer set is not safely bounded, use the conservative `full` source-impact release plan. Update proof from the accepted architecture/current repository chain rather than preserving the current narrowed expectations.

Verification: independently cover at minimum `releaseWireContract.ts`, `buildArtifact.mjs`, an artifact-owned fixture, a managed-update-owned fixture, and an unknown/shared release fixture/helper. Re-run the representative release-impact benchmark after correction; the current “no false negatives observed” conclusion is invalidated by these findings.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

- The implementation report states that two `visualRisk.test.ts` failures are pre-existing and unrelated, but their exact test names/failure output and baseline evidence were not available in the reviewed repository state. Because this PR changes both `visualRisk.ts` and `visualRisk.test.ts`, that claim must be verified before final acceptance.
- Pass G still needs exact-head CI critical-path evidence after a PR exists; planner-only timing cannot complete the merge-latency part of the finish benchmark.
