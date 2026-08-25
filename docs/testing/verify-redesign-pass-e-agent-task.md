# Verify redesign — Pass E coding task

Baseline branch: `architecture/verify-redesign`

Prepared against architect HEAD: `6a9df7aff7f61f31274b55d231622e6cbbec57e7`

Read and follow, in order: root `AGENTS.md`; `.agents/skills/verification/SKILL.md`; `.agents/skills/unit-testing/SKILL.md`; `.agents/skills/mutation-testing/SKILL.md`; `.agents/skills/implementation-preflight/SKILL.md`; `docs/testing/architecture.md`; `docs/testing/verify-redesign-implementation-preflight.md`; `docs/testing/migration-plan.md`; `docs/testing/verify-redesign-pass-e-implementation.md`; then the current implementation and focused tests.

## Problem and cause

Pass E is the remaining verification-semantics migration before Pass F.

Unit selection is still derived from local sibling-test adjacency in `scripts/verify.ts`, so ordinary changed production/test-support code does not yet delegate affected ownership to Vitest as required.

Mutation ownership is duplicated and inferred from adjacency in both `scripts/verify.ts` and `stryker.config.mjs`, so the current mutation inventory is broader than the intentional high-risk ownership model and has two sources of truth.

The public `performance` type is already valid, but the repository currently has no durable `*.performance.spec.ts` with a measurable budget. Pass E must keep that inventory intentionally empty.

## Expected final state

### Unit

- Vitest is the only dependency/affected engine for unit proof.
- Normal status-aware Git scopes use native `vitest run --changed <resolved-diff-base>` after unit-specific safety classification.
- Explicit existing source/test-support paths use native `vitest related --run`.
- Direct existing unit tests run directly.
- A mixed explicit direct-test + related-source scope preserves both contracts without widening to full unit. Two private unit leaves are allowed.
- Removed/moved relations that cannot be represented from the current tree and known global unit infrastructure widen to full unit.
- A relevant related run that finds zero tests remains a visible Vitest failure; it must not be converted to a successful skip.
- Deterministically unit-irrelevant paths still skip unit.

### Mutation

- One explicit project-owned mutation registry is the only durable source of mutation ownership.
- Initial registry contains exactly these four targets:
  1. `src/shared/lib/changeObject/deepPatchJsonObject.ts` -> `src/shared/lib/changeObject/deepPatchJsonObject.test.ts` — recursive patch/delete/normalization semantics mutate nested JSON/CRDT-compatible state and are broadly reused.
  2. `src/shared/lib/changeObject/deepPutJsonObject.ts` -> `src/shared/lib/changeObject/deepPutJsonObject.test.ts` — recursive replacement/deletion semantics mutate nested JSON/CRDT-compatible state and are broadly reused.
  3. `src/shared/lib/migrations/defineMigrations.ts` -> `src/shared/lib/migrations/defineMigrations.test.ts` — migration ordering/version application/validation protects persisted-data compatibility.
  4. `src/shared/lib/migrations/defineVersion.ts` -> `src/shared/lib/migrations/defineVersion.test.ts` — schema/version transition definition is part of the persisted-data migration boundary.
- Focused/default mutation selects a registered target only when its exact source or exact owning test is affected, except mutation infrastructure changes which select all registered targets.
- `stryker.config.mjs` derives its complete `mutate` list only from the same registry.
- Literal `--full` executes all and only registered mutation targets, with no affected narrowing.

### Performance

- No performance runner, registry, placeholder spec, or arbitrary threshold is introduced.
- `--only performance` remains a valid successful empty selection.
- `--full` has zero performance commands while the registered persistent inventory is empty.

## Architecture decision and ownership

### Unit planner

Create one small unit-specific planner under `scripts/lib/`, preferably `unitRisk.ts`, with the `skip | focused | full` shape defined in `docs/testing/verify-redesign-pass-e-implementation.md`.

`main()` must resolve the unit plan from the existing full status-aware changed-path context and pass it into `buildCommands`. Preserve the existing resolved diff base from `resolveChangedPathsScope`; do not run Git again and do not infer a second base inside the unit planner.

Extend changed-path context only as narrowly as required to preserve the input kind/statuses and the already-resolved diff base needed by the unit planner. Do not redesign `changedPaths.ts`.

For a focused Git plan, emit the native changed command. For explicit files, classify direct tests, deterministic standard Vitest snapshot ownership, related existing source/support paths, irrelevant paths, and unsafe/global paths.

If direct tests and related paths are both present, retain `unit-tests` for direct tests and add at most one private `unit-related` leaf. Both are owned by public type `unit`. Do not add a wrapper command or new public type. The new unit leaf must preserve the same unit blocking-log behavior, including `[Vue warn]` detection, and must not weaken existing logging/status/rerun behavior.

At minimum, unit-global impact includes `vitest.config.ts`, `src/setupVitest.ts`, `package.json`, `pnpm-lock.yaml`, and the configuration modules that define Vitest resolution/setup. Keep global classification narrow and infrastructure-owned; it is not a source-to-test registry.

### Mutation registry/planner

Create `scripts/lib/mutationTargets.ts` as the single explicit registry owner using the exact `MutationTarget` contract from the Pass E implementation document. Keep validation/planning in that concrete mutation boundary; one adjacent small mutation-specific helper is acceptable only if it improves cohesion. Do not create a generic resolver framework.

Validation must fail before Stryker execution for missing source, missing owning test, duplicate source, zero tests, empty/whitespace reason, or malformed entry. Invalid registry state is a failed mutation plan, not full fallback.

Remove both adjacency mechanisms completely: `getMutationSourceCandidate` / `getMutationScope`-style inference in `scripts/verify.ts`, and recursive `*.test.ts` -> sibling-source discovery in `stryker.config.mjs`.

Prefer importing the TypeScript registry directly from `stryker.config.mjs` under the repository Node 24 runtime. Prove the real Stryker config load. If Stryker demonstrably cannot load the `.ts` registry natively, stop and report that concrete incompatibility; do not duplicate the registry in JavaScript and do not add a loader/transpilation layer.

### Performance

No implementation abstraction is needed beyond preserving the existing valid empty public selection. Do not add files merely to represent an empty inventory.

## Constraints

- Pass E only. Do not start Pass F.
- Do not modify production feature code.
- Do not change the eight public verification types or literal `--full` contract.
- Do not change accepted E2E, behavior, visual, browser-integration, Playwright project, production-artifact, container, or machine-lock semantics.
- Do not change status/resume, heartbeat, timeout, warning/log, or expensive-command ownership except the minimum local update needed for the new unit leaf to behave exactly like unit proof.
- Do not use dependency-cruiser, a custom import parser, or another dependency graph for unit or mutation.
- Do not add source-prefix -> unit-test mappings, synthetic imports, mutation tags/decorators/self-registration, `*.mutation.spec.ts`, or adjacency fallback.
- Do not register `src/shared/lib/cache/index.ts` or other sibling-tested files merely because legacy planner tests used them as fixtures.
- Do not enable `passWithNoTests` or otherwise turn zero related tests into successful irrelevance.
- Do not invent persistent performance budgets from one-off profiling evidence.
- New/task-touched tooling should remain TypeScript-first where the current runtime supports it; do not introduce loader infrastructure solely for extension consistency.

## Acceptance criteria

### Unit

- Direct changed unit tests select themselves.
- A normal Git-diff unit-relevant scope produces native Vitest `--changed` with the already-resolved diff base.
- Explicit unit-relevant source/support paths produce native `vitest related --run`.
- Explicit direct-test + related-source input produces both private unit leaves without full-unit widening.
- Standard external Vitest snapshot ownership is deterministic when applicable.
- Removed/moved unsafe unit relations and known global unit infrastructure produce full unit.
- Unit-irrelevant docs/proof paths can still skip unit.
- Zero related tests remain a failing command result.
- No sibling adjacency or custom dependency graph remains as unit affected ownership.

### Mutation

- The exact four-target registry validates.
- Missing source, missing test, duplicate source, zero tests, empty reason, and malformed target are rejected deterministically.
- Changed registered source selects exactly that target.
- Changed registered owning test selects exactly that target.
- Unrelated production source with a sibling unit test does not become a mutation target.
- Mutation registry/Stryker infrastructure changes select the complete four-target inventory.
- `--only mutation --files ...` uses the same exact registry relation.
- `--full` runs Stryker with no affected `-m` narrowing and the Stryker config mutate inventory is exactly the four registered sources.
- `stryker.config.mjs` contains no recursive adjacency-derived inventory logic.

### Performance

- No persistent performance implementation is added.
- `--only performance` remains valid and empty.
- `--full` does not invent a performance leaf.

## Verification

Use focused implementation feedback only; do not run a broad local handoff gate.

Required risk-specific proof:

1. Focused unit verification for the new unit planner, changed-path plumbing, mutation registry/planner, Stryker config tests, and affected `scripts/verify.ts` planner tests.
2. One real native Vitest `--changed` or `related --run` proof that selects an owning test through Vitest dependency analysis rather than sibling adjacency.
3. One explicit mixed direct-test + related-source `pnpm verify --only unit --files ...` proof showing both unit leaves execute.
4. One focused `pnpm verify --only mutation --files ...` execution for a registered target.
5. A real full-registry Stryker dry-run/config load proving `mutate` is exactly the registered source set; use the existing Stryker CLI/config mechanism without adding a new wrapper.
6. Focused static/type-check verification for the touched tooling files.

Do not require `pnpm verify`, `pnpm verify --full`, or `pnpm verify:release` as coding-agent completion gates. GitHub CI is architect-owned.

## Forbidden

- Pass F changes, workflow migration, or removal of `pnpm verify:release`.
- Public verification type changes.
- Mutation adjacency retained as fallback or compatibility metadata.
- Unit dependency graph/import parsing or dependency-cruiser use.
- A generic planner/registry framework shared across unit and mutation.
- Zero-related success handling.
- Performance placeholder infrastructure or arbitrary timing budgets.
- Product code/test-behavior changes made only to fit the verifier.
- Weakening existing locks, Playwright/container boundaries, timeouts, logging, status/resume, or accepted Pass D behavior.

## Report

Return exactly the repository-standard coding report shape:

```text
TASK RESULT
status: complete | partial | blocked
remaining: none | <remaining implementation/proof/blocker>

LOCAL FEEDBACK
commands: none | <focused verifier-managed/risk-specific commands actually used>
status: not run | passed | failed | partial
reason if failed/partial: <exact reason>

CI GATE
status: architect-owned
```
