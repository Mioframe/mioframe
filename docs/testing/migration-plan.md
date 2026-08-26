# Testing architecture migration plan

`docs/testing/architecture.md` is the durable target. This file is intentionally operational: it records the current executable migration state, constraints, and remaining capability transition. Detailed older states remain in Git history. The resolved overall pass order and implementation constraints are owned by `docs/testing/verify-redesign-implementation-preflight.md`.

## Migration constraints

- Every intermediate state remains safe; do not delete an old mechanism before its replacement is executable and proven in the same resulting tree.
- Preserve or strengthen proof before narrowing execution.
- Unknown relevant impact widens the owning verification type; structural invalidity fails verification.
- `verify` must not depend on agent prose, `TEST IMPACT`, uncommitted reports, or business-semantics inference.
- Do not create parallel durable ownership models. Compatibility is temporary and removed only after consumer inventory is empty.
- Preserve top-level verify locking, expensive-command locking, Playwright container boundaries, timeouts, logging, status/resume, profile/base handling, and fix semantics unless an accepted contract explicitly changes them.
- Do not start a risky implementation pass while its architecture or active review findings are unresolved.

## Current branch state

On `architecture/verify-redesign` / draft PR #218:

- **Pass A:** completed and architect-accepted;
- **Pass B:** completed and architect-accepted;
- **Pass C:** completed and architect-accepted;
- **Pass D:** completed and architect-accepted at `c0aa686235d291089d413b77c4b5fe176acc07b3`;
- **Pass E:** completed and architect-accepted on reviewed implementation head `60a097a077cb834e4cab28f5a2a8fad616ff77fd`;
- **Pass F:** ready and is the only remaining redesign pass.

Pass E exact-head GitHub Actions run `32957373587` completed successfully, including verifier-managed `static`, `unit`, and real `mutation` steps plus browser/E2E lanes and aggregate gates. Pass-level semantic acceptance and final PR exact-head CI remain separate gates: architect-only documentation commits after the reviewed implementation head will trigger a newer run.

There is currently no active owner-local `REVIEW.md` for Pass A-E.

## Current executable verification types

Public `--only` exposes exactly:

- `static`;
- `unit`;
- `behavior`;
- `visual`;
- `browser-integration`;
- `performance`;
- `mutation`;
- `e2e`.

Private leaf labels remain implementation details for planning, execution, locks, logs, weights, timeouts, and diagnostics.

## Accepted target state through Pass E

### Static

Static proof is classified under public `static`. Storybook buildability remains static proof; release/version/build/artifact invariants that are static remain internal static leaves.

### Unit

Unit affected ownership is complete and accepted:

- direct changed unit tests select themselves;
- deterministic standard snapshot ownership selects the owning unit test where applicable;
- normal Git source/test-support impact delegates to native Vitest `--changed` using the already-resolved diff base;
- explicit source/test-support impact delegates to native `vitest related --run`;
- removed/moved/global/unresolvable relations widen safely to full unit;
- zero-match related/affected execution is visible fail-closed evidence;
- no second unit dependency graph exists.

### Behavior

Complete and target-owned. Ordinary isolated browser behavior uses truthful owner-local `*.behavior.spec.ts`; legacy `*.browser.spec.ts` discovery and ordinary central Storybook assertion ownership are removed.

### Visual

Complete and target-owned. Persistent visual proof uses owner-local `*.visual.spec.ts` plus owner-local baselines. Ordinary central visual assertion discovery is removed. Shared Storybook visual support remains support only.

### Browser integration

Complete and target-owned. `*.browser-integration.spec.ts` is owner-local. Managed-update/artifact runtime proof retains release-named Playwright/container execution infrastructure only where it preserves required built-artifact, fresh-container, service-worker, or cross-engine semantics. Generic browser integration uses the same container boundary through its private leaf.

### Application E2E

Complete and accepted:

- target assertions exist only under `tests/e2e/pages/<Owner>/**/*.e2e.spec.ts` and `tests/e2e/widgets/<Owner>/**/*.e2e.spec.ts`;
- primary owner is path-derived and validated against current production owner directories;
- additional ownership is exceptional Playwright `_mioframe-owner` annotation metadata; the accepted current inventory requires zero such annotations;
- changed production source uses one dependency-cruiser reverse graph to reach widget/page owners;
- project applicability remains an independent `desktop | mobile | both` registry;
- ordinary E2E excludes `productionArtifact/`; the three production-artifact scenarios retain their required release/fresh-container execution;
- the structurally valid filesystem target E2E set must equal the union of Playwright-collected target paths before selection;
- missing, unexpected, duplicate, malformed, or stale inventory/owner state fails structurally;
- `E2E_SCENARIO_SCOPES` and production source-prefix -> spec mappings are removed.

### Mutation

Mutation ownership is complete and accepted:

- `scripts/lib/mutationTargets.ts` is the single explicit validated ownership registry;
- the registry contains exactly the four deterministic high-risk source/test pairs recorded in `docs/testing/verify-redesign-pass-e-implementation.md`;
- default/focused mutation uses exact registered source/test relations only;
- mutation-infrastructure changes select all registered targets;
- registry invalidity fails before Stryker in focused/default and literal full mode;
- `stryker.config.mjs` imports the TypeScript registry directly and derives its complete `mutate` list from it;
- literal `--full` executes all registered targets without affected narrowing;
- adjacency-derived mutation ownership, duplicate registries, and loader/transpilation compatibility layers are absent.

### Performance

`performance` is a valid public type, but there is no persistent `*.performance.spec.ts` target with an exact durable budget. The persistent inventory is intentionally empty. No placeholder runner, registry, or threshold exists.

## Remaining public-contract difference

| Concern | Current executable state | Durable target / remaining pass |
| --- | --- | --- |
| public types | canonical eight types | complete |
| behavior/visual/browser-integration taxonomy | target suffixes/owners | complete |
| E2E ownership/impact | structural owners + containerized metadata + reverse graph | complete |
| unit impact | native Vitest changed/related + safe fallback | complete |
| mutation ownership | explicit validated four-target registry | complete |
| performance | valid type, empty persistent inventory | complete for current repository state |
| release compatibility | compatibility alias/comments/internal release-named execution may remain | Pass F remove only obsolete public compatibility |
| CI consumers | verify/release workflows may still contain transitional commands | Pass F canonical public-command cleanup |

## Pass F — CI and compatibility removal

Status: **ready; implementation not yet started.**

Before editing, inspect the current repository consumer inventory. Then apply only the cleanup proven necessary by that inventory.

Required final state:

- repository workflows invoke public verification types rather than removed/private low-level labels;
- the `develop -> main` release gate uses canonical literal `pnpm verify --full`;
- `pnpm verify:release` is removed only after repository search proves there is no remaining required consumer;
- stale compatibility docs/comments that describe migrated mechanisms as current are removed or corrected;
- internal release-named files/runners remain when they still own real built-artifact, service-worker, fresh-container, or cross-engine execution constraints;
- no internal filename/runner is renamed merely for aesthetics;
- no product behavior, test meaning, accepted ownership boundary, lock, container boundary, timeout, logging, or status/resume behavior changes.

Pass F proof must include:

- repository search showing no public use of removed low-level `--only` labels;
- repository search showing no required `verify:release` consumer before alias removal;
- workflow inspection proving type-level public commands and literal full release verification;
- verifier CLI tests for canonical public type/full semantics where touched;
- exact-head GitHub CI on the final resulting PR head.

## Removed compatibility that must not return

- public low-level `--only` labels;
- legacy `*.browser.spec.ts` discovery;
- ordinary central behavior/visual assertion ownership;
- root/release application E2E assertion ownership;
- `E2E_SCENARIO_SCOPES` and equivalent production-path -> E2E-spec registries;
- host Playwright ownership metadata execution;
- a second E2E graph engine;
- unit adjacency or a custom unit dependency graph;
- mutation adjacency or a second mutation registry.

## Final completion criteria

The redesign is complete when:

- `pnpm verify` is the normal project verification entry point;
- public `--only` exposes only the canonical eight verification types;
- every persistent spec type has deterministic target naming/ownership;
- unit uses Vitest native affected/related selection with safe fallback;
- mutation uses only validated explicit registered targets and participates in `--full`;
- persistent performance proof exists only for real measurable budgets;
- E2E ownership and affected selection remain structural/fail-closed;
- uncertainty widens only the owning type unless uncertainty is genuinely cross-type;
- structural invalidity fails verification;
- compatibility aliases/mappings have no repository consumers before removal;
- repository workflows use canonical public type commands and the release gate uses literal `pnpm verify --full`;
- `pnpm verify --full` runs every current type inventory, every target spec, every registered mutation target, and every registered persistent performance target without affected narrowing;
- exact-head GitHub CI is green on the final resulting PR head.

Known flaky behavior is failed proof; retry-pass classification is not acceptance.
