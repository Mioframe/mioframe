# Verify modernization

Status: **implementation substantially complete; Pass E production-build input architecture is redesigned and ready but not yet implemented; two output minors and the mandatory benchmark remain**.

Branch: `refactor/verify-modernization-finish`  
PR: `#216`

This document records current implementation/review/benchmark status. Canonical architecture remains in the referenced testing documents.

## Authority

- `docs/testing/architecture.md` — canonical testing policy;
- `docs/testing/verify-target-architecture.md` — verifier target and exit criteria;
- `docs/testing/verify-agent-output.md` — agent-facing output contract;
- `docs/testing/verify-change-classification.md` — repository classification;
- `docs/testing/verify-unit-impact-correction.md` — closed unit-impact architecture;
- `docs/testing/verify-app-e2e-discovery-correction.md` — closed application-E2E discovery architecture;
- `docs/testing/verify-release-impact-correction.md` — current ready Pass E architecture;
- `docs/testing/verify-finish-plan.md` — remaining integration order;
- active `REVIEW.md` artifacts — unresolved findings.

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

Core architecture is implemented. Two presentation findings remain:

1. multi-check `--only release-impact` suppresses progress index/total;
2. passed-with-warnings normal output duplicates warning detail.

### Pass B — repository metadata

Implemented and accepted.

### Pass C — unit impact

Implemented and architect-reviewed: exact direct Vitest discovery, real `vitest related` for ordinary dependency inputs, explicit file-as-data ownership, bounded repository-scan owners and fail-closed fallback.

### Application-E2E discovery

Implemented and architect-reviewed. `scripts/lib/appE2EPaths.ts` is the single root app-spec path owner; real Playwright collector proof remains independent.

### Pass D — mutation

Implemented and accepted through one explicit high-risk target registry shared by verifier planning and Stryker.

### Pass E — release impact

**Open: production-build input architecture ready; implementation pending.**

Closed and retained:

- one `scripts/release/releaseSpecInventory.ts` source of truth shared by real release runners and planner;
- exhaustive bounded validation of `tests/e2e/release/**/*.spec.ts`;
- unowned/missing/conflicting release spec → `invalid`;
- no managed-update filename ownership;
- runtime unknown release-check validation;
- artifact 17-minute Playwright outer timeout and existing 120-minute release-job envelope.

Latest full review found that the production-build side was still not closed. The real release `vite build` consumes repository files through mechanisms beyond static imports. Current missed examples include:

```text
.browserslistrc
postcss.config.js
pwa-assets.config.ts
public/favicon.svg
```

The repeated ownership failure triggered the repository stop rule. The architecture has been redesigned around mechanisms rather than examples:

```text
static build-control inputs
tool-discovered root configs
production Vite env inputs
TypeScript build/config metadata
public/** artifact population
dependency-install control
```

The complete ready decision, consumer sets, fail-closed rules and independent proof matrix are in `verify-release-impact-correction.md`.

Ordinary `src/**` is not promoted to release-impact merely because Vite bundles it; existing scenario/lane ownership remains unchanged.

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

Pass E correctness is a planner/ownership issue, not a reason to serialize or redesign CI.

## Current review state

```text
blockers: 2
major issues: 0
minor issues: 2
accepted risks: 0
```

Blockers:

1. ready Pass E mechanism-based production-build ownership is not yet implemented/reviewed;
2. the mandatory representative benchmark is not yet recorded.

Minor findings:

1. multi-check release-impact progress indexing;
2. duplicate normal-mode warning presentation.

## Mandatory benchmark — pending

After semantic corrections and full review are clean, record from bounded real execution evidence:

```text
critical-path / merge latency
aggregate expensive compute
```

The record must include source run/change class, both measurements, interpretation and explicit stop/reopen decision. Do not add permanent benchmark infrastructure without measured need.

## Completion

Modernization is complete only after:

1. Pass E mechanism-based production-build ownership is implemented and architect-reviewed;
2. both output findings are closed;
3. one complete PR semantic review is clean;
4. stable exact-head CI is healthy;
5. both mandatory benchmark metrics are recorded;
6. architect records the stop decision;
7. CI is healthy on the resulting final documentation head.
