# Verify redesign — current architect handoff

## Current state

Branch: `architecture/verify-redesign`

PR: #218 — `refactor(testing): redesign verification ownership` (base `develop`).

PR #218 remains **draft and blocked**.

The scripts-owned verify redesign is now architect-accepted through coding-agent implementation:

- `c42cc1a09bdfee2c07f88412ee4c87951dfb3a43`.

The revision-02 re-review found no remaining scripts blocker, major issue, minor issue, or accepted risk. `scripts/REVIEW.md` has therefore been removed.

Accepted scripts state includes:

- exactly eight public verification types and the existing public CLI contract;
- release-sensitive static affected ownership for production `src/**`, application Vite harness inputs, package/lock/build-entry impact, and the neutral local-command execution boundary;
- neutral shared Vite build/harness capability consumed by truthful static, Storybook, browser-integration, and E2E owners;
- neutral local-command execution ownership composed by Playwright execution and consumed directly by release/static and Storybook static proof;
- generic and exceptional browser-integration remain disjoint while runtime-relevant `package.json` now widens the complete public browser-integration type;
- E2E relevance gates target-tree, applicability, owner inventory, exceptional membership, and dependency-graph work; literal `--full` remains always relevant and fail-closed;
- central exceptional release-proof inventory with focused/full/direct validation;
- true `--fix-only` early return;
- status-aware mutation deletion/rename handling and the explicit four-target mutation registry;
- TypeScript-first proof entry points and container-only verifier-managed Playwright;
- top-level/expensive locks, status/resume, logging, timeout, profile/base, and flaky-failure semantics remain preserved.

## Active review state

Only one owner-local review remains:

- `.github/workflows/REVIEW.md` — **1 blocker**: develop verification does not run the public `browser-integration` type and aggregate `verification` does not require it.

No scripts review artifact remains.

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
- performance inventory remains intentionally empty;
- verifier-managed Playwright remains container-only.

## CI evidence

GitHub Actions run `32991717215` / run number `4419` passed on older head `f5927142e724b7eb3787f751448cf5a5b2717e5c`.

That run is not current merge proof. Current code and review state have moved, and develop CI still lacks the public `browser-integration` gate.

## Next order of work

1. correct the single downstream `.github/workflows/REVIEW.md` blocker without changing accepted scripts semantics;
2. architect re-reviews the complete workflow scope and removes `.github/workflows/REVIEW.md` only when clean;
3. re-review the complete resulting PR against the canonical architecture and repository rules;
4. synchronize migration/handoff/PR status;
5. require green exact-head GitHub CI including browser-integration;
6. move PR out of draft only after semantic review and CI are clean;
7. squash merge into `develop`.

Current merge readiness: **should not merge until blockers are fixed**.
