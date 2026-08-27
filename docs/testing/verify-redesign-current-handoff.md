# Verify redesign — current architect handoff

## Current state

Branch: `architecture/verify-redesign`

PR: #218 — `refactor(testing): redesign verification ownership` (base `develop`).

PR #218 remains **draft and blocked**.

The canonical eight-type public architecture remains unchanged. After two scripts correction rounds still exposed repeated affected-ownership drift, work returned to architecture as required by root `AGENTS.md`.

Second scripts correction implementation:

- `8911f44078676ccaceb19c8de8c05364b5ec6698`.

Architect re-review accepted these parts of that correction:

- exceptional release-proof membership is centralized in `releaseProofInventory.ts` and validated in focused/full/direct managed execution;
- `--fix-only` returns before proof planners/validators;
- mutation planning preserves deleted/renamed-away infrastructure identities;
- common command/lock/result/signal support is represented for the special browser-integration/E2E paths;
- the first correction's generic/special browser separation, TypeScript-first conversion, E2E expensive-acquisition gate, and other accepted changes remain intact.

The remaining root causes are:

- release-static still omits active Vite build inputs outside its exact config list (`config/alias.ts`, `config/plugins/**`, `.browserslistrc`, etc.);
- the common Playwright execution-support boundary is also consumed by generic browser-integration, behavior, and visual, but those planners can still skip after the same support changes;
- E2E target-tree/applicability validation remains outside the E2E relevance gate.

Active review state:

- `scripts/REVIEW.md` — 2 blockers, 1 major issue;
- `.github/workflows/REVIEW.md` — downstream CI blocker, intentionally deferred until scripts review is clean.

Ready replacement architecture handoff:

- `docs/testing/verify-redesign-final-review-architecture-revision.md`.

Current coding-agent assignment:

- `docs/testing/verify-redesign-final-review-architecture-revision-agent-task.md`.

The earlier final-review correction docs/tasks remain historical evidence and are not current implementation contracts.

## Architecture revision

The public taxonomy, unit model, ordinary structural E2E ownership, mutation registry, performance state, special release inventory, and container/lock model do not change.

The revised affected-ownership design has three local changes:

1. `releaseStaticRisk.ts` classifies production artifact inputs by broad stable repository capabilities (`src`, `public`, non-test `config`, root build inputs, package/lock/build entry) rather than enumerating the direct Vite config dependency closure.
2. One small verifier-owned predicate becomes the source of truth for the genuinely shared Playwright-container execution boundary. Behavior, visual, browser-integration, and E2E planners reuse it and widen only their own public type.
3. E2E target-tree/applicability validation moves behind the same relevance decision as E2E inventory/graph acquisition; literal `--full` still validates everything.

This is the minimum complete alternative to repeated path additions and does not introduce a dependency graph, universal planner registry, or public API change.

Implementation is now ready for the coding agent under the task above. The agent must run implementation preflight from the ready architecture before edits and stop if current repository evidence invalidates the contract.

## Canonical public contract

Public verification types remain exactly:

```text
static
unit
behavior
visual
browser-integration
performance
mutation
e2e
```

Canonical commands remain:

```text
pnpm verify
pnpm verify --only <type>
pnpm verify --files <paths...>
pnpm verify --only <type> --files <paths...>
pnpm verify --full
pnpm verify:status
pnpm verify:resume
pnpm verify --fix-only
```

Preserved invariants:

- public `--only` exposes verification types, not private leaf labels;
- `pnpm verify --full` is the single release-grade public entry point;
- no `verify:release`;
- unit remains native Vitest changed/related with safe fallback;
- mutation remains the explicit four-target registry;
- ordinary E2E remains structural page/widget ownership with dependency-cruiser only for production reachability;
- project applicability remains separate from ownership;
- performance inventory remains intentionally empty;
- verifier-managed Playwright remains container-only;
- top-level/expensive locks, status/resume/logging/timeouts/profile/base/fix semantics remain preserved.

## CI evidence

GitHub Actions run `32991717215` / run number `4419` passed on older head `f5927142e724b7eb3787f751448cf5a5b2717e5c`.

That run is not current merge proof. Semantic blockers were discovered afterwards, current code/docs have moved, and develop CI still lacks the public `browser-integration` gate.

## Next order of work

1. coding agent implements only `docs/testing/verify-redesign-final-review-architecture-revision-agent-task.md`;
2. architect re-reviews the complete scripts-owned affected scope against `scripts/REVIEW.md` and the ready architecture revision;
3. if scripts review is clean, remove `scripts/REVIEW.md` and correct the downstream `.github/workflows/REVIEW.md` browser-integration CI blocker;
4. re-review the complete resulting PR;
5. synchronize migration/handoff/PR status;
6. require green exact-head GitHub CI including browser-integration;
7. move PR out of draft only after semantic review and CI are clean;
8. squash merge into `develop`.

Current merge readiness: **should not merge until blockers are fixed**.
