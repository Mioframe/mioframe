# Verify redesign — current architect handoff

## Current state

Branch: `architecture/verify-redesign`

PR: #218 — `refactor(testing): redesign verification ownership` (draft, base `develop`).

Pass status:

- **Pass A:** completed and architect-accepted;
- **Pass B:** completed and architect-accepted;
- **Pass C:** completed and architect-accepted;
- **Pass D:** completed and architect-accepted at `c0aa686235d291089d413b77c4b5fe176acc07b3`;
- **Pass E:** completed and architect-accepted on exact reviewed implementation head `60a097a077cb834e4cab28f5a2a8fad616ff77fd`;
- **Pass F:** ready and is the only remaining redesign pass.

Pass E was reviewed as the complete result from baseline `75277c067cca6aba30f2e0698056e4f84f48fb69` through exact PR head `60a097a077cb834e4cab28f5a2a8fad616ff77fd`, not only the final correction patch.

Final Pass E review result:

- blockers: 0;
- major issues: 0;
- minor issues: 0;
- accepted risks: 0.

The former `config/REVIEW.md` finding is resolved and the review file has been removed. The correction deleted the redundant `config/strykerConfig.test.ts` without replacement; no TypeScript project boundary was widened.

Exact-head GitHub Actions run `32957373587` for `60a097a077cb834e4cab28f5a2a8fad616ff77fd` completed successfully. Its `verification-static` job passed `static`, `unit`, and real `mutation` verifier steps; E2E, behavior, visual, aggregate verification, release-version, final verify, and preview deployment also passed.

Architect-only acceptance/documentation commits after that implementation head will naturally produce a newer PR head and another CI run. They do not reopen Pass E semantics unless they change implementation or expose new evidence.

## Accepted Pass E state

### Unit

- Vitest is the only unit affected/dependency engine.
- Normal Git source/test-support impact uses native `vitest --changed` with the already-resolved diff base.
- Explicit source/test-support impact uses native `vitest related --run`.
- Direct tests run directly; mixed explicit direct + related input may use private `unit-tests` and `unit-related` leaves, both owned by public `unit`.
- Deterministic standard snapshot ownership is supported; removed, renamed, unresolved, and global-impact cases widen safely to full unit.
- Relevant root `tsconfig*.json` is global unit impact.
- Native zero-test output is fail-closed through the narrow verifier result-classification boundary; `[Vue warn]` remains blocking for both unit leaves.
- No unit dependency graph, import parser, dependency-cruiser use, or `passWithNoTests` workaround exists.

### Mutation

- `scripts/lib/mutationTargets.ts` is the single durable mutation ownership source.
- The registry contains exactly the four accepted deterministic high-risk targets from `verify-redesign-pass-e-implementation.md`.
- Focused/default selection uses only exact registered source/test relations; mutation infrastructure changes select the full registered inventory.
- Registry invalidity fails before Stryker in focused/default and literal full mode.
- `stryker.config.mjs` imports the TypeScript registry directly and derives its complete `mutate` inventory from it.
- Literal `--full` uses bare Stryker only after registry validation; focused execution narrows only to selected registered sources.
- `scripts/lib/mutationTargets.test.ts` owns deterministic registry/selection proof; real Stryker execution owns native config-load integration proof.
- No adjacency fallback, duplicate registry, loader/transpilation layer, declaration shim, or extra config unit test exists.

### Performance

- `performance` remains one of the eight valid public verification types.
- The persistent performance inventory is intentionally empty because no durable measurable budget currently exists.
- No placeholder runner, registry, or threshold was introduced.

## Frozen accepted boundaries

Do not reopen without new repository evidence:

- exactly eight public verification types: `static`, `unit`, `behavior`, `visual`, `browser-integration`, `performance`, `mutation`, `e2e`;
- literal `--full` semantics and invalid `--full --only` / `--full --files` combinations;
- owner-local behavior/visual/browser-integration taxonomy;
- structural page/widget E2E ownership and filesystem/Playwright inventory equality;
- dependency-cruiser as the only E2E production reachability graph;
- container-only Playwright execution and current project applicability;
- production-artifact routing and existing release/fresh-container semantics;
- top-level verify and expensive-command lock ownership;
- existing status/resume/logging/timeout behavior;
- Pass E unit changed/related, zero-match, snapshot/global fallback, mutation registry/validation, and empty performance semantics.

## Pass F boundary

Pass F is CI/public-compatibility cleanup only. The architecture is already resolved by `docs/testing/verify-redesign-implementation-preflight.md` and `docs/testing/migration-plan.md`.

Required final state:

- repository workflows invoke public verification types rather than removed/private compatibility labels;
- `develop -> main` release verification uses canonical literal `pnpm verify --full`;
- remove `pnpm verify:release` only after repository consumer search proves it has no remaining required consumer;
- remove stale compatibility docs/comments that describe already-migrated mechanisms as current;
- retain internal release-named runners/files where they still own real built-artifact, service-worker, fresh-container, or cross-engine execution constraints;
- do not rename internals for aesthetics and do not change product/test behavior.

Pass F proof must include repository consumer search for removed compatibility surfaces, workflow/public-command inspection, verifier CLI contract proof, and exact-head GitHub CI after publication.

## Read order for Pass F

1. root `AGENTS.md`;
2. `.agents/skills/verification/SKILL.md`;
3. `.agents/skills/implementation-preflight/SKILL.md` when implementation edits are non-trivial;
4. `.agents/skills/project-review/SKILL.md` when reviewing;
5. `docs/testing/architecture.md`;
6. `docs/testing/verify-redesign-implementation-preflight.md`;
7. `docs/testing/migration-plan.md`;
8. this handoff;
9. current `.github/workflows/verify.yml`, `.github/workflows/release.yml`, `package.json`, `scripts/verify.ts`, and repository references to `verify:release` or removed low-level `--only` labels.

## Next workflow

1. Resolve the exact Pass F implementation delta from current repository consumers; choose the minimum complete cleanup.
2. Prepare a coding-agent task only after that current consumer inventory is inspected and the final state is explicit.
3. Review the complete resulting PR, not only the Pass F patch.
4. Keep PR #218 draft until Pass F is complete and full semantic review is clean.
5. Final merge readiness requires exact-head GitHub CI green on the final resulting PR head; ordinary merge into `develop` is squash merge.
