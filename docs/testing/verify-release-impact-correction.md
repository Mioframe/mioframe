# Verify release-impact correction

Status: **Pass E reopened by the full PR semantic review; architecture resolved; implementation pending**.

This document owns the current release-impact architecture for PR #216. `docs/testing/verify-target-architecture.md` remains the wider verifier target and `docs/testing/architecture.md` remains canonical testing policy.

## Goal

Make source-impact release planning closed over the real current release execution and production-build mechanisms without introducing a generic dependency graph, a generic build/config registry, or a broad repository taxonomy.

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

## Current architecture state

The following Pass E sub-boundaries remain accepted and must not be redesigned by this correction:

1. release-spec execution inventory and exhaustive release-spec ownership validation;
2. existing exact release-runner/spec/fixture/publisher/managed-update mappings;
3. production-build ownership through static inputs, tool-discovered config, TypeScript config, Vite env, `public/**`, and dependency-install control;
4. artifact reuse, timeout model, CI topology, and independent `release-version` policy.

The full PR semantic review found one additional ownership mechanism that those earlier corrections did not cover: the shared command/runtime support imported by the real release execution roots. Because this is another release-ownership completeness failure, the repository stop rule applies: do not patch only the newly noticed helper paths. Close the mechanism as an explicit bounded ownership population.

## Retained release-spec execution boundary

The accepted execution source of truth remains:

```text
scripts/release/releaseSpecInventory.ts
        │
        ├─ scripts/verify.ts
        ├─ scripts/release/managedUpdatesProof.mjs
        └─ scripts/lib/releaseRisk.ts
```

It must continue to provide:

- one real execution inventory for artifact, release-smoke, and the four managed-update groups;
- exhaustive bounded validation of `tests/e2e/release/**/*.spec.ts`;
- `invalid` for unowned, missing, or conflicting release-spec ownership;
- no filename-derived `managedUpdates*.spec.ts` ownership;
- runtime validation of release-check identity.

Executable release fixtures keep their accepted exact mappings. A new executable path under `tests/e2e/release/fixtures/**` whose consumer set is unknown fails closed to all six. Ordinary unit proof and ambient declarations remain release-negative unless they are themselves a production artifact input.

## Retained exact release ownership

Keep the accepted current relations:

```text
scripts/release/buildArtifact.mjs
→ artifact + build + managed-updates + release-smoke

scripts/release/artifactServer.mjs
playwright.release.config.ts
scripts/e2eReleaseContainer.mjs
scripts/playwrightContainer.ts
tests/e2e/helpers.ts
→ artifact + managed-updates + release-smoke

scripts/release/publisherWireContractImportProof.mjs
→ publisher-node-import

scripts/release/managedUpdatesProof.mjs
scripts/release/runManagedReleaseDataCompatibilityProof.mjs
→ managed-updates

scripts/pages/lib/releasePublish.mjs
scripts/pages/lib/releaseDescriptor.mjs
src/shared/service/appUpdate/releaseWireContract.ts
→ managed-updates + publisher-node-import

src/sw.ts
→ artifact + managed-updates
```

Unknown runtime implementation under `scripts/pages/lib/**` keeps the conservative full-six fallback, after ordinary test/declaration exclusions and accepted exact mappings.

The production managed-update runtime under `src/shared/service/appUpdate/**` keeps the existing managed-updates ownership, with its established proof/test/declaration exclusions and exact stronger mappings where applicable.

## Retained production-build ownership

`scripts/release/buildArtifact.mjs` executes the real production `vite build`. Release impact remains closed over the confirmed current production-build mechanisms below.

### Current focused production-build inputs

The focused consumer set is:

```text
artifact
build
managed-updates
release-smoke
```

Current exact/static inputs:

```text
config/alias.ts
config/vueCustomElements.ts
config/plugins/**
.browserslistrc
postcss.config.js
pwa-assets.config.ts
tsconfig.json
tsconfig.app.json
tsconfig.src.json
tsconfig.node.json
.env
.env.local
.env.production
.env.production.local
public/**
```

`public/**` is checked before proof/declaration filename exclusions because every file in Vite's public root is a production artifact input.

`config/plugins/**` remains narrow; ordinary proof/declaration-only files there do not inherit production release ownership merely by prefix.

### Fail-closed build/config families

A non-current root path inside one of these confirmed significant families fails closed to all six until audited:

```text
browserslist
.postcssrc
.postcssrc.*
postcss.config.*
pwa-assets.config.*
tsconfig*.json
```

This is structural family ownership only. Do not copy exhaustive third-party loader extension matrices.

Current known non-production TypeScript projects remain release-negative solely from this family:

```text
tsconfig.storybook.json
tsconfig.scripts.json
```

Representative nearby negatives remain outside production-build release ownership:

```text
.env.example
.nvmrc
eslint.config.mjs
vitest.config.ts
README.md
config/unrelatedRuntimeConfig.ts
postcss.config.test.ts
```

### Stronger/full production-build controls

Keep the existing stronger fail-closed handling for:

```text
vite.config.ts
config/tooling.json
index.html
scripts/lib/releaseRisk.ts
scripts/verify.ts
scripts/release/releaseSpecInventory.ts
pnpm-workspace.yaml
pnpm-lock.yaml
runtime-relevant/unclassifiable package.json
```

A positively proven version-only `package.json` change remains outside source-impact release expansion; `release-version` policy remains separate.

Ordinary application `src/**` does not become release-impact merely because Vite bundles it. Only already-confirmed release-specific runtime boundaries such as managed updates and `src/sw.ts` receive release ownership.

## Reopened boundary — shared release-execution runtime

### Defect found by full PR review

The real release checks execute through repository-owned low-level command/runtime helpers that are outside the existing release prefixes and exact mappings.

Confirmed current execution chains include:

```text
scripts/release/buildArtifact.mjs
  ├─ scripts/lib/localCommandGuard.ts
  │    ├─ scripts/lib/commandLock.ts
  │    └─ scripts/lib/runLocalCommand.ts
  │         └─ scripts/lib/signalForward.ts
  ├─ scripts/lib/processResult.ts
  └─ scripts/lib/runLocalCommand.ts

scripts/release/managedUpdatesProof.mjs
  ├─ scripts/lib/processResult.ts
  └─ scripts/lib/runLocalCommand.ts
       └─ scripts/lib/signalForward.ts

scripts/release/runManagedReleaseDataCompatibilityProof.mjs
  └─ scripts/lib/runLocalCommand.ts
       └─ scripts/lib/signalForward.ts

scripts/e2eReleaseContainer.mjs
  └─ scripts/playwrightContainer.ts
       ├─ scripts/lib/localCommandGuard.ts
       ├─ scripts/lib/processResult.ts
       └─ scripts/lib/runLocalCommand.ts
```

The current bounded transitive shared release-execution population is therefore:

```text
scripts/lib/commandLock.ts
scripts/lib/localCommandGuard.ts
scripts/lib/processResult.ts
scripts/lib/runLocalCommand.ts
scripts/lib/signalForward.ts
```

The current planner does not classify these files as release-sensitive, so a change to them can fall through to `skip` even though it changes real release execution.

### Architecture decision

Treat the five files above as one explicit **current shared release-execution support mechanism** local to `scripts/lib/releaseRisk.ts`.

Truthful focused consumers:

```text
scripts/lib/commandLock.ts
scripts/lib/localCommandGuard.ts
scripts/lib/processResult.ts
scripts/lib/runLocalCommand.ts
scripts/lib/signalForward.ts

→ artifact + build + managed-updates + release-smoke
```

Why this consumer set:

- `build` executes `buildArtifact.mjs`, which uses the command/runtime support;
- `artifact` and `release-smoke` execute the release Playwright/build path using the same support;
- `managed-updates` executes both the managed-update orchestration and release Playwright path using the same support;
- `release-config` executes `validateReleaseConfig.mjs`, which does not use this command/runtime mechanism;
- `publisher-node-import` imports the publication/wire-contract chain and does not use this command/runtime mechanism.

This is the smallest complete current solution. It is narrower than `scripts/lib/**` and simpler than a runtime dependency graph.

### Ownership completeness rule

The five paths are the current audited population, not a permanent example list.

When a repository-relative **runtime import** is added, removed, or replaced anywhere in the accepted release execution roots below, the same change must re-audit and classify the resulting shared support closure:

```text
scripts/release/buildArtifact.mjs
scripts/release/managedUpdatesProof.mjs
scripts/release/runManagedReleaseDataCompatibilityProof.mjs
scripts/e2eReleaseContainer.mjs
scripts/playwrightContainer.ts
```

Audit recursively only through repository-relative runtime imports needed by those roots. Type-only imports and Node/bare-package imports do not create repository-path ownership. Existing separately-owned release boundaries such as `config/tooling.json`, release-spec inventory, build inputs, and pages publication code keep their current rules rather than being duplicated into this support population.

Completion criterion: every repository-relative runtime dependency reachable from those roots that participates in shared command/execution support is either:

1. already classified by an accepted stronger/existing release rule; or
2. included in the shared support population with its truthful consumer set.

No reachable current shared support path may remain unclassified and fall through to `skip`.

This audit belongs to architecture/preflight/test authorship. Production verification must **not** add a generic import-graph scanner.

## Independent proof for the reopened boundary

Use a fresh dedicated test-author context before changing `releaseRisk.ts`.

Primary proof owner:

```text
scripts/lib/releaseRisk.test.ts
```

Oracle:

- the current repository runtime-import closure from the release execution roots above;
- `docs/testing/verify-target-architecture.md` requirement that shared release helpers select all real consumers or fail closed;
- this document's resolved current consumer set.

The test-author pass must first perform the bounded audit and record enough source-derived rationale that the five current support paths are a completed mechanism population rather than examples copied from the task.

Meaningful RED must include at least:

```text
scripts/lib/runLocalCommand.ts
→ focused artifact + build + managed-updates + release-smoke

scripts/lib/signalForward.ts OR scripts/lib/commandLock.ts
→ same focused four
```

Both currently resolve `skip`; the RED must fail for that observable planner result, not for setup/tooling reasons.

After the audit, prove the complete current population:

```text
scripts/lib/commandLock.ts
scripts/lib/localCommandGuard.ts
scripts/lib/processResult.ts
scripts/lib/runLocalCommand.ts
scripts/lib/signalForward.ts
→ focused four
```

Also prove a nearby unrelated `scripts/lib/**` path remains release-negative, for example a verifier planner that is not part of release execution support. This guards against replacing the omission with a broad directory fallback.

Do not weaken or rewrite existing release-spec, production-build, fixture, publisher, managed-update, package, timeout, or CI-topology proof.

## Minimum implementation

Keep implementation local to:

```text
scripts/lib/releaseRisk.ts
```

Use the existing explicit predicate/set style. One named exact current support population mapping to the focused four consumers is sufficient.

Do not introduce:

- a new module/registry solely for these five files;
- a generic dependency graph or import parser at verifier runtime;
- a broad `scripts/lib/**` release fallback;
- release-config or publisher-node-import ownership for these files without new repository evidence;
- changes to release execution, release-spec inventory, timeouts, artifact reuse, command ordering, or CI topology.

## Workflow guard

The verifier workflow must retain one concise rule: release-impact work that changes a release execution root or its repository-relative runtime imports must re-audit the complete shared release-execution support closure. Adding only the newly noticed helper is not a complete ownership correction.

This is intentionally a workflow/preflight guard, not permanent benchmark or dependency-graph infrastructure.

## Acceptance criteria

Pass E can close again only when:

1. the bounded shared release-execution runtime audit is complete against the current tree;
2. every current shared support path selects exactly `artifact + build + managed-updates + release-smoke`;
3. at least one direct and one transitive support dependency produced meaningful RED before production edits;
4. unrelated nearby `scripts/lib/**` remains release-negative;
5. no broad directory fallback, generic graph, new registry/module, or duplicated release source of truth is introduced;
6. all previously accepted release-spec and production-build ownership remains unchanged and green;
7. release-config and publisher-node-import remain excluded from this support mechanism unless repository evidence changes;
8. release execution/grouping, timeouts, artifact reuse, CI topology, and `release-version` policy remain unchanged;
9. architect re-reviews the complete Pass E boundary after implementation, including the shared support closure rather than only the latest patch.

## PR completion order

Because the full PR semantic review found this blocker, benchmark and final exact-head merge gating remain deferred.

Current order:

1. fresh independent test-author proof for shared release-execution support;
2. separate `releaseRisk.ts` implementation pass against accepted proof;
3. architect complete Pass E re-review;
4. rerun one complete PR-level semantic review from scratch, because the previous full review ended blocked;
5. obtain stable exact-head CI for the semantically accepted implementation;
6. perform and record the mandatory benchmark:
   - critical-path / merge latency;
   - aggregate expensive compute;
7. record stop/reopen decision and update final documentation/PR metadata;
8. require CI on the resulting final documentation head;
9. re-check current `develop` ancestry, unresolved review threads, exact PR head, and required CI lanes before merge readiness.
