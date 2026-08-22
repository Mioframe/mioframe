# Review

Verdict: blocked

## Scope reviewed

- Complete current `develop...refactor/verify-modernization-finish` verifier-modernization result.
- Pass A output, Pass B metadata classification, Pass D mutation ownership, Pass E release-impact, Pass F CI topology, and exact Vitest direct-test discovery were re-read against their current canonical contracts.
- Application-E2E physical discovery was re-reviewed end-to-end across `playwright.config.ts`, `e2eRisk.ts`, applicability/registry ownership, `playwright.lanes.test.ts`, unit scan ownership, and verifier command composition.
- Final comment/TSDoc cleanup was inspected after implementation.

## Blockers

None.

## Major issues

### M1 — app-E2E changed-spec classification is still broader than the physical root-only lane

Owner: `scripts/lib/e2eRisk.ts`.

Problem: `isAppE2ESpecPath()` still treats any non-Storybook/non-visual/non-release `tests/e2e/**/*.spec.ts` path as an application spec. Therefore an arbitrary nested path such as `tests/e2e/other/example.spec.ts` is classified as a focused app-E2E spec and `resolveAppE2EPlan()` returns it in `specs`. The verifier then passes focused `appE2EPlan.specs` directly to `pnpm e2e:container`.

The physical application lane is now intentionally root-only through `playwright.config.ts` `testMatch: '**/tests/e2e/*.spec.ts'`; the accepted architecture explicitly says `tests/e2e/other/example.spec.ts` is not an application-E2E file. Playwright CLI file arguments are additional file filters; `testMatch` remains the configured test-file discovery boundary, so passing a nested path does not make that file part of the application lane.

Evidence:

- [`e2eRisk.ts`](./e2eRisk.ts) — `isAppE2ESpecPath()` checks `tests/e2e/` plus reserved-subtree exclusions but does not require a direct child; `resolveAppE2EPlan()` adds every matching changed spec to `focusedSpecs`.
- [`../../playwright.config.ts`](../../playwright.config.ts) — top-level `testMatch` is root-only `**/tests/e2e/*.spec.ts`.
- [`../../scripts/verify.ts`](../verify.ts) — focused app plans become `createE2ECommand(appE2EPlan.specs, ...)`, so planner spec paths are handed to the real app Playwright command.
- [`../../docs/testing/verify-app-e2e-discovery-correction.md`](../../docs/testing/verify-app-e2e-discovery-correction.md) — accepted matrix says `tests/e2e/other/example.spec.ts` is not app-collected and has no app owner until explicitly assigned.

Basis:

- [`../../docs/testing/verify-app-e2e-discovery-correction.md`](../../docs/testing/verify-app-e2e-discovery-correction.md) — application E2E is direct `tests/e2e/*.spec.ts` only and `e2eRisk.ts` owns source/spec selection for that root corpus.
- [`../../.agents/skills/implementation-preflight/SKILL.md`](../../.agents/skills/implementation-preflight/SKILL.md) — impact planners must match the truthful delegated resolver rather than letting planner tests and the real resolver encode different populations.

Risk: the verifier can claim a focused application-E2E selection for a file the configured app lane cannot collect. This reintroduces planner/discovery drift at the exact boundary the physical-discovery correction was intended to close and makes the focused command unreliable for that changed-path class.

Required final state: application-spec recognition in `e2eRisk.ts` must describe the same root-only corpus as `playwright.config.ts`, scenario-registry discovery, and project-applicability discovery. A nested unassigned `*.spec.ts` must not become an app spec or an app support file merely because it is under `tests/e2e/`. Reserved Storybook/visual/release ownership remains unchanged.

Verification: fresh independent test-author proof must include root positive and arbitrary nested negative planner cases, plus a real Playwright collector/filter probe sufficient to show that the delegated app collector remains root-only when a file filter is supplied. Existing scenario/applicability completeness must remain green.

### M2 — real-collector proof can overwrite or delete legitimate repository paths

Owner: `playwright.lanes.test.ts`.

Problem: the collector proof writes fixed paths `tests/e2e/other/example.spec.ts` and `tests/e2e/example.test.mjs`, then unconditionally removes the entire `tests/e2e/other` directory and the root test file in `finally`.

`tests/e2e/**/*.test.mjs` is an explicitly supported Vitest population, so `tests/e2e/example.test.mjs` is a legitimate future repository path. Nested `tests/e2e/**` support directories are also allowed independently of application test discovery. The current proof would overwrite such a file and/or recursively delete unrelated pre-existing contents.

Evidence:

- [`../../playwright.lanes.test.ts`](../../playwright.lanes.test.ts) — fixed probe names are created with `writeFileSync`; cleanup uses `rmSync(nestedProbeDir, { recursive: true, force: true })` and removes the root probe unconditionally.
- [`../../vitest.config.ts`](../../vitest.config.ts) — `tests/e2e/**/*.test.mjs` is a real Vitest include class.
- [`../../docs/testing/verify-unit-impact-correction.md`](../../docs/testing/verify-unit-impact-correction.md) — `tests/e2e/**/*.test.mjs` is explicitly part of direct Vitest discovery, while application E2E remains root-only.

Basis:

- [`../../.agents/skills/test-authoring/SKILL.md`](../../.agents/skills/test-authoring/SKILL.md) — tests must own their test data/state, be independently runnable, and not leave or corrupt mutable shared state.
- [`../../docs/testing/verify-app-e2e-discovery-correction.md`](../../docs/testing/verify-app-e2e-discovery-correction.md) — the real collector probe is proof infrastructure for the root-only boundary, not authority to reserve or delete otherwise valid repository paths.

Risk: an allowed future Vitest test or E2E support directory can be silently overwritten/deleted by running the unit proof, mutating the checkout and making later checks unreliable or destructive.

Required final state: collector probes must use collision-safe, proof-owned paths and must remove only paths created by that test. Creation must not overwrite pre-existing repository content. The proof must still exercise the real application config with one nested `*.spec.ts` probe and one direct-root default Playwright `*.test.*` probe.

Verification: route the proof change through a fresh test-author context because this materially changes automated proof. Review the final creation/cleanup semantics and run the focused owning unit proof; no browser launch is required.

## Minor issues

### m1 — final documentation/comments still contain small post-correction drift

Owner: verifier documentation/comments.

Problem: the cleanup removed the known temporary review references, but several final-state descriptions are still inaccurate:

- `docs/testing/verify-agent-output.md` says that when no reliable semantic extraction exists the default failure path should print a bounded diagnostic excerpt, while accepted `getFailureReason()` deliberately falls back to `exit code + log pointer` because arbitrary output tails are not trustworthy;
- `scripts/lib/unitRisk.test.ts` still says `config/tooling.json` matches an old `src/config/scripts` ordinary-source prefix check even though ordinary dependency-input eligibility is repository-wide;
- `scripts/lib/e2eRisk.ts` describes release specs as running through `pnpm verify --full`, although ordinary source-impact release selection also exists;
- `scripts/verify.ts` still comments that `getFailureReason` excerpts the rolling output buffer, but it no longer does;
- the `scripts/playwrightContainer.ts` benchmark row in `docs/testing/verify-modernization.md` marks visual/app-E2E/Storybook behavior as `n/a`, although that shared runner is explicitly full-lane infrastructure for all three browser planners.

Evidence:

- [`../../docs/testing/verify-agent-output.md`](../../docs/testing/verify-agent-output.md) — “Actionable failure” / “Failure-detail extraction”.
- [`unitRisk.test.ts`](./unitRisk.test.ts) — `config/tooling.json` audit rationale.
- [`e2eRisk.ts`](./e2eRisk.ts) — release-spec TSDoc.
- [`../verify.ts`](../verify.ts) — rolling-buffer return comment near `runCommand()`.
- [`../../docs/testing/verify-modernization.md`](../../docs/testing/verify-modernization.md) — representative benchmark.

Basis:

- [`../../AGENTS.md`](../../AGENTS.md) — touched public TSDoc and durable repository documentation must remain accurate; obsolete comments should be removed with replaced logic.
- [`../../docs/testing/verify-agent-output.md`](../../docs/testing/verify-agent-output.md) and the accepted Pass A implementation together define the final presentation contract and must not contradict one another.

Risk: future maintainers receive conflicting ownership/execution guidance even though executable behavior is already correct.

Required final state: architect-owned docs must describe the accepted final behavior; source/test comments must describe current mechanisms only. No executable behavior or assertions should change for this minor cleanup.

Verification: source/document inspection plus focused formatting/lint only if needed.

## Accepted risks

None.

## Items not required

- Do not reopen Pass B repository-metadata classification.
- Do not reopen Pass D mutation architecture.
- Do not reopen Pass E release-impact consumer ownership without new evidence.
- Do not redesign verifier output behavior; align its canonical documentation with the already accepted implementation.
- Do not redesign CI topology, release timeout budgets, Storybook build reuse, or release-version policy.
- Do not introduce a generic Playwright discovery registry or shared glob framework to fix M1/M2.

## Unresolved questions

None.

## NEXT CORRECTION

Owner: application-E2E discovery/selection proof (`scripts/lib/e2eRisk.ts`, `scripts/lib/e2eRisk.test.ts`, `playwright.lanes.test.ts`).

Finding: complete the already-selected root-only application-E2E architecture across planner classification and make its real-collector proof collision-safe. A nested unassigned spec must not be selected as an app spec/support path, and proof probes must never overwrite/delete pre-existing repository content.

Affected scope: `scripts/lib/e2eRisk.ts`, `scripts/lib/e2eRisk.test.ts`, `playwright.lanes.test.ts`, existing root-only application discovery/applicability proof. Architect-owned documentation/comment drift remains a separate final cleanup after the behavioral correction.
