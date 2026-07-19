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
