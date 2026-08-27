# Verify redesign — current architect handoff

## Current state

Branch: `architecture/verify-redesign`

PR: #218 — `refactor(testing): redesign verification ownership` (base `develop`).

PR #218 remains **draft**. The post-`develop` integration review is now architect-clean; the remaining merge gate is exact-head GitHub CI and the ready-for-review transition.

Current `develop` integration:

- merged `develop` commit: `9dd19ed320ce227e915a824b5552af16108a5a10`;
- two-parent merge commit: `b6125cf2ce3c976402e269b117546a923eaa654f`;
- post-merge Firefox configuration-contract correction: `69e28e631a4a634817210e22a87a43a7095c6dd5`.

The branch is not behind `develop`.

The complete scripts-owned verify redesign was architect-accepted through `c42cc1a09bdfee2c07f88412ee4c87951dfb3a43`. The develop workflow browser-integration correction was architect-accepted through `32af5521b271de1fca4f94740572afa70b4900ec`.

## Accepted executable state

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

Canonical entry points are:

```text
pnpm verify
pnpm verify --base origin/develop
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
- `pnpm verify --full` is the single release-grade public entry point; there is no `verify:release` or public `release` type;
- ordinary coding-agent PR handoff uses one cumulative `pnpm verify --base origin/<base>` result, separate from exact-head CI;
- Storybook behavior/visual discovery is target-only and owner-local; ordinary `*.browser.spec.ts` compatibility is removed;
- the normal Storybook behavior corpus runs in Chromium;
- the database native-table virtualization behavior proof additionally runs only in the dedicated `firefox-virtualization-capability` project because dynamic native-table measurement is the confirmed engine-specific risk;
- `playwright.lanes.test.ts` machine-guards the Chromium inheritance plus the Firefox project name, exact virtualization membership, Firefox engine, and non-broad scope;
- generic and exceptional browser-integration remain disjoint behind one public type with central exceptional membership validation;
- unit uses Vitest-native changed/related selection with safe fallback;
- mutation uses one explicit four-target registry with status-aware deleted/renamed infrastructure impact;
- ordinary E2E remains structural page/widget ownership, with `dependency-cruiser` only for production reachability;
- the integrated database virtualization E2E lives at `tests/e2e/widgets/DocumentView/databaseVirtualizationFlows.e2e.spec.ts` and is applicable to desktop and mobile;
- productionArtifact E2E and managed-update browser proof retain their special execution semantics behind the public types;
- E2E structural/inventory/graph validation remains behind the accepted relevance gate;
- verifier-managed Playwright remains container-only;
- performance inventory remains intentionally empty;
- top-level/expensive locks, status/resume, logging, timeout, profile/base/fix, and fail-on-flaky semantics remain preserved;
- develop aggregate CI requires static/unit/mutation, E2E, browser-integration, behavior, and visual; main release CI runs `pnpm verify --full`.

## Develop integration review result

The merge preserved both the verify redesign and PR #217 database virtualization work:

- `@tanstack/vue-virtual` and `dependency-cruiser` both remain in package/lock state;
- target-only virtualization behavior specs replaced the new `*.browser.spec.ts` files from `develop`;
- the database virtualization E2E was migrated into the structural `DocumentView` owner tree with `both` project applicability;
- database property/query E2E and shared helper changes from `develop` remain present;
- `E2E_SCENARIO_SCOPES` and root ordinary E2E ownership were not restored;
- the independent browser-integration CI lane and aggregate requirement remain intact.

The two post-merge review findings are resolved:

1. `playwright.lanes.test.ts` now deterministically guards the accepted dedicated Firefox virtualization project contract. Focused unit verification passed.
2. The coding agent completed the mandatory cumulative branch handoff gate exactly as `pnpm verify --base origin/develop`; all 20 selected checks passed cleanly with no retry/flaky acceptance.

Root `REVIEW.md` is therefore resolved and removed.

## Verification evidence

Post-merge runtime CI before the final correction already proved frozen install plus static/unit/mutation/visual/behavior and exercised the database virtualization behavior corpus under the dedicated Firefox project. It is historical evidence only because the head moved.

The final coding pass additionally reported:

```text
LOCAL FEEDBACK
pnpm verify --only unit --files playwright.storybook.config.ts playwright.lanes.test.ts
passed

BRANCH VERIFICATION
pnpm verify --base origin/develop
passed — 20 checks, no retry/flaky acceptance
```

The next required proof is one green GitHub CI run on the exact final architect-synchronized head, including:

- `verification-static`;
- `verification-browser (e2e)`;
- `verification-browser (browser-integration)`;
- `verification-browser (behavior)`;
- `verification-browser (visual)`;
- aggregate `verification` / required `verify`;
- `release-version` where applicable.

## Next order of work

1. review GitHub CI on the exact current head;
2. if CI fails because of this PR, route only the concrete failing contract to its truthful owner and require another clean branch handoff after any code correction;
3. if exact-head CI is green and semantic state remains clean, move PR #218 out of draft;
4. issue the final merge-readiness verdict;
5. squash merge into `develop`.

Current merge readiness: **should not merge until blockers are fixed** — the only remaining blocker is exact-head CI / draft readiness, not an active implementation or review finding.
