# Testing architecture migration plan

`docs/testing/architecture.md` defines the durable target. This plan applies it to the current repository without reducing existing protection before replacement mechanisms are implemented and verified.

## Migration constraints

- Use focused PRs with one resolver or ownership problem per PR.
- Preserve current production behavior.
- Preserve or strengthen current test coverage before narrowing execution.
- Keep safe broad fallback until a deterministic replacement is implemented and tested.
- Do not make `verify` depend on `TEST IMPACT` or any uncommitted agent report.
- Do not redesign proof ownership inside resolver implementation.
- Every migration PR must be independently safe to merge into `develop`: broadening an upstream input contract (for example, exposing deleted paths or both rename sides through `getChangedFileProjection()`) requires auditing and adapting all existing downstream consumers in the same PR. Deferred phases may postpone new capabilities, but must not leave invalid commands, false skips, false failures, or dependence on a later PR.
- Remove this document after all completion criteria are satisfied.

## Current mismatches

### Diff planning (resolved)

`scripts/lib/changedPaths.mjs` now owns a repository-wide, status-aware changed-path model (see Phase 1, step 1, below). Local, local-base, and GitHub Actions planning all use NUL-delimited `git diff --name-status` output, preserve deleted paths, and expose both sides of a rename. `--files` remains an explicit existing-path override handled separately from Git diff planning.

Resolvers still consume filenames, not status-aware records: `scripts/verify.mjs` and its command planners read the transitional `getChangedFileProjection()` string-path projection rather than the underlying `ChangedPath[]` records. This PR does not migrate their resolver-specific contracts. It includes the compatibility adaptations required by the broader projection: missing mutation targets are excluded, and deleted or renamed-away app E2E and Storybook behavior specs select their full owning lane instead of becoming invalid focused command arguments. Format/lint, unit, type-check, visual, and package-impact behavior remains compatible with the existing planners. Full status-aware behavior inside each lane is tracked separately in Phase 2 ("Static check planning") and later phases.

### Static verification

- existing-file filtering happens before some checks can reason about deletion or rename;
- the status-aware effect of deleted/renamed typed files, declarations, aliases, package, and lockfile changes is not expressed by one planner contract;
- instruction compatibility is mandatory but not described alongside the other automatic lanes.

### Unit selection

- focused unit selection is mainly changed tests plus colocated siblings;
- imported non-sibling tests may be missed;
- snapshot ownership is not resolved explicitly;
- deletion, rename, dynamic imports, global setup, and unknown relations lack one explicit full-unit policy;
- the current implementation does not use official Vitest related resolution for changed source inputs.

### Playwright selection

- app E2E and Storybook behavior already use separate scenario mappings, but their semantics differ;
- Storybook mappings currently use spec paths inside `sourcePrefixes` to group tests;
- visual selection is broad and has no explicit baseline-owner resolver;
- lane relevance, full-lane paths, mappings, and standalone rules are not represented consistently;
- common helper consumer ownership is not uniformly validated.

### Release selection

- production-artifact checks run only in full/release mode;
- focused development verification cannot automatically select build, artifact, or release-smoke proof for release-only contract changes;
- release-relevant paths and exact owning checks are not represented by one resolver.

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

### 1. Changed-path model — complete

`scripts/lib/changedPaths.mjs` introduces the repository-owned changed-path model, carrying:

- added path;
- modified path;
- deleted path;
- renamed path with old and new names.

It uses NUL-delimited, status-aware Git output (`git diff --name-status -z --find-renames --diff-filter=ADMRT`) for local, local-base (fork-point), and GitHub Actions (merge-base) planning, and preserves `packageJsonOldRef` package comparison support for every scope. `scripts/verify.mjs` calls `resolveChangedPathsScope()` for scope resolution and `getChangedFileProjection()` to obtain the transitional string-path list its current command planners still consume (see "Diff planning" above).

Acceptance (met):

- deleted files reach every affected resolver through the transitional projection;
- rename exposes both old and new paths;
- existing ignored-path behavior remains intentional, including renames that cross an ignored/relevant boundary;
- `--files` remains an explicit existing-target override and is not treated as deletion/rename planning;
- legacy consumers remain independently safe: they either receive valid existing targets or conservatively select the full owning lane;
- planner tests (`scripts/lib/changedPaths.test.mjs`) cover local, local-base, GitHub Actions, last-commit fallback, deletion, and rename cases using temporary Git repositories.

### 2. Common lane-plan contract — not started

The `skip | focused | full | invalid` shared lane-plan contract below remains unimplemented. Current resolvers retain their existing resolver-specific result shapes. The changed-path model required only local compatibility adaptations for missing mutation and Playwright targets; it did not introduce the shared contract or make any lane consume `ChangedPath[]` directly.

Introduce a small mechanical result contract shared by resolvers:

- `skip` with reasons;
- `focused` with non-empty exact lane-defined execution inputs and reasons;
- `full` with reasons;
- `invalid` with blocking errors.

A focused input may be a spec, direct test, source path for the official Vitest related resolver, release check, mutation target, or another exact repository-owned check.

Acceptance:

- full overrides focused;
- inputs are sorted and deduplicated;
- empty focused plans are invalid;
- every decision is printed in verify planning output;
- invalid metadata fails before test execution;
- no product semantics or cross-lane orchestration enters the shared helper.

## Phase 2: status-aware static verification

### 3. Static check planning

Adapt format, lint, type-check, and instruction compatibility planning to the changed-path model.

- format and lint only added or modified existing supported files;
- deletion does not produce a formatting/lint target;
- added, modified, deleted, or renamed TypeScript, Vue, declaration, alias, typed configuration, package, and lockfile changes select full type-check when they can affect the program graph;
- shared formatter/linter/type-check configuration selects the complete owning check;
- `AGENTS.md`, skills, or generator changes select instruction compatibility validation;
- unsupported paths do not select unrelated static tools.

Acceptance:

- deleting or renaming a typed source cannot skip type-check;
- deleting a file never sends a nonexistent path to format or lint;
- instruction-tree edits validate generated compatibility state;
- package and lockfile changes preserve current field-sensitive behavior where safe;
- command planning is covered for add/modify/delete/rename and shared config.

## Phase 3: deterministic unit impact

### 4. Unit related and snapshot selection

Implement focused unit execution inputs as:

1. directly added or modified test files;
2. owning tests for added, modified, or deleted snapshots;
3. changed existing source and local test-support paths passed to the supported Vitest related CLI or API.

Sort and deduplicate direct tests, snapshot owners, and related source inputs. Let Vitest own static-import graph resolution; do not build a parallel dependency graph merely to enumerate every resulting test file.

Use full-unit fallback for unresolved snapshots, deleted/renamed dependencies whose old relation cannot be represented safely, Vitest config/setup, global utilities, known dynamic-import boundaries, generated aliases, and unknown relations.

If a focused related run finds no tests, report that result explicitly instead of converting it to a full run. It is not evidence that no unit proof is needed.

Acceptance:

- a changed imported source or fixture selects non-sibling importing tests through official Vitest related resolution;
- a changed test runs directly;
- a changed snapshot runs its owner;
- deletion, rename, dynamic import, setup, and unresolved ownership cannot silently skip proof;
- a no-match related result does not trigger an unhelpful full unit run;
- the summary states that no matching related tests is not evidence of sufficient proof;
- no custom dependency graph is introduced;
- verify integration tests assert the exact inputs and resulting commands.

## Phase 4: independent Playwright registries

Implement each lane separately. Do not introduce all three in one PR.

Shared mechanical fields may cover:

- spec directory;
- relevant source domains;
- full-lane files and prefixes;
- source-to-spec mappings;
- justified standalone specs;
- visual snapshot ownership where applicable.

Source mappings contain only production, story, fixture, or owned support paths. They never contain spec paths to group tests.

### 5. Storybook behavior resolver

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

### 6. App E2E resolver

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

### 7. Visual resolver and snapshot ownership

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

## Phase 5: focused release impact

### 8. Release resolver

Add an independent release resolver before allowing release-only proof to remain manual.

It owns stable source-to-check impact for:

- build and release configuration;
- routing and base-path behavior in the built artifact;
- manifest, service worker, PWA, and channel isolation;
- release scripts and artifact assembly;
- runtime dependency changes affecting production output.

Known local impact selects exact checks such as build, artifact smoke, or first/returning-user release smoke. Shared release infrastructure and unknown relevant impact select the full release lane.

Acceptance:

- a release-only contract change cannot pass focused `pnpm verify` with every release check skipped;
- known local impact runs only the necessary release checks;
- shared or unknown release impact runs the full release lane;
- stale/missing release targets or invalid mappings block verification;
- focused release planning does not weaken unconditional `pnpm verify:release` for `main`;
- default, focused `--only`, and full release command modes are covered by tests.

## Phase 6: mutation targets

### 9. Persistent mutation registry

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

## Phase 7: browser project applicability

### 10. Audit before changing desktop/mobile execution

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

## Phase 8: durable performance checks when needed

### 11. Separate one-off measurements from budgets

Do not add a performance registry without an actual durable contract.

When a repeated need appears:

- define a named budget or baseline;
- add a reproducible repository-owned check;
- map stable source impact to that check;
- validate missing commands and stale mappings.

One-off PR optimization claims remain task-specific before/after measurements and are not automatically inferred by `verify`.

## Phase 9: correct proof ownership

These cleanups follow resolver stability and should remain separate from impact infrastructure.

### 12. Remove behavior from visual specs

- retain deterministic preparation and bounded screenshots;
- move reusable browser behavior to Storybook behavior;
- move complete product outcomes to app E2E only when product composition owns them;
- delete duplicate behavior already proved elsewhere.

### 13. Make browser helpers strict

- separate required action/assertion helpers from optional cleanup;
- remove silent returns, repeated fallback delivery, and arbitrary delay recovery;
- make missing preconditions and outcomes fail with clear diagnostics;
- update helper impact ownership.

### 14. Consolidate foundation proof

- prove generic focus, state layer, ripple, elevation, motion, and token precedence at foundation owners;
- retain family-specific routing, anatomy, deviations, and unique outcomes;
- preserve canonical Material evidence.

### 15. Decompose broad mocked component suites

For touched suites:

- move deterministic decisions to their real owner;
- retain narrow Vue public wiring in component-contract tests;
- retain complete product outcomes in app E2E when needed;
- delete broad stubs and duplicate assertions.

## Completion criteria

Migration is complete when:

- Git diff planning includes deletion and rename status;
- every resolver uses `skip | focused | full | invalid` with inspectable lane-defined inputs;
- static verification handles add/modify/delete/rename without passing nonexistent targets or skipping typed impact;
- unit selection uses direct tests, snapshot ownership, official Vitest static-import resolution, explicit no-match reporting, and tested full fallbacks;
- Storybook behavior, app E2E, and visual use independent validated source-impact registries;
- spec paths are not overloaded as source mappings;
- visual baseline ownership handles add/change/delete/rename safely;
- focused verification automatically selects release-only proof while `pnpm verify:release` remains unconditional for `main`;
- mutation is automatically selected from validated persistent high-risk targets;
- any project filtering was introduced only after complete audit and preserved mobile-risk coverage;
- task-specific `TEST IMPACT` is not consumed by automation;
- focused development and full release verification remain green and diagnostically useful;
- broad fallback remains only where impact is genuinely unknown or cross-cutting.
