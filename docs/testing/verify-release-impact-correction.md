# Verify release-impact correction

Status: **architecture simplified and ready; implementation pending**.

This document is the durable Pass E architecture for PR #216. `docs/testing/verify-target-architecture.md` remains the wider verifier target and `docs/testing/architecture.md` remains canonical testing policy.

## Goal

Make source-impact release planning closed over the real current release execution and production-build input mechanisms without introducing a generic dependency graph, a build-tool configuration registry, or a broad repository taxonomy.

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

Pass E is reopened only because the production-build input population was defined too narrowly from static imports. The real release build also consumes repository files through tool discovery, TypeScript/build metadata, dependency-install control and file-as-data/artifact roots.

## Design rule

Use the minimum complete mechanism-based model:

```text
positively-known current production-build input
→ focused truthful consumers

whole tool-owned artifact population
→ focused truthful consumers

path inside a confirmed build-tool/config family,
but not positively classified as a current input or known negative
→ full six release checks

positively-known non-production member
→ no release ownership from that family
```

The verifier must not copy exhaustive extension lists from PostCSS, Vite PWA asset loaders, or similar dependencies. Those lists are dependency implementation detail and would create a new maintenance source of truth.

The normal focused production-build consumer set is:

```text
artifact
build
managed-updates
release-smoke
```

`full` means all six source-impact checks and remains the conservative answer for significant release-sensitive paths whose exact consumer set is not positively established.

## Confirmed real build mechanisms

`scripts/release/buildArtifact.mjs` executes the real production `vite build`.

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

selects the focused production-build consumer set.

Proof/test/declaration-only files under `config/plugins/**` remain excluded before the runtime prefix rule.

Do not broaden this into `config/**`.

### 2. Tool-discovered production configuration

Static imports are not the only ownership mechanism. The planner must represent the current repository-owned inputs and a small fail-closed family boundary for plausible replacements, without reproducing loader extension matrices.

#### Browserslist

`vite.config.ts` calls `browserslistToEsbuild(undefined, { path: process.cwd() })`; the current repository-owned config is:

```text
.browserslistrc
```

Current input:

```text
.browserslistrc
→ focused production-build consumers
```

`package.json` remains handled by the existing package-impact contract.

The alternative root name:

```text
browserslist
```

is inside the confirmed Browserslist config family but is not the current repository source. If it appears in a changed-path set, fail closed to **full six** until the repository adopts/audits it.

Do not create a generic Browserslist registry.

#### PostCSS

Vite searches root PostCSS configuration when no inline `css.postcss` is supplied. The current repository-owned source is:

```text
postcss.config.js
```

Current input:

```text
postcss.config.js
→ focused production-build consumers
```

The fail-closed root family is structural, not an exhaustive supported-extension table:

```text
.postcssrc
.postcssrc.*
postcss.config.*
```

After ordinary proof/declaration exclusions, another path matching that family but not the current exact input selects **full six** until audited. This intentionally avoids copying PostCSS loader extension support into Mioframe.

Examples:

```text
postcss.config.ts
.postcssrc.mjs
→ full six

postcss.config.test.ts
→ proof-only negative; not release-owned solely by the family
```

`package.json` PostCSS configuration remains covered by the existing package-impact contract.

#### PWA assets

Production PWA configuration enables PWA assets with `config: true`. The current repository-owned config is:

```text
pwa-assets.config.ts
```

Current input:

```text
pwa-assets.config.ts
→ focused production-build consumers
```

The fail-closed root family is:

```text
pwa-assets.config.*
```

After ordinary proof/declaration exclusions, another matching root path selects **full six** until audited. Do not duplicate the asset generator's supported extension list or infer ownership from arbitrary `*pwa*` names.

#### Production Vite env files

`vite.config.ts` explicitly calls `loadEnv(mode, process.cwd(), '')`, and the release build uses production mode. The small production env contract is stable and explicit:

```text
.env
.env.local
.env.production
.env.production.local
```

If one of these paths is tracked/changed, select the focused production-build consumers.

The repository currently ignores `.env` and `*.local`, so ordinary changed-path planning normally sees only deliberately tracked members. `.env.example` remains a negative example/documentation path.

### 3. TypeScript transform/config ownership

Treat the current production/config chain conservatively as production-build control:

```text
tsconfig.json
tsconfig.app.json
tsconfig.src.json
tsconfig.node.json
```

These select the focused production-build consumer set.

Current known non-production TypeScript projects remain release-impact negative solely from this family:

```text
tsconfig.storybook.json
tsconfig.scripts.json
```

Any other repository-root `tsconfig*.json` is inside a confirmed significant build/config family but has unresolved ownership. It must fail closed to **full six** until audited.

Do not classify arbitrary JSON files this way.

### 4. Production artifact/file inputs

Vite's default `publicDir` is `public`; every file in that tree is copied into the production output as-is. Therefore this is a complete tool-owned artifact population rather than adjacency inference:

```text
public/**
→ focused production-build consumers
```

Do not apply proof/test filename exclusions inside `public/**`; a file there is an artifact input regardless of filename.

`pwa-assets.config.ts` currently names `public/favicon.svg` as an additional file-as-data source, but no favicon-specific mapping is needed because `public/**` already owns the complete population.

### 5. Dependency-install control

The release build runs on the dependency installation produced by pnpm. The root workspace file controls allowed dependency build scripts and can therefore alter installed build-tool behavior.

Use the simplest conservative contract:

```text
pnpm-workspace.yaml
→ full six release checks
```

Keep existing `package.json` and `pnpm-lock.yaml` semantics unchanged. Do not introduce narrower per-consumer reasoning for `allowBuilds`; this path changes rarely and conservative full execution is simpler and safer.

Do not broaden this into arbitrary package-manager dotfiles without repository evidence.

## What is not part of this release-impact boundary

Do not turn ordinary application source into release-impact ownership merely because Vite bundles it:

```text
src/**
```

Ordinary product source remains owned by existing unit/application-E2E/Storybook/visual rules, except already confirmed release-specific runtime boundaries such as managed-update code and `src/sw.ts`.

Also do not classify arbitrary root files, arbitrary `config/**`, editor/lint configuration, review metadata, or documentation as production-build inputs.

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

## Planner ownership model

Keep implementation local to `scripts/lib/releaseRisk.ts`. No new registry/module is justified.

The local model needs only:

```text
current exact production-build inputs
small structural fail-closed config families
production Vite env exact paths
known production/non-production tsconfig sets + unknown-family fallback
public/** artifact root
pnpm-workspace.yaml full fallback
```

Do not encode exhaustive third-party loader extension lists.

This is simpler than both rejected alternatives:

1. **example patch** — adding only the currently missed paths repeats the ownership-completeness failure;
2. **loader mirror / generic registry** — copying every supported config extension creates another source of truth and future drift;
3. **generic root/config fallback** — `config/**`, all `*.config.*`, or all root files creates broad false positives.

## Existing Pass E ownership to preserve

Keep all accepted relations not superseded by this production-build boundary, including:

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

The oracle is the real build mechanisms above, not production planner constants.

### RED A — current real production-build inputs

Prove:

```text
.browserslistrc
postcss.config.js
pwa-assets.config.ts
public/favicon.svg
public/robots.txt
tsconfig.json
tsconfig.app.json
tsconfig.src.json
tsconfig.node.json
.env.production
```

Expected:

```text
mode: focused
checks: artifact + build + managed-updates + release-smoke
```

The current implementation must fail the newly uncovered cases.

### RED B — fail-closed config families without loader mirroring

Synthetic/non-current family members:

```text
browserslist
postcss.config.ts
.postcssrc.mjs
pwa-assets.config.mts
tsconfig.future.json
```

Expected:

```text
mode: full
checks: all six source-impact release checks
```

This proves unknown significant members do not silently skip while the verifier remains independent from third-party extension matrices.

### RED C — public artifact population

Representative nested path:

```text
public/icons/example.svg
```

and a proof-looking filename under `public/**` both select the focused production-build consumers because Vite copies the whole population.

### RED D — known negative members

Known non-production TypeScript configs:

```text
tsconfig.storybook.json
tsconfig.scripts.json
```

remain release-negative solely from the tsconfig family.

Keep nearby unrelated paths negative:

```text
.env.example
.nvmrc
eslint.config.mjs
vitest.config.ts
README.md
config/unrelatedRuntimeConfig.ts
postcss.config.test.ts
```

### RED E — dependency install control

```text
pnpm-workspace.yaml
→ full six
```

Do not weaken existing tests to obtain these results.

## Verification boundary

Implementation scope remains narrow:

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
2. `.browserslistrc`, `postcss.config.js`, `pwa-assets.config.ts` and `public/favicon.svg` cannot resolve `skip`;
3. current positively-known production-build inputs select the focused four consumers;
4. non-current paths inside the confirmed Browserslist/PostCSS/PWA-assets/tsconfig families fail closed to full rather than being treated as known focused consumers;
5. no exhaustive third-party loader extension table is introduced;
6. all `public/**` paths are production artifact inputs;
7. production env filenames are covered while `.env.example` stays negative;
8. current production/config TypeScript configs are release-owned;
9. known non-production TypeScript configs remain negative solely from this family;
10. unknown root `tsconfig*.json` fails closed to full six;
11. `pnpm-workspace.yaml` fails closed to full six;
12. existing package/release-fixture/publisher/managed-update ownership remains unchanged;
13. no broad `config/**`, all-root-files, generic `*.config.*`, generic registry, graph or new module is introduced;
14. focused independent proof is green;
15. architect reviews the complete Pass E boundary again before closure.

## Completion order

Pass E remains open until:

1. fresh independent proof establishes these mechanism-level REDs;
2. the local `releaseRisk.ts` correction is implemented;
3. focused proof/static feedback is green;
4. architect reviews the entire release-impact boundary, including retained release-spec inventory;
5. the separate output-contract minors are corrected;
6. full PR semantic review is clean;
7. exact-head CI is healthy;
8. the mandatory representative benchmark records both critical-path/merge latency and aggregate expensive compute;
9. architect records the final stop/reopen decision and requires CI on the resulting documentation head.
