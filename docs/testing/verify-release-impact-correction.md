# Verify release-impact correction

Status: **architecture handoff ready; implementation pending**.

This document is the durable architecture/handoff for the final Pass E correction in PR #216. `docs/testing/verify-target-architecture.md` remains the wider verifier target and `docs/testing/architecture.md` remains canonical testing policy.

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

`release-version` remains independent PR/release policy.

The correction must close two populations that the previous implementation did not actually exhaust:

1. production Vite/PWA configuration consumed by the real release artifact build;
2. every `tests/e2e/release/**/*.spec.ts` versus the release contract that actually executes it.

Required final invariants:

- real production Vite/PWA configuration cannot silently resolve `skip`;
- every current release Playwright spec is assigned to exactly one real executing release check;
- adding a release spec without assigning it to an executing contract makes release planning `invalid`;
- planner ownership and actual release command arguments derive from the same spec inventory;
- filename shape never creates execution ownership;
- unknown release-check values make the mapping invalid;
- unknown significant input inside an explicitly confirmed release-sensitive boundary never silently skips.

## Confirmed current behavior and evidence

Current defects are confirmed in the repository:

```text
vite.config.ts
→ imports config/plugins
→ getPwaPlugins()/resolveManagedAppUpdateChannel()
→ real production artifact build consumes config/plugins/pwa.ts
→ current releaseRisk.ts can resolve config/plugins/pwa.ts to skip
```

Application E2E does not cover this gap because `playwright.config.ts` explicitly builds with `VITE_DISABLE_PWA=1`.

Release-spec execution is also duplicated today:

```text
scripts/verify.ts
→ hard-coded artifact spec
→ hard-coded release-smoke spec

scripts/release/managedUpdatesProof.mjs
→ four hard-coded managed-update spec arrays

scripts/lib/releaseRisk.ts
→ exact mappings for two specs
→ filename heuristic for managedUpdates*.spec.ts
```

The managed-update filename heuristic can therefore claim ownership for a spec that the real managed-update orchestrator never executes, while a different new release spec can fall through to `skip`.

The exact-mapping validator currently checks empty/missing/duplicate mapping data but does not reject a runtime check value outside `RELEASE_IMPACT_CHECKS`.

## Non-goals

Do not introduce:

- a generic import/dependency graph;
- a generic test registry or repository-wide path taxonomy;
- a new release check;
- a new CI job;
- release-version inference;
- broad `config/**` release ownership;
- directory adjacency as proof of a specific consumer;
- new managed-update grouping/order/retry semantics;
- Playwright configuration changes;
- benchmark infrastructure.

## Boundaries

### Changes

Expected production boundary:

```text
new scripts/release/releaseSpecInventory.ts
scripts/release/managedUpdatesProof.mjs
scripts/lib/releaseRisk.ts
scripts/verify.ts
```

Expected proof boundary:

```text
scripts/lib/releaseRisk.test.ts
scripts/release/managedUpdatesProof.test.mjs
scripts/verify.test.ts
```

A narrow type-project inclusion change is allowed only if the new TypeScript module is otherwise outside the current tooling project and focused type-check proves it necessary.

### Must not change

- release check names or semantics;
- `release-version` ownership;
- `playwright.release.config.ts` execution policy;
- managed-update four-group order/isolation/stop-on-failure behavior;
- release timeout policy;
- CI topology or workflow timeouts;
- existing publisher/runtime ownership that is unrelated to the reopened populations;
- application E2E, Storybook, visual, unit, or mutation architecture.

## Ownership matrix

This is repository verification/release tooling; product FSD layers are not changed.

| Concern                                                  | Owner                                                     |
| -------------------------------------------------------- | --------------------------------------------------------- |
| Release spec path inventory                              | `scripts/release/releaseSpecInventory.ts`                 |
| Artifact / release-smoke command construction            | `scripts/verify.ts`                                       |
| Managed-update labels, four-group ordering and execution | `scripts/release/managedUpdatesProof.mjs`                 |
| Source-impact release selection and validation           | `scripts/lib/releaseRisk.ts`                              |
| Production Vite configuration behavior                   | existing `vite.config.ts` / `config/**` owners; unchanged |
| CI placement                                             | `.github/workflows/verify.yml`; unchanged                 |

## Source of truth

- Six source-impact checks: `RELEASE_IMPACT_CHECKS` / current release commands.
- Release spec execution membership: new `RELEASE_SPEC_EXECUTION_INVENTORY`.
- Managed-update execution order and labels: `managedUpdatesProof.mjs`.
- Actual release-spec population: bounded recursive `tests/e2e/release/**/*.spec.ts` scan.
- Production build configuration boundary: actual modules consumed by `vite.config.ts` / `buildArtifact.mjs`.

## State shape / public API

Create one pure module:

```text
scripts/release/releaseSpecInventory.ts
```

Its complete public API is:

```ts
export interface ReleaseSpecExecutionInventory {
  readonly artifact: readonly string[];
  readonly releaseSmoke: readonly string[];
  readonly managedUpdates: {
    readonly lifecycle: readonly string[];
    readonly migrationIsolation: readonly string[];
    readonly crossEngine: readonly string[];
    readonly dataCompatibility: readonly string[];
  };
}

export const RELEASE_SPEC_EXECUTION_INVENTORY: ReleaseSpecExecutionInventory;
```

No functions, filesystem access, release-check labels, command labels, runner code, or generic registry helpers belong in this module.

Seed it from the current real execution corpus:

```text
artifact
- tests/e2e/release/productionArtifactSmoke.spec.ts

releaseSmoke
- tests/e2e/release/firstUserAndReturningUserSmoke.spec.ts

managedUpdates.lifecycle
- tests/e2e/release/managedUpdatesLifecycle.spec.ts
- tests/e2e/release/managedUpdatesAutomaticCheck.spec.ts
- tests/e2e/release/managedUpdatesUncontrolledWindow.spec.ts
- tests/e2e/release/managedUpdatesActivationUi.spec.ts
- tests/e2e/release/managedUpdatesRecovery.spec.ts
- tests/e2e/release/managedUpdatesVueBootFailure.spec.ts
- tests/e2e/release/managedUpdatesRollbackDiagnostics.spec.ts

managedUpdates.migrationIsolation
- tests/e2e/release/managedUpdatesControllerUpgrade.spec.ts
- tests/e2e/release/managedUpdatesControllerArtifactIdentity.spec.ts
- tests/e2e/release/managedUpdatesDevelop.spec.ts
- tests/e2e/release/managedUpdatesMigration.spec.ts

managedUpdates.crossEngine
- tests/e2e/release/managedUpdatesCrossEngineLifecycle.spec.ts

managedUpdates.dataCompatibility
- tests/e2e/release/managedReleaseDataCompatibility.spec.ts
```

The current audited execution inventory therefore contains 15 release specs: 1 artifact + 1 release-smoke + 13 managed-updates specs. The bounded filesystem validation, not this count, is the durable completeness rule.

## Minimum sufficient design

### 1. Migrate actual execution to the inventory

`scripts/verify.ts` imports `RELEASE_SPEC_EXECUTION_INVENTORY` and constructs existing commands as:

```text
artifact
→ pnpm e2e:release --label artifact <...inventory.artifact>

release-smoke
→ pnpm e2e:release --label release-smoke <...inventory.releaseSmoke>
```

No hard-coded release spec path remains in `RELEASE_CHECK_COMMANDS`.

`managedUpdatesProof.mjs` imports the same inventory. Preserve its existing public spec-array exports for current consumers/tests, but make them aliases/references to the inventory arrays rather than independent literals:

```text
MANAGED_UPDATES_LIFECYCLE_SPECS
MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS
MANAGED_UPDATES_CROSS_ENGINE_SPECS
MANAGED_UPDATES_DATA_COMPATIBILITY_SPECS
```

`MANAGED_UPDATES_GROUPS`, labels, order, sequential execution and failure propagation stay owned by `managedUpdatesProof.mjs`.

### 2. Make release-spec ownership exhaustive

`releaseRisk.ts` imports the inventory and builds the spec → release-check relation from it:

```text
inventory.artifact[*] → artifact
inventory.releaseSmoke[*] → release-smoke
all inventory.managedUpdates groups[*] → managed-updates
```

Remove:

- exact narrow mapping entries whose only purpose is the artifact/release-smoke spec path ownership now provided by the inventory;
- `isManagedUpdatesReleaseSpecPath()` and every basename/prefix heuristic that claims managed-update execution ownership.

Before changed-file planning, validate the complete inventory against a bounded recursive scan of `tests/e2e/release/**` for `.spec.ts` files.

Validation must return `invalid` when:

- an inventory spec does not exist;
- one spec appears under more than one executing release check/group;
- an actual repository release spec is absent from the inventory;
- inventory ownership is otherwise conflicting.

An unowned release spec is `invalid`, not `full`: running all six existing commands cannot prove a spec that none of those commands executes.

For focused tests, extend the existing narrow test-seam pattern rather than creating test-only production helpers. `ResolveReleasePlanOptions` may add replacement-only test seams for:

```text
releaseSpecInventoryOverride
releaseSpecFilesOverride
```

They must replace the production inventory/discovered list for one resolver call, never append to them, and production callers must omit them.

### 3. Close the production Vite configuration boundary

Keep the current broader handling for `vite.config.ts` and `config/tooling.json`.

Add a bounded production-build support relation for:

```text
config/alias.ts
config/vueCustomElements.ts
config/plugins/**
```

Proof/test/declaration-only exclusions must run before the `config/plugins/**` boundary so a `*.test.ts`, `*.test.mjs`, `*.testUtils.ts`, or declaration-only file does not inherit release runtime ownership solely from its directory.

Truthful consumer set for this boundary:

```text
build
artifact
release-smoke
managed-updates
```

Do not add `release-config` or `publisher-node-import`: they do not execute the production Vite build.

Do not broaden to all `config/**`.

### 4. Validate release-check identity at runtime

Exact mapping validation must reject any `mapping.checks` value not present in `RELEASE_IMPACT_CHECKS`.

Keep compile-time `ReleaseImpactCheck` typing. A narrow deliberate test cast/override is acceptable solely to prove runtime rejection of impossible/corrupted input; do not weaken the production mapping type to `string[]`.

### 5. Classify the new inventory owner itself

`scripts/release/releaseSpecInventory.ts` changes release execution and release-impact ownership simultaneously. Treat it as release-impact infrastructure and fail closed to **full six checks**.

Do not give it Storybook/application-E2E/mutation ownership merely because it is tooling code; other planners keep their existing rules.

## Existing ownership retained

Keep the previously reviewed relations unless the inventory replaces only the spec-path source of truth:

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

Keep existing executable fixture exact mappings, proof/declaration exclusions, unknown executable `tests/e2e/release/fixtures/**` full fallback, and conservative `scripts/pages/lib/**` fallback.

## Simplest viable alternative rejected

A patch that only adds:

```text
config/plugins/pwa.ts → checks
unknown release spec → full
unknown check validation
```

is insufficient because:

- managed-update ownership would still be inferred independently from actual execution;
- `full` cannot execute a spec absent from every real command;
- artifact/release-smoke/managed-update spec literals would remain duplicated between planner and runners;
- the same drift could recur on the next spec addition.

The shared release execution inventory is the minimum complete abstraction justified by an already-observed ownership failure.

## Acceptance matrix

| Population / mechanism         | Required owner                                 | Representative case                                            | Must reject                               |
| ------------------------------ | ---------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------- |
| Artifact release spec          | inventory → `artifact` command/planner         | `productionArtifactSmoke.spec.ts`                              | planner/command literal drift             |
| Release-smoke spec             | inventory → `release-smoke` command/planner    | `firstUserAndReturningUserSmoke.spec.ts`                       | planner/command literal drift             |
| Managed-update spec            | inventory group → managed orchestrator/planner | `managedUpdatesLifecycle.spec.ts`                              | basename ownership for an unexecuted spec |
| Entire release spec corpus     | bounded recursive scan                         | `tests/e2e/release/**/*.spec.ts`                               | unowned new spec silently skip/full       |
| Production PWA/build config    | four-check production-build boundary           | `config/plugins/pwa.ts`                                        | production PWA input → skip               |
| Nearby config negative         | no release ownership from broad config         | unrelated `config/**` outside named boundary                   | accidental broad `config/**` full/focused |
| Proof-only plugin file         | proof exclusion before plugin prefix           | representative `config/plugins/*.test.ts` if present/test seam | test file inherits release ownership      |
| Exact mapping runtime identity | mapping validator                              | known mapping                                                  | unknown check value accepted              |
| Release inventory module       | release-impact infrastructure                  | `scripts/release/releaseSpecInventory.ts`                      | inventory change skips release lane       |

## Risk matrix

| Risk                                                 | Required protection                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| Planner claims a spec that no command runs           | one shared execution inventory                                     |
| New release spec is forgotten                        | exhaustive bounded filesystem validation → `invalid`               |
| PWA build semantics bypass release gate              | bounded production Vite config relation                            |
| Generic config changes become expensive release work | only named exact files + `config/plugins/**`; no broad `config/**` |
| Existing managed-update execution semantics drift    | preserve labels/order/group count/stop-on-failure                  |
| Test seam becomes a second production API            | replacement-only options documented test-only                      |

## Required test proof

Use a fresh dedicated test-author context before production implementation. Follow `test-first`, `test-authoring`, `unit-testing`, and the verifier/release ownership rules.

### PROOF INTENT A — production Vite configuration

```text
Contract/scenario:
  Production Vite/PWA configuration consumed by buildArtifact cannot skip release impact.
Oracle source:
  vite.config.ts + buildArtifact.mjs + this handoff.
Primary proof owner:
  scripts/lib/releaseRisk.test.ts
Must reject:
  config/plugins/pwa.ts → skip.
Red phase:
  required; current planner demonstrably skips it.
```

Required cases:

```text
config/plugins/pwa.ts
config/plugins/base.ts
config/alias.ts
config/vueCustomElements.ts
→ focused build + artifact + release-smoke + managed-updates
```

Preserve safe stronger existing behavior for `vite.config.ts` / `config/tooling.json`.

Also prove a nearby `config/**` path outside the confirmed boundary does not gain release ownership merely from `config/`.

### PROOF INTENT B — release spec population

```text
Contract/scenario:
  Every release spec must be owned by exactly one real executing release check.
Oracle source:
  current verify commands + managedUpdatesProof execution + this handoff.
Primary proof owner:
  releaseRisk.test.ts + managedUpdatesProof.test.mjs + verify.test.ts
Must reject:
  a new/unowned release spec silently skips or is claimed from its filename.
Red phase:
  required through current public planner behavior; do not import the not-yet-created module solely to create module-not-found.
```

Required proof:

- actual current filesystem release-spec population equals the shared execution inventory;
- current 15-spec corpus is uniquely owned;
- a replacement discovered list containing one extra unowned `tests/e2e/release/newReleaseContract.spec.ts` → `invalid`;
- a replacement discovered list containing `managedUpdatesUnowned.spec.ts` but no inventory membership → `invalid`, never focused managed-updates;
- inventory duplicate/conflicting owner → `invalid` through the narrow replacement test seam;
- missing inventory path → `invalid`;
- changed inventory-owned artifact/release-smoke/managed-update spec selects its truthful focused check;
- `scripts/verify.ts` command arguments are derived from the shared artifact/release-smoke arrays;
- managed-update exported spec arrays/groups are derived from the shared managed-update arrays while labels/order remain unchanged.

### PROOF INTENT C — mapping check identity

```text
Contract/scenario:
  Runtime malformed exact mapping cannot introduce an unknown release check.
Oracle source:
  RELEASE_IMPACT_CHECKS + target architecture validation contract.
Primary proof owner:
  scripts/lib/releaseRisk.test.ts
Must reject:
  exact mapping with a check outside RELEASE_IMPACT_CHECKS is accepted.
Red phase:
  required; current validator does not inspect check identity.
```

### Retained regression proof

Keep green proof for:

- existing narrow runtime/fixture mappings;
- unknown executable release fixture → full;
- proof/declaration-only paths → skip;
- `release-version` remains separate;
- current artifact timeout correction and 120-minute envelope remain unchanged.

## Required verification

Test-author RED should use the smallest owning focused unit command and record exact contractual failures.

After implementation, run focused verifier-managed unit proof for the touched owners, expected approximately:

```bash
pnpm verify --only unit-tests --files \
  scripts/release/releaseSpecInventory.ts \
  scripts/lib/releaseRisk.ts \
  scripts/lib/releaseRisk.test.ts \
  scripts/release/managedUpdatesProof.mjs \
  scripts/release/managedUpdatesProof.test.mjs \
  scripts/verify.ts \
  scripts/verify.test.ts
```

Run focused type-check if the new TypeScript import boundary requires it.

Do not run broad `pnpm verify`, `pnpm verify --full`, `pnpm verify:release`, browser release proof, or reconstructed CI as a coding-agent completion ritual. Exact-head CI remains architect-owned after semantic review.

## Forbidden

- direct Git/GitHub commands from coding/test contexts;
- editing `docs/testing/**`, any `REVIEW.md`, `AGENTS.md`, or skills;
- a local `config/plugins/pwa.ts` mapping-only patch;
- retaining filename-based managed-update spec ownership;
- treating an unowned release spec as `full` instead of `invalid`;
- a generic registry/scanner/graph framework;
- broad `config/**` release ownership;
- moving or renaming release specs;
- changing managed-update group count/order/labels/retries/isolation;
- changing release command labels/check names;
- changing CI topology/workflow timeouts;
- changing release-version policy;
- weakening/removing existing narrow mappings or fixture fallbacks outside this correction;
- implementing the two separate agent-output minor findings in this pass.

## Implementation readiness

- required behavior: resolved;
- ownership: resolved;
- source of truth: resolved;
- state/API shape: resolved;
- closed audit populations: resolved (`tests/e2e/release/**/*.spec.ts` and named production Vite config boundary);
- proof ownership: resolved;
- unresolved architecture blockers: none;
- verdict: **ready**.

If implementation requires a generic dependency mechanism, changes to release check semantics, Playwright config, managed-update scheduling, CI topology, or ownership outside the listed boundaries, stop and return to architecture review.

## Completion order

Pass E is not closed until:

1. fresh independent proof establishes the current gaps;
2. the shared execution inventory and production-config boundary are implemented;
3. focused planner/orchestrator/verifier proof is green;
4. architect reviews the complete release-impact owner boundary;
5. the separate output-contract minor pass is completed;
6. full PR semantic review is clean;
7. stable exact-head CI is healthy;
8. the mandatory representative benchmark records both critical-path/merge latency and aggregate expensive compute;
9. architect records the stop/reopen decision and requires CI on the resulting final documentation head.
