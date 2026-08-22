# Review

Verdict: blocked

## Scope reviewed

- Complete current `develop...refactor/verify-modernization-finish` verifier-modernization result.
- Pass A/B/C/D/E/F remain accepted.
- Application-E2E discovery was re-reviewed across physical config, planner/spec/support classification, scenario/applicability validation, unit scan ownership, and real collector proof.
- The previously assigned local correction completed before the architecture redo; compatible changes are retained as partial implementation.

## Blockers

None.

## Major issues

### M1 — application-E2E root-spec ownership is still duplicated

Owner: verifier application-E2E discovery contract.

Already corrected and accepted:

- `e2eRisk.ts:isAppE2ESpecPath()` is direct-root only;
- arbitrary nested `*.spec.ts` is neither app spec nor app support;
- nested ordinary helper remains conservative app support;
- collector probes are collision-safe and exactly cleaned up.

Remaining architectural problem:

- `scripts/lib/appE2EPaths.ts` does not exist;
- `playwright.config.ts` still owns literal canonical root/testMatch facts;
- `e2eProjectApplicability.ts` still has its own root constants/predicate;
- `unitRisk.ts` still has another root predicate;
- `e2eRisk.ts` still owns its own canonical directory facts rather than consuming one owner.

The accepted architecture requires one pure owner exposing only:

```text
APP_E2E_SPEC_DIR
APP_E2E_TEST_MATCH
isRootAppE2ESpecPath()
```

and migration of all four consumers to it. A local planner patch alone is no longer sufficient because repeated drift has already demonstrated that duplicated ownership is the cause.

Additional behavior/proof gaps inside this same correction:

1. `isAppE2ESupportPath('tests/e2e/example.test.ts')` is currently true because support excludes `.spec.ts` but not direct Vitest-style `.test.ts`; final contract requires false while preserving `*.testUtils.ts` support.
2. `validateE2EScenarioRegistry()` does not generally require every scenario/standalone entry to be a root app spec; an existing non-root Storybook/release/arbitrary spec can be accepted when it exists and root registry coverage otherwise remains complete.
3. `scripts/lib/appE2EPaths.ts` is not yet classified as full application-E2E infrastructure.
4. The filtered real-collector proof currently supplies only the nested probe and expects `No tests found`. Final proof should supply a real root app spec plus the nested probe, succeed, collect the root spec, and still exclude the nested probe.

Required final state: implement `docs/testing/verify-app-e2e-discovery-correction.md` as written, preserve the already-correct local planner/probe-safety behavior, close the four gaps above, and remove duplicate production ownership.

Verification: fresh test-author proof for the still-red `.test.ts` support, non-root scenario metadata, and new infrastructure-owner contracts; independent real collector proof; preservation proof for planner/applicability/unit behavior.

## Resolved

### M2 — collector probe state ownership

Resolved. `playwright.lanes.test.ts` now uses unique invocation-owned paths, `mkdtempSync`, exclusive `wx` creation, tracked exact file cleanup, and non-recursive removal only of its own created directory. Do not reopen or revert this design.

## Minor issues

### m1 — stale source/test comments

After M1 only:

- correct old ordinary-source wording in `unitRisk.test.ts`;
- correct release-spec wording in `e2eRisk.ts`;
- correct stale rolling-buffer wording in `verify.ts`.

No executable behavior or assertions change solely for this cleanup.

## Accepted risks

None.

## Items not required

- Do not reopen Pass A/B/C/D/E/F.
- Do not revert root-only `e2eRisk` planner behavior.
- Do not revert collision-safe collector probes.
- Do not generalize the new app-E2E owner into a cross-lane registry/glob framework.
- Do not redesign CI, retries, workers, timeouts, scenario mappings, or applicability data.

## NEXT CORRECTION

Owner: `scripts/lib/appE2EPaths.ts` and its four application-E2E verifier/config consumers.

Implement the ready single-owner architecture on top of the accepted local fix; do not repeat the already-green nested-spec correction.
