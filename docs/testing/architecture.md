# Testing architecture

This document is the canonical project-wide testing policy for Mioframe.

Its purpose is to make two decisions reliable and separate:

1. the coding agent chooses the proof that matches the changed contract and risk;
2. `verify` automatically resolves the repository diff to the smallest confirmed set of checks, with safe full-lane fallback for unknown relevant impact.

`verify` executes repository-backed facts. It never parses or depends on an agent report.

## Goal

Use the smallest reliable set of tests and measurements that completely protects changed observable contracts without duplicating framework, browser, foundation, component, or product behavior.

Automatic selection must be deterministic, inspectable, and fail closed. An empty inferred lane is never evidence that a proof type is unnecessary.

## Responsibilities

### Agent: test design

Before non-trivial implementation, the agent identifies:

- changed observable contracts and scenarios;
- applicable risks;
- the lowest faithful proof type;
- existing tests that already own the contract;
- tests that must be added or changed;
- repository impact metadata that must be added or updated;
- task-specific measurements that cannot be automated yet.

This is recorded in implementation preflight as `TEST IMPACT`. It is a reviewable decision record, not input to `verify`.

### Repository: durable impact facts

The repository stores facts that automation can validate:

- static imports between unit tests and source modules;
- snapshot-to-test ownership conventions;
- lane-specific source-to-spec mappings;
- lane relevance and full-lane fallback paths;
- justified standalone specs;
- release source-to-check mappings;
- persistent project applicability metadata when introduced;
- persistent mutation targets;
- persistent performance checks for durable budgets.

### Verify: planning and execution

`verify`:

- obtains changed paths and statuses from Git;
- validates repository impact metadata;
- resolves each execution lane independently;
- prints why each lane is skipped, focused, full, or invalid;
- executes the resulting plan;
- never infers test sufficiency from a skipped lane or a focused command with no matching tests.

## Core rules

### Test contracts, not implementation

Every test protects observable behavior, a public contract, persisted state, data safety, accessibility, accepted visible output, release behavior, or an explicit non-functional requirement.

Do not test private methods, incidental classes, render counts, framework lifecycle, internal branches, or third-party library behavior unless Mioframe owns the adaptation or outcome.

### One contract has one primary proof owner

Each contract has one primary proof type. Other proof types may verify a narrow integration seam or complete user outcome, but must not repeat the complete contract.

One production file may affect several contracts and therefore require several proof types.

### Use the lowest faithful proof type

Choose the cheapest environment that reproduces the real semantics. A cheaper environment is invalid when it cannot model the behavior.

In particular, `happy-dom` does not prove real focus, keyboard behavior, pointer/touch, layout, geometry, scrolling, overlays, responsive behavior, browser APIs, or browser lifecycle.

### Proof is proportional to changed risk

Add or change proof when observable behavior, a public contract, persistence, migration, transformation, accessibility, performance, release behavior, or a reproducible defect changes.

Do not require a new test merely because a production file changed. A behavior-preserving refactor may rely on existing relevant proof when the accepted contract is already protected.

### Duplication is not additional assurance

Do not repeat the same algorithm matrix, browser behavior, foundation behavior, visual contract, product flow, or performance assertion across several proof types.

### Failures remain visible

Do not hide defects with arbitrary sleeps, `force`, broad retries, repeated action delivery, silent recovery, or helpers that accept a missing required state.

## Contract proof types

| Proof type                | Owns                                                                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deterministic behavior    | Pure helpers, schemas, domain decisions, service/storage/CRDT boundaries, migrations, transformations, cancellation, conflicts, typed errors, and deterministic multi-module outcomes |
| Component contract        | Public Vue props, emits, slots, native owner, explicit attributes, ARIA ownership, controlled semantic state, invalid combinations, and non-browser wiring                            |
| Reusable browser behavior | Isolated reusable UI focus, keyboard, pointer/touch, drag, geometry, scrolling, overlays, responsive rendering, motion lifecycle, and browser APIs                                    |
| Product scenario          | Complete user scenarios crossing page, feature, widget, service, worker, persistence, navigation, permission, provider, reload, import/export, or repository boundaries               |
| Visual regression         | Bounded deterministic appearance of canonical Storybook stories and accepted visual state matrices                                                                                    |
| Release behavior          | Production artifact bootstrap, routing, service-worker/channel isolation, installation, and release-only invariants                                                                   |

## Supplemental evidence and human gates

These strengthen or approve proof but are not primary owners of ordinary functional contracts:

- **Mutation audit** checks whether focused tests reject meaningful incorrect implementations of registered high-risk deterministic logic.
- **Performance evidence** measures an optimization claim or protects a durable named budget.
- **Automated accessibility scans** provide supplemental evidence; semantic and interaction contracts remain owned by component and browser proof.
- **Operator Material acceptance** compares prepared rendered evidence with canonical Material sources. Automation never reports this as accepted.

## Execution lanes

| Verify label or process      | Executes                                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| static verification          | Formatting, linting, type-checking, instruction compatibility, and other deterministic repository checks |
| `unit-tests`                 | Deterministic behavior and component-contract tests through Vitest                                       |
| `storybook-behavior`         | Reusable browser behavior through Playwright against isolated Storybook                                  |
| `e2e`                        | Complete product scenarios through application Playwright tests                                          |
| `visual`                     | Screenshot regression against canonical Storybook stories                                                |
| release verification         | Release behavior against the built production artifact                                                   |
| `mutation`                   | Registered narrow mutation targets                                                                       |
| persistent performance check | Existing automated benchmark or budget selected by repository impact metadata                            |
| task-specific measurement    | Reproducible one-off measurement named in preflight; not automatically inferred                          |
| operator review              | Manual Material comparison                                                                               |

## Proof boundaries

### Deterministic behavior

Use direct inputs, outputs, transitions, persisted effects, protocol messages, and typed failures. Use real owned modules where practical and mock only real external or nondeterministic boundaries.

A deterministic multi-module test remains in `unit-tests` when it proves a boundary result without browser rendering or complete application orchestration.

### Component contract

Use Vue Test Utils for stable public API, native semantics, explicit attributes, ARIA ownership, controlled state, invalid combinations, and narrow child/foundation wiring.

Do not prove real focus, keyboard operation, pointer/touch, layout, geometry, scrolling, overlays, responsive rendering, browser APIs, ripple, motion, elevation, or computed appearance here.

### Reusable browser behavior

Use isolated deterministic Storybook fixtures and real public browser input. Behavior specs contain no screenshots.

### Product scenario

Use app E2E when the complete user outcome or cross-boundary integration is the contract. Lower-level setup may establish valid initial state but must not perform the action under test.

### Visual regression

A visual spec opens a canonical deterministic story, waits for stable rendering, and captures a bounded surface. It contains no behavioral success criteria and does not reproduce token tables through computed-style matrices.

A baseline detects change; it does not prove Material correctness.

### Accessibility

- native semantics, accessible name, explicit ARIA ownership, disabled/readonly semantics: component contract;
- focus order, keyboard operation, focus restoration, actionability, overlay containment: reusable browser behavior or product scenario;
- automated scans: supplemental only;
- screenshot appearance alone does not prove accessibility.

## Automatic verification contract

### Changed paths

Automatic planning must preserve Git status, including:

- added path;
- modified path;
- deleted path;
- renamed path with both old and new names.

Resolvers must not receive only existing filenames. Deletion and rename are first-class risk because imports, mappings, snapshots, helpers, and specs may disappear.

`--files` is an explicit focused target override for existing paths. It is not a substitute for status-aware Git diff planning of deletion or rename.

### Lane plan

Every automatic resolver returns one of:

- `skip`: no repository-backed impact for the lane;
- `focused`: a non-empty sorted set of lane-defined execution inputs;
- `full`: the complete owning lane is required;
- `invalid`: impact metadata is inconsistent and verification must fail before test execution.

A focused input is exact and inspectable, but its meaning is lane-specific: a Playwright spec path, a direct unit test, a source path passed to the official Vitest related resolver, a release check, a mutation target, or another repository-owned check.

Rules:

- `invalid` blocks the run;
- `full` overrides focused inputs;
- overlapping mappings and duplicate inputs are unioned and deduplicated;
- every decision includes inspectable reasons;
- unknown relevant impact uses `full`, never `skip`;
- paths outside a lane's declared relevance do not select that lane.

## Static verification impact

Static checks use direct file capability rather than semantic test ownership:

- format and lint run for added or modified existing files supported by the corresponding tool;
- deleted files are not formatted or linted, but their removal still participates in type-check and affected metadata validation;
- type-check runs for added, modified, deleted, or renamed TypeScript, Vue, declaration, alias, typed configuration, package, or lockfile changes that can affect the program graph;
- instruction compatibility validation runs when `AGENTS.md`, skills, or their generator changes;
- shared static configuration changes run the complete owning static check;
- a path unsupported by a static tool does not select that tool.

Static checks do not replace behavioral, browser, visual, release, mutation, performance, or operator proof.

## Unit-test impact resolution

A dedicated unit resolver builds focused execution inputs from:

1. directly added or modified test files;
2. owning tests for added, modified, or deleted Vitest snapshots;
3. changed existing source modules and local test-support modules passed to the official Vitest related-test resolver.

The unit executor may use the supported Vitest CLI or API to resolve static-import relations. It must not build or persist a second dependency graph merely to precompute every related test path.

Direct tests, snapshot owners, and related source inputs are sorted and deduplicated. If a related run finds no tests, report that result explicitly; do not convert it to a full unit run. A no-match result is not evidence that the changed contract needs no unit test.

Select the full unit lane for:

- unresolved snapshots;
- deleted or renamed dependencies whose old relation cannot be represented safely;
- Vitest config or setup;
- global test utilities;
- known dynamic-import boundaries;
- generated aliases;
- any relation the official resolver cannot represent safely.

Return `skip` only when no direct test, snapshot owner, related source input, or full-fallback category applies.

## Playwright impact registries

`storybook-behavior`, `e2e`, and `visual` own separate registries. They may share only mechanical plan and validation helpers.

Each lane declares:

- its spec directory;
- broad stable relevant source domains;
- exact files and prefixes that require the full lane;
- source-to-spec mappings;
- justified standalone specs;
- snapshot ownership convention where applicable.

A source mapping means only production, story, fixture, or owned support source can affect listed specs. Spec paths must not be placed in `sourcePrefixes` to group tests.

Resolution order:

1. full-lane file or prefix -> full lane;
2. added or modified spec -> that spec;
3. deleted or renamed spec -> validate registry and run full owning lane unless the old relation is deterministically preserved;
4. visual snapshot -> owning visual spec, or full visual lane when unresolved;
5. mapped source -> union of matching specs;
6. unmapped source inside relevant source domains -> full lane;
7. path outside lane domains -> no selection.

Shared config, setup, global fixtures, and common helpers select the full owning lane unless the complete consumer set is explicit, small, stable, and validated.

Validation must reject:

- referenced missing specs;
- discovered specs with neither a source mapping nor justified standalone entry;
- duplicate mapping names;
- duplicate paths within one entry;
- empty mappings, targets, or standalone reasons;
- paths outside the owning lane;
- stale entries after spec move, rename, or deletion;
- snapshot ownership that cannot be resolved without the documented full-lane fallback.

A standalone spec is valid only when no truthful stable source mapping exists, such as lane-infrastructure smoke.

No cross-lane registry, production test annotations, or generic test DSL is allowed.

## Lane-specific rules

### Storybook behavior

Maps reusable component, foundation, story, and deterministic fixture sources to isolated browser behavior specs.

Changing a story may independently affect Storybook behavior and visual lanes. One lane must not infer the other.

### App E2E

Maps feature, entity, widget, page, service-client, provider, bootstrap, and cross-boundary sources to complete product scenarios.

Broad app bootstrap, worker/service protocol, E2E infrastructure, and unknown relevant product source use full app E2E fallback.

### Visual

Maps visible component, foundation, story, theme, font, icon, and rendering sources to canonical visual specs.

Visual snapshot ownership must be deterministic. An unresolved added, modified, deleted, or renamed baseline selects the full visual lane.

### Release verification

Focused development verification must automatically select release checks when the changed contract can only be proved against the built production artifact.

Release impact is repository-owned and independent from app E2E mappings. It covers stable source domains such as:

- build and release configuration;
- routing/base-path behavior in the built artifact;
- manifest, service worker, PWA, and channel isolation;
- release scripts and artifact assembly;
- runtime dependency changes that affect production output.

A release resolver uses the same `skip | focused | full | invalid` contract:

- known local impact selects exact build, artifact, or release-smoke checks;
- shared release infrastructure or unknown relevant release impact selects the full release lane;
- invalid or stale release metadata blocks verification.

`pnpm verify:release` remains the unconditional full-project gate for `main`. Automatic focused release selection during development does not replace it.

## Browser project applicability

Source impact chooses specs. Project applicability belongs to persistent test metadata, not to changed-file paths or agent prose.

The current desktop/mobile matrix must remain unchanged until all existing app E2E scenarios are audited and classified. Introducing project filtering must be a separate migration step that demonstrates preserved mobile-risk coverage and measured execution benefit.

Do not introduce a generic criticality tag as a substitute for platform risk. Add platform metadata only for an observable browser, viewport, touch, capability, lifecycle, or composition difference.

## Mutation impact

Mutation must remain automatically selected, but only from persistent registered targets rather than sibling-test guesses or transient agent decisions.

A mutation target owns:

- a unique name;
- exact high-risk source files;
- exact focused test files;
- a concrete risk reason.

The resolver selects the target when a registered source or owning focused test changes. Missing source/tests, duplicate ownership, empty reasons, deletion, or rename without registry maintenance is invalid.

Use exact files initially. Broad prefixes require demonstrated stable need and bounded cost.

Until this registry is implemented, existing legacy mutation behavior remains mandatory and is documented as a migration mismatch.

## Performance impact

Distinguish:

- a one-off PR claim, which requires a reproducible before/after measurement recorded in preflight;
- a durable product budget, which requires a repository-owned automated check and impact mapping.

`verify` can automatically select only persistent checks. Do not create a benchmark framework for one task.

## TEST IMPACT

Implementation preflight records only task-specific design:

```text
TEST IMPACT
Changed contracts:
Risks:
Proof owners:
Existing proof:
New or changed tests:
Repository impact metadata updates:
Task-specific measurements:
```

Rules:

- include only applicable proof; do not enumerate every lane with ceremonial `not applicable` entries;
- name exact existing or planned tests;
- update mappings, standalone records, platform metadata, mutation targets, release impact metadata, or persistent performance checks when the repository relation changes;
- update preflight if implementation changes the planned contracts or proof;
- `verify` never consumes this artifact.

## Shared code and consumer preservation

A shared change does not automatically require every product suite. Test the shared owner fully, then select representative consumers only where public APIs, composition, platform behavior, or integration paths differ materially.

Generic foundation behavior is tested once at the foundation owner. Consumers prove only routing, extension, deviation, or complete product outcome.

## Test helpers

Helpers may provide deterministic setup, semantic actions, and strict outcome waits. Required actions fail when preconditions or outcomes are absent. Optional cleanup is separate and is never behavior evidence.

Create shared helpers only after multiple current tests prove the same concrete need and extraction reduces total complexity.

## Review rejection criteria

Reject or revise proof when:

1. it uses a less faithful proof type than the behavior requires;
2. the same contract is already fully owned elsewhere;
3. assertions follow implementation rather than accepted contracts;
4. fixtures reconstruct broad product behavior through mocks;
5. browser instability is hidden by sleeps, force, retries, or recovery loops;
6. visual tests contain behavior or token-table assertions;
7. product E2E repeats deterministic logic branches or shared component states;
8. repository impact metadata is missing, stale, or semantically overloaded;
9. a spec path is used as a source mapping to group tests;
10. mobile coverage is reduced without complete audit and explicit evidence;
11. mutation applicability depends only on sibling files or transient agent prose;
12. a durable performance contract has no persistent automated protection;
13. release-only behavior changes without focused release proof or the full release gate;
14. a new framework, DSL, registry, validator, or abstraction has no repeated demonstrated need.

## Migration

Adopt this architecture incrementally through `docs/testing/migration-plan.md`.

Each migration step must preserve or strengthen current regression protection before narrowing execution. Do not redesign test ownership inside an ordinary product PR.
