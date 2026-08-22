# Verify modernization

Status: **implementation present; unit/release corrections closed; final PR review reopened one application-E2E planner/proof-safety correction; PR CI pending**.

Current finish branch: `refactor/verify-modernization-finish`.

Current synchronized `develop` merge-base: `13ae220900a2a724c867b01b5eb1f045c2a1d857`.

This document records the current verifier-modernization implementation shape, representative selection evidence, accepted corrections, and remaining finish work. Canonical architecture remains in the documents listed below.

## Authority

- `docs/testing/architecture.md` — project-wide testing policy;
- `docs/testing/verify-target-architecture.md` — verifier impact/planning architecture;
- `docs/testing/verify-agent-output.md` — implemented agent-facing output contract;
- `docs/testing/verify-change-classification.md` — repository metadata classification;
- `docs/testing/verify-unit-impact-correction.md` — closed unit-impact ownership correction;
- `docs/testing/verify-app-e2e-discovery-correction.md` — physical/planner application-E2E contract, reopened for final alignment;
- `docs/testing/verify-release-impact-correction.md` — closed Pass E consumer-model correction;
- `docs/testing/verify-finish-plan.md` — remaining integration order;
- `scripts/lib/REVIEW.md` — active final PR-level findings;
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
→ bounded progress + bounded trustworthy result
→ detailed diagnostics in logs / --verbose

explicit full/release request
→ complete project/release gate
```

Exact-head GitHub CI remains the authoritative automatic merge gate.

## Pass status

### Pass A — bounded agent-facing output

Implemented and accepted.

- normal child output is captured under `.verify/logs/**`;
- progress/completion output is bounded;
- heartbeat carries verifier-owned liveness only;
- failure reasons prefer verifier-owned invalid/blocking/timeout facts and stable structured summaries when available;
- otherwise failure reporting uses exact exit code plus log/rerun pointers rather than guessing from an arbitrary output tail;
- detailed output remains available in logs and `--verbose`.

Canonical `verify-agent-output.md` has been aligned with this implementation.

### Pass B — repository metadata classification

Implemented and not reopened.

`isNonRuntimeRepositoryMetadataPath()` is a narrow positive fact. Runtime Markdown such as `PRIVACY.md` and `docs/user/**` remains runtime-owned; there is no global Markdown exclusion.

### Pass C — unit impact

Implemented and architect-reviewed.

Mechanisms:

1. direct changed Vitest test;
2. ordinary repository-wide source/support input delegated to `vitest related`;
3. exact external file-as-data ownership;
4. runtime/tool-discovered ownership;
5. bounded repository-scan ownership;
6. exact existence/absence ownership;
7. unit-global/status-unsafe fallback.

Direct Vitest discovery now literally matches `vitest.config.ts`:

```text
src/**/*.test.ts
config/**/*.test.ts
scripts/**/*.test.ts
scripts/**/*.test.mjs
tests/e2e/**/*.test.mjs
playwright.*.test.ts
eslint.config.test.ts
```

`src/**/*.test.mjs` / `config/**/*.test.mjs` are not direct tests but remain ordinary `.mjs` inputs for `vitest related` when changed. External ownership remains additive and status-aware; the verifier does not build a second import graph.

### Application-E2E physical/planner alignment — reopened final correction

The physical application Playwright lane is already correctly root-only:

```text
tests/e2e/*.spec.ts
```

`playwright.config.ts` enforces this through root-only `testMatch`; scenario-registry filesystem discovery, project applicability, and their unit scan ownership are also root-only.

A real Playwright `--list` proof previously established meaningful RED before the physical config fix and GREEN after it.

Final full-diff review found two remaining issues in the same owner boundary:

1. `e2eRisk.ts:isAppE2ESpecPath()` still recognizes arbitrary nested non-reserved `tests/e2e/**/*.spec.ts` as application specs, so changed-path planning is broader than the real collector.
2. the real collector proof creates/removes fixed probe paths in a way that can overwrite/delete otherwise legitimate future repository content.

The final architecture and TEST IMPACT are recorded in `verify-app-e2e-discovery-correction.md`. This is the only remaining behavioral correction currently known.

### Pass D — mutation ownership

Implemented and not reopened.

Mutation is explicit high-risk opt-in through one registry shared by verifier planning and Stryker. Registered source/owner changes select exact targets; unregistered adjacency does not create mutation work; registry/config semantic changes revalidate all registered targets.

### Pass E — release impact

Implemented and architect-reviewed.

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

Confirmed browser release execution ownership:

```text
scripts/e2eReleaseContainer.mjs
scripts/playwrightContainer.ts
playwright.release.config.ts
scripts/release/artifactServer.mjs
tests/e2e/helpers.ts
→ artifact + release-smoke + managed-updates
```

`buildArtifact.mjs` remains `build + artifact + release-smoke + managed-updates`.

Publisher seam:

```text
publisherWireContractImportProof.mjs
→ publisher-node-import

releasePublish.mjs
releaseDescriptor.mjs
releaseWireContract.ts
→ publisher-node-import + managed-updates
```

Unit/type-only release proof no longer inherits runtime release ownership; unknown significant runtime under confirmed release-sensitive boundaries remains fail-closed. Exact mapping validation rejects empty source/checks, duplicates, and missing required exact sources.

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

`verification-release` starts directly after `autofix` and runs `pnpm verify --verbose --only release-impact`; aggregate verification requires it. `release-version` remains separate. No cross-job artifact transfer or additional release job was introduced.

## Representative selection matrix

This is a semantic selection matrix, not CI wall-clock evidence. Application-E2E rows involving arbitrary nested specs remain provisional until the reopened correction is closed.

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
| shared runner `scripts/playwrightContainer.ts` | ordinary unit ownership as applicable | full | full | full | skip | artifact + release-smoke + managed-updates |
| `postcss.config.js` | focused, real related owner | skip | skip | skip | skip | skip |
| `eslint.config.mjs` | focused + runtime-discovered owner | skip | skip | skip | skip | skip |
| root app `tests/e2e/appSmoke.spec.ts` | focused inventory owners | skip | focused direct spec | skip | skip | skip |
| arbitrary nested `tests/e2e/other/example.spec.ts` | no root-app inventory owner | skip | **provisional: must become no app selection** | skip | skip | skip |
| `scripts/e2eReleaseContainer.mjs` | ordinary unit ownership as applicable | n/a | n/a | n/a | skip | artifact + release-smoke + managed-updates |
| `playwright.release.config.ts` | ordinary unit/config ownership as applicable | n/a | n/a | n/a | skip | artifact + release-smoke + managed-updates |
| `scripts/release/artifactServer.mjs` | ordinary unit ownership as applicable | n/a | n/a | n/a | skip | artifact + release-smoke + managed-updates |
| `tests/e2e/helpers.ts` | ordinary unit ownership as applicable | n/a | full app support | n/a | skip | artifact + release-smoke + managed-updates |
| `scripts/release/validateReleaseConfig.test.mjs` | direct Vitest proof | n/a | n/a | n/a | skip | skip |
| `scripts/pages/lib/ghPagesBranch.test.mjs` | direct Vitest proof | n/a | n/a | n/a | skip | skip |
| release fixture `*.d.mts` declaration | static/type ownership | n/a | n/a | n/a | skip | skip |
| unknown executable release fixture | ordinary ownership as applicable | n/a | n/a | n/a | skip | full six |

## Delegated-resolver evidence retained

Confirmed unit cases include:

- `postcss.config.js` → real `vitest related` selects `config/postcss.config.test.ts`;
- `vite.config.ts` → real related resolution selects `scripts/release/viteBuildDate.test.mjs` without redundant external mapping;
- `eslint.config.mjs` → explicit runtime-discovered owner executes;
- `.github/workflows/verify.yml` → confirmed direct owners execute;
- feature source → feature boundary scan owner executes additively;
- Material tokens → ordinary import owner + token scan owner execute;
- `tests/e2e/appSmoke.spec.ts` → lane/E2E inventory owners only, not the Playwright spec as an ordinary Vitest input.

Application physical discovery remains delegated to the real Playwright collector. The reopened correction adds explicit filtered nested-path evidence and collision-safe proof setup/cleanup.

## Remaining finish work

1. Close the root-only application-E2E planner / collector-proof-safety correction in `scripts/lib/REVIEW.md`.
2. Architect closes remaining non-behavioral source/comment wording drift.
3. Refresh this matrix only where the final correction changes evidence.
4. Run one complete semantic PR-level diff review.
5. Remove resolved `REVIEW.md` artifacts.
6. Compare branch with current `develop` and integrate if needed.
7. Publish PR and inspect exact-head CI.
8. Record actual CI critical path / merge latency.
9. Give merge-readiness verdict.

## CI critical path / merge latency

**Pending exact-head PR CI.**

No final wall-clock claim is made before the published exact head runs.

## Stop rule

Verifier modernization stops when the remaining semantic findings are closed, the selection matrix matches the resulting tree, the full PR-level review is clean, and exact-head CI succeeds. Further infrastructure, parallelism, sharding, task runners, dependency graphs, or permanent benchmark systems require a separate measured need.