# Review

Verdict: blocked

## Scope reviewed

- Complete `develop...refactor/verify-modernization-finish` verifier-modernization result.
- Application-E2E physical discovery blocker is closed and removed from active review state.
- Remaining source-level findings are Pass E release-impact, exact Vitest direct-test discovery, and behavior-preserving durable comment/TSDoc cleanup.

## Blockers

### B1 — release-impact ownership is not yet a closed truthful consumer model

Owner: `scripts/lib/releaseRisk.ts` and its independent proof.

Canonical correction architecture: `docs/testing/verify-release-impact-correction.md`.

The correction architecture is resolved. Do not redesign it in implementation.

Confirmed gaps in the current implementation:

1. Release browser execution inputs can silently skip:
   - `scripts/e2eReleaseContainer.mjs`;
   - `scripts/playwrightContainer.ts`.

   Their confirmed current consumer set is `artifact + release-smoke + managed-updates`.

2. Existing browser release seams are over-broad in the current full-infrastructure set:
   - `playwright.release.config.ts`;
   - `scripts/release/artifactServer.mjs`.

   Their confirmed current release consumer set is also `artifact + release-smoke + managed-updates`, not all six checks.

3. Shared support imported by release specs was omitted from the previous audit. `tests/e2e/helpers.ts` is a confirmed release Playwright runtime input used by artifact, release-smoke, and managed-update specs. The correction must audit the complete current release-spec support/import population, not only files under `tests/e2e/release/**`.

4. Ordinary unit/type proof is incorrectly promoted to release-impact, including confirmed examples:
   - `scripts/release/validateReleaseConfig.test.mjs`;
   - `scripts/release/managedUpdatesProof.test.mjs`;
   - `scripts/release/runManagedReleaseDataCompatibilityProof.test.mjs`;
   - `tests/e2e/release/fixtures/managedReleaseFixture.test.mjs`;
   - mapped declaration-only `*.d.mts` release fixture companions;
   - `scripts/pages/lib/**/*.test.mjs` through the broad runtime prefix.

5. Exact mapping validation still checks existence only. Duplicate source ownership and empty consumer sets must fail `invalid` before first-match planning can silently drop ownership.

Required final state is fully specified in `docs/testing/verify-release-impact-correction.md`:

- start the bounded semantic audit from the six real `RELEASE_CHECK_COMMANDS` in `scripts/verify.ts`;
- follow release-specific entrypoints/config/orchestrator/runner/server/spec-support/publication boundaries;
- stop at generic shared process/locking utility seams unless they own a concrete release-only semantic;
- exact-map known consumer sets;
- keep conservative full fallback only for genuinely uncertain significant runtime/implementation input;
- evaluate proof/type-only exclusion before broad publication/fixture fallback;
- preserve release-version separation;
- do not add new release proof or a generic dependency graph.

Closure proof:

- fresh independent test-author context;
- meaningful RED for missing release runner ownership;
- meaningful RED for proof/type-only over-selection;
- mapping-integrity Must Reject proof;
- focused releaseRisk + command-composition GREEN;
- no broad/expensive release browser run required merely to validate planner metadata.

## Major issues

### M1 — direct Vitest test discovery does not exactly match `vitest.config.ts`

Owner: `scripts/lib/unitRisk.ts`.

Current `isTestShapedPath()` accepts `.test.mjs` under all `src/`, `config/`, and `scripts/` prefixes, but the actual include matrix is:

```text
src/**/*.test.ts
config/**/*.test.ts
scripts/**/*.test.ts
scripts/**/*.test.mjs
tests/e2e/**/*.test.mjs
playwright.*.test.ts
eslint.config.test.ts
```

Required final state:

- `src/**` and `config/**` accept direct `.test.ts` only;
- `scripts/**` accepts `.test.ts` and `.test.mjs`;
- `tests/e2e/**` accepts `.test.mjs` only;
- root special cases remain exact;
- `src/**/*.test.mjs` / `config/**/*.test.mjs` are never accepted as direct Vitest owner paths merely by name;
- add positive/negative matrix proof without a new abstraction.

This is a local follow-up after B1; do not combine it into the release consumer correction context.

## Minor issues

### m1 — durable comments/TSDoc still describe resolved review state or obsolete behavior

Known examples remain in:

- `scripts/lib/unitRisk.ts` / `unitRisk.test.ts`;
- `scripts/lib/releaseRisk.test.ts`;
- `scripts/verify.ts` / `verify.test.ts`;
- `.github/workflows/verify.yml`;
- `scripts/lib/visualRisk.ts:isSafeVisualExclusionPath()` TSDoc.

After behavioral corrections:

- remove references to resolved temporary `REVIEW.md` files and obsolete `current unfixed` / expected-RED narration;
- keep concise canonical-contract rationale where useful;
- correct visual safe-exclusion TSDoc so it no longer claims plain Markdown is excluded;
- do not change behavior merely to make old comments true.

## Accepted risks

None.

## Items not required

- Do not reopen application-E2E discovery; its root-only physical contract is implemented and reviewed.
- Do not reopen mutation architecture.
- Do not redesign verifier output or CI topology.
- Do not introduce a generic dependency graph, cross-lane registry, release crawler, or additional CI jobs.
