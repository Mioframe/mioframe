# Review

Verdict: blocked

## Scope reviewed

- Complete final verifier-modernization architecture and benchmark on `refactor/verify-modernization-finish` against the synchronized `develop` baseline.
- Current `playwright.config.ts`, application-E2E registry/applicability ownership, `playwright.lanes.test.ts`, the final unit-impact amendment, and Pass G were reviewed together as one physical test-discovery contract.
- This is a semantic architecture finding, not a request for another local mapping patch.

## Blockers

### B1 — the declared application-E2E inventory is narrower than real Playwright discovery

Owner: application-E2E physical discovery contract (`playwright.config.ts` + `scripts/lib/e2eRisk.ts` + `scripts/lib/e2eProjectApplicability.ts` + `playwright.lanes.test.ts`), with the durable architecture recorded under `docs/testing`.

Problem: the final architecture treats application E2E as a root-only `tests/e2e/*.spec.ts` corpus, but the actual app Playwright config does not enforce that physical population.

Repository evidence:

- `playwright.config.ts` sets `testDir: './tests/e2e'` and does not set `testMatch`;
- the desktop/mobile projects only add `testIgnore` for `storybook/**`, `visual/**`, `release/**`, plus basename applicability ignores;
- `scripts/lib/e2eRisk.ts:isAppE2ESpecPath()` treats any non-reserved nested `tests/e2e/**/*.spec.ts` as an app spec, but `validateE2EScenarioRegistry()` inventories only direct `tests/e2e/*.spec.ts` children via non-recursive `readdirSync`;
- `scripts/lib/e2eProjectApplicability.ts` explicitly owns only root `tests/e2e/*.spec.ts` and validates only that root population;
- `playwright.lanes.test.ts` calls `listFiles('tests/e2e', '.spec.ts', { recursive: false })` for application specs while claiming to account for every existing spec in one logical lane;
- `docs/testing/verify-unit-impact-correction.md` then codifies `tests/e2e/<other-subtree>/**/*.spec.ts` as outside `playwright.lanes.test.ts` ownership, and Pass G records `tests/e2e/other/example.spec.ts` as the required negative case.

Tool/runtime evidence:

- the repository currently uses `@playwright/test` 1.61.1;
- Playwright's `TestConfig.testDir` contract recursively scans the configured directory for test files;
- when `testMatch` is omitted, Playwright's default matches both `*.spec.*` and `*.test.*` JavaScript/TypeScript test shapes.

Therefore a hypothetical `tests/e2e/other/example.spec.ts` is **not** outside actual app Playwright discovery today: it is collected recursively because it is neither in `storybook/`, `visual/`, nor `release/`. Likewise an app-lane `*.test.ts` / `*.test.mjs` shape can be collected by default even though every repository inventory/registry assumes application browser proof is `*.spec.ts`.

Risk:

- a nested app spec can execute in Playwright while being invisible to scenario-registry completeness, project-applicability completeness, and the lane inventory proof;
- because it is not required to enter `E2E_SCENARIO_SCOPES`/`APP_E2E_STANDALONE_SPECS`, later source changes can silently omit that product scenario;
- the final Pass C negative test and Pass G benchmark currently prove consistency with the **root-only validator**, not with actual Playwright collection;
- the repository therefore cannot truthfully claim that the final inventory/ownership proof is complete.

This is materially untrustworthy required proof and blocks PR publication.

## Architecture decision for correction

Do not ask the implementation agent to choose between recursive and root-only application E2E.

The simplest viable final architecture is **root-only application E2E specs**:

```text
application Playwright config
→ tests/e2e/*.spec.ts only

storybook behavior
→ tests/e2e/storybook/**/*.spec.ts
  + src/**/*.browser.spec.ts

visual
→ tests/e2e/visual/**/*.spec.ts
  + src/**/*.visual.spec.ts

release
→ tests/e2e/release/**/*.spec.ts
```

Why this is chosen:

- every current application product spec is already a direct child of `tests/e2e`;
- `E2E_SCENARIO_SCOPES`, `APP_E2E_STANDALONE_SPECS`, `E2E_PROJECT_APPLICABILITY`, and the lane-disjointness proof are already designed around that root-only application population;
- no confirmed current requirement needs nested application specs;
- expanding three registries/validators/unit scan ownership to recursive arbitrary app subtrees would add complexity without a user/product requirement.

The correction must therefore make **actual `playwright.config.ts` collection** enforce the existing root-only `*.spec.ts` application policy. Do not merely add another validator that still disagrees with Playwright.

Required final state:

1. App Playwright collection physically includes only direct `tests/e2e/*.spec.ts` product specs; it must not collect arbitrary nested `tests/e2e/<other-subtree>/**/*.spec.ts` or app-lane `*.test.ts` / `*.test.mjs` files.
2. Reserved Storybook/visual/release populations continue to be owned by their separate configs and are not collected by the app config.
3. `validateE2EScenarioRegistry()`, `validateE2EProjectApplicability()`, and `playwright.lanes.test.ts` remain root-only for application specs because they then match the real config rather than a narrower local convention.
4. `unitRisk.ts` may keep the root-app bounded scan ownership only after real app discovery has been made root-only; the `tests/e2e/other/example.spec.ts` negative case is valid only under that corrected config.
5. Add independent executable/config-derived proof of the real Playwright collection boundary. Pure planner/unit predicates are insufficient. At minimum prove:
   - a real root `tests/e2e/*.spec.ts` app spec is collected;
   - a synthetic/controlled nested `tests/e2e/other/example.spec.ts` shape is not app-collected;
   - a synthetic/controlled app-lane `tests/e2e/example.test.mjs` shape is not app-collected;
   - reserved Storybook/visual/release specs remain outside the app lane.
6. Keep product scenario and project-applicability ownership separate; do not duplicate the full scenario registry into the lane test.
7. Update `docs/testing/verify-unit-impact-correction.md` wording so the Playwright-inventory negative case is justified by the **actual app config contract**, not merely by what `playwright.lanes.test.ts` happens to scan.
8. Refresh the affected Pass G app-inventory case after executable discovery proof is green.

Because repeated Pass C correction rounds already touched the same Playwright/unit inventory boundary, this must be treated as an architecture correction before implementation, per root `AGENTS.md` / implementation-preflight. Do not add another ad-hoc scan exception.

Verification for closure:

- fresh independent test-author context;
- executable Playwright/config collection proof for the physical app-spec population;
- focused E2E registry/applicability/lane/unit planner tests for the resulting boundary;
- no broad browser suite is required merely to prove discovery semantics.

## Major issues

### M1 — final modernization/finish status and benchmark are no longer valid while PR-level findings are open

Owners: `docs/testing/verify-modernization.md`, `docs/testing/verify-finish-plan.md`.

Current durable docs say semantic review is complete and the benchmark has no known silent false negative. The full PR-level review has now found:

- the application-E2E physical discovery blocker above;
- the release-impact consumer-graph blocker recorded in `scripts/lib/REVIEW.md`;
- a direct Vitest test-discovery mismatch recorded in `scripts/lib/REVIEW.md`.

Required final state after those owner corrections:

- do not claim semantic review complete while any owner-local review finding remains open;
- refresh only benchmark rows/evidence invalidated by the corrections, including real app discovery and release runner/proof-only cases;
- retain already-valid A/B/D/F evidence rather than rebuilding the entire benchmark unnecessarily;
- exact-head CI critical-path/merge-latency remains pending until the PR is actually published and its final head is tested;
- delete this `docs/testing/REVIEW.md` only after final re-review confirms the corrected architecture and benchmark.

## Minor issues

None here; source/comment cleanup is recorded under `scripts/lib/REVIEW.md`.

## Accepted risks

None.

## Items not required

- Do not redesign Storybook behavior, visual, or release physical test locations to solve the application-lane mismatch.
- Do not move current root application E2E specs into a new directory; the existing root-only convention is sufficient once the real app config enforces it.
- Do not introduce a generic Playwright test-discovery registry beside the real configs.
