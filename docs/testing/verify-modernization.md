# Verify modernization

Status: **full PR semantic review is blocked by release-impact and mutation-ownership corrections; mandatory benchmark remains deferred**.

Branch: `refactor/verify-modernization-finish`  
PR: `#216`

This document records current implementation/review/benchmark status. Canonical architecture remains in the referenced testing documents.

## Authority

- `docs/testing/architecture.md` — canonical testing policy;
- `docs/testing/verify-target-architecture.md` — verifier target and exit criteria;
- `docs/testing/verify-agent-output.md` — agent-facing output contract;
- `docs/testing/verify-change-classification.md` — repository classification;
- `docs/testing/verify-output-correction.md` — closed M1/M2 output correction and review record;
- `docs/testing/verify-unit-impact-correction.md` — closed unit-impact architecture;
- `docs/testing/verify-app-e2e-discovery-correction.md` — closed application-E2E discovery architecture;
- `docs/testing/verify-release-impact-correction.md` — current Pass E architecture; reopened shared release-execution support boundary;
- `docs/testing/verify-mutation-impact-correction.md` — current mutation correction architecture;
- `docs/testing/verify-finish-plan.md` — remaining integration order;
- `scripts/lib/REVIEW.md` — active semantic blockers;
- `docs/testing/REVIEW.md` — mandatory benchmark blocker.

## Goal

`pnpm verify` should select the smallest reliable proof and fail closed when impact is materially uncertain:

```text
known irrelevant → skip
known owner → focused
unknown significant → full affected lane / invalid
normal run → bounded trustworthy output + durable logs
explicit full/release request → complete project/release gate
```

Green CI is necessary but not sufficient for merge; semantic review and the required benchmark remain independent gates.

## Closed areas

### Pass A — bounded output

Closed and architect-reviewed.

- multi-check progress depends on resolved runnable population;
- normal passed-with-warnings output has one compact diagnostic owner with exact per-check log/rerun;
- deterministic real-CLI subprocess proof covers both contracts.

### Pass B — repository metadata

Closed. Repository metadata uses a narrow positive classifier; runtime/source-adjacent Markdown is not globally hidden.

### Pass C — unit impact

Core unit-impact architecture remains accepted: exact direct Vitest discovery, real `vitest related` for ordinary dependency inputs, explicit file-as-data ownership, bounded repository-scan owners, status-aware deletion/rename handling, and fail-closed fallback.

The mutation correction will remove unitRisk's private duplicate Vitest test-path classifier in favor of one shared Vitest discovery-path owner. That is a source-of-truth correction, not a redesign of unit impact.

### Application-E2E discovery

Closed and architect-reviewed. `scripts/lib/appE2EPaths.ts` owns root application-spec path identity; real Playwright collector proof remains independent.

### Pass F — CI topology

Closed. Independent proof remains parallel after autofix:

```text
autofix
   ├─ verification-static
   ├─ verification-browser (e2e)
   ├─ verification-browser (storybook-behavior)
   ├─ verification-browser (visual)
   ├─ verification-release
   └─ release-version
```

`release-version` remains independent from source-impact planning.

## Reopened Pass E — shared release-execution support

Earlier Pass E sub-boundaries remain accepted:

- one real `releaseSpecInventory.ts` execution source of truth;
- exhaustive `tests/e2e/release/**/*.spec.ts` ownership validation;
- exact release runner/spec/fixture/publisher/managed-update ownership;
- production-build ownership for static/tool-discovered config, production env, TypeScript config, `public/**`, `pnpm-workspace.yaml`, package/lockfile fallback;
- artifact reuse, timeout model, and CI placement.

The full PR semantic review found one omitted mechanism: real release execution uses shared command/runtime support under `scripts/lib/**`, but `releaseRisk.ts` does not classify that support and can return `skip` for changes to it.

Current bounded support population:

```text
scripts/lib/commandLock.ts
scripts/lib/localCommandGuard.ts
scripts/lib/processResult.ts
scripts/lib/runLocalCommand.ts
scripts/lib/signalForward.ts
```

Truthful consumers:

```text
artifact + build + managed-updates + release-smoke
```

The architecture is resolved in `verify-release-impact-correction.md`; implementation remains pending.

## Reopened Pass D — mutation ownership/status contract

An independent reviewer found, and architect re-verification confirmed, two linked defects in the current mutation lane.

### Canonical changed identity is lost before planning

`changedPaths.ts` preserves deleted paths and both old/new rename identities, but `buildCommands()` filters the projection through current filesystem existence before calling `resolveMutationPlan()`. A deleted or renamed-away `stryker.config.mjs` can therefore silently skip mutation even though mutation execution config changed.

Resolved correction:

```text
canonical flat changedFiles projection
→ resolveMutationPlan(changedFiles)
```

Mutation remains identity-based; no second Git/status parser or status-bearing planner API is required.

### Mutation registry uses a false Vitest ownership heuristic

`validateMutationRegistry()` currently treats only `*.test.ts` as Vitest-owned, while the real `vitest.config.ts` includes additional `.test.mjs` populations and root test shapes. `unitRisk.ts` already carries a separate, more accurate copy of that contract.

Resolved correction:

```text
scripts/lib/vitestTestPaths.ts
→ one narrow Vitest test-path/discovery owner
   ├─ vitest.config.ts
   ├─ unitRisk.ts
   └─ mutationTargets.ts
```

The shared path owner is full-unit infrastructure. Mutation execution-semantic paths become:

```text
stryker.config.mjs
scripts/lib/mutationTargets.ts
vitest.config.ts
scripts/lib/vitestTestPaths.ts
→ all registered mutation targets after validation
```

The seven current audited mutation targets, Stryker mutate surface, thresholds, timeout, and CI topology remain unchanged.

Detailed architecture: `verify-mutation-impact-correction.md`.

## Full PR semantic review result

The first complete review from scratch ended blocked. After consolidating the independent mutation review, current semantic state is:

```text
semantic blockers: 2
major issues: 0
minor issues: 0
accepted risks: 0
```

Active semantic findings are `scripts/lib/REVIEW.md` B1 and B2:

1. shared release-execution support can silently skip release proof;
2. mutation ownership loses deleted/rename-old identity and does not use the real Vitest-owned test contract.

A new complete PR semantic review must be performed only after both corrections are implemented and their owner-level reviews are clean.

## Mandatory benchmark — pending

`docs/testing/REVIEW.md` remains a separate completion blocker. Do **not** benchmark yet: the accepted sequence requires semantic closure first.

After a clean full semantic review, record bounded real execution evidence for both:

```text
critical-path / merge latency
aggregate expensive compute
```

Record source run/change class, both measurements, interpretation, and an explicit stop/reopen decision. Do not add permanent benchmark infrastructure without measured need.

## Current review state

```text
blockers: 3
major issues: 0
minor issues: 0
accepted risks: 0
```

Blockers:

1. `scripts/lib/REVIEW.md` B1 — shared release-execution support ownership;
2. `scripts/lib/REVIEW.md` B2 — mutation changed-identity / Vitest ownership contract;
3. `docs/testing/REVIEW.md` B1 — mandatory representative benchmark, deferred until semantic closure.

CI from production head `32e33108ea91eb17c4d6960e97ede1c32e84dae7` is intermediate evidence only. Architect-owned review/documentation updates have moved the PR head, and semantic blockers remain open regardless of CI color.

## Completion

Modernization is complete only after:

1. both semantic blockers are implemented and owner-reviewed;
2. a new complete PR semantic review is clean;
3. stable exact-head CI for the semantically accepted implementation is healthy;
4. both mandatory benchmark metrics are recorded;
5. architect records the stop/reopen decision;
6. final documentation/PR metadata are current;
7. CI is healthy on the resulting final documentation head;
8. current `develop` ancestry, unresolved review threads, exact PR head, and all required gates are rechecked.
