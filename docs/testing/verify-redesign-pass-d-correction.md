# Verify redesign — Pass D completion correction

- **Status:** Ready for correction implementation
- **Applies to:** `docs/testing/verify-redesign-pass-d-implementation.md`
- **Review state:** `scripts/REVIEW.md`
- **Scope:** close the two remaining Pass D proof/execution blockers only

## Current state

The structural E2E migration itself has landed. The operator has also installed and locked:

```text
dependency-cruiser: ^18.2.0
resolved: 18.2.0
```

Do not redo the scenario migration, ownership model, project applicability, browser-integration split, package installation, or release routing.

Pass E remains blocked until this correction is architect-accepted.

## Correction A — containerize Playwright ownership inventory

The current `scripts/lib/e2eOwnerInventoryCollector.ts` directly invokes the host Playwright binary. Replace only that execution boundary.

### Required final shape

Keep `resolveStructuralE2EPlan()` synchronous. Do not convert the verifier planner to async.

Use this boundary:

```text
resolveStructuralE2EPlan()
  -> collectE2EOwnerInventory()                  # synchronous adapter
     -> node child collector                     # one narrow async child
        -> runPlaywrightInContainer(...)         # ordinary --list
        -> runPlaywrightInContainer(...)         # release --list
        -> e2eOwnerInventoryReporter.mjs
```

The narrow child collector may be a new file such as:

```text
scripts/lib/e2eOwnerInventoryContainer.mjs
```

The exact filename is not public API, but there must be only one concrete collector boundary and it must reuse `runPlaywrightInContainer`; do not create another Podman/Playwright runner.

### Metadata runs

Run Playwright list mode for exactly the two configs that own target E2E inventory:

```text
playwright.config.ts
playwright.release.config.ts
```

Pass through:

```text
--list
--reporter=scripts/lib/e2eOwnerInventoryReporter.mjs
```

No browser execution is required for metadata collection.

The existing reporter remains the Playwright suite/reporter API owner for collecting spec paths and test annotations. Do not parse TypeScript source.

### Result exchange

`runPlaywrightInContainer` mounts the repository at `/work`. Use the already ignored repository-local:

```text
temp/
```

for narrow JSON exchange files so the same file is visible to the host adapter and container.

For each container run:

- create a unique host-relative file under `temp/`;
- pass the corresponding `/work/temp/...` path through `MIOFRAME_E2E_OWNER_INVENTORY_OUTPUT_FILE` using `runPlaywrightInContainer`'s existing `extraEnv`;
- read the reporter JSON after the container list run succeeds;
- remove temporary files in `finally`.

The child collector may write the merged result to one final `temp/` file supplied by the synchronous adapter. Do not depend on parsing `runPlaywrightInContainer` stdout because the existing container runner owns diagnostic output.

Filter the merged inventory to target `*.e2e.spec.ts` files exactly as today.

### Verify-lock semantics

Do not add any lock.

The child process inherits the parent environment. Both metadata Playwright invocations must use `runPlaywrightInContainer`, which already routes through `runGuardedExpensiveLocalCommand`.

Therefore:

- inside the owning `pnpm verify`, inherited `MIOFRAME_MACHINE_LOCK_HELD` / `MIOFRAME_VERIFY_LOCK_HELD` prevents child deadlock;
- as a standalone collector path, the first container invocation is rejected if an independent local verify owns the machine lock;
- no nested `pnpm verify` is needed or allowed.

Do not change heartbeat, stale-lock recovery, owner tokens, status/resume state, or the GitHub Actions exception.

## Correction B — prove the real dependency-cruiser graph

`dependency-cruiser@18.2.0` is now present. Keep the accepted architecture:

```text
scripts/lib/e2eGraphCollector.mjs
  -> dependency-cruiser cruise(['src'], ...)
  -> JSON module graph
scripts/lib/e2eGraph.ts
  -> reverse graph
scripts/lib/e2eOwnerTraversal.ts
  -> structural page/widget owners
```

Do not add a `.dependency-cruiser` config, graph cache, generic graph service, or a second graph implementation.

First run the current real adapter against the repository.

If it succeeds, do not edit graph code merely to refactor it.

If it fails, establish the exact dependency-cruiser/API/resolution cause and make the minimum correction required for:

- `src/**` production graph acquisition;
- `tsconfig.src.json` path resolution;
- exclusion of colocated test/spec/story/testUtils files;
- fail-closed handling of unresolved dependencies that make owner reachability unsafe.

Fixture-backed unit tests remain pure and must not start dependency-cruiser.

## Required real graph proof

After the metadata-container correction, use a real focused E2E invocation whose `--files` input is a lower FSD production module.

A suitable candidate is under:

```text
src/entities/databaseData/**
```

Use a concrete existing production file only after the real graph confirms its route into the `widget/DocumentView` chain.

The proof must show that:

- real dependency-cruiser acquisition succeeds;
- the lower-layer path reaches the truthful structural owner(s);
- owned E2E is selected from the target inventory;
- the result is not an accidental full-E2E fallback caused by graph or inventory failure.

If that candidate does not have the expected real dependency path, choose another existing lower-layer production file whose route is demonstrated by the acquired graph and report it. This is a verification choice, not permission to change ownership architecture.

## Tests

Add only narrow deterministic tests required by the changed execution adapter.

At minimum prove that the synchronous ownership-inventory adapter:

- invokes the narrow child collector rather than a Playwright binary;
- fails closed on non-zero collector exit;
- fails closed on missing/malformed result JSON;
- preserves deterministic merged inventory parsing/filtering.

Keep existing tests for:

- owner annotation validation;
- graph conversion/failure;
- structural traversal;
- project applicability;
- E2E routing;
- command lock/local command guard.

Do not make unit tests execute Playwright or dependency-cruiser.

## Acceptance

Pass D correction is complete only when all of the following are true:

1. No Pass D ownership-inventory path invokes Playwright directly on the host.
2. Ordinary and release ownership metadata are collected through `runPlaywrightInContainer` in `--list` mode.
3. Metadata collection still uses Playwright's suite/reporter API and launches no browser.
4. Temporary inventory files use ignored repository-local `temp/` and are cleaned up.
5. The existing single-local-verify machine lock is unchanged.
6. Metadata list runs participate in the existing guarded expensive-command path.
7. No nested `pnpm verify`, second lock, or second container runner is introduced.
8. `dependency-cruiser@18.2.0` is used by the real graph collector successfully, or any concrete compatibility defect discovered is minimally corrected.
9. One real lower-layer production path is proven to select its truthful structural E2E owner(s) through the dependency graph.
10. Graph acquisition failure remains fail-closed.
11. `package.json` and `pnpm-lock.yaml` need no correction merely because dependency-cruiser is now installed.
12. No Pass D E2E scenario, owner, project applicability, productionArtifact routing, browser-integration routing, or assertion semantics are changed.
13. No Pass E or Pass F work begins.

## Forbidden

- host `playwright test --list` or equivalent ownership collection;
- parsing test source for annotations;
- changing the verifier planner to async;
- a second Podman/Playwright abstraction;
- a second verify lock or lock manager;
- nested `pnpm verify`;
- unit tests that execute Playwright or dependency-cruiser;
- retaining host Playwright as a fallback;
- weakening graph failure to skip or focused selection when reachability is uncertain;
- redesigning structural E2E ownership;
- editing E2E assertions/scenarios unrelated to a concrete correction defect;
- package/version churn unrelated to a demonstrated dependency-cruiser problem;
- Pass E or Pass F work.
