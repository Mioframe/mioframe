# Verify redesign — current architect handoff

## Current state

Branch: `architecture/verify-redesign`

PR: #218 — `refactor(testing): redesign verification ownership` (base `develop`).

PR #218 remains **draft** and is blocked only by final exact-head GitHub CI / readiness transition.

The complete scripts-owned verify redesign is architect-accepted through:

- `c42cc1a09bdfee2c07f88412ee4c87951dfb3a43`.

The develop workflow correction is architect-accepted through:

- `32af5521b271de1fca4f94740572afa70b4900ec`.

Current-facing documentation and verification skills have been synchronized with the executable target model. `scripts/REVIEW.md`, `.github/workflows/REVIEW.md`, and `docs/testing/REVIEW.md` are resolved and removed.

A complete resulting-PR semantic review found no remaining scripts, workflow, ownership, or documentation finding.

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

Canonical entry points are:

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
- Storybook behavior/visual discovery is target-only and owner-local; removed ordinary `*.browser.spec.ts` / central Storybook/visual discovery is not current compatibility;
- generic and exceptional browser-integration remain disjoint, with central exceptional membership validation and complete package/runtime widening;
- unit remains native Vitest changed/related with safe fallback;
- mutation remains one explicit four-target registry with status-aware deleted/renamed infrastructure impact;
- ordinary E2E remains structural page/widget ownership with `dependency-cruiser` only for production reachability;
- productionArtifact E2E and managed-update browser proof retain their required special execution semantics behind the public types;
- E2E structural/inventory/graph validation is behind the accepted relevance gate and literal `--full` remains complete/fail-closed;
- performance inventory remains intentionally empty;
- verifier-managed Playwright remains container-only;
- top-level/expensive locks, status/resume, logging, timeout, profile/base/fix, and fail-on-flaky semantics remain preserved;
- develop aggregate verification requires static/unit/mutation, E2E, browser-integration, behavior, and visual lanes; the empty performance inventory requires no dedicated lane;
- main release gate remains `pnpm verify --full`.

## Review state

No active `REVIEW.md` finding remains for this PR.

Historical `verify-redesign-pass-*`, correction, architecture-revision, and coding-agent task files remain implementation history. They may contain historical terminology and are not current executable guidance.

## CI evidence

Historical run `32991717215` / #4419 passed on old head `f5927142e724b7eb3787f751448cf5a5b2717e5c` and is not merge proof.

After the workflow correction, run `33056620129` / #4460 on `16c5904ac8bcdabb360d813d0eb8a213955e15ca` visibly included the new independent browser-integration job. It is not final merge proof because the head moved during documentation closeout.

Required next evidence is one green GitHub CI run on the exact final PR head, including:

- `verification-static`;
- `verification-browser (e2e)`;
- `verification-browser (browser-integration)`;
- `verification-browser (behavior)`;
- `verification-browser (visual)`;
- aggregate `verification` / required `verify` gate;
- `release-version` where applicable.

## Next order of work

1. wait for/review GitHub CI on the exact current head;
2. if CI fails because of this PR, route only the concrete failing contract to its truthful owner and re-review the resulting new head;
3. if exact-head CI is green and the semantic state remains clean, move PR #218 out of draft;
4. issue the final merge-readiness verdict;
5. squash merge into `develop`.

Current merge readiness: **should not merge until blockers are fixed** — the remaining blocker is exact-head CI, not implementation, workflow, architecture, or documentation.
