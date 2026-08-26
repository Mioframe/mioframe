# Verify redesign — Pass E implementation contract

- **Status:** Ready for implementation
- **Scope:** Pass E only — final unit affected semantics, explicit mutation ownership, and performance empty-inventory semantics
- **Prerequisite:** Pass D architect-accepted at `c0aa686235d291089d413b77c4b5fe176acc07b3`
- **Next pass after acceptance:** Pass F — CI/public compatibility removal

## Goal

Complete the remaining verification-type ownership semantics without introducing another dependency graph or carrying transitional adjacency inference forward.

Pass E must leave these public meanings true:

- `unit`: Vitest-native changed/related selection, direct tests, deterministic snapshot ownership where applicable, and safe full fallback for relations that cannot be represented;
- `mutation`: only explicitly registered high-risk production targets, selected from the registry in focused/default mode and all registered targets in `--full`;
- `performance`: persistent execution exists only when a real `*.performance.spec.ts` with an exact measurable budget exists. The current repository has no such target, so the inventory remains intentionally empty.

## Non-goals

- no Pass F workflow/alias cleanup;
- no removal of `pnpm verify:release` yet;
- no E2E/behavior/visual/browser-integration ownership changes;
- no release runner/container rename for aesthetics;
- no new generic verification framework;
- no dependency-cruiser use for unit or mutation;
- no persistent performance infrastructure for one-off task measurements;
- no product behavior or existing unit-test meaning changes merely to fit the planner.

## Confirmed current state

### Unit

Current `scripts/verify.ts` builds a focused unit scope from direct existing test paths plus local sibling-test adjacency. That is transitional and misses the target Vitest-native related/affected semantics.

Vitest 4.1.10 is installed. Its supported native mechanisms are sufficient:

- `vitest run --changed <ref>` selects tests affected by VCS changes;
- `vitest related --run <source...>` selects tests covering source paths through Vitest's own module analysis;
- directly filtered test paths run directly;
- `passWithNoTests` defaults to `false`, so a zero-match related run is visible failure rather than a successful empty proof.

Do not build another persistent unit dependency graph to precompute the same relation.

### Mutation

Current `stryker.config.mjs` derives mutation sources from colocated `*.test.ts` adjacency, and `scripts/verify.ts` derives focused mutation source paths with similar location logic. Both are transitional ownership and must be replaced by one explicit registry.

Historical repository evidence plus current source/test ownership confirms the initial deliberate high-risk registry seed below. Do not mechanically migrate every source currently discovered by adjacency.

### Performance

No current `*.performance.spec.ts` target with a durable measurable budget exists. The correct Pass E implementation is therefore to keep the persistent performance inventory empty, not to invent a runner or registry.

## Architecture decision — unit

### Owner

Repository verification tooling owns unit impact planning. Vitest owns the dependency/affected relation itself.

Introduce a small unit-specific planner under `scripts/lib/` (prefer `unitRisk.ts`). It may classify paths and choose a Vitest-native execution strategy; it must not parse imports or persist a dependency graph.

### Plan shape

Keep the common lane states `skip | focused | full`. A focused unit plan may carry a local execution strategy:

```ts
type UnitPlan =
  | { mode: 'skip'; reasons: string[] }
  | { mode: 'full'; reasons: string[] }
  | {
      mode: 'focused';
      strategy: 'changed';
      baseRef: string;
      reasons: string[];
    }
  | {
      mode: 'focused';
      strategy: 'explicit';
      directTests: string[];
      relatedPaths: string[];
      reasons: string[];
    };
```

This is a unit-local planner contract, not a new generic verifier state framework.

### Git-diff/default scopes

For a normal status-aware git scope, use Vitest's native changed selection rather than turning the diff into sibling test paths:

```text
pnpm exec vitest run --reporter=verbose --changed <resolved-diff-base>
```

The resolved diff base must come from the existing changed-path scope. Do not infer a second Git base inside the unit planner.

Before selecting native changed execution, widen to full unit when a changed unit-relevant relation cannot be safely represented from the current tree, including:

- removed/moved unit-relevant source or test paths whose previous relation is unavailable;
- unit runner/global setup/configuration changes;
- other known global unit infrastructure whose effect is not a normal module relation.

At minimum, treat current unit-global infrastructure such as `vitest.config.ts`, `src/setupVitest.ts`, `package.json`, `pnpm-lock.yaml`, and the configuration modules that define Vitest resolution/setup as full-unit impact. Keep this list narrow and infrastructure-owned; it is not a source-to-test mapping registry.

For ordinary existing production/test-support code, let Vitest determine affected tests.

### Explicit `--files` scopes

For explicit files:

1. directly selected existing `*.test.ts` / supported `*.test.mjs` unit tests run directly;
2. deterministic standard Vitest snapshot paths select their owning test when the owner can be derived and exists;
3. remaining existing unit-relevant source/test-support paths run through `vitest related --run --reporter=verbose`;
4. known global/unsafe or removed/moved relations widen to full unit;
5. paths deterministically irrelevant to unit proof do not select unit.

When one explicit invocation contains both direct tests and related source/support paths, preserve both contracts without widening the common implementation-feedback case to full unit. Two private command entries under the public `unit` type are acceptable: retain `unit-tests` for direct tests and add one narrow `unit-related` leaf for the Vitest-related command. Do not add a wrapper script merely to hide the two native Vitest invocations.

A related command that resolves zero tests must not be converted to a successful `skip`. Vitest's default no-tests failure is an acceptable fail-closed diagnostic: it proves that the requested relation produced no owning unit proof and requires resolution rather than silently asserting irrelevance.

### Unit constraints

- no dependency-cruiser for unit;
- no source-prefix -> test registry;
- no synthetic imports added to tests only to influence selection;
- no broad full-unit fallback for ordinary existing source when native changed/related can represent it;
- no `passWithNoTests` opt-out that turns a zero-match relevant source into success.

## Architecture decision — mutation

### Source of truth

Create exactly one explicit project-owned registry, preferably `scripts/lib/mutationTargets.ts`:

```ts
export interface MutationTarget {
  source: string;
  tests: readonly string[];
  reason: string;
}
```

Do not add names, tags, decorators, self-registration, broad prefixes, or a second registry unless a current requirement needs them.

### Initial accepted registry

Seed the registry with the four currently confirmed deliberate high-risk deterministic owners:

1. `src/shared/lib/changeObject/deepPatchJsonObject.ts`
   - tests: `src/shared/lib/changeObject/deepPatchJsonObject.test.ts`
   - reason: recursive patch/delete/normalization semantics mutate nested JSON/CRDT-compatible state and are broadly reused.
2. `src/shared/lib/changeObject/deepPutJsonObject.ts`
   - tests: `src/shared/lib/changeObject/deepPutJsonObject.test.ts`
   - reason: recursive replacement/deletion semantics mutate nested JSON/CRDT-compatible state and are broadly reused.
3. `src/shared/lib/migrations/defineMigrations.ts`
   - tests: `src/shared/lib/migrations/defineMigrations.test.ts`
   - reason: migration ordering/version application/validation protects persisted-data compatibility.
4. `src/shared/lib/migrations/defineVersion.ts`
   - tests: `src/shared/lib/migrations/defineVersion.test.ts`
   - reason: schema/version transition definition is part of the persisted-data migration boundary.

Do not copy `src/shared/lib/cache/index.ts` or every other current adjacency-discovered source into the registry merely because current verifier tests use such a path as a mutation-scope fixture or because a sibling unit test exists.

### Validation

Add a pure registry validator/planner under `scripts/lib/`. Validation fails before Stryker execution when:

- a registered source does not exist;
- a registered owning test does not exist;
- the same source is registered more than once;
- a target has zero owning tests;
- `reason` is empty/whitespace;
- an entry is otherwise malformed.

Structural registry invalidity is a failed mutation plan, not full fallback.

### Focused/default selection

A registered target is affected when the changed-file set contains its exact registered source or one of its exact registered owning tests. That explicit relation is the durable mutation ownership contract; do not derive targets from neighboring files.

Changes to mutation registry/Stryker mutation infrastructure select the complete registered mutation inventory because they can alter every target's execution/ownership.

If a source/test is renamed or removed and the registry is not updated in the same resulting tree, validation fails. If the registry is updated correctly in the same change, planning follows the new current entry; do not preserve the old adjacency as fallback metadata.

### Stryker execution

`stryker.config.mjs` must derive its complete `mutate` list only from the explicit registry. Remove its recursive `*.test.ts` -> sibling source discovery.

The repository's Node 24 runtime can execute erasable `.ts`; prefer importing the TypeScript registry directly from `stryker.config.mjs` if the real Stryker configuration load proves it works. Do not add `tsx`, `ts-node`, emitted tooling builds, or another loader. If Stryker itself demonstrably cannot load the native `.ts` registry, stop and report that concrete loader incompatibility rather than duplicating the registry in `.mjs`.

Focused mutation invokes Stryker with the exact selected registered source list. Literal `--full` runs the complete registry-derived Stryker inventory with no affected narrowing.

### Mutation constraints

- explicit high-risk registration only;
- no automatic adjacency ownership;
- no `*.mutation.spec.ts`;
- no mutation-score target invented as Pass E acceptance;
- no production changes merely to kill mutants;
- shared UI stays unregistered unless a future concrete high-risk deterministic requirement justifies it.

## Architecture decision — performance

The current persistent performance target inventory is empty.

Pass E must therefore preserve:

- `performance` as a valid public verification type;
- `--only performance` as a valid successful empty selection with explicit diagnostics;
- `--full` as running every registered persistent performance target, which currently means zero performance targets.

Do not add a performance runner, registry, placeholder spec, arbitrary timing threshold, or convert task-specific profiling evidence into a permanent gate.

Future persistent performance proof must start from a real owner plus an exact measurable invariant and use `*.performance.spec.ts`.

## Expected implementation surface

Expected Pass E files are limited to:

- `scripts/verify.ts` and focused tests;
- a small unit planner such as `scripts/lib/unitRisk.ts` plus tests;
- `scripts/lib/mutationTargets.ts` plus validation/planner tests;
- `stryker.config.mjs` and existing Stryker-related tests/config proof;
- changed-path context plumbing only as narrowly required to pass the existing resolved diff base/scope kind to unit planning;
- testing migration/current-handoff docs after implementation acceptance.

Do not modify production feature code.

## Acceptance criteria

### Unit

- direct changed unit tests execute themselves;
- ordinary git diff scope uses Vitest-native `--changed` with the existing resolved diff base;
- explicit source/support scope uses native `related --run`;
- explicit direct-test + source scope preserves both without full-unit widening;
- standard external snapshot ownership resolves deterministically when applicable;
- removed/moved/global unsafe unit impact selects full unit;
- a zero-match related run is visible failure, never successful skip;
- docs/proof paths that are deterministically unit-irrelevant still skip unit;
- no custom unit dependency graph exists.

### Mutation

- the explicit four-target seed validates;
- missing source/test, duplicate source, empty tests, and empty reason fail validation;
- changed registered source selects that target;
- changed registered owning test selects that target;
- unrelated sibling-tested production source does not become a mutation target;
- mutation infrastructure change selects all registered targets;
- `--only mutation --files ...` uses the same registry relation;
- `--full` uses all and only registered targets;
- `stryker.config.mjs` has no adjacency-derived mutation inventory.

### Performance

- no persistent performance spec/registry/runner is added;
- `--only performance` remains a valid empty result;
- `--full` does not invent a performance command when inventory is empty.

## Required verification

Focused deterministic proof must cover the planner and registry invariants before broad evidence.

At minimum:

- focused `unit` verification for the new unit planner, changed-path plumbing, mutation registry/planner, Stryker config tests, and `scripts/verify.ts` planner tests;
- one real native Vitest changed/related proof that selects an owning test through Vitest rather than the removed sibling-only resolver;
- explicit direct-test + related-source `--files` proof;
- focused Stryker execution for at least one registered target after the registry owns `mutate`;
- full-registry Stryker dry-run/config proof that the complete mutate set is exactly the registered sources;
- static/type-check verification for touched tooling.

Coding-agent verification remains focused implementation feedback. Exact-head GitHub CI and final merge recommendation remain architect-owned.

## Forbidden

- starting Pass F in the same implementation pass;
- changing public verification types;
- keeping adjacency-derived mutation ownership as fallback;
- adding a unit dependency graph/import parser;
- adding a generic resolver framework because unit and mutation both have planners;
- treating zero related tests as successful irrelevance;
- inventing performance budgets or persistent performance infrastructure;
- weakening locks, timeouts, logging, status/resume, Playwright boundaries, or accepted Pass D behavior.
