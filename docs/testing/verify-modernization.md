# Verify modernization

Status: architecture ready for Stage V1 implementation.

`docs/testing/architecture.md` remains the canonical testing policy. This document is the architecture handoff for modernizing the verifier implementation without weakening that policy.

## Goal

Make verifier tooling easier to maintain and measure by moving the verifier-owned Node modules from JavaScript/JSDoc to native TypeScript, while preserving all current CLI, planning, fail-closed, locking, execution, and reporting behavior.

Stage V1 also adds explicit per-check duration reporting so later performance work is driven by measurements rather than assumptions.

## Confirmed current behavior and evidence

- `package.json` runs `verify`, `verify:release`, `verify:status`, and related tooling through `node scripts/*.mjs`.
- `scripts/verify.mjs` owns CLI resolution, changed-path planning, lane planning, command construction/execution, locking, logging, timeout/heartbeat handling, and final reporting, with supporting `scripts/lib/*.mjs` modules.
- The verifier already resolves heavy lanes conservatively and reports their trigger reasons.
- GitHub CI currently uses Node LTS; recent verify jobs run on Node 24, and `tsconfig.node.json` already extends `@tsconfig/node24`.
- Current CI browser lanes are already parallel jobs. On `develop` workflow run 3556 (2026-08-14), observed wall-clock check times were approximately: E2E 12m30s, visual 9m37s, Storybook behavior 4m16s, static verification 4m01s of check execution. Within static verification, Storybook build was about 2m07s, type-check 43s, mutation 36s, and ESLint 17s.
- Therefore TypeScript migration is a maintainability change, not the primary performance optimization. Performance-selection and CI topology changes are deferred until Stage V1 provides stable measurement output.

## Non-goals for Stage V1

- Do not change which files select `skip`, `focused`, `full`, or `invalid` for any lane.
- Do not narrow E2E, visual, Storybook behavior, unit, mutation, or release coverage.
- Do not change Playwright projects, worker counts, sharding, CI job topology, or Storybook artifact reuse.
- Do not introduce a generic task-runner framework, plugin system, dependency-injection framework, or cross-lane registry.
- Do not migrate unrelated build, release, Pages, Husky, or maintenance scripts to TypeScript merely for consistency.

## Affected scenarios

1. A developer or CI invokes an existing `pnpm verify*` command and receives the same accepted/rejected arguments, selected checks, child commands, exit semantics, lock behavior, and actionable report as before.
2. A verifier module is edited and receives compile-time checking without requiring `tsx`, `ts-node`, or a generated JavaScript build step.
3. A developer or architect inspecting verifier output can see elapsed duration for every executed check and total verifier execution, without changing pass/fail semantics.
4. Existing stale-lock, resume, timeout, heartbeat, fix-mode, focused-mode, full-mode, and release-mode behavior continues to work.

## Boundaries

Stage V1 may change:

- verifier entrypoints directly participating in `pnpm verify`, `verify:release`, `verify:status`, `verify:resume`, and `ci:autofix` when required by their shared verifier dependencies;
- verifier-owned modules under `scripts/lib` that are direct dependencies of those entrypoints;
- verifier-owned tests for those modules;
- TypeScript configuration needed to type-check directly executed Node tooling;
- `package.json` command paths when corresponding `.mjs` files become `.ts`;
- CI Node-version configuration only if needed to establish the native-TypeScript runtime contract consistently.

Do not touch product source or proof ownership merely to simplify the migration.

## Ownership matrix

- feature: N/A
- entity: N/A
- widget: N/A
- page/pane: N/A
- shared: repository verification tooling under `scripts/` owns planning/execution/reporting; testing policy remains under `docs/testing/`.
- service/worker: N/A

## Source of truth

- `AGENTS.md` and `.agents/skills/verification/SKILL.md` for verifier workflow rules;
- `docs/testing/architecture.md` for proof ownership and fail-closed selection policy;
- `docs/testing/migration-plan.md` for currently executable resolver/discovery state;
- current `scripts/verify.mjs`, direct verifier dependencies, and their tests for behavior that Stage V1 must preserve;
- `package.json`, `tsconfig.node.json`, and CI workflow Node setup for the executable tooling environment.

## State shape

No persisted application state changes.

Verifier plan/result data should become explicit TypeScript types. Use narrow discriminated unions for existing conceptual states where that improves correctness, especially `skip | focused | full | invalid`, command entries, command results, and lock/process outcomes. Do not create a generic universal result abstraction when lane-specific data differs.

Timing data is observational only. A completed executed check may report its elapsed duration; skipped checks do not need fabricated durations.

## Public API and entry points

The public command surface must remain compatible:

- `pnpm verify`
- `pnpm verify --full`
- `pnpm verify --only <label>`
- `pnpm verify --files ...`
- existing fix/profile/verbose combinations
- `pnpm verify:release`
- `pnpm verify:status`
- `pnpm verify:resume`
- `pnpm ci:autofix`

Existing exported helper contracts used by verifier tests are also compatibility surfaces for Stage V1 unless an equivalent behavior-preserving extraction is proven in the same change.

## Minimum sufficient design

### Runtime

Use Node's native execution of erasable TypeScript. Do not add `tsx`, `ts-node`, Babel, a bundler, or an emitted tooling build solely to run verifier scripts.

Establish one explicit project runtime floor compatible with direct `.ts` execution and use it consistently in local/project metadata and GitHub CI where the repository already owns that choice. Avoid a floating runtime contract if it can make `pnpm verify` behave differently between environments.

### TypeScript configuration

Add the smallest dedicated tooling TypeScript project necessary for directly executed verifier scripts if extending the existing Node project would mix unrelated ownership or make type-checking unclear.

The configuration must:

- type-check verifier scripts without emitting JavaScript;
- use Node-compatible ESM resolution for directly executed files;
- allow explicit `.ts` import specifiers where required by native execution;
- restrict Stage V1 code to syntax Node can erase directly;
- participate in the repository's canonical `pnpm type-check` / verifier-managed type-check path.

### Module structure

Do not rewrite the verifier into a new framework. Preserve current module boundaries where they are cohesive.

`verify.mjs` is large enough that behavior-preserving extraction is allowed only where it produces clear ownership such as CLI parsing, planning, execution, or reporting. Extraction is not mandatory for Stage V1 and must not be used to redesign resolver ownership.

Prefer explicit local types next to their owners. Shared types are justified only when multiple current modules actually exchange the same contract.

### Timing instrumentation

Measure elapsed monotonic time around actual executed verifier checks and the total verifier execution. Report timings in the normal final result without affecting command ordering, locks, timeout calculation, heartbeat behavior, or exit status.

The report should make expensive checks identifiable at a glance. Exact formatting may follow the existing reporter style; timing values are diagnostics, not stable machine-readable API.

## Deferred stages

### Stage V2 — planner precision

After V1 is merged and timing/fallback data is observable, audit avoidable full-lane fallbacks, especially:

- broad `src/shared/ui/` and `src/shared/lib/` application-E2E classification;
- developer/playground paths that are not product bootstrap;
- unmapped product owners that force full E2E;
- visual relevance that treats docs, instructions, type-only files, or deterministic owner moves as full visual impact.

V2 must preserve the rule: unknown **relevant** impact fails closed to the full owning lane. It must not redefine proof ownership inside resolver code.

### Stage V3 — CI execution performance

Only after planner precision is stable, measure and consider:

- separate desktop/mobile application-E2E jobs while keeping each origin-bound project serial;
- reuse of one deterministic Storybook build artifact by browser/visual consumers where equivalence is proven;
- further CI parallelism only when isolation and coverage are explicit.

V2 and V3 are not part of Stage V1 implementation.

## Rejected approaches

- TypeScript migration plus resolver narrowing in one PR: rejected because behavior regressions cannot be separated from intentional selection changes.
- TypeScript migration plus CI sharding/artifact changes in one PR: rejected because runtime/tooling migration and execution topology have different failure modes.
- Adding `tsx` or `ts-node`: rejected because the project runtime can execute the required erasable TypeScript directly.
- Replacing verifier logic with Nx/Turborepo/a generic task runner: rejected; current requirements need repository-specific impact planning and explicit ownership, not another orchestration layer.
- Blindly increasing Playwright workers: rejected because current application E2E shares origin-bound OPFS state and intentionally runs file-level work serially.

## Shared UI blast radius

None. Product/shared UI behavior and tests must remain untouched except where a verifier test fixture names a path as data.

## Acceptance matrix

| Contract | Stage V1 acceptance |
| --- | --- |
| CLI compatibility | Existing supported commands and invalid-argument rejection remain behaviorally equivalent. |
| Planning | Representative added/modified/removed/moved path tests produce the same lane decisions and reasons. |
| Fail closed | Unknown relevant impact and invalid metadata continue to select full/block exactly as before. |
| Execution | Child command order, environment, locks, timeout/heartbeat handling, process results, and exit semantics remain equivalent. |
| Fix mode | Existing safe fixer behavior and guards remain equivalent. |
| Status/resume | Existing lock-status and resume behavior remains equivalent. |
| Type safety | Migrated verifier modules are checked by repository type-check with no emitted tooling build. |
| Runtime | `pnpm verify*` executes `.ts` entrypoints directly under the repository-supported Node runtime. |
| Measurement | Executed checks and total verifier run expose elapsed durations without changing outcomes. |
| Scope | No product behavior, proof ownership, lane applicability, Playwright project matrix, or CI topology changes. |

## Risk matrix

| Risk | Required control |
| --- | --- |
| Native TS/runtime mismatch | Establish and verify one supported Node runtime floor before replacing command entrypoints. |
| Import-resolution regression | Use one consistent explicit ESM import convention and test direct Node execution. |
| Silent planner drift during typing | Preserve resolver tests and add parity/regression cases before opportunistic cleanup. |
| Type abstractions hide lane ownership | Keep lane-specific contracts local; share only truly identical exchanged shapes. |
| Timing changes timeout/heartbeat semantics | Instrument outside existing timeout/heartbeat ownership and use monotonic elapsed time only for reporting. |
| Large mechanical rename obscures changes | Keep V1 behavior-preserving; do not combine resolver/CI optimization. |

## Required test proof

Changed contracts:

- directly executed verifier TypeScript entrypoints;
- typed verifier plan/result/lock/process contracts;
- unchanged CLI/planning/execution behavior;
- new diagnostic timing output.

Required proof:

- existing verifier unit tests migrated with their owners and kept passing;
- table-driven CLI parsing/validation compatibility where current tests cover it;
- representative planner parity for added/modified/removed/moved and focused/full/invalid cases;
- process/lock/timeout/resume tests preserved;
- focused tests for duration formatting/reporting that do not assert unstable real elapsed values;
- direct verifier-managed type-check proves the new tooling project;
- representative direct command smoke for normal focused verify plus status/resume paths as applicable.

No new browser, visual, product E2E, mutation target, or performance benchmark is required solely by V1.

## Required verification

Use verifier-managed checks. At minimum during implementation:

- focused format/Oxlint/ESLint for changed tooling/config/docs files;
- repository type-check including the new verifier TypeScript project;
- focused unit tests for migrated verifier modules;
- representative `pnpm verify --only <lightweight-label> --files ...` command proving direct `.ts` execution and normal reporting;
- `pnpm verify:status` and `pnpm verify:resume` contract checks through existing tests and/or safe representative command paths when touched.

GitHub CI remains the authoritative exact-head merge gate.

## Forbidden

- Do not change lane selection semantics in Stage V1.
- Do not delete fail-closed fallbacks because they appear expensive.
- Do not weaken tests, retries, flaky handling, lock guards, timeouts, or invalid-plan failures to make migration pass.
- Do not add raw child-command alternatives that bypass `verify`.
- Do not add another persistent dependency graph or generic verification DSL.
- Do not migrate unrelated scripts just to make all of `scripts/` TypeScript.
- Do not claim a performance improvement from TypeScript migration itself; report measured execution separately.

## Implementation readiness

- Required behavior and ownership decisions: resolved.
- Runtime direction: native erasable TypeScript under the repository-supported Node runtime.
- Test/proof boundary: resolved; Stage V1 is behavior-preserving tooling work plus diagnostics.
- Deferred optimizer work: explicitly outside Stage V1.
- Unresolved blockers: none known from current repository evidence.
- Verdict: **ready**.
