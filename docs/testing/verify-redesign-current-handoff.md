# Verify redesign — current architect handoff

## Current state

Branch: `architecture/verify-redesign`

Pass status:

- Pass A — completed and architect-accepted;
- Pass B — completed and architect-accepted;
- Pass C — completed and architect-accepted;
- Pass D — completed and architect-accepted at `c0aa686235d291089d413b77c4b5fe176acc07b3`;
- Pass E — architecture resolved; ready for implementation;
- Pass F — must not start until Pass E is architect-accepted.

There is no active Pass D `scripts/REVIEW.md`. The previous B1 completeness blocker and M1 stale-comment issue are closed.

Exact-head GitHub CI remains an architect-owned gate separate from semantic pass acceptance. At the time Pass D was accepted, no exact-head workflow run/status existed for `c0aa686235d291089d413b77c4b5fe176acc07b3`, so that SHA was not a merge-ready verdict.

## Read order

Before Pass E implementation/review, read in this order:

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
11. current `scripts/verify.ts`, `scripts/lib/changedPaths.ts`, `stryker.config.mjs`, `vitest.config.ts`, and their focused tests.

Pass D implementation/correction records are historical accepted source for invariants and should be consulted only when Pass E touches an adjacent boundary.

## Pass E architecture summary

### Unit

- Vitest remains the only unit dependency/affected engine.
- Normal git scopes use native `vitest --changed <existing resolved diff base>`.
- Explicit source/support files use native `vitest related --run`.
- Direct unit tests run directly.
- Explicit mixed direct-test + source scopes may use two private unit leaves instead of widening to full or adding a wrapper.
- Removed/moved/global unit relations that cannot be represented safely widen to full unit.
- Zero related tests is visible fail-closed evidence, never a successful skip.
- Do not add dependency-cruiser or another unit graph.

### Mutation

- Replace both current adjacency sources of truth with one explicit `MutationTarget` registry.
- Initial accepted registry contains exactly the four confirmed deterministic high-risk owners in `verify-redesign-pass-e-implementation.md`.
- Focused/default mutation selects only exact registered source/test relations; mutation infrastructure changes select all registered targets.
- `stryker.config.mjs` derives its complete mutate inventory from the same registry.
- `--full` executes every registered target.

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
- current status/resume/logging/timeout behavior.

## Next workflow

The next implementation boundary is Pass E only.

After implementation lands:

1. review the complete Pass E result, not only the latest patch;
2. create `scripts/REVIEW.md` only if actionable findings exist;
3. if clean, mark Pass E architect-accepted and then resolve/execute Pass F;
4. do not give final merge approval until exact-head GitHub CI exists and is green on the final resulting PR head.