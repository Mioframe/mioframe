# Testing architecture

This document is the canonical project-wide testing policy for Mioframe.

Its purpose is to keep four decisions reliable and separate:

1. accepted product/architecture contracts decide what must be proved;
2. dedicated test-author work turns that contract into the minimum faithful proof independently from production implementation;
3. `verify` resolves workspace changes to the smallest confirmed set of checks, with safe full-lane fallback for unknown relevant impact;
4. GitHub CI verifies the exact pull-request head before merge.

`verify` executes workspace-backed facts. It never parses or depends on agent prose.

`docs/testing/storybook.md` defines Storybook ownership, authoring, and file-placement rules. `docs/testing/migration-plan.md` records which target mechanisms are currently executable.

## Goal

Use the smallest reliable set of tests and measurements that completely protects changed observable contracts without duplicating framework, browser, foundation, component, or product behavior.

The goal is not test count, coverage percentage, snapshot count, mutation score, or a fixed unit/integration/E2E ratio. A test exists only when it protects a current contract or risk at the lowest faithful proof boundary.

Automatic selection must be deterministic, inspectable, and fail closed. An empty or skipped lane is never evidence that a proof type is unnecessary.

Local verification exists for implementation feedback and contract proof. For pull requests, required GitHub CI on the exact PR head is the authoritative repository gate; coding agents do not need to duplicate that broad gate locally merely to report implementation completion.

## Responsibilities

### Architecture and preflight: proof design

Before non-trivial implementation, identify:

- changed observable contracts and scenarios;
- applicable risks;
- the lowest faithful proof type;
- the independent oracle for the expected result;
- at least one plausible incorrect observable result the proof must reject;
- existing proof that already owns the contract;
- proof that must be added or changed;
- whether a dedicated test-author pass is required or existing proof remains sufficient and unchanged;
- whether a meaningful pre-change red check should exist;
- durable workspace impact facts that must be maintained;
- task-specific measurements that cannot be automated yet.

Implementation preflight records this as `TEST IMPACT`. It is a reviewable decision record, not input to `verify`.

### Test author: independent proof

When automated behavioral proof is added or materially changed, author it in a fresh test-agent/session separate from the production implementation context. Follow `test-first`, `test-authoring`, and the selected proof-type skill.

The test author receives the accepted contract and `TEST IMPACT`, not a proposed implementation as the source of expected behavior. Current production code may be inspected to understand existing behavior, but it is not an oracle by itself.

The test author owns only the proof surface required by the accepted contract: tests/specs, truthful proof-only fixtures/stories, independently accepted visual baselines, and required durable ownership/impact metadata. The test author must not implement production behavior merely to make proof pass.

A meaningful red phase is required when the pre-change implementation can faithfully demonstrate the accepted contract gap. Red is valid only when it fails for that contract gap, not because of unrelated setup, fixture, type, environment, timeout, or infrastructure failure.

### Implementer: satisfy accepted proof

After independent proof is accepted, production implementation runs in a different agent/session. Accepted test expectations and assertions are implementation constraints.

The implementer may inspect and run accepted proof but must not weaken, delete, regenerate, bypass, or opportunistically rewrite it to make production code pass. If proof conflicts with the accepted contract or architecture, return the conflict to the test owner/architect and correct the proof in a fresh test-author pass before continuing.

A behavior-preserving refactor with sufficient unchanged proof does not require a ceremonial test-author pass or red phase.

### Workspace: durable facts

The workspace may encode:

- static import relations used by supported unit-test resolution;
- deterministic snapshot-to-test ownership conventions;
- deterministic owner-local Playwright relations where a lane supports them;
- explicit source-to-spec mappings for non-local, family/module, cross-cutting, or product-scenario relations;
- lane relevance and full-lane fallback paths;
- justified infrastructure/standalone specs;
- release-sensitive source-to-check mappings;
- persistent project applicability metadata;
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

`verify` proves that selected checks executed according to repository rules. It does not prove that an assertion has an independent oracle or that a test was written at the right semantic boundary; test-authoring and semantic review own those decisions.

### Architect and PR CI

The architect owns PR creation, exact-head CI review, full resulting-PR review, proof-quality review, and merge readiness.

Required GitHub CI must run against the exact published PR head. A green CI run proves only that the executed checks passed. It does not replace architecture review, correct ownership, independent oracle review, faithful proof, or required scenario coverage.

If CI fails, route the exact failed contract to the correct owner, run the smallest useful local verifier-managed proof while correcting it, publish the correction, and let CI rerun on the new exact head.

## Core rules

### Test contracts, not implementation

Every test protects observable behavior, a public contract, persisted state, data safety, accessibility, accepted visible output, release behavior, or an explicit non-functional requirement.

Do not test private methods, incidental classes, render counts, framework lifecycle, internal branches, or third-party behavior unless Mioframe owns the adaptation or observable outcome.

A behavior-preserving implementation rewrite should normally leave its contract tests unchanged and green.

### Independent oracle and failure sensitivity

Expected results must come from an accepted architecture/product/public contract, explicit scenario or acceptance criterion, reproducible defect and corrected outcome, persistence/protocol/migration contract, authoritative platform/dependency contract that Mioframe adapts, or another independently accepted behavior source.

Do not derive expected values from:

- the same production helper/algorithm under test;
- a copied or lightly rewritten implementation algorithm;
- newly observed production output without independent acceptance;
- mocks or fixtures programmed so the assertion only confirms what the test injected, unless that is the real boundary contract.

Every new or materially changed behavioral proof must be able to name at least one plausible incorrect observable result that its assertions reject. This is a sensitivity check, not a request for exhaustive negative tests.

### One contract has one primary proof owner

Each observable contract has one primary proof type. Other proof types may verify a narrow integration seam or complete user outcome, but must not repeat the complete contract.

One production file may affect several contracts and therefore require several proof types.

### Use the lowest faithful proof type

Choose the cheapest environment that reproduces the real semantics. A cheaper environment is invalid when it cannot model the behavior.

`happy-dom` does not prove real focus, keyboard behavior, pointer/touch, layout, geometry, scrolling, overlays, responsive behavior, browser APIs, or browser lifecycle.

Do not promote deterministic logic into browser/E2E merely to make a test feel more realistic, and do not demote browser-owned behavior into mocks merely to make it cheaper.

### Proof is proportional to changed risk

Add or change proof when observable behavior, a public contract, persistence, migration, transformation, accessibility, performance, release behavior, or a reproducible defect changes.

Do not add a test merely because a production file changed or a coverage number is low. A behavior-preserving refactor may rely on existing relevant proof when the accepted contract is already protected.

Cover materially distinct current happy, boundary, invalid, failure, cancellation, compatibility, platform, or state paths required by risk. Do not build theoretical Cartesian matrices without distinct contract value.

### Isolation and determinism

Every automated test must be independently runnable. It must not require another test to run first or leave mutable state that changes another test's result.

Own test data and nondeterminism. Control time, randomness, third-party/network/provider behavior, and mutable persistence only where they are real dependencies of the contract. Restore fake time, mocks, globals, and mutable test state after the owning test where applicable.

Do not hide instability with arbitrary sleeps, `force`, broad retries, repeated action delivery, silent recovery, or helpers that accept missing required state.

A known intermittent failure is a defect and blocks acceptance until its cause is corrected and the required stability proof passes. Retries may collect diagnostics only when a retry-pass/flaky classification still fails the owning gate; a retry-pass is never accepted as green proof.

### Prefer public and user-facing observation

At UI/browser boundaries, prefer public semantics and user-observable behavior over implementation structure.

For rendered/UI selection, prefer role and accessible name, label, visible text, or another stable public semantic locator. Use test IDs only when no stable public semantic locator exists and the ID represents an intentional testing seam rather than private structure.

For browser-owned asynchronous outcomes, use Playwright actionability and web-first assertions instead of manual polling or arbitrary timing assumptions.

### Duplication is not additional assurance

Do not repeat the same algorithm matrix, browser behavior, foundation behavior, visual contract, product flow, or performance assertion across several proof types.

Coverage percentage, assertion count, snapshot count, mutation score, and number of E2E scenarios are diagnostic metrics, not acceptance objectives by themselves.

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

Use direct inputs, outputs, transitions, persisted effects, protocol messages, and typed failures. Prefer real fast/reliable owned modules. Mock only genuine external or nondeterministic boundaries.

A deterministic multi-module test remains in `unit-tests` when it proves a boundary result without browser rendering or complete application orchestration.

Do not mock every internal dependency and then assert call choreography. Do not copy the production algorithm into the expected-value calculation. A useful deterministic test should survive a behavior-preserving rewrite.

### Component contract

Use Vue Test Utils for stable public API, native semantics, explicit attributes, ARIA ownership, controlled state, invalid combinations, and narrow child/foundation wiring.

Assert public output or an explicit Vue/adapter seam. Prefer semantic DOM locators where the assertion is rendered/public semantics. Avoid incidental CSS classes, private child state, broad rendered-tree snapshots, and component lifecycle details.

Do not prove real focus, keyboard operation, pointer/touch, layout, geometry, scrolling, overlays, responsive rendering, browser APIs, ripple, motion, elevation, or computed appearance here.

### Reusable browser behavior

Use isolated deterministic Storybook state and real public browser input. Behavior specs contain no screenshots.

The story establishes deterministic preconditions only; the spec performs the behavior under test. Drive keyboard, pointer/touch, focus, scrolling, viewport, or browser capability through public browser surfaces, locate through user-facing semantics, and assert the exact observable result with web-first assertions.

Do not invoke private component/renderer APIs, use arbitrary sleeps/forced actions to bypass actionability, or assert an internal proxy that can remain correct while the public result is wrong.

Storybook ownership and physical placement follow `docs/testing/storybook.md`. The behavior lane supports mixed discovery: migrated owners use colocated `src/**/*.browser.spec.ts`, and unmigrated owners remain in the current central Playwright location. `docs/testing/migration-plan.md` controls which owners are currently authorized to migrate.

### Product scenario

Use application E2E when the complete user outcome or cross-boundary integration is the contract.

An E2E spec represents a coherent user goal:

```text
owned valid starting state
→ public/user-observable action(s)
→ user-visible or durable product outcome
```

Perform the action under test through the same public UI/browser surface available to the user whenever that action is part of the scenario. Lower-level setup APIs may create valid preconditions but must not perform, short-circuit, or directly mutate the product action/outcome under test.

Prefer role/name/label/user-facing locators and Playwright web-first assertions. Isolate browser/persistence/test data so execution order does not matter. Control third-party/network/provider responses when Mioframe does not own them; test Mioframe's handling of that boundary, not the third party itself.

Assert the final user-visible or durable product result, including reload/persistence behavior when it belongs to the scenario. Do not use E2E to repeat lower-level algorithm/state matrices already faithfully owned elsewhere.

### Visual regression

A visual spec opens a canonical deterministic story, waits for stable rendering, and captures the smallest readable surface that owns the accepted appearance. It contains no behavioral success criteria and does not reproduce token tables through computed-style matrices.

Baseline generation and comparison must use equivalent browser/runtime/OS/font conditions. Stabilize fonts, icons, assets, async fixtures, and genuinely nondeterministic content before capture. Animation may be settled only to reach the accepted stable state; screenshots do not prove motion lifecycle.

A baseline detects change; it does not approve the new result. Every intentional baseline change must be independently reviewed against the accepted visual contract before acceptance. Never update a baseline merely because the implementation produced different pixels.

A visual baseline does not prove Material correctness, accessibility, interaction, or numeric geometry that belongs to a more faithful proof.

### Release behavior

Release proof exists only for behavior that can differ in the built/deployable artifact from source/dev-runtime proof.

Build through the repository-owned production/release path and test the artifact that would be served or deployed. Do not use the Vite dev server or source modules as a proxy for production-artifact behavior.

Assert externally observable release contracts such as bootstrap, base/routing, manifest/PWA assets, service-worker/channel isolation, update lifecycle, persisted compatibility, first/returning-user behavior, publication/import seams, or another accepted release invariant.

Preserve real browser/lifecycle boundaries when the defect can only exist there. A source import test may own a specific Node/module compatibility seam but cannot replace browser/artifact proof. Do not duplicate ordinary product E2E in release proof unless the production artifact boundary materially changes the risk.

### Accessibility

Accessibility is distributed across faithful owners rather than treated as one substitute test category:

- native semantics, accessible name, explicit ARIA ownership, disabled/readonly semantics: component contract;
- focus order, keyboard operation, focus restoration, actionability, overlay containment: browser behavior or product scenario;
- automated scans: supplemental detection of automatable issues only;
- screenshot appearance alone does not prove accessibility.

A green automated accessibility scan never establishes overall accessibility by itself.

### Mutation testing

Mutation is supplemental test-sensitivity evidence for explicitly registered/audited high-risk deterministic logic after the primary proof is green.

A meaningful survived/no-coverage mutant is a reason to inspect whether an accepted observable outcome is missing from proof. Strengthen tests only when the mutant represents a real wrong result that should have been rejected.

Do not add implementation-detail assertions, change production behavior, or create broad mutation scope merely to improve mutation score. Equivalent or irrelevant mutants do not create product requirements.

### Performance evidence

Add performance proof only for an accepted performance claim or durable budget.

Define before measurement:

- the user-relevant metric;
- scenario and representative data size;
- device/browser/runtime conditions;
- baseline or numeric budget;
- acceptable variance/comparison method when measurement is noisy.

Prefer reproducible budgets/thresholds over brittle exact timings. Do not claim an optimization from one uncontrolled run, a different environment, or an unrelated proxy metric. Performance evidence never replaces correctness proof.

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

`storybook-behavior`, `e2e`, and `visual` remain independent proof and impact lanes. They may share mechanical plan/validation helpers and deterministic build prerequisites/artifacts when reuse preserves each lane's selection, failure visibility, and proof ownership; a shared prerequisite must not become cross-lane impact inference.

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

When Storybook behavior and visual proof both consume an equivalent deterministic static Storybook build, verification may build that artifact once and reuse it across those consumers. The `storybook-build` check remains an independent verifier-owned build contract when its own impact plan selects it; reuse only removes duplicate compilation. An explicit prebuilt-artifact mode must fail closed when required output is missing, while standalone focused browser/visual commands remain self-contained when no prebuilt contract is supplied.

Colocated browser discovery is implemented: one Storybook behavior Playwright configuration discovers both legacy central specs and owner-local `src/**/*.browser.spec.ts`, with filesystem-derived ownership that selects every applicable colocated spec for an owner path and fails closed to the full lane for unresolved add/remove/rename. `docs/testing/migration-plan.md` controls which owners are currently authorized to migrate; unmigrated owners remain in the current central location.

### Application E2E

Application E2E remains centralized because product scenarios cross owners. Stable source-to-product-scenario impact is explicit rather than inferred from colocation.

Broad application bootstrap, worker/service protocol, E2E infrastructure, and unknown relevant product source use full application E2E fallback.

Project applicability is a separate persistent spec-level contract. Every root `tests/e2e/*.spec.ts` application spec is explicitly classified as `desktop`, `mobile`, or `both`; verifier validation fails closed when the inventory and applicability metadata diverge. Source impact still chooses specs, while Playwright project filtering applies only after that selection. An unclassified spec must not be silently omitted by direct Playwright collection; fail-safe behavior is to run it in both projects until verifier validation is corrected.

### Visual

The durable target uses owner-local colocated `*.visual.spec.ts` and deterministic colocated baseline ownership for ordinary UI owners, with explicit mappings only for non-local and cross-cutting visible impact.

Theme, fonts, icons, Storybook renderer/configuration, and other broad rendering infrastructure normally select full visual unless a complete stable consumer set is explicit.

Unresolved added, modified, removed, or moved baseline ownership selects the full visual lane.

Until colocated visual discovery is implemented, preserve the current executable visual spec/baseline location and current resolver behavior.

## Release verification impact

Focused development verification must select release checks when a changed contract can only be proved against the built artifact.

Release impact covers build/release configuration, routing/base paths, manifest/PWA/service worker/channel isolation, release scripts/artifact assembly, and runtime dependency changes affecting production output.

Known local impact may select exact checks. Shared release infrastructure or unknown relevant release impact selects the full release lane when a broad local diagnostic run is materially useful.

`pnpm verify:release` remains the repository's full release-verification command and may be used locally for diagnosis or deliberate pre-PR confidence. It is not an unconditional coding-agent completion gate. For pull-request work, the required exact-head GitHub release/merge checks are authoritative before merge.

## Browser project applicability

Source impact chooses specs. Project applicability belongs to persistent test metadata, not changed-file paths or agent prose.

Application E2E project applicability is implemented as explicit spec-level `desktop | mobile | both` metadata. Narrowing is allowed only when the scenario's required platform semantics are audited; mobile-risk coverage must remain explicit rather than inferred from viewport coincidence. Applicability metadata is fail-closed under `verify`, while unknown specs remain fail-safe to both projects under direct Playwright collection.

Optimize the remaining required matrix for both wall-clock time and aggregate executions/resources. Prefer eliminating inapplicable duplicate project runs before adding jobs, workers, build duplication, artifact plumbing, or parallelism. Parallel execution is justified only for irreducible remaining work when its resource overhead is measured and worthwhile.

## Mutation impact

Persistent mutation selection, when implemented, owns unique high-risk targets with exact source files, exact focused tests, and a concrete risk reason.

Do not infer mutation applicability from neighboring files or transient agent prose. Until the target registry is implemented, preserve current legacy behavior recorded in the migration plan.

## Performance impact

Distinguish:

- a one-off task claim, requiring reproducible before/after measurement in preflight;
- a durable product budget, requiring a workspace-owned automated check and impact relation.

Do not create permanent benchmark infrastructure for one task.

## TEST IMPACT

Implementation preflight records task-specific proof design:

```text
TEST IMPACT
- Contract/scenario:
  - Primary proof owner:
  - Oracle source:
  - Must reject:
  - Test author: dedicated test agent/session | existing proof only
  - Red phase: required | not applicable — <reason>
  - Additional proof:
  - Existing proof:
  - New/updated proof:
  - Risk or platform matrix:
  - Durable ownership/impact updates:
  - Task-specific measurements:
```

Rules:

- include only applicable proof;
- derive expectations from independent accepted contract/evidence, not proposed implementation output;
- require a dedicated fresh test-author pass for new or materially changed behavioral proof;
- do not require a test-author pass when existing proof remains faithful and unchanged;
- name one plausible wrong observable result that the proof must reject;
- require a meaningful red phase only when the pre-change implementation can faithfully demonstrate the contract gap;
- name exact existing/planned tests where known;
- maintain durable ownership/mapping/snapshot/release/mutation/performance facts when their relation changes;
- update preflight when implementation changes planned contracts or proof;
- `verify` never consumes this artifact.

## Shared code and consumer preservation

A shared change does not automatically require every product suite. Test the shared owner fully, then select representative consumers only where public APIs, composition, platform behavior, or integration paths differ materially.

Generic foundation behavior is proved once at the foundation owner. Consumers prove only routing, extension, deviation, or complete product outcome.

## Test helpers

Helpers may provide deterministic setup, semantic public actions, and strict outcome waits. Required actions fail when preconditions or outcomes are absent. Optional cleanup is separate and never behavior evidence.

Browser helpers must not hide private actions, actionability failures, arbitrary timing, recovery loops, or repeated user-action delivery behind convenient APIs.

Create shared helpers only after multiple current tests prove the same concrete need and extraction reduces total complexity.

## Review rejection criteria

Reject or revise proof when:

1. it uses a less faithful proof type than required;
2. the same contract is already fully owned elsewhere;
3. assertions follow implementation instead of an independent accepted oracle;
4. the proof cannot identify a plausible contract-relevant wrong result it would reject;
5. fixtures/mocks reconstruct broad product behavior or make assertions tautological;
6. tests depend on execution order or leaked mutable state;
7. browser/E2E behavior is driven through private/internal APIs when the tested action is user-facing;
8. browser instability is hidden by sleeps, `force`, retries, recovery loops, or manual timing instead of observable readiness;
9. E2E asserts internal implementation state rather than a user-visible or durable product outcome;
10. visual baselines are blindly regenerated or captured from nondeterministic/uncontrolled rendering;
11. visual tests contain behavior/token-table assertions;
12. product E2E repeats deterministic logic branches or shared component-state matrices;
13. mutation/coverage/snapshot/test-count metrics are treated as product acceptance goals;
14. an accessibility scan is presented as complete accessibility proof;
15. performance claims use undefined metrics, unrepresentative data, uncontrolled environments, or brittle exact timings without an accepted budget;
16. release proof uses dev/source behavior as a substitute for a contract that exists only in the built artifact;
17. ownership/impact facts are missing, stale, duplicated, or overloaded;
18. a local relation is replaced by unnecessary registry infrastructure;
19. a spec path is used as a source-mapping prefix to group tests;
20. current migration state is ignored and tests are placed where the runner cannot discover them;
21. proof depends on private third-party implementation that Mioframe does not own;
22. production and materially changed proof were authored in one implementation context despite the required independent test-author workflow.
