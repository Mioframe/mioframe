# Verify redesign — current architect handoff

## Current state

Branch: `architecture/verify-redesign`

PR: #218 — `refactor(testing): redesign verification ownership` (base `develop`).

PR #218 remains **draft and blocked**.

The complete scripts-owned verify redesign is architect-accepted through:

- `c42cc1a09bdfee2c07f88412ee4c87951dfb3a43`.

The develop workflow correction is architect-accepted through:

- `32af5521b271de1fca4f94740572afa70b4900ec`.

`verification-browser (browser-integration)` is now an independent job behind `autofix`, runs exactly `pnpm verify --verbose --only browser-integration`, uploads its own verify logs on failure/cancellation, and is required by aggregate `verification`. It remains separate from the Storybook matrix. `.github/workflows/REVIEW.md` is resolved and removed.

A complete resulting-PR semantic review after that workflow correction found no new scripts/workflow implementation defect. One documentation-closeout major remains in `docs/testing/REVIEW.md`: current-facing Storybook/developer/ADR guidance still describes parts of the removed migration/private proof model.

## Accepted implementation state

The public verification types are exactly:

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

Canonical entry points remain:

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

Accepted invariants:

- public `--only` exposes verification types, never private leaf labels;
- `pnpm verify --full` is the single release-grade public entry point; no `verify:release`;
- release-sensitive static ownership covers production source, application Vite harness inputs, package/lock/build entry, and neutral local-command execution;
- Storybook behavior/visual target discovery is owner-local and legacy ordinary `*.browser.spec.ts` / central ordinary Storybook/visual discovery has no current consumer;
- generic and exceptional browser-integration remain disjoint, with central exceptional membership validation and complete package/runtime widening;
- unit remains native Vitest changed/related with safe fallback;
- mutation remains one explicit four-target registry with status-aware deleted/renamed infrastructure impact;
- ordinary E2E remains structural page/widget ownership with dependency-cruiser only for production reachability;
- productionArtifact E2E and managed-update browser proof retain their required special execution semantics behind the public types;
- E2E structural/inventory/graph validation is behind the accepted relevance gate and literal `--full` remains complete/fail-closed;
- performance inventory remains intentionally empty;
- verifier-managed Playwright remains container-only;
- top-level/expensive locks, status/resume, logging, timeout, profile/base/fix, and fail-on-flaky semantics remain preserved;
- develop aggregate verification now requires static/unit/mutation, E2E, browser-integration, behavior, and visual lanes; the empty performance inventory requires no dedicated lane;
- main release gate remains `pnpm verify --full`.

## Active review state

Only one review artifact remains:

- `docs/testing/REVIEW.md` — **1 major issue**, no blockers/minors/accepted risks.

The remaining root cause is documentation only:

1. `docs/testing/storybook.md` still describes removed legacy behavior/central Storybook/visual discovery as potentially current executable compatibility;
2. `DEVELOPMENT.md` still summarizes proof with private verifier leaf names and a generic `release verification` category instead of the public contract-based types;
3. `docs/testing/verify-redesign-architecture.md` still says implementation is pending.

No scripts or workflow change is required to resolve this finding.

## CI evidence

Historical run `32991717215` / #4419 passed on old head `f5927142e724b7eb3787f751448cf5a5b2717e5c` and is not merge proof.

After the workflow correction, run `33056620129` / #4460 on `16c5904ac8bcdabb360d813d0eb8a213955e15ca` visibly included the new independent browser-integration job. That run was still in progress during semantic review and is not final merge proof; the head has also moved due review/control documentation.

Final exact-head GitHub CI is required only after the documentation finding is resolved and final semantic review is clean.

## Next order of work

1. correct only the current-facing documentation finding in `docs/testing/REVIEW.md`; do not change accepted scripts or workflow semantics;
2. architect re-reviews the corrected documentation and removes `docs/testing/REVIEW.md` only when clean;
3. perform the final complete resulting-PR semantic review/check for stale review state;
4. synchronize migration/handoff/PR description to completion;
5. require green exact-head GitHub CI, including the browser-integration lane and aggregate `verify` gate;
6. move PR out of draft only after semantic review and exact-head CI are clean;
7. squash merge into `develop`.

Current merge readiness: **should not merge until blockers are fixed**.
