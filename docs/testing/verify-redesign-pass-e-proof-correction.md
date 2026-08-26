# Verify redesign — Pass E proof correction task

Branch: `architecture/verify-redesign`

Pass E baseline: `75277c067cca6aba30f2e0698056e4f84f48fb69`

Latest reviewed implementation HEAD: `b633937801e78f45bf8fa6d577530dc1c26f025a`

Architect review-state HEAD before this task: `4e91128545391974da36c6dc254815cbbcf1ed84`

This is the second and final local correction opportunity for Pass E. Correct only the active `config/REVIEW.md` blocker. Do not start Pass F and do not reopen the resolved unit/mutation findings without new repository evidence.

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
11. `docs/testing/verify-redesign-pass-e-correction.md` for the closed first correction;
12. active `config/REVIEW.md`;
13. current `config/strykerConfig.test.ts`, `stryker.config.mjs`, `scripts/lib/mutationTargets.ts`, `scripts/lib/mutationTargets.test.ts`, `tsconfig.node.json`, `tsconfig.storybook.json`, `tsconfig.scripts.json`, `vitest.config.ts`, and `scripts/typeCheck.mjs`.

Do not edit `docs/**`, `AGENTS.md`, `.agents/skills/**`, or `config/REVIEW.md`. These are architect-owned review/workflow state.

## Problem and cause

Pass E added `config/strykerConfig.test.ts` as a durable unit test for the Stryker config/registry relationship.

That test has the wrong TypeScript ownership boundary:

- `config/**/*.ts` is compiled by repository config projects including `tsconfig.node.json` and `tsconfig.storybook.json`;
- the test imports root `stryker.config.mjs` and `scripts/lib/mutationTargets.ts`;
- `scripts/lib/mutationTargets.ts` belongs to `tsconfig.scripts.json`;
- repository type-check is `vue-tsc --build`, so these project boundaries are enforced.

The resulting type-check failure was introduced by Pass E itself. It is not an unrelated pre-existing failure relative to the Pass E baseline.

The test is also redundant with the actual proof ownership:

- `scripts/lib/mutationTargets.test.ts` already durably proves the exact four-target registry, its filesystem validity, structural validation, and focused/full selection semantics;
- `stryker.config.mjs` directly derives `mutate` from `MUTATION_TARGETS`;
- the Pass E contract explicitly requires a real Stryker config-load proof for the native TypeScript-registry integration.

A second unit test that crosses TypeScript projects solely to restate that direct config expression is unnecessary.

## Architecture decision and expected final state

Delete `config/strykerConfig.test.ts` and do not replace or move it.

This is the minimum complete correction.

After deletion:

- `scripts/lib/mutationTargets.ts` remains the single mutation ownership source of truth;
- `scripts/lib/mutationTargets.test.ts` remains the durable deterministic proof for registry contents/validation/planning;
- `stryker.config.mjs` continues to import the TypeScript registry directly and derive its complete `mutate` list from it;
- the real Stryker execution/config-load proof remains the integration proof that Node/Stryker can load the `.ts` registry and that the complete inventory is usable;
- repository TypeScript project boundaries remain unchanged;
- repository type-check must return green.

Do not create a replacement config unit test merely to preserve file count or duplicate the real Stryker proof.

If deleting the redundant test unexpectedly exposes a concrete missing durable contract that is not already covered by `mutationTargets.test.ts` plus the real Stryker load proof, stop and report the exact gap instead of adding cross-project plumbing or another abstraction.

## Ownership

- `scripts/lib/mutationTargets.ts` owns mutation registry/validation/planning.
- `scripts/lib/mutationTargets.test.ts` owns deterministic registry contract proof.
- `stryker.config.mjs` owns Stryker configuration and consumes the registry.
- real Stryker execution owns the native config-load/integration proof.
- `tsconfig.node.json`, `tsconfig.storybook.json`, and `tsconfig.scripts.json` keep their current project ownership; this correction must not widen them solely to host a redundant test.

## Constraints

- Delete `config/strykerConfig.test.ts`.
- Do not add a replacement test under another directory.
- Do not modify `tsconfig.node.json`, `tsconfig.storybook.json`, `tsconfig.scripts.json`, or root TypeScript project references for this correction.
- Do not duplicate `MUTATION_TARGETS` or its source list in a new proof file.
- Do not modify the four accepted mutation targets.
- Do not change `stryker.config.mjs` unless deletion itself reveals a concrete config defect; if so, report that before introducing a broader solution.
- Do not add `.d.ts` shims for `stryker.config.mjs` solely to satisfy the deleted test.
- Do not add `allowJs`, cross-project includes, project references, loader/transpilation infrastructure, or path aliases for this proof.
- Preserve the corrected Pass E unit zero-match behavior, Git snapshot/root-tsconfig handling, and full-mode mutation validation.
- Preserve all accepted Pass A-D behavior and public verification types.
- Do not modify production feature code.
- Do not start Pass F.

## Acceptance criteria

- `config/strykerConfig.test.ts` no longer exists.
- No replacement cross-project config proof test is added.
- The exact four mutation targets remain unchanged and their registry unit tests remain green.
- `stryker.config.mjs` still derives `mutate` directly from the TypeScript registry with no copied source list, adjacency scan, or loader.
- One real Stryker/config-load proof succeeds using the current registry/config boundary.
- Focused repository static verification reaches and passes `type-check`; the Pass E-introduced project-file-list / missing-declaration errors are gone.
- No TypeScript project boundary was broadened solely for this proof.
- No Pass F files/workflows/aliases are changed.

## Verification

Use only the smallest faithful feedback for this proof correction:

1. Run focused unit verification for `scripts/lib/mutationTargets.test.ts` / `scripts/lib/mutationTargets.ts` to confirm the durable registry contract remains green.
2. Run one real verifier-managed Stryker/config-load proof. Prefer the already-established canonical path `pnpm verify --only mutation --files stryker.config.mjs`; if the current verifier provides a strictly smaller existing real config-load path, use it, but do not create a new wrapper or bypass the verifier merely to shorten the run.
3. Run focused static verification that necessarily executes repository type-check, for example with `scripts/lib/mutationTargets.ts` and `stryker.config.mjs` in the explicit scope. The result must show type-check green.
4. Do not run `pnpm verify`, `pnpm verify --full`, or `pnpm verify:release` merely as a completion gate.

Exact-head GitHub CI remains architect-owned.

## Forbidden

- keeping or moving `config/strykerConfig.test.ts`;
- adding a replacement unit test that imports across the same TypeScript project boundaries;
- widening `tsconfig` includes/references or adding declaration shims solely for this proof;
- duplicating the mutation registry or four-source list;
- adding loader/transpilation infrastructure;
- modifying mutation ownership semantics;
- reopening resolved Pass E B1/B2/B3 without new evidence;
- changing public verification types;
- starting Pass F;
- editing architect-owned docs, skills, `AGENTS.md`, or `config/REVIEW.md`.

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

After the correction returns, architect review must again cover the complete Pass E result from `75277c067cca6aba30f2e0698056e4f84f48fb69` through the new implementation HEAD, not only this deletion patch.