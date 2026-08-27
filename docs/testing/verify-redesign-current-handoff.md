# Verify redesign — current architect handoff

## Current state

Branch: `architecture/verify-redesign`

PR: #218 — `refactor(testing): redesign verification ownership` (base `develop`).

PR #218 remains **draft and blocked**.

The canonical eight-type public architecture remains unchanged. After the architecture-revision implementation at `ccd2bc0842428b3fde973afa9caf2f1a44b2aa53` correctly implemented its assigned contract, complete consumer re-review found that the handoff itself had modeled two shared execution boundaries too narrowly. Per root `AGENTS.md`, work remains in architecture/correction mode rather than adding another set of independent path-list patches.

Latest reviewed coding-agent implementation:

- `ccd2bc0842428b3fde973afa9caf2f1a44b2aa53`.

Accepted from that implementation and not to be reopened without new repository evidence:

- release-static broad capability from the previous revision is implemented as assigned;
- shared Playwright execution infrastructure is centralized for browser-backed types;
- E2E target-tree and project-applicability validation now follow the same E2E relevance gate as owner-inventory/dependency-graph acquisition;
- central exceptional release-proof inventory and focused/full/direct validation remain fail-closed;
- `--fix-only` returns before proof planners/validators;
- mutation planning preserves deleted/renamed-away infrastructure identities;
- generic browser-integration remains structurally disjoint from the appUpdate special corpus;
- TypeScript-first proof entry points and container-only verifier-managed Playwright remain intact.

Current scripts root causes after complete consumer inspection:

1. the command/lock/result/signal boundary is not Playwright-only: release build/artifact proof and Storybook static build execute through the same local-command infrastructure, so `static` ownership is incomplete;
2. real Vite-backed proof types share ownerless/global build and harness inputs (`config/**`, root PostCSS/Browserslist/tsconfig inputs, `public/**`, `index.html`, `pwa-assets.config.ts`) but current planners still model those inputs independently and incompletely;
3. runtime-relevant `package.json` widens exceptional browser-integration but not the generic inventory, so the public browser-integration type can still run only partially.

Active review state:

- `scripts/REVIEW.md` — **3 blockers**, no major/minor issues or accepted risks;
- `.github/workflows/REVIEW.md` — **1 downstream CI blocker**, intentionally deferred until scripts review is clean.

Ready replacement architecture handoff:

- `docs/testing/verify-redesign-final-review-architecture-revision-02.md`.

Current coding-agent assignment:

- `docs/testing/verify-redesign-final-review-architecture-revision-02-agent-task.md`.

Older final-review correction/revision tasks remain historical evidence and are not current implementation contracts.

## Architecture revision 02

The public taxonomy, unit model, mutation registry, ordinary structural E2E ownership, project applicability, performance state, special release inventory, accepted E2E relevance gate, and container/lock model do not change.

The remaining scripts design has three bounded corrections:

1. **Neutral local-command execution ownership.** One verifier-owned predicate represents the actual shared `localCommandGuard` / command-lock / process-result / signal boundary. `playwrightExecutionRisk.ts` composes it; release-static and Storybook static planning consume it directly. Unit and mutation are not widened merely because optional standalone wrappers reuse the helpers, because `buildCommands()` executes Vitest/Stryker directly.
2. **Neutral Vite build/harness capability.** One shared predicate covers current global/ownerless Vite inputs: non-test/proof `config/**`, `vite.config.ts`, `postcss.config.js`, `.browserslistrc`, root `tsconfig*.json`, and `public/**`; application-harness ownership additionally covers `index.html` and `pwa-assets.config.ts`. Existing release-static, Storybook, browser-integration, and E2E planners consume the shared fact and widen only their truthful public type. Ordinary production `src/**` remains with its existing colocated/dependency ownership.
3. **Complete browser-integration package impact.** Reuse the existing `isPackageJsonRuntimeRelevantChange` decision for generic and exceptional browser-integration so runtime-relevant changes select the complete public type while confirmed version-only changes stay narrow.

This is the minimum complete alternative to another sequence of planner-specific path additions. It does not introduce a dependency graph for tooling, universal planner registry, DSL, cache, or public API change.

The coding agent must run implementation preflight from revision 02 before edits and stop if current repository evidence invalidates the ready architecture.

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
- E2E target-tree/applicability/inventory/graph work remains behind the accepted relevance gate and literal `--full` remains always relevant;
- project applicability remains separate from ownership;
- performance inventory remains intentionally empty;
- verifier-managed Playwright remains container-only;
- top-level/expensive locks, status/resume/logging/timeouts/profile/base/fix semantics remain preserved.

## CI evidence

GitHub Actions run `32991717215` / run number `4419` passed on older head `f5927142e724b7eb3787f751448cf5a5b2717e5c`.

That run is not current merge proof. Semantic blockers were discovered afterwards, current code/docs have moved, and develop CI still lacks the public `browser-integration` gate.

## Next order of work

1. coding agent implements only `docs/testing/verify-redesign-final-review-architecture-revision-02-agent-task.md`;
2. architect re-reviews the complete scripts-owned affected scope against `scripts/REVIEW.md` and revision 02;
3. if scripts review is clean, remove `scripts/REVIEW.md` and only then correct/re-review the downstream `.github/workflows/REVIEW.md` browser-integration CI blocker;
4. re-review the complete resulting PR, not only the latest patch;
5. synchronize migration/handoff/PR status;
6. require green exact-head GitHub CI including browser-integration;
7. move PR out of draft only after semantic review and CI are clean;
8. squash merge into `develop`.

Current merge readiness: **should not merge until blockers are fixed**.
