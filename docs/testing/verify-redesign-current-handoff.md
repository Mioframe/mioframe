# Verify redesign — current architect handoff

## Current state

Branch: `architecture/verify-redesign`

PR: #218 — `refactor(testing): redesign verification ownership` (base `develop`).

PR #218 is **draft and blocked** after a new complete resulting-PR semantic review of implementation head `f5927142e724b7eb3787f751448cf5a5b2717e5c`.

The review reopened implementation acceptance without changing the canonical eight-type architecture. Prior Pass A-F acceptance remains historical evidence for the work reviewed at those pass boundaries, but it does not override newly discovered current-repository defects.

Active review state:

- `scripts/REVIEW.md` — first correction owner;
- `.github/workflows/REVIEW.md` — downstream CI owner after the scripts correction is accepted.

Current correction architecture:

- `docs/testing/verify-redesign-final-review-correction.md`.

Current coding-agent task:

- `docs/testing/verify-redesign-final-review-agent-task.md`.

## Findings reopened by the complete PR review

The scripts-owned correction must resolve all current `scripts/REVIEW.md` findings together:

- release-sensitive static proof is incorrectly full-only instead of participating in normal affected `static` ownership;
- exceptional managed-update/browser and `productionArtifact/` E2E execution membership is not structurally complete against the real filesystem inventory;
- shared release fixture/publisher/artifact/build support can change while the dependent browser-integration/E2E proof skips;
- the generic browser-integration Playwright config overlaps the managed-update special corpus;
- mutation planning does not treat lockfile/runtime-relevant mutation toolchain changes as mutation infrastructure;
- expensive Playwright E2E owner inventory is acquired before E2E relevance is established, including paths where it is unnecessary;
- new/task-touched verifier proof entry points still violate the TypeScript-first tooling rule without a loader/runtime exception;
- one managed-update comment claims a cross-type ordering invariant that is not part of the accepted architecture.

The downstream workflow blocker is separate:

- `.github/workflows/verify.yml` does not run public `browser-integration` in the develop verification gate, and aggregate `verification` therefore does not require it.

Do not fix the workflow blocker in the first scripts-owned correction pass. Re-review the scripts correction first, then correct the workflow against the accepted planner semantics.

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
- top-level verify lock, expensive-command lock, status/resume/logging/timeouts/profile/base/fix behavior remain preserved.

Previously closed Pass D evidence such as host-Playwright removal and real dependency-cruiser proof must not be reopened without new repository evidence.

## CI evidence

GitHub Actions run `32991717215` / run number `4419` passed on exact implementation head `f5927142e724b7eb3787f751448cf5a5b2717e5c`.

That green run is **not merge proof** for the current review because the complete semantic review found missing affected/execution coverage, and the current develop workflow does not include the `browser-integration` type at all.

Review/control documentation commits after `f592714...` intentionally move the PR head and do not claim executable verification success.

## Next order of work

1. coding agent implements only `docs/testing/verify-redesign-final-review-agent-task.md`;
2. architect re-reviews the complete scripts-owned affected scope against `scripts/REVIEW.md`;
3. if scripts review is clean, remove `scripts/REVIEW.md` and correct the downstream `.github/workflows/REVIEW.md` blocker;
4. re-review the complete resulting PR, not only the final patch;
5. synchronize architect-owned migration/handoff/PR description with the accepted result;
6. require green GitHub CI on the exact final head, including the corrected browser-integration lane;
7. move PR out of draft only after semantic review and exact-head CI are both clean;
8. merge into `develop` with squash merge.

Current merge readiness: **should not merge until blockers are fixed**.
