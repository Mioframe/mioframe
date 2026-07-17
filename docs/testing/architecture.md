# Testing architecture

This document is the canonical project-wide testing policy for Mioframe. Skills explain how to create and run proof. `verify` executes selected checks; it does not decide whether the implementation has sufficient proof.

## Goal

Use the smallest reliable set of tests and measurements that completely proves the changed contracts without duplicating framework, browser, foundation, component, or product behavior.

Proof protects observable behavior, public contracts, persisted state, data safety, accessibility, accepted visible output, and explicit non-functional requirements. It must not become a second implementation or a substitute for architecture review.

## Core rules

### Test contracts, not implementation

Every test names the behavior or contract it protects. Do not test private methods, incidental classes, render counts, framework lifecycle, internal branches, or third-party library behavior unless Mioframe explicitly owns the adaptation or outcome.

### One contract has one primary proof owner

Each behavior has one primary proof type. Other proof types may verify a narrow integration seam or complete user outcome, but must not repeat the complete contract.

One production file may change several contracts and therefore require several proof types. “One owner” never means “one file, one test type.”

### Use the lowest faithful proof type

Choose the lowest proof type that reproduces the real semantics. A cheaper environment is invalid when it cannot model the behavior. In particular, `happy-dom` must not simulate focus, pointer, layout, scrolling, overlays, responsive behavior, or browser lifecycle.

### Proof is proportional to changed risk

Add or change proof when observable behavior, a public contract, persistence, migration, transformation, accessibility, performance, or a reproducible defect changes. Do not require a new test merely because a production file changed.

For a bug fix, add the smallest regression test at the owning proof type. For a behavior-preserving refactor, use existing relevant coverage unless the refactor exposes an unprotected accepted contract.

### Duplication is not additional assurance

Do not repeat the same algorithm matrix, browser behavior, foundation behavior, visual contract, product flow, or performance assertion at multiple proof types. Keep complete proof at the owner and preserve only narrow wiring or end-to-end outcomes elsewhere.

### Failures must remain visible

Tests use deterministic setup and observable outcomes. Do not hide defects with arbitrary sleeps, `force`, broad retries, recovery loops, or helpers that silently accept a missing required state.

## Proof types

Proof types describe what is proved. They are architectural ownership, not command names.

| Proof type                 | Owns                                                                                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pure behavior              | Pure helpers, schemas, state transitions, domain/service/storage/CRDT behavior, validation, migration, normalization, filtering, sorting, matching, and transformations     |
| Component contract         | Public Vue props, emits, slots, native owner, explicit attributes, ARIA ownership, controlled semantic state, invalid combinations, and non-browser child/foundation wiring |
| Reusable browser behavior  | Isolated reusable UI focus, keyboard, pointer, touch, drag, layout, scrolling, overlays, responsive behavior, motion lifecycle, and browser APIs                            |
| Product scenario           | Complete user scenarios crossing page, feature, widget, service, worker, persistence, navigation, permission, provider, reload, import/export, or repository boundaries     |
| Visual appearance          | Bounded deterministic appearance of canonical Storybook stories and accepted visual state matrices                                                                          |
| Release behavior           | Production artifact bootstrap, routing, service-worker/channel isolation, and release-only invariants                                                                       |
| Performance evidence       | Explicit performance, memory, startup, main-thread, or bundle-size requirements measured against a named budget or baseline                                                 |
| Mutation audit             | Whether changed focused tests reject incorrect high-risk pure/domain/service/storage logic                                                                                  |
| Operator visual acceptance | Whether intentional Material output matches named canonical Material evidence                                                                                               |

## Execution lanes

Execution lanes describe how repository checks run.

| Verify label or process   | Executes                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| `unit-tests`              | Pure behavior and component-contract tests through Vitest                                          |
| `storybook-behavior`      | Reusable browser behavior through Playwright against isolated Storybook                            |
| `e2e`                     | Product scenarios through application Playwright tests                                             |
| `visual`                  | Screenshot regression through Playwright against canonical Storybook stories                       |
| release verification      | Release behavior against the built production artifact                                             |
| task-specific measurement | Existing benchmark/build check or reproducible measurement for an explicit performance requirement |
| `mutation`                | Explicit narrow mutation audit after focused tests pass                                            |
| operator review           | Manual Material comparison; never inferred as accepted by automation                               |

A proof type may be absent because the changed contract does not own it. It must not be omitted merely because the correct proof is difficult to implement.

## Proof boundaries

### Pure behavior

Use direct inputs and outputs with local fixtures. Mock only real external boundaries. Do not reconstruct pages, feature flows, browser lifecycle, or service orchestration through broad global mocks.

Module-level integration inside Vitest is still part of the `unit-tests` execution lane when it proves a deterministic boundary without browser or full product semantics.

### Component contract

Use Vue Test Utils for stable public API, native semantics, ARIA ownership, controlled state, invalid combinations, and non-browser wiring.

Do not prove focus-visible, keyboard operation, pointer/touch behavior, layout, geometry, scrolling, responsive behavior, overlays, browser APIs, ripple, motion, elevation, or computed appearance here.

### Reusable browser behavior

Use isolated deterministic Storybook fixtures and real public browser input. Specs contain no screenshots. Forced visual state may prepare appearance but does not prove acquisition, transition, cancellation, cleanup, or actionability.

### Product scenario

Use app E2E only when the complete user scenario or cross-boundary integration is the contract. Lower-level fixtures may establish valid initial state but must not perform the action under test.

### Visual appearance

A visual spec opens a canonical deterministic story, waits for stable rendering, and captures a bounded surface. It contains no behavioral success criteria and does not reproduce complete token tables through computed-style matrices.

A baseline detects change; it does not prove Material correctness.

### Accessibility ownership

Accessibility is distributed by contract:

- native semantics, explicit ARIA ownership, accessible name, disabled/readonly semantics: component contract;
- focus order, keyboard operation, focus restoration, pointer target actionability, overlay containment: reusable browser behavior or product scenario according to ownership;
- automated accessibility scans: supplemental evidence only;
- visual accessibility: not proved by a screenshot alone.

### Performance and static verification

A performance claim requires a named metric, representative dataset or scenario, environment, and budget or baseline. Use an existing benchmark/build check when available; otherwise record a reproducible measurement in `TEST IMPACT`.

Do not create a permanent performance lane, benchmark framework, or CI budget for one task. Add automation only after repeated current changes prove a stable need.

Formatting, linting, and type-checking are mandatory static verification gates. They do not replace behavioral, visual, accessibility, release, or performance proof.

## Required proof by change type

| Change                                                                                  | Minimum expected proof                                                                                   |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Pure/domain/service/storage behavior                                                    | Pure behavior tests                                                                                      |
| High-risk pure/domain/service/storage behavior with changed tests                       | Pure behavior tests, then explicit narrow mutation audit                                                 |
| Public Vue API or semantic wiring                                                       | Component contract                                                                                       |
| Reusable focus/keyboard/pointer/touch/scroll/layout/overlay/responsive/browser behavior | Reusable browser behavior                                                                                |
| Complete product scenario or cross-boundary integration                                 | Product scenario                                                                                         |
| Intentional visible contract change                                                     | Visual appearance; operator visual acceptance when Material applies                                      |
| Shared foundation behavior                                                              | Foundation-owned proof plus narrow affected-consumer wiring                                              |
| Public import, wrapper, or API migration                                                | Owning contract proof plus representative consumer preservation                                          |
| Reproducible defect                                                                     | One initial focused regression at the owning proof type, followed by the minimum complete acceptance set |
| Behavior-preserving refactor                                                            | Existing relevant proof; no mandatory new test                                                           |
| Performance-sensitive change or optimization claim                                      | Performance evidence against a named metric and representative scenario                                  |
| Verify/resolver/test infrastructure                                                     | Resolver unit tests and every affected command mode                                                      |
| Release/bootstrap behavior                                                              | Release behavior                                                                                         |

## Required TEST IMPACT artifact

Every non-trivial code, test, tooling, CI, or configuration change records a compact `TEST IMPACT` in implementation preflight. Architecture handoff records required proof types and risk; preflight resolves exact files and execution.

```text
TEST IMPACT
Changed contracts:
- <contract or scenario>

Required proof:
- unit-tests: <existing/new test paths | not applicable: reason>
- storybook-behavior: <spec paths | not applicable: reason>
- e2e: <spec paths | not applicable: reason>
- visual: <spec paths | not applicable: reason>
- release: <checks | not applicable: reason>
- performance: <metric/check/measurement | not applicable: reason>

Impact resolution:
- unit: related import graph | direct test | full-lane fallback
- Playwright: existing mapping | mapping update | justified standalone | full-lane fallback

Projects:
- canonical | canonical + mobile (<risk>)

Mutation:
- applicable: <source/test scope and risk>
  | not applicable: <reason>
```

The artifact is a decision record, not a new manifest. Do not commit one per task unless an existing repository workflow already persists the surrounding handoff or preflight.

## Automatic impact resolution

Automatic selection optimizes execution. It must be deterministic, inspectable, and fail closed. It never replaces the `TEST IMPACT` decision.

### Vitest: import-based related selection

For `unit-tests`:

1. run directly changed test files;
2. for changed existing non-test modules, including production files and local test helpers/fixtures imported by tests, use Vitest related-test selection based on static imports;
3. use a full `unit-tests` fallback for deleted or renamed non-test modules, Vitest config/setup, global test utilities, known dynamic-import boundaries, generated aliases, or any relation Vitest cannot represent safely;
4. union and deduplicate direct and related test paths;
5. do not maintain a second generic dependency graph.

Related selection follows static imports and does not cover dynamic imports. Resolver tests must protect every fallback category.

### Playwright: small lane-specific impact registries

Maintain separate registries for `storybook-behavior`, `e2e`, and `visual`, using shared mechanical schemas and validation. A mapping records only source-to-spec impact; it must not duplicate product architecture.

```ts
interface TestImpactEntry {
  readonly name: string;
  readonly sourcePrefixes: readonly string[];
  readonly specs: readonly string[];
}

interface StandaloneSpecEntry {
  readonly spec: string;
  readonly reason: string;
}
```

Use a standalone entry only when a spec has no truthful stable source mapping, such as lane-infrastructure smoke. Do not use it to avoid maintaining known impact.

Entry names, arrays, specs, and reasons are non-empty. Rules:

1. a changed spec selects itself;
2. a changed mapped source selects the union of all matching registered specs;
3. every discovered spec is covered by a mapping or a justified standalone entry;
4. a new, moved, or removed Playwright spec updates its owning mapping or standalone list in the same change;
5. a shared lane config, global fixture, or common helper selects the complete owning lane unless all consumers are explicit and validated;
6. unknown production impact selects the complete potentially affected lane;
7. missing specs, duplicate mapping names, duplicate paths within one entry, duplicate standalone specs, empty reasons, invalid paths, or broken registry coverage fail closed;
8. overlapping source prefixes and the same spec referenced by multiple mappings are valid; planning unions and deduplicates their output;
9. do not create a cross-lane dependency graph, production annotations, or a generic test DSL.

### Desktop and mobile projects

The canonical desktop project runs all selected app E2E scenarios. The mobile project runs only scenarios tagged for real mobile risk or the small critical cross-platform smoke set.

Use Playwright tags:

- `@mobile`: touch, viewport, responsive composition, overlay, mobile capability, or mobile lifecycle risk;
- `@critical`: small essential smoke scenario that must run on both canonical and mobile projects.

Configure the mobile project with project-level tag filtering. Reusable responsive behavior remains in focused Storybook behavior specs with explicit viewports.

### Mutation

Do not infer semantic mutation applicability from file paths or sibling tests. The agent selects mutation explicitly in `TEST IMPACT` only after the mutation skill activation check passes. `verify --only mutation --files ...` remains the supported execution path.

During migration, final `pnpm verify` remains mandatory and may still execute legacy broad mutation selection until the resolver is corrected.

### Safe fallback

- known source owner: mapped focused specs;
- changed test/spec: that test/spec;
- changed common helper/config: full owning lane;
- deleted/renamed unit dependency or unknown unit relation: full unit lane;
- unknown production impact: full potentially affected Playwright lane;
- empty inferred scope: never evidence that a proof type is unnecessary.

## Shared code and consumer preservation

A shared change does not automatically require every product suite. Test the shared owner fully, then select representative consumers only where public APIs, composition, platform behavior, or integration paths differ materially.

Generic foundation behavior is tested once at the foundation owner. Consumers prove only routing, extension, deviation, or product outcome.

## Test helpers

Helpers may provide deterministic setup, semantic actions, and strict outcome waits. Separate strict action/assertion helpers from optional cleanup helpers. A required action fails when its precondition or result is absent; it never silently returns or repeats an action through fallback recovery.

Create shared test helpers only after multiple current tests prove the same concrete need and extraction reduces total complexity.

## Review rejection criteria

Reject or revise proof when:

1. it uses a less faithful proof type than the behavior requires;
2. the same contract is already fully owned elsewhere;
3. assertions follow implementation rather than accepted contracts;
4. fixtures reconstruct broad product behavior through mocks;
5. browser instability is hidden by sleeps, force, retries, or recovery loops;
6. visual tests contain behavior or token-table assertions;
7. product E2E repeats pure logic branches or shared component states;
8. mutation is broad, automatic, or unrelated to changed high-risk tests;
9. desktop/mobile duplication has no platform-specific or critical-smoke reason;
10. a performance or optimization claim has no representative metric and baseline/budget;
11. a standalone spec has a known stable source mapping or no concrete reason;
12. a new framework, DSL, registry, validator, or abstraction has no repeated demonstrated need.

## Existing-suite migration

Adopt this policy incrementally. When a touched test violates ownership, preserve required regression protection at the correct proof type, remove duplicate or implementation-detail assertions, and update impact mapping only when the mechanical relation is stable.

Track broad existing mismatches in `docs/testing/migration-plan.md`. Do not expand an ordinary product task into unrelated suite cleanup.
