# Verify modernization

Status: **full PR semantic review completed but blocked; Pass E shared release-execution support correction and the mandatory benchmark remain**.

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
- `docs/testing/verify-finish-plan.md` — remaining integration order;
- `scripts/lib/REVIEW.md` — active semantic blocker from the full PR review;
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

Closed and architect-reviewed: exact direct Vitest discovery, real `vitest related` for ordinary dependency inputs, explicit file-as-data ownership, bounded repository-scan owners, status-aware deletion/rename handling, and fail-closed fallback.

### Application-E2E discovery

Closed and architect-reviewed. `scripts/lib/appE2EPaths.ts` owns root application-spec path identity; real Playwright collector proof remains independent.

### Pass D — mutation

Closed through one explicit high-risk mutation target registry shared by verifier planning and Stryker.

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

## Pass E — reopened by full PR review

Earlier Pass E sub-boundaries remain accepted:

- one real `releaseSpecInventory.ts` execution source of truth;
- exhaustive `tests/e2e/release/**/*.spec.ts` ownership validation;
- exact release runner/spec/fixture/publisher/managed-update ownership;
- production-build ownership for static/tool-discovered config, production env, TypeScript config, `public/**`, `pnpm-workspace.yaml`, package/lockfile fallback;
- artifact reuse, timeout model, and CI placement.

The full PR semantic review found one omitted **mechanism**, not an isolated path: real release execution uses shared command/runtime support under `scripts/lib/**`, but `releaseRisk.ts` currently does not classify that support and can return `skip` for changes to it.

Current bounded shared release-execution support population:

```text
scripts/lib/commandLock.ts
scripts/lib/localCommandGuard.ts
scripts/lib/processResult.ts
scripts/lib/runLocalCommand.ts
scripts/lib/signalForward.ts
```

Confirmed truthful consumers:

```text
artifact + build + managed-updates + release-smoke
```

`release-config` and `publisher-node-import` do not consume this mechanism.

The architecture is resolved in `verify-release-impact-correction.md`: keep the explicit current mechanism local to `releaseRisk.ts`; require a bounded transitive runtime-import audit from the accepted release execution roots; keep unrelated `scripts/lib/**` negative; do not add a generic graph or broad directory fallback.

Because this is another release-ownership completeness failure, the repository stop rule applies: implementation must close the audited mechanism, not add only the five noticed examples without proving the population is complete.

## Full PR semantic review result

The complete PR-level review was performed from scratch against the current resulting PR rather than relying on accumulated focused reviews.

Result:

```text
verdict: blocked
blockers: 1 semantic implementation blocker
major issues: 0
minor issues: 0
accepted risks: 0
```

The active implementation finding is `scripts/lib/REVIEW.md` B1.

No additional findings were found in repository metadata, unit impact, application-E2E discovery, Storybook behavior/visual ownership, mutation ownership, verifier invocation/output, release-spec execution inventory, production-build ownership, or CI topology.

The full semantic review must be repeated after B1 is corrected because the current review ended blocked.

## Mandatory benchmark — pending

`docs/testing/REVIEW.md` remains a separate completion blocker. Do **not** benchmark yet: the accepted sequence requires a clean full semantic review first.

After semantic closure, record bounded real execution evidence for both:

```text
critical-path / merge latency
aggregate expensive compute
```

Record source run/change class, both measurements, interpretation, and an explicit stop/reopen decision. Do not add permanent benchmark infrastructure without measured need.

## Current review state

```text
blockers: 2
major issues: 0
minor issues: 0
accepted risks: 0
```

Blockers:

1. `scripts/lib/REVIEW.md` — shared release-execution support can silently skip release proof;
2. `docs/testing/REVIEW.md` — mandatory representative benchmark, deferred until semantic closure.

## Completion

Modernization is complete only after:

1. shared release-execution support ownership is implemented and architect-reviewed;
2. a new complete PR semantic review is clean;
3. stable exact-head CI for the semantically accepted implementation is healthy;
4. both mandatory benchmark metrics are recorded;
5. architect records the stop/reopen decision;
6. final documentation/PR metadata are current;
7. CI is healthy on the resulting final documentation head;
8. current `develop` ancestry, unresolved review threads, exact PR head, and all required gates are rechecked.
