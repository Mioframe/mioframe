# Review

Verdict: blocked

## Scope reviewed

- Complete current `develop...refactor/verify-modernization-finish` verifier-modernization result.
- Pass A output, Pass B metadata classification, Pass C unit impact/direct Vitest discovery, Pass D mutation ownership, Pass E release-impact, and Pass F CI topology were re-read against their current canonical contracts.
- Application-E2E physical discovery was re-reviewed end-to-end across `playwright.config.ts`, `e2eRisk.ts`, applicability/registry ownership, `playwright.lanes.test.ts`, unit scan ownership, and verifier command composition.
- Architect-owned Pass A/status/benchmark documentation found stale during this review has already been aligned; the remaining minor items below are source/test comments only.

## Blockers

None.

## Major issues

### M1 — app-E2E changed-spec classification is still broader than the physical root-only lane

Owner: `scripts/lib/e2eRisk.ts`.

Problem: `isAppE2ESpecPath()` still treats any non-Storybook/non-visual/non-release `tests/e2e/**/*.spec.ts` path as an application spec. Therefore an arbitrary nested path such as `tests/e2e/other/example.spec.ts` is classified as a focused app-E2E spec and `resolveAppE2EPlan()` returns it in `specs`. The verifier then passes focused `appE2EPlan.specs` directly to `pnpm e2e:container`.

The physical application lane is intentionally root-only through `playwright.config.ts` `testMatch: '**/tests/e2e/*.spec.ts'`; the architecture explicitly says an arbitrary nested spec is not application E2E. CLI file filtering must not create a planner population broader than the configured collector.

Evidence:

- [`e2eRisk.ts`](./e2eRisk.ts) — `isAppE2ESpecPath()` excludes reserved subtrees but does not require a direct child; `resolveAppE2EPlan()` adds every matching changed spec to `focusedSpecs`.
- [`../../playwright.config.ts`](../../playwright.config.ts) — physical application `testMatch` is root-only.
- [`../verify.ts`](../verify.ts) — focused app plans become `createE2ECommand(appE2EPlan.specs, ...)`.
- [`../../docs/testing/verify-app-e2e-discovery-correction.md`](../../docs/testing/verify-app-e2e-discovery-correction.md) — durable contract requires one root-only population across collector and planner.

Basis:

- [`../../docs/testing/verify-app-e2e-discovery-correction.md`](../../docs/testing/verify-app-e2e-discovery-correction.md) — direct `tests/e2e/*.spec.ts` only.
- [`../../.agents/skills/implementation-preflight/SKILL.md`](../../.agents/skills/implementation-preflight/SKILL.md) — impact planners delegated to a real resolver must match that resolver's truthful population.

Risk: the verifier can claim focused application-E2E proof for a file the configured app lane cannot collect, reintroducing planner/discovery drift at the boundary this modernization is intended to make truthful.

Required final state: application-spec recognition in `e2eRisk.ts` must match the root-only corpus used by `playwright.config.ts`, scenario-registry discovery, and project-applicability discovery. A nested unassigned `*.spec.ts` must not become an app spec or an app support file merely because it is under `tests/e2e/`. Real non-spec nested support may remain conservatively app-owned. Reserved Storybook/visual/release ownership remains unchanged.

Verification: fresh independent test-author proof with root positive, arbitrary nested spec negative, nested ordinary support preservation, reserved-lane negatives, and a real Playwright collector/filter probe showing the delegated app collector remains root-only when a nested path is supplied as a filter.

### M2 — real-collector proof can overwrite or delete legitimate repository paths

Owner: `playwright.lanes.test.ts`.

Problem: the collector proof writes fixed paths `tests/e2e/other/example.spec.ts` and `tests/e2e/example.test.mjs`, then unconditionally removes the entire `tests/e2e/other` directory and the root test file in `finally`.

`tests/e2e/**/*.test.mjs` is a supported Vitest population, and nested E2E support directories may exist independently of application spec discovery. The current proof can overwrite and/or recursively delete valid repository content.

Evidence:

- [`../../playwright.lanes.test.ts`](../../playwright.lanes.test.ts) — fixed probe creation and recursive fixed-directory cleanup.
- [`../../vitest.config.ts`](../../vitest.config.ts) — `tests/e2e/**/*.test.mjs` is a real Vitest include class.
- [`../../docs/testing/verify-app-e2e-discovery-correction.md`](../../docs/testing/verify-app-e2e-discovery-correction.md) — now explicitly requires collision-safe proof-owned probes and exact cleanup.

Basis:

- [`../../.agents/skills/test-authoring/SKILL.md`](../../.agents/skills/test-authoring/SKILL.md) — tests own controlled input/state and must not corrupt shared mutable repository state.
- [`../../docs/testing/verify-app-e2e-discovery-correction.md`](../../docs/testing/verify-app-e2e-discovery-correction.md) — collector-proof safety contract.

Risk: running unit proof can silently mutate legitimate checkout content and make subsequent proof unreliable or destructive.

Required final state: collector probes use collision-safe proof-owned paths, never overwrite pre-existing content, and remove only paths created by that test. The proof still exercises one nested `*.spec.ts`, one direct-root default Playwright `*.test.*`, and real collection without browser/server launch.

Verification: fresh test-author context for the materially changed proof, direct review of creation/cleanup isolation, and focused unit execution of `playwright.lanes.test.ts`.

## Minor issues

### m1 — a few source/test comments still describe superseded mechanics

Owner: verifier source/test comments.

Problem: architect-owned docs/status are now aligned, but these source/test comments remain inaccurate:

- `scripts/lib/unitRisk.test.ts` says `config/tooling.json` matches an old `src/config/scripts` ordinary-source prefix check even though ordinary dependency-input eligibility is repository-wide;
- `scripts/lib/e2eRisk.ts` describes release specs as running through `pnpm verify --full`, although ordinary source-impact release selection also exists;
- `scripts/verify.ts` says `getFailureReason` excerpts the rolling output buffer even though accepted failure fallback no longer infers from output tails.

Evidence:

- [`unitRisk.test.ts`](./unitRisk.test.ts) — `config/tooling.json` audit rationale.
- [`e2eRisk.ts`](./e2eRisk.ts) — release-spec TSDoc.
- [`../verify.ts`](../verify.ts) — rolling-buffer return comment near `runCommand()`.

Basis:

- [`../../AGENTS.md`](../../AGENTS.md) — durable comments/TSDoc should describe current mechanisms and obsolete wording should be removed with replaced logic.

Risk: maintenance guidance contradicts the executable final design even though behavior is correct.

Required final state: rewrite those comments to describe current mechanisms only. No executable behavior, planner ownership, assertions, or command semantics change.

Verification: source inspection plus focused formatting/lint if useful.

## Accepted risks

None.

## Items not required

- Do not reopen Pass A verifier output behavior; its canonical document is now aligned with the accepted implementation.
- Do not reopen Pass B repository-metadata classification.
- Do not reopen Pass C unit-impact architecture/direct Vitest discovery.
- Do not reopen Pass D mutation architecture.
- Do not reopen Pass E release-impact consumer ownership without new evidence.
- Do not redesign CI topology, release timeout budgets, Storybook build reuse, or release-version policy.
- Do not introduce a generic Playwright discovery registry or shared glob framework to fix M1/M2.

## Unresolved questions

None.

## NEXT CORRECTION

Owner: application-E2E discovery/selection proof (`scripts/lib/e2eRisk.ts`, `scripts/lib/e2eRisk.test.ts`, `playwright.lanes.test.ts`).

Finding: complete the selected root-only application-E2E architecture across planner classification and make its real-collector proof collision-safe. A nested unassigned spec must not be selected as an app spec/support path, real nested non-spec support must not be accidentally suppressed, and proof probes must never overwrite/delete pre-existing repository content.

Affected scope: `scripts/lib/e2eRisk.ts`, `scripts/lib/e2eRisk.test.ts`, `playwright.lanes.test.ts`, existing root-only application discovery/applicability proof. Remaining comment-only cleanup stays separate after this behavioral correction.
