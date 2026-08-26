# Verify redesign — current architect handoff

## Current state

Branch: `architecture/verify-redesign`

PR: #218 — `refactor(testing): redesign verification ownership` (base `develop`).

PR #218 remains **draft and blocked**.

A complete resulting-PR review reopened implementation acceptance after the previously green implementation head `f5927142e724b7eb3787f751448cf5a5b2717e5c`. The canonical eight-type architecture remains unchanged.

The first scripts-owned correction was implemented by the coding agent at:

- `ab4efa5dbb822bc1a1d1e4b2a2def60e3a65e67f`.

Architect re-review found that this correction resolves several findings but does **not** satisfy the complete scripts acceptance boundary. Current durable findings are in:

- `scripts/REVIEW.md` — 3 blockers, 2 major issues;
- `.github/workflows/REVIEW.md` — downstream CI blocker, intentionally not started until the scripts review is clean.

Current correction architecture remains:

- `docs/testing/verify-redesign-final-review-correction.md`.

Current coding-agent task is the consolidated second scripts correction:

- `docs/testing/verify-redesign-final-review-correction-02-agent-task.md`.

The previous first-correction assignment remains historical context only:

- `docs/testing/verify-redesign-final-review-agent-task.md`.

## Scripts correction re-review

Resolved by `ab4efa5...` and not to be reopened without new evidence:

- generic `playwright.browserIntegration.config.ts` is structurally disjoint from the appUpdate special corpus;
- runtime-relevant `package.json` and `pnpm-lock.yaml` mutation impact is represented for existing changed paths;
- expensive Playwright E2E inventory/dependency-cruiser acquisition is gated behind cheap E2E relevance;
- `productionArtifactStaticProof`, `managedUpdatesControllerArtifactIdentityProof`, and `managedUpdatesProof` are native TypeScript;
- the stale browser-integration-before-E2E cross-type ordering claim was removed;
- one explicit exceptional release-proof inventory exists and planners/runners consume its group arrays.

The second scripts correction must resolve all remaining `scripts/REVIEW.md` findings together:

1. broaden release-static production-artifact capability so ordinary Vite production inputs select `build` + `artifact-static`, with appUpdate/controller inputs additionally selecting `managed-updates-static`;
2. make `releaseProofInventory.ts` the sole owner of all exceptional membership, including managed data compatibility, and validate that inventory in focused, literal-full, and direct special-runner execution;
3. include the common command/lock/result/signal execution-support boundary in affected ownership for special browser-integration/E2E proof;
4. make `--fix-only` return its fixer plan before any proof planner/validator is resolved;
5. preserve deleted/renamed-away mutation-infrastructure identity through mutation impact classification.

This is the second correction round under the current architecture. If re-review still reveals ownership drift, mixed responsibilities, or workaround growth, stop patching and return to the architecture decision instead of issuing another incremental scripts patch.

Do not start the downstream workflow correction while these scripts findings remain.

## Canonical architecture that remains unchanged

The public verification types remain exactly:

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

Preserved decisions/invariants:

- public `--only` exposes verification types, not private leaf labels;
- `pnpm verify --full` is the single release-grade public entry point;
- `verify:release` remains removed;
- unit affected selection remains native Vitest changed/related with safe fallback;
- mutation remains one explicit four-target registry, with no adjacency inference;
- ordinary E2E remains structural page/widget ownership with dependency-cruiser used only for production reachability;
- Playwright project applicability remains separate from ownership;
- persistent performance inventory remains intentionally empty;
- every verifier-managed Playwright CLI invocation remains containerized;
- top-level verify lock, expensive-command lock, status/resume/logging/timeouts/profile/base/fix semantics remain preserved.

## CI evidence

GitHub Actions run `32991717215` / run number `4419` passed on the older implementation head `f5927142e724b7eb3787f751448cf5a5b2717e5c`.

That run is not merge proof: semantic blockers were found afterwards and the current develop workflow still does not run the public `browser-integration` type.

Coding-agent and architect review/documentation commits after that head require their own exact-head CI only after the implementation and workflow review state is clean enough to reach the final repository gate.

## Next order of work

1. coding agent implements only `docs/testing/verify-redesign-final-review-correction-02-agent-task.md`;
2. architect re-reviews the complete scripts-owned affected scope against the full current `scripts/REVIEW.md`;
3. only if scripts review is clean, remove `scripts/REVIEW.md` and correct `.github/workflows/REVIEW.md` by adding public `browser-integration` to develop CI and aggregate `verification`;
4. re-review the complete resulting PR;
5. synchronize migration/handoff/PR status;
6. require green GitHub CI on the exact final head, including browser-integration;
7. move PR out of draft only after semantic review and exact-head CI are both clean;
8. merge into `develop` with squash merge.

Current merge readiness: **should not merge until blockers are fixed**.
