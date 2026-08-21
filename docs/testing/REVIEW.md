# Review

Verdict: blocked

## Scope reviewed

- Pass G final benchmark and finish-completion evidence after the latest Pass C ownership correction.

## Blockers

### B1 — the recorded final benchmark is not valid against the current implementation/proof state

Owner: `docs/testing/verify-modernization.md`

The document now contains the complete canonical representative table, but its finish conclusion is still invalid for two reasons owned by `scripts/lib/REVIEW.md`:

1. Pass C still has a status-aware false negative for deleted/renamed exact external inputs (`PRIVACY.md`, workflow YAML, `.gitignore` class).
2. the recorded real-resolver case for `tests/e2e/appSmoke.spec.ts` selects `playwright.lanes.test.ts`, while that owner currently contains a stale assertion against top-level `appConfig.testIgnore` and is red against the actual project-level Playwright config. Therefore this case cannot count as green end-to-end ownership evidence in the current tree.

The current benchmark also describes `playwright.lanes.test.ts` ownership using the broader `tests/e2e/**/*.spec.ts` category, while the test's actual scan is narrower (root app specs plus the explicit storybook/visual/release subtrees and colocated src specs). Refresh the record after that predicate is corrected.

Required final state:

- resolve every active finding in `scripts/lib/REVIEW.md` first;
- sync the finish branch with current `develop` and ensure the external-ownership audit still covers the resulting complete Vitest population;
- rerun only the representative cases invalidated by the final corrections/integration, including:
  - deleted/renamed exact external input status handling;
  - Playwright inventory scan with every selected unit owner green;
  - a negative nested `tests/e2e/<other-subtree>/*.spec.ts` case proving the lane scan owner is not over-selected;
- update the final table/false-negative and accepted-over-selection sections to match the resulting implementation;
- keep exact-head CI critical-path / merge-latency explicitly pending until the published PR exists;
- do not add benchmark infrastructure.

## Major issues

None beyond the owner-local Pass C findings.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Do not rerun every expensive child proof locally; only planner/resolver benchmark cases invalidated by the final correction and develop integration are required before PR publication.
- A standalone benchmark framework or historical metrics database is not required.
