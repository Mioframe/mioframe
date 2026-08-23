# Verify release-impact correction

Status: **architecture redesigned and ready; implementation pending**.

This document is the durable Pass E architecture for PR #216. `docs/testing/verify-target-architecture.md` remains the wider verifier target and `docs/testing/architecture.md` remains canonical testing policy.

## Goal

Make source-impact release planning closed over the real current release execution and production-build input mechanisms without introducing a generic dependency graph or broad repository taxonomy.

The six source-impact checks remain:

```text
release-config
build
publisher-node-import
artifact
release-smoke
managed-updates
```

`release-version` remains independent PR/release policy.

## Architecture status

The release-spec execution sub-boundary is implemented and remains accepted:

```text
scripts/release/releaseSpecInventory.ts
        │
        ├─ scripts/verify.ts
        ├─ scripts/release/managedUpdatesProof.mjs
        └─ scripts/lib/releaseRisk.ts
```

It provides:

- one real execution inventory for artifact, release-smoke and the four managed-update groups;
- exhaustive bounded validation of `tests/e2e/release/**/*.spec.ts`;
- `invalid` for unowned, missing or conflicting release-spec ownership;
- no filename-based `managedUpdates*.spec.ts` ownership;
- runtime validation of release-check identity.

Do not redesign or duplicate that sub-boundary.

Pass E is reopened only because the production-build input population was still defined too narrowly from static config imports. The real `vite build` also consumes repository files through tool discovery, TypeScript/build metadata and file-as-data/artifact roots.

## Confirmed real build mechanisms

`scripts/release/buildArtifact.mjs` executes the real production `vite build`.

The current repository has these distinct source-input mechanisms.

### 1. Static production-build control

Already represented by the current planner:

```text
vite.config.ts
config/tooling.json
config/alias.ts
config/vueCustomElements.ts
config/plugins/**
```

`vite.config.ts` and `config/tooling.json` keep their existing stronger fail-closed handling.

The bounded support surface:

```text
config/alias.ts
config/vueCustomElements.ts
config/plugins/**
```

has the truthful production-build consumer set:

```text
artifact
build
managed-updates
release-smoke
```

Proof/test/declaration-only files under `config/plugins/**` remain excluded before the runtime prefix rule.

### 2. Tool-discovered production configuration

Static imports are not the only ownership mechanism.

#### Browserslist

`vite.config.ts` calls `browserslistToEsbuild(undefined, { path: process.cwd() })`. With no explicit query, the tool resolves project Browserslist configuration. The current repository-owned source is:

```text
.browserslistrc
```

`package.json` is another Browserslist configuration source and is already handled by the existing package-impact contract.

Recognized repository-root Browserslist config paths are production-build inputs:

```text
.browserslistrc
browserslist
```

They select:

```text
artifact
build
managed-updates
release-smoke
```

#### PostCSS

Vite 7 searches project-root PostCSS configuration when no inline `css.postcss` configuration is supplied. The current source is `postcss.config.js`.

The release planner must own the complete root filename family supported by the current PostCSS loader, not only the current example:

```text
.postcssrc
.postcssrc.json
.postcssrc.yaml
.postcssrc.yml
.postcssrc.js
.postcssrc.mjs
.postcssrc.cjs
.postcssrc.ts
.postcssrc.mts
.postcssrc.cts
postcss.config.js
postcss.config.mjs
postcss.config.cjs
postcss.config.ts
postcss.config.mts
postcss.config.cts
```

`package.json` PostCSS configuration remains covered by the existing package-impact contract.

Every path in this root discovery family selects:

```text
artifact
build
managed-updates
release-smoke
```

A nearby file such as `postcss.config.test.ts` is not a supported discovered config name and must not inherit release ownership.

#### PWA assets

Production PWA configuration enables PWA assets with `config: true`, so the asset generator resolves a root `pwa-assets.config.*` file. The current repository source is `pwa-assets.config.ts`.

Own the supported root configuration family:

```text
pwa-assets.config.js
pwa-assets.config.mjs
pwa-assets.config.cjs
pwa-assets.config.ts
pwa-assets.config.mts
pwa-assets.config.cts
```

Every path in this family selects:

```text
artifact
build
managed-updates
release-smoke
```

Do not infer ownership from arbitrary `*pwa*` names.

#### Production Vite env files

`vite.config.ts` explicitly calls `loadEnv(mode, process.cwd(), '')`, and the production release build uses production mode. Repository-tracked files that match Vite's production env discovery contract are build inputs:

```text
.env
.env.local
.env.production
.env.production.local
```

The repository currently ignores `.env` and `*.local`, so ordinary changed-file planning will normally never receive those local files. That does not make `.env.production` or a deliberately tracked env file irrelevant if it is present in Git.

If one of these exact production env paths appears in the changed-file set, select:

```text
artifact
build
managed-updates
release-smoke
```

`.env.example` is documentation/example input and must remain outside this rule.

### 3. TypeScript transform/config ownership

Vite's TypeScript transformation can consume matching project TypeScript configuration. The current production/config chain is rooted in:

```text
tsconfig.json
tsconfig.app.json
tsconfig.src.json
tsconfig.node.json
```

These are production-build control inputs and select:

```text
artifact
build
managed-updates
release-smoke
```

Current known non-production TypeScript projects remain release-impact negative:

```text
tsconfig.storybook.json
tsconfig.scripts.json
```

To prevent another filename-example gap, any new repository-root `tsconfig*.json` that is neither in the confirmed production set nor the confirmed non-production set is significant-but-unresolved and must fail closed to **full six release checks** until ownership is audited.

Do not classify arbitrary JSON files this way.

### 4. Production artifact/file inputs

Vite's default `publicDir` is `public`; every file under that directory is copied to the production output as-is. Therefore the bounded artifact population is:

```text
public/**
```

Every changed file under `public/**` selects:

```text
artifact
build
managed-updates
release-smoke
```

This is intentionally directory-wide. It is not adjacency inference: the build tool copies the whole directory into the artifact.

Do not apply proof/test filename exclusions inside `public/**`; a file there is an artifact input regardless of its filename.

`pwa-assets.config.ts` currently names `public/favicon.svg` as an additional file-as-data source, but no special favicon mapping is needed because `public/**` already owns that complete artifact population.

### 5. Dependency-install control

The production build and release proof run on the dependency installation produced by pnpm. The current root `pnpm-workspace.yaml` controls allowed dependency build scripts and therefore can change installed build tooling behavior.

Treat:

```text
pnpm-workspace.yaml
```

as release infrastructure and fail closed to **full six release checks**.

Keep existing `package.json` and `pnpm-lock.yaml` semantics unchanged. Do not broaden this into arbitrary package-manager dotfiles without repository evidence.

## What is not part of this release-impact boundary

Do not turn ordinary application source into release-impact ownership merely because Vite bundles it:

```text
src/**
```

Ordinary product source remains owned by its existing unit/application-E2E/Storybook/visual rules, except for already confirmed release-specific runtime boundaries such as managed-update code and `src/sw.ts`.

Also do not classify arbitrary repository-root files, arbitrary `config/**`, review metadata, editor configuration, lint configuration, or documentation as production-build inputs.

Representative negatives:

```text
.env.example
.nvmrc
eslint.config.mjs
vitest.config.ts
README.md
config/unrelatedRuntimeConfig.ts
postcss.config.test.ts
```

Existing ownership in other verifier lanes is unaffected.

## Planner ownership model

Keep the implementation local to `scripts/lib/releaseRisk.ts`. A new generic registry/module is not justified.

The planner should have explicit mechanism-level predicates/constants for:

```text
static production-build support
tool-discovered root config families
production Vite env files
TypeScript config family
public artifact root
pnpm install-control input
```

Known build mechanisms map to their truthful four-check consumer set. Only unresolved paths inside an explicitly confirmed fail-closed family (currently an unknown root `tsconfig*.json`) use `full`.

This is preferable to both rejected alternatives:

1. **example patch** — adding only `.browserslistrc`, `postcss.config.js`, `pwa-assets.config.ts`, `public/favicon.svg` repeats the ownership-completeness failure;
2. **generic root/config fallback** — `config/**`, all `*.config.*`, or all root files would create large false-positive ownership and contradict smallest-reliable-proof design.

## Existing Pass E ownership to preserve

Keep all accepted relations not superseded by the mechanism-based production-build boundary, including:

```text
scripts/release/buildArtifact.mjs
→ build + artifact + managed-updates + release-smoke

scripts/release/artifactServer.mjs
playwright.release.config.ts
scripts/e2eReleaseContainer.mjs
scripts/playwrightContainer.ts
tests/e2e/helpers.ts
→ artifact + managed-updates + release-smoke

scripts/release/publisherWireContractImportProof.mjs
→ publisher-node-import

scripts/pages/lib/releasePublish.mjs
scripts/pages/lib/releaseDescriptor.mjs
src/shared/service/appUpdate/releaseWireContract.ts
→ managed-updates + publisher-node-import

src/sw.ts
→ artifact + managed-updates
```

Also preserve:

- release-spec execution inventory and exhaustive spec validation;
- executable release fixture exact mappings;
- unknown executable release fixture → full;
- proof/declaration-only exclusions where the path is not itself a copied `public/**` artifact;
- conservative `scripts/pages/lib/**` full fallback;
- package version-only refinement;
- artifact 17-minute outer timeout;
- current 120-minute `verification-release` job envelope;
- CI topology and independent `release-version` gate.

## Required independent proof

Use a fresh test-author context before production edits. Primary owner: `scripts/lib/releaseRisk.test.ts`.

The oracle must be the real build mechanisms above, not production planner constants.

### RED A — current implicit build inputs

Prove current real paths cannot skip:

```text
.browserslistrc
postcss.config.js
pwa-assets.config.ts
public/favicon.svg
public/robots.txt
tsconfig.app.json
tsconfig.src.json
tsconfig.node.json
```

Expected for each:

```text
mode: focused
checks: artifact + build + managed-updates + release-smoke
```

Current implementation must fail these expectations.

### RED B — mechanism families, not examples

Use synthetic supported variants that need not exist because this proof is path classification, not registry existence validation:

```text
.postcssrc.mjs
postcss.config.ts
pwa-assets.config.mts
browserslist
.env.production
```

Expected: the same focused four-check consumer set.

This proves the implementation owns the discovery mechanism instead of copying the current filenames into a table.

### RED C — public artifact population

Representative nested public path:

```text
public/icons/example.svg
```

Expected: focused four-check production-build set.

A test/proof-looking filename under `public/**` must still be owned because Vite copies it as an artifact.

### RED D — TypeScript fail-closed family

Known production configs:

```text
tsconfig.json
tsconfig.app.json
tsconfig.src.json
tsconfig.node.json
```

→ focused four.

Known non-production configs:

```text
tsconfig.storybook.json
tsconfig.scripts.json
```

→ no release impact solely from this family.

Synthetic:

```text
tsconfig.future.json
```

→ full six, never skip.

### RED E — dependency install control

```text
pnpm-workspace.yaml
```

→ full six.

### Negative proof

Keep unrelated nearby paths negative:

```text
.env.example
.nvmrc
eslint.config.mjs
vitest.config.ts
README.md
config/unrelatedRuntimeConfig.ts
postcss.config.test.ts
```

Do not weaken existing tests to obtain these results.

## Verification boundary

Implementation scope should remain narrow:

```text
scripts/lib/releaseRisk.ts
scripts/lib/releaseRisk.test.ts
```

No changes are expected in:

```text
releaseSpecInventory.ts
managedUpdatesProof.mjs
scripts/verify.ts
vite.config.ts
postcss.config.js
pwa-assets.config.ts
public/**
CI workflows
```

If implementation requires changing production build semantics instead of planner ownership, stop and return to architecture review.

Focused coding-agent feedback only:

```bash
pnpm verify --only unit-tests --files \
  scripts/lib/releaseRisk.ts \
  scripts/lib/releaseRisk.test.ts

pnpm verify --fix-only --files \
  scripts/lib/releaseRisk.ts \
  scripts/lib/releaseRisk.test.ts
```

Run `pnpm verify --only type-check` only if useful for the touched TypeScript surface.

Broad local verify/release/browser suites remain architect-owned through exact-head CI after semantic review.

## Acceptance criteria

Pass E production-build ownership is complete only when:

1. release-spec inventory/execution behavior remains unchanged;
2. the four current reviewer examples cannot resolve `skip`;
3. ownership is expressed by the mechanism families above rather than four exact patches;
4. all current `public/**` files are production artifact inputs;
5. supported PostCSS/PWA-assets/Browserslist discovery variants are classified consistently;
6. production env filenames are covered while `.env.example` stays negative;
7. current production TypeScript configs are release-owned;
8. known non-production TypeScript configs remain negative;
9. unknown root `tsconfig*.json` fails closed to full six;
10. `pnpm-workspace.yaml` fails closed to full six;
11. existing package/release-fixture/publisher/managed-update ownership remains unchanged;
12. no broad `config/**`, all-root-files, or generic `*.config.*` fallback is introduced;
13. no new generic registry/graph/module is introduced;
14. focused independent proof is green;
15. architect reviews the complete Pass E boundary again before closure.

## Completion order

Pass E remains open until:

1. fresh independent proof establishes the mechanism-level REDs;
2. the local `releaseRisk.ts` ownership correction is implemented;
3. focused proof/static feedback is green;
4. architect reviews the entire release-impact boundary, including retained release-spec inventory;
5. the separate output-contract minors are corrected;
6. full PR semantic review is clean;
7. exact-head CI is healthy;
8. the mandatory representative benchmark records both critical-path/merge latency and aggregate expensive compute;
9. architect records the final stop/reopen decision and requires CI on the resulting documentation head.
