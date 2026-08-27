# Verify redesign — current architect handoff

## Current state

Branch: `architecture/verify-redesign`

PR: #218 — `refactor(testing): redesign verification ownership` (base `develop`).

PR #218 remains **draft** and is **blocked by the post-develop integration review**.

The complete scripts-owned verify redesign was architect-accepted through:

- `c42cc1a09bdfee2c07f88412ee4c87951dfb3a43`.

The develop workflow correction was architect-accepted through:

- `32af5521b271de1fca4f94740572afa70b4900ec`.

Current-facing documentation and verification skills were synchronized with the executable target model before the latest `develop` integration.

Current `develop` integration:

- merged `develop` commit: `9dd19ed320ce227e915a824b5552af16108a5a10`;
- two-parent merge commit: `b6125cf2ce3c976402e269b117546a923eaa654f`;
- CI autofix follow-up after the merge: `1c96158a869b2f60d8e7283d786d173797e18b74`.

The branch is no longer behind `develop`.

Current bounded coding-agent assignment:

- `docs/testing/verify-redesign-post-merge-correction-agent-task.md`.

The repository was prepared for this assignment through architect-owned documentation commits ending at the current handoff-preparation head. The coding agent should start from the latest branch head, not from an earlier merge/CI head.

This task owns only the missing deterministic Firefox project configuration guard plus the mandatory cumulative coding-agent branch handoff proof. It does not reopen verifier architecture, Storybook runtime topology, E2E ownership, browser-integration ownership, or CI topology.

## Accepted implementation state

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

Accepted invariants remain:

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

The latest `develop` also adds a durable coding-agent handoff rule: ordinary PR code work must finish with one cumulative branch-diff verification using the agent's normal local profile:

```bash
pnpm verify --base origin/develop
```

This is separate from exact-head GitHub CI and does not restore `verify:release`, private `--only` labels, or `--full` as the ordinary PR handoff gate.

## Develop integration result

The merge conflict resolution preserves both the accepted verify redesign and the product/test changes from `develop`:

- root `AGENTS.md` and `.agents/skills/verification/SKILL.md` combine the eight-type public contract with the new mandatory branch-diff handoff gate;
- `scripts/lib/e2eRisk.ts` and its tests preserve the structural PR #218 planner rather than restoring `E2E_SCENARIO_SCOPES` or root-E2E mappings;
- `@tanstack/vue-virtual` and `dependency-cruiser` both remain in the final package/lock state, `test:browser-integration` remains, and `verify:release` remains removed;
- the new virtualization Storybook proofs were migrated to `*.behavior.spec.ts`; no ordinary `*.browser.spec.ts` discovery was restored;
- `playwright.storybook.config.ts` keeps the owner-local behavior corpus in Chromium and the database virtualization capability additionally in the dedicated `firefox-virtualization-capability` project because dynamic native-table measurement is the confirmed engine-specific risk;
- the new database virtualization product E2E was migrated to `tests/e2e/widgets/DocumentView/databaseVirtualizationFlows.e2e.spec.ts` with applicability `both`;
- behavioral changes from the `develop` database property/query E2E and shared E2E helpers are present in their structural target files;
- the independent develop CI browser-integration lane and aggregate requirement remain intact.

The Firefox exception above is an accepted post-merge integration requirement. The root Playwright configuration contract test must explicitly guard that dedicated project and its exact database virtualization membership so future discovery/config refactors cannot silently remove the engine-specific proof.

## Post-develop integration review

Active review state is owned by root `REVIEW.md`.

### B1 — required coding-agent branch handoff evidence is missing

The conflict-resolution coding agent could not execute any `pnpm` verifier command in its sandbox because pnpm attempted to open its dependency-sync database under `/hoore/v11`, outside the writable sandbox, and failed with `[ERR_SQLITE_ERROR] unable to open database file`.

Therefore the newly required cumulative handoff command has **not** been proven clean:

```bash
pnpm verify --base origin/develop
```

This is an environment/proof blocker, not current evidence of a repository defect. It still must be satisfied from a coding environment that can run the canonical command before merge readiness can be approved.

### M1 — Firefox virtualization project lacks a configuration regression guard

`playwright.storybook.config.ts` currently contains the correct dedicated Firefox project and exact renamed behavior spec. Exact-head behavior CI also exercised that project successfully. However, `playwright.lanes.test.ts` only guards the top-level behavior discovery and does not assert the dedicated Firefox project/name/engine/exact membership.

The smallest required correction is a config-contract assertion in the existing Playwright lane test. Do not add another registry or change runtime discovery.

The active coding task for both findings is:

- `docs/testing/verify-redesign-post-merge-correction-agent-task.md`.

## CI evidence after the develop merge

Run `33064072119` on autofixed merge head `1c96158a869b2f60d8e7283d786d173797e18b74` is useful post-merge evidence but cannot be final merge proof because active review findings remain and the head will move for their correction.

Confirmed from that run before this review-state update:

- frozen `pnpm install` succeeded with both `@tanstack/vue-virtual` and `dependency-cruiser`;
- static, unit, mutation, visual, release-version, and behavior passed;
- behavior ran **191/191** tests successfully, including the database virtualization behavior corpus under the dedicated Firefox project;
- browser-integration and E2E were still running when the review state was finalized.

Historical pre-merge CI is not merge proof for the integrated branch.

## Next order of work

1. coding agent executes `docs/testing/verify-redesign-post-merge-correction-agent-task.md` from the latest `architecture/verify-redesign` head;
2. the expected code change is only the deterministic `playwright.lanes.test.ts` Firefox project guard;
3. coding agent runs focused unit verification, then the mandatory cumulative `pnpm verify --base origin/develop` branch gate and resolves only concrete PR-caused in-contract failures if any;
4. architect re-reviews the complete post-merge PR and removes `REVIEW.md` only when both findings are resolved;
5. require green GitHub CI on the exact corrected final head, including browser-integration and aggregate `verify`;
6. move PR #218 out of draft;
7. issue the final merge-readiness verdict;
8. squash merge into `develop`.

Current merge readiness: **should not merge until blockers are fixed**.
