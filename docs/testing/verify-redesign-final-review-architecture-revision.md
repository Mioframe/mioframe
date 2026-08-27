# Verify redesign — final review architecture revision

## Status

Ready architecture handoff after the second scripts correction re-review.

The public eight-type verification architecture remains unchanged. This revision replaces the affected-ownership details that failed to remain complete across two correction rounds. Do not apply another incremental path-list patch under the superseded correction model.

## Goal

Make affected verification ownership durable for:

- production-artifact static proof;
- infrastructure shared by every Playwright-container-backed verification type;
- E2E structural validation relevance.

The result must fail closed when a relevant contract changes without adding a new dependency graph, generic planner framework, or public verification type.

## Confirmed current behavior and evidence

- `releaseStaticRisk.ts` now covers ordinary `src/**`, `public/**`, and a small exact root/config list, but real `vite.config.ts` directly consumes `config/alias.ts` and `config/plugins/**`; it also derives the build target from the repository Browserslist configuration. Those current build inputs can change the artifact while `build`/`artifact-static` still skip.
- `scripts/browserIntegration.ts`, `scripts/storybookBehavior.mjs`, `scripts/visual.mjs`, E2E runners, and release runners all execute through `scripts/playwrightContainer.ts`, whose command/lock/result/signal support is shared. The second correction added that support only to special browser-integration/E2E affected ownership, leaving generic browser-integration, behavior, and visual able to skip after the same execution infrastructure changes.
- `buildCommands()` gates structural E2E Playwright inventory/graph acquisition, but still resolves `validateE2ETargetTree()` and `validateE2EProjectApplicability()` when E2E has already been classified irrelevant.
- The second correction correctly fixed exceptional release-proof inventory ownership/validation, `--fix-only` early return, and status-preserving mutation planning. Those decisions remain accepted and must not be reopened.

## Non-goals

- no change to the eight public verification types or CLI;
- no `release` verification type and no `verify:release`;
- no new source dependency graph for static/browser/visual/behavior selection;
- no generic verification manager, planner registry, DSL, or cache;
- no change to ordinary structural page/widget E2E ownership or project applicability data;
- no change to product behavior or migrated test assertions;
- no change to Playwright container-only execution, locks, status/resume, timeout, profile/base, or flaky-failure semantics;
- no workflow correction until this scripts architecture is implemented and re-reviewed cleanly.

## Affected scenarios

1. A production/build input changes and can alter the Vite artifact -> `static` must run `build` + `artifact-static`; appUpdate/controller inputs also run `managed-updates-static`.
2. Shared Playwright execution infrastructure changes -> every verification type that executes through that infrastructure must widen to its complete owning type rather than skip.
3. A change is deterministically E2E-irrelevant -> default/focused verification must not resolve E2E structural inventory/applicability merely to discover irrelevance; literal `--full` still validates everything.

## Boundaries

Changes belong to `scripts/` verifier planning and focused tests only, plus this architecture documentation. `.github/workflows/verify.yml` remains downstream. Do not modify production application behavior, E2E scenario assertions, Storybook assertions, mutation targets, or public verify taxonomy.

## Ownership matrix

- feature/entity/widget/page/pane: N/A — product ownership is unchanged.
- shared application/service/worker: N/A — no product responsibility moves.
- verifier/tooling: `scripts/lib/*Risk.ts` keeps type-specific affected selection.
- shared Playwright execution infrastructure: one low-level verifier-owned predicate is the source of truth for paths whose runtime semantics are shared by all Playwright-container-backed types.
- release-static build capability: `scripts/lib/releaseStaticRisk.ts` remains the single owner.

## Source of truth

### Production artifact capability

`releaseStaticRisk.ts` owns one broad `isProductionArtifactBuildInput`-style capability. It classifies by stable repository area/capability rather than enumerating the current direct import closure of `vite.config.ts`.

It must cover:

- production `src/**`, excluding deterministically proof-only/test/story/spec/helper files;
- `public/**`;
- non-test/proof files under `config/**` because this directory owns Vite/plugin/alias/application build configuration;
- root build inputs currently used by the build contract: `vite.config.ts`, `index.html`, `.browserslistrc`, and `tsconfig*.json`;
- `scripts/release/buildArtifact.mjs`;
- runtime-relevant `package.json` and `pnpm-lock.yaml` through the existing package-impact refinement.

Every such input selects `build` + `artifact-static`. appUpdate/controller production inputs additionally select `managed-updates-static`. Version-only `package.json` remains release-version-only as already accepted.

Do not reintroduce an exact list of `config/alias.ts`, individual `config/plugins/*.ts`, or their transitive source imports. The repository-area rule is deliberately broader and is the simpler safe alternative.

### Shared Playwright execution infrastructure

Add one small verifier module/predicate (for example `scripts/lib/playwrightExecutionRisk.ts`) for only the infrastructure genuinely shared by the Playwright-container execution boundary. At minimum its current source of truth includes:

- `config/tooling.json`;
- `pnpm-lock.yaml`;
- `scripts/playwrightContainer.ts`;
- `scripts/lib/localCommandGuard.ts`;
- `scripts/lib/commandLock.ts`;
- `scripts/lib/runLocalCommand.ts`;
- `scripts/lib/processResult.ts`;
- `scripts/lib/signalForward.ts`.

`package.json` remains type-refined separately because version-only changes must not automatically widen browser proof.

The shared predicate is consumed by the existing type-specific planners; it is not a registry of types or tests:

- behavior hit -> full behavior;
- visual hit -> full visual;
- browser-integration hit -> both generic and exceptional browser-integration inventories, i.e. full public browser-integration type;
- E2E hit -> full E2E.

Type-specific configs/helpers remain in their current planners. Only the genuinely shared execution boundary moves to the shared predicate.

### E2E relevance gate

Resolve E2E relevance once before structural validation. When E2E is not relevant to the invocation/change set:

- do not collect Playwright owner inventory;
- do not acquire dependency-cruiser graph;
- do not run target-tree validation;
- do not run project-applicability validation;
- emit the normal E2E skip plan.

When E2E is relevant, retain all current filesystem/Playwright equality, target-tree, applicability, special productionArtifact membership, owner, and graph validation. Literal `--full` always takes the relevant/complete-validation path.

## State shape

No persistent state or new public metadata. The new shared Playwright infrastructure predicate is derived solely from changed repository paths.

## Public API / entry points

Unchanged:

```text
pnpm verify
pnpm verify --only <type>
pnpm verify --files <paths...>
pnpm verify --only <type> --files <paths...>
pnpm verify --full
pnpm verify:status
pnpm verify:resume
pnpm verify --fix-only
```

## Minimum sufficient design

1. Broaden `releaseStaticRisk.ts` using repository capability classes, not another dependency list.
2. Extract only the truly shared Playwright execution-path predicate and reuse it from the four browser-backed type planners.
3. Move E2E target-tree/applicability validation behind the already-existing E2E relevance decision.
4. Preserve the second correction's accepted exceptional inventory, fix-only, mutation, generic/special runner separation, TypeScript-first, and container changes unchanged.

Unavoidable complexity: one shared Playwright-infrastructure predicate. It is justified by a real shared runtime dependency currently duplicated incompletely across four verification types and reduces total path ownership duplication.

## Rejected approaches

- Third-round additions of more exact paths independently to each affected planner: already failed twice and duplicates one shared fact.
- Dependency-cruiser/import parsing for release-static or Playwright runner support: unnecessary for the stable coarse capabilities above.
- Universal planner/infrastructure registry: broader than the confirmed problem.
- Running every browser type for every `scripts/**` change: safe but unnecessarily broad; the shared execution boundary is explicit and small.

## Acceptance matrix

- `config/alias.ts`, representative `config/plugins/*.ts`, `config/vueCustomElements.ts`, `.browserslistrc`, representative `tsconfig*.json`, ordinary production source/assets, `public/**`, and Vite/build inputs -> `build` + `artifact-static`.
- proof-only/tests/stories/specs under `src/**` or `config/**` do not become artifact inputs solely by location.
- appUpdate/controller production input -> `build` + `artifact-static` + `managed-updates-static`.
- each shared Playwright execution-support path -> full behavior, full visual, full browser-integration (generic + exceptional), and full E2E.
- unrelated type-specific helper/config changes still affect only their truthful owning type(s).
- docs-only/default and `--only <non-e2e>` E2E-irrelevant scopes call no E2E inventory/tree/applicability/graph validators.
- relevant E2E and literal `--full` retain all current fail-closed structural validation.
- exceptional release-proof inventory remains one source of truth and direct/full validation remains intact.
- `--fix-only` still returns before proof planning.
- deleted/renamed mutation infrastructure still reaches status-preserving mutation planning.

## Risk matrix

- Broader release-static capability increases some focused static runtime; accepted because a broader safe run is preferred to repeated unsafe narrowing and no new inference mechanism is justified.
- A shared Playwright predicate could become too broad if type-specific paths are added to it; constrain it to the common execution boundary above and keep type-specific infrastructure local.
- E2E relevance gating must not hide structural invalidity after an E2E-relevant change; relevant/full paths retain every existing validator.

## Required test proof

- release-static unit cases for the current Vite config dependency classes and deterministic exclusions;
- each browser-backed planner proves a representative shared Playwright execution path widens its complete type;
- browser-integration integration proof shows the same shared hit selects generic plus exceptional leaves;
- `buildCommands()` dependency seams prove docs-only/default and non-E2E-only invocations do not call E2E tree/applicability/inventory/graph validation, while relevant/full invocations do;
- regression coverage preserves central special inventory validation, fix-only non-invocation, mutation deletion/rename behavior, and generic appUpdate exclusion where touched.

## Required verification

Coding implementation uses focused verifier-managed unit/static feedback only as needed. Final exact-head GitHub CI remains architect-owned. The downstream workflow browser-integration lane is corrected only after this scripts implementation receives a clean architect re-review.

## Forbidden

- no third independent path-list patch in behavior/visual/browser/generic/E2E planners for the shared Playwright runtime;
- no static dependency graph/import parser;
- no universal verification framework or planner registry;
- no weakening of structural/special inventory validation;
- no public taxonomy, product assertion, mutation-target, lock, container, or performance changes;
- no `.github/workflows/verify.yml` edit in this implementation pass.

## Implementation readiness

- required product and architecture decisions resolved: yes;
- source of truth and ownership explicit: yes;
- dependencies and worker-access boundaries explicit: yes;
- unresolved architecture blockers: none;
- verdict: **ready**.
