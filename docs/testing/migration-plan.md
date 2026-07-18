# Testing architecture migration plan

`docs/testing/architecture.md` defines the durable target. This plan applies it to the current repository without reducing existing protection before replacement mechanisms are implemented and verified.

## Migration constraints

- Use focused PRs with one resolver or ownership problem per PR.
- Preserve current production behavior.
- Preserve or strengthen current test coverage before narrowing execution.
- Keep safe broad fallback until a deterministic replacement is implemented and tested.
- Do not make `verify` depend on `TEST IMPACT` or any uncommitted agent report.
- Do not redesign proof ownership inside resolver implementation.
- Remove this document after all completion criteria are satisfied.

## Current mismatches

### Diff planning

- Git changed-file detection excludes deleted paths.
- Resolvers receive filenames rather than status-aware added/modified/deleted/renamed records.
- `--files` cannot represent deletion or both sides of rename.

### Unit selection

- focused unit selection is mainly changed tests plus colocated siblings;
- imported non-sibling tests may be missed;
- snapshot ownership is not resolved explicitly;
- deletion, rename, dynamic imports, global setup, and unknown relations lack one explicit full-unit policy.

### Playwright selection

- app E2E and Storybook behavior already use separate scenario mappings, but their semantics differ;
- Storybook mappings currently use spec paths inside `sourcePrefixes` to group tests;
- visual selection is broad and has no explicit baseline-owner resolver;
- lane relevance, full-lane paths, mappings, and standalone rules are not represented consistently;
- common helper consumer ownership is not uniformly validated.

### Project execution

- every selected app E2E scenario currently runs on desktop and mobile;
- no complete audit exists for safe proportional project selection;
- changing this matrix now would reduce coverage without evidence.

### Mutation and performance

- mutation scope is inferred from source location and sibling tests rather than explicit high-risk targets;
- no persistent performance-impact mechanism exists because no repeated durable need has yet been established.

### Proof ownership

- some visual specs contain browser-behavior or computed token/geometry assertions;
- generic Material foundation behavior is repeated across component families;
- some broad component tests reconstruct product behavior through global stubs;
- some helpers silently recover from missing expected state.

## Phase 1: status-aware planning foundation

### 1. Changed-path model

Introduce a repository-owned changed-path model carrying:

- added path;
- modified path;
- deleted path;
- renamed path with old and new names.

Use Git status-aware output for local, base-ref, and GitHub Actions planning. Preserve package comparison support.

Acceptance:

- deleted files reach every affected resolver;
- rename exposes both old and new paths;
- existing ignored-path behavior remains intentional;
- `--files` remains an explicit existing-target override and is not treated as deletion/rename planning;
- planner tests cover local, base-ref, CI, deletion, and rename cases.

### 2. Common lane-plan contract

Introduce a small mechanical result contract shared by resolvers:

- `skip` with reasons;
- `focused` with non-empty exact targets and reasons;
- `full` with reasons;
- `invalid` with blocking errors.

Acceptance:

- full overrides focused;
- targets are sorted and deduplicated;
- empty focused plans are invalid;
- every decision is printed in verify planning output;
- invalid metadata fails before test execution;
- no product semantics or cross-lane orchestration enters the shared helper.

## Phase 2: deterministic unit impact

### 3. Unit related and snapshot selection

Implement unit planning as:

1. directly added or modified test files;
2. owning tests for added, modified, or deleted snapshots;
3. Vitest related selection for changed existing source and local test-support modules through static imports;
4. union and deduplication;
5. full-unit fallback for unresolved snapshots, deleted/renamed dependencies, Vitest config/setup, global utilities, known dynamic-import boundaries, generated aliases, and unknown relations;
6. skip only for paths outside unit relevance.

Acceptance:

- a changed imported source or fixture selects non-sibling importing tests;
- a changed test runs directly;
- a changed snapshot runs its owner;
- deletion, rename, dynamic import, setup, and unresolved ownership cannot silently skip proof;
- no custom dependency graph is introduced;
- verify integration tests assert the resulting commands.

## Phase 3: independent Playwright registries

Implement each lane separately. Do not introduce all three in one PR.

Shared mechanical fields may cover:

- spec directory;
- relevant source domains;
- full-lane files and prefixes;
- source-to-spec mappings;
- justified standalone specs;
- visual snapshot ownership where applicable.

Source mappings contain only production, story, fixture, or owned support paths. They never contain spec paths to group tests.

### 4. Storybook behavior resolver

Correct the existing Storybook behavior resolver first because it already has the clearest bounded ownership.

- changed spec selects itself;
- remove spec paths from `sourcePrefixes`;
- explicitly map reusable UI/foundation/story/fixture sources;
- use full-lane fallback for shared config, setup, common helpers, and unmapped relevant sources;
- validate all discovered behavior specs.

Acceptance:

- editing one spec does not implicitly select unrelated grouped specs;
- source changes select all matching specs;
- overlapping mappings union cleanly;
- unknown relevant source selects full Storybook behavior;
- irrelevant source skips the lane;
- moved/deleted specs cannot leave stale registry records.

### 5. App E2E resolver

Adapt the current app scenario registry to the shared mechanical contract without changing scenario ownership.

- retain safe full app E2E for bootstrap, cross-cutting worker/service protocols, E2E infrastructure, and unknown relevant product source;
- changed app spec selects itself;
- mappings represent only stable source-to-product-scenario impact;
- common helpers default to full app E2E unless their complete consumer set is explicit and validated.

Acceptance:

- mapped local source runs owning product scenarios;
- unmapped relevant product source remains fail-closed;
- irrelevant source does not run app E2E;
- every discovered app spec is mapped or has a justified standalone reason;
- coverage is not reduced relative to the current resolver.

### 6. Visual resolver and snapshot ownership

Replace broad visual relevance with an explicit independent resolver.

- define the real repository convention from visual spec to baseline paths;
- changed spec selects itself;
- changed component, foundation, story, theme, font, icon, or rendering source selects mapped visual specs;
- unresolved baseline ownership selects full visual;
- global visual/Storybook configuration selects full visual;
- all visual specs are mapped or justified standalone.

Acceptance:

- added, modified, deleted, and renamed baselines resolve safely;
- mapped local visible changes do not require the full visual suite;
- unknown relevant visual impact remains full-lane;
- source mappings do not duplicate browser-behavior ownership;
- baseline naming and project suffixes are covered by resolver tests.

## Phase 4: mutation targets

### 7. Persistent mutation registry

Replace sibling-based applicability only after a persistent target registry and validation are implemented.

Start with exact files:

- unique target name;
- exact high-risk source files;
- exact owning focused tests;
- concrete risk reason.

Select a target when registered source or owning tests change.

Acceptance:

- ordinary UI, documentation, low-risk, and unrelated changes do not schedule mutation;
- registered high-risk changes automatically schedule narrow Stryker scope;
- missing source/tests, duplicate ownership, deletion, or rename without maintenance is invalid;
- current legacy mutation remains mandatory until replacement coverage and command behavior pass;
- removal of legacy sibling inference happens in the same PR that activates the validated registry.

## Phase 5: browser project applicability

### 8. Audit before changing desktop/mobile execution

Do not change the current two-project matrix during earlier resolver work.

First audit every app E2E scenario for observable platform risk:

- touch or pointer modality;
- viewport and responsive composition;
- overlays or mobile navigation;
- browser capability or permission differences;
- lifecycle differences;
- scenarios that are genuinely platform-independent.

Then choose the smallest persistent test metadata supported by Playwright and the repository. Do not introduce a generic criticality tag.

Acceptance before narrowing:

- every existing scenario is classified;
- mobile-risk scenarios remain directly exercised;
- the previous mobile protection is accounted for explicitly;
- execution-time benefit is measured;
- project filtering is covered by configuration and verify-planning tests;
- no scenario is silently dropped from all projects.

## Phase 6: durable performance checks when needed

### 9. Separate one-off measurements from budgets

Do not add a performance registry without an actual durable contract.

When a repeated need appears:

- define a named budget or baseline;
- add a reproducible repository-owned check;
- map stable source impact to that check;
- validate missing commands and stale mappings.

One-off PR optimization claims remain task-specific before/after measurements and are not automatically inferred by `verify`.

## Phase 7: correct proof ownership

These cleanups follow resolver stability and should remain separate from impact infrastructure.

### 10. Remove behavior from visual specs

- retain deterministic preparation and bounded screenshots;
- move reusable browser behavior to Storybook behavior;
- move complete product outcomes to app E2E only when product composition owns them;
- delete duplicate behavior already proved elsewhere.

### 11. Make browser helpers strict

- separate required action/assertion helpers from optional cleanup;
- remove silent returns, repeated fallback delivery, and arbitrary delay recovery;
- make missing preconditions and outcomes fail with clear diagnostics;
- update helper impact ownership.

### 12. Consolidate foundation proof

- prove generic focus, state layer, ripple, elevation, motion, and token precedence at foundation owners;
- retain family-specific routing, anatomy, deviations, and unique outcomes;
- preserve canonical Material evidence.

### 13. Decompose broad mocked component suites

For touched suites:

- move deterministic decisions to their real owner;
- retain narrow Vue public wiring in component-contract tests;
- retain complete product outcomes in app E2E when needed;
- delete broad stubs and duplicate assertions.

## Completion criteria

Migration is complete when:

- Git diff planning includes deletion and rename status;
- every resolver uses `skip | focused | full | invalid` with inspectable reasons;
- unit selection uses direct tests, snapshot ownership, Vitest static-import relations, and tested safe fallbacks;
- Storybook behavior, app E2E, and visual use independent validated source-impact registries;
- spec paths are not overloaded as source mappings;
- visual baseline ownership handles add/change/delete/rename safely;
- mutation is automatically selected from validated persistent high-risk targets;
- any project filtering was introduced only after complete audit and preserved mobile-risk coverage;
- task-specific `TEST IMPACT` is not consumed by automation;
- focused development and full release verification remain green and diagnostically useful;
- broad fallback remains only where impact is genuinely unknown or cross-cutting.
