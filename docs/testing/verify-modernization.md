# Verify modernization

Status: Stage V1 implemented and architecture-reviewed. Final merge readiness is owned by exact-head GitHub CI after documentation changes.

`docs/testing/architecture.md` remains the canonical testing policy. This document records the Stage V1 verifier modernization architecture, its implemented runtime contract, and the intentionally deferred optimization stages.

## Goal

Make verifier tooling easier to maintain and measure by moving verifier-owned Node modules from JavaScript/JSDoc to native TypeScript while preserving CLI behavior, planning semantics, fail-closed behavior, locking, execution, and reporting.

Stage V1 also adds explicit per-check and total elapsed-duration reporting so later performance work is measurement-driven.

## Implemented Stage V1 state

Verifier entrypoints and their direct verifier-owned dependencies now execute as native Node TypeScript:

- `scripts/verify.ts`;
- `scripts/verifyStatus.ts`;
- `scripts/verifyResume.ts`;
- `scripts/ciAutofix.ts`;
- `scripts/playwrightContainer.ts`;
- verifier-owned `scripts/lib/*.ts` modules.

`package.json` invokes those `.ts` entrypoints directly with Node. No `tsx`, `ts-node`, Babel, bundler, emitted tooling build, generic task runner, or verification framework was introduced.

`tsconfig.scripts.json` owns the directly executed tooling TypeScript project and participates in repository type-check. It uses Node-compatible ESM settings, explicit TypeScript import support, `noEmit`, `erasableSyntaxOnly`, and `verbatimModuleSyntax` so source accepted by type-check stays within Node's native erasable-TypeScript execution model.

The repository runtime contract is Node `>=24.12.0 <25`:

- `package.json#engines.node` is the canonical bounded runtime range;
- `.nvmrc` selects Node 24 for local version managers;
- GitHub workflows resolve the repository or checked-out application `package.json` through `actions/setup-node` rather than floating on `lts/*`;
- direct `@types/node` ownership stays on major 24.

Jobs that check application source out under `app-source/` resolve `app-source/package.json`; root-checkout jobs resolve the root `package.json`.

Elapsed timings use monotonic time and are diagnostic only. They do not participate in pass/fail, command ordering, locking, timeout calculations, heartbeat behavior, or exit status.

## Preserved compatibility

Stage V1 is behavior-preserving. The implementation keeps:

- accepted and rejected CLI argument behavior;
- `skip | focused | full | invalid` planning semantics and existing fail-closed fallbacks;
- existing application E2E, visual, Storybook behavior, unit, mutation, and release ownership;
- Playwright projects, worker counts, sharding behavior, and CI topology;
- command ordering, environment propagation, timeout and heartbeat behavior;
- verify/expensive machine-lock ownership and status/resume behavior;
- safe fix-mode behavior;
- process and exit semantics.

Compatibility includes runtime boundaries that TypeScript cannot make stricter merely by annotation. Persisted lock metadata is read as a compatibility input: current writes use the strict current `LockMetadata` contract, while legacy/missing display fields retain the pre-V1 generic busy diagnostics instead of being misclassified by static narrowing.

The legacy invalid visual-plan input accepted by the command-building compatibility seam remains blocking/fail-closed. Production visual resolution itself remains on the existing Stage V1 planner contract; this PR does not redesign visual relevance.

## Historical baseline and measurements

Before Stage V1, the same verifier command surface was implemented by `scripts/verify.mjs` and verifier-owned `scripts/lib/*.mjs` modules. The migration was intentionally separated from planner and CI performance changes so behavior regressions could be distinguished from intentional optimization.

Baseline measurements from `develop` workflow run 3556 on 2026-08-14 were approximately:

- application E2E: 12m30s;
- visual: 9m37s;
- Storybook behavior: 4m16s;
- static verification checks: 4m01s;
- within static: Storybook build 2m07s, type-check 43s, mutation 36s, ESLint 17s.

These measurements show that TypeScript migration is primarily a maintainability change. It is not itself claimed as a performance optimization.

## Non-goals for Stage V1

- Do not change which product paths select `skip`, `focused`, `full`, or `invalid` for a lane.
- Do not narrow E2E, visual, Storybook behavior, unit, mutation, or release coverage.
- Do not change Playwright projects, worker counts, sharding, CI job topology, or Storybook artifact reuse.
- Do not introduce a generic task-runner framework, plugin system, dependency-injection framework, or cross-lane registry.
- Do not migrate unrelated build, release, Pages, Husky, or maintenance scripts merely for consistency.

## Ownership and source of truth

- `AGENTS.md` and `.agents/skills/verification/SKILL.md`: verifier workflow rules;
- `docs/testing/architecture.md`: proof ownership and project-wide testing policy;
- `docs/testing/migration-plan.md`: currently executable resolver/discovery state;
- `scripts/verify.ts` and verifier-owned `scripts/lib/*.ts`: current verifier planning/execution/reporting implementation;
- verifier-owned tests: current compatibility and regression proof;
- `tsconfig.scripts.json`: native TypeScript tooling compiler contract;
- `package.json`, `.nvmrc`, and GitHub workflow Node setup: executable Node runtime contract.

Repository verification tooling under `scripts/` owns planning, execution, locking, and reporting. Product source and proof ownership do not move into verifier infrastructure.

## State and public surface

No persisted application state changes.

Verifier plan/result data uses explicit TypeScript contracts and narrow discriminated unions where the concepts are genuinely shared. Lane-specific data remains local rather than being forced into a generic result framework.

Public command compatibility remains:

- `pnpm verify`;
- `pnpm verify --full`;
- `pnpm verify --only <label>`;
- `pnpm verify --files ...`;
- `pnpm verify --only storybook-build --storybook-build-ci-fallback`;
- `pnpm verify --only storybook-behavior --files <spec...> --repeat <2..20>` as a bounded, explicit stability-diagnostic mode;
- existing fix/profile/verbose combinations;
- `pnpm verify:release`;
- `pnpm verify:status`;
- `pnpm verify:resume`;
- `pnpm ci:autofix`.

Exported verifier helper contracts used by tests remain compatibility surfaces where Stage V1 depends on them.

## Acceptance matrix

| Contract          | Stage V1 acceptance                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| CLI compatibility | Existing supported commands and invalid-argument rejection remain behaviorally equivalent.                                  |
| Planning          | Representative added/modified/removed/moved path cases preserve lane decisions and reasons.                                 |
| Fail closed       | Unknown relevant impact and invalid metadata continue to select full/block exactly as before.                               |
| Execution         | Child command order, environment, locks, timeout/heartbeat handling, process results, and exit semantics remain equivalent. |
| Fix mode          | Existing safe fixer behavior and guards remain equivalent.                                                                  |
| Status/resume     | Existing lock-status and resume behavior remain equivalent.                                                                 |
| Type safety       | Migrated verifier modules are checked by the repository type-check with no emitted tooling build.                           |
| Runtime           | `pnpm verify*` executes `.ts` entrypoints directly under Node `>=24.12.0 <25`.                                              |
| Measurement       | Executed checks and the total verifier run expose elapsed durations without changing outcomes.                              |
| Scope             | No product behavior, proof ownership, lane applicability, Playwright project matrix, or CI topology changes.                |

## Required proof

Stage V1 requires:

- migrated verifier unit tests passing with their owners;
- CLI parsing/validation compatibility coverage;
- representative planner parity for added/modified/removed/moved and focused/full/invalid cases;
- process, lock, stale-lock, timeout, heartbeat, status, and resume coverage;
- persisted lock compatibility coverage for legacy runtime metadata;
- deterministic timing formatting/reporting coverage without real-time sleeps as assertions;
- repository type-check including `tsconfig.scripts.json`;
- representative direct native-`.ts` command execution;
- verifier-managed focused format, Oxlint, ESLint, type-check, and unit proof during implementation.

No new browser, visual, product E2E, mutation target, or performance benchmark is required solely by Stage V1. GitHub CI remains the authoritative exact-head merge gate.

## Deferred stages

### Stage V2 — planner precision

After V1 is merged and timing/fallback data is observable, audit avoidable full-lane fallbacks, especially:

- broad `src/shared/ui/` and `src/shared/lib/` application-E2E classification;
- developer/playground paths that are not product bootstrap;
- unmapped product owners that force full E2E;
- visual relevance that treats docs, instructions, type-only files, or deterministic owner moves as full visual impact.

V2 must preserve the rule that unknown **relevant** impact fails closed to the full owning lane. It must not redefine proof ownership inside resolver code.

### Stage V3 — execution performance

V3 optimizes both elapsed verification time and aggregate compute after planner precision is stable.

Implemented V3 optimizations:

- **V3A — application E2E project applicability:** source impact still chooses product specs, while each root application spec declares whether it requires desktop, mobile, or both Playwright projects. The audited matrix preserves the existing two projects, one application E2E invocation, one build, and serial execution while eliminating project executions that do not prove an additional platform contract. Metadata validation fails closed, and unclassified specs remain fail-safe to both projects for direct Playwright collection.
- **V3B — Storybook build execution:** local automatic verification reuses one deterministic `storybook-static` prerequisite across selected Storybook behavior and visual proof through the explicit fail-closed `STORYBOOK_STATIC_SKIP_BUILD=1` internal child-process contract. GitHub implementation verification deliberately does **not** transfer that static output between runners: `verification-browser (storybook-behavior)` and `verification-browser (visual)` are self-contained lanes that both depend only on `autofix`, build the Storybook they need inside their own bounded Playwright execution, and may run in parallel immediately. Application E2E remains independent. The verifier owns the narrow `pnpm verify --only storybook-build --storybook-build-ci-fallback` mode for the case where static Storybook build proof is required but neither browser lane will run; that fallback invocation runs inside the already-provisioned `verification-static` job, so it adds no standalone runner/setup/install cycle and skips when a self-contained browser lane already supplies equivalent static-build proof. Standalone focused behavior/visual commands remain self-contained, and PR preview keeps its separate base-specific Storybook build. Risk-specific Storybook behavior stability diagnosis can use bounded `--repeat 2..20` together with explicit `--files`; it repeats the selected scope inside one verifier-managed behavior invocation and does not alter automatic planning or normal CI topology.

Further V3 work should consider, in order:

- elimination of other repeated setup/proof where a deterministic result can be reused safely;
- optimization of expensive necessary tests after duplicate work is removed;
- additional jobs, workers, or parallelism only for irreducible remaining work when measured wall-clock benefit justifies the added aggregate resource cost and complexity.

Do not optimize GitHub Actions only for runner elapsed time. Free CI capacity is still a project resource: compare both wall-clock time and total executions/compute, and prefer the simpler lower-resource solution when coverage is equivalent.

## Rejected approaches

- TypeScript migration plus resolver narrowing in one PR: rejected because behavior regressions cannot be separated from intentional selection changes.
- TypeScript migration plus CI sharding/artifact changes in one PR: rejected because runtime/tooling migration and execution topology have different failure modes.
- Adding `tsx` or `ts-node`: rejected because the supported Node runtime executes the required erasable TypeScript directly.
- Replacing verifier logic with Nx/Turborepo/a generic task runner: rejected because current requirements need repository-specific impact planning and explicit ownership.
- Blindly increasing Playwright workers: rejected because application E2E shares origin-bound OPFS state and intentionally runs file-level work serially.

## Forbidden

- Do not change lane-selection semantics in Stage V1.
- Do not delete fail-closed or persisted-runtime compatibility behavior because TypeScript makes a path appear statically impossible.
- Do not weaken tests, retries, flaky handling, lock guards, timeouts, or invalid-plan failures to make migration pass.
- Do not add raw child-command alternatives that bypass `verify`.
- Do not add another persistent dependency graph or generic verification DSL.
- Do not migrate unrelated scripts solely to make all of `scripts/` TypeScript.
- Do not claim a performance improvement from the TypeScript migration itself.

## Stage V1 review status

- Architecture and ownership: reviewed; no remaining architecture blocker identified.
- Runtime contract: Node `>=24.12.0 <25`, aligned across repository metadata, typings, and CI setup.
- Compatibility regressions found during review: corrected with focused regression proof.
- Version policy: PATCH bump to `0.3.14` applied for this tooling/refactor PR.
- Documentation: synchronized to the implemented runtime and source paths in this PR.
- Merge gate: exact-head GitHub CI must be green after the final documentation commit before merge readiness can be approved.
