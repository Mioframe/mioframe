# Review

Verdict: blocked

## Scope reviewed

- Complete current `develop...refactor/verify-modernization-finish` verifier-modernization result.
- Pass A output, Pass B metadata classification, Pass C unit impact/direct Vitest discovery, Pass D mutation ownership, Pass E release-impact, and Pass F CI topology remain accepted.
- Application-E2E discovery was re-reviewed end-to-end across physical collection, planner classification, scenario/applicability validation, unit scan ownership, real collector proof, and verifier command composition.
- Repeated application-E2E drift triggered the root `AGENTS.md` architecture stop rule; the redesigned owner contract is ready in `docs/testing/verify-app-e2e-discovery-correction.md`.
- A previously assigned local correction completed before the redesign was handed off. Its compatible parts have been reviewed and retained as partial implementation of the redesigned architecture.

## Blockers

None.

## Major issues

### M1 — application-E2E root-spec population still has duplicated production ownership

Owner: verifier application-E2E discovery contract.

Current state:

- `playwright.config.ts` is root-only;
- `e2eRisk.ts:isAppE2ESpecPath()` has now been corrected to direct `tests/e2e/*.spec.ts` only;
- nested `*.spec.ts` is no longer reclassified as app support;
- `e2eProjectApplicability.ts` still owns a separate private root-app predicate/constants;
- `unitRisk.ts` still owns another private root-app predicate/constants;
- `playwright.config.ts` still owns literal canonical root/testMatch facts;
- `scripts/lib/appE2EPaths.ts` does not yet exist.

Problem: the immediate planner symptom is fixed, but the duplicated ownership pattern that caused repeated drift remains. The accepted architecture therefore still requires one narrow pure owner `scripts/lib/appE2EPaths.ts` exposing only `APP_E2E_SPEC_DIR`, `APP_E2E_TEST_MATCH`, and `isRootAppE2ESpecPath()` and migration of all production/verifier consumers to it.

Additional contract gap: `validateE2EScenarioRegistry()` must reject every non-root application metadata entry, not only selected reserved-lane cases. The new canonical owner path itself must be full application-E2E infrastructure.

Evidence:

- `scripts/lib/e2eRisk.ts` — local planner behavior is now root-only, but still uses local canonical path facts;
- `scripts/lib/e2eProjectApplicability.ts` — duplicate private root predicate and root constants remain;
- `scripts/lib/unitRisk.ts` — duplicate root predicate remains for bounded scan ownership;
- `playwright.config.ts` — literal root/testMatch remains;
- `docs/testing/verify-app-e2e-discovery-correction.md` — ready single-owner architecture.

Basis:

- root `AGENTS.md` — repeated ownership drift requires architecture correction, not another local patch;
- `docs/testing/verify-app-e2e-discovery-correction.md` — accepted source-of-truth and migration contract.

Risk: the same application spec population can drift again across planner, collector, applicability, and unit ownership despite the current symptom being fixed.

Required final state: implement the shared path owner, remove duplicated production predicates/constants, preserve current correct planner behavior, make scenario metadata root-only, classify the new owner as full app-E2E infrastructure, and keep all existing lane separations unchanged.

Verification: fresh independent proof only for newly changed contracts (scenario metadata and new infrastructure owner), preservation proof for already-correct planner/applicability/unit behavior, and independent real Playwright collector proof.

## Resolved during latest correction

### M2 — collector probe state ownership

Resolved.

`playwright.lanes.test.ts` now uses unique invocation-owned probe paths, `mkdtempSync`, exclusive `wx` file creation, exact tracked-file cleanup, and non-recursive removal only of the temporary directory created by that invocation. It no longer overwrites fixed repository paths or recursively deletes a generic `tests/e2e/**` directory.

One proof-strengthening item remains under M1 verification: the filtered collector invocation should include a real root app spec together with the nested probe, succeed, collect the root spec, and still exclude the nested probe. This is not a reopened probe-safety defect.

## Minor issues

### m1 — a few source/test comments still describe superseded mechanics

Owner: verifier source/test comments.

- `scripts/lib/unitRisk.test.ts` still describes an old prefix-limited ordinary-source mechanism;
- `scripts/lib/e2eRisk.ts` release-spec TSDoc still frames release execution only through full verification;
- `scripts/verify.ts` still has stale rolling-output-buffer wording near failure reporting.

Required final state: comment-only cleanup after M1 without executable or assertion changes.

## Accepted risks

None.

## Items not required

- Do not reopen Pass A/B/C/D/E/F architecture.
- Do not revert the already-correct root-only `e2eRisk` behavior.
- Do not revert collision-safe collector probe ownership.
- Do not generalize the new app-E2E owner into a cross-lane registry/glob framework.
- Do not redesign CI, retries, workers, timeouts, scenario mappings, or project applicability data.

## Unresolved questions

None.

## NEXT CORRECTION

Owner: `scripts/lib/appE2EPaths.ts` and its application-E2E verifier/config consumers.

Implement the ready single-owner architecture while preserving the already-landed local planner and probe-safety fixes. Add only the missing root-metadata/infrastructure proof, strengthen the filtered real-collector case, migrate consumers, and remove duplicate production ownership.
