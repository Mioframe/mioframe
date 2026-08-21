# Review

Verdict: blocked

## Scope reviewed

- Complete verifier-modernization finish implementation on `refactor/verify-modernization-finish`, with full re-review of Pass C unit impact and the stale visual-planner proof.

## Blockers

### B1 — Pass C implementation must conform to the corrected unit-impact architecture

Owner: `scripts/lib/unitRisk.ts`

Architecture is now resolved by [`docs/testing/verify-unit-impact-correction.md`](../../docs/testing/verify-unit-impact-correction.md). Do not continue the previous prefix/mapping patching approach.

Problem: current `unitRisk.ts` still uses `UNIT_RELEVANT_PREFIXES = ['src/', 'config/', 'scripts/']` as the allowed ordinary Vitest dependency-input universe and makes mapped CSS exclusive. That creates false negatives for real cross-root import owners and conflates test discovery with dependency-input eligibility.

Evidence:

- `config/postcss.config.test.ts` imports root `postcss.config.js`, but the root module is outside the current ordinary-source prefixes;
- `playwright.lanes.test.ts` imports root Playwright config modules, which are also outside those prefixes;
- `tests/e2e/release/fixtures/managedReleaseFixture.test.mjs` imports adjacent fixture source under `tests/e2e/**`, but that source root is excluded from ordinary unit inputs;
- `.gitignore -> scripts/agentEnvironment.test.mjs` is not a truthful relation to the real repository `.gitignore`: the test constructs temporary `.gitignore` fixtures;
- `isMappedCssSource` suppresses ordinary related resolution for mapped CSS, although an external mapping must be additive when a real import relation also exists.

Required final state:

- direct Vitest test recognition follows the actual `vitest.config.ts` include contract;
- ordinary added/modified current-tree module/style/support inputs are eligible for `vitest related` across repository locations, not only `src/config/scripts`;
- Playwright-only proof remains outside Vitest ownership;
- exact external-input mappings contain only verified non-import repository-source ownership and compose additively with ordinary related inputs;
- false mappings based on temporary fixtures are removed;
- deletion/rename and actual Vitest-global infrastructure continue to fail closed as defined by the accepted architecture;
- no generated/persisted dependency graph, generic prefix registry, or cross-lane classifier is introduced.

Verification: use a fresh test-author context and the required proof cases in `verify-unit-impact-correction.md`. The proof must reject root imported modules being skipped, `tests/e2e/**` Vitest helper/source misses, mapped CSS suppressing an import consumer, and temporary-fixture false ownership.

### B2 — stale `visualRisk.test.ts` cases must be made deterministic before PR CI

Owner: `scripts/lib/visualRisk.test.ts`

Problem: two existing cases still use MDButton as an "unmigrated" real-filesystem fixture and expect `full`, while `develop` already contains `MDButton.visual.spec.ts`. The resolver therefore correctly finds a colocated owner and returns `focused`. The failures are pre-existing, but this finish branch changes `visualRisk.test.ts`, so focused exact-head unit CI will select the file and fail.

Required final state: preserve the intended unmigrated/fail-closed planner contract with a deterministic synthetic/injected fixture that explicitly has no colocated visual owner. Do not change `visualRisk.ts` behavior merely to satisfy stale real-component state.

Verification: the corrected test must prove the same unmigrated-owner contract without depending on MDButton's current migration state.

## Major issues

None.

## Resolved findings

- Previous release false-negative consumer ownership is resolved.
- Previous release proof-only over-selection is resolved.
- The Pass C architecture decision is resolved; only implementation/proof remains blocked.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Do not expand mutation/release/classification architecture while correcting Pass C.
