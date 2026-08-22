# Verify modernization

Status: **implementation complete; semantic review complete; exact-head PR CI pending**.

Current finish branch: `refactor/verify-modernization-finish`.

Synchronized `develop` baseline: `13ae220900a2a724c867b01b5eb1f045c2a1d857`.

This document is the final-state record for the verifier-modernization program. Historical correction rounds and temporary review artifacts are intentionally not part of the durable contract. Architecture details remain owned by the canonical documents listed below; this file records the resulting implementation shape, representative benchmark, and stop decision.

## Authority

- `docs/testing/architecture.md` — canonical project-wide testing policy;
- `docs/testing/verify-target-architecture.md` — resolved verifier impact/planning architecture;
- `docs/testing/verify-agent-output.md` — agent-facing output contract;
- `docs/testing/verify-change-classification.md` — repository metadata/change-classification contract;
- `docs/testing/verify-unit-impact-correction.md` — final unit-impact ownership amendment;
- `docs/testing/verify-finish-plan.md` — finish packaging and pass order;
- `.agents/skills/verification/SKILL.md` — verifier workflow and verification ownership.

## Goal

`pnpm verify` should be fast enough for focused implementation feedback while remaining fail-closed for uncertain impact.

```text
known irrelevant change
→ skip

known affected contract
→ focused proof

unknown but potentially significant impact
→ full affected lane / invalid

normal agent-facing execution
→ bounded progress + bounded actionable result
→ detailed diagnostics in logs / --verbose

explicit full/release request
→ complete project/release proof
```

The same impact semantics serve local focused feedback and exact-head GitHub CI. Coding/test agents own implementation and task-specific proof; the architect owns PR publication, exact-head CI inspection, semantic review, and merge readiness.

For CI performance, optimize merge critical path before aggregate compute. Independent proof owners stay parallel unless measured evidence justifies serialization.

## Completed foundations

### V1 — native TypeScript verifier

Complete. Verifier entry points run under the repository Node/TypeScript contract with established planning, locking, failure handling, timing, and `.verify/logs/**` persistence.

### V2 — planner precision

Complete.

- application E2E uses explicit product-scenario ownership with fail-closed full fallback;
- visual planning distinguishes owner-local focused proof from broad fallback;
- planner results use explicit `skip | focused | full | invalid` semantics;
- confirmed non-runtime repository metadata no longer inherits browser proof merely because of directory location;
- runtime Markdown such as `PRIVACY.md` and `docs/user/**` remains runtime-owned.

### V3 — execution/proof cost

Complete for the modernization scope.

Application E2E project applicability and Storybook/visual ownership reduce redundant browser execution while keeping the behavior and visual lanes independent in CI.

PR #213 (`9427fa4aea0b4fea0c72ea4ef4dd8d94711d6121`) established the latest pre-finish Lists/browser baseline:

```text
visual Playwright executions: 201 → 87
visual + Storybook browser executions: 277 → 221

Application E2E: ~8m22s verifier lane
Storybook behavior: ~4m22s verifier lane
Visual: ~5m30s verifier lane
Storybook static build inside a browser lane: ~2m17s
```

These are historical measured baselines, not claims about final PR CI latency.

## Finish implementation A–G

One branch / one PR contains the following bounded passes:

```text
Pass A — bounded agent-facing output
Pass B — repository metadata/change classification
Pass C — durable unit impact
Pass D — explicit mutation ownership
Pass E — release impact planning
Pass F — exact-head CI integration
Pass G — representative benchmark / finish validation
```

### Pass A — bounded agent-facing output

Implemented contract:

- normal child stdout/stderr stays in `.verify/logs/**`;
- normal output shows compact check progress and a bounded long-check heartbeat;
- heartbeat contains verifier-owned liveness only and never repeats arbitrary child output;
- failure summary prefers verifier-owned blocking/invalid/timeout facts and otherwise reports the exit code;
- detailed raw output remains in the exact log and opt-in `--verbose` mode;
- success output remains compact.

No arbitrary output-tail inference is used as a default failure reason.

### Pass B — repository metadata/change classification

`isNonRuntimeRepositoryMetadataPath()` is a narrow positive fact used only where browser lane ownership would otherwise be inherited too broadly.

Confirmed metadata:

- any `AGENTS.md`;
- `.agents/**`;
- `docs/testing/**`;
- `src/shared/ui/material/docs/**`.

Not globally classified as metadata:

- arbitrary source-adjacent `README.md`, `ARCHITECTURE.md`, `DESIGN.md`, or similar Markdown;
- `docs/user/**`;
- `PRIVACY.md`.

There is no global `*.md` exclusion.

### Pass C — durable unit impact

Owner: `scripts/lib/unitRisk.ts`.

The final model separates **Vitest test discovery** from **Vitest dependency-input eligibility** and uses seven ownership mechanisms:

1. direct changed Vitest test;
2. ordinary import/module ownership delegated to `vitest related`;
3. exact non-import repository input ownership;
4. runtime/tool-discovered ownership;
5. bounded repository-scan ownership;
6. exact existence/absence ownership;
7. unit-global/status-unsafe fallback.

Ordinary current-tree source/support inputs are repository-wide by supported file shape. The verifier does not build or persist a second module graph.

Exact external ownership is additive and status-aware:

- added/modified fixed-path inputs select their exact owners;
- deleted fixed-path inputs still select surviving owners;
- renames evaluate both old and new path contracts;
- source existence is not required merely to recognize a deterministic fixed-path owner.

Bounded scan ownership mirrors the owning test's real population. Current scan owners include:

- `src/readRecoveryImportBoundary.test.ts`;
- `src/features/fileSystemAccessImportBoundary.test.ts`;
- `src/shared/ui/material/rendererBoundary.test.ts`;
- `src/shared/ui/material/foundation/tokens.test.ts` component-token scan;
- `playwright.lanes.test.ts`;
- `scripts/lib/e2eRisk.test.ts`;
- `scripts/lib/e2eProjectApplicability.test.ts`;
- `scripts/lib/storybookBehaviorRisk.test.ts`;
- `scripts/lib/visualRisk.test.ts`.

The `playwright.lanes.test.ts` inventory is deliberately narrower than the general Playwright-only exclusion predicate. It owns exactly:

- direct `tests/e2e/*.spec.ts` application specs;
- `tests/e2e/storybook/**/*.spec.ts`;
- `tests/e2e/visual/**/*.spec.ts`;
- `tests/e2e/release/**/*.spec.ts`;
- `src/**/*.browser.spec.ts`;
- `src/**/*.visual.spec.ts`.

A hypothetical `tests/e2e/other/example.spec.ts` remains Playwright-only proof for ordinary-Vitest exclusion, but it is **not** attributed to `playwright.lanes.test.ts` because that test does not enumerate that subtree.

Post-sync semantic audit result: **new external relations: none**.

The synchronized directory/repository-state implementation introduced no new external repository-observation mechanism requiring an exact mapping or bounded scan owner.

### Pass D — explicit mutation ownership

Owner: `scripts/lib/mutationTargets.ts`.

Mutation testing is explicit high-risk opt-in, not adjacency inference.

Each registry entry has:

- exact mutable source;
- exact owning unit proof;
- concrete high-risk reason.

Current accepted registry contains seven audited targets. A registered source or owning test selects the exact mutation source; unregistered adjacency skips mutation. Registry/Stryker semantic changes revalidate all registered targets or fail invalid. Full/release verification does not automatically add mutation.

### Pass E — source-impact release planning

Owner: `scripts/lib/releaseRisk.ts`.

The source-impact release checks are:

```text
release-config
build
publisher-node-import
artifact
release-smoke
managed-updates
```

`release-version` remains separate PR/release policy and is not inferred from changed source.

Known release ownership selects the smallest confirmed checks. Unknown significant changes inside a confirmed release-sensitive boundary fail closed to all six source-impact checks. Runtime/unknown `package.json` and `pnpm-lock.yaml` remain conservative; version-only `package.json` does not create source-impact release work.

The proven publisher chain remains:

```text
scripts/pages/lib/releasePublish.mjs
→ scripts/pages/lib/releaseDescriptor.mjs
→ src/shared/service/appUpdate/releaseWireContract.ts
```

### Pass F — exact-head CI integration

Implementation verification remains parallel after `autofix`:

```text
autofix
   ├─ verification-static
   ├─ verification-browser-e2e
   ├─ verification-storybook-browser / storybook-behavior
   ├─ verification-storybook-browser / visual
   ├─ verification-release
   └─ release-version
```

`verification-release` directly follows `autofix` and runs:

```bash
pnpm verify --verbose --only release-impact
```

The aggregate `verification` job requires static, E2E, Storybook browser, and release-impact lanes. `release-version` remains an independent merge gate.

The release-impact job timeout is 120 minutes. The verifier-owned sequential timeout envelope for a worst-case full source-impact selection is approximately 103 minutes (`build` 10m + `artifact` 8m + `release-smoke` 17m + `managed-updates` 68m), leaving an outer allowance for checkout/install/setup rather than allowing GitHub to terminate a healthy run before verifier-owned timeout handling.

No cross-job build artifact is introduced by this finish scope.

## Pass G — final representative benchmark

The following table records the final planner result for the canonical representative classes plus the distinct Pass C ownership mechanisms. Planner timing is the measured local resolver time recorded during the final benchmark. It is not CI wall-clock time.

| Case | Unit | Visual | App E2E | Storybook behavior | Mutation | Release | Local planner time |
| --- | --- | --- | --- | --- | --- | --- | ---: |
| `AGENTS.md` | skip | skip | skip | skip | skip | skip | ~14ms |
| unclassified `src/shared/ui/Example/README.md` | skip | full | full | skip | skip | skip | ~6ms |
| local entity `src/entities/document/model/document.ts` | focused: source + scan owners | skip | full | skip | skip | skip | ~6ms |
| file-as-data `PRIVACY.md` | focused: privacy-pane owner | skip | skip | skip | skip | skip | ~6ms |
| deleted ordinary source `src/entities/foo/foo.ts` | full status-safe fallback | skip | full | skip | skip | skip | ~5ms |
| feature `src/features/documentCreate/index.ts` | focused: source + scan owners | skip | focused: `repositoryFlows.spec.ts` | skip | skip | skip | ~5ms |
| Material `MDButton.vue` | focused: source + scan owner | focused visual | full | focused behavior | skip | skip | ~5ms |
| Material `button/tokens.css` | focused: source + component-token scan owner | focused visual | full | focused behavior | skip | skip | ~6ms |
| registered mutation `reorderArray.ts` | focused | skip | full | focused behavior | focused exact source | skip | ~5ms |
| unregistered adjacent `reorderGestureProfile.ts` | focused | skip | focused product E2E | skip | skip | skip | ~6ms |
| managed-update/PWA `src/sw.ts` | focused | skip | full | skip | skip | focused: artifact + managed-updates | ~5ms |
| `pnpm-lock.yaml` | full | full | full | full | skip | full six checks | ~3ms |
| verifier tooling `scripts/verify.ts` | focused | full | full | full | skip | full six checks | ~3ms |
| root imported `postcss.config.js` | focused source; real resolver selects `config/postcss.config.test.ts` | skip | skip | skip | skip | skip | ~6ms |
| runtime-discovered `eslint.config.mjs` | focused source + `eslint.config.test.ts` | skip | skip | skip | skip | skip | ~5ms |
| root app inventory `tests/e2e/appSmoke.spec.ts` | focused inventory owners, never the spec itself | skip | focused direct spec | skip | skip | skip | ~6ms |
| added forbidden `src/shared/lib/md/tokens.css` | focused source + existence owner + renderer scan | full | full | skip | skip | skip | ~5ms |
| `vite.config.ts` after redundant mapping removal | focused source + direct-read owner; real resolver still selects `viteBuildDate.test.mjs` | full | full | skip | skip | full six checks | ~5ms |

### Real unit resolver evidence

The unit planner delegates ordinary dependency selection to Vitest, so representative mechanisms were also proven through the real focused verifier rather than planner assertions alone.

Confirmed final cases:

- `postcss.config.js` → real `vitest related` selects `config/postcss.config.test.ts`;
- `vite.config.ts` → after removing the redundant exact owner, real related resolution still selects `scripts/release/viteBuildDate.test.mjs` through its import;
- `eslint.config.mjs` → planner adds `eslint.config.test.ts`, which executes successfully despite no ES import from the test to the config;
- `.github/workflows/verify.yml` → all five confirmed direct owners execute, including `scripts/verify.test.ts`;
- `src/features/documentCreate/index.ts` → the feature boundary scan owner executes additively;
- `src/shared/ui/material/components/button/tokens.css` → both the ordinary import owner and `foundation/tokens.test.ts` scan owner execute;
- `tests/e2e/appSmoke.spec.ts` → focused invocation passes only `playwright.lanes.test.ts`, `scripts/lib/e2eProjectApplicability.test.ts`, and `scripts/lib/e2eRisk.test.ts` to Vitest; all selected owners are green, and the Playwright spec itself never becomes an ordinary Vitest input;
- post-sync `src/shared/service/fileSystem/directoryState.ts` → real invocation keeps ordinary source ownership plus the two applicable boundary scan owners; the recorded run selected 54 Vitest files / 680 tests and passed.

### Status-aware and scan-boundary refresh

Final correction-specific evidence:

| Case | Final unit result | Local planner time |
| --- | --- | ---: |
| deleted `.github/workflows/verify.yml` | focused: all five surviving exact owners | ~1.0ms |
| rename `PRIVACY.md` → `PRIVACY.archived.md` | focused: old-path privacy owner retained | ~0.2ms |
| `tests/e2e/appSmoke.spec.ts` | focused: lane + E2E registry/applicability inventory owners; real invocation green | ~0.2ms |
| hypothetical `tests/e2e/other/example.spec.ts` | unit skip: outside every bounded unit inventory scan; never ordinary Vitest input | ~0.1ms |
| post-sync `src/shared/service/fileSystem/directoryState.ts` | focused: source + `readRecoveryImportBoundary.test.ts` + `rendererBoundary.test.ts` | ~0.1ms |

Deleted/renamed `.gitignore` is covered by deterministic status-aware planner proof and retains `scripts/agentEnvironment.test.mjs` as its surviving exact owner.

## Accepted conservative selection

The final benchmark contains no known silent verifier false negative.

The following conservative selection is intentional:

- `pnpm-lock.yaml` and verifier infrastructure may select full affected lanes because they can change execution/runtime semantics broadly;
- `src/readRecoveryImportBoundary.test.ts` genuinely scans every non-test `src/**/*.{ts,vue}` path;
- `src/shared/ui/material/rendererBoundary.test.ts` genuinely scans `src/**/*.{css,vue,ts,mts,tsx}` outside `src/shared/ui/material/**`;
- Playwright specs **inside the real inventory population of a bounded unit owner** select that inventory test in addition to their browser-lane proof. Root app specs additionally select E2E registry/applicability inventory tests; Storybook/visual colocated specs select their applicable registry/discovery owners;
- arbitrary nested `tests/e2e/<other-subtree>/*.spec.ts` does **not** select `playwright.lanes.test.ts` merely because it is under `tests/e2e/**`; it remains excluded from ordinary Vitest ownership by the separate Playwright-only predicate;
- adding the currently forbidden `src/shared/lib/md/tokens.css` fails closed in visual/application E2E while unit proof narrowly selects its existence/absence owner.

These are either truthful ownership of already-existing scans or intentional fail-closed behavior. No broad selection is retained merely to preserve historical test counts.

## Output and liveness acceptance

Default verifier behavior is bounded:

- routine child output is captured in `.verify/logs/**`;
- long checks emit verifier-owned heartbeat with elapsed time, owned timeout, and exact log path;
- default failure detail reports a trustworthy verifier-owned reason when available, otherwise the exit code;
- raw output is available through the detailed log and `--verbose`;
- focused rerun commands are emitted through the supported verifier CLI.

No retry-pass/flaky result is accepted as green proof.

## CI critical path / merge latency

**Pending exact-head PR CI.**

No final CI wall-clock or merge-latency number is recorded before the PR exists. The architect will record/assess the actual exact-head run rather than extrapolate from local planner timing.

Pass C added only in-process impact-planner work and focused unit ownership; it added no new CI job, browser worker, shard, artifact pipeline, or benchmark infrastructure.

## Exit criterion

Verifier infrastructure modernization stops when all of the following remain true on the final PR head:

1. every expensive proof lane has reliable impact selection;
2. known ownership selects focused proof;
3. proven irrelevant impact skips;
4. unknown significant impact uses full affected lane or invalid;
5. there is no known broad false positive such as `AGENTS.md -> full E2E`;
6. ordinary `pnpm verify` has no known required proof it can silently miss;
7. unit impact uses Vitest related resolution plus explicit external/scan ownership and status-safe fallback;
8. mutation ownership is explicit high-risk opt-in;
9. source-impact release proof is separate from release-version policy;
10. normal output is bounded, live, and actionable;
11. exact-head CI uses the same planner semantics;
12. release impact runs as an independent parallel CI lane;
13. known flakes are absent;
14. the representative benchmark identifies no remaining verifier-infrastructure correctness or critical-path problem requiring another modernization pass.

Once exact-head CI confirms the final head, **stop verifier infrastructure modernization**. Further parallelism, sharding, shared artifacts, task runners, dependency graphs, or benchmark infrastructure require a separate measured need and architecture decision.

## Explicitly deferred

Do not start automatically:

- additional verifier/CI parallelism beyond the dedicated release lane;
- split release-impact jobs;
- Storybook/release cross-job artifact reuse;
- more Playwright workers or sharding;
- Nx/Turbo or another task runner;
- a generic dependency graph;
- a universal cross-lane path/test registry;
- broad legacy-suite cleanup;
- speculative E2E optimization;
- permanent benchmark/metrics infrastructure.
