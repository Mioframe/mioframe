# Review

Verdict: blocked

## Scope reviewed

- Verify Redesign Pass C owner-local behavior, visual, and browser-integration migration.
- Managed-update browser-integration path migration, fresh-container grouping, Chromium/Firefox/WebKit applicability, and required cross-engine proof.
- Mixed central behavior/visual splits and moved visual baselines were reviewed as part of the broader Pass C diff; no separate active finding remains for those areas.

## Blockers

### B1 — Required WebKit cross-engine proof is still flaky

Owner: `src/shared/service/appUpdate`

Problem: Pass C requires the moved managed-update browser-integration corpus to preserve the existing Firefox/WebKit cross-engine lifecycle proof. The implementation feedback reports that the WebKit execution of this required cross-engine proof reproduced a known flaky failure. Under repository verification policy, a known flaky result is failed proof, so Pass C does not yet have clean evidence that the moved path/configuration preserves the required WebKit contract.

Evidence:

- [managedUpdatesCrossEngineLifecycle.browser-integration.spec.ts](managedUpdatesCrossEngineLifecycle.browser-integration.spec.ts) — this is the owner-local cross-engine lifecycle contract whose file-level documentation states that it must qualify on Firefox and WebKit.
- [playwright.release.config.ts](../../../../playwright.release.config.ts) — the release Playwright configuration routes the moved cross-engine lifecycle spec to Firefox and WebKit while excluding it from Chromium.
- [Pass C implementation contract](../../../../docs/testing/verify-redesign-pass-c-implementation.md) — acceptance requires equivalent managed-update grouping/browser coverage and specifically preservation of Firefox/WebKit applicability.

Basis:

- [AGENTS.md](../../../../AGENTS.md) — repository verification ownership states that known flaky behavior is failed proof and must not be accepted through retry-pass/flaky classification.
- [verification skill](../../../../.agents/skills/verification/SKILL.md) — requires correction of the flaky root cause and rerunning the smallest faithful owning proof; retry-until-pass, weakened assertions, inflated timeouts, sleeps, or stronger-runner masking are not acceptable.
- [testing architecture](../../../../docs/testing/architecture.md) — failures must remain visible and known flaky behavior remains failed proof until the owning defect is corrected.

Risk: accepting Pass C now would mark a browser-matrix migration complete without deterministic proof for one of the explicitly preserved engines. A retry-pass would not distinguish a safe path/configuration migration from an unresolved WebKit lifecycle defect.

Required final state: identify the concrete WebKit failure/root cause and correct the truthful owner so the required moved cross-engine lifecycle contract passes deterministically on WebKit without weakening coverage, assertions, project applicability, or timing semantics. Do not close this finding solely because a later retry happens to pass.

Verification: run the smallest faithful verifier-managed `browser-integration` proof that exercises the moved cross-engine lifecycle spec after the correction and obtain a clean non-flaky result; preserve the existing Firefox/WebKit project applicability. Then re-review the complete Pass C scope.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

- The implementation feedback did not include the exact failing WebKit test/assertion/log, and there is currently no exact-head GitHub workflow/status for this branch commit. The correction pass must capture the concrete failure rather than assuming the historical cause.
