# Verify redesign — current architect handoff

## Current state

Branch: `architecture/verify-redesign`

Pass status:

- Pass A — completed and architect-accepted;
- Pass B — completed and architect-accepted;
- Pass C — completed and architect-accepted;
- Pass D — completed and architect-accepted at `c0aa686235d291089d413b77c4b5fe176acc07b3`;
- Pass E — implementation plus first correction landed; full architect re-review through correction HEAD `b633937801e78f45bf8fa6d577530dc1c26f025a` resolved the previous three script findings and left one final proof-ownership blocker in `config/REVIEW.md`;
- Pass F — must not start until Pass E is architect-accepted.

The first Pass E correction closed:

1. native Vitest zero-match success classification;
2. Git-scope snapshot/root-tsconfig unit classification holes;
3. literal `--full` mutation-registry validation bypass.

Do not reopen those findings without new repository evidence.

The remaining Pass E correction is fully resolved architecturally and is prepared in:

`docs/testing/verify-redesign-pass-e-proof-correction.md`

Exact-head GitHub CI remains an architect-owned gate separate from semantic pass acceptance. No exact-head pull-request workflow run was available for `b633937801e78f45bf8fa6d577530dc1c26f025a` at re-review time.

## Read order

Before the remaining Pass E correction/re-review, read in this order:

1. root `AGENTS.md`;
2. `.agents/skills/verification/SKILL.md`;
3. `.agents/skills/unit-testing/SKILL.md`;
4. `.agents/skills/mutation-testing/SKILL.md`;
5. `.agents/skills/implementation-preflight/SKILL.md` when implementing non-trivial tooling changes;
6. `.agents/skills/project-review/SKILL.md` when reviewing;
7. `docs/testing/architecture.md`;
8. `docs/testing/verify-redesign-implementation-preflight.md`;
9. `docs/testing/migration-plan.md`;
10. `docs/testing/verify-redesign-pass-e-implementation.md`;
11. `docs/testing/verify-redesign-pass-e-agent-task.md` for the original Pass E implementation boundary;
12. `docs/testing/verify-redesign-pass-e-correction.md` for the closed first correction boundary;
13. active `config/REVIEW.md`;
14. `docs/testing/verify-redesign-pass-e-proof-correction.md` for the current final correction;
15. current `config/strykerConfig.test.ts`, `stryker.config.mjs`, `scripts/lib/mutationTargets.ts`, `scripts/lib/mutationTargets.test.ts`, `vitest.config.ts`, `tsconfig.node.json`, `tsconfig.storybook.json`, `tsconfig.scripts.json`, and `scripts/typeCheck.mjs`.

Pass D implementation/correction records are historical accepted source for invariants and should be consulted only when Pass E touches an adjacent boundary.

## Active Pass E review

The complete Pass E result was re-reviewed from baseline:

`75277c067cca6aba30f2e0698056e4f84f48fb69`

through correction HEAD:

`b633937801e78f45bf8fa6d577530dc1c26f025a`

The previous `scripts/REVIEW.md` findings are resolved and that review document has been removed.

The durable active review source is:

`config/REVIEW.md`

The remaining blocker is narrow:

- Pass E added `config/strykerConfig.test.ts`, but that test crosses the repository TypeScript project boundaries by importing root `stryker.config.mjs` and `scripts/lib/mutationTargets.ts` from a `config/**/*.ts` test compiled by config-owned projects. Repository `vue-tsc --build` therefore fails on project-file-list/declaration ownership.

The architecture decision is now explicit:

- delete `config/strykerConfig.test.ts` without replacement;
- keep `scripts/lib/mutationTargets.test.ts` as the durable deterministic mutation-registry proof;
- keep real verifier-managed Stryker config loading as the integration proof that `stryker.config.mjs` consumes the TypeScript registry correctly;
- do not widen any TypeScript project, add declaration shims/loaders, move the redundant test, or create another proof abstraction.

This is the second and final local correction opportunity for Pass E. If the next re-review still exposes ownership drift, mixed responsibility, or workaround growth, stop correction loops and revisit Pass E architecture.

## Pass E architecture summary

### Unit

- Vitest remains the only unit dependency/affected engine.
- Normal git scopes use native `vitest --changed <existing resolved diff base>` for ordinary source/test-support impact.
- Explicit source/support files use native `vitest related --run`.
- Direct unit tests run directly.
- Explicit mixed direct-test + source scopes may use two private unit leaves instead of widening to full or adding a wrapper.
- Deterministic snapshot ownership is preserved in default Git scope; removed/renamed/unresolvable snapshot relations widen safely.
- Relevant root TypeScript transform configuration is global unit impact.
- Zero related/affected tests is visible fail-closed evidence through the existing narrow verifier result-classification boundary.
- Do not add dependency-cruiser or another unit graph.

### Mutation

- One explicit `MutationTarget` registry is the only durable mutation ownership source.
- The accepted registry contains exactly the four confirmed deterministic high-risk owners in `verify-redesign-pass-e-implementation.md`.
- Focused/default mutation selects only exact registered source/test relations; mutation infrastructure changes select all registered targets.
- `stryker.config.mjs` derives its complete mutate inventory from the same TypeScript registry.
- Structural registry invalidity fails before Stryker in focused/default and literal full mode.
- `--full` executes every registered target with no affected narrowing only after registry validity is established.
- `scripts/lib/mutationTargets.test.ts` owns durable deterministic registry proof; real Stryker execution owns native config-load integration proof.
- No separate `config/strykerConfig.test.ts` proof is required or desired.

### Performance

- There is currently no durable `*.performance.spec.ts` budget owner.
- Keep the public `performance` type valid but empty.
- Do not invent a runner/registry/threshold in Pass E.

## Frozen earlier-pass boundaries

Do not reopen without new repository evidence:

- canonical eight public verification types;
- literal `--full` semantics;
- owner-local behavior/visual/browser-integration taxonomy;
- structural E2E owner model;
- filesystem/Playwright E2E inventory equality;
- dependency-cruiser as the only E2E production graph;
- container-only Playwright execution;
- current Playwright project applicability and production-artifact routing;
- top-level verify and expensive-command lock ownership;
- current status/resume/logging/timeout behavior;
- corrected Pass E unit zero-match, snapshot/tsconfig classification, and mutation-validation behavior.

## Next workflow

1. Coding agent implements only `docs/testing/verify-redesign-pass-e-proof-correction.md`; Pass F remains closed.
2. The expected implementation is deletion of the redundant `config/strykerConfig.test.ts` only, unless that deletion exposes a concrete pre-existing config defect that must be reported rather than worked around.
3. Architect re-reviews the complete Pass E result from `75277c067cca6aba30f2e0698056e4f84f48fb69` through the new implementation HEAD, not only the deletion patch.
4. Remove `config/REVIEW.md` only when the active finding is resolved and no new blocker/major issue appears.
5. If clean, mark Pass E architect-accepted and then resolve/execute Pass F.
6. Do not give final merge approval until exact-head GitHub CI exists and is green on the final resulting PR head.
