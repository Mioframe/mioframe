# Verify modernization

Status: **implementation complete and architect-reviewed; PR exact-head CI pending**.

Current finish branch: `refactor/verify-modernization-finish`.

Current synchronized `develop` merge-base: `13ae220900a2a724c867b01b5eb1f045c2a1d857`.

This document records the final verifier-modernization implementation shape and representative selection evidence. Canonical contracts remain in the architecture documents listed below.

## Authority

- `docs/testing/architecture.md` — project-wide testing policy;
- `docs/testing/verify-target-architecture.md` — verifier impact/planning architecture;
- `docs/testing/verify-agent-output.md` — agent-facing output contract;
- `docs/testing/verify-change-classification.md` — repository metadata classification;
- `docs/testing/verify-unit-impact-correction.md` — unit-impact ownership correction;
- `docs/testing/verify-app-e2e-discovery-correction.md` — single-owner application-E2E discovery contract;
- `docs/testing/verify-e2e-planner-precision.md` — application product-scenario mapping contract;
- `docs/testing/verify-release-impact-correction.md` — release-impact consumer ownership;
- `docs/testing/verify-finish-plan.md` — PR/CI completion sequence;
- `.agents/skills/verification/SKILL.md` — verifier workflow.

## Goal

`pnpm verify` selects the smallest reliable proof while remaining fail-closed for uncertain impact:

```text
known irrelevant change → skip
known affected contract → focused proof
unknown significant impact → full affected lane / invalid
normal agent-facing run → bounded trustworthy result + durable detailed logs
explicit full/release request → complete project/release gate
```

Exact-head GitHub CI remains the authoritative automatic merge gate.

## Final pass status

### Pass A — bounded agent-facing output

Implemented and accepted.

Default child output is captured under `.verify/logs/**`; progress/heartbeat is verifier-owned and bounded. Failure reasons use trusted verifier-owned semantic facts when available and otherwise exact exit status plus log/rerun pointers rather than inferring a root cause from arbitrary output tails. Detailed child output remains available in logs and `--verbose`.

### Pass B — repository metadata classification

Implemented and accepted.

`isNonRuntimeRepositoryMetadataPath()` is a narrow positive repository-metadata fact. There is no global Markdown exclusion: runtime/user documentation with real consumers remains owned by those consumers.

### Pass C — unit impact

Implemented and architect-reviewed.

The unit planner separates:

1. direct Vitest test discovery;
2. repository-wide ordinary module/style/support inputs delegated to `vitest related`;
3. exact external file-as-data/runtime-discovery/existence ownership;
4. bounded repository-scan ownership;
5. unit-global or status-unsafe full fallback.

Direct Vitest discovery matches `vitest.config.ts` exactly:

```text
src/**/*.test.ts
config/**/*.test.ts
scripts/**/*.test.ts
scripts/**/*.test.mjs
tests/e2e/**/*.test.mjs
playwright.*.test.ts
eslint.config.test.ts
```

Unsupported `src/**/*.test.mjs` / `config/**/*.test.mjs` shapes are not direct tests but remain ordinary `.mjs` inputs for `vitest related` when applicable. The verifier does not build a second module graph.

### Application-E2E discovery ownership

Implemented and architect-reviewed after the architecture stop/rework.

One narrow pure module owns the repeated physical/root-spec fact:

```text
scripts/lib/appE2EPaths.ts
├─ APP_E2E_SPEC_DIR
├─ APP_E2E_TEST_MATCH
└─ isRootAppE2ESpecPath()
```

Consumers are:

```text
playwright.config.ts
scripts/lib/e2eRisk.ts
scripts/lib/e2eProjectApplicability.ts
scripts/lib/unitRisk.ts
```

Independent private root-spec predicates/constants were removed. Product scenario mappings remain in `E2E_SCENARIO_SCOPES`; project applicability data remains in `E2E_PROJECT_APPLICABILITY`.

Final behavior:

```text
tests/e2e/appSmoke.spec.ts
→ root app spec / focused direct application E2E

tests/e2e/other/example.spec.ts
→ not app spec/support / no application-E2E selection

tests/e2e/other/helper.ts
→ conservative application support / full application E2E

tests/e2e/example.test.ts
→ not application support

existing *.testUtils.ts application helper
→ support behavior preserved
```

Scenario/standalone and applicability metadata reject non-root app specs. A change to `appE2EPaths.ts` is full application-E2E infrastructure, without creating Storybook/visual/release ownership.

The real Playwright `--list` proof remains independent of the shared predicate. Its probes are collision-safe and invocation-owned; a filtered collection using a real root spec plus a nested probe succeeds, collects the root spec, and excludes the nested probe.

`tsconfig.node.json` explicitly includes the verifier path/applicability modules because `playwright.config.ts` imports them; this is TypeScript project-boundary wiring, not a second ownership mechanism.

### Pass D — mutation ownership

Implemented and accepted.

Mutation is explicit high-risk opt-in through one registry shared by verifier planning and Stryker. Registered source/owner changes select exact targets; adjacency does not create mutation work; registry/config semantic changes revalidate the registered target set.

### Pass E — release impact

Implemented and architect-reviewed.

The six source-impact checks are:

```text
release-config
build
publisher-node-import
artifact
release-smoke
managed-updates
```

`release-version` remains independent PR/release policy.

Confirmed browser-release execution ownership includes:

```text
scripts/e2eReleaseContainer.mjs
scripts/playwrightContainer.ts
playwright.release.config.ts
scripts/release/artifactServer.mjs
tests/e2e/helpers.ts
→ artifact + release-smoke + managed-updates
```

`buildArtifact.mjs` owns `build + artifact + release-smoke + managed-updates`.

Publisher/runtime seam:

```text
publisherWireContractImportProof.mjs
→ publisher-node-import

releasePublish.mjs
releaseDescriptor.mjs
releaseWireContract.ts
→ publisher-node-import + managed-updates
```

Proof/declaration-only paths are excluded before broad runtime fallbacks. Unknown significant release-runtime inputs remain fail-closed. Exact mapping validation rejects malformed, duplicate, empty, or missing required exact mappings.

### Pass F — CI integration

Implemented and accepted:

```text
autofix
   ├─ verification-static
   ├─ verification-browser-e2e
   ├─ verification-storybook-browser / storybook-behavior
   ├─ verification-storybook-browser / visual
   ├─ verification-release
   └─ release-version
```

`verification-release` runs source-impact release proof independently after `autofix`; `release-version` remains separate. No speculative cross-job artifact-transfer layer, task runner, or additional release job was introduced.

## Representative final selection matrix

This matrix records semantic selection, not CI wall-clock evidence.

| Case                                     | Unit                                         | Visual  | App E2E                          | Storybook behavior | Mutation      | Release                                    |
| ---------------------------------------- | -------------------------------------------- | ------- | -------------------------------- | ------------------ | ------------- | ------------------------------------------ |
| `AGENTS.md`                              | skip                                         | skip    | skip                             | skip               | skip          | skip                                       |
| source-adjacent unknown Markdown         | skip                                         | full    | full                             | skip               | skip          | skip                                       |
| feature source                           | focused + scan owners                        | skip    | focused product E2E where mapped | skip               | skip          | skip                                       |
| Material component                       | focused                                      | focused | full                             | focused            | explicit only | skip                                       |
| `src/sw.ts`                              | focused                                      | skip    | full                             | skip               | skip          | artifact + managed-updates                 |
| `pnpm-lock.yaml`                         | full                                         | full    | full                             | full               | skip          | full six                                   |
| `scripts/verify.ts`                      | focused                                      | full    | full                             | full               | skip          | full six                                   |
| `scripts/playwrightContainer.ts`         | ordinary unit ownership as applicable        | full    | full                             | full               | skip          | artifact + release-smoke + managed-updates |
| root app `tests/e2e/appSmoke.spec.ts`    | focused inventory owners                     | skip    | focused direct spec              | skip               | skip          | skip                                       |
| nested `tests/e2e/other/example.spec.ts` | no root-app inventory owner                  | skip    | skip                             | skip               | skip          | skip                                       |
| nested `tests/e2e/other/helper.ts`       | ordinary unit ownership as applicable        | skip    | full support fallback            | skip               | skip          | skip                                       |
| `scripts/lib/appE2EPaths.ts`             | related/unit ownership as applicable         | skip    | full infrastructure              | skip               | skip          | skip                                       |
| `scripts/e2eReleaseContainer.mjs`        | ordinary unit ownership as applicable        | n/a     | n/a                              | n/a                | skip          | artifact + release-smoke + managed-updates |
| `playwright.release.config.ts`           | ordinary unit/config ownership as applicable | n/a     | n/a                              | n/a                | skip          | artifact + release-smoke + managed-updates |
| `scripts/release/artifactServer.mjs`     | ordinary unit ownership as applicable        | n/a     | n/a                              | n/a                | skip          | artifact + release-smoke + managed-updates |
| `tests/e2e/helpers.ts`                   | ordinary unit ownership as applicable        | n/a     | full app support                 | n/a                | skip          | artifact + release-smoke + managed-updates |
| release unit proof `*.test.mjs`          | direct Vitest proof                          | n/a     | n/a                              | n/a                | skip          | skip                                       |
| release fixture `*.d.mts`                | static/type ownership                        | n/a     | n/a                              | n/a                | skip          | skip                                       |
| unknown executable release fixture       | ordinary ownership as applicable             | n/a     | n/a                              | n/a                | skip          | full six                                   |

## Delegated-resolver evidence

The final design deliberately delegates semantics to the owning tools where practical:

- ordinary unit import ownership → real `vitest related`;
- application physical discovery → real Playwright collector;
- application root/path ownership → one verifier path contract plus independent collector proof;
- release browser behavior → production-artifact Playwright release path;
- mutation configuration → one explicit registry shared with Stryker.

Representative retained evidence includes:

- `postcss.config.js` → real related owner;
- `vite.config.ts` → real related `viteBuildDate.test.mjs` owner without redundant external mapping;
- `eslint.config.mjs` → explicit runtime-discovered owner;
- workflow YAML → exact direct-read owners;
- root app spec → scenario/applicability/lane inventory owners, never ordinary Vitest proof;
- nested app-spec candidate → rejected by both verifier ownership and real Playwright collection.

## Final review status

All known behavioral, architecture, ownership, proof-isolation, and comment findings are closed. The complete `develop...refactor/verify-modernization-finish` result has been semantically reviewed after the final application-E2E architecture migration and behavior-preserving comment cleanup.

The remaining gate is repository-owned exact-head PR CI. No active `REVIEW.md` is intended to ship in the PR.

## CI critical path / merge latency

**Pending exact-head PR CI.** No final wall-clock claim is made before the published exact head runs.

## Stop rule

Verifier modernization stops after a clean exact-head CI run and merge-readiness decision. Further infrastructure, parallelism, sharding, cross-job artifacts, generic dependency graphs, task runners, universal registries, or permanent benchmark systems require a separate measured need and architecture decision.
