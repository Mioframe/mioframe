# Verify release-impact correction

Status: **architecture reopened after full PR review; final correction architecture resolved, implementation pending**.

This document is the durable architecture/handoff for the Pass E release-impact boundary. `docs/testing/verify-target-architecture.md` remains the wider target architecture and `docs/testing/architecture.md` remains canonical testing policy.

## Why Pass E is reopened

The previous implementation correctly improved many exact consumer mappings, but full PR review proved that the model was not actually closed over two required populations:

1. production Vite/PWA build configuration consumed by the real release artifact build;
2. release Playwright specs versus the release contract that actually executes each spec.

Concrete failures in the current tree:

```text
config/plugins/pwa.ts
→ consumed by vite.config.ts during the real production artifact build
→ current releaseRisk.ts: skip
```

and:

```text
new tests/e2e/release/foo.spec.ts
→ release proof path exists
→ current releaseRisk.ts can skip it

new tests/e2e/release/managedUpdatesFoo.spec.ts
→ current filename heuristic says managed-updates
→ managedUpdatesProof.mjs does not necessarily execute it
```

The current mapping validator also does not reject a release-check value outside `RELEASE_IMPACT_CHECKS`.

This is an ownership-completeness defect, not a request for a generic dependency graph. Per the repository repeated-correction stop rule, do not fix it by adding isolated path/name conditions to the existing implementation.

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

Required invariants:

- current production Vite/PWA build configuration cannot silently resolve `skip`;
- every current release Playwright spec has exactly one truthful executing source of ownership;
- adding a release spec without assigning it to a real executing contract fails `invalid`;
- planner ownership and actual release execution cannot drift independently;
- unknown release-check values make the mapping invalid;
- unknown significant runtime/build input inside an explicitly confirmed release-sensitive boundary never silently skips.

## Non-goals

Do not introduce:

- a generic import/dependency graph;
- a repository-wide path taxonomy;
- a generic test registry;
- a new release check;
- a new CI job;
- release-version inference;
- broad `config/**` release ownership;
- directory adjacency as proof of a specific release consumer;
- new managed-update scheduling/grouping semantics.

## Architecture decision 1 — one release Playwright execution inventory

Create one narrow release-owned pure inventory module:

```text
scripts/release/releaseSpecInventory.ts
```

It owns only the spec paths that existing release Playwright contracts execute.

Minimum public facts:

```text
artifact release specs
release-smoke specs
managed-updates spec groups
```

The exact TypeScript shape may stay simple, for example readonly arrays/object fields. Do not generalize it into a registry framework.

### Consumers

The same inventory must be consumed by the actual execution owners and the planner:

```text
releaseSpecInventory.ts
├─ scripts/verify.ts
│    ├─ artifact RELEASE_CHECK_COMMANDS args
│    └─ release-smoke RELEASE_CHECK_COMMANDS args
├─ scripts/release/managedUpdatesProof.mjs
│    └─ existing four fixed sequential groups
└─ scripts/lib/releaseRisk.ts
     └─ spec -> actual executing release check ownership
```

This is the reason the additional module is justified: the current duplicated/path-name representation has already produced false ownership and silent gaps. One explicit release-specific execution inventory reduces total complexity and makes actual execution the source of truth.

### Managed-update grouping ownership

`managedUpdatesProof.mjs` continues to own:

- four groups;
- group labels;
- fixed sequential ordering;
- stop-on-first-failure behavior;
- fresh-container isolation.

The new inventory owns only which specs are in those existing groups. Do not redesign the orchestration.

### Artifact / release-smoke execution

`scripts/verify.ts` must construct the existing artifact and release-smoke release commands from the shared inventory instead of owning independent spec-path literals.

No command label or release check changes.

## Architecture decision 2 — exhaustive release-spec validation

`tests/e2e/release/**` is a bounded release-proof ownership surface.

`releaseRisk.ts` must validate the repository's actual release `.spec.ts` population against `releaseSpecInventory.ts` before planning.

Required validation:

- every inventory spec exists;
- no inventory spec is registered under more than one release check/group;
- every current repository `tests/e2e/release/**/*.spec.ts` is present in the execution inventory;
- no current release spec is unowned;
- removed inventory specs are invalid until the inventory is updated;
- a newly-added release spec that is not assigned to an actual executing contract is invalid, not `full` and not `skip`;
- a filename such as `managedUpdatesFoo.spec.ts` has no ownership merely because of its basename.

A bounded recursive scan of `tests/e2e/release/**` for `.spec.ts` is acceptable here because this directory is itself the confirmed release Playwright proof surface. Do not turn this into a general repository scanner.

### Changed release spec behavior

After successful inventory validation:

```text
changed spec present in artifact inventory
→ focused artifact

changed spec present in release-smoke inventory
→ focused release-smoke

changed spec present in a managed-updates group
→ focused managed-updates
```

Remove the filename-based `managedUpdates*.spec.ts` ownership heuristic. Actual inventory membership is the only proof that `managedUpdatesProof.mjs` executes the spec.

## Architecture decision 3 — production Vite configuration boundary

`scripts/release/buildArtifact.mjs` runs the real local `vite build`, and `vite.config.ts` consumes a bounded set of repository configuration modules for production artifact construction.

Do not model the entire application module graph. Own only the confirmed configuration boundary.

Current confirmed production Vite configuration support:

```text
vite.config.ts
config/tooling.json
config/alias.ts
config/plugins/**
config/vueCustomElements.ts
```

`config/plugins/**` is a deliberate bounded configuration boundary, not a generic `config/**` rule. Proof/test-only files still resolve through the proof-only exclusion before this boundary.

The current production plugins include base compilation, PWA/update artifact configuration, Sentry production-build configuration, and SSL/plugin configuration loaded by `vite.config.ts`. In particular, `config/plugins/pwa.ts` owns manifest, Workbox/cache isolation, `injectManifest`/`generateSW`, managed channel selection, and service-worker artifact semantics.

### Consumer set

A production-Vite-config input affects the artifact construction used by:

```text
build
artifact
release-smoke
managed-updates
```

Use this truthful four-check set for the bounded production-build configuration boundary unless a file already has a stronger existing exact mapping for another release-specific reason.

Do not add `release-config` or `publisher-node-import` merely for symmetry: those commands do not consume the Vite production build configuration.

`vite.config.ts` / `config/tooling.json` may retain an existing broader fail-closed classification when they also own additional release semantics; this correction does not require narrowing safe existing full behavior.

## Architecture decision 4 — mapping integrity includes check identity

The exact release mapping validator must reject every check value not present in `RELEASE_IMPACT_CHECKS`.

Required invalid cases now include:

- empty source path;
- empty check list;
- duplicate source path;
- missing mapped source;
- unknown release check;
- duplicate/unowned/missing release-spec execution inventory;
- conflicting execution ownership that can silently drop or falsely claim a release proof.

Compile-time `ReleaseImpactCheck` typing does not replace runtime validation because test overrides and repository data still require fail-closed behavior.

## Existing ownership retained

The already-reviewed exact consumer relations remain unless the new inventory replaces only their spec-path source of truth:

```text
scripts/release/buildArtifact.mjs
→ build + artifact + release-smoke + managed-updates

scripts/release/artifactServer.mjs
playwright.release.config.ts
scripts/e2eReleaseContainer.mjs
scripts/playwrightContainer.ts
tests/e2e/helpers.ts
→ artifact + release-smoke + managed-updates

scripts/release/publisherWireContractImportProof.mjs
→ publisher-node-import

scripts/pages/lib/releasePublish.mjs
scripts/pages/lib/releaseDescriptor.mjs
src/shared/service/appUpdate/releaseWireContract.ts
→ publisher-node-import + managed-updates

src/sw.ts
→ artifact + managed-updates
```

Existing executable fixture exact mappings and the unknown executable `tests/e2e/release/fixtures/**` full fallback remain.

Proof/declaration-only exclusions remain before broad runtime/config fallback.

Other significant runtime implementation under `scripts/pages/lib/**` remains conservative full when narrower ownership is not established.

## Simplest viable alternative rejected

A patch that only adds:

```text
config/plugins/pwa.ts → some checks
unknown tests/e2e/release/*.spec.ts → full
unknown release check validation
```

is insufficient.

Why:

- it leaves managed-update ownership inferred from filename rather than actual execution;
- a `full` plan cannot execute a release spec that none of the six real commands includes, so an unowned spec would still be unproved;
- it leaves artifact/release-smoke/managed-update spec path literals duplicated between planner and runners;
- the same drift can recur on the next release spec addition.

The shared release execution inventory is therefore the minimum complete solution, not speculative reuse.

## Required proof

Use a fresh test-author context for the behavioral/ownership correction.

Independent proof must cover at least:

1. real production PWA build input:

```text
config/plugins/pwa.ts
→ cannot skip
→ selects the production-build consumer set or a safe stronger plan
```

2. production Vite support boundary:

```text
config/plugins/base.ts
config/alias.ts
config/vueCustomElements.ts
→ cannot skip
```

and a proof-only file under `config/plugins/**` must not inherit release runtime ownership solely from the prefix.

3. actual release-spec execution inventory:

- every current repository release `.spec.ts` is represented;
- artifact and release-smoke command args come from the same inventory;
- managed-update groups consume the same inventory;
- an ephemeral/new unowned release spec makes validation invalid;
- an invented `managedUpdates*.spec.ts` absent from the inventory is not falsely classified as managed-updates.

4. mapping integrity:

- unknown release-check value → invalid.

5. retained behavior:

- existing narrow runtime/fixture mappings remain narrow;
- unknown executable release fixture remains full;
- proof/declaration-only paths remain skipped;
- `release-version` remains separate.

Meaningful RED must come from current public behavior, not from importing the not-yet-created inventory module solely to produce module-not-found.

## Expected implementation scope

Likely production scope:

```text
new scripts/release/releaseSpecInventory.ts
scripts/release/managedUpdatesProof.mjs
scripts/lib/releaseRisk.ts
scripts/verify.ts
```

Likely proof scope:

```text
scripts/lib/releaseRisk.test.ts
scripts/release/managedUpdatesProof.test.mjs
scripts/verify.test.ts
```

If the implementation requires changes to release check semantics, managed-update ordering, CI topology, Playwright configuration, or a generic graph/scanner outside the bounded release-spec directory, stop and return to architecture review.

## Completion order

Pass E is not closed until:

1. fresh independent proof establishes the current gaps;
2. execution inventory and production-config boundary are implemented;
3. focused release planner/orchestrator/verifier proof is green;
4. architect reviews the complete release-impact owner boundary;
5. the two output-contract minor findings are corrected separately or in a clearly isolated verifier-output pass;
6. the required representative benchmark is recorded after semantic corrections;
7. final full PR review is clean;
8. exact-head GitHub CI is healthy.

## Benchmark dependency

The benchmark is not optional. `verify-target-architecture.md` requires both:

- critical-path / merge latency;
- aggregate expensive compute.

Do not benchmark the currently known-invalid release model as final evidence. Measure only after this semantic correction is accepted, then record the measured stop/reopen decision in `verify-modernization.md`.
