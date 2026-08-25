# Verify redesign — current architect handoff

## Current state

Branch: `architecture/verify-redesign`

Pass status:

- Pass A — completed and architect-accepted;
- Pass B — completed and architect-accepted;
- Pass C — completed and architect-accepted;
- Pass D — completed and architect-accepted at `c0aa686235d291089d413b77c4b5fe176acc07b3`;
- Pass E — implementation landed at `82395eebe75484157e30cb92dc8165c368a92496`; architect review is blocked by the active findings in `scripts/REVIEW.md`; one consolidated correction task is prepared in `docs/testing/verify-redesign-pass-e-correction.md`;
- Pass F — must not start until Pass E is architect-accepted.

The previous Pass D B1 completeness blocker and M1 stale-comment issue remain closed and must not be reopened without new repository evidence.

Exact-head GitHub CI remains an architect-owned gate separate from semantic pass acceptance.

## Read order

Before Pass E correction/re-review, read in this order:

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
11. `docs/testing/verify-redesign-pass-e-agent-task.md` for the accepted Pass E implementation boundary;
12. active `scripts/REVIEW.md`;
13. `docs/testing/verify-redesign-pass-e-correction.md` for the current correction pass;
14. current `scripts/verify.ts`, `scripts/lib/unitRisk.ts`, `scripts/lib/mutationTargets.ts`, `scripts/lib/changedPaths.ts`, `stryker.config.mjs`, `vitest.config.ts`, and their focused tests.

Pass D implementation/correction records are historical accepted source for invariants and should be consulted only when Pass E touches an adjacent boundary.

## Active Pass E review

The complete Pass E implementation was reviewed from baseline:

`75277c067cca6aba30f2e0698056e4f84f48fb69`

to implementation HEAD:

`82395eebe75484157e30cb92dc8165c368a92496`

The durable review source is:

`scripts/REVIEW.md`

Current blockers are consolidated there:

1. native Vitest zero-match output can exit 0 and is still accepted by verifier result classification;
2. default Git unit classification can silently skip standard snapshots and root TypeScript transform configuration;
3. literal `--full` bypasses mutation registry structural invalidity before Stryker execution.

The authoritative correction task is:

`docs/testing/verify-redesign-pass-e-correction.md`

These are local corrections to the accepted Pass E architecture. They do not require a new dependency graph, new public type, generic planner framework, mutation ownership redesign, or Pass F work.

The coding agent must not edit `docs/**`, `AGENTS.md`, `.agents/skills/**`, or `scripts/REVIEW.md`; architect-owned review and workflow state is updated only after re-review.

## Pass E architecture summary

### Unit

- Vitest remains the only unit dependency/affected engine.
- Normal git scopes use native `vitest --changed <existing resolved diff base>` for ordinary source/test-support impact.
- Explicit source/support files use native `vitest related --run`.
- Direct unit tests run directly.
- Explicit mixed direct-test + source scopes may use two private unit leaves instead of widening to full or adding a wrapper.
- Deterministic snapshot ownership must not disappear from default Git scope.
- Removed/moved/global unit relations that cannot be represented safely widen to full unit.
- Relevant root TypeScript transform configuration is global unit impact.
- Zero related/affected tests is visible fail-closed evidence, never a successful unit pass; use the existing narrow verifier result-classification boundary, not a new dependency mechanism.
- Do not add dependency-cruiser or another unit graph.

### Mutation

- One explicit `MutationTarget` registry is the only durable mutation ownership source.
- The accepted registry contains exactly the four confirmed deterministic high-risk owners in `verify-redesign-pass-e-implementation.md`.
- Focused/default mutation selects only exact registered source/test relations; mutation infrastructure changes select all registered targets.
- `stryker.config.mjs` derives its complete mutate inventory from the same registry.
- Structural registry invalidity must fail before Stryker in focused/default and literal full mode.
- `--full` executes every registered target with no affected narrowing only after registry validity is established.

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
- current status/resume/logging/timeout behavior except the narrow required unit no-test blocking classification.

## Next workflow

1. Coding agent implements only `docs/testing/verify-redesign-pass-e-correction.md`; Pass F remains closed.
2. Architect re-reviews the complete Pass E result from `75277c067cca6aba30f2e0698056e4f84f48fb69` through the new implementation HEAD, not only the correction patch.
3. Remove `scripts/REVIEW.md` only when every active finding is resolved and no new blocker/major issue appears.
4. If clean, mark Pass E architect-accepted and then resolve/execute Pass F.
5. If this correction still reveals ownership drift, mixed responsibility, or growing workaround logic, stop local patching and revisit Pass E architecture instead of starting another correction loop.
6. Do not give final merge approval until exact-head GitHub CI exists and is green on the final resulting PR head.
