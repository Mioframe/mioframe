# Review

Verdict: blocked

## Scope reviewed

- Complete second scripts-owned correction on PR #218 from architect handoff `acec9f30d207ad622f5f52352fa4c7160b39c2d9` through coding-agent implementation `8911f44078676ccaceb19c8de8c05364b5ec6698`.
- Canonical contract: [`../docs/testing/architecture.md`](../docs/testing/architecture.md), [`../docs/testing/verify-redesign-final-review-correction.md`](../docs/testing/verify-redesign-final-review-correction.md), and [`../docs/testing/verify-redesign-final-review-correction-02-agent-task.md`](../docs/testing/verify-redesign-final-review-correction-02-agent-task.md).
- Rechecked every previous B1-B3/M1-M2 finding plus current build-config consumers and every type that executes through `playwrightContainer.ts`.
- Because this is the second correction round and ownership gaps remain, root [`../AGENTS.md`](../AGENTS.md) requires returning to architecture rather than issuing another incremental path-list patch. The replacement ready handoff is [`../docs/testing/verify-redesign-final-review-architecture-revision.md`](../docs/testing/verify-redesign-final-review-architecture-revision.md).

## Blockers

### B1 — Production-artifact static ownership still depends on an incomplete exact build-input list

Owner: `scripts`

Problem: the second correction correctly broadened `releaseStaticRisk.ts` to ordinary production `src/**` and `public/**`, but root/config build ownership still enumerates only a few exact files. The real Vite configuration directly imports `config/alias.ts` and `config/plugins/**`; plugin configuration in turn imports other build configuration such as `config/vueCustomElements.ts`. `vite.config.ts` also derives its build target from the repository Browserslist configuration. Changes to those current artifact inputs can therefore alter emitted production output while default/`--only static` still omits `build` and `artifact-static`.

Evidence:

- [`lib/releaseStaticRisk.ts`](lib/releaseStaticRisk.ts) — `PRODUCTION_ARTIFACT_EXACT_FILES` includes `vite.config.ts`, `index.html`, `config/tooling.json`, `scripts/release/buildArtifact.mjs`, `src/sw.ts`, and the artifact proof, while the only broad prefixes are `public/` and `src/`; `config/alias.ts`, `config/plugins/**`, `.browserslistrc`, and other current build-config inputs are not covered.
- [`../vite.config.ts`](../vite.config.ts) — directly imports `./config/alias` and `./config/plugins` and calls `browserslistToEsbuild(..., { path: process.cwd() })` to derive the build target.
- [`../config/plugins/base.ts`](../config/plugins/base.ts) — application Vite plugin configuration imports `../vueCustomElements`, proving the artifact-config dependency extends beyond the exact files registered in the planner.
- [`../.browserslistrc`](../.browserslistrc) — repository-owned browser baseline consumed by the build-target derivation above.

Basis:

- [`../docs/testing/verify-redesign-final-review-correction-02-agent-task.md`](../docs/testing/verify-redesign-final-review-correction-02-agent-task.md) — section A requires **every changed input capable of entering or altering the real Vite production artifact** to select `build` + `artifact-static`, preferring a safely broad capability over source-graph inference.
- [`../docs/testing/architecture.md`](../docs/testing/architecture.md) — a complete type may skip only with deterministic evidence of irrelevance; static owns deterministic build/config/artifact invariants.
- [`../AGENTS.md`](../AGENTS.md) — after two correction rounds that still reveal ownership errors or workaround growth, stop patching and redo the architecture decision.

Risk: changes to active build/plugin/alias/browser-target configuration can receive a green affected static result without rebuilding or validating the artifact they actually change.

Required final state: implement the revised architecture in [`../docs/testing/verify-redesign-final-review-architecture-revision.md`](../docs/testing/verify-redesign-final-review-architecture-revision.md): release-static build ownership is expressed as broad stable repository capability classes (`src`, `public`, non-test `config`, root build inputs, package/lock/build entry), not another exact direct-dependency list.

Verification: prove representative `config/alias.ts`, `config/plugins/*.ts`, `config/vueCustomElements.ts`, `.browserslistrc`, `tsconfig*.json`, ordinary production/assets/public paths, package/lock cases, and deterministic proof-only exclusions select the required static leaves.

### B2 — Shared Playwright execution infrastructure has fragmented affected ownership across browser-backed types

Owner: `scripts`

Problem: the second correction correctly added the common command/lock/result/signal support to the exceptional browser-integration and E2E planners, but those same modules are real dependencies of **all** Playwright-container-backed execution. Generic browser-integration, Storybook behavior, and visual runners also call `runPlaywrightInContainer()`, while their affected planners know only `scripts/playwrightContainer.ts` (or their own top-level runner) and not its shared dependency closure. A change to `localCommandGuard.ts`, `commandLock.ts`, `runLocalCommand.ts`, `processResult.ts`, or `signalForward.ts` can therefore alter those types' execution while generic browser-integration/behavior/visual skip.

Evidence:

- [`../scripts/browserIntegration.ts`](browserIntegration.ts) — generic browser-integration executes exclusively through `runPlaywrightInContainer()`.
- [`storybookBehavior.mjs`](storybookBehavior.mjs) — behavior execution uses the same `runPlaywrightInContainer()` boundary.
- [`visual.mjs`](visual.mjs) — visual execution uses the same boundary.
- [`playwrightContainer.ts`](playwrightContainer.ts) — directly depends on `lib/localCommandGuard.ts`, `lib/processResult.ts`, and `lib/runLocalCommand.ts`; those transitively own command locking and signal propagation.
- [`lib/storybookBehaviorRisk.ts`](lib/storybookBehaviorRisk.ts) and [`lib/visualRisk.ts`](lib/visualRisk.ts) — include `scripts/playwrightContainer.ts` as full-lane infrastructure but not its shared command/lock/result/signal dependencies.
- [`lib/browserIntegrationRisk.ts`](lib/browserIntegrationRisk.ts) — the exceptional full-lane set includes the new shared support, while `GENERIC_FULL_LANE_EXACT_FILES` does not, so the same public browser-integration type has inconsistent infrastructure ownership between its two execution paths.

Basis:

- [`../.agents/skills/verification/SKILL.md`](../.agents/skills/verification/SKILL.md) — shared config/helpers use full owning-type fallback unless every consumer is explicit, small, stable, and validated.
- [`../docs/testing/architecture.md`](../docs/testing/architecture.md) — unknown relevant impact uses full, never skip, and uncertainty must not silently reduce coverage.
- [`../AGENTS.md`](../AGENTS.md) — repeated ownership drift after two correction rounds requires an architecture redo rather than another local patch.

Risk: regressions in container startup, locking, process result propagation, or signal handling can change browser test semantics while one or more affected public verification types are omitted by default verification.

Required final state: use the revised architecture's single small shared Playwright-execution-infrastructure predicate as the one source of truth for this genuinely shared runtime boundary. Existing behavior, visual, browser-integration, and E2E planners consume that predicate and widen only their own public type. Do not create a universal planner registry or dependency graph.

Verification: representative changes to each shared command/lock/result/signal path must select full behavior, full visual, full public browser-integration (generic + exceptional), and full E2E.

## Major issues

### M1 — E2E target-tree/applicability validation still runs after E2E was classified irrelevant

Owner: `scripts`

Problem: `buildCommands()` now correctly avoids Playwright owner-inventory/dependency-cruiser acquisition when the cheap classifier says E2E is irrelevant, but it still calls `validateE2ETargetTree()` and `validateE2EProjectApplicability()` unconditionally immediately afterwards. Thus a docs-only/default or `--only <non-e2e>` invocation still resolves E2E structural validators even though the accepted correction order says structural E2E validation belongs behind the same relevance decision.

Evidence:

- [`verify.ts`](verify.ts) — `needsStructuralE2EPlanning` controls only `resolveStructuralE2EPlan(...)`; `e2eTargetTreeValidation` and `projectApplicabilityValidation` are then resolved unconditionally.

Basis:

- [`../docs/testing/verify-redesign-final-review-correction.md`](../docs/testing/verify-redesign-final-review-correction.md) — Decision 6 requires structural E2E filesystem/Playwright validation to occur only when E2E is relevant or literal `--full` requires complete validation.
- [`../docs/testing/architecture.md`](../docs/testing/architecture.md) — default verification first determines relevant types and validates structural invariants required by affected-test selection.

Risk: E2E-irrelevant focused/default work can pay unrelated planning cost or fail because of E2E repository state that the invocation did not need to select, contrary to the public affected-verification model.

Required final state: derive one E2E relevance decision and put target-tree, applicability, Playwright inventory, and dependency-graph validation behind it. Literal `--full` and E2E-relevant scopes retain all existing fail-closed validation.

Verification: dependency-seam tests prove docs-only/default and `--only <non-e2e>` scopes call none of the E2E validators/acquisition paths, while relevant E2E and literal `--full` call them.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- B2 from the previous review (central exceptional release-proof inventory/full/direct validation) is resolved by `8911f440...`; do not reopen it without new evidence.
- Previous B3 is resolved for the special browser/E2E boundary, but the re-review exposed the broader shared-Playwright ownership root cause recorded as current B2.
- Previous M1 (`--fix-only` planner order) is resolved.
- Previous M2 (deleted/renamed mutation infrastructure being filtered out) is resolved.
- Generic browser-integration remains structurally disjoint from the appUpdate special corpus.
- TypeScript-first proof entry points, ordinary structural E2E ownership, mutation registry, performance inventory, public taxonomy, and container-only Playwright remain unchanged.
- `.github/workflows/REVIEW.md` remains downstream and must not be corrected until this scripts architecture is implemented and reviewed cleanly.

## Unresolved questions

None.
