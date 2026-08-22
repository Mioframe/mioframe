# Verify modernization

Status: **implementation substantially complete; Pass E release-impact ownership is reopened after full PR review; two output minors and the mandatory final benchmark remain**.

Current finish branch: `refactor/verify-modernization-finish`.

PR: `#216`.

This document records current verifier-modernization implementation shape, review status, representative selection evidence, and final benchmark/stop evidence. Canonical architecture remains in the documents listed below.

## Authority

- `docs/testing/architecture.md` — canonical testing policy;
- `docs/testing/verify-target-architecture.md` — verifier target architecture and exit criteria;
- `docs/testing/verify-agent-output.md` — agent-facing output contract;
- `docs/testing/verify-change-classification.md` — repository metadata classification;
- `docs/testing/verify-unit-impact-correction.md` — closed unit-impact correction;
- `docs/testing/verify-app-e2e-discovery-correction.md` — closed single-owner application-E2E discovery contract;
- `docs/testing/verify-e2e-planner-precision.md` — application product-scenario mapping contract;
- `docs/testing/verify-release-impact-correction.md` — reopened final release-impact closure architecture;
- `docs/testing/verify-finish-plan.md` — remaining correction/review/benchmark/CI order;
- active `REVIEW.md` artifacts — current review findings until resolved.

## Goal

`pnpm verify` selects the smallest reliable proof while remaining fail-closed for uncertain impact:

```text
known irrelevant change → skip
known affected contract → focused proof
unknown significant impact → full affected lane / invalid
normal agent-facing run → bounded trustworthy result + durable detailed logs
explicit full/release request → complete project/release gate
```

Exact-head GitHub CI remains the authoritative automatic repository gate, but green CI is not a substitute for semantic review or the required benchmark.

## Pass status

### Pass A — bounded agent-facing output

Core architecture implemented and accepted:

- bounded default child output;
- durable `.verify/logs/**` and `--verbose` detail;
- verifier-owned heartbeat/liveness;
- failure fallback based on trusted semantic facts or exit code + log/rerun pointers.

Two minor presentation defects remain:

1. multi-check `--only release-impact` suppresses progress index/total because progress mode is tied to `onlyLabel !== null` rather than the resolved runnable count;
2. passed-with-warnings normal output emits warning detail immediately and again in the compact final summary.

These are output-contract corrections only and do not reopen selection architecture.

### Pass B — repository metadata classification

Implemented and accepted. `isNonRuntimeRepositoryMetadataPath()` remains narrow; there is no global Markdown exclusion.

### Pass C — unit impact

Implemented and architect-reviewed.

The unit planner separates:

1. exact Vitest direct discovery;
2. repository-wide ordinary dependency inputs delegated to real `vitest related`;
3. explicit external file-as-data/runtime-discovery ownership;
4. bounded repository-scan ownership;
5. unsafe/global fallback.

Direct Vitest discovery matches the real include matrix. Unsupported `src/config *.test.mjs` shapes are not direct tests but can remain ordinary `.mjs` dependency inputs.

### Application-E2E discovery ownership

Implemented and architect-reviewed after the architecture stop/rework.

One pure module owns the root app-spec contract:

```text
scripts/lib/appE2EPaths.ts
├─ APP_E2E_SPEC_DIR
├─ APP_E2E_TEST_MATCH
└─ isRootAppE2ESpecPath()
```

`playwright.config.ts`, `e2eRisk.ts`, `e2eProjectApplicability.ts`, and `unitRisk.ts` consume it. Real Playwright collector proof remains independent and its temporary probes are collision-safe.

### Pass D — mutation ownership

Implemented and accepted. Mutation ownership is explicit high-risk opt-in through one registry shared by verifier planning and Stryker; adjacency is not ownership.

### Pass E — release impact

**Reopened after full PR review.**

The previously accepted exact mappings and fail-closed fixture/publication behavior remain useful, but the model was not closed over the complete required populations.

Confirmed current defect:

```text
vite.config.ts
→ imports config/plugins/index.ts
→ imports config/plugins/pwa.ts
→ production artifact build consumes real PWA/update configuration

current releaseRisk.ts
→ config/plugins/pwa.ts can resolve skip
```

Application E2E cannot substitute because its build explicitly sets `VITE_DISABLE_PWA=1`.

Release-spec ownership also needs a single source of truth tied to actual execution. The current basename heuristic can claim a new `managedUpdates*.spec.ts` even though `managedUpdatesProof.mjs` executes fixed arrays, while an unrelated new release spec can be unowned.

Resolved final architecture is in `verify-release-impact-correction.md`:

```text
scripts/release/releaseSpecInventory.ts
        │
        ├─ scripts/verify.ts
        ├─ scripts/release/managedUpdatesProof.mjs
        └─ scripts/lib/releaseRisk.ts
```

The same spec inventory must drive actual execution and planner ownership. `releaseRisk.ts` must also validate the complete bounded `tests/e2e/release/**/*.spec.ts` population and own the confirmed production Vite configuration boundary without broad `config/**` classification.

Runtime mapping validation must reject unknown release-check values.

The earlier artifact outer-timeout finding is independently closed: `artifact` now uses the same derived 17-minute Playwright outer deadline as other single-session Playwright-backed checks, and the 120-minute release job still covers the computed 117-minute verifier+setup envelope.

### Pass F — CI integration

Topology remains accepted:

```text
autofix
   ├─ verification-static
   ├─ verification-browser-e2e
   ├─ verification-storybook-browser / storybook-behavior
   ├─ verification-storybook-browser / visual
   ├─ verification-release
   └─ release-version
```

The release-impact correctness finding is inside the resolver/ownership model, not a reason to move or serialize the CI job.

## Representative selection status

The semantic matrix remains useful for closed lanes, but release rows are provisional until the reopened Pass E correction is implemented and reviewed.

Confirmed closed examples:

| Case                                         | Unit                        | Visual  | App E2E                     | Storybook behavior | Mutation      |
| -------------------------------------------- | --------------------------- | ------- | --------------------------- | ------------------ | ------------- |
| `AGENTS.md`                                  | skip                        | skip    | skip                        | skip               | skip          |
| feature source                               | focused/related as owned    | skip    | mapped scenario where owned | skip               | explicit only |
| Material component                           | focused                     | focused | full                        | focused            | explicit only |
| root `tests/e2e/*.spec.ts`                   | inventory owners            | skip    | focused direct spec         | skip               | skip          |
| nested arbitrary `tests/e2e/other/*.spec.ts` | no root app inventory owner | skip    | skip                        | skip               | skip          |
| `scripts/lib/appE2EPaths.ts`                 | related as applicable       | skip    | full infrastructure         | skip               | skip          |

Release examples that must be re-proved after correction:

```text
config/plugins/pwa.ts
config/plugins/base.ts
config/alias.ts
config/vueCustomElements.ts
→ cannot skip release-impact

current tests/e2e/release/**/*.spec.ts
→ each must have exactly one truthful executing release owner

new/unowned release spec
→ invalid until assigned to an actual executing contract
```

## Current review status

Current full PR review findings:

```text
blockers: 2
major issues: 0
minor issues: 2
accepted risks: 0
```

Blockers:

1. release-impact ownership is not closed over production Vite/PWA configuration and actual release-spec execution inventory;
2. the mandatory representative benchmark has not been completed/recorded.

Minor findings:

1. multi-check `release-impact` progress indexing;
2. duplicate normal-mode warning presentation.

Do not treat any CI result on an intermediate review/documentation head as final merge evidence.

## Mandatory benchmark — pending

`verify-target-architecture.md` requires a representative post-integration benchmark and makes it part of the modernization exit criterion.

Record both:

```text
critical-path / merge latency
aggregate expensive compute
```

The benchmark must use bounded real execution evidence after semantic corrections are accepted. No permanent benchmark tooling is required.

The final benchmark record must include:

- source run(s) and representative change class;
- job/check timing evidence;
- measured critical path / merge latency;
- measured aggregate expensive compute;
- interpretation;
- explicit decision:

```text
stop verifier modernization
```

or, only if measured evidence justifies it:

```text
open a separate architecture follow-up
```

## Remaining finish work

1. implement/review the reopened release-impact ownership architecture;
2. close the two output minor findings;
3. perform one complete semantic PR-level review;
4. remove resolved review artifacts;
5. obtain stable exact-head CI;
6. perform and record both benchmark metrics;
7. update this document with measured evidence and stop/reopen decision;
8. require CI on the final documentation head if the benchmark record changes the branch;
9. give merge-readiness verdict.

## CI critical path / merge latency

**Pending final representative benchmark.** Earlier/intermediate runs are not yet the required final measurement because the release-impact model is known invalid and review/status commits have moved the head repeatedly.

## Stop rule

Do not declare verifier modernization complete until:

- all semantic review findings are closed;
- release-impact ownership is demonstrably closed over its required populations;
- both required benchmark metrics are recorded;
- the benchmark does not justify further verifier infrastructure;
- final exact-head GitHub CI is healthy.

Further sharding, cross-job artifact transfer, generic dependency graphs, task runners, universal registries, timeout inflation, retries, or worker changes require a separate measured need and architecture decision.
