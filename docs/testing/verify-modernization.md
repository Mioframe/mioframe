# Verify modernization

Status: **implementation corrections complete; Pass A-E and CI topology are closed; full PR semantic review, the mandatory benchmark, and final exact-head CI remain**.

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
- `docs/testing/verify-release-impact-correction.md` — closed Pass E architecture and review record;
- `docs/testing/verify-finish-plan.md` — remaining integration order;
- active `REVIEW.md` artifacts — unresolved findings only.

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

## Pass status

### Pass A — bounded output

**Closed and architect-reviewed.**

The two final presentation defects are corrected:

- multi-check progress now depends on resolved runnable population, so grouped `--only release-impact` runs retain index/total while a one-runnable focused run stays denominator-free;
- normal passed-with-warnings output has one bounded diagnostic owner in the compact summary, including exact per-check log and focused rerun pointers; immediate warning detail is verbose-only.

Independent deterministic CLI subprocess proof is recorded in `scripts/verify.test.ts`. The completed correction/review record is `verify-output-correction.md`.

### Pass B — repository metadata

Implemented and accepted.

### Pass C — unit impact

Implemented and architect-reviewed: exact direct Vitest discovery, real `vitest related` for ordinary dependency inputs, explicit file-as-data ownership, bounded repository-scan owners and fail-closed fallback.

### Application-E2E discovery

Implemented and architect-reviewed. `scripts/lib/appE2EPaths.ts` is the single root app-spec path owner; real Playwright collector proof remains independent.

### Pass D — mutation

Implemented and accepted through one explicit high-risk target registry shared by verifier planning and Stryker.

### Pass E — release impact

**Closed and architect-reviewed.**

Retained execution ownership remains:

- one `scripts/release/releaseSpecInventory.ts` source of truth shared by real release runners and planner;
- exhaustive bounded validation of `tests/e2e/release/**/*.spec.ts`;
- unowned/missing/conflicting release spec → `invalid`;
- no managed-update filename ownership;
- runtime unknown release-check validation;
- artifact 17-minute Playwright outer timeout and existing 120-minute release-job envelope.

The production-build side is closed over confirmed current mechanisms:

```text
current positively-known build input
→ focused truthful four-check consumer set

complete public/** artifact population
→ focused truthful four-check consumer set

non-current path inside a confirmed build-config family
→ full six until audited

known non-production member
→ no release ownership from that family

pnpm-workspace.yaml
→ full six
```

The implementation remains local to `scripts/lib/releaseRisk.ts`, does not mirror third-party loader extension matrices, and introduces no generic graph/registry or broad root/config fallback.

### Pass F — CI

Accepted topology remains unchanged:

```text
autofix
   ├─ verification-static
   ├─ verification-browser-e2e
   ├─ verification-storybook-browser / storybook-behavior
   ├─ verification-storybook-browser / visual
   ├─ verification-release
   └─ release-version
```

## Current review state

```text
blockers: 1
major issues: 0
minor issues: 0
accepted risks: 0
```

The remaining blocker is the mandatory representative benchmark in `docs/testing/REVIEW.md`.

Before measuring it, perform one complete PR-level semantic review from scratch against the full resulting PR rather than relying on the accumulated focused reviews.

## Mandatory benchmark — pending

After the full PR semantic review is clean, record from bounded real execution evidence:

```text
critical-path / merge latency
aggregate expensive compute
```

The record must include source run/change class, both measurements, interpretation and explicit stop/reopen decision. Do not add permanent benchmark infrastructure without measured need.

## Completion

Modernization is complete only after:

1. one complete PR semantic review is clean;
2. stable exact-head CI for the corrected implementation is healthy;
3. both mandatory benchmark metrics are recorded;
4. architect records the stop/reopen decision;
5. final documentation/PR metadata are current;
6. CI is healthy on the resulting final documentation head;
7. current `develop` ancestry, unresolved review threads and all required gates are rechecked.
