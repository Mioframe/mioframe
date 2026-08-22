# Verify modernization

Status: **implementation present; application-E2E discovery correction closed; release-impact and exact Vitest-discovery review findings remain open; PR CI pending**.

Current finish branch: `refactor/verify-modernization-finish`.

Synchronized `develop` baseline: `13ae220900a2a724c867b01b5eb1f045c2a1d857`.

This document records the current verifier-modernization implementation shape, representative benchmark, accepted corrections, and remaining finish work. It is not a substitute for the canonical architecture documents.

## Authority

- `docs/testing/architecture.md` — project-wide testing policy;
- `docs/testing/verify-target-architecture.md` — verifier impact/planning architecture;
- `docs/testing/verify-agent-output.md` — agent-facing output contract;
- `docs/testing/verify-change-classification.md` — repository metadata classification;
- `docs/testing/verify-unit-impact-correction.md` — unit-impact ownership amendment;
- `docs/testing/verify-app-e2e-discovery-correction.md` — implemented physical application-E2E discovery correction;
- `docs/testing/verify-finish-plan.md` — current correction/integration order;
- `scripts/lib/REVIEW.md` — active remaining source-level findings;
- `.agents/skills/verification/SKILL.md` — verifier workflow.

## Goal

`pnpm verify` selects the smallest reliable proof while remaining fail-closed for uncertain impact:

```text
known irrelevant change
→ skip

known affected contract
→ focused proof

unknown significant impact
→ full affected lane / invalid

normal agent-facing run
→ bounded progress + bounded actionable result
→ detailed diagnostics in logs / --verbose

explicit full/release request
→ complete project/release gate
```

Exact-head GitHub CI remains the authoritative automatic merge gate.

## Implemented architecture

### Pass A — bounded output

Implemented:

- child stdout/stderr captured under `.verify/logs/**` by default;
- compact running/completion lines;
- bounded heartbeat with verifier-owned liveness only;
- failure reason prefers verifier-owned invalid/blocking/timeout facts and otherwise the exit code;
- exact log/rerun pointer retained;
- `--verbose` changes presentation only.

No active review finding currently reopens Pass A.

### Pass B — repository metadata classification

`isNonRuntimeRepositoryMetadataPath()` is a narrow positive fact. Confirmed metadata includes `AGENTS.md`, `.agents/**`, `docs/testing/**`, and `src/shared/ui/material/docs/**`.

Runtime Markdown remains runtime-owned:

- `docs/user/**` → Help;
- `PRIVACY.md` → privacy content.

There is no global Markdown exclusion.

### Pass C — unit impact

Owner: `scripts/lib/unitRisk.ts`.

Current mechanisms:

1. direct changed Vitest test;
2. ordinary module/support input delegated to `vitest related`;
3. exact non-import repository input;
4. runtime/tool-discovered external input;
5. bounded repository scan ownership;
6. exact existence/absence ownership;
7. unit-global/status-unsafe full fallback.

Exact external ownership is additive and status-aware for add/modify/delete/rename. The verifier does not build a second import graph.

Known bounded scan owners include the source import-boundary tests, Material renderer/token scans, Playwright lane inventory, app-E2E registry/applicability inventory, Storybook behavior inventory, and visual colocated inventory.

#### Closed physical-discovery correction

The application Playwright lane is now physically root-only:

```text
tests/e2e/*.spec.ts
```

`playwright.config.ts` enforces this with:

```text
testDir: ./tests/e2e
testMatch: **/tests/e2e/*.spec.ts
```

Project `testIgnore` now owns only desktop/mobile applicability; redundant Storybook/visual/release subtree ignores were removed.

A fresh independent real-collector proof invokes Playwright `--list` against the real config. Pre-fix RED collected both a nested `tests/e2e/other/example.spec.ts` probe and a root `tests/e2e/example.test.mjs` probe. Post-fix GREEN collects `appSmoke.spec.ts` and excludes both probes plus existing Storybook/visual/release specs.

Therefore the root-only E2E scenario/applicability inventories and `playwright.lanes.test.ts` root application scan now match physical Playwright collection rather than merely agreeing locally.

#### Remaining Pass C review finding

Direct Vitest test discovery still needs one local correction: `isTestShapedPath()` must exactly match the real `vitest.config.ts` include matrix. In particular, `src/**/*.test.mjs` and `config/**/*.test.mjs` must not be treated as direct Vitest tests.

### Pass D — mutation

Owner: `scripts/lib/mutationTargets.ts`.

Mutation is explicit high-risk opt-in. One registry is shared by verifier planning and Stryker configuration. Registered source/owning-test changes select exact targets; unregistered adjacency does not create mutation work; full/release verification does not automatically add mutation.

No active review finding currently reopens Pass D.

### Pass E — release impact

Owner: `scripts/lib/releaseRisk.ts`.

Six source-impact contracts remain:

```text
release-config
build
publisher-node-import
artifact
release-smoke
managed-updates
```

`release-version` is independent PR/release policy.

The current release planner remains **under correction** after PR-level review. `scripts/lib/REVIEW.md` records the active consumer-model blocker: release execution infrastructure is incompletely owned, while some Vitest/type-only files are over-selected. Pass E benchmark rows are therefore provisional until that correction is closed.

### Pass F — CI integration

Implemented topology remains:

```text
autofix
   ├─ verification-static
   ├─ verification-browser-e2e
   ├─ verification-storybook-browser / storybook-behavior
   ├─ verification-storybook-browser / visual
   ├─ verification-release
   └─ release-version
```

`verification-release` starts directly after `autofix` and runs `pnpm verify --verbose --only release-impact`. Aggregate implementation verification requires it; `release-version` remains separate.

The outer release-impact job timeout is 120 minutes, above the current verifier-owned sequential command envelope. No cross-job build artifact was introduced.

## Representative benchmark

Planner timing below is historical local resolver timing from the final pre-review benchmark; it is not CI wall-clock time. Rows affected by the active release consumer correction must be refreshed after Pass E is fixed.

| Case | Unit | Visual | App E2E | Storybook behavior | Mutation | Release | Local planner time |
| --- | --- | --- | --- | --- | --- | --- | ---: |
| `AGENTS.md` | skip | skip | skip | skip | skip | skip | ~14ms |
| unclassified `src/shared/ui/Example/README.md` | skip | full | full | skip | skip | skip | ~6ms |
| local entity source | focused + scan owners | skip | full | skip | skip | skip | ~6ms |
| `PRIVACY.md` | focused privacy owner | skip | skip | skip | skip | skip | ~6ms |
| deleted ordinary source | full status-safe fallback | skip | full | skip | skip | skip | ~5ms |
| feature source | focused + scan owners | skip | focused product E2E | skip | skip | skip | ~5ms |
| Material component | focused | focused visual | full | focused behavior | skip | skip | ~5ms |
| Material tokens CSS | focused + token scan | focused visual | full | focused behavior | skip | skip | ~6ms |
| registered mutation source | focused | skip | full | focused behavior | focused exact | skip | ~5ms |
| unregistered adjacent source | focused | skip | focused product E2E | skip | skip | skip | ~6ms |
| `src/sw.ts` | focused | skip | full | skip | skip | focused artifact + managed-updates | ~5ms |
| `pnpm-lock.yaml` | full | full | full | full | skip | full six checks | ~3ms |
| verifier tooling `scripts/verify.ts` | focused | full | full | full | skip | full six checks | ~3ms |
| `postcss.config.js` | focused; real related owner | skip | skip | skip | skip | skip | ~6ms |
| `eslint.config.mjs` | focused + runtime-discovered owner | skip | skip | skip | skip | skip | ~5ms |
| root app `tests/e2e/appSmoke.spec.ts` | focused inventory owners; spec never ordinary Vitest input | skip | focused direct spec | skip | skip | skip | ~6ms |
| forbidden legacy tokens path | focused existence + scan owners | full | full | skip | skip | skip | ~5ms |
| `vite.config.ts` | focused + direct-read owner; real import owner retained | full | full | skip | skip | full six checks (provisional pending Pass E correction) | ~5ms |

### Real delegated-resolver evidence

Confirmed focused unit evidence includes:

- `postcss.config.js` → real `vitest related` selects `config/postcss.config.test.ts`;
- `vite.config.ts` → real related resolution still selects `scripts/release/viteBuildDate.test.mjs` after redundant external metadata removal;
- `eslint.config.mjs` → planner-added `eslint.config.test.ts` executes despite no ES import;
- `.github/workflows/verify.yml` → all confirmed direct owners execute;
- feature source → feature boundary scan owner executes additively;
- Material component tokens → ordinary import owner + token scan owner execute;
- `tests/e2e/appSmoke.spec.ts` → unit invocation selects only the lane/E2E inventory owners and remains green;
- post-sync directory-state source → ordinary source + applicable boundary scan owners execute.

### Application-E2E physical discovery refresh

The previous hypothetical nested-subtree benchmark is now grounded in real Playwright collection rather than only unit planner output:

| Case | Physical app collection | Unit inventory ownership |
| --- | --- | --- |
| `tests/e2e/appSmoke.spec.ts` | collected | lane + E2E registry/applicability inventory owners |
| temporary `tests/e2e/other/example.spec.ts` | not collected | no root-app inventory owner; never ordinary Vitest input |
| temporary `tests/e2e/example.test.mjs` | not collected by app config | Vitest ownership only according to Vitest include contract |
| existing Storybook/visual/release nested specs | not collected by app config | their own bounded inventory owners only |

Pre-fix real collector RED reported both temporary probes as collected; post-fix collector GREEN excludes them. This closes the application-E2E silent-inventory gap.

### Status-aware exact ownership refresh

Previously confirmed cases remain valid:

- deleted `.github/workflows/verify.yml` retains all surviving exact owners;
- rename `PRIVACY.md → PRIVACY.archived.md` retains the old-path privacy owner;
- deleted/renamed `.gitignore` retains `scripts/agentEnvironment.test.mjs`;
- unsafe ordinary source deletion/rename still fails closed to full unit.

## Current accepted / provisional selection

Accepted:

- conservative full impact for lockfile/verifier infrastructure where execution semantics are broad;
- real repository scan owners select their actual scanned population;
- root application specs select their app inventory proof in addition to browser proof;
- arbitrary nested `tests/e2e/<other-subtree>/*.spec.ts` is neither app-collected nor attributed to the root application inventory;
- forbidden legacy token-path changes retain exact existence proof.

Provisional pending Pass E correction:

- release selections for release runner/config/proof-only/type-only files;
- any benchmark claim that Pass E has no known false positive/negative.

## Remaining finish work

1. Close the release-impact consumer-model blocker in `scripts/lib/REVIEW.md`.
2. Make direct Vitest test discovery exactly match `vitest.config.ts`.
3. Clean stale temporary-review/RED comments and inaccurate visual TSDoc without changing behavior.
4. Architect refreshes only benchmark rows invalidated by those corrections.
5. Run one full semantic PR-level diff review.
6. Remove resolved `REVIEW.md` artifacts.
7. Publish PR and inspect exact-head CI.
8. Record actual CI critical path / merge latency and give merge-readiness verdict.

## CI critical path / merge latency

**Pending exact-head PR CI.**

No final CI wall-clock claim is made before the published final head runs.

## Stop rule

Verifier modernization stops only after the remaining semantic findings are closed, the final benchmark matches the resulting tree, the full PR-level review is clean, and exact-head CI succeeds. Further infrastructure/parallelism/sharding/task-runner work then requires a separate measured need.