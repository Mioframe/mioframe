# Testing architecture

This document is the canonical testing policy for Mioframe. Repository skills define how to apply this policy; `scripts/verify.mjs` and its risk resolvers execute selected checks but do not decide whether the proof for a change is sufficient.

## Goal

Use the smallest reliable set of tests that completely proves the changed contracts without duplicating framework, browser, foundation, component, or product behavior.

Tests protect observable behavior, public contracts, persisted state, data safety, and accepted visible output. They must not become a second implementation or a substitute for architecture review.

## Core rules

### Test contracts, not implementation

A test must name the behavior or contract it protects. Do not test internal methods, incidental class names, render counts, framework lifecycle, private state, or implementation branches unless they are themselves an accepted public or architectural contract.

Do not test Vue, Playwright, the browser, or third-party library behavior that Mioframe does not own. Test only Mioframe configuration, adaptation, wiring, and outcomes.

### One contract has one primary owner

Each behavior has one primary proof layer. Other layers may verify an integration seam but must not repeat the complete contract.

Examples:

- a sorting helper owns all ordering edge cases in unit tests; an app e2e test may prove that the selected order is visible and persists after reload;
- Material foundation owns generic focus-indicator acquisition and rendering; a component family proves only its public wiring and family-specific deviations;
- a shared component owns isolated pointer behavior in Storybook; product e2e proves only the complete user action that consumes it.

### Use the lowest faithful layer

Choose the lowest test layer that can reproduce the real semantics:

- pure, domain, service, storage, CRDT, validation, and transformation logic: unit tests;
- Vue public API and non-browser wiring: component contract tests;
- focus, keyboard, pointer, touch, layout, scrolling, overlays, responsive behavior, and browser APIs: Playwright in a real browser;
- complete product flows crossing feature, page, service, persistence, or navigation boundaries: app e2e;
- rendered appearance: visual regression;
- strength of focused tests for high-risk logic: explicit mutation testing.

A lower-cost environment is not valid when it cannot faithfully model the behavior. In particular, `happy-dom` must not be used to simulate browser interaction or layout contracts.

### Proof is proportional to risk

Add or change tests when observable behavior, a public contract, persistence, migration, transformation, or a reproducible defect changes.

Do not require a new test merely because a production file changed. Refactors, type-only edits, formatting, comments, renames, documentation, and internal cleanup with no behavior change normally rely on existing relevant coverage and final verification.

For a bug fix, add the smallest regression test at the layer that owns the broken behavior. Do not broaden the suite to adjacent scenarios without evidence of shared risk.

### Tests must diagnose failures

A test should have one cohesive owner, local fixtures, deterministic setup, and assertions that identify the broken contract. Split a test file by behavior when setup becomes conditional, fixtures stop being local, or a failure no longer identifies one behavior.

Do not hide product instability with arbitrary sleeps, `force`, broad retries, recovery loops, or helpers that silently accept a missing expected state.

### Duplication is not additional assurance

Do not repeat the same state matrix, algorithm branches, browser behavior, or visual contract at multiple layers. Cross-layer overlap is allowed only to prove a narrow integration seam or a complete user outcome.

When two tests protect the same contract, keep the test at the owning layer and remove or reduce the duplicate.

## Test lanes and ownership

| Lane                       | Location                                          | Owns                                                                                                                                                                           |
| -------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unit and pure behavior     | colocated `*.test.ts` / script `*.test.mjs`       | Pure helpers, schemas, migrations, state transitions, services, storage helpers, CRDT operations, validation, normalization, filtering, sorting, matching, and transformations |
| Component contract         | colocated `<Component>.test.ts`                   | Public props, emits, slots, native owner, explicit attributes, ARIA ownership, controlled semantic state, invalid combinations, and simple child/foundation wiring             |
| Storybook browser behavior | `tests/e2e/storybook/`                            | Isolated reusable UI behavior requiring real focus, keyboard, pointer, touch, drag, scrolling, overlay, geometry, responsive, motion, or browser lifecycle semantics           |
| App e2e                    | `tests/e2e/*.spec.ts` excluding specialized lanes | Complete user scenarios through product surfaces, navigation, feature composition, workers/services, persistence, reload, import/export, permissions, and provider integration |
| Visual regression          | `tests/e2e/visual/`                               | Bounded deterministic appearance of canonical Storybook stories and accepted visual state matrices                                                                             |
| Release smoke              | `tests/e2e/release/`                              | Production artifact bootstrap, routing, service worker/channel isolation, and release-only invariants                                                                          |
| Mutation audit             | explicit focused run                              | Whether focused unit or integration tests reject incorrect high-risk logic                                                                                                     |
| Operator visual review     | prepared canonical stories and official evidence  | Whether an intentional visible Material contract matches the current canonical source                                                                                          |

## Lane boundaries

### Unit and pure behavior

Use unit tests for deterministic behavior that does not require browser rendering. Prefer direct inputs and outputs over broad mocks. Extract pure decisions from large UI components only when the extracted logic has a real owner and decreases total complexity.

Do not create unit tests that reconstruct a page, feature flow, browser lifecycle, or service boundary through extensive component stubs. Such pseudo-integration tests are usually less faithful than focused pure tests plus an app e2e scenario.

### Component contract

Component contract tests may prove:

- canonical defaults and supported public configuration;
- native element and explicit `href`, `type`, `disabled`, `tabindex`, `role`, and `aria-*` ownership;
- props, emits, slots, controlled-state ownership, invalid combinations, and documented normalization;
- simple child or foundation wiring that does not depend on browser rendering.

They must not prove focus-visible, keyboard navigation, pointer or touch behavior, layout, geometry, scrolling, responsive behavior, overlays, browser APIs, ripple, elevation, motion, or computed appearance.

Prefer stable public assertions. Avoid complete rendered-tree snapshots, incidental internal classes, and test ids introduced only for unit tests.

### Storybook browser behavior

Use Storybook browser tests when reusable UI owns browser-dependent behavior and can be exercised in isolation. Drive the component through real public inputs and semantic locators.

Use real focus, keyboard, pointer, touch, drag, scroll, and overlay actions. Wait for observable readiness and outcomes rather than framework callbacks or assumed animation durations.

Storybook browser tests contain no screenshots. Forced transient states may prepare visual evidence but do not prove acquisition, transition, cancellation, or cleanup.

### App e2e

Use app e2e only when the contract crosses product boundaries or the complete user scenario is the value being protected.

Exercise the same public surfaces available to users. Lower-level fixtures may establish valid initial state only outside the behavior under test; they must not directly complete the tested action.

Do not use app e2e to repeat every branch of pure logic or every state of shared UI. Select representative scenarios from the actual blast radius.

### Visual regression

A visual test opens one canonical deterministic story, waits for stable rendering, and captures a bounded surface. It may use a readable state matrix only when multiple distinct component-owned visual routes exist.

Visual tests contain no behavior assertions. They do not prove focus acquisition, actionability, transition, cancellation, cleanup, Material correctness, or product flow. Do not reproduce complete token tables through computed-style assertions or create one snapshot per equivalent state.

An automated baseline detects change; it does not prove that the accepted baseline matches Material. Intentional Material output changes still require operator comparison with named official evidence.

### Mutation testing

Mutation testing is an explicit audit, not a default behavior layer and not a coverage target.

Use it only when all conditions are true:

1. high-risk pure, domain, service, storage, CRDT, validation, migration, filtering, sorting, matching, or transformation logic changed;
2. focused unit or integration tests were added or changed for that behavior;
3. those tests already pass;
4. a narrow source scope can be selected.

Do not run mutation testing for UI component behavior, browser-only flows, refactors, type-only changes, formatting, comments, renames, documentation, or ordinary internal cleanup. Do not change production behavior or add implementation-detail assertions only to kill mutants.

## Required proof by change type

| Change                                                                                                             | Minimum expected proof                                                                |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Pure/domain/service/storage behavior                                                                               | Focused unit tests                                                                    |
| High-risk pure/domain/service/storage behavior with changed tests                                                  | Focused unit tests, then explicit narrow mutation audit                               |
| Public Vue API or semantic wiring                                                                                  | Component contract test                                                               |
| Focus, keyboard, pointer, touch, scroll, layout, overlay, responsive, or browser API behavior owned by reusable UI | Storybook browser behavior test                                                       |
| Complete product scenario or cross-boundary integration                                                            | App e2e                                                                               |
| Intentional visible contract change                                                                                | Bounded visual regression; operator visual review when Material applies               |
| Shared foundation behavior                                                                                         | Foundation-owned tests plus narrow wiring checks in affected consumers                |
| Public import, wrapper, or API migration                                                                           | Contract tests plus representative affected-consumer preservation                     |
| Reproducible bug                                                                                                   | One focused regression test at the owning layer                                       |
| Behavior-preserving refactor                                                                                       | Existing relevant coverage; no mandatory new test                                     |
| Verify, resolver, or test infrastructure change                                                                    | Focused unit tests for resolution logic and verification of each changed command mode |
| Release/bootstrap behavior                                                                                         | Release smoke                                                                         |

A layer may be omitted because the changed owner has no such contract. It must not be omitted merely because the correct test is difficult to write.

## Shared code and consumer preservation

A shared change does not automatically require every product suite.

Determine the real blast radius from public APIs, dependency direction, rendered composition, and changed behavior. Test the shared owner fully, then select representative affected consumers only where integration may differ.

Generic foundation behavior is tested once at the foundation owner. Each component or consumer proves only its own routing, extension, deviation, or product outcome.

## Desktop and mobile projects

Do not duplicate every app e2e scenario across desktop and mobile by default.

Run both when viewport, touch versus pointer input, responsive composition, overlay behavior, browser capability, or mobile lifecycle changes the risk. Keep a small critical smoke set on both platforms. Run platform-independent scenarios on one canonical project unless a known regression justifies broader coverage.

Responsive reusable UI behavior belongs in focused Storybook browser tests with explicit viewports. Add multiple visual baselines only for distinct accepted responsive outputs.

## Verification architecture

### Focused checks during implementation

Use the narrowest verify-managed owner:

```bash
pnpm verify --only unit-tests --files <paths...>
pnpm verify --only storybook-behavior --files <paths...>
pnpm verify --only e2e --files <paths...>
pnpm verify --only visual --files <paths...>
pnpm verify --only mutation --files <paths...>
```

Focused checks provide feedback; they do not replace final verification.

### Final development gate

After code edits, run read-only:

```bash
pnpm verify
```

The final gate checks the repository-selected impact plus formatting, linting, and types. Passing it proves only that the selected automated checks passed. It does not approve architecture, test sufficiency, operator visual acceptance, PR review, or merge readiness.

### Release gate

Use:

```bash
pnpm verify --full
```

for the complete release-owned suite and production artifact checks required by release policy.

### Impact resolvers

Risk and impact resolvers optimize which existing checks run. They are not the source of test ownership and cannot decide whether a task added the correct proof.

Resolver rules:

- map source ownership to focused scenarios where evidence is stable;
- fail closed when registry integrity is broken;
- use a conservative broad fallback only for genuinely unknown impact;
- do not permanently classify a known broad directory as requiring every scenario when a stable mapping can be maintained;
- changing a support helper should select its known consumers when that relation is explicit;
- an empty inferred scope is not evidence that browser, visual, or mutation testing is unnecessary;
- do not add a generic dependency graph, validator, or registry unless repeated real changes demonstrate that it decreases total complexity.

## Test helpers

Helpers may provide deterministic setup, semantic actions, and strict outcome waits. They must preserve action ownership and failure visibility.

Separate strict assertion helpers from optional cleanup helpers. A strict action must fail when its required precondition or outcome is absent; it must not silently return, retry an already-delivered action, or use escape/fallback actions that can hide a product defect.

Create shared fixtures or helpers only after multiple current tests prove the same concrete need and the extraction reduces total complexity.

## Review checklist

Reject or revise coverage when:

1. the test uses a less faithful layer than the behavior requires;
2. the same contract is already fully owned elsewhere;
3. the assertion follows implementation rather than a stable contract;
4. the fixture reconstructs broad product behavior through mocks;
5. browser input is synthetic or instability is hidden by sleeps, force, retries, or recovery loops;
6. a visual test contains behavior or token-table assertions;
7. an e2e scenario repeats pure logic branches or shared component states;
8. mutation scope is broad, automatic, or unrelated to changed high-risk tests;
9. desktop and mobile duplication has no platform-specific risk;
10. a new test framework, DSL, registry, validator, or abstraction has no repeated demonstrated need.

## Existing-suite migration

Adopt this policy incrementally. Do not rewrite the full suite in one PR.

When a touched test violates ownership:

1. identify the contract and correct owner;
2. preserve required regression protection at that owner;
3. remove or reduce duplicate and implementation-detail assertions;
4. update the relevant impact mapping only when the new ownership is stable;
5. keep production behavior unchanged unless the task explicitly changes it.

Track broad existing mismatches as focused follow-up work. Do not expand an ordinary product task into unrelated suite cleanup.
