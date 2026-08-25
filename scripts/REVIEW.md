# Review

Verdict: blocked

## Scope reviewed

- Verify Redesign Pass D implementation after the operator installed `dependency-cruiser@18.2.0` and updated `pnpm-lock.yaml`.
- Structural E2E owner inventory, dependency-cruiser graph acquisition, generic browser-integration execution, Playwright container execution, and local verify single-run coordination.

## Blockers

### B1 — E2E ownership metadata still runs Playwright on the host

Owner: `scripts/lib/e2eOwnerInventoryCollector.ts`

Problem: the current ownership-inventory collector invokes `node_modules/.bin/playwright test --list` directly with `spawnSync`. This bypasses the repository's required Playwright container boundary and does not participate in the existing guarded expensive-command path for that Playwright invocation.

Evidence:

- [`lib/e2eOwnerInventoryCollector.ts`](lib/e2eOwnerInventoryCollector.ts) — `collectFromConfig()` directly spawns the host Playwright binary and explicitly documents host execution.
- [`playwrightContainer.ts`](playwrightContainer.ts) — `runPlaywrightInContainer()` is the existing container execution owner and routes through `runGuardedExpensiveLocalCommand`.

Basis:

- [`../docs/testing/verify-redesign-pass-d-playwright-container.md`](../docs/testing/verify-redesign-pass-d-playwright-container.md) — every Playwright CLI invocation, including `--list`/ownership metadata collection, must use the existing container boundary and preserve verify-lock coordination.
- [`../AGENTS.md`](../AGENTS.md) — existing verification locks/orchestration must be preserved; coding changes require faithful task-specific proof.

Risk: Pass D would introduce a verification path whose environment can differ from real Playwright proof and which can bypass the established local verify/expensive-command coordination.

Required final state: ownership metadata collection remains Playwright-native and browser-free, but both ordinary and release `--list` collections execute through the existing `runPlaywrightInContainer` path. Keep the synchronous planner boundary by using one narrow child collector if needed; use the repository-mounted ignored `temp/` directory for reporter JSON exchange. Do not create a second container/lock abstraction.

Verification: prove both configs are collected through container list mode, the current inventory validates with zero additional-owner annotations, no host Playwright CLI path remains in the collector, and the existing command-lock/local-command-guard proof remains green.

### B2 — the installed dependency-cruiser adapter still lacks real repository proof

Owner: `scripts/lib/e2eGraph.ts`

Problem: `dependency-cruiser@18.2.0` is now installed and locked, but the Pass D graph adapter has only fixture-backed unit proof from the implementation round. The previous implementation report explicitly stopped before validating the real programmatic cruise against the Mioframe `src/**` graph.

Evidence:

- [`lib/e2eGraph.ts`](lib/e2eGraph.ts) — production adapter spawns `lib/e2eGraphCollector.mjs` and converts dependency-cruiser output into the reverse graph.
- [`lib/e2eGraphCollector.mjs`](lib/e2eGraphCollector.mjs) — real `cruise(['src'], ...)` boundary using `tsconfig.src.json`.
- [`lib/e2eGraph.test.ts`](lib/e2eGraph.test.ts) — current tests inject synthetic dependency-cruiser output; they intentionally do not execute dependency-cruiser.
- [`../package.json`](../package.json) and [`../pnpm-lock.yaml`](../pnpm-lock.yaml) — `dependency-cruiser` is now available as `^18.2.0` / `18.2.0`.

Basis:

- [`../docs/testing/verify-redesign-pass-d-implementation.md`](../docs/testing/verify-redesign-pass-d-implementation.md) — Pass D requires one real dependency-cruiser reverse graph and task-specific proof of lower-layer -> widget/page traversal while keeping graph uncertainty fail-closed.
- [`../.agents/skills/verification/SKILL.md`](../.agents/skills/verification/SKILL.md) — required task-specific proof must exist before handoff; unit fixtures do not replace missing mechanism proof.

Risk: the adapter could be incompatible with the installed dependency-cruiser API/configuration or could produce unresolved/incomplete repository output, causing incorrect E2E selection or permanent unintended full-E2E fallback.

Required final state: the current real Mioframe graph acquires successfully with dependency-cruiser 18.2.0, and at least one representative lower-layer production path is shown by the real planner to reach its structural widget/page owner set. If real acquisition exposes an adapter defect, correct only that concrete defect and preserve fail-closed behavior.

Verification: use the real installed dependency and a focused `pnpm verify --only e2e --files <representative lower-layer production path>` run (for example an existing `src/entities/databaseData/**` production module if the real graph confirms its DocumentView chain). Confirm the planner selects the truthful owned E2E scope rather than failing/full-fallback because of graph acquisition. Keep the existing graph-failure unit proof green.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
