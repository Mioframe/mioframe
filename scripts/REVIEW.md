# Review

Verdict: blocked

## Scope reviewed

- Complete PR #218 verification implementation relevant to public type ownership, affected selection, special Playwright execution, mutation ownership, and verifier cost/failure paths.
- Canonical contract: `../docs/testing/architecture.md` and the accepted verify-redesign records.
- Current implementation: `verify.ts`, `lib/*Risk.ts`, special release/browser runners, Playwright configuration, and focused verifier tests.

## Blockers

### B1 — Release-sensitive static proof is full-only instead of affected-owned

Owner: `scripts`

Problem: deterministic release/build static leaves (`release-version`, `release-config`, `build`, `publisher-node-import`, `artifact-static`, `managed-updates-static`) are created only by `addReleaseOnlyCommands()`, and `buildCommands()` calls that function only in literal full mode. A normal/default or `--only static --files ...` invocation therefore cannot run these static contracts when their owning source/configuration changes.

Evidence:

- [`verify.ts`](verify.ts) — `addReleaseOnlyCommands()` defines the release-sensitive static leaves, while the only caller is guarded by `if (fullMode)`.
- [`../docs/release.md`](../docs/release.md) — current focused managed-update guidance explicitly uses `pnpm verify --only static --files <managed-update paths...>`.

Basis:

- [`../docs/testing/architecture.md`](../docs/testing/architecture.md) — `static` owns deterministic build/config invariants, `--only` keeps the selected type's normal affected selection, and skipping a complete type requires deterministic evidence of irrelevance.

Risk: focused/default verification and the develop CI static job can pass while omitting a static contract affected by the change; `--full` being correct does not repair the normal affected contract.

Required final state: release-sensitive static leaves participate outside `--full` when their explicit file capability/configuration ownership is affected. Use a small explicit static/release-static ownership resolver; prefer a safely broader path set over dependency inference. Literal `--full` remains unconditional and unchanged in coverage.

Verification: focused planner tests must prove relevant managed-update/artifact/build/config/publisher paths select the appropriate static leaves under normal/default and `--only static` semantics, unrelated paths do not select unrelated expensive leaves, and `--full` still runs the complete static inventory.

### B2 — Exceptional browser/E2E execution inventories can silently omit valid target specs

Owner: `scripts`

Problem: structural target discovery and special execution routing have separate sources of truth. `e2eRisk.ts` accepts any structurally valid `productionArtifact/` target but routes it through a fixed owner-to-leaf table; an unrecognized special target can therefore disappear from the runnable plan. Managed-update browser/E2E execution is likewise driven by fixed arrays in `release/managedUpdatesProof.mjs`, while its tests compare them to another hard-coded expected corpus rather than the actual current special filesystem inventory.

Evidence:

- [`lib/e2eRisk.ts`](lib/e2eRisk.ts) — `PRODUCTION_ARTIFACT_LEAF_BY_OWNER` plus `selectedSpecsToPlan()` only set the two known special leaf booleans; there is no invalid state for a structurally valid special target with no executable membership.
- [`lib/e2eOwnerTree.ts`](lib/e2eOwnerTree.ts) — target-tree validation proves owner/path shape but does not validate special execution membership.
- [`release/managedUpdatesProof.mjs`](release/managedUpdatesProof.mjs) — fixed managed-update browser-integration and E2E group arrays own actual execution.
- [`release/managedUpdatesProof.test.mjs`](release/managedUpdatesProof.test.mjs) — group completeness is checked against duplicated `EXPECTED_*_CORPUS` constants rather than the current special spec tree.

Basis:

- [`../docs/testing/architecture.md`](../docs/testing/architecture.md) — suffix/location establish test type/ownership, invalid structure must fail loudly, uncertainty expands coverage, and replaced parallel ownership models must not remain.

Risk: adding/moving a valid special `*.browser-integration.spec.ts` or `productionArtifact/*.e2e.spec.ts` can produce green verification without executing that spec.

Required final state: special execution membership has one small explicit source of truth justified by its fresh-container/cross-engine execution semantics. Before affected selection/execution, validate exact set equality between that source and the current special filesystem inventory, including missing, unexpected, and duplicate entries. Unknown special targets fail closed; they are never silently ignored. Planner and runner consume the same membership source.

Verification: deterministic tests must prove exact special-corpus equality, missing/unexpected/duplicate failure, direct selection of every registered special spec, and failure (not skip) for a newly introduced unregistered special spec.

### B3 — Shared special browser/E2E support can change while both owning types skip

Owner: `scripts`

Problem: the managed-update browser-integration and production-artifact E2E corpora import shared release fixtures and real publisher/artifact support outside their owner directories, but the affected planners recognize only narrow fixed infrastructure files. Changes to shared release fixture/support can therefore leave the owning browser-integration and/or E2E proof unselected.

Evidence:

- [`../src/shared/service/appUpdate/managedUpdatesLifecycle.browser-integration.spec.ts`](../src/shared/service/appUpdate/managedUpdatesLifecycle.browser-integration.spec.ts) — imports `tests/e2e/release/fixtures/managedReleaseFixture.mjs`.
- [`../tests/e2e/pages/AppUpdatesPane/productionArtifact/managedUpdatesActivationUi.e2e.spec.ts`](../tests/e2e/pages/AppUpdatesPane/productionArtifact/managedUpdatesActivationUi.e2e.spec.ts) — imports the same fixture and shared E2E helpers.
- [`../tests/e2e/release/fixtures/managedReleaseFixture.mjs`](../tests/e2e/release/fixtures/managedReleaseFixture.mjs) — uses the real `scripts/release/artifactServer.mjs`, `scripts/pages/lib/pagesFs.mjs`, and `scripts/pages/lib/releasePublish.mjs` boundaries.
- [`lib/browserIntegrationRisk.ts`](lib/browserIntegrationRisk.ts) and [`lib/e2eRisk.ts`](lib/e2eRisk.ts) — current full-lane/support path sets do not represent this complete shared dependency boundary.

Basis:

- [`../docs/testing/architecture.md`](../docs/testing/architecture.md) — shared setup/config/support with non-local blast radius must widen the owning type when narrower ownership cannot be proved safely; a broader safe run is preferable to complex inference.

Risk: a test fixture, publisher, artifact server, or build/runtime support regression can change the meaning of the special proof while default verification reports that proof type as irrelevant.

Required final state: explicitly classify the stable shared support roots used by the special browser-integration/E2E runners so a support change selects all dependent special leaves/types. At minimum this includes the shared managed-release fixture boundary and the real publisher/artifact support it exercises. Do not introduce another general dependency graph or production-path-to-spec registry.

Verification: focused tests must prove representative shared fixture, publisher/artifact support, Vite/build configuration, and runtime-relevant package/toolchain changes widen/select the correct browser-integration and E2E special proof rather than skip.

## Major issues

### M1 — Generic browser-integration discovery overlaps the managed-update special corpus

Owner: `scripts`

Problem: `playwright.browserIntegration.config.ts` matches all `src/**/*.browser-integration.spec.ts`, including the appUpdate corpus that requires `playwright.release.config.ts` fresh-container and cross-engine semantics. `pnpm test:browser-integration` therefore exposes a second weaker execution path; `verify.ts` avoids it only by always passing an explicit generic spec list.

Evidence:

- [`../playwright.browserIntegration.config.ts`](../playwright.browserIntegration.config.ts) — broad `testMatch` intentionally also matches the managed-update corpus.
- [`browserIntegration.ts`](browserIntegration.ts) — bare package runner executes that configuration.

Basis:

- [`../docs/testing/architecture.md`](../docs/testing/architecture.md) — one contract has one primary proof owner; browser runtime proof must preserve its truthful execution semantics.

Risk: callers can execute managed-update specs under a Chromium-only generic environment that does not prove their accepted fresh-container/cross-engine contract, creating parallel ownership and misleading green evidence.

Required final state: the generic browser-integration configuration discovers only the generic non-appUpdate inventory. Exclude the managed-update special owner structurally in configuration; do not rely on one caller always passing a filtered list. Preserve the special release runner as the sole execution owner for that corpus.

Verification: lane/config tests and a real/config-level collection proof must show the generic runner cannot collect appUpdate managed-update specs while the special release config still collects them.

### M2 — Mutation toolchain changes can skip the mutation type

Owner: `scripts`

Problem: `MUTATION_INFRA_PATHS` contains only the registry and Stryker config. Runtime-relevant `package.json` changes and `pnpm-lock.yaml` can change Stryker/core/Vitest-runner execution but still resolve to an empty mutation plan.

Evidence:

- [`lib/mutationTargets.ts`](lib/mutationTargets.ts) — mutation infrastructure selection is limited to two exact paths.
- [`../package.json`](../package.json) — Stryker core and Vitest runner are repository-owned dev dependencies.

Basis:

- [`../docs/testing/architecture.md`](../docs/testing/architecture.md) — default mutation verification runs affected registered targets and a type may skip only with deterministic evidence of irrelevance.
- [`../docs/testing/verify-redesign-pass-e-implementation.md`](../docs/testing/verify-redesign-pass-e-implementation.md) — mutation infrastructure changes select the complete registered inventory.

Risk: a Stryker/toolchain update can receive a green mutation job without executing any registered mutation target.

Required final state: mutation planning treats the lockfile and runtime-relevant mutation toolchain/package changes as complete-registry impact, while preserving the existing version-only package refinement where it can be proved irrelevant.

Verification: focused planner tests for lockfile, Stryker dependency changes, version-only package changes, registry/config changes, and unrelated paths.

### M3 — E2E inventory acquisition runs before E2E relevance is established

Owner: `scripts`

Problem: for the default all-type invocation, `buildCommands()` calls `resolveStructuralE2EPlan()` before knowing whether any changed path is E2E-relevant; that resolver collects two containerized Playwright `--list` inventories before evaluating changed-path relevance. Planner resolution also occurs before the `fix-only` command-plan early return.

Evidence:

- [`verify.ts`](verify.ts) — structural E2E/unit/behavior/visual/mutation plans are resolved before command construction and before the `fixOnlyMode` return.
- [`lib/e2eRisk.ts`](lib/e2eRisk.ts) — owner inventory is collected before changed-path full/focused/skip classification.
- [`lib/e2eOwnerInventoryContainer.ts`](lib/e2eOwnerInventoryContainer.ts) — inventory collection performs two sequential containerized Playwright list runs.

Basis:

- [`../docs/testing/architecture.md`](../docs/testing/architecture.md) — the goal is the smallest set of checks that can be proven safe; default verification first determines relevant verification types, and broader work should be used for safety rather than unconditional cost.

Risk: docs-only/default and fixer-only feedback can unnecessarily require Podman/Playwright metadata and pay two container startups even though E2E cannot be relevant.

Required final state: cheap changed-path relevance classification precedes expensive E2E graph/inventory acquisition. `--only <non-e2e>` and `--fix-only` acquire no E2E graph/inventory; default invocation acquires it only when changed paths can affect E2E. A changed/added/moved E2E target or E2E infrastructure/support path must still trigger structural validation, so optimization cannot weaken fail-closed behavior.

Verification: dependency-seam tests must prove zero inventory/graph acquisition for docs-only, `--fix-only`, and non-E2E `--only`, and acquisition/fail-closed behavior for production/E2E/support changes.

## Minor issues

### N1 — Task-touched/new verifier tooling still violates the TypeScript-first repository rule

Owner: `scripts`

Problem: new verifier-owned Node proof scripts such as `release/productionArtifactStaticProof.mjs` and `release/managedUpdatesControllerArtifactIdentityProof.mjs`, plus task-touched `release/managedUpdatesProof.mjs`, remain JavaScript even though the repository now executes verifier TypeScript directly on Node 24 and these scripts already import TypeScript modules.

Evidence:

- [`release/productionArtifactStaticProof.mjs`](release/productionArtifactStaticProof.mjs)
- [`release/managedUpdatesControllerArtifactIdentityProof.mjs`](release/managedUpdatesControllerArtifactIdentityProof.mjs)
- [`../tsconfig.scripts.json`](../tsconfig.scripts.json) — verifier tooling has a native Node 24 TypeScript configuration.

Basis:

- [`../AGENTS.md`](../AGENTS.md) — prefer TypeScript for new or task-touched Node/tooling scripts when the runtime/toolchain can execute it directly; JavaScript requires a concrete loader/runtime reason.

Risk: the redesign leaves a known repository-rule exception without evidence and keeps part of new verifier logic outside `tsconfig.scripts` type checking.

Required final state: convert the task-touched/new verifier proof scripts to native TypeScript where no concrete loader restriction exists, updating direct consumers/tests mechanically. Preserve genuinely loader-constrained legacy `.mjs` files.

Verification: `tsconfig.scripts`/static focused proof and direct Node import/execution tests for the converted entry points.

### N2 — Managed-update E2E ordering comment describes an invariant the planner does not enforce

Owner: `scripts`

Problem: `release/managedUpdatesProof.mjs` states that managed-update E2E runs only after the complete browser-integration leaf, but `verify.ts` currently appends `managed-updates-e2e` in `addReleaseOnlyCommands()` before the browser-integration commands are appended.

Evidence:

- [`release/managedUpdatesProof.mjs`](release/managedUpdatesProof.mjs) — E2E group comment claims browser-integration-first ordering.
- [`verify.ts`](verify.ts) — full-mode release-only commands are appended before `addBrowserIntegrationCommands()`.

Basis:

- [`../docs/testing/architecture.md`](../docs/testing/architecture.md) — verification behavior must be deterministic and inspectable; comments must not claim nonexistent proof semantics.

Risk: maintainers can rely on a fail-fast ordering guarantee that is not actually present.

Required final state: either enforce the ordering if it remains a required current invariant, or correct the stale comment if no contract requires cross-type ordering. Do not introduce cross-type coupling solely to preserve a comment.

Verification: planner order assertion only if the ordering is intentionally retained; otherwise a focused documentation/comment correction is sufficient.

## Accepted risks

None.

## Items not required

- No new verification type, generic resolver framework, persistent graph/cache, or performance infrastructure is required.
- No production feature behavior or migrated test assertions need redesign based on this review.

## Unresolved questions

None.
