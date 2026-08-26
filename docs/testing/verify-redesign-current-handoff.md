# Verify redesign — current architect handoff

## Current state

Branch: `architecture/verify-redesign`

Pass status:

- Pass A — completed and architect-accepted;
- Pass B — completed and architect-accepted;
- Pass C — completed and architect-accepted;
- Pass D — completed and architect-accepted at `c0aa686235d291089d413b77c4b5fe176acc07b3`;
- Pass E — implementation plus first correction landed; the final proof-ownership correction was applied directly outside the read-only coding sandbox at `a2b9a1ebdfcbce5c40cd158f553d0876cbce2a71`; semantic acceptance is pending the required focused proof and full architect re-review;
- Pass F — must not start until Pass E is architect-accepted.

The first Pass E correction closed:

1. native Vitest zero-match success classification;
2. Git-scope snapshot/root-tsconfig unit classification holes;
3. literal `--full` mutation-registry validation bypass.

Do not reopen those findings without new repository evidence.

The final Pass E correction architecture is recorded in:

`docs/testing/verify-redesign-pass-e-proof-correction.md`

The coding sandbox exposed `config/` as read-only, so the architect applied the already-resolved deletion of `config/strykerConfig.test.ts` through GitHub rather than introducing a mount workaround. The commit contains only that deletion.

Exact-head GitHub CI remains an architect-owned gate separate from semantic pass acceptance.

## Read order

Before the remaining Pass E proof/re-review, read in this order:

1. root `AGENTS.md`;
2. `.agents/skills/verification/SKILL.md`;
3. `.agents/skills/unit-testing/SKILL.md`;
4. `.agents/skills/mutation-testing/SKILL.md`;
5. `.agents/skills/project-review/SKILL.md` when reviewing;
6. `docs/testing/architecture.md`;
7. `docs/testing/verify-redesign-implementation-preflight.md`;
8. `docs/testing/migration-plan.md`;
9. `docs/testing/verify-redesign-pass-e-implementation.md`;
10. `docs/testing/verify-redesign-pass-e-agent-task.md` for the original Pass E implementation boundary;
11. `docs/testing/verify-redesign-pass-e-correction.md` for the closed first correction boundary;
12. active `config/REVIEW.md`;
13. `docs/testing/verify-redesign-pass-e-proof-correction.md` for the final proof-ownership correction;
14. current `stryker.config.mjs`, `scripts/lib/mutationTargets.ts`, `scripts/lib/mutationTargets.test.ts`, `vitest.config.ts`, `tsconfig.node.json`, `tsconfig.storybook.json`, `tsconfig.scripts.json`, and `scripts/typeCheck.mjs`.

Pass D implementation/correction records are historical accepted source for invariants and should be consulted only when Pass E touches an adjacent boundary.

## Active Pass E review

The complete Pass E result was previously re-reviewed from baseline:

`75277c067cca6aba30f2e0698056e4f84f48fb69`

through first-correction HEAD:

`b633937801e78f45bf8fa6d577530dc1c26f025a`

The previous `scripts/REVIEW.md` findings are resolved and that review document has been removed.

The durable active review source remains:

`config/REVIEW.md`

Its required implementation is now present at:

`a2b9a1ebdfcbce5c40cd158f553d0876cbce2a71`

The commit deletes only the redundant `config/strykerConfig.test.ts` proof. No TypeScript project, registry, Stryker config, production code, or verifier implementation was changed.

The remaining work is proof, not implementation:

- `scripts/lib/mutationTargets.test.ts` must remain green as the durable deterministic mutation-registry proof;
- one real verifier-managed Stryker/config-load execution must prove that `stryker.config.mjs` still consumes the TypeScript registry and runs the exact four-source inventory;
- focused static verification must show repository type-check green with the previous project-file-list/declaration failure gone.

If a fresh sandbox still presents the deleted file because its read-only mount is stale, do not work around the mount. Recreate/resync the environment from the current branch HEAD so the mounted tree reflects the committed deletion.

This is the second and final local correction opportunity for Pass E. If the next full re-review exposes ownership drift, mixed responsibility, or workaround growth, stop correction loops and revisit Pass E architecture.

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
- No separate `config/strykerConfig.test.ts` proof exists or is required.

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

1. Start/resync the coding environment from the current branch HEAD; do not attempt to rewrite the read-only `config/` mount.
2. Run only the remaining focused proof required by `docs/testing/verify-redesign-pass-e-proof-correction.md`; no further code change is expected.
3. Architect re-reviews the complete Pass E result from `75277c067cca6aba30f2e0698056e4f84f48fb69` through the final implementation HEAD, not only the deletion commit.
4. Remove `config/REVIEW.md` only when the active finding is proven resolved and no new blocker/major issue appears.
5. If clean, mark Pass E architect-accepted and then resolve/execute Pass F.
6. Do not give final merge approval until exact-head GitHub CI exists and is green on the final resulting PR head.
