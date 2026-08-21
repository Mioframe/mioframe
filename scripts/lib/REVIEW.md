# Review

Verdict: blocked

## Scope reviewed

- Complete verifier-modernization finish implementation on `refactor/verify-modernization-finish`, with Pass C re-reviewed against the final acceptance model in `docs/testing/verify-unit-impact-correction.md` and against the **current final branch tree**, including tests added/changed by earlier finish passes.

## Blockers

### B1 — Pass C still models only part of external Vitest ownership

Owner: `scripts/lib/unitRisk.ts`

Problem: repository-wide ordinary `vitest related` now correctly owns import-reachable tests, but current external ownership still assumes that non-import ownership is mainly an exact-file mapping problem. Current Vitest proof also consumes repository state through runtime config discovery, bounded repository scans, existence/absence assertions, and imported production helpers that perform default repository discovery. Those mechanisms are not represented completely, so focused unit selection can still silently omit real owners.

Evidence:

- [`../../eslint.config.test.ts`](../../eslint.config.test.ts) constructs `new ESLint({ cwd: import.meta.dirname })`; the test exercises `eslint.config.mjs` through ESLint runtime discovery rather than importing it. Current `unitRisk.ts` has no external owner for `eslint.config.mjs -> eslint.config.test.ts`.
- `UNIT_FILE_AS_DATA_MAPPINGS` still encodes `scripts/release/viteBuildDate.test.mjs` as an external owner of `vite.config.ts`, although that test imports `vite.config.ts` normally. This duplicates ownership already delegated to Vitest related.
- [`../verify.test.ts`](../verify.test.ts) now reads `.github/workflows/verify.yml` directly to prove the `verification-release` timeout envelope, but the current `.github/workflows/verify.yml` external mapping does not include `scripts/verify.test.ts`. This owner was introduced during the finish branch itself and demonstrates why the audit must use the current final tree rather than the original baseline.
- [`../../src/readRecoveryImportBoundary.test.ts`](../../src/readRecoveryImportBoundary.test.ts) scans production `src/**/*.{ts,vue}` through `readdir`/`readFile` without importing each scanned source.
- [`../../src/features/fileSystemAccessImportBoundary.test.ts`](../../src/features/fileSystemAccessImportBoundary.test.ts) scans production `src/features/**/*.{ts,vue}` the same way.
- [`../../src/shared/ui/material/rendererBoundary.test.ts`](../../src/shared/ui/material/rendererBoundary.test.ts) scans runtime source outside the Material subtree for forbidden renderer references.
- [`../../src/shared/ui/material/foundation/tokens.test.ts`](../../src/shared/ui/material/foundation/tokens.test.ts) scans `src/shared/ui/material/components/*/tokens.css` and also owns fixed existence/absence assertions such as the removed legacy token path.
- [`../../playwright.lanes.test.ts`](../../playwright.lanes.test.ts) scans the current Playwright spec populations to prove lane discovery remains disjoint. Playwright specs are intentionally excluded from ordinary Vitest ownership, so this scan owner must be represented separately when those paths change.
- [`e2eRisk.test.ts`](e2eRisk.test.ts) calls `validateE2EScenarioRegistry()` against the real repository and therefore owns the current application-E2E spec inventory outside the test module graph.
- [`e2eProjectApplicability.test.ts`](e2eProjectApplicability.test.ts) calls `validateE2EProjectApplicability()` against discovered real app-E2E specs and therefore also owns that inventory.
- [`storybookBehaviorRisk.test.ts`](storybookBehaviorRisk.test.ts) uses real Storybook behavior discovery/registry validation, including a real colocated browser-spec discovery assertion.
- [`visualRisk.test.ts`](visualRisk.test.ts) calls `findColocatedVisualSpecFiles()` without an override and asserts the real Loading Indicator visual spec is discoverable. This is repository lookup through an imported production helper, not a module dependency from that spec back to the unit test.

Basis:

- [`../../docs/testing/verify-unit-impact-correction.md`](../../docs/testing/verify-unit-impact-correction.md) defines the final Pass C acceptance matrix: import ownership stays delegated to Vitest; exact non-import inputs use exact external ownership; deterministic repository scans use narrow scan-owner rules; runtime/tool discovery and existence/absence contracts are explicit external ownership mechanisms.
- [`../../.agents/skills/implementation-preflight/SKILL.md`](../../.agents/skills/implementation-preflight/SKILL.md) now requires impact/selection planners to enumerate ownership mechanisms and to verify delegated resolver semantics rather than treating path examples or grep output as the architecture.
- [`../../docs/testing/verify-target-architecture.md`](../../docs/testing/verify-target-architecture.md) forbids reconstructing the ordinary module graph and requires truthful, fail-closed impact selection.

Risk: a focused unit plan can be green while omitting a boundary/config/inventory test that actually observes the changed repository input. Conversely, redundant external mappings duplicate module ownership and make the planner harder to reason about.

Required final state:

- satisfy every row of the final ownership acceptance matrix in `verify-unit-impact-correction.md`;
- audit the **complete current Vitest-owned population on this finish branch**, including tests added/modified by Passes A-F, for repository observations outside the module graph;
- add the smallest external owner for runtime-discovered `eslint.config.mjs -> eslint.config.test.ts` unless an executable real `vitest related` probe disproves the premise;
- include `scripts/verify.test.ts` in `.github/workflows/verify.yml` external ownership while that direct read remains part of its workflow-timeout contract;
- remove import-reachable owners such as `viteBuildDate.test.mjs` from exact external mappings when the real resolver selects them;
- represent confirmed bounded repository scans with narrow local path predicates that mirror each test's actual scanned population and add only the exact scan-owner test(s);
- include planner self-validation/discovery tests when a changed spec/inventory path can change their real-repository validation result;
- include exact existence/absence ownership where a current test observes a repository path that may be absent;
- keep all external ownership additive to ordinary related inputs;
- preserve direct-test recognition, Playwright exclusion from ordinary unit ownership, package handling, and deletion/rename fail-closed behavior;
- do not add a generated dependency graph, per-file generated mappings, full-unit fallback for every scanned root, or a generic cross-lane ownership framework.

Verification:

- fresh test-author proof must cover the complete mechanism matrix, not a hand-written subset of examples;
- pure planner assertions are insufficient for delegated ownership: representative ordinary-import, exact-external, runtime-discovery, and bounded-scan cases must also be proven through the real focused resolver/invocation as specified by `verify-unit-impact-correction.md`;
- at minimum prove runtime-discovered ESLint config ownership, the current `verify.yml -> scripts/verify.test.ts` owner, removal of the redundant `viteBuildDate` mapping without losing that owner, one broad source boundary scan, Material component-token scan, app-E2E inventory validation, Playwright lane-inventory scan, and exact absence/existence ownership;
- the test-author must not change unrelated production or existing proof merely to manufacture an ownership relation that makes planner metadata easier to justify.

## Major issues

None.

## Resolved findings

- Repository-wide ordinary unit dependency inputs replace the old `src/config/scripts` dependency boundary.
- External ownership is additive rather than suppressing ordinary related resolution.
- Root imported modules and `tests/e2e/**` Vitest helpers are eligible for ordinary related resolution.
- Pass A failure-detail extraction is resolved.
- The stale visual-owner proof is resolved.
- Pass F release-impact timeout ownership is resolved.
- Previous release false-negative ownership and release proof-only over-selection remain resolved.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Do not expand mutation/release/classification architecture while correcting Pass C.
- Do not introduce a general-purpose repository dependency graph or task runner.
