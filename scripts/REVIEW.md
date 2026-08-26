# Review

Verdict: blocked

## Scope reviewed

- Complete scripts-owned correction on PR #218 from architect handoff `5d3c12baf60c4d87444b8410d72c0230a6ee7642` through coding-agent implementation `ab4efa5dbb822bc1a1d1e4b2a2def60e3a65e67f`.
- Canonical contract: [`../docs/testing/architecture.md`](../docs/testing/architecture.md), [`../docs/testing/verify-redesign-final-review-correction.md`](../docs/testing/verify-redesign-final-review-correction.md), and the assigned [`../docs/testing/verify-redesign-final-review-agent-task.md`](../docs/testing/verify-redesign-final-review-agent-task.md).
- Rechecked release-sensitive static ownership, exceptional release-browser inventory, special shared support, browser-integration lane separation, mutation impact, E2E relevance/acquisition, TypeScript-first conversion, and managed-update execution semantics.

## Blockers

### B1 — Release-static affected ownership still omits real production artifact inputs

Owner: `scripts`

Problem: `releaseStaticRisk.ts` still treats ordinary production source as irrelevant to every release-sensitive static leaf and does not consistently propagate artifact/build inputs to `artifact-static`. The real `build` leaf runs `vite build` over the production application module graph, and `productionArtifactStaticProof.ts` validates the resulting emitted JavaScript/manifest/controller artifact. A normal production source change can therefore change or break the built artifact while default/`--only static` planning omits both `build` and `artifact-static`. Build configuration such as `vite.config.ts` is similarly classified as `build`-only even though it changes the artifact that `artifact-static` validates.

Evidence:

- [`lib/releaseStaticRisk.ts`](lib/releaseStaticRisk.ts) — `BUILD_EXACT_FILES`/`BUILD_PREFIXES` cover only a small config/entry/public set; ordinary `src/**` production source is absent, and `ARTIFACT_STATIC_EXACT_FILES` contains only `src/sw.ts` and the proof implementation.
- [`lib/releaseStaticRisk.test.ts`](lib/releaseStaticRisk.test.ts) — explicitly expects `src/features/documentCreate/index.ts` to skip every release-sensitive static leaf and expects `vite.config.ts`/ordinary appUpdate production changes not to select `artifact-static`.
- [`release/buildArtifact.mjs`](release/buildArtifact.mjs) — the `build` contract executes the real local Vite production build.
- [`release/productionArtifactStaticProof.ts`](release/productionArtifactStaticProof.ts) — scans all emitted JS/MJS chunks plus the generated worker/manifest after building the artifact.

Basis:

- [`../docs/testing/verify-redesign-final-review-correction.md`](../docs/testing/verify-redesign-final-review-correction.md) — Decision 1 requires production artifact/build inputs to select `build` and the deterministic artifact proof they can affect, with broader explicit ownership preferred when precise narrowing is not cheaply provable.
- [`../docs/testing/architecture.md`](../docs/testing/architecture.md) — a complete type may skip only with deterministic evidence of irrelevance; `static` owns deterministic build/config invariants.

Risk: default/develop static verification can report success without building or checking the production artifact after a source/configuration change that actually affects that artifact, preserving the original B1 fail-open behavior for a large class of production changes.

Required final state: define the explicit production-build/artifact capability broadly enough that every changed production/build input that can enter or alter the Vite artifact selects `build` and `artifact-static`; appUpdate/controller inputs additionally select `managed-updates-static`. Keep test/spec/story helpers excluded where they cannot enter the production artifact. Do not add a dependency graph merely to narrow this safely broad capability.

Verification: focused planner/integration tests must prove representative ordinary production source, Vite/build configuration, public/static input, appUpdate production, runtime package/lock, and unrelated proof/test/doc paths resolve to the correct release-static leaves; a focused `--only static --files <ordinary production source>` plan must include the real build/artifact proof.

### B2 — Exceptional inventory validation is still bypassed by full/special execution and ownership is not fully centralized

Owner: `scripts`

Problem: the new exceptional inventory is validated by the focused planners, but literal `--full` constructs the browser-integration full plan directly and bypasses `resolveBrowserIntegrationPlan()`/`validateBrowserIntegrationMembership()`. `managedUpdatesProof.ts` also executes the registered groups directly without validating current filesystem equality first. Therefore a newly added unregistered appUpdate browser-integration spec can still be omitted by `pnpm verify --full` and by direct special-runner execution. In addition, one managed-update E2E membership constant is still defined in `runManagedReleaseDataCompatibilityProof.mjs` and imported into `releaseProofInventory.ts`, while its inventory test repeats that spec path as a hard-coded expected member; the requested inventory file is therefore not yet the sole membership owner.

Evidence:

- [`verify.ts`](verify.ts) — `addBrowserIntegrationCommands()` uses a literal `{ mode: 'full', artifact: true, managedUpdates: true }` plan when `fullMode` is true instead of invoking the membership-validating resolver.
- [`lib/browserIntegrationRisk.ts`](lib/browserIntegrationRisk.ts) — `validateBrowserIntegrationMembership()` is called only inside `resolveBrowserIntegrationPlan()`.
- [`release/managedUpdatesProof.ts`](release/managedUpdatesProof.ts) — consumes group arrays but calls no exceptional-inventory filesystem validation before `runGroupsSequentially()`.
- [`lib/releaseProofInventory.ts`](lib/releaseProofInventory.ts) — imports `MANAGED_RELEASE_DATA_COMPATIBILITY_SPEC`/label from `runManagedReleaseDataCompatibilityProof.mjs` instead of owning that E2E membership itself.
- [`lib/releaseProofInventory.test.ts`](lib/releaseProofInventory.test.ts) — repeats the data-compatibility spec path in the expected E2E set.

Basis:

- [`../docs/testing/verify-redesign-final-review-correction.md`](../docs/testing/verify-redesign-final-review-correction.md) — Decision 2 requires one source of exceptional execution membership and exact filesystem equality validation **before affected selection or special execution**; unregistered special specs must fail closed.
- [`../docs/testing/architecture.md`](../docs/testing/architecture.md) — `--full` means every spec with no affected narrowing, and invalid structure must fail visibly rather than silently skip.

Risk: the release-grade command can remain green while omitting a valid new special browser-integration spec, which directly violates complete full-mode coverage and recreates the B2 failure the correction was meant to remove.

Required final state: exceptional membership is owned entirely by `releaseProofInventory.ts`; all special execution paths consume it. Browser-integration full planning must run the same structural membership validation as focused planning, and `managedUpdatesProof.ts` must fail closed before executing groups when the relevant filesystem corpus is not exactly registered. Tests must not maintain a second membership literal/list.

Verification: prove invalid browser-integration membership fails in both focused and literal-full `buildCommands`; prove the managed special runner refuses execution on missing/unexpected/duplicate membership; prove all registered groups execute from the central inventory and no duplicate expected-corpus literals remain.

### B3 — Shared special-runner support ownership remains incomplete

Owner: `scripts`

Problem: the correction added the top-level release fixture/publisher/artifact/container paths, but it did not include the stable shared command/lock/result/signal support imported by those runners. For example, `playwrightContainer.ts` directly depends on `localCommandGuard.ts`, `processResult.ts`, and `runLocalCommand.ts`; `runLocalCommand.ts` depends on `signalForward.ts`; and `managedUpdatesProof.ts` itself depends on `runLocalCommand.ts`/`processResult.ts`. A change to these shared execution boundaries can alter whether/how the special browser/E2E proof runs while both special affected planners still classify the change as irrelevant.

Evidence:

- [`playwrightContainer.ts`](playwrightContainer.ts) — directly imports `lib/localCommandGuard.ts`, `lib/processResult.ts`, and `lib/runLocalCommand.ts` for every container execution.
- [`lib/localCommandGuard.ts`](lib/localCommandGuard.ts) — supplies the guarded expensive-command/lock boundary and imports `commandLock.ts` plus `runLocalCommand.ts`.
- [`lib/runLocalCommand.ts`](lib/runLocalCommand.ts) — owns special-runner child execution and signal propagation through `signalForward.ts`.
- [`release/managedUpdatesProof.ts`](release/managedUpdatesProof.ts) — directly uses `runLocalCommand.ts`/`processResult.ts` for the fresh-container group orchestration.
- [`lib/browserIntegrationRisk.ts`](lib/browserIntegrationRisk.ts) and [`lib/e2eRisk.ts`](lib/e2eRisk.ts) — list `playwrightContainer.ts` and high-level release support, but not this shared execution-support closure.

Basis:

- [`../docs/testing/verify-redesign-final-review-correction.md`](../docs/testing/verify-redesign-final-review-correction.md) — Decision 3 requires the coding pass to inspect the current direct execution/import boundary and include every additional stable support path required for completeness.
- [`../.agents/skills/verification/SKILL.md`](../.agents/skills/verification/SKILL.md) — shared config/helpers use full owning-type fallback unless every consumer is explicit, small, stable, and validated.

Risk: a regression in common child execution, expensive-lock propagation, result propagation, or signal handling can change the meaning/outcome of the special Playwright proof while default `browser-integration`/E2E verification skips it.

Required final state: extend the explicit stable special-support ownership to the current common execution-support boundary used by release Playwright/group runners. Keep it an explicit small shared-support classification; do not introduce another dependency graph.

Verification: focused planner tests must show representative changes in the shared command/guard/result/signal support select the dependent special browser-integration and E2E proof instead of skip.

## Major issues

### M1 — `--fix-only` still resolves non-static planners before its early return

Owner: `scripts`

Problem: expensive Playwright/dependency-cruiser acquisition is now gated correctly, but `buildCommands()` still resolves unit planning, target-tree/applicability validation, Storybook behavior/build/visual planning, mutation planning, and release-static planning before constructing fixer commands and reaching the `fixOnlyMode` return. This does not satisfy the resolved correction order that `--fix-only` finishes static fixer planning without resolving non-static planners.

Evidence:

- [`verify.ts`](verify.ts) — `unitPlan`, E2E target-tree/project applicability, Storybook behavior/build/visual, and mutation plans are resolved before `commands` are built; `if (fixOnlyMode) return ...` occurs only afterwards.

Basis:

- [`../docs/testing/verify-redesign-final-review-correction.md`](../docs/testing/verify-redesign-final-review-correction.md) — Decision 6 explicitly requires `--fix-only` to finish static fixer planning **without resolving non-static planners**, before E2E relevance/acquisition.

Risk: fixer-only feedback still performs unrelated filesystem/inventory/package-impact planning and can become slower or fail for non-static repository state that the invocation was explicitly not asked to verify. The original heavy-container cost is fixed, but the ownership/order contract remains only partially implemented.

Required final state: construct and return the fixer-only command plan before resolving unit, behavior, visual, mutation, E2E structural/applicability, or other non-static proof planners. Preserve current fixer behavior and public invocation semantics.

Verification: dependency-seam tests must prove a `fix-only` build does not call non-static planner/validation dependencies at all, not merely that Playwright/dependency-cruiser are skipped.

### M2 — Mutation planning discards deleted/renamed-away infrastructure paths

Owner: `scripts`

Problem: default changed-path resolution correctly preserves deleted paths and both sides of renames, but `buildCommands()` passes only `existingChangedFiles` into `resolveMutationPlan()`. A deleted or renamed-away `stryker.config.mjs` (and similarly another mutation-infrastructure path) is therefore removed before mutation impact classification and can yield an empty mutation scope even though mutation infrastructure changed.

Evidence:

- [`lib/changedPaths.ts`](lib/changedPaths.ts) — changed-path projection intentionally preserves deleted paths and projects both `oldPath` and `newPath` for renames.
- [`verify.ts`](verify.ts) — `existingChangedFiles` filters by current filesystem existence and is passed to `resolveMutationPlan(...)`.
- [`lib/mutationTargets.ts`](lib/mutationTargets.ts) — infrastructure impact is path-identity based and would correctly widen `stryker.config.mjs`/lockfile if those changed paths reached it.

Basis:

- [`../docs/testing/architecture.md`](../docs/testing/architecture.md) — default verification preserves add/modify/remove/move identities; uncertain/removed affected ownership must widen safely rather than silently skip.
- [`../docs/testing/verify-redesign-final-review-correction.md`](../docs/testing/verify-redesign-final-review-correction.md) — Decision 5 classifies the Stryker config/lock/toolchain as mutation infrastructure whose change selects the complete registered inventory.

Risk: removing or renaming mutation infrastructure can receive a green mutation skip, undermining the status-aware default contract and leaving the M2 toolchain ownership correction fail-open for non-existing changed paths.

Required final state: mutation impact receives the status-preserving changed-path identity needed to classify deleted/renamed infrastructure safely; existence filtering may still be used only where a command itself cannot accept a missing path, not to erase mutation relevance.

Verification: tests must cover deleted and renamed-away `stryker.config.mjs`/representative mutation infrastructure and prove complete-registry mutation selection (or an explicit fail-closed result), while unrelated deleted paths remain irrelevant.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- No redesign of the eight public verification types, unit architecture, ordinary structural E2E ownership, performance inventory, locks, or container model is required.
- The generic browser-integration config is now structurally disjoint from the appUpdate special corpus; do not reopen that design.
- The three required verifier proof/orchestration entry points are now TypeScript; no wider `.mjs` conversion is required.
- The stale cross-type browser-integration-before-E2E claim is corrected; no cross-type ordering should be added.

## Unresolved questions

None.
