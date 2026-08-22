# Review

Verdict: blocked

## Scope reviewed

- Complete `develop...refactor/verify-modernization-finish` verifier-modernization result.
- Application-E2E physical discovery correction is closed.
- Pass E release-impact consumer-model correction is closed and recorded in `docs/testing/verify-release-impact-correction.md`.
- Exact Vitest direct-test discovery correction is closed against `vitest.config.ts` and `docs/testing/verify-unit-impact-correction.md`.
- The only remaining active finding is behavior-preserving durable comment/TSDoc cleanup.

## Blockers

None.

## Major issues

None.

## Minor issues

### m1 — durable comments/TSDoc still describe resolved review state or obsolete behavior

Known examples remain in:

- `scripts/lib/unitRisk.ts` / `unitRisk.test.ts`;
- `scripts/lib/releaseRisk.test.ts`;
- `playwright.lanes.test.ts`;
- `scripts/verify.ts` / `verify.test.ts`;
- `.github/workflows/verify.yml`;
- `scripts/lib/visualRisk.ts:isSafeVisualExclusionPath()` TSDoc.

Required final state:

- remove references to resolved temporary `REVIEW.md` files;
- remove obsolete `current unfixed`, `expected RED`, correction-round, and similar narration that describes historical implementation state as current;
- retain concise canonical-contract rationale where useful;
- correct `isSafeVisualExclusionPath()` TSDoc so it describes only the actual safe suffixes and does not claim plain Markdown is excluded;
- do not change production behavior, assertions, command semantics, workflow semantics, or ownership data merely to make old comments true.

Verification for closure: source/comment inspection plus focused lint/format if useful; no behavioral proof is required solely for comment cleanup.

## Accepted risks

None.

## Items not required

- Do not reopen application-E2E discovery.
- Do not reopen release-impact architecture.
- Do not reopen unit-impact architecture or the direct-test discovery predicate.
- Do not reopen mutation architecture.
- Do not redesign verifier output or CI topology.
- Do not introduce a generic dependency graph, cross-lane registry, release crawler, or additional CI jobs.

## NEXT CORRECTION

Owner: verifier source/test/workflow comments only.

Perform one behavior-preserving cleanup pass over the known touched verifier files. Remove stale temporary-review and historical-RED narration, correct the visual TSDoc, and leave executable behavior and assertions unchanged. After that, return the branch for architect-owned document/status refresh and one final full PR-level semantic review.
