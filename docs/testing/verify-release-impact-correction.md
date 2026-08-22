# Verify release-impact correction

Status: **implemented and architect-reviewed**.

This document is the durable architecture/result record for the Pass E release-impact correction. It narrows the release section of `docs/testing/verify-target-architecture.md`; `docs/testing/architecture.md` remains canonical testing policy.

## Goal

`scripts/lib/releaseRisk.ts` must be a closed, truthful source-impact model for the six existing release checks:

```text
release-config
build
publisher-node-import
artifact
release-smoke
managed-updates
```

`release-version` remains independent PR/release policy.

A changed path selects a release check only when that check executes, imports, reads, configures, serves, builds, or otherwise consumes that path through a release-specific boundary. Unknown significant release-runtime input remains fail-closed.

## Closed audit boundary

The audit starts from `RELEASE_CHECK_COMMANDS` in `scripts/verify.ts` and follows only release-specific seams:

1. direct command entrypoint;
2. release-specific config;
3. release orchestrator/runner/server;
4. release Playwright spec and runtime support imported by it;
5. managed publication/update runtime input;
6. production build input used by release proof;
7. publication/compatibility implementation under `scripts/pages/lib/**`.

The graph stops at generic shared execution primitives such as `runLocalCommand`, `processResult`, and `localCommandGuard` unless they acquire a concrete release-only semantic. This avoids turning transitive generic utilities into release inputs.

## Final classification rules

Every audited path is one of:

- **exact release input** — deterministic current consumer set is known;
- **uncertain significant release implementation/runtime input** — full six checks;
- **proof-only/unit-only** — no release impact;
- **declaration/type-only** — no release impact unless executable evidence exists;
- **generic shared execution utility below a release seam** — no release-specific mapping solely from transitive use;
- **unrelated** — no release impact.

Exact ownership is evaluated before broad fallback. Proof/declaration-only exclusion is evaluated before `scripts/pages/lib/**` and unknown release-fixture fallback.

## Confirmed final ownership

### Release configuration

```text
scripts/release/validateReleaseConfig.mjs
→ release-config
```

Its Vitest test does not inherit release ownership.

### Production build and browser release execution

```text
scripts/release/buildArtifact.mjs
→ build + artifact + release-smoke + managed-updates

scripts/release/artifactServer.mjs
→ artifact + release-smoke + managed-updates

playwright.release.config.ts
→ artifact + release-smoke + managed-updates

scripts/e2eReleaseContainer.mjs
→ artifact + release-smoke + managed-updates

scripts/playwrightContainer.ts
→ artifact + release-smoke + managed-updates

tests/e2e/helpers.ts
→ artifact + release-smoke + managed-updates
```

The shared `tests/e2e/helpers.ts` relation is based on real imports from artifact, release-smoke, and managed-update release specs, not directory proximity.

### Publisher seam

```text
scripts/release/publisherWireContractImportProof.mjs
→ publisher-node-import

scripts/pages/lib/releasePublish.mjs
→ publisher-node-import + managed-updates

scripts/pages/lib/releaseDescriptor.mjs
→ publisher-node-import + managed-updates

src/shared/service/appUpdate/releaseWireContract.ts
→ publisher-node-import + managed-updates
```

The managed-update side is real: the managed-release runtime fixture imports `publishManagedRelease` from the publisher implementation.

Other significant runtime implementation under `scripts/pages/lib/**` remains conservative full when a narrower current consumer set is not safely established. `*.test.mjs` files do not inherit that fallback.

### Managed updates

```text
scripts/release/managedUpdatesProof.mjs
→ managed-updates

scripts/release/runManagedReleaseDataCompatibilityProof.mjs
→ managed-updates

managed-update release specs
→ managed-updates

src/sw.ts
→ artifact + managed-updates
```

Production `src/shared/service/appUpdate/**` runtime remains managed-update-owned; its unit tests/test-support do not inherit that ownership.

### Release fixtures

Executable fixtures map to the release spec contracts that actually consume them. Declaration-only `*.d.mts` companions and ordinary `*.test.mjs` proof resolve no release impact. An unknown executable/runtime file under `tests/e2e/release/fixtures/**` remains fail-closed full until classified.

## Mapping integrity

The local exact-mapping table is validated before planning.

`invalid` is required for:

- empty source path;
- empty check list;
- duplicate source registration, including duplicates with identical checks;
- missing required exact source.

A narrow test-only `exactMappingsOverride` replaces the production table for one resolver call so malformed-registry proof can remain independent without exposing a mutable production registry.

## Proof result

Fresh test-author proof established meaningful RED before implementation:

- real browser release runners could resolve `skip`;
- proof/type-only paths could select release work;
- malformed exact mappings could pass through first-match behavior.

The accepted implementation then made the focused `releaseRisk` suite green. The reported focused run covered 259 assertions, and focused type-check also passed.

Architect review confirms:

- exact runner/config/support mappings match the real release command graph;
- proof/type exclusions no longer leak through broad runtime fallbacks;
- unknown significant runtime fallback remains fail-closed;
- `release-version` remains separate;
- no generic dependency graph, manifest, crawler, new release proof, or CI topology change was introduced.

## Non-goals retained

- no release-check redesign;
- no release-version inference from source paths;
- no generic dependency graph/import crawler;
- no adjacency-based ownership;
- no CI/job/timeout/worker/artifact-sharing redesign;
- no change to managed-update four-group ordering.

## Closure

Pass E consumer-model blocker is closed. Remaining verifier-modernization findings are owned separately by `scripts/lib/REVIEW.md`; this document must not be used to reopen unrelated unit-discovery or comment-cleanup work.
