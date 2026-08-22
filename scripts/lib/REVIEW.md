# Review

Verdict: blocked

## Scope reviewed

- Complete current `develop...refactor/verify-modernization-finish` verifier-modernization result.
- Pass A/B/C/D/E/F remain accepted.
- Application-E2E discovery was re-reviewed after the architecture redo across the new shared path owner, physical Playwright config, planner/spec/support classification, scenario/applicability validation, unit scan ownership, TypeScript project boundary, and independent real collector proof.

## Blockers

None.

## Major issues

None.

## Resolved in current review

### M1 — duplicated application-E2E root-spec ownership

Resolved and architect-reviewed.

`scripts/lib/appE2EPaths.ts` is now the single narrow production/verifier owner of:

```text
APP_E2E_SPEC_DIR
APP_E2E_TEST_MATCH
isRootAppE2ESpecPath()
```

`playwright.config.ts`, `e2eRisk.ts`, `e2eProjectApplicability.ts`, and `unitRisk.ts` consume that owner; their replaced private canonical root predicates/constants were removed.

The new module remains pure and verifier-only. Product scenario mappings, project applicability data, Storybook/visual/release ownership, and unit-impact semantics were not moved into it.

The previously remaining behavioral gaps are also closed:

- nested app specs remain no-selection;
- ordinary nested helpers remain conservative support;
- direct `*.test.ts`/`*.test.mjs` proof does not become app support;
- legitimate `*.testUtils.ts` helper behavior is preserved;
- scenario/standalone metadata rejects non-root specs;
- applicability remains root-only;
- changing `appE2EPaths.ts` selects full application E2E;
- the new module does not gain visual/Storybook/release ownership.

Focused unit proof and type-check passed. The `tsconfig.node.json` inclusion is a required TypeScript project-boundary dependency because `playwright.config.ts` imports the verifier-owned path/applicability modules; it does not introduce another runtime owner.

### M2 — collector probe state ownership

Resolved and architect-reviewed.

`playwright.lanes.test.ts` uses unique invocation-owned paths, `mkdtempSync`, exclusive `wx` creation, tracked exact cleanup, and removal only of its own temporary directory. The filtered real collector now receives both a real root app spec and the nested probe, succeeds, collects the root spec, and still excludes the nested probe.

The real collector remains independent of the shared path predicate as its expected-value oracle.

## Minor issues

### m1 — three source/test comments still describe superseded mechanics

Owner: verifier source/test comments.

Problem:

1. `scripts/lib/unitRisk.test.ts` still says `config/tooling.json` is ordinary-source eligible because of an old `src/config/scripts` prefix check, while ordinary dependency-input eligibility is now repository-wide by supported source shape.
2. `scripts/lib/e2eRisk.ts` says release specs run through `playwright.release.config.ts` / `pnpm verify --full`; source-impact release selection can also run the owning release checks without a full verifier invocation.
3. `scripts/verify.ts` says the bounded rolling output buffer is further excerpted by `getFailureReason`; accepted failure fallback no longer infers a reason from arbitrary output tails and instead uses verifier-owned semantic facts or exit code + log/rerun pointers.

Basis:

- root `AGENTS.md`: durable comments/TSDoc must describe current mechanisms and obsolete wording should be removed with replaced logic;
- `docs/testing/verify-unit-impact-correction.md`, `verify-release-impact-correction.md`, and `verify-agent-output.md`: final accepted contracts.

Risk: maintenance guidance contradicts correct executable behavior.

Required final state: rewrite only those comments/TSDoc to describe current mechanisms. No executable behavior, test assertions, planner ownership, command behavior, or workflow semantics change.

Verification: source inspection plus focused formatting/lint only if useful.

## Accepted risks

None.

## Items not required

- Do not reopen Pass A/B/C/D/E/F.
- Do not reopen the application-E2E architecture without new repository evidence.
- Do not change app-E2E path ownership, scenarios, applicability data, collector behavior, or probe setup during the comment cleanup.
- Do not redesign CI, retries, workers, timeouts, release ownership, or verifier output behavior.

## Unresolved questions

None.

## NEXT CORRECTION

Owner: source/test comments only.

Perform the three behavior-preserving wording corrections above, then run the final complete PR-level semantic review. No behavioral coding work remains currently known.
