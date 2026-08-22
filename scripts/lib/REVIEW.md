# Review

Verdict: blocked

## Scope reviewed

- Complete current `develop...refactor/verify-modernization-finish` verifier-modernization result.
- Pass A output, Pass B metadata classification, Pass C unit impact/direct Vitest discovery, Pass D mutation ownership, Pass E release-impact, and Pass F CI topology were re-read against their current canonical contracts.
- Application-E2E discovery was re-reviewed end-to-end across physical collection, planner classification, scenario/applicability validation, unit scan ownership, real collector proof, and verifier command composition.
- Repeated application-E2E correction drift triggered the root `AGENTS.md` stop rule; architecture has been redone in `docs/testing/verify-app-e2e-discovery-correction.md` and is ready for implementation.

## Blockers

None.

## Major issues

### M1 — application-E2E root-spec population has duplicated production ownership and has drifted

Owner: verifier application-E2E discovery contract.

Problem: the invariant `application E2E = direct tests/e2e/*.spec.ts only` is independently represented by `playwright.config.ts`, `e2eRisk.ts`, `e2eProjectApplicability.ts`, and `unitRisk.ts`. These implementations have already drifted across multiple correction rounds: physical Playwright collection and applicability/unit inventories are root-only, while `e2eRisk.ts:isAppE2ESpecPath()` still accepts arbitrary nested non-reserved `tests/e2e/**/*.spec.ts` paths.

A local `e2eRisk.ts` fix would repair the current symptom but preserve the duplicated ownership pattern that caused the repeated mismatch. The architecture has therefore been redesigned to use one narrow pure owner `scripts/lib/appE2EPaths.ts` for only the root directory, Playwright testMatch, and root-spec predicate. Scenario mappings remain separately owned.

Evidence:

- [`e2eRisk.ts`](./e2eRisk.ts) — current `isAppE2ESpecPath()` accepts nested non-reserved specs; its registry scan is independently non-recursive.
- [`e2eProjectApplicability.ts`](./e2eProjectApplicability.ts) — contains a separate private root-app predicate and non-recursive inventory.
- [`unitRisk.ts`](./unitRisk.ts) — contains another private root-app predicate for bounded scan ownership.
- [`../../playwright.config.ts`](../../playwright.config.ts) — physical application collection is root-only `**/tests/e2e/*.spec.ts`.
- [`../../docs/testing/verify-app-e2e-discovery-correction.md`](../../docs/testing/verify-app-e2e-discovery-correction.md) — ready redesigned architecture and accepted three-export shared owner.

Basis:

- [`../../AGENTS.md`](../../AGENTS.md) — repeated ownership drift after correction rounds requires returning to architecture instead of patching forward.
- [`../../docs/testing/verify-app-e2e-discovery-correction.md`](../../docs/testing/verify-app-e2e-discovery-correction.md) — one canonical production path contract is now the accepted architecture.

Risk: planner, physical collector, metadata validation, and unit impact can disagree again even after another local fix; verifier output may claim proof for paths that the real app lane cannot execute.

Required final state: add the ready `scripts/lib/appE2EPaths.ts` owner and migrate all production/verifier consumers named by the architecture to it. `e2eRisk` must reject nested app specs and must not reclassify them as support; real nested non-spec helpers remain conservative support. Scenario and applicability metadata must reject non-root app specs. The new path-contract module itself is full application-E2E infrastructure.

Verification: fresh independent test-author proof from the architecture TEST IMPACT, including meaningful nested-spec planner RED, metadata negatives, existing helper preservation, and real Playwright collector/filter proof. Review must also confirm duplicate production predicates were actually removed rather than wrapped.

### M2 — real-collector proof does not safely own its mutable repository probes

Owner: `playwright.lanes.test.ts`.

Problem: the existing collector proof writes fixed repository paths and recursively deletes a generic `tests/e2e/other` directory. A future legitimate `tests/e2e/**/*.test.mjs` file or nested E2E support directory could be overwritten/deleted by unit proof.

Evidence:

- [`../../playwright.lanes.test.ts`](../../playwright.lanes.test.ts) — fixed probe paths and recursive fixed-directory cleanup.
- [`../../vitest.config.ts`](../../vitest.config.ts) — `tests/e2e/**/*.test.mjs` is a supported Vitest population.
- [`../../docs/testing/verify-app-e2e-discovery-correction.md`](../../docs/testing/verify-app-e2e-discovery-correction.md) — ready architecture requires unique proof-owned probes, exclusive creation, and exact cleanup.

Basis:

- [`../../.agents/skills/test-authoring/SKILL.md`](../../.agents/skills/test-authoring/SKILL.md) — tests must own controlled mutable inputs and remain independently runnable without corrupting shared state.
- [`../../docs/testing/verify-app-e2e-discovery-correction.md`](../../docs/testing/verify-app-e2e-discovery-correction.md) — collector probe isolation contract.

Risk: running unit proof can mutate legitimate checkout content and invalidate later proof.

Required final state: use collision-safe unique test-owned paths; never overwrite a pre-existing file; recursively remove only a unique directory created by that invocation; keep real collector and filtered-collector semantics.

Verification: fresh test-author context for the materially changed proof, direct review of creation/cleanup ownership, and focused unit execution of the real collector proof.

## Minor issues

### m1 — a few source/test comments still describe superseded mechanics

Owner: verifier source/test comments.

Problem:

- `scripts/lib/unitRisk.test.ts` says `config/tooling.json` matches an old `src/config/scripts` ordinary-source prefix check even though ordinary dependency-input eligibility is repository-wide;
- `scripts/lib/e2eRisk.ts` describes release specs as running through `pnpm verify --full`, although ordinary source-impact release selection also exists;
- `scripts/verify.ts` says `getFailureReason` excerpts the rolling output buffer even though accepted failure fallback no longer infers from output tails.

Basis:

- [`../../AGENTS.md`](../../AGENTS.md) — durable comments/TSDoc must describe current mechanisms.

Risk: maintenance guidance contradicts the executable design.

Required final state: rewrite those comments only after the behavioral architecture correction, without changing executable behavior or assertions.

Verification: source inspection plus focused format/lint if useful.

## Accepted risks

None.

## Items not required

- Do not reopen Pass A output behavior.
- Do not reopen Pass B metadata classification.
- Do not reopen Pass C unit-impact/direct Vitest discovery beyond migrating its duplicated root-app predicate to the new shared owner.
- Do not reopen Pass D mutation architecture.
- Do not reopen Pass E release-impact ownership.
- Do not redesign CI topology, release timeout budgets, Storybook build reuse, or release-version policy.
- Do not generalize the new app-E2E path owner into a cross-lane registry/glob/path framework.

## Unresolved questions

None.

## NEXT CORRECTION

Owner: `scripts/lib/appE2EPaths.ts` and its application-E2E verifier/config consumers.

Finding: implement the ready architecture in `docs/testing/verify-app-e2e-discovery-correction.md`: replace duplicate production root-app path facts with the narrow shared owner, align planner/metadata/unit consumers, and make the independent real-collector probes collision-safe.

Affected scope: new `scripts/lib/appE2EPaths.ts`, `playwright.config.ts`, `scripts/lib/e2eRisk.ts`, `scripts/lib/e2eProjectApplicability.ts`, `scripts/lib/unitRisk.ts`, their focused unit proof, and `playwright.lanes.test.ts`. Comment-only cleanup remains downstream.
