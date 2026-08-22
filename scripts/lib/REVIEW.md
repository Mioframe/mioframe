# Review

Verdict: blocked

## Scope reviewed

- Complete `develop...refactor/verify-modernization-finish` verifier-modernization result.
- Application-E2E physical discovery correction is closed.
- Pass E release-impact consumer-model correction is closed and recorded in `docs/testing/verify-release-impact-correction.md`.
- Remaining source-level findings are the exact Vitest direct-test discovery mismatch and behavior-preserving durable comment/TSDoc cleanup.

## Blockers

None.

## Major issues

### M1 — direct Vitest test discovery does not exactly match `vitest.config.ts`

Owner: `scripts/lib/unitRisk.ts`.

Problem: `isTestShapedPath()` accepts `.test.mjs` under all `src/`, `config/`, and `scripts/` prefixes, while the actual current Vitest include matrix is:

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
- files with those unsupported direct-test shapes may still participate only through another truthful mechanism, such as ordinary module input eligibility, when that mechanism actually applies;
- add a positive/negative matrix proof that mirrors `vitest.config.ts` without introducing another discovery abstraction.

Risk: planner/registry validation can claim a direct Vitest proof owner that the actual test runner does not discover, violating the Pass C separation between test discovery and dependency-input eligibility.

Verification for closure: focused unit planner proof and, where useful, one real Vitest discovery/related probe; no broad verification required.

## Minor issues

### m1 — durable comments/TSDoc still describe resolved review state or obsolete behavior

Known examples remain in:

- `scripts/lib/unitRisk.ts` / `unitRisk.test.ts`;
- `scripts/lib/releaseRisk.test.ts`;
- `playwright.lanes.test.ts`;
- `scripts/verify.ts` / `verify.test.ts`;
- `.github/workflows/verify.yml`;
- `scripts/lib/visualRisk.ts:isSafeVisualExclusionPath()` TSDoc.

Required final state after M1:

- remove references to resolved temporary `REVIEW.md` files;
- remove obsolete `current unfixed` / expected-RED narration now that corrections are implemented;
- retain concise canonical-contract rationale where useful;
- correct `isSafeVisualExclusionPath()` TSDoc so it does not claim plain Markdown is excluded;
- do not change behavior merely to make old comments true.

Verification for closure: source/comment inspection plus focused lint/format if useful; no behavioral proof required solely for comment cleanup.

## Accepted risks

None.

## Items not required

- Do not reopen application-E2E discovery.
- Do not reopen release-impact architecture unless new repository evidence invalidates `docs/testing/verify-release-impact-correction.md`.
- Do not reopen mutation architecture.
- Do not redesign verifier output or CI topology.
- Do not introduce a generic dependency graph, cross-lane registry, release crawler, or additional CI jobs.
