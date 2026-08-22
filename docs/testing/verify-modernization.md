# Verify modernization

Status: **implementation present; application-E2E and release-impact corrections closed; exact Vitest-discovery and final comment/TSDoc findings remain open; PR CI pending**.

Current finish branch: `refactor/verify-modernization-finish`.

Synchronized `develop` baseline: `13ae220900a2a724c867b01b5eb1f045c2a1d857`.

This document records the current verifier-modernization implementation shape, representative benchmark, accepted corrections, and remaining finish work. Canonical architecture remains in the documents listed below.

## Authority

- `docs/testing/architecture.md` — project-wide testing policy;
- `docs/testing/verify-target-architecture.md` — verifier impact/planning architecture;
- `docs/testing/verify-agent-output.md` — agent-facing output contract;
- `docs/testing/verify-change-classification.md` — repository metadata classification;
- `docs/testing/verify-unit-impact-correction.md` — unit-impact ownership amendment;
- `docs/testing/verify-app-e2e-discovery-correction.md` — implemented physical application-E2E correction;
- `docs/testing/verify-release-impact-correction.md` — implemented Pass E consumer-model correction;
- `docs/testing/verify-finish-plan.md` — current remaining integration order;
- `scripts/lib/REVIEW.md` — active remaining findings;
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

## Pass status

### Pass A — bounded agent-facing output

Implemented and not reopened by current review.

- normal child output is captured under `.verify/logs/**`;
- progress/completion output is bounded;
- long-running heartbeat carries verifier-owned liveness only;
- failure reason prefers verifier-owned invalid/blocking/timeout facts and otherwise exact exit code;
- detailed output remains available in logs and `--verbose`.

### Pass B — repository metadata classification

Implemented and not reopened.

`isNonRuntimeRepositoryMetadataPath()` is a narrow positive fact. Runtime Markdown such as `PRIVACY.md` and `docs/user/**` remains runtime-owned; there is no global Markdown exclusion.

### Pass C — unit impact

Owner: `scripts/lib/unitRisk.ts`.

Implemented mechanisms:

1. direct changed Vitest test;
2. ordinary source/support input delegated to `vitest related`;
3. exact external file-as-data ownership;
4. runtime/tool-discovered ownership;
5. bounded repository-scan ownership;
6. exact existence/absence ownership;
7. unit-global/status-unsafe fallback.

External ownership remains additive and status-aware across add/modify/delete/rename. The verifier does not build a second import graph.

#### Closed application-E2E physical discovery correction

The application Playwright lane is physically:

```text
tests/e2e/*.spec.ts
```

`playwright.config.ts` enforces this through root-only `testMatch`; project `testIgnore` owns only desktop/mobile applicability.

A real Playwright `--list` proof established:

- pre-fix RED: nested `tests/e2e/other/example.spec.ts` and root `tests/e2e/example.test.mjs` probes were collected;
- post-fix GREEN: `appSmoke.spec.ts` is collected; both probes and Storybook/visual/release nested specs are not.

Root application scenario/applicability inventories and their bounded unit ownership therefore match physical discovery.

#### Remaining Pass C finding

`isTestShapedPath()` still needs one local correction so direct Vitest test discovery exactly matches `vitest.config.ts`; specifically `src/**/*.test.mjs` and `config/**/*.test.mjs` must not be treated as direct Vitest tests.

### Pass D — mutation ownership

Implemented and not reopened.

Mutation is explicit high-risk opt-in through one registry shared by verifier planning and Stryker. Registered source/owner changes select exact targets; unregistered adjacency does not create mutation work.

### Pass E — release impact

Owner: `scripts/lib/releaseRisk.ts`.

**Consumer-model correction is closed and architect-reviewed.**

Six source-impact checks remain:

```text
release-config
build
publisher-node-import
artifact
release-smoke
managed-updates
```

`release-version` remains independent policy.

The closed correction audited outward from the six real `RELEASE_CHECK_COMMANDS` and established exact/fallback ownership rather than inferring by directory or adjacency.

Confirmed exact browser release execution ownership:

```text
scripts/e2eReleaseContainer.mjs
scripts/playwrightContainer.ts
playwright.release.config.ts
scripts/release/artifactServer.mjs
tests/e2e/helpers.ts
→ artifact + release-smoke + managed-updates
```

`buildArtifact.mjs` remains:

```text
build + artifact + release-smoke + managed-updates
```

Publisher seam:

```text
publisherWireContractImportProof.mjs
→ publisher-node-import

releasePublish.mjs
releaseDescriptor.mjs
releaseWireContract.ts
→ publisher-node-import + managed-updates
```

Proof/type-only corrections:

- ordinary `*.test.mjs` / `*.test.ts` proof does not inherit release ownership;
- release fixture `*.d.mts` declarations do not trigger runtime release proof;
- `scripts/pages/lib/**/*.test.mjs` is excluded before the broad runtime fallback;
- unknown significant runtime under confirmed release-sensitive boundaries remains fail-closed.

Exact mapping validation now rejects empty source, empty checks, duplicate source registration, and missing exact sources before planning.

Fresh test-author proof reported 27 failing cases before implementation and a focused final run with 259 assertions green. Focused type-check also passed.

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

`verification-release` starts directly after `autofix` and runs `pnpm verify --verbose --only release-impact`; aggregate verification requires it. `release-version` remains separate.

No cross-job artifact transfer or additional release job was introduced.

## Representative benchmark

Planner timing below is historical local resolver timing, not CI wall-clock time. Rows affected by the remaining direct-Vitest-discovery correction must be refreshed after that correction; release rows below reflect the closed Pass E architecture.

| Case | Unit | Visual | App E2E | Storybook behavior | Mutation | Release |
| --- | --- | --- | --- | --- | --- | --- |
| `AGENTS.md` | skip | skip | skip | skip | skip | skip |
| source-adjacent unknown Markdown | skip | full | full | skip | skip | skip |
| local entity source | focused + scan owners | skip | full | skip | skip | skip |
| `PRIVACY.md` | focused privacy owner | skip | skip | skip | skip | skip |
| deleted ordinary source | full status-safe fallback | skip | full | skip | skip | skip |
| feature source | focused + scan owners | skip | focused product E2E | skip | skip | skip |
| Material component | focused | focused visual | full | focused behavior | skip | skip |
| Material tokens CSS | focused + token scan | focused visual | full | focused behavior | skip | skip |
| registered mutation source | focused | skip | full | focused behavior | focused exact | skip |
| unregistered adjacent source | focused | skip | focused product E2E | skip | skip | skip |
| `src/sw.ts` | focused | skip | full | skip | skip | artifact + managed-updates |
| `pnpm-lock.yaml` | full | full | full | full | skip | full six |
| verifier tooling `scripts/verify.ts` | focused | full | full | full | skip | full six |
| `postcss.config.js` | focused, real related owner | skip | skip | skip | skip | skip |
| `eslint.config.mjs` | focused + runtime-discovered owner | skip | skip | skip | skip | skip |
| root app `tests/e2e/appSmoke.spec.ts` | focused inventory owners | skip | focused direct spec | skip | skip | skip |
| `scripts/e2eReleaseContainer.mjs` | ordinary unit ownership as applicable | n/a | n/a | n/a | skip | artifact + release-smoke + managed-updates |
| `scripts/playwrightContainer.ts` | ordinary unit ownership as applicable | n/a | n/a | n/a | skip | artifact + release-smoke + managed-updates |
| `playwright.release.config.ts` | ordinary unit/config ownership as applicable | n/a | n/a | n/a | skip | artifact + release-smoke + managed-updates |
| `scripts/release/artifactServer.mjs` | ordinary unit ownership as applicable | n/a | n/a | n/a | skip | artifact + release-smoke + managed-updates |
| `tests/e2e/helpers.ts` | ordinary unit ownership as applicable | n/a | application consumers as separately owned | n/a | skip | artifact + release-smoke + managed-updates |
| `scripts/release/validateReleaseConfig.test.mjs` | direct Vitest proof | n/a | n/a | n/a | skip | skip |
| `scripts/pages/lib/ghPagesBranch.test.mjs` | direct Vitest proof | n/a | n/a | n/a | skip | skip |
| release fixture `*.d.mts` declaration | static/type ownership | n/a | n/a | n/a | skip | skip |
| unknown executable release fixture | ordinary ownership as applicable | n/a | n/a | n/a | skip | full six |

### Real delegated-resolver evidence retained

Previously confirmed unit cases remain valid:

- `postcss.config.js` → real `vitest related` selects `config/postcss.config.test.ts`;
- `vite.config.ts` → real related resolution selects `scripts/release/viteBuildDate.test.mjs` after redundant external mapping removal;
- `eslint.config.mjs` → explicit runtime-discovered owner executes;
- `.github/workflows/verify.yml` → confirmed direct owners execute;
- feature source → feature boundary scan owner executes additively;
- Material tokens → ordinary import owner + token scan owner execute;
- `tests/e2e/appSmoke.spec.ts` → lane/E2E inventory owners only, not the Playwright spec as an ordinary Vitest input.

## Remaining finish work

1. Correct direct Vitest test-shape discovery to match `vitest.config.ts` exactly.
2. Remove stale temporary-review/RED comments and correct inaccurate visual TSDoc without changing behavior.
3. Architect refreshes only benchmark/status text invalidated by that final correction.
4. Run one full semantic PR-level diff review.
5. Remove resolved `REVIEW.md` artifacts.
6. Compare branch with current `develop` and integrate if needed.
7. Publish PR and inspect exact-head CI.
8. Record actual CI critical path / merge latency.
9. Give merge-readiness verdict.

## CI critical path / merge latency

**Pending exact-head PR CI.**

No final wall-clock claim is made before the published exact head runs.

## Stop rule

Verifier modernization stops when the remaining semantic findings are closed, the benchmark matches the resulting tree, the full PR-level review is clean, and exact-head CI succeeds. Further infrastructure, parallelism, sharding, task runners, dependency graphs, or permanent benchmark systems require a separate measured need.