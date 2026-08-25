# Verify redesign — Pass E correction task

Branch: `architecture/verify-redesign`

Pass E implementation baseline: `75277c067cca6aba30f2e0698056e4f84f48fb69`

Reviewed implementation HEAD: `82395eebe75484157e30cb92dc8165c368a92496`

Architect review-preparation HEAD: `4afac440f46f916dcf80a0b67c35ce800bd9c2e8`

This is the single consolidated correction pass for the active Pass E findings in `scripts/REVIEW.md`.

Read and follow, in order:

1. root `AGENTS.md` and any applicable nested `AGENTS.md`;
2. `.agents/skills/verification/SKILL.md`;
3. `.agents/skills/unit-testing/SKILL.md`;
4. `.agents/skills/mutation-testing/SKILL.md`;
5. `.agents/skills/implementation-preflight/SKILL.md`;
6. `docs/testing/architecture.md`;
7. `docs/testing/verify-redesign-implementation-preflight.md`;
8. `docs/testing/migration-plan.md`;
9. `docs/testing/verify-redesign-pass-e-implementation.md`;
10. `docs/testing/verify-redesign-pass-e-agent-task.md`;
11. active `scripts/REVIEW.md`;
12. current `scripts/verify.ts`, `scripts/lib/unitRisk.ts`, `scripts/lib/mutationTargets.ts`, `scripts/lib/changedPaths.ts`, `stryker.config.mjs`, `vitest.config.ts`, and focused tests.

Do not edit `docs/**`, `AGENTS.md`, `.agents/skills/**`, or `scripts/REVIEW.md`. Those are architect-owned review/workflow state for this correction.

## Problem and cause

The Pass E architecture is still accepted. The first implementation is blocked by three concrete correctness gaps discovered in full architect review.

### B1 — native Vitest zero-match is accepted as success

The installed Vitest 4.1.10 can emit `No test files found` for native affected execution and still exit with code 0. `scripts/verify.ts` currently treats exit 0 as success unless an existing `[Vue warn]` blocking signal is present.

Therefore a path already classified as unit-relevant can produce no owning unit tests and still make `pnpm verify --only unit` pass.

### B2 — Git unit classification can drop snapshots and TypeScript transform configuration

`scripts/lib/unitRisk.ts` handles deterministic snapshot ownership only for explicit `--files` scopes. In normal status-aware Git scopes, standard `__snapshots__/*.test.ts.snap` changes do not participate in unit relevance, so a snapshot-only diff can become `skip`.

Root TypeScript configuration is also not classified as global unit infrastructure, despite affecting Vitest/Vite source transformation/resolution. Representative current configs include `tsconfig.json`, `tsconfig.app.json`, `tsconfig.src.json`, `tsconfig.scripts.json`, and other root `tsconfig*.json` files used by the repository configuration graph.

### B3 — literal `--full` bypasses mutation registry validation

`scripts/verify.ts` resolves the mutation plan but handles `fullMode` before `mutationPlan.mode === 'invalid'`. A structurally invalid explicit mutation registry can therefore still produce a runnable `pnpm exec stryker run` in literal full mode.

## Expected final state

### B1 — unit zero-match fail-closed result

Keep Vitest as the only unit dependency/affected engine. Do not precompute related tests.

Extend the existing verifier-owned narrow blocking-log result classification so that:

- `unit-tests` fails when a native affected `--changed` run reports `No test files found`, even if Vitest exits 0;
- `unit-related` fails when `vitest related --run` reports `No test files found`, even if Vitest exits 0;
- clean successful unit output still passes;
- existing `[Vue warn]` blocking behavior for both unit leaves remains unchanged.

Use the existing `BLOCKING_LOG_SIGNALS` / `getBlockingLogIssue()` / `resolveCommandStatus()` boundary. This is result interpretation, not a dependency resolver.

Keep matching narrow and deterministic. Do not make generic warning/stderr text fatal. The signal must represent Vitest's actual no-test diagnostic, not arbitrary prose containing those words.

### B2 — complete unit Git-scope classification

Keep ordinary source/test-support Git impact on native `vitest --changed <resolved-base>`.

Add deterministic Git-scope handling for standard external Vitest snapshots:

- added/modified standard snapshot with an existing deterministic owning test must select that owning test and must not disappear;
- deleted snapshot must widen to full unit because the previous owning relation cannot be safely proved from the current tree;
- renamed snapshot must widen to full unit unless the current architecture can deterministically prove the complete old/new ownership without adding another mapping/graph; prefer the safe full fallback;
- malformed/unresolvable standard snapshot relation must widen to full unit, not skip;
- if a Git scope mixes a snapshot-owner direct proof with ordinary source/test-support impact and the current minimal command model cannot truthfully preserve both with existing leaves, widen to full unit rather than add a third unit strategy, wrapper, mapping registry, or dependency graph.

Do not convert normal Git source changes into explicit-file planning. `vitest --changed` remains the default Git affected mechanism.

Classify root `tsconfig*.json` files that can affect repository Vitest/Vite transform/resolution as global unit infrastructure and widen to full unit. Prefer one narrow root-pattern classifier over manually duplicating every current tsconfig filename if that remains explicit and infrastructure-owned; do not create a source-to-test registry.

Deterministically unit-irrelevant docs/workflow paths must still skip unit.

### B3 — mutation validation before every execution mode

The single explicit mutation registry/validator remains the source of truth.

Registry invalidity must produce a failed mutation command plan before Stryker execution in:

- focused/default mode;
- mutation infrastructure-triggered complete-inventory mode;
- literal `--full` mode.

For a valid literal `--full`, preserve the existing contract exactly:

```text
pnpm exec stryker run
```

with no affected `-m` narrowing; `stryker.config.mjs` continues to derive its complete `mutate` inventory from the same TypeScript registry.

Do not duplicate registry validation in `stryker.config.mjs` or create a second registry.

## Architecture and ownership

- `scripts/lib/unitRisk.ts` owns unit path/scope classification only.
- Vitest owns unit dependency/affected relations.
- `scripts/verify.ts` owns command construction and interpretation of child-process results.
- `scripts/lib/mutationTargets.ts` owns mutation registry, structural validation, and mutation target selection.
- `stryker.config.mjs` consumes the validated project-owned registry as the complete mutate source of truth.
- Public verification types remain unchanged.
- `unit-related` remains a private leaf of public type `unit`.
- No Pass F work is allowed.

Do not introduce a new abstraction unless the existing owner cannot express the required correction. The expected implementation should remain local to the existing Pass E modules and focused tests.

## Constraints

- Preserve all accepted Pass A-D behavior and all already-correct Pass E behavior.
- Preserve native `vitest --changed` for ordinary Git unit impact.
- Preserve native `vitest related --run` for explicit source/support paths.
- Preserve direct unit-test execution for direct explicit tests.
- Preserve the current four-target mutation registry exactly unless repository evidence shows one of those exact paths no longer exists because of this correction (production files are not expected to change).
- Preserve Stryker native TypeScript registry loading; no loader/transpilation layer.
- Preserve empty persistent `performance` inventory.
- Preserve top-level verify lock and expensive-command lock ownership.
- Preserve existing status/resume/logging/heartbeat/timeout behavior except for the required no-test blocking result classification.
- Do not modify production feature code or existing product/unit behavior to satisfy tooling.
- Do not start Pass F.

## Acceptance criteria

### B1

- exit 0 + actual Vitest `No test files found` on `unit-tests` => verifier failure;
- exit 0 + actual Vitest `No test files found` on `unit-related` => verifier failure;
- clean exit-0 unit output => pass;
- `[Vue warn]` remains blocking on both unit leaves;
- unrelated labels/output are not made fatal by the new signal;
- one real zero-match `pnpm verify --only unit --files <unit-relevant-source-with-no-related-tests>` returns failed through normal VERIFY RESULT flow.

### B2

- modified standard snapshot in Git scope with existing owner cannot resolve to skip;
- added standard snapshot in Git scope with existing owner cannot resolve to skip;
- removed standard snapshot widens to full unit;
- renamed standard snapshot widens safely;
- malformed/unresolvable standard snapshot widens safely;
- mixed snapshot + ordinary Git unit-relevant source preserves complete proof; use full unit if the existing minimal leaf model cannot represent both faithfully;
- representative root `tsconfig*.json` Git change selects full unit;
- ordinary Git source/test-support change still uses native `--changed` with the already-resolved diff base;
- irrelevant docs-only Git scope still skips unit;
- no new unit dependency graph/import parser/mapping registry exists.

### B3

- invalid mutation registry plan in literal full mode creates a failed mutation entry and no runnable Stryker mutation child;
- invalid mutation registry still fails focused/default mode;
- valid literal full mode remains exactly `pnpm exec stryker run` with no `-m`;
- valid focused/infrastructure mutation selection remains unchanged;
- real Stryker config load still proves mutate inventory is exactly the four registered sources.

## Verification

Use focused implementation feedback only.

Required deterministic proof:

1. Focused unit tests for `scripts/lib/unitRisk.ts` covering all new snapshot/tsconfig Git cases and preserving ordinary `--changed`/irrelevant behavior.
2. Focused `scripts/verify.ts` tests covering no-test blocking on both unit labels, clean output, existing Vue warnings, and full-mode invalid mutation planning.
3. One real zero-match verifier invocation through the public unit path that must now fail via normal VERIFY RESULT classification. Use a currently existing unit-relevant source known to produce no matching tests; `src/app/router.ts` was already demonstrated by the first implementation review and is acceptable if it still reproduces the condition.
4. One real positive native related/changed unit proof to ensure normal Vitest affected selection still passes.
5. Focused mutation/config proof sufficient to ensure the valid registry and Stryker TypeScript config load remain green. Do not rerun mutation audits merely for broad handoff if no mutation execution code beyond plan ordering changed; run the smallest real Stryker/config proof needed to protect B3.
6. Focused static/type-check verification for touched tooling.

Do not run `pnpm verify`, `pnpm verify --full`, or `pnpm verify:release` merely as a completion gate. Exact-head GitHub CI remains architect-owned.

## Forbidden

- changing public verification types;
- starting Pass F;
- adding a unit dependency graph, import parser, source-prefix mapping, or dependency-cruiser unit use;
- adding a wrapper runner just to detect no tests;
- precomputing Vitest's related/changed result;
- enabling `passWithNoTests` or accepting zero-match as success;
- broad generic output parsing or treating arbitrary stderr/warnings as fatal;
- adding a new generic unit strategy/framework when full fallback is sufficient;
- preserving mutation adjacency as fallback;
- adding a second mutation registry or duplicating registry validation in Stryker config;
- changing the four accepted mutation targets for unrelated reasons;
- inventing performance infrastructure;
- changing Playwright/container/E2E/browser-integration ownership;
- weakening or redesigning locks, timeouts, logging, status/resume behavior;
- editing architect-owned docs, skills, `AGENTS.md`, or `scripts/REVIEW.md`.

## Report

Return exactly:

```text
TASK RESULT
status: complete | partial | blocked
remaining: none | <remaining implementation/proof/blocker>

LOCAL FEEDBACK
commands: none | <focused verifier-managed/risk-specific commands actually used>
status: not run | passed | failed | partial
reason if failed/partial: <exact reason>

CI GATE
status: architect-owned
```

After the correction returns, architect review must cover the complete Pass E result from `75277c067cca6aba30f2e0698056e4f84f48fb69` through the new implementation HEAD, not only this correction patch.