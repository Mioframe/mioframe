# Verify release-impact correction

Status: **architecture ready for implementation**.

This document is the durable architecture amendment for the Pass E release-impact blocker found by the final verifier-modernization PR review. It narrows and clarifies the release section of `docs/testing/verify-target-architecture.md`. `docs/testing/architecture.md` remains the canonical testing policy.

## Goal

Make `scripts/lib/releaseRisk.ts` a closed, truthful source-impact model for the six existing release checks:

```text
release-config
build
publisher-node-import
artifact
release-smoke
managed-updates
```

A changed repository path must select a release check only when that check actually executes, imports, reads, configures, serves, or otherwise consumes the changed path through the release-specific boundary. A real release execution input must never resolve `skip` merely because it is shared infrastructure.

`release-version` remains separate PR/release policy and is not part of this planner.

## Confirmed current defects

### Missing release execution inputs

The current browser-release execution chain is:

```text
artifact / release-smoke
→ pnpm e2e:release
→ scripts/e2eReleaseContainer.mjs
→ scripts/playwrightContainer.ts
→ playwright.release.config.ts

managed-updates
→ scripts/release/managedUpdatesProof.mjs
→ scripts/e2eReleaseContainer.mjs
→ scripts/playwrightContainer.ts
→ playwright.release.config.ts
```

`releaseRisk.ts` currently does not select release-impact for `scripts/e2eReleaseContainer.mjs` or `scripts/playwrightContainer.ts`, so both can silently skip their own release execution proof.

`tests/e2e/helpers.ts` is also a confirmed shared runtime input to release Playwright specs, including artifact, release-smoke, and managed-update specs. It must be included in the closed consumer audit rather than assumed application-E2E-only.

### Proof/type files incorrectly promoted to release inputs

Current mappings/fallbacks incorrectly select release work for ordinary proof/type files such as:

- `scripts/release/validateReleaseConfig.test.mjs`;
- `scripts/release/managedUpdatesProof.test.mjs`;
- `scripts/release/runManagedReleaseDataCompatibilityProof.test.mjs`;
- `tests/e2e/release/fixtures/managedReleaseFixture.test.mjs`;
- declaration-only release fixture companions such as `*.d.mts`;
- `scripts/pages/lib/**/*.test.mjs` through the broad publication prefix.

A unit test does not inherit the release consumer set of the implementation it tests. A declaration-only companion is owned by static/type proof unless a release command demonstrably consumes it at runtime.

### Mapping validation can silently drop ownership

Current exact mapping validation checks path existence only and resolution uses the first matching mapping. Duplicate/conflicting source entries can therefore silently drop a required consumer.

## Non-goals

- Do not redesign the six release checks or add new release proof.
- Do not merge `release-version` into source-impact planning.
- Do not build a generic dependency graph or generic source-to-check registry framework.
- Do not infer release ownership from adjacency, directory proximity, or filename similarity.
- Do not redesign CI topology, artifact reuse, managed-update grouping, browser workers, retries, or timeouts.
- Do not address the separate Vitest direct-test discovery correction in this coding context.
- Do not broaden release-impact to generic process utilities merely because a release-specific seam imports them transitively.

## Ownership and audit boundary

Owner: `scripts/lib/releaseRisk.ts`.

Execution command source of truth: `RELEASE_CHECK_COMMANDS` in `scripts/verify.ts`.

The release consumer audit is **closed** by starting from those six command entrypoints and following their release-specific execution/configuration/proof seams.

Audit these mechanisms:

1. command entrypoint executed directly by a release check;
2. release-specific config loaded by that command;
3. release-specific orchestrator/runner/server called by that command;
4. production/release fixture or shared E2E support imported by a release Playwright spec;
5. managed publication/runtime module directly consumed by the managed-update release contract;
6. production build input whose content affects the built artifact used by release proof;
7. publication implementation under `scripts/pages/lib/**` when it is actually part of the publisher or managed compatibility boundary.

Stop the release-specific consumer graph at generic shared process/locking primitives such as `runLocalCommand`, `processResult`, and `localCommandGuard` unless a concrete release-only semantic is added there. Their generic execution behavior is owned by their existing static/unit/verifier proof; this correction does not turn every transitive utility into a release input.

Search/grep is only a discovery aid. Completion requires reading the actual import/command/config relationships for the complete current population above.

## Classification rules

For every audited path classify it as exactly one of:

- **exact release input** — deterministic current consumer set is known; map to exactly those checks;
- **release-sensitive implementation boundary with uncertain narrower consumers** — fail closed to all six;
- **proof-only/unit-only** — no release impact;
- **declaration/type-only** — no release impact unless executable evidence proves otherwise;
- **generic shared execution utility below an accepted release seam** — no release-specific mapping solely from transitive use;
- **unrelated** — no release impact.

Proof/type exclusions must be evaluated before broad release-sensitive prefixes or unknown-fixture fallback so a `*.test.mjs` or `*.d.mts` file cannot become full release-impact only because of its directory.

## Required known ownership

The correction must preserve or establish at least these confirmed relations.

### Release-config

```text
scripts/release/validateReleaseConfig.mjs
→ release-config
```

Its ordinary Vitest test file is not a release input.

### Production build / browser artifact path

```text
scripts/release/buildArtifact.mjs
→ build + artifact + release-smoke + managed-updates
```

The script is the direct `build` command and is also the release Playwright web-server build command.

```text
scripts/release/artifactServer.mjs
→ artifact + release-smoke + managed-updates

playwright.release.config.ts
→ artifact + release-smoke + managed-updates

scripts/e2eReleaseContainer.mjs
→ artifact + release-smoke + managed-updates

scripts/playwrightContainer.ts
→ artifact + release-smoke + managed-updates
```

These browser execution seams do not select `release-config`, `build`, or `publisher-node-import` merely because those checks exist.

`config/tooling.json`, `vite.config.ts`, `index.html`, and other broad production build/config inputs may remain conservative only where the audit cannot safely bound their current release consumers. Prefer the smallest evidenced consumer set; `full` is allowed only for genuinely uncertain significant release impact.

### Shared release Playwright support

`tests/e2e/helpers.ts` is a confirmed runtime import of release Playwright specs. Audit the complete current release-spec support/import population and map each shared helper to the actual release checks that execute specs consuming it. For the current `tests/e2e/helpers.ts` relation, evidence spans artifact, release-smoke, and managed-updates.

Do not map ordinary application-E2E support to release merely because it lives under `tests/e2e/**`; actual release-spec import evidence is required.

### Publisher seam

Preserve the plain-Node chain:

```text
scripts/release/publisherWireContractImportProof.mjs
→ scripts/pages/lib/releasePublish.mjs
→ scripts/pages/lib/releaseDescriptor.mjs
→ src/shared/service/appUpdate/releaseWireContract.ts
```

`publisherWireContractImportProof.mjs` selects `publisher-node-import`.

`releasePublish.mjs` / `releaseDescriptor.mjs` must include `publisher-node-import` and any separately proved managed-update publication consumer. `releaseWireContract.ts` remains `publisher-node-import + managed-updates`.

Other runtime implementation under `scripts/pages/lib/**` that is within the confirmed publication/compatibility boundary but lacks safely bounded exact consumers may retain fail-closed full source-impact. Ordinary `*.test.mjs` files under that directory must not inherit the full fallback.

### Managed-update release proof

```text
scripts/release/managedUpdatesProof.mjs
→ managed-updates

scripts/release/runManagedReleaseDataCompatibilityProof.mjs
→ managed-updates

managed-update release specs
→ managed-updates

managed compatibility publication/runtime inputs
→ managed-updates (plus another check only when directly proved)
```

The corresponding ordinary Vitest tests are not release inputs.

`src/sw.ts` remains `artifact + managed-updates`.

### Release fixtures

Executable fixtures imported by a release spec map to the spec's actual release check(s).

Declaration-only `*.d.mts` fixture companions are not release runtime inputs unless executable evidence proves otherwise.

`tests/e2e/release/fixtures/managedReleaseFixture.test.mjs` is unit proof and must not trigger the release fixture fallback.

An unknown executable/runtime file under `tests/e2e/release/fixtures/**` remains fail-closed full until its consumer is classified.

## Exact mapping validation

Keep the mapping structure local to `releaseRisk.ts`; do not introduce a generic registry framework.

Validation must fail `invalid` before planning when:

- a mapping source path is empty;
- a mapping has an empty check list;
- the same source is registered more than once, even if the entries happen to agree;
- a referenced exact source expected to exist is missing;
- another mapping inconsistency could make first-match resolution silently drop ownership.

Allowed check names remain compile-time-owned by `ReleaseImpactCheck`.

For independent validation proof, it is acceptable to add a narrow test-only mapping override to `resolveReleasePlan()` analogous to existing planner test seams. Do not export a mutable production registry or create a second status/mapping table solely for tests.

## Simplicity decision

Use the existing mechanisms only:

- exact mappings for known current consumer sets;
- one small proof/type-only exclusion predicate;
- existing conservative runtime-boundary fallback where exact consumers are genuinely unknown;
- existing managed-update runtime/fixture predicates;
- existing `skip | focused | full | invalid` plan.

Do not add a generated graph, dependency crawler, manifest, DSL, or universal release path taxonomy.

## Acceptance matrix

| Changed path/class | Required release result |
| --- | --- |
| `scripts/e2eReleaseContainer.mjs` | focused: artifact + release-smoke + managed-updates |
| `scripts/playwrightContainer.ts` | focused: artifact + release-smoke + managed-updates |
| `playwright.release.config.ts` | focused: artifact + release-smoke + managed-updates |
| `scripts/release/artifactServer.mjs` | focused: artifact + release-smoke + managed-updates |
| `scripts/release/buildArtifact.mjs` | focused: build + artifact + release-smoke + managed-updates |
| `tests/e2e/helpers.ts` | actual release-spec consumers; current evidence includes artifact + release-smoke + managed-updates |
| `scripts/release/validateReleaseConfig.mjs` | focused: release-config |
| `scripts/release/validateReleaseConfig.test.mjs` | skip release-impact |
| `scripts/release/managedUpdatesProof.mjs` | focused: managed-updates |
| `scripts/release/managedUpdatesProof.test.mjs` | skip release-impact |
| `scripts/release/runManagedReleaseDataCompatibilityProof.test.mjs` | skip release-impact |
| `tests/e2e/release/fixtures/managedReleaseFixture.test.mjs` | skip release-impact |
| mapped executable managed-release fixture `.mjs` | actual release consumer(s) |
| mapped release fixture `*.d.mts` | skip release-impact unless executable consumer evidence exists |
| `scripts/pages/lib/<runtime implementation>.mjs` with unknown narrower consumers | full six checks, fail closed |
| `scripts/pages/lib/<unit>.test.mjs` | skip release-impact |
| duplicate exact source mapping | invalid |
| exact mapping with no checks | invalid |
| `pnpm-lock.yaml` | full six checks |
| runtime-relevant/unresolvable `package.json` | full six checks |
| version-only `package.json` | no source-impact solely from version |

## TEST IMPACT

Behavioral planner proof changes materially. Follow `test-first` with a fresh test-author context.

### Contract 1 — real release execution inputs cannot skip

- Primary proof owner: `scripts/lib/releaseRisk.test.ts` plus command-level composition proof in existing `scripts/verify.test.ts` only where needed.
- Oracle: this amendment + real `RELEASE_CHECK_COMMANDS`/runner/config chains.
- Must reject: `scripts/e2eReleaseContainer.mjs`, `scripts/playwrightContainer.ts`, or confirmed shared release-spec support resolving `skip`.
- Red phase: required; the current planner skips at least the two runner files.

### Contract 2 — unit/type proof is not release input

- Primary proof owner: `scripts/lib/releaseRisk.test.ts`.
- Oracle: testing ownership policy + real release command consumers.
- Must reject: `*.test.mjs` or `*.d.mts` selecting release merely due to sibling/prefix/fixture location.
- Red phase: required; current mappings/prefixes select the confirmed false-positive examples.

### Contract 3 — mapping integrity fails closed

- Primary proof owner: `scripts/lib/releaseRisk.test.ts`.
- Oracle: source-impact target architecture and this amendment.
- Must reject: duplicate source or empty consumer set being accepted and resolved by first match.
- Red phase: required where the current test seam can demonstrate the gap; adding a narrow test-only registry override is allowed in the test-author proof surface.

## Required verification

Coding/test contexts use focused verifier-managed feedback only:

- focused unit proof for `scripts/lib/releaseRisk.ts` / `scripts/lib/releaseRisk.test.ts`;
- focused `scripts/verify.test.ts` proof when command composition/selected labels must be demonstrated;
- one representative `pnpm verify --only release-impact --files ...` planner/command invocation for a newly recognized runner input and one proof-only negative when practical without launching the expensive release check;
- type-check/lint/format for touched TypeScript when useful.

Do not run artifact/release-smoke/managed-updates browser proof merely to validate planner metadata. Exact-head CI remains architect-owned.

## Forbidden

- No direct Git/GitHub lifecycle commands from coding/test-author contexts.
- No edits to `docs/testing/**`, `AGENTS.md`, `.agents/skills/**`, or `REVIEW.md` by the coding agent.
- No release-version changes.
- No new release tests merely to justify mappings.
- No generic dependency graph, import crawler, generated manifest, or cross-lane registry.
- No ownership by adjacency or directory proximity alone.
- No mapping ordinary unit tests to release checks unless the release command literally consumes that test file.
- No mapping declaration-only files to runtime release checks without executable evidence.
- No weakening unknown significant runtime fallback.
- No broad CI, timeout, retry, worker, artifact-sharing, or managed-update grouping changes.
- No Vitest direct-test discovery correction in the same coding context.

## Implementation readiness

- goal/non-goals: resolved;
- release command source of truth: resolved to `RELEASE_CHECK_COMMANDS`;
- audit population and stop boundary: resolved;
- confirmed missing execution inputs: resolved;
- proof/type-only exclusion semantics: resolved;
- exact mapping validation semantics: resolved;
- fallback semantics: resolved;
- simplest implementation shape: resolved;
- unresolved architecture blockers for this correction: none;
- verdict: **ready**.
