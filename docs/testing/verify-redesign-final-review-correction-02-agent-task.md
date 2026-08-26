# Verify redesign — second scripts correction coding-agent task

## Read first

Read and follow, in this order:

1. root `AGENTS.md`;
2. `.agents/skills/implementation-preflight/SKILL.md`;
3. `.agents/skills/verification/SKILL.md`;
4. `docs/testing/architecture.md`;
5. `docs/testing/verify-redesign-final-review-correction.md`;
6. `scripts/REVIEW.md`.

The architecture is resolved. This is the second and final scripts correction round under the current architecture. Do not redesign the verifier taxonomy or ownership model. If current repository evidence shows that the required final state cannot be implemented without changing the accepted architecture, stop and report `blocked` instead of adding workaround layers.

## Problem and cause

The first scripts correction implemented at `ab4efa5dbb822bc1a1d1e4b2a2def60e3a65e67f` fixed several original findings, but architect re-review found five remaining scripts-owned defects:

1. release-sensitive static ownership is still too narrow: ordinary production/Vite artifact inputs can change the real production artifact while `build` and `artifact-static` skip;
2. exceptional release-browser membership validation is bypassed by literal `--full` browser-integration planning and by direct managed special-runner execution, and one E2E membership constant still lives outside the central inventory;
3. shared special-runner affected ownership omits the common command/lock/result/signal execution support used by release Playwright/group runners;
4. `--fix-only` avoids expensive E2E acquisition but still resolves unrelated proof planners before returning the fixer-only plan;
5. mutation planning receives only currently existing changed files, so deleted/renamed-away mutation infrastructure can disappear before impact classification.

Resolve all five together. Do not start the downstream workflow correction in this pass.

## Expected final state

### A. Complete release-static production artifact capability

Keep `scripts/lib/releaseStaticRisk.ts` as the one narrow release-static affected resolver. Do not add an import/dependency graph.

Define production artifact/build ownership broadly enough that every changed input capable of entering or altering the real Vite production artifact selects both:

- `build`;
- `artifact-static`.

The safe explicit capability must cover at least:

- ordinary production files under `src/**`, including non-TypeScript production assets that Vite can consume;
- `src/sw.ts`;
- `vite.config.ts`;
- `index.html`;
- `public/**`;
- `config/tooling.json` where it affects the release build/base-path contract;
- `scripts/release/buildArtifact.mjs`;
- runtime-relevant `package.json` changes;
- `pnpm-lock.yaml`.

Use structural non-production exclusions only where repository naming makes irrelevance deterministic (unit tests, stories, behavior/visual/browser-integration/performance specs, test helpers, and equivalent proof-only files). Prefer a slightly broader build/artifact run over source-graph inference.

Additional leaf ownership remains:

- appUpdate/controller production inputs select `managed-updates-static` in addition to `build` + `artifact-static`;
- publisher import-boundary inputs select `publisher-node-import`;
- release-config ownership selects `release-config` while also selecting build/artifact proof when that configuration can alter the built artifact;
- version/package-version ownership selects `release-version`;
- a confirmed version-only `package.json` change must not widen to runtime/build/artifact or mutation impact solely because `package.json` changed.

Do not make arbitrary docs/test-only changes build the production artifact when their irrelevance is deterministic.

### B. Make `releaseProofInventory.ts` the sole exceptional membership owner and validate every execution path

`scripts/lib/releaseProofInventory.ts` must own all exceptional release-browser execution membership, including:

- the `artifact` browser-integration spec;
- managed-update browser-integration group labels, membership, and order;
- the `release-smoke` productionArtifact E2E spec;
- managed-update productionArtifact E2E group labels, membership, and order;
- the managed release data-compatibility label and spec path.

Invert the remaining ownership: `scripts/release/runManagedReleaseDataCompatibilityProof.mjs` may keep the execution function, but it must consume the label/spec constants from `releaseProofInventory.ts`; it must no longer define membership that the inventory imports. Node `>=24.12` is the repository runtime and native TypeScript imports are already an accepted verifier/tooling mechanism. Remove the `.d.mts` declaration if it becomes unused after this inversion; do not keep dead compatibility solely for the old direction.

No test may maintain a second hard-coded expected special corpus. Tests may assert ordering/labels and mutate/inject filesystem inputs, but the registered spec set itself comes only from `releaseProofInventory.ts`.

Exact membership validation must happen before every relevant selection/execution boundary:

- focused browser-integration planning;
- literal `--full` browser-integration planning;
- direct `runManagedUpdatesBrowserIntegrationProof()` execution;
- direct `runManagedUpdatesE2EProof()` execution.

Use the existing exact filesystem-equality validators; do not create a second validator. Invalid membership must fail closed before any special Playwright group is started. Missing, unexpected, duplicate, or malformed registered membership must never become a skip.

Preserve the existing E2E structural/full validation path; do not add a second productionArtifact ownership model.

### C. Complete explicit shared special-runner support ownership

Keep special support ownership as explicit stable path classification, not a dependency graph.

In addition to the high-level release fixture/publisher/artifact/container paths already covered, changes to the current common execution-support boundary must select the dependent special browser-integration and E2E proof:

- `scripts/lib/localCommandGuard.ts`;
- `scripts/lib/commandLock.ts`;
- `scripts/lib/runLocalCommand.ts`;
- `scripts/lib/processResult.ts`;
- `scripts/lib/signalForward.ts`.

Retain the already covered support such as:

- `scripts/playwrightContainer.ts`;
- `scripts/e2eReleaseContainer.mjs`;
- `playwright.release.config.ts`;
- `tests/e2e/release/fixtures/**`;
- `scripts/release/artifactServer.mjs`;
- `scripts/pages/lib/**` used by the real publisher path;
- Vite/release build support;
- runtime-relevant `package.json`;
- `pnpm-lock.yaml`.

For browser integration, a shared execution-support change must select both exceptional leaves. For E2E, the safely broad existing full-E2E fallback is acceptable and simpler than adding a special-only dependency mapping.

Do not broaden this into a generic execution-support registry for every verification type.

### D. Make `--fix-only` return before all proof planning

Restructure `buildCommands()` so a fixer-only invocation resolves only what is needed to construct its current fixer command plan, then returns before any verification proof planner/validator is resolved.

Before the `fix-only` return, do not resolve:

- unit affected planning;
- Storybook behavior/build planning;
- visual planning;
- mutation planning/registry validation;
- E2E target-tree/project-applicability/structural planning;
- browser-integration planning;
- release-static proof planning;
- any Playwright/dependency-cruiser acquisition.

Preserve the existing fixer-only public behavior: agent-environment/fixable format/lint work only, with no new proof checks added to fix-only.

Use the minimum local restructuring. Do not introduce a generic lazy planner manager/registry.

### E. Preserve deleted/renamed mutation infrastructure impact

Keep the accepted four mutation targets unchanged.

`resolveMutationPlan()` must receive changed-path identities that preserve automatic git-diff deletions and both sides of renames. Do not erase relevance by filtering to files that currently exist before mutation impact classification.

Current-file existence filtering may remain only for commands that literally cannot accept missing file paths (format/lint etc.). It must not be the mutation impact input.

Required behavior includes:

- deleted `stryker.config.mjs` -> complete registered mutation inventory or fail-closed invalid state, never skip;
- rename-away of `stryker.config.mjs` -> complete registered mutation inventory or fail-closed invalid state, never skip;
- deleted/renamed mutation registry infrastructure -> safe full/invalid behavior;
- unrelated deleted paths -> mutation remains irrelevant;
- runtime-relevant `package.json` and `pnpm-lock.yaml` behavior from the first correction remains intact;
- version-only `package.json` remains mutation-irrelevant.

Do not change the changed-path architecture or add a second status model solely for mutation. Use the existing changed-file projection/status-preserving input already produced by `changedPaths.ts`.

## Architecture and ownership constraints

The public verification contract remains exactly:

- `static`;
- `unit`;
- `behavior`;
- `visual`;
- `browser-integration`;
- `performance`;
- `mutation`;
- `e2e`.

Preserve all already accepted parts of the first correction:

- generic browser-integration remains structurally disjoint from the appUpdate special corpus;
- runtime package/lock mutation impact remains supported;
- expensive E2E Playwright owner-inventory/dependency-cruiser acquisition remains behind cheap relevance;
- the three converted verifier proof/orchestration entry points remain TypeScript;
- there is no cross-type browser-integration-before-E2E ordering contract;
- ordinary E2E remains structural page/widget ownership with dependency-cruiser used only for production reachability;
- the mutation registry remains one explicit four-target source of truth;
- performance remains a valid empty type;
- every verifier-managed Playwright CLI invocation remains containerized;
- top-level verify lock, expensive-command lock, status/resume, logging, timeout, profile/base, and fix semantics remain unchanged except for the required fix-only planning-order correction.

The simplest viable implementation is expected to be local corrections to the existing resolvers/planner/inventory. No new abstraction layer is required.

## Expected implementation scope

Expected changes are limited to the smallest complete set around:

- `scripts/verify.ts` and focused `scripts/verify.test.ts` coverage;
- `scripts/lib/releaseStaticRisk.ts` + tests;
- `scripts/lib/releaseProofInventory.ts` + tests;
- `scripts/lib/browserIntegrationRisk.ts` + tests;
- `scripts/lib/e2eRisk.ts` + tests only as needed for shared-support impact;
- `scripts/lib/mutationTargets.ts` + tests only if needed for the corrected changed-path handoff;
- `scripts/release/managedUpdatesProof.ts` + tests;
- `scripts/release/runManagedReleaseDataCompatibilityProof.mjs` and its direct test/declaration only as required to invert membership ownership.

Do not edit `.github/workflows/verify.yml` in this pass. The workflow blocker remains downstream and architect-controlled until `scripts/REVIEW.md` is clean.

Do not edit architect-owned review/control records:

- `scripts/REVIEW.md`;
- `.github/workflows/REVIEW.md`;
- `docs/testing/verify-redesign-final-review-correction.md`;
- `docs/testing/verify-redesign-final-review-agent-task.md`;
- `docs/testing/verify-redesign-final-review-correction-02-agent-task.md`;
- `docs/testing/verify-redesign-current-handoff.md`;
- `docs/testing/migration-plan.md`.

## Acceptance criteria

All must hold:

1. A representative ordinary production `src/**` change selects `build` and `artifact-static` under default and `--only static` affected planning.
2. Vite/build/public/config/runtime-package/lock inputs that can alter the production artifact select `build` + `artifact-static`; appUpdate/controller production inputs additionally select `managed-updates-static`.
3. Deterministically unrelated docs/tests/stories/proof-only files do not trigger unnecessary production artifact proof.
4. `releaseProofInventory.ts` is the sole owner of every exceptional release-browser label/spec/group membership, including managed data compatibility.
5. Focused and literal-full browser-integration planning both fail closed on invalid exceptional membership.
6. Direct managed browser-integration/E2E group runners validate the relevant exact filesystem corpus before starting any group.
7. No duplicated expected special-corpus literal/list remains in tests or runner modules.
8. Representative `localCommandGuard`, `commandLock`, `runLocalCommand`, `processResult`, and `signalForward` changes select the dependent special browser-integration and E2E proof.
9. `--fix-only` constructs and returns its fixer plan without invoking any proof planner/validator listed in section D.
10. Docs-only/default and non-E2E-only E2E acquisition optimizations from the first correction remain intact.
11. Deleted/renamed-away mutation infrastructure cannot become mutation `skip` merely because the old path no longer exists.
12. Runtime package/lock and version-only package mutation behavior remains correct.
13. No public taxonomy, workflow, product behavior, test assertion meaning, lock/container model, performance inventory, or unit/E2E ownership architecture changes are introduced.

## Verification

Use implementation preflight and focused verifier-managed feedback only. Do not run `pnpm verify` or `pnpm verify --full` as a completion ritual; exact-head GitHub CI is architect-owned.

Required deterministic proof should cover at least:

- release-static planner cases for ordinary production TS/Vue/CSS-or-other Vite-consumed source, Vite config, `public/**`, appUpdate production, runtime package/lock, version-only package, and unrelated docs/tests/proof files;
- `buildCommands()` / `--only static` inclusion of real `build` + `artifact-static` for an ordinary production source;
- full and focused invalid browser-integration membership handling;
- direct managed runner refusal before child execution for missing/unexpected/duplicate membership;
- central data-compatibility membership ownership with no duplicate expected corpus;
- shared command/lock/result/signal support impact for browser-integration and E2E;
- dependency seams proving `fix-only` calls no non-fixer proof planner/validator;
- deleted/renamed-away mutation infrastructure impact plus unrelated deletion;
- regression proof for the first correction's accepted E2E relevance gate and generic browser-integration disjointness where touched behavior could affect them.

Use the smallest relevant real proof only where unit seams are insufficient. Keep every Playwright CLI invocation containerized. Do not require Podman solely to prove logic already deterministically covered by config/planner tests if the sandbox cannot provide it; report any genuinely missing runtime-specific proof exactly.

## Forbidden

- Do not edit `.github/workflows/verify.yml` or resolve the downstream workflow finding in this pass.
- Do not add a ninth/public verification type or restore a public release type/`verify:release`.
- Do not expose private leaf labels through `--only`.
- Do not add a generic verification manager, planner registry, DSL, or lazy-planner framework.
- Do not add a dependency/import graph for release-static or special support selection.
- Do not add a second changed-path/status model for mutation.
- Do not restore production-path -> ordinary E2E-spec mappings.
- Do not duplicate exceptional release-browser membership outside `releaseProofInventory.ts`.
- Do not weaken exact special filesystem membership validation or E2E filesystem/Playwright inventory equality.
- Do not change the four accepted mutation targets or restore adjacency inference.
- Do not let generic Chromium browser-integration collect the appUpdate special corpus again.
- Do not add cross-type browser-integration-before-E2E ordering.
- Do not weaken/relax locks, container-only Playwright, timeouts, flaky-failure semantics, status/resume, profile/base, or fixer behavior.
- Do not add sleeps/retries/timeout inflation to obtain green proof.
- Do not change production feature behavior or migrated test assertion meaning.
- Do not mass-convert unrelated `.mjs` release/page tooling.
- Do not edit the architect-owned review/control files listed above.

## Report

Return exactly:

```text
TASK RESULT
status: complete | partial | blocked
remaining: none | <remaining implementation/proof/blocker>

LOCAL FEEDBACK
commands: none | <focused verifier-managed commands actually useful during implementation/diagnosis>
status: not run | passed | failed | partial
reason if failed/partial: <exact reason>

CI GATE
status: architect-owned
```
