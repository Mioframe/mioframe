# Verify redesign — current architect handoff

## Current state

Branch: `architecture/verify-redesign`

Pass status:

- Pass A — completed and architect-accepted;
- Pass B — completed and architect-accepted;
- Pass C — completed and architect-accepted;
- Pass D — completed and architect-accepted at `c0aa686235d291089d413b77c4b5fe176acc07b3`;
- Pass E — implementation plus first correction landed; full architect re-review through correction HEAD `b633937801e78f45bf8fa6d577530dc1c26f025a` resolved the previous three script findings but found one remaining blocker owned by `config/strykerConfig.test.ts` in `config/REVIEW.md`;
- Pass F — must not start until Pass E is architect-accepted.

The previous Pass D B1 completeness blocker and M1 stale-comment issue remain closed and must not be reopened without new repository evidence.

The first Pass E correction closed:

1. native Vitest zero-match success classification;
2. Git-scope snapshot/root-tsconfig unit classification holes;
3. literal `--full` mutation-registry validation bypass.

Do not reopen those findings without new repository evidence.

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
14. current `config/strykerConfig.test.ts`, `stryker.config.mjs`, `scripts/lib/mutationTargets.ts`, `scripts/lib/mutationTargets.test.ts`, `vitest.config.ts`, `tsconfig.node.json`, `tsconfig.storybook.json`, `tsconfig.scripts.json`, and `scripts/typeCheck.mjs`.

Pass D implementation/correction records are historical accepted source for invariants and should be consulted only when Pass E touches an adjacent boundary.

## Active Pass E review

The complete Pass E result was re-reviewed from baseline:

`75277c067cca6aba30f2e0698056e4f84f48fb69`

through correction HEAD:

`b633937801e78f45bf8fa6d577530dc1c26f025a`

The previous `scripts/REVIEW.md` findings are resolved and that review document has been removed.

The durable active review source is now:

`config/REVIEW.md`

The remaining blocker is narrow:

- Pass E added `config/strykerConfig.test.ts`, but that test imports the root `.mjs` Stryker config and `scripts/lib/mutationTargets.ts` from TypeScript projects that own `config/**/*.ts` but not the scripts registry. The required repository `vue-tsc --build` therefore fails on missing declaration/project-file-list boundaries. Because the test was added by Pass E, this is not an unrelated pre-existing failure relative to the Pass E baseline.

This is a proof-ownership/type-check correction, not an architecture redesign. Keep the explicit four-target mutation registry and the real Stryker native-TypeScript config-load contract. Do not broaden unrelated Node/Storybook TypeScript projects merely to accommodate a misplaced proof, duplicate the registry, add a loader, or start Pass F.

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
- `stryker.config.mjs` derives its complete mutate inventory from the same registry.
- Structural registry invalidity fails before Stryker in focused/default and literal full mode.
- `--full` executes every registered target with no affected narrowing only after registry validity is established.
- Remaining work is only to make the durable config proof respect repository TypeScript/test ownership.

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

1. Correct only the active `config/REVIEW.md` blocker; Pass F remains closed.
2. The correction should preserve the existing single mutation registry and real Stryker config-load semantics while restoring a green repository type-check without unnecessary cross-project plumbing.
3. Architect re-reviews the complete Pass E result from `75277c067cca6aba30f2e0698056e4f84f48fb69` through the new implementation HEAD, not only the next patch.
4. Remove `config/REVIEW.md` only when the active finding is resolved and no new blocker/major issue appears.
5. This is the second correction opportunity for Pass E. If the next re-review still exposes ownership drift, mixed responsibility, or workaround growth, stop local patching and revisit Pass E architecture rather than continuing correction loops.
6. If clean, mark Pass E architect-accepted and then resolve/execute Pass F.
7. Do not give final merge approval until exact-head GitHub CI exists and is green on the final resulting PR head.
