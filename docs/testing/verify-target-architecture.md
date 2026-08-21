# Verify target architecture

Status: target architecture resolved for the remaining verifier modernization work; implementation is intentionally split into bounded PRs.

`docs/testing/architecture.md` remains the canonical testing policy. `.agents/skills/verification/SKILL.md` remains the workflow/ownership rule. `docs/testing/verify-modernization.md` records progress and the stop criterion. This document defines the concrete end state for `pnpm verify` so the remaining implementation PRs do not need to redesign verification architecture independently.

## Goal

Make ordinary `pnpm verify` select the smallest **reliable** proof for the current repository change while preserving the full release gate, fail-closed behavior, and the existing parallel CI critical path.

Target semantics:

```text
changed-path identity + status
        ↓
repository facts needed by a specific lane
        ↓
specialized lane resolver
        ↓
skip | focused | full | invalid
        ↓
verify.ts orchestration / prerequisite reuse
        ↓
local focused feedback + exact-head CI using the same plan
```

The desired end state is not a generic test planner. It is a small set of specialized resolvers whose ownership matches the proof they select.

For CI, optimize **wall-clock merge latency / critical path** before aggregate compute. Reuse is valuable only when it does not introduce a dependency between independent proof owners that currently execute in parallel.

## Non-goals

The finish work does not introduce:

- Nx, Turbo, another task runner, or a persistent dependency graph;
- a generic verification DSL or universal `PathKind` taxonomy;
- a cross-lane source-to-test registry;
- a second source of truth for test ownership already expressed by imports or owner-local placement;
- new workers, sharding, retries, timeout inflation, or cross-job artifact plumbing for performance reasons;
- broad legacy test-suite cleanup without benchmark evidence;
- automatic release-version intent inference from source changes;
- mutation coverage for every source that merely has an adjacent test.

One dedicated release-impact CI lane is part of the required correctness architecture, not an optional parallelism optimization: newly required release proof must not be serialized behind existing independent static/E2E/Storybook proof owners.

## Current gaps

The existing verifier already has durable specialized planning for application E2E, Storybook behavior, Storybook build, and visual proof. Remaining gaps are narrower:

1. **Repository change classification:** metadata inside broad runtime directories can trigger browser proof, while visual currently hides every `.md` by extension.
2. **Unit:** `getVitestScope()` in `scripts/verify.ts` resolves direct tests and sibling-basename tests only; when that produces nothing, the unit lane skips. It does not use Vitest's supported related-test graph and cannot represent external file-as-data ownership such as `PRIVACY.md`.
3. **Mutation:** `getMutationScope()` and `stryker.config.mjs` infer mutation applicability from source/test adjacency. Repository verification policy explicitly requires mutation to be opt-in for high-risk targets instead.
4. **Release:** source-impact release checks exist only inside full mode. Ordinary `pnpm verify` therefore cannot automatically run a release contract when a develop-bound change affects production artifact/update semantics.
5. **Status loss:** `scripts/lib/changedPaths.ts` already preserves added/modified/deleted/renamed identity, but current lane planners consume its transitional flat path projection. New planning that depends on removals must consume status-aware input instead of rebuilding Git semantics elsewhere.
6. **Release CI placement:** current develop verification intentionally starts static, application E2E, Storybook behavior, and visual proof in parallel after `autofix`. Appending new release proof to one of those existing jobs would lengthen that independent lane and can increase the overall critical path even when it saves some aggregate build compute.

## End-state ownership

| Owner | Responsibility |
| --- | --- |
| `scripts/lib/changedPaths.ts` | repository change identity/status, base comparison, explicit-file scope |
| `scripts/lib/repositoryMetadata.ts` | one narrow fact: positively known non-runtime repository metadata |
| `scripts/lib/unitRisk.ts` | unit-test impact selection |
| `scripts/lib/e2eRisk.ts` | centralized product E2E source-to-scenario ownership |
| `scripts/lib/storybookBehaviorRisk.ts` | reusable Storybook browser behavior impact |
| `scripts/lib/storybookBuildRisk.ts` | Storybook static-build relevance |
| `scripts/lib/visualRisk.ts` | visual proof ownership and fallback |
| `scripts/lib/mutationTargets.ts` + mutation resolver | explicit high-risk mutation ownership only |
| `scripts/lib/releaseRisk.ts` | source-impact selection among existing release contracts |
| `scripts/verify.ts` | invocation orchestration, command construction, prerequisite/reuse handling, execution/reporting |
| `.github/workflows/verify.yml` | CI execution placement only; preserve independent parallel proof lanes and aggregate their results |
| exact-head GitHub CI | authoritative automatic repository merge gate |

`verify.ts` must stop being the place where unit/mutation ownership is inferred inline. It may compose already-resolved plans and reuse prerequisites, but ownership belongs to the specialized resolver.

Workflow YAML must not become a second impact planner. It decides where a verifier-selected lane executes, never whether a source path is unit/E2E/release relevant.

## Plan model

Every expensive automatic lane must remain deterministic and inspectable. Lane APIs may use the common semantic modes:

```text
skip     — positively no owning proof for this change
focused  — exact owning proof is known
full     — lane is relevant but safe narrower ownership is unknown
invalid  — ownership/configuration itself is inconsistent
```

Do **not** introduce a generic shared planner abstraction merely because these modes look similar. Each resolver owns its own fields and validation.

Required reason behavior:

- every `focused` and `full` plan identifies the path/owner that selected it;
- every `invalid` plan explains the broken registry/ownership relation;
- an irrelevant metadata file must not erase a relevant path in the same change set;
- `full` dominates `focused` inside the same lane;
- `invalid` dominates executable plans where the lane cannot be trusted.

## Changed-path model

`scripts/lib/changedPaths.ts` remains the only owner of Git change status.

It already exposes:

```ts
type ChangedPath =
  | { status: 'added' | 'modified' | 'deleted'; path: string }
  | { status: 'renamed'; oldPath: string; newPath: string };
```

Target rule:

- existing browser planners may keep the flat projection until a concrete status-specific defect requires more;
- new unit planning must consume status-aware changes because deleted/moved dependencies cannot be resolved safely from the current filesystem alone;
- mutation registry validation may use current filesystem state; a registered target that no longer exists is invalid unless the registry is removed/updated in the same resulting tree;
- release planning may normally use the flat current/old path projection, but any mapping whose correctness depends on deletion must fail closed rather than silently ignore the old side.

Do not create a second Git-diff parser in a lane resolver.

## Repository metadata classification

PR 1 implements the narrow browser-facing classifier from `verify-change-classification.md`:

```ts
isNonRuntimeRepositoryMetadataPath(filePath: string): boolean
```

It is **not** the root of all verifier relevance. It exists only to prevent confirmed repository metadata from inheriting runtime/browser ownership by directory location.

The classifier is deliberately narrower than a Markdown/document classifier: arbitrary source-adjacent `README.md`, `ARCHITECTURE.md`, `DESIGN.md`, or `REVIEW.md` files are not excluded merely by basename. Only stable confirmed metadata paths/roots are safe exclusions; unknown source-adjacent Markdown remains fail-closed.

Known runtime content is explicitly outside metadata semantics:

- `docs/user/**` is runtime Help content;
- `PRIVACY.md` is runtime privacy content;
- no extension-wide Markdown exclusion is allowed.

Storybook build has been audited and does not require this classifier because its existing relevance is already explicit rather than owner-directory broad.

## Static checks

Format, Oxlint, ESLint, agent-environment compatibility, and type-check already have sufficiently direct ownership for the modernization finish line.

Do not redesign them for symmetry with expensive lanes.

Changes are allowed only if a concrete correctness or false-positive defect is discovered during the benchmark.

# Unit impact architecture

## Goal

Use the test runner's supported dependency relation for ordinary source changes, with explicit mappings only for repository inputs that are deliberately consumed as file data rather than importable modules.

Target:

```text
direct changed test
        ↓
known exact file-as-data owner
        ↓
existing source/test-support path
        ↓
Vitest related resolution
        ↓
unsafe status/infrastructure relation
        → full unit

proven unit-irrelevant
        → skip
```

## Owner

Create `scripts/lib/unitRisk.ts` and move unit-impact decisions out of `scripts/verify.ts`.

A suitable specialized result is conceptually:

```ts
type UnitPlan =
  | { mode: 'skip'; reasons: string[] }
  | { mode: 'focused'; relatedInputs: string[]; reasons: string[] }
  | { mode: 'full'; reasons: string[] }
  | { mode: 'invalid'; reasons: string[] };
```

The exact TypeScript spelling may vary; do not generalize it into a cross-lane type framework.

## Focused resolution

For added/modified current-tree inputs:

1. direct Vitest test files select themselves;
2. an exact external file-as-data mapping selects its owning test file(s);
3. ordinary source/test-support modules are passed to Vitest's supported related-test selection;
4. mapped test paths may also be passed as related inputs so the runner selects the exact test module through its own supported mechanism.

Focused execution should use the repository's installed Vitest related mode rather than reconstructing its import graph, e.g. the equivalent of:

```bash
pnpm exec vitest related <related inputs...> --run --reporter=verbose
```

Vitest related resolution is the dependency owner. The verifier does not persist or calculate a module graph.

## Exact file-as-data mappings

An explicit unit mapping is justified only when the owning test deliberately reads/consumes a repository file outside the import relation.

Confirmed seed relation:

```text
PRIVACY.md
→ src/pages/DataStoragePrivacyPane/DataStoragePrivacyPane.test.ts
```

The implementation PR must also perform one bounded audit of existing Vitest tests that read repository files directly (for example workflow/config source text) and seed only confirmed exact relations. Known examples include workflow tests such as:

- `scripts/release/buildDateWorkflow.test.mjs` reading `.github/workflows/release.yml`, `.github/workflows/verify.yml`, and `.github/workflows/deploy-branch.yml`;
- `scripts/release/managedDeploymentValidationWorkflow.test.mjs` reading those managed-deployment workflow sources;
- other existing tests that directly read a concrete repository file must be mapped only when the relation is verified in code.

This is a **small unit-specific external-input map**, not a general dependency registry.

Validation must fail `invalid` if a configured owner test does not exist or is not a Vitest-owned test.

## Full-unit triggers

Run full unit proof when the change can affect unit execution globally or the previous dependency relation cannot be inspected safely.

Minimum classes:

- `vitest.config.ts`;
- `src/setupVitest.ts`;
- the actual config modules imported by the Vitest config (`config/alias.ts`, `config/plugins/base.ts`) when their change can alter resolution/transformation globally;
- `pnpm-lock.yaml`;
- a `package.json` change that cannot be positively classified as version-only by the existing `packageJsonImpact.ts` helper;
- deleted unit-relevant source/test-support files;
- the old side of a rename/move when safe surviving ownership cannot be established from the current tree;
- deleted unit tests, because the owning proof set itself changed and cannot be executed at the old path.

Do not broaden this into “any config file → full unit”. Every global trigger must correspond to actual Vitest runtime/config ownership.

## Zero related tests

A successful related resolution with zero affected tests is allowed for a source that has no unit owner. It must be reported as such; it is not evidence that the change is globally safe and does not suppress other lanes.

Do **not** respond to every zero-related result by running the full unit suite. Full fallback exists for relations the resolver cannot represent safely, not to manufacture tests where no unit owner exists.

## Snapshot ownership

No separate Vitest snapshot tree is currently a known migration requirement. If conventional snapshots are introduced or discovered, deterministic `__snapshots__` → owner-test resolution belongs in `unitRisk.ts`; do not create a registry for ordinary conventional snapshot ownership.

## Unit acceptance

At minimum prove:

- direct changed test → focused;
- ordinary changed source imported by tests → related focused execution;
- `PRIVACY.md` → exact privacy pane unit owner;
- confirmed workflow file-as-data input → exact workflow unit owner(s);
- runtime Markdown without a unit owner is not globally treated as metadata;
- unit infrastructure → full;
- version-only `package.json` does not force full unit;
- runtime-relevant/unknown `package.json` → full;
- deleted/moved unit-relevant source → full unless a safe surviving relation is explicitly proven;
- Playwright `.browser.spec.ts`, `.visual.spec.ts`, and `tests/e2e/**/*.spec.ts` remain outside Vitest ownership;
- unrelated repository metadata does not force unit proof merely because it is Markdown.

# Application E2E architecture

PR 1 completes the known classification defect. After that, application E2E remains centralized and scenario-owned.

Target remains:

```text
known source → exact product scenario(s)
unknown application-E2E-relevant source → full E2E
known irrelevant/proof-only source → skip
broken registry → invalid
```

Required PR 1 addition:

```text
docs/user/**
→ tests/e2e/helpNavigation.spec.ts
```

Do not replace centralized product scenarios with directory-local inference.

# Storybook behavior architecture

Owner-local reusable browser behavior remains the default where implemented, with explicit mapping only for justified cross-owner/family infrastructure.

PR 1 adds repository-metadata exclusion **before** owner-local matching so source-adjacent instructions do not inherit browser proof.

No further architecture redesign is required before the benchmark.

# Storybook build architecture

No change required.

The current planner already selects only explicit Storybook/build infrastructure, `.storybook/**`, story files, and runtime-relevant `package.json`. It does not suffer from the broad metadata inheritance defect.

Local static-build reuse across selected Storybook browser lanes remains valid. GitHub behavior and visual jobs remain self-contained and parallel; no shared Storybook artifact is introduced unless the post-finish benchmark proves a critical-path need.

# Visual architecture

PR 1 removes the global `.md` exclusion and replaces it with the narrow repository-metadata predicate while preserving existing owner-local/explicit visual planning and fail-closed fallback.

No broader visual redesign is part of the finish line.

# Mutation architecture

## Goal

Mutation testing is an opt-in quality proof for explicitly identified high-risk logic, not an automatic consequence of source/test adjacency.

Target:

```text
changed registered high-risk source
or changed registered owning test
→ mutate exact registered source

mutation registry/config changes
→ validate; run all registered targets when mutation execution semantics changed

unregistered change
→ skip mutation

invalid registry
→ invalid/fail
```

## Single source of truth

Create one mutation-specific registry consumable by both verifier planning and Stryker configuration. A narrow TypeScript module is preferred if it remains directly consumable under the repository Node contract; do not duplicate the target list in `verify.ts` and `stryker.config.mjs`.

Conceptual entry:

```ts
type MutationTarget = {
  source: string;
  tests: readonly string[];
  reason: string;
};
```

Required meaning:

- `source`: one exact mutable source owner;
- `tests`: exact unit proof that justifies keeping mutation coverage on that source;
- `reason`: concrete high-risk contract, not “has tests” or “important file”.

## Registry validation

Fail invalid when:

- a source does not exist;
- an owning test does not exist or is not a Vitest-owned test;
- a source is registered more than once with conflicting ownership;
- `tests` or `reason` is empty;
- Stryker's configured mutate surface and verifier target registry diverge.

The registry must stay small enough that a full mutation-registry validation run is bounded. Growth is a review decision, not an automatic scan result.

## Initial target population

The current repository has no canonical source-controlled list of high-risk mutation contracts; the existing list is generated mechanically by adjacency. Therefore exact initial registry entries must **not** be invented from file names.

Before enabling the new mutation selector, perform one bounded audit of the currently useful mutation targets and retain only targets with a concrete risk reason and truthful focused unit owner. This is target-data population under the architecture above, not an unresolved architecture choice.

Do not migrate every current adjacency-derived source merely to preserve historical mutation count.

## Stryker configuration

`stryker.config.mjs` must derive `mutate` from the same explicit registry. Its existing `vitest.related: true` may remain the runner mechanism for selecting tests that exercise the mutated source.

Remove filesystem adjacency scanning as mutation ownership.

## Mutation acceptance

- registered source change → focused mutation of that exact source;
- registered owning-test change → focused mutation of that exact source;
- unregistered source with adjacent tests → mutation skip;
- registry/Stryker config change that affects mutation execution → all registered targets or invalid, never silent skip;
- malformed/stale target → invalid;
- full/release verification still does not automatically add mutation: mutation remains a development/PR-quality check, not a stable artifact gate.

# Release-impact architecture

## Separate policy from artifact/source impact

`release-version` is **not** a changed-source impact check. It is an independent PR/release-policy gate based on target branch, declared version intent, and `package.json` version.

Keep it separate:

```text
release-version
→ independent PR policy gate
→ still runs where docs/release.md requires it

source-impact release planner
→ release-config / build / publisher-node-import /
   artifact / release-smoke / managed-updates
```

Do not infer PATCH/MINOR/MAJOR from changed files.

## Owner

Create `scripts/lib/releaseRisk.ts` for the six existing source-impact release contracts:

```ts
type ReleaseImpactCheck =
  | 'release-config'
  | 'build'
  | 'publisher-node-import'
  | 'artifact'
  | 'release-smoke'
  | 'managed-updates';
```

Conceptual specialized plan:

```ts
type ReleasePlan =
  | { mode: 'skip'; reasons: string[] }
  | { mode: 'focused'; checks: ReleaseImpactCheck[]; reasons: string[] }
  | { mode: 'full'; reasons: string[] }
  | { mode: 'invalid'; reasons: string[] };
```

`full` means all six source-impact release contracts, **not** `release-version`.

## Existing release contracts remain the proof owners

Do not create new release tests merely to make planning easier.

Current owners:

- `release-config`: stable base/PWA/environment release assumptions (`validateReleaseConfig.mjs`);
- `build`: production artifact can be built by `buildArtifact.mjs`;
- `publisher-node-import`: plain-Node publisher → release descriptor → `releaseWireContract.ts` import/execution seam;
- `artifact`: production artifact/base path/critical assets/PWA/SPA fallback/controller artifact semantics;
- `release-smoke`: first-user and returning-user persistence smoke against the production artifact;
- `managed-updates`: fixed managed-update lifecycle, migration/isolation, cross-engine, and data-compatibility release proof groups.

Planning maps source ownership to these existing contracts; it does not duplicate their assertions.

## Required release-sensitive classes

The implementation must use exact mappings where the contract is known and a conservative full source-impact fallback inside genuinely release-sensitive infrastructure.

Minimum confirmed ownership classes to encode and test:

### Release config/build

Changes to the actual production/release build configuration and scripts that own stable base/PWA artifact assembly must select the relevant `release-config`, `build`, and/or `artifact` contracts according to what they affect. Examples include the current owners around:

- `config/tooling.json` release configuration;
- `scripts/release/validateReleaseConfig.mjs`;
- `scripts/release/buildArtifact.mjs`;
- `vite.config.ts` and the production PWA/build plugin configuration it actually consumes;
- `index.html` / production assets when they affect artifact semantics;
- `playwright.release.config.ts` or release-container infrastructure when it changes how release browser proof is executed.

Do not classify all repository `config/**` as release-sensitive.

### Publisher/wire contract

Changes to the proven import seam must select `publisher-node-import`, and changes that alter managed publication/runtime compatibility must also select the owning managed release proof where required:

```text
scripts/pages/lib/releasePublish.mjs
→ scripts/pages/lib/releaseDescriptor.mjs
→ src/shared/service/appUpdate/releaseWireContract.ts
```

Publisher/retained-release/data-compatibility code under the managed publication owner must map to the smallest truthful existing release checks; unknown relevant changes inside that boundary fail closed rather than skip.

### Managed update runtime

`src/sw.ts` and production managed-update lifecycle/controller/service boundaries must select `managed-updates`; artifact-facing worker changes also select `artifact` when the built controller artifact contract is affected.

Use the canonical `docs/managed-pinned-updates.md` ownership to define the exact initial mapping. Do not map unrelated `src/shared/service/**` broadly to managed updates.

### Release proof itself

Direct changes to release tests/scripts select their own contract:

- `productionArtifactSmoke.spec.ts` and its owning release fixture/infrastructure → `artifact`;
- `firstUserAndReturningUserSmoke.spec.ts` and its owning release fixture/infrastructure → `release-smoke`;
- managed-update release specs and `managedUpdatesProof.mjs` → `managed-updates`;
- `publisherWireContractImportProof.mjs` → `publisher-node-import`;
- `validateReleaseConfig.mjs` → `release-config`.

Proof-only helpers shared by several release checks must select every actual consumer or conservatively full the source-impact release plan if the consumer set is not safely bounded.

### Dependency changes

- `package.json` version-only changes reuse the existing positive version-only comparison and do not force source-impact release proof merely because the version changed;
- a runtime-relevant or unclassifiable `package.json` change is release-sensitive and fails closed to all source-impact release contracts unless a narrower dependency-impact rule is positively proven;
- `pnpm-lock.yaml` is release-sensitive because resolved production/tooling dependencies can change the built artifact and release tools; treat it conservatively until benchmark evidence justifies a narrower safe rule.

## Version-policy files

Version policy/materialization files are owned by `release-version` and their unit/workflow tests. They must not automatically trigger all source-impact release contracts merely because they live under `scripts/release/**`.

This prevents the release planner from conflating release **policy** with production artifact/runtime semantics.

## Release planner validation

Fail `invalid` for:

- a mapping that references an unknown release check;
- a direct release-proof owner whose referenced spec/script no longer exists;
- conflicting mapping data that can silently drop a required consumer;
- a relevant deleted/moved release owner whose old ownership cannot be resolved safely.

Unknown significant source inside a confirmed release-sensitive boundary → `full`, not `skip`.

## Execution and artifact reuse

`verify.ts` owns execution prerequisites, not source ownership.

Rules:

- `pnpm verify:release` / `pnpm verify --full` continue to run the complete full-project/release sequence exactly as the deliberate release gate;
- ordinary `pnpm verify` may append only source-impact release checks selected by `releaseRisk.ts`;
- a standalone focused release check remains self-contained, matching current behavior;
- the dedicated CI release-impact entry executes all selected source-impact release checks in **one verifier invocation**, so `build` can be scheduled once and the existing `RELEASE_ARTIFACT_SKIP_BUILD` mechanism can reuse that artifact for `artifact` / `release-smoke` when applicable;
- `managed-updates` keeps its existing fixed fresh-container grouping and is not forced through production-artifact reuse that it does not currently own;
- do not move release-impact behind application E2E or static verification merely to reuse an existing job: that trades aggregate compute for a longer critical path;
- do not add cross-job artifact transfer merely to eliminate occasional duplicate CI builds.

The release-impact invocation may remain internally sequential initially. In particular, managed-update release groups keep their intentional fixed ordering/isolation. If the representative benchmark later proves the dedicated release lane itself is the critical-path bottleneck, splitting artifact-oriented and managed-update release execution into separate parallel jobs may be reconsidered then.

## CLI contract

`release-version` remains a full/policy-only label.

Add one specialized automatic orchestration label:

```bash
pnpm verify --only release-impact
```

`release-impact` means: resolve `releaseRisk.ts` against the ordinary changed-path scope and execute only the selected source-impact release contracts in one invocation. It is an execution grouping, not a new proof owner and not a second source-impact registry.

The six individual source-impact release labels remain available as focused implementation/diagnostic entry points and become valid outside `--full`:

```bash
pnpm verify --only release-config --files <paths...>
pnpm verify --only build --files <paths...>
pnpm verify --only publisher-node-import --files <paths...>
pnpm verify --only artifact --files <paths...>
pnpm verify --only release-smoke --files <paths...>
pnpm verify --only managed-updates --files <paths...>
```

`--files` remains optional in ordinary CI/base-diff operation. Do not add a second release-specific changed-path syntax.

# CI parity

## Principle

Exact-head GitHub CI must execute the same resolvers as local `pnpm verify`; workflow YAML decides only **where** a selected lane runs, not whether changed paths are release/unit/mutation relevant.

The existing develop CI intentionally preserves independent parallel proof after `autofix`:

```text
autofix
   ├─ verification-static
   ├─ verification-browser-e2e
   ├─ verification-storybook-browser / storybook-behavior
   ├─ verification-storybook-browser / visual
   └─ release-version (PR policy, independent)
```

Release-impact must preserve this shape rather than lengthening one existing branch of the graph.

## Required CI topology

Add one dedicated implementation-proof lane:

```text
autofix
   ├─ verification-static
   ├─ verification-browser-e2e
   ├─ verification-storybook-browser / storybook-behavior
   ├─ verification-storybook-browser / visual
   ├─ verification-release
   └─ release-version
```

`verification-release` starts directly after `autofix` under the same exact-head/base-ref rules as the other implementation lanes and runs:

```bash
pnpm verify --verbose --only release-impact
```

For an ordinary non-release-sensitive diff the release planner returns `skip`; the job may still pay checkout/setup/install cost, but it runs in parallel and should not extend wall-clock merge latency while the longer existing browser lanes are active. Do not duplicate release relevance with GitHub Actions `paths` filters merely to avoid this setup cost.

For a release-sensitive diff the lane owns the required source-impact release execution and contributes independently to the CI critical path.

### Existing lanes remain unchanged in ownership

`verification-static` keeps static/unit/mutation and Storybook-build fallback ownership. Do not append source-impact release checks there.

`verification-browser-e2e` keeps application product E2E ownership. Do not append release browser proof after E2E.

Storybook behavior and visual remain self-contained parallel matrix lanes. Do not make them depend on release build output.

`release-version` remains independent exactly as defined by `docs/release.md` and is not folded into `verification-release`.

### Aggregation

The existing `verification` aggregator must additionally require `verification-release == success`. `deploy-preview` continues to depend on aggregate implementation verification, so a selected failing release contract blocks the preview/merge implementation gate exactly like another required proof lane.

## CI latency and duplication policy

Primary metric:

```text
merge latency ≈ max(duration of required parallel proof lanes)
```

not the sum of all CI compute.

Therefore:

- keep independent proof lanes parallel even when that duplicates setup/build compute;
- reuse deterministic artifacts **within one lane/invocation** when it reduces work without creating a new dependency;
- do not create a shared producer job that all browser/release lanes must wait for solely to eliminate duplicate builds;
- do not serialize release proof behind E2E/static solely to reuse their provisioned runner;
- evaluate aggregate compute as a secondary benchmark metric after correctness and critical-path latency.

The dedicated release lane is the only new job required by this target. Further job splitting/parallelism remains deferred until measurement.

# `verify.ts` target role

After the finish work, `scripts/verify.ts` should primarily:

1. resolve the canonical invocation and changed-path scope;
2. ask each specialized resolver for a plan;
3. turn plans into command entries;
4. add execution prerequisites/reuse within the same invocation;
5. run commands with existing locking/reporting/resume behavior.

It should **not** contain filesystem algorithms that decide unit or mutation ownership.

Do not refactor unrelated execution/reporting code merely to make `verify.ts` smaller.

# Implementation sequence

The architecture is resolved up front, but implementation should remain bounded for coding agents.

## PR 1 — change-classification precision

Contract: `docs/testing/verify-change-classification.md`.

Implement only:

- repository metadata helper with stable confirmed metadata paths/roots only;
- E2E metadata exclusion + Help runtime mapping;
- Storybook behavior metadata exclusion;
- visual removal of blanket `.md` exclusion + metadata exclusion;
- planner regression tests.

Storybook build is audited/no-change.

## PR 2A — unit impact

Implement:

- `unitRisk.ts`;
- status-aware unit planning;
- Vitest related execution;
- bounded exact file-as-data mapping audit and seed mappings;
- unit infrastructure full fallback;
- resolver/command tests;
- removal of old sibling-basename `getVitestScope()` ownership once fully replaced.

## PR 2B — mutation ownership

Implement:

- one explicit mutation target registry;
- bounded architect-approved target population from current useful high-risk targets;
- mutation resolver/validation;
- Stryker `mutate` derived from the same registry;
- removal of adjacency-generated mutation ownership;
- focused/full-registry planner tests.

## PR 2C — release impact + CI parity

Implement:

- `releaseRisk.ts`;
- source-impact release plan in ordinary `verify`;
- specialized `release-impact` orchestration label;
- focused non-full individual release labels except `release-version`;
- same-invocation artifact reuse where applicable;
- one dedicated `verification-release` CI job starting in parallel after `autofix`;
- aggregate verification dependency on the new release lane;
- release planner/command/workflow tests.

Do not append release checks to static or application-E2E jobs. Do not add workflow path filters that duplicate `releaseRisk.ts`.

The three PR 2 slices implement one already-resolved architecture; they are not invitations to redesign the approach independently.

## Benchmark — then stop

After PR 2C, benchmark representative real change classes from `verify-modernization.md`.

For CI, record both:

- critical-path / merge latency;
- aggregate expensive compute.

Optimize critical path first; lower aggregate compute only when it does not make independent proof serial.

Stop verifier infrastructure work when the exit criterion passes. Only measured remaining bottlenecks may reopen test-cost/parallelism work.

# End-state acceptance matrix

| Change class | Expected expensive proof |
| --- | --- |
| `AGENTS.md` / repository testing docs | no browser/release/mutation proof solely from metadata |
| arbitrary source-adjacent Markdown outside confirmed metadata roots | preserve fail-closed owning-lane behavior; no basename-wide skip |
| ordinary source with unit imports | Vitest related unit proof |
| source with no unit owner | no fabricated unit work; other owning lanes remain independent |
| external unit file-as-data input | exact mapped unit owner |
| deleted/moved unit source/support | conservative full unit when old relation cannot be resolved |
| normal feature source with mapped product scenario | related unit + focused app E2E as independently applicable |
| shared unknown E2E-relevant runtime source | full app E2E |
| owner-local UI behavior source | focused Storybook behavior |
| visual owner/source | focused/full visual according to current visual ownership |
| Storybook build config/story | static Storybook build according to existing planner |
| registered high-risk mutation source/test | exact mutation target |
| unregistered source with adjacent tests | no mutation |
| release build/PWA/publisher/update source | exact release contract(s), full source-impact release fallback when ownership unknown; execute in parallel CI release lane |
| version-only `package.json` | no runtime/release expansion from version field alone; independent release-version policy still applies |
| runtime dependency / lockfile change | conservative affected expensive lanes including release impact |
| explicit `pnpm verify:release` | complete full project/release gate; mutation excluded as today |

# Exit criterion

Verifier modernization is complete when:

1. repository metadata no longer produces known browser false positives;
2. runtime Markdown/assets are not hidden by extension-wide or generic-basename rules;
3. unit selection uses supported related resolution plus only necessary exact external-input mappings;
4. deleted/moved unit-relevant inputs fail closed where previous ownership cannot be resolved;
5. mutation is selected only from an explicit validated high-risk registry;
6. ordinary verify selects required release contracts for release-sensitive diffs;
7. release-version remains independent product/release policy;
8. every expensive lane has inspectable skip/focused/full/invalid behavior appropriate to its ownership;
9. exact-head CI uses the same resolver semantics;
10. required implementation proof remains parallel after `autofix`; new release proof is not serialized behind unrelated static/E2E/Storybook lanes;
11. no known required proof is silently missed and no known false-positive full run remains;
12. known flakes are absent;
13. representative benchmark shows no remaining critical-path problem that justifies more verifier infrastructure.

Then **stop**.

# Deferred unless benchmark proves need

- additional CI jobs beyond the one required `verification-release` lane;
- splitting the release lane into separate artifact/managed-update parallel jobs;
- shared Storybook or release artifacts across jobs;
- more Playwright workers;
- sharding;
- further component-by-component legacy visual cleanup;
- generic dependency graphs;
- generic planner/registry frameworks;
- broad test-suite optimization not tied to a measured bottleneck.

# Forbidden

- Do not use `*.md = irrelevant` or another extension-wide runtime skip.
- Do not classify arbitrary source-adjacent Markdown as metadata merely by basename.
- Do not turn `repositoryMetadata.ts` into a universal path taxonomy.
- Do not build a custom persistent unit dependency graph.
- Do not treat zero Vitest-related tests as proof that other lanes can skip.
- Do not infer mutation applicability from source/test adjacency.
- Do not auto-populate mutation targets from all current Stryker candidates.
- Do not infer release version impact from changed files.
- Do not make version-policy files trigger the whole source-impact release suite solely because they live under `scripts/release/**`.
- Do not weaken unknown-significant fallback to make verification faster.
- Do not add retries/timeouts/flaky acceptance as performance work.
- Do not append release-impact after E2E/static or otherwise serialize independent CI proof merely to save runner/setup/build compute.
- Do not duplicate `releaseRisk.ts` with workflow `paths` filters.
- Do not add cross-job artifact-transfer complexity before the benchmark demonstrates need.

# Readiness

- target architecture: resolved;
- PR 1 architecture: resolved;
- unit architecture: resolved;
- mutation architecture: resolved; exact initial high-risk target **data** requires a bounded audit before PR 2B implementation and must not be guessed;
- release-impact architecture: resolved;
- CI parity architecture: resolved with one dedicated release-impact job preserving existing parallel critical-path behavior;
- unresolved architecture blockers: none.
