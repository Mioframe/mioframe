# Testing architecture

This document is the canonical project-wide testing policy for Mioframe.

Its purpose is to keep two decisions reliable and separate:

1. coding work chooses proof that matches the changed contract and risk;
2. `verify` resolves workspace changes to the smallest confirmed set of checks, with safe full-lane fallback for unknown relevant impact.

`verify` executes workspace-backed facts. It never parses or depends on agent prose.

`docs/testing/storybook.md` defines Storybook ownership, authoring, and file-placement rules. `docs/testing/migration-plan.md` records which target mechanisms are currently executable.

## Goal

Use the smallest reliable set of tests and measurements that completely protects changed observable contracts without duplicating framework, browser, foundation, component, or product behavior.

Automatic selection must be deterministic, inspectable, and fail closed. An empty or skipped lane is never evidence that a proof type is unnecessary.

## Responsibilities

### Coding work: proof design

Before non-trivial implementation, identify:

- changed observable contracts and scenarios;
- applicable risks;
- the lowest faithful proof type;
- existing proof that already owns the contract;
- proof that must be added or changed;
- durable workspace impact facts that must be maintained;
- task-specific measurements that cannot be automated yet.

Implementation preflight records this as `TEST IMPACT`. It is a reviewable decision record, not input to `verify`.

### Workspace: durable facts

The workspace may encode:

- static import relations used by supported unit-test resolution;
- deterministic snapshot-to-test ownership conventions;
- deterministic owner-local Playwright relations where a lane supports them;
- explicit source-to-spec mappings for non-local, family/module, cross-cutting, or product-scenario relations;
- lane relevance and full-lane fallback paths;
- justified infrastructure/standalone specs;
- release-sensitive source-to-check mappings;
- persistent project applicability metadata when introduced;
- persistent mutation targets;
- persistent performance checks for durable budgets.

Do not create metadata when the repository structure already expresses the relation mechanically.

### Verify: planning and execution

`verify`:

- obtains changed path identities and statuses from workspace planning;
- validates durable impact facts;
- resolves execution lanes independently;
- prints why each lane is skipped, focused, full, or invalid;
- executes the resulting plan;
- never infers test sufficiency from a skipped lane or a focused command with no matching tests.

## Core rules

### Test contracts, not implementation

Every test protects observable behavior, a public contract, persisted state, data safety, accessibility, accepted visible output, release behavior, or an explicit non-functional requirement.

Do not test private methods, incidental classes, render counts, framework lifecycle, internal branches, or third-party behavior unless Mioframe owns the adaptation or observable outcome.

### One contract has one primary proof owner

Each observable contract has one primary proof type. Other proof types may verify a narrow integration seam or complete user outcome, but must not repeat the complete contract.

One production file may affect several contracts and therefore require several proof types.

### Use the lowest faithful proof type

Choose the cheapest environment that reproduces the real semantics. A cheaper environment is invalid when it cannot model the behavior.

`happy-dom` does not prove real focus, keyboard behavior, pointer/touch, layout, geometry, scrolling, overlays, responsive behavior, browser APIs, or browser lifecycle.

### Proof is proportional to changed risk

Add or change proof when observable behavior, a public contract, persistence, migration, transformation, accessibility, performance, release behavior, or a reproducible defect changes.

Do not add a test merely because a production file changed. A behavior-preserving refactor may rely on existing relevant proof when the accepted contract is already protected.

### Duplication is not additional assurance

Do not repeat the same algorithm matrix, browser behavior, foundation behavior, visual contract, product flow, or performance assertion across several proof types.

### Failures remain visible

Do not hide defects with arbitrary sleeps, `force`, broad retries, repeated action delivery, silent recovery, or helpers that accept missing required state.

## Proof types

| Proof type                | Owns                                                                                                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deterministic behavior    | Pure helpers, schemas, domain decisions, service/storage/CRDT boundaries, migrations, transformations, cancellation, conflicts, typed errors, deterministic multi-module outcomes |
| Component contract        | Public Vue props, emits, slots, native owner, explicit attributes, ARIA ownership, controlled semantic state, invalid combinations, non-browser wiring                            |
| Reusable browser behavior | Isolated reusable UI focus, keyboard, pointer/touch, drag, geometry, scrolling, overlays, responsive rendering, motion lifecycle, browser APIs                                    |
| Product scenario          | Complete user scenarios crossing page, feature, widget, service, worker, persistence, navigation, permission, provider, reload, import/export, or repository boundaries           |
| Visual regression         | Bounded deterministic appearance of canonical Storybook stories                                                                                                                   |
| Release behavior          | Production artifact bootstrap, routing, service-worker/channel isolation, installation, and release-sensitive invariants                                                          |

Supplemental evidence:

- mutation audit tests high-risk deterministic proof quality;
- performance evidence protects explicit claims or durable budgets;
- automated accessibility scans are supplemental to semantic and interaction proof;
- Material visual/motion inspection is an external defect-reporting channel, not automated conformance proof.

## Execution lanes

| Verify label/process         | Executes                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| static verification          | format, lint, type-check, instruction compatibility, deterministic workspace checks |
| `unit-tests`                 | deterministic behavior and component contracts through Vitest                       |
| `storybook-behavior`         | reusable browser behavior through Playwright against isolated Storybook             |
| `e2e`                        | complete product scenarios through application Playwright tests                     |
| `visual`                     | screenshot regression against canonical Storybook stories                           |
| release verification         | release behavior against the built production artifact                              |
| `mutation`                   | registered narrow mutation targets                                                  |
| persistent performance check | repository-owned benchmark/budget selected by impact facts                          |
| task-specific measurement    | reproducible one-off measurement named in preflight                                 |

## Proof boundaries

### Deterministic behavior

Use direct inputs, outputs, transitions, persisted effects, protocol messages, and typed failures. Mock only real external or nondeterministic boundaries.

A deterministic multi-module test remains in `unit-tests` when it proves a boundary result without browser rendering or complete application orchestration.

### Component contract

Use Vue Test Utils for stable public API, native semantics, explicit attributes, ARIA ownership, controlled state, invalid combinations, and narrow child/foundation wiring.

Do not prove real focus, keyboard operation, pointer/touch, layout, geometry, scrolling, overlays, responsive rendering, browser APIs, ripple, motion, elevation, or computed appearance here.

### Reusable browser behavior

Use isolated deterministic Storybook state and real public browser input. Behavior specs contain no screenshots.

Storybook ownership and physical placement follow `docs/testing/storybook.md`. During migration, conceptual ownership may be colocated while executable specs remain in the current central Playwright location until the lane supports colocated discovery.

### Product scenario

Use application E2E when the complete user outcome or cross-boundary integration is the contract. Lower-level setup may establish valid initial state but must not perform the action under test.

### Visual regression

A visual spec opens a canonical deterministic story, waits for stable rendering, and captures a bounded surface. It contains no behavioral success criteria and does not reproduce token tables through computed-style matrices.

A baseline detects change; it does not prove Material correctness, accessibility, or interaction.

### Accessibility

- native semantics, accessible name, explicit ARIA ownership, disabled/readonly semantics: component contract;
- focus order, keyboard operation, focus restoration, actionability, overlay containment: browser behavior or product scenario;
- automated scans: supplemental only;
- screenshot appearance alone does not prove accessibility.

## Automatic verification contract

### Changed paths

Automatic planning preserves:

- added paths;
- modified paths;
- removed paths;
- moved paths with previous and current identities.

Removal and movement are first-class risks because imports, mappings, snapshots, helpers, and specs may disappear.

`--files` is an explicit focused target override for readable existing paths. It is not a substitute for status-aware automatic planning of removals or moves.

### Lane plan

Every migrated automatic resolver uses:

- `skip`: no workspace-backed impact for the lane;
- `focused`: a non-empty sorted set of lane-defined execution inputs;
- `full`: the complete owning lane is required;
- `invalid`: impact metadata is inconsistent and verification must fail before test execution.

Rules:

- `invalid` blocks execution;
- `full` overrides focused inputs;
- overlapping relations union and deduplicate;
- every decision has inspectable reasons;
- unknown relevant impact uses `full`, never `skip`;
- paths outside a lane's declared relevance do not select that lane.

Do not describe a migration target as already implemented; current behavior is recorded in `docs/testing/migration-plan.md` and observable verifier output.

## Static verification impact

Static checks use direct file capability rather than semantic test ownership:

- format/lint run for added or modified readable supported files;
- removed files are never passed as formatter/linter targets;
- typed graph changes select type-check according to current planner policy;
- `AGENTS.md`, skills, or generator changes select instruction compatibility validation;
- shared static configuration changes run the complete owning static check.

Static checks do not replace behavioral, browser, visual, release, mutation, or performance proof.

## Unit-test impact

The durable target uses:

1. directly changed tests;
2. deterministic snapshot ownership;
3. changed source/test-support paths passed to supported Vitest related resolution;
4. full-unit fallback for relations that cannot be represented safely.

Do not build a second persistent dependency graph merely to enumerate unit tests.

A focused related run with no matching tests must be reported explicitly; it is not evidence that no unit proof is needed.

## Playwright impact model

`storybook-behavior`, `e2e`, and `visual` remain independent. They may share only mechanical plan/validation helpers.

Each lane declares only what it needs from:

- discovered spec patterns;
- broad relevant source domains;
- full-lane files/prefixes;
- deterministic owner-local relations where supported;
- explicit non-local source-to-spec mappings;
- justified infrastructure/standalone specs;
- snapshot ownership convention where applicable.

There are three valid relation forms:

1. **owner-local convention** — repository naming/placement deterministically identifies a UI-owned Storybook behavior or visual spec;
2. **explicit mapping** — required when family/module/cross-file/cross-cutting ownership cannot be expressed by one local convention, and for product E2E scenario impact;
3. **standalone/infrastructure ownership** — only when no truthful stable production/source relation exists.

Do not create an explicit mapping for a relation that the local owner convention already expresses.

A source mapping contains production, story, fixture, or owned support sources only. Spec paths are never source prefixes used to group tests.

### Resolution order

For a migrated Playwright lane:

1. full-lane file/prefix → full lane;
2. added/modified spec → that spec;
3. removed/moved spec → validate ownership and use full lane unless the previous relation is preserved deterministically;
4. visual snapshot → owning visual spec, or full visual lane when unresolved;
5. deterministic owner-local source relation → matching owner specs;
6. explicit source mapping → union of matching specs;
7. unmapped relevant source → full lane;
8. path outside lane domains → no selection.

Shared config, setup, global fixtures, and common helpers select the full owning lane unless the complete consumer set is explicit, small, stable, and validated.

### Validation

Validation rejects applicable:

- referenced missing specs;
- discovered specs with no deterministic local owner, explicit mapping, or justified infrastructure ownership;
- duplicate/empty explicit mapping entries;
- invalid paths outside the owning lane;
- stale ownership facts after movement/removal;
- snapshot ownership that cannot be resolved without the documented full fallback.

No cross-lane registry, production test annotations, or generic test DSL is allowed.

### Storybook behavior

The durable target uses owner-local colocated `*.browser.spec.ts` for ordinary component/family/module ownership, with explicit mappings only for truthful non-local or cross-cutting relations.

Changing a story may independently affect Storybook behavior and visual lanes. One lane must not infer the other.

Until colocated browser discovery is implemented, preserve the current executable Storybook behavior spec location and current resolver metadata as required by `docs/testing/migration-plan.md`.

### Application E2E

Application E2E remains centralized because product scenarios cross owners. Stable source-to-product-scenario impact is explicit rather than inferred from colocation.

Broad application bootstrap, worker/service protocol, E2E infrastructure, and unknown relevant product source use full application E2E fallback.

### Visual

The durable target uses owner-local colocated `*.visual.spec.ts` and deterministic colocated baseline ownership for ordinary UI owners, with explicit mappings only for non-local and cross-cutting visible impact.

Theme, fonts, icons, Storybook renderer/configuration, and other broad rendering infrastructure normally select full visual unless a complete stable consumer set is explicit.

Unresolved added, modified, removed, or moved baseline ownership selects the full visual lane.

Until colocated visual discovery is implemented, preserve the current executable visual spec/baseline location and current resolver behavior.

## Release verification

Focused development verification must select release checks when a changed contract can only be proved against the built artifact.

Release impact covers build/release configuration, routing/base paths, manifest/PWA/service worker/channel isolation, release scripts/artifact assembly, and runtime dependency changes affecting production output.

Known local impact may select exact checks. Shared release infrastructure or unknown relevant release impact selects the full release lane.

`pnpm verify:release` remains the unconditional release-sensitive final gate when the verification skill requires it.

## Browser project applicability

Source impact chooses specs. Project applicability belongs to persistent test metadata, not changed-file paths or agent prose.

Do not narrow the current application E2E desktop/mobile matrix until a separate audited migration classifies every scenario, preserves mobile-risk coverage, and measures the benefit.

## Mutation impact

Persistent mutation selection, when implemented, owns unique high-risk targets with exact source files, exact focused tests, and a concrete risk reason.

Do not infer mutation applicability from neighboring files or transient agent prose. Until the target registry is implemented, preserve current legacy behavior recorded in the migration plan.

## Performance impact

Distinguish:

- a one-off task claim, requiring reproducible before/after measurement in preflight;
- a durable product budget, requiring a workspace-owned automated check and impact relation.

Do not create permanent benchmark infrastructure for one task.

## TEST IMPACT

Implementation preflight records task-specific design:

```text
TEST IMPACT
Changed contracts:
Risks:
Proof owners:
Existing proof:
New or changed tests:
Workspace impact metadata updates:
Task-specific measurements:
```

Rules:

- include only applicable proof;
- name exact existing/planned tests where known;
- maintain durable ownership/mapping/snapshot/release/mutation/performance facts when their relation changes;
- update preflight when implementation changes planned contracts or proof;
- `verify` never consumes this artifact.

## Shared code and consumer preservation

A shared change does not automatically require every product suite. Test the shared owner fully, then select representative consumers only where public APIs, composition, platform behavior, or integration paths differ materially.

Generic foundation behavior is proved once at the foundation owner. Consumers prove only routing, extension, deviation, or complete product outcome.

## Test helpers

Helpers may provide deterministic setup, semantic actions, and strict outcome waits. Required actions fail when preconditions or outcomes are absent. Optional cleanup is separate and never behavior evidence.

Create shared helpers only after multiple current tests prove the same concrete need and extraction reduces total complexity.

## Review rejection criteria

Reject or revise proof when:

1. it uses a less faithful proof type than required;
2. the same contract is already fully owned elsewhere;
3. assertions follow implementation instead of accepted contracts;
4. fixtures reconstruct broad product behavior through mocks;
5. browser instability is hidden by sleeps, force, retries, or recovery loops;
6. visual tests contain behavior/token-table assertions;
7. product E2E repeats deterministic logic branches or shared component states;
8. ownership/impact facts are missing, stale, duplicated, or overloaded;
9. a local relation is replaced by unnecessary registry infrastructure;
10. a spec path is used as a source-mapping prefix to group tests;
11. current migration state is ignored and tests are placed where the runner cannot discover them;
12. proof depends on private third-party implementation that Mioframe does not own.
