# ADR: Unified `pnpm verify` architecture

- **Status:** Draft
- **Project:** Mioframe
- **Date:** 2026-08-24
- **Scope:** Verification architecture only; no implementation details are prescribed beyond what is required by the decisions below.

## Context

Mioframe needs one project-wide entry point for verification.

The current verification approach has become difficult to evolve safely, especially for browser-based tests where changed production files do not have a direct static-import relationship with the tests that exercise them.

The main constraints are:

- verification must be reliable enough for coding agents;
- the system should require as little manual metadata and maintenance as possible;
- expensive browser checks, especially E2E, must not run in full for every change;
- ambiguity must never silently reduce coverage;
- the architecture must stay simple enough to implement and maintain quickly;
- FSD ownership and repository structure should do as much of the work as possible.

The goal is not to find the mathematically smallest possible test set. The goal is the **smallest test set that can be proven safe to run**.

## Decision

`pnpm verify` is the single entry point for project verification.

### Default mode

```bash
pnpm verify
```

Default verification:

1. compares the current changes against `develop`;
2. determines which checks are applicable;
3. narrows the scope inside each applicable test type when this can be done safely;
4. expands coverage conservatively when the affected scope cannot be proven.

For normal code changes, most verification types may still be applicable. Impact analysis primarily exists to reduce the **number of tests inside a type**, especially expensive browser tests.

### Type filter

```bash
pnpm verify --only <type>
```

`--only` restricts verification to one explicit verification type.

It does not redefine the impact model of that type; the type still uses its normal affected-test selection rules.

### Full mode

```bash
pnpm verify --full
```

`--full` performs complete verification:

- all verification types;
- all tests within those types;
- no affected-test narrowing;
- no dependency-graph optimization.

This is the release-grade verification mode and is required for the `develop` → `main` release path.

`full` means full. It is not an optimization profile.

---

## Verification types

The top-level verification taxonomy is based on **what is being verified**, not on execution cost, runner, or whether a browser is required.

### 1. Static checks

Examples include linting, type checking, formatting or other deterministic source-level validation present in the repository.

Static checks are cheap and do not require affected-test ownership logic.

Exact tools and commands remain implementation details.

### 2. Unit tests

Unit tests are executed with Vitest.

Selection should rely on Vitest's own related/affected capability where static imports provide a reliable dependency relationship.

Mioframe should not duplicate Vitest's dependency analysis unless a concrete repository limitation requires it.

**Rule:** use the test runner's native dependency analysis before building custom analysis.

### 3. Behavior tests

Behavior tests verify isolated interactive behavior of a UI owner without requiring a complete product flow.

Possible owners include FSD modules such as features, widgets, panes, shared UI components, or other concrete UI owners allowed by repository architecture.

#### Placement

Behavior tests are colocated with their owner.

For a single test file, use an explicit behavior suffix.

If the behavior suite becomes large enough to require multiple files, a dedicated local test directory may be created next to that owner. It must remain local to that owner; there is no repository-wide behavior-test dumping ground.

#### Accessibility

Accessibility and keyboard-navigation checks are a subtype of behavior tests, not a separate top-level verification type.

### 4. Visual tests

Visual tests verify rendering and visual regressions.

They are colocated with the component or UI owner they verify.

The same structural rule as behavior tests applies:

- one explicit visual test file when small;
- a local owner-specific directory when the suite must be split;
- no shared global directory containing unrelated visual tests.

Visual ownership comes from code placement rather than a manually maintained global mapping.

### 5. Browser integration tests

Browser integration tests verify a browser-specific runtime contract of a module or service without exercising a complete end-user flow.

Examples may include browser storage, workers, browser APIs, update/runtime mechanisms, or similar integration boundaries.

#### Ownership and placement

A browser integration test is owned by the concrete module, entity, service, worker, or other runtime owner it verifies.

It is colocated with that owner and selected primarily through repository path/ownership.

It should use an explicit browser-integration naming convention.

No ownership graph or tag system is required for normal local browser integration tests.

#### PWA and release-runtime checks

PWA-related checks are not a separate top-level verification type.

Service worker, cache, install/update lifecycle, and similar PWA/runtime-release checks are treated as a subtype/profile of browser integration.

They must be included in `pnpm verify --full`.

### 6. Performance / stress tests

Performance tests remain a separate top-level type because their acceptance criterion is a measurable performance invariant rather than functional correctness.

#### Local performance tests

If the performance risk belongs to one concrete module or UI owner, the test is colocated with that owner.

Selection is path/ownership based.

#### Cross-system performance tests

If a performance property exists only across multiple systems, the test may have multiple affected owners.

Its ownership representation should follow the same minimal ownership model used for cross-owner E2E scenarios.

Performance tests must have a measurable invariant or threshold. A functional flow executed in a browser is not sufficient to classify a test as performance.

### 7. End-to-end tests

E2E tests verify complete product/user scenarios.

They are the most expensive verification type and therefore require the strongest affected-test narrowing.

E2E selection cannot rely only on direct static imports because a scenario may depend on routing, workers, storage, services, and several FSD owners without importing them directly from the test file.

#### Primary ownership

Each E2E test has one primary owner represented structurally by its location.

The repository structure, not a large manually maintained mapping table, is the default ownership source of truth.

This keeps the common case simple for coding agents.

#### Multiple owners

A scenario may legitimately affect multiple owners.

That should be treated as an exceptional case.

For such tests, additional ownership must be declared using the smallest explicit metadata mechanism supported by the final implementation. Tags are acceptable if they remain simple, validated, and limited to this exceptional case.

The common case must not require agents to maintain owner tags manually.

#### Affected owner discovery

For E2E, changed production files are traced through a reverse import/dependency graph until an FSD product owner is reached.

The graph is used to discover affected owners, not to infer business semantics of individual E2E scenarios.

The intended stopping boundary is the product-composition level, primarily widgets and panes/pages.

The exact implementation of the import graph should prefer existing repository/tool capabilities or a proven library. A custom TypeScript dependency analyzer should not be the default approach.

No generic graph abstraction or infrastructure layer should be introduced merely for future flexibility.

---

## Affected-test selection pipeline

Default `pnpm verify` follows this conceptual pipeline:

1. Compute changed files relative to `develop`.
2. Classify which verification types are applicable.
3. For each applicable type, use its own selection mechanism:
   - static: normal static checks;
   - unit: Vitest related/affected selection;
   - behavior: colocated ownership;
   - visual: colocated ownership;
   - browser integration: colocated ownership/path;
   - local performance: colocated ownership/path;
   - E2E: affected FSD owners discovered through reverse dependencies;
   - cross-system performance: affected owners using the same ownership principle as cross-owner E2E.
4. Validate verification structure and ownership invariants.
5. If safe narrowing cannot be proven, widen the scope conservatively.

There is no requirement for one universal affected-test algorithm across every test type.

Each type uses the simplest reliable mechanism appropriate to its dependency model.

---

## Fallback policy

Fallback is a safety mechanism, not the normal execution path.

The central rule is:

> `verify` narrows coverage only when it can prove that the narrower scope is safe.

When that proof is unavailable, coverage expands to the next meaningful scope while preserving as much known information as possible.

Example for E2E:

1. affected E2E tests/scenarios that can be mapped safely;
2. all E2E tests belonging to the affected owner(s);
3. all E2E tests if ownership cannot be established safely;
4. full project verification only when the uncertainty is broader than the E2E type itself or when `--full` is requested.

A fallback must never silently skip a potentially affected test.

Frequent fallback is considered an architecture/diagnostics signal. If ordinary changes regularly degrade to broad execution, the affected-test model is not working well enough and should be corrected rather than normalized.

---

## Structural invariants

`verify` must validate the structural rules that its own affected-test logic depends on.

A violation that makes test selection unreliable must fail verification and require correction.

At minimum, the architecture assumes:

- behavior tests are colocated with their owner;
- visual tests are colocated with their owner;
- browser integration tests are colocated with their runtime owner;
- local performance tests are colocated with their owner;
- E2E tests exist only in the allowed E2E ownership structure;
- the primary E2E owner can be derived structurally;
- any exceptional multi-owner metadata uses valid owners and a validated format;
- test naming is sufficient to classify tests deterministically;
- ambiguous/unclassifiable tests do not silently bypass verification.

The final implementation should keep these invariants minimal. Rules should exist because selection depends on them, not to enforce stylistic preferences.

---

## Ownership principles

Verification follows existing Mioframe/FSD ownership.

- **feature** owns feature-specific user behavior and state;
- **entity** owns domain behavior and entity operations;
- **widget** composes product functionality;
- **pane/page** owns navigation/composition and page-level flows;
- **shared** owns reusable low-level primitives;
- **service/worker** owns IO, persistence, providers, workers, and browser/runtime boundaries.

Tests should stay with the narrowest real owner whenever the test is local.

Cross-owner metadata is reserved for genuinely cross-system scenarios.

---

## Simplicity constraints

The implementation must avoid the failure mode of the previous verify redesign, where custom dependency logic became too difficult to maintain.

Therefore:

- do not build a complete custom dependency graph system unless existing tooling is demonstrably insufficient;
- do not maintain a large manual path-to-test mapping table;
- do not require routine manual tags for every E2E test;
- do not introduce a manager/service/registry abstraction solely to make the architecture look generic;
- prefer repository structure, static imports, runner-native affected selection, and small validated conventions;
- prefer a broader safe test run over complex inference;
- keep the affected-owner calculation as a small concrete implementation until real requirements justify extraction.

---

## Agent-safety requirements

The verification architecture must be difficult for coding agents to misuse.

Required properties:

- the normal placement of a test should automatically establish ownership;
- test classification should be deterministic from naming/location wherever possible;
- exceptional metadata must be minimal and machine validated;
- invalid structure must fail loudly;
- uncertainty must increase coverage rather than reduce it;
- error messages should explain what structural rule was violated and what the valid placement/ownership is.

The system should not depend on agents remembering an external manual mapping document during ordinary implementation.

---

## Non-goals

This ADR does not require:

- the absolutely minimal possible test set;
- a universal dependency graph for every verification type;
- automatic inference of business semantics from source code;
- one runner for all test types;
- a large framework such as Nx/Turborepo solely for verification;
- custom graph infrastructure for hypothetical future reuse;
- perfect zero-fallback affected analysis.

The architecture optimizes for **reliable narrowing with low maintenance cost**.

---

## Acceptance criteria for the architecture

The design is ready for implementation when the implementation task can satisfy all of the following:

1. `pnpm verify` is the only normal project verification entry point.
2. Default verification compares changes against `develop`.
3. `--only <type>` selects one verification type without inventing a separate impact model.
4. `--full` executes all checks and all tests without narrowing.
5. Unit narrowing delegates to Vitest where possible.
6. Colocated browser test types derive ownership from repository structure.
7. E2E affected selection uses changed-code dependencies to discover affected FSD owners.
8. The common E2E case requires no manual ownership mapping.
9. Cross-owner E2E/performance cases use only minimal validated explicit metadata.
10. Structural violations fail verification.
11. Uncertainty widens coverage safely.
12. The implementation does not introduce a large custom graph framework or manual global mapping table.

---

## Open implementation decisions

These were intentionally not fixed in this ADR and should be resolved from the current repository before coding:

- exact test filename suffixes;
- exact local directory names when a colocated suite has multiple files;
- exact `--only` type names exposed by the CLI;
- exact representation of exceptional multi-owner metadata;
- which existing dependency-analysis tool/library is used for reverse imports;
- exact FSD path parsing based on the current repository layout;
- exact static checks included in verification;
- exact commands/runners already present in the repository;
- CI wiring for default versus `--full` verification.

These are implementation details unless repository inspection shows that one of them changes ownership or safety guarantees.
