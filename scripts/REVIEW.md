# Review

Verdict: blocked

## Scope reviewed

- Complete Pass E implementation from `75277c067cca6aba30f2e0698056e4f84f48fb69` through `82395eebe75484157e30cb92dc8165c368a92496`.
- Unit affected planning, changed-path context plumbing, native Vitest command construction/result handling, explicit mutation ownership/validation/Stryker integration, and empty performance semantics.
- Relevant Pass E architecture/acceptance contract and surrounding verifier execution behavior.

## Blockers

### B1 — Native Vitest zero-match still passes verification

Owner: `scripts/verify.ts`

Problem: The required real Pass E proof established that the installed Vitest 4.1.10 `related --run`/affected path can print `No test files found` and exit with code 0. `resolveCommandStatus()` currently treats an exit-0 unit command as passed unless the log contains `[Vue warn]`, so a unit-relevant source with no resolved owning tests is still accepted as successful proof.

Evidence:

- [verify.ts](verify.ts) — `BLOCKING_LOG_SIGNALS` contains only `[Vue warn]` for `unit-tests` / `unit-related`, and `resolveCommandStatus()` otherwise accepts exit code 0.
- [Pass E implementation contract](../docs/testing/verify-redesign-pass-e-implementation.md) — a zero-match related run must be visible failure, never successful irrelevance.
- [Vitest issue #1113](https://github.com/vitest-dev/vitest/issues/1113) — Vitest has an established affected-run behavior where `No test files found` may exit with code 0; the required exact-version local proof for this Pass E reproduced the same observable result.

Basis:

- [Testing architecture](../docs/testing/architecture.md) — a focused related run with no matching tests must be reported as such and is not evidence that no unit proof is needed.
- [Pass E implementation contract](../docs/testing/verify-redesign-pass-e-implementation.md) — zero related tests must remain a failing command result.

Risk: Default/focused verification can report `unit` passed when Vitest selected no test at all for a path the planner classified as unit-relevant.

Required final state: Native Vitest remains the unit dependency engine, but the verifier must fail closed when either native affected leaf (`unit-tests` using `--changed`, or `unit-related`) reports `No test files found` despite exit code 0. Reuse the existing narrow blocking-log classification mechanism; do not add a wrapper runner, dependency graph, generic output parser, or `passWithNoTests` success path. Existing `[Vue warn]` blocking behavior must remain intact.

Verification: Focused tests must prove both unit labels fail on an exit-0 `No test files found` log while clean successful unit output still passes and `[Vue warn]` still fails. One real zero-match focused unit invocation must demonstrate the verifier returns failure rather than success.

### B2 — Default Git unit classification can silently skip snapshots and global TS transform configuration

Owner: `scripts/lib/unitRisk.ts`

Problem: `resolveGitDiffUnitPlan()` considers only `isUnitSourceOrSupportPath()` plus the hard-coded global list. Standard Vitest `__snapshots__/*.test.ts.snap` paths are not unit source/support, so an added/modified snapshot-only Git diff resolves to `skip`. Root `tsconfig*.json` files are also neither source/support nor registered global infra, despite Vite/Vitest transformation being affected by matching TypeScript configuration.

Evidence:

- [unitRisk.ts](lib/unitRisk.ts) — Git-diff relevance is derived from `isUnitSourceOrSupportPath()`; snapshot ownership is implemented only in the explicit-files path, and `UNIT_GLOBAL_INFRA_PATHS` omits root TypeScript configs.
- [unitRisk.test.ts](lib/unitRisk.test.ts) — snapshot ownership is proved only for explicit-files; there is no Git-diff snapshot or TypeScript-config case.
- [tsconfig.json](../tsconfig.json), [tsconfig.app.json](../tsconfig.app.json), [tsconfig.src.json](../tsconfig.src.json), and [tsconfig.scripts.json](../tsconfig.scripts.json) — current repository-wide/matching TypeScript configuration used by source and tooling files.
- [Vite TypeScript compiler options](https://vite.dev/guide/features.html#typescript-compiler-options) — Vite uses the closest/matching `tsconfig.json` (including referenced configs) for TypeScript transformation options.

Basis:

- [Testing architecture](../docs/testing/architecture.md) — unit affected selection includes deterministic snapshot/test ownership and full-unit fallback for unit runner/global setup/configuration impact that cannot be represented safely.
- [Pass E implementation contract](../docs/testing/verify-redesign-pass-e-implementation.md) — standard external snapshot ownership must resolve deterministically; known global unit infrastructure must widen to full unit.

Risk: A normal default Git-scoped `pnpm verify` can skip the unit type entirely for a changed snapshot or a TypeScript transform/configuration change that can affect unit execution.

Required final state: Git-diff snapshot changes must never disappear. Added/modified standard snapshots with an existing deterministic owning test should run that owner; removed/renamed/unresolvable snapshot relations must widen safely. If a snapshot change is mixed with another Git unit-relevant change and both cannot be represented faithfully with the existing minimal leaf model, widen to full unit rather than add a new generic planner layer. Root `tsconfig*.json` configuration that can affect Vitest/Vite transformation must be classified as global unit impact and widen to full unit. Preserve Vitest-native `--changed` for ordinary Git source/test-support impact.

Verification: Planner tests must cover modified/added standard snapshot ownership, removed/renamed snapshot fallback, a mixed snapshot + ordinary source Git scope, and representative root `tsconfig*.json` changes selecting full unit; deterministically irrelevant docs must still skip.

### B3 — `--full` bypasses mutation registry structural validation

Owner: `scripts/verify.ts`

Problem: `buildCommands()` resolves `mutationPlan`, but the mutation branch checks `fullMode` before `mutationPlan.mode === 'invalid'`. Therefore literal `--full` always emits `pnpm exec stryker run` even when the explicit registry validator has reported structural invalidity. Some invalidities (for example an empty risk reason) are not inherently guaranteed to make Stryker fail, so the required registry contract can be bypassed.

Evidence:

- [verify.ts](verify.ts) — mutation command construction handles `fullMode` before the invalid-plan branch.
- [mutationTargets.ts](lib/mutationTargets.ts) — registry validation explicitly rejects missing source/test, duplicates, zero tests, empty reason, and malformed entries.
- [verify.test.ts](verify.test.ts) — invalid mutation-plan coverage exists only for focused mode; full-mode tests assert the unconditional Stryker command but do not prove invalid registry rejection.

Basis:

- [Testing architecture](../docs/testing/architecture.md) — mutation ownership is the explicit registered inventory and literal `--full` runs every registered target.
- [Pass E implementation contract](../docs/testing/verify-redesign-pass-e-implementation.md) — structural mutation registry invalidity must fail before Stryker execution; it is not a fallback state.

Risk: Release-grade `pnpm verify --full` can execute against structurally invalid mutation ownership and potentially report success without enforcing the registry invariant.

Required final state: Registry invalidity must produce a failed mutation plan before any Stryker child execution in focused/default and literal full mode. Valid full mode must still execute the complete registry-derived Stryker inventory with no affected `-m` narrowing. Reuse the single existing validator; do not duplicate validation logic or create a second registry.

Verification: Planner tests must prove an injected/invalid registry plan fails in full mode without a runnable mutation child, while a valid full plan remains `pnpm exec stryker run` with no `-m`; keep the real Stryker config/full-registry load proof green.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
