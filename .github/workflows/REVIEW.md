# Review

Verdict: blocked

## Scope reviewed

- Pass F `verification-release` CI placement and timeout ownership in `.github/workflows/verify.yml` against verifier-owned release command deadlines.

## Blockers

### B1 — GitHub release-impact job can time out before the verifier does

Owner: `.github/workflows/verify.yml`

Problem: `verification-release` has `timeout-minutes: 60`, but one valid selected check, `managed-updates`, already has a verifier-owned timeout of four Playwright container sessions. With the current canonical container timeout this is 68 minutes before accounting for job setup or any earlier selected release checks.

Evidence:

- `config/tooling.json`: `verification.playwrightContainer.timeoutSeconds` is 900 seconds (15 minutes).
- `scripts/verify.ts`: `PLAYWRIGHT_COMMAND_OVERHEAD_MS` is 2 minutes, so one Playwright-backed verify deadline is 17 minutes; `managed-updates` owns `4 * PLAYWRIGHT_COMMAND_TIMEOUT_MS`, i.e. 68 minutes.
- `.github/workflows/verify.yml`: `verification-release` is capped at 60 minutes.
- `.github/workflows/release.yml`: the existing full `pnpm verify:release --verbose` release gate uses a 90-minute job timeout.

Basis:

- verifier timeout/diagnostic ownership must not be pre-empted by a shorter outer CI deadline for a valid execution path;
- Pass F adds CI placement only and should reuse existing project timeout precedent rather than create a second timeout model.

Risk: GitHub Actions can cancel a healthy managed-updates/release-impact execution before `verify.ts` reaches its owned timeout and writes its normal bounded failure/diagnostic result.

Required final state: make the dedicated `verification-release` job deadline safely exceed every valid selected release-impact execution path. Prefer the existing 90-minute release-gate precedent unless current measured/repository evidence requires another value. Do not add dynamic timeout infrastructure.

Verification: deterministic workflow/unit proof should establish that the release-impact job timeout is not shorter than the project-supported release verification envelope; exact-head CI later supplies the real wall-clock evidence.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Do not split release-impact into more jobs merely to address this timeout.
