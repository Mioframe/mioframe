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
- **Pass F:** architecture/consumer inventory resolved in `docs/testing/verify-redesign-pass-f-implementation.md`; implementation is next and is the only remaining redesign work.

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

## Resolved Pass F boundary

The authoritative implementation record is:

`docs/testing/verify-redesign-pass-f-implementation.md`

Pass F is direct CI/public-compatibility cleanup only. Current consumer inspection established the minimum complete design:

- migrate `.github/workflows/release.yml` from `pnpm verify:release --verbose` to literal `pnpm verify --full --verbose`;
- remove the now-redundant `verify:release` package alias after its required workflow consumer is migrated;
- remove the alias from verifier public help;
- correct active current instructions/comments that still advertise `verify:release`, private low-level `--only` labels, or invalid `--full --only ...` commands;
- correct stale active release documentation claiming mutation is outside the full gate;
- preserve internal `e2e:release`, artifact/release-smoke, managed-update, publisher-node-import, and other release-named internals where they own real execution constraints;
- do not change accepted verifier algorithms, test meaning, product behavior, locks, containers, timeouts, logging, or status/resume behavior.

The active-current cleanup inventory includes `AGENTS.md`, `.agents/skills/verification/SKILL.md`, `DEVELOPMENT.md`, `docs/release.md`, `docs/release-checklist.md`, `docs/managed-pinned-updates.md`, `package.json`, `scripts/verify.ts`, `scripts/release/buildArtifact.mjs`, `.github/workflows/release.yml`, and `.github/workflows/release-tag.yml`. Historical release notes/design history are not rewritten solely to remove old command strings.

## Read order for Pass F implementation/review

1. root `AGENTS.md`;
2. `.agents/skills/verification/SKILL.md`;
3. `.agents/skills/implementation-preflight/SKILL.md`;
4. `.agents/skills/project-review/SKILL.md` when reviewing;
5. `docs/testing/architecture.md`;
6. `docs/testing/verify-redesign-implementation-preflight.md`;
7. `docs/testing/migration-plan.md`;
8. `docs/testing/verify-redesign-pass-f-implementation.md`;
9. this handoff;
10. the current active files listed in the Pass F consumer inventory.

## Next workflow

1. Implement only the resolved Pass F delta; do not redesign verifier internals.
2. Use focused verifier-managed feedback only where it materially proves a touched script/help/static contract; broad final local verification is not a coding-agent handoff requirement.
3. Architect reviews Pass F and then the complete resulting PR relative to `develop`, not only the cleanup patch.
4. If clean, mark Pass F accepted, finalize migration/handoff/PR documentation, and move PR #218 out of draft.
5. Final merge readiness requires exact-head GitHub CI green on the final resulting PR head; ordinary merge into `develop` is squash merge.
