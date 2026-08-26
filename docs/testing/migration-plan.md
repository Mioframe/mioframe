# Testing architecture migration plan

`docs/testing/architecture.md` is the durable target. This file is intentionally operational: it records only the current executable migration state, constraints, and remaining capability transitions. Detailed older states remain in Git history. The concrete pass order is owned by `docs/testing/verify-redesign-implementation-preflight.md`.

## Migration constraints

- Every intermediate state remains safe; do not delete an old mechanism before its replacement is executable and proven in the same resulting tree.
- Preserve or strengthen proof before narrowing execution.
- Unknown relevant impact widens the owning verification type; structural invalidity fails verification.
- `verify` must not depend on agent prose, `TEST IMPACT`, uncommitted reports, or business-semantics inference.
- Do not create parallel durable ownership models. Compatibility is temporary and removed only after consumer inventory is empty.
- Preserve top-level verify locking, expensive-command locking, Playwright container boundaries, timeouts, logging, status/resume, profile/base handling, and fix semantics unless an accepted contract explicitly changes them.
- Do not start the next risky pass while the current pass has unresolved architectural/review findings.

## Current branch state

On `architecture/verify-redesign`:

- **Pass A:** completed and architect-accepted;
- **Pass B:** completed and architect-accepted;
- **Pass C:** completed and architect-accepted;
- **Pass D:** completed and architect-accepted at `c0aa686235d291089d413b77c4b5fe176acc07b3`;
- **Pass E:** architecture resolved in `docs/testing/verify-redesign-pass-e-implementation.md`; implementation is next;
- **Pass F:** blocked until Pass E is architect-accepted.

Pass D has no active `scripts/REVIEW.md`. Its filesystem/Playwright inventory completeness correction is part of the accepted state.

Exact-head GitHub CI is a separate architect-owned repository gate and is not implied by pass-level semantic acceptance.

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

`pnpm verify:release` still aliases `pnpm verify --full` only as transitional compatibility. Alias/consumer removal belongs to Pass F.

## Current type state

### Static

Static proof is already classified under the public `static` type. Storybook buildability remains static proof; release/version/build/artifact invariants that are static remain internal static leaves. No Pass E change is required.

### Unit

Vitest is the unit runner. Current focused unit planning is still transitional because `scripts/verify.ts` derives test files largely from direct/sibling adjacency.

Pass E target:

1. direct changed unit tests select themselves;
2. deterministic standard snapshot ownership selects the owning unit test where applicable;
3. git-diff source/test-support impact delegates to Vitest native changed/affected analysis using the already resolved diff base;
4. explicit source/test-support impact delegates to `vitest related --run`;
5. removed/moved/global relations that cannot be represented safely widen to full unit;
6. a zero-match related run is visible fail-closed evidence, not successful irrelevance;
7. no second unit dependency graph is introduced.

### Behavior

Complete and target-owned. Ordinary isolated browser behavior uses truthful owner-local `*.behavior.spec.ts`; legacy `*.browser.spec.ts` discovery and ordinary central Storybook assertion ownership are removed.

### Visual

Complete and target-owned. Persistent visual proof uses owner-local `*.visual.spec.ts` plus owner-local baselines. Ordinary central visual assertion discovery is removed. Shared Storybook visual support remains support only.

### Browser integration

Complete and target-owned. `*.browser-integration.spec.ts` is owner-local. Managed-update/artifact runtime proof retains existing release-named Playwright/container execution infrastructure only because it preserves required built-artifact/fresh-container/cross-engine semantics. Generic owner-local browser integration uses the same container boundary through its private leaf.

### Application E2E

Pass D is complete and accepted.

- Target assertions exist only under `tests/e2e/pages/<Owner>/**/*.e2e.spec.ts` and `tests/e2e/widgets/<Owner>/**/*.e2e.spec.ts`.
- Primary owner is derived only from path and validated against current production owner directories.
- Additional ownership is exceptional Playwright `_mioframe-owner` annotation metadata; the current inventory requires zero additional-owner annotations.
- Changed production source uses one `dependency-cruiser` reverse graph to reach widget/page owners.
- Project applicability remains an independent `desktop | mobile | both` registry.
- Ordinary E2E excludes `productionArtifact/`; the three production-artifact scenarios retain existing release/fresh-container execution.
- The structurally valid filesystem target E2E set is the independent target-existence source of truth and must equal the union of Playwright-collected target paths before selection.
- Missing, unexpected, duplicate, malformed, or stale inventory/owner state fails structurally.
- `E2E_SCENARIO_SCOPES` and production source-prefix -> spec mappings are gone and must not return.

### Mutation

Stryker remains the mutation runner, but current durable ownership is still transitional: `stryker.config.mjs` and focused verifier planning infer mutation sources from colocated/sibling unit tests.

Pass E replaces both with one validated explicit project-owned mutation target registry. The accepted initial registry is the four deterministic high-risk source/test pairs recorded in `docs/testing/verify-redesign-pass-e-implementation.md`. Default/focused mutation uses registered source/test relations only; mutation-infrastructure changes select all registered targets; `--full` executes all registered targets.

Adjacency-derived mutation ownership must be removed, not retained as fallback metadata.

### Performance

`performance` is a valid public type, but the repository currently has no persistent `*.performance.spec.ts` target with an exact durable budget.

Therefore the current persistent inventory is intentionally empty. Pass E must not invent a placeholder runner, registry, or threshold. `--only performance` remains a valid empty result and `--full` has zero performance targets until a real measurable owner is introduced.

## Public-contract difference still remaining

| Concern                                      | Current executable state                                               | Durable target / remaining pass                           |
| -------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| public types                                 | canonical eight types                                                  | complete                                                  |
| behavior/visual/browser-integration taxonomy | target suffixes/owners                                                 | complete                                                  |
| E2E ownership/impact                         | structural owners + complete containerized metadata + reverse graph    | complete                                                  |
| unit impact                                  | transitional direct/sibling selection                                  | Pass E native Vitest changed/related + safe full fallback |
| mutation ownership                           | adjacency-derived                                                      | Pass E explicit validated registry                        |
| performance                                  | valid type, empty persistent inventory                                 | remains empty until real budget exists                    |
| release compatibility                        | private release-named leaves/runners and `verify:release` alias remain | Pass F consumer migration/removal where safe              |
| CI consumers                                 | transitional repository commands may remain                            | Pass F type-command/final full-gate cleanup               |

## Remaining pass boundaries

### Pass E — unit / mutation / performance final semantics

Status: **architecture ready; implementation next.**

Required:

- implement Vitest-native changed/related unit planning with direct-test handling and safe full fallback;
- replace adjacency-derived mutation ownership with the accepted explicit registry and validator;
- make Stryker's complete mutate inventory derive from that registry;
- prove focused registered mutation selection and literal full registry execution;
- preserve performance as an intentionally empty persistent inventory because no real durable budget exists;
- do not start Pass F cleanup.

Focused proof is defined in `docs/testing/verify-redesign-pass-e-implementation.md`.

### Pass F — CI and compatibility removal

Status: **blocked until Pass E architect acceptance.**

After all target mechanisms are executable and consumer search is complete:

- migrate repository workflow consumers to public verification types and canonical `pnpm verify --full` where appropriate;
- remove `pnpm verify:release` only after its repository consumer inventory is empty;
- remove stale compatibility docs/comments that describe migrated mechanisms as current;
- preserve internal execution filenames/runners when they still own a real execution constraint rather than renaming for aesthetics;
- finish final source-of-truth documentation and exact-head CI review.

## Removed compatibility that must not return

- public low-level `--only` labels;
- legacy `*.browser.spec.ts` discovery;
- ordinary central behavior/visual assertion ownership;
- root/release application E2E assertion ownership;
- `E2E_SCENARIO_SCOPES` and equivalent production-path -> E2E-spec registries;
- host Playwright ownership metadata execution;
- a second E2E graph engine.

## Verification during migration

Each pass proves its own mechanism with focused verification. A broad green run does not prove ownership/fallback correctness.

- Pass D proof includes owner parsing/traversal, filesystem/Playwright equality, project applicability, direct/remove/move behavior, containerized metadata, and real graph selection.
- Pass E proof must include native Vitest changed/related behavior, zero-match handling/full fallback cases, mutation registry validation/selection/full semantics, Stryker registry loading, and intentional empty performance behavior.
- Pass F proof must include workflow/public-command inventory and consumer absence for every removed compatibility surface.

Known flaky behavior is failed proof; retry-pass classification is not acceptance.

GitHub CI on the exact final PR head remains the final automatic repository gate.

## Completion criteria

The redesign is complete when:

- `pnpm verify` is the normal project verification entry point;
- public `--only` exposes only canonical verification types;
- every persistent spec type has deterministic target naming/ownership;
- unit uses Vitest native affected/related selection with safe fallback;
- mutation uses only validated explicit registered targets and participates in `--full`;
- persistent performance proof exists only for real measurable budgets;
- E2E ownership and affected selection remain structural/fail-closed;
- uncertainty widens only the owning type unless uncertainty is genuinely cross-type;
- structural invalidity fails verification;
- remaining compatibility aliases/mappings have no repository consumers before removal;
- `pnpm verify --full` runs every current type inventory, every target spec, every registered mutation target, and every registered persistent performance target without affected narrowing;
- exact-head GitHub CI is green on the final resulting PR head.
