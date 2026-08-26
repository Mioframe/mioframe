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
- **Pass F:** implementation complete; the first review found one documentation-only blocker in `docs/release.md`, corrected by the architect. Pass F acceptance now requires exact-head CI plus architect re-review of Pass F and the complete resulting PR. No coding-agent work is currently pending.

Pass E was reviewed as the complete result from baseline `75277c067cca6aba30f2e0698056e4f84f48fb69` through exact PR head `60a097a077cb834e4cab28f5a2a8fad616ff77fd`, not only the final correction patch.

Final Pass E review result:

- blockers: 0;
- major issues: 0;
- minor issues: 0;
- accepted risks: 0.

The former `config/REVIEW.md` finding is resolved and the review file has been removed. The correction deleted the redundant `config/strykerConfig.test.ts` without replacement; no TypeScript project boundary was widened.

Exact-head GitHub Actions run `32962324169` / run number `4398` for pre-Pass-F head `514acb6d46d41e3fe8de3f6493a7c91c9032fef9` completed successfully. That head differs from the accepted Pass E implementation only by architect-owned acceptance documentation and CI formatting autofix, so it does not reopen Pass E semantics.

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

## Pass F implementation state

The authoritative architecture/consumer-inventory record is:

`docs/testing/verify-redesign-pass-f-implementation.md`

The completed coding-agent execution contract is:

`docs/testing/verify-redesign-pass-f-agent-task.md`

Coding-agent implementation landed at `df36809f7f02f4d6e03c2fd9b221e81ada91dd81` and kept the implementation inside the confirmed active-current consumer scope:

- `.github/workflows/release.yml` now invokes literal `pnpm verify --full --verbose`;
- `package.json` no longer exposes `verify:release`;
- verifier help no longer advertises the alias;
- active instructions/comments were migrated to the canonical public type surface;
- real internal `e2e:release`, artifact/release-smoke, managed-update, publisher-node-import, container, lock, timeout, logging, and status/resume responsibilities were preserved;
- no product code, verifier planning algorithm, test meaning, E2E ownership, mutation registry, or performance semantics changed.

The first Pass F review found one documentation-only blocker: `docs/release.md` still published a private `storybook-build` invocation and incompletely described full/managed-update type ownership. The architect corrected that source of truth at `c7ff328af91367b43565bcf77ebdc7c1ab0a42cb`:

- current `verification-static` documentation now exposes only public `static`, `unit`, and `mutation` type commands and describes Storybook fallback as planner-internal;
- `pnpm verify --full` is documented as running all eight public verification types, including current `behavior`, generic `browser-integration`, and the intentionally empty persistent `performance` inventory;
- managed-update focused ownership is documented as `static` + `browser-integration` + `e2e`;
- the stale `docs/REVIEW.md` blocker was removed after the correction was verified against current `verify.yml`, `scripts/verify.ts`, and `docs/testing/architecture.md`.

No correction task for a coding agent is active.

## Read order for final Pass F / PR review

1. root `AGENTS.md`;
2. `.agents/skills/verification/SKILL.md`;
3. `.agents/skills/project-review/SKILL.md`;
4. `docs/testing/architecture.md`;
5. `docs/testing/verify-redesign-implementation-preflight.md`;
6. `docs/testing/migration-plan.md`;
7. `docs/testing/verify-redesign-pass-f-implementation.md`;
8. `docs/testing/verify-redesign-pass-f-agent-task.md`;
9. this handoff;
10. the complete current PR and affected consumers relative to `develop`.

## Next workflow

1. Wait for GitHub CI on the exact current PR head; do not duplicate it with another coding-agent broad local gate.
2. Architect re-reviews the complete Pass F result, including the documentation correction, then reviews the complete resulting PR relative to `develop`, not only the Pass F patch.
3. If no blocker/major issue remains, mark Pass F architect-accepted, finalize `docs/testing/migration-plan.md`, this handoff, and PR description/status, and move PR #218 out of draft.
4. Any architect-owned final documentation/status commit must receive its own exact-head CI before merge readiness.
5. Ordinary merge into `develop` is squash merge.
