# Database virtualization relation readiness proof correction preflight

Status: **ready**.

## Authoring source

This narrow correction is fully resolved by current repository evidence and does not require a separate architecture handoff.

Authoritative inputs:

- `tests/e2e/REVIEW.md` — active B1 and required final state;
- `docs/testing/architecture.md` — application E2E/browser proof policy;
- `.agents/skills/verification/SKILL.md` — focused feedback and branch handoff gate;
- Playwright 1.61 locator assertion contract used by the repository.

## Goal

Remove the relation selected-view scenario's unstable custom polling/sampling boundary and prove the same row-order contract with one Playwright web-first locator-list assertion.

## Non-goals

- no production, relation-value, DatabaseDataTable, virtualization, query, persistence, loading, or UI behavior change;
- no timeout/retry/sleep/recovery change;
- no global rewrite of `expectDatabaseValuesInOrder()` or `getDatabaseRowTexts()`;
- no E2E mapping/project-applicability/verifier change;
- no new helper abstraction or diagnostic framework.

## Confirmed current behavior and evidence

The reproduced failed initial attempt reported an empty joined row order from `expectDatabaseValuesInOrder()`, but the diagnostic captured immediately after that failed sample observed:

- no loading indicator;
- one Database table;
- `aria-rowcount="3"`;
- no row bootstrap;
- two mounted real tbody rows;
- both expected alpha/beta row texts;
- default relation view selected.

The whole-test retry passed.

`getDatabaseRowTexts()` currently samples row state through a separate `count()` call followed by individual `innerText()` calls. The relation scenario wraps that helper in `expect.poll()` and performs additional diagnostic DOM reads after each failed callback sample.

The captured state therefore does not justify a production correction. The correction owner is the scenario proof itself.

## Owner and entry point

Owner: `tests/e2e`.

Expected changed file only:

- `tests/e2e/databaseViewsAndQueryFlows.spec.ts`

Existing shared helper files remain unchanged.

## Minimum implementation design

Inside `uses default relation view inline and switches to a selected relation view`:

1. Define/reuse a locator for real relation rows:

   `relationField.locator('tbody > tr:not([aria-hidden="true"])')`

2. Replace the initial custom:

   `expect.poll(() => expectDatabaseValuesInOrder(...))`

   with one Playwright locator-list web-first assertion that preserves current semantics:

   `await expect(relationRows).toContainText([alphaValue, betaValue])`

3. After selecting the descending view, replace the later custom polling assertion with:

   `await expect(relationRows).toContainText([betaValue, alphaValue])`

4. Remove all temporary relation-readiness diagnostic state/capture/logging from this scenario:

   - `latestRelationReadinessSnapshot`;
   - `captureRelationReadinessSnapshot`;
   - diagnostic `try/catch`;
   - `[relation-readiness]` logging.

No replacement diagnostic is required.

### Simpler alternative comparison

Adding another wait, readiness state, timeout, or production signal would add a second concept without evidence of an incorrect product state. A locator-list web-first assertion directly observes the required rendered row order and already owns retrying asynchronous DOM convergence, so it is the minimum complete correction.

## Behavior equivalence

The current helper checks that the expected values occur in the joined row texts in the requested order and does not require that they are the only rows.

Playwright array `toContainText()` on the row locator likewise requires matching expected text values in locator-list order while allowing additional rows. This is the intended equivalent proof for this scenario.

Do not use `toHaveText([...])`, because that would strengthen the contract to an exact row count/list and would not be equivalent to the existing scenario requirement.

## TEST IMPACT

- Contract/scenario: inline relation uses the default target view, then applies a selected descending target view and renders rows in the corresponding order.
  - Primary proof owner: `tests/e2e/databaseViewsAndQueryFlows.spec.ts`.
  - Existing proof: same scenario, currently using custom `expect.poll()` + `expectDatabaseValuesInOrder()`.
  - Updated proof: same scenario using `toContainText([...])` on real tbody rows for both default and descending order.
  - Additional proof: none required.
  - Risk/platform matrix: desktop Chromium per existing application-E2E project applicability; do not reclassify projects.
  - Durable ownership/impact updates: none; the E2E source-to-product-scenario mapping is already corrected and accepted.

## Required removal

After the correction this scenario must contain no relation-readiness diagnostic instrumentation and no `expect.poll(() => expectDatabaseValuesInOrder(...))` for its two row-order checks.

Do not remove `expectDatabaseValuesInOrder()` from `tests/e2e/helpers.ts`; other consumers remain outside this correction.

## Verification

Focused implementation feedback:

`pnpm verify --only e2e --files tests/e2e/databaseViewsAndQueryFlows.spec.ts`

Then applicable static checks for the changed spec when useful.

Final coding-agent branch handoff gate:

`pnpm verify --base origin/develop`

The branch gate must be clean. A retry-pass/flaky result is not clean.

Exact-head GitHub CI remains architect-owned and must later pass without flaky classification.

## Stop conditions

Stop and report evidence instead of expanding scope if:

- the focused scenario still flakes/fails after the web-first assertion replacement;
- failure evidence shows an incorrect persisted/product relation state rather than assertion convergence;
- fixing the failure would require production, helper-global, verifier, timeout/retry, or architecture changes.

## Forbidden

- production/runtime changes;
- edits to `tests/e2e/helpers.ts`;
- changes to expected alpha/beta or beta/alpha order;
- `toHaveText([...])` exact-list strengthening;
- extra waits, sleeps, timeout increases, retries, recovery, `force`, or repeated user actions;
- new readiness flags or test-only production seams;
- new diagnostic instrumentation;
- E2E mapping or project-applicability changes;
- shared virtualization/TanStack changes;
- editing architect-owned `tests/e2e/REVIEW.md`, this preflight, canonical virtualization docs, or PR metadata;
- manual package version changes.

## Readiness

Owner, expected final state, exact changed file, proof semantics, required removal, verification, and stop conditions are resolved.

Verdict: **ready**.
