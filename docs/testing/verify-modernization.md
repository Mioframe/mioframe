# Verify modernization

Status: **implementation substantially complete; Pass E is closed; two output minors and the mandatory benchmark remain**.

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
- `docs/testing/verify-release-impact-correction.md` — closed Pass E architecture and review record;
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

**Closed: production-build mechanism correction implemented and architect-reviewed.**

Retained execution ownership remains:

- one `scripts/release/releaseSpecInventory.ts` source of truth shared by real release runners and planner;
- exhaustive bounded validation of `tests/e2e/release/**/*.spec.ts`;
- unowned/missing/conflicting release spec → `invalid`;
- no managed-update filename ownership;
- runtime unknown release-check validation;
- artifact 17-minute Playwright outer timeout and existing 120-minute release-job envelope.

The production-build side is now closed over the confirmed current mechanisms:

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

Current modeled inputs include Browserslist, PostCSS, PWA-assets configuration, production Vite env files and the production/config TypeScript chain. The planner keeps the implementation local to `scripts/lib/releaseRisk.ts`, does not mirror third-party loader extension matrices, and does not introduce a generic graph/registry or broad root/config fallback.

Independent test-author proof in `scripts/lib/releaseRisk.test.ts` covers current inputs, fail-closed family members, `public/**` including proof-looking filenames, known negatives and `pnpm-workspace.yaml`. The implementation then changed only `scripts/lib/releaseRisk.ts`.

Architect re-review confirmed the real source-side build mechanisms and the retained release inventory/runners. No blocker or major issue remains in Pass E. Current CI static format/lint/type-check/unit evidence on the implementation head was green at review time; browser/release execution was still in progress and is not final merge evidence.

Ordinary `src/**` remains outside release-impact merely because Vite bundles it; existing scenario/lane ownership remains unchanged.

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
minor issues: 2
accepted risks: 0
```

Blocker:

1. the mandatory representative benchmark is not yet recorded.

Minor findings:

1. multi-check release-impact progress indexing;
2. duplicate normal-mode warning presentation.

## Mandatory benchmark — pending

After the two output corrections and full semantic review are clean, record from bounded real execution evidence:

```text
critical-path / merge latency
aggregate expensive compute
```

The record must include source run/change class, both measurements, interpretation and explicit stop/reopen decision. Do not add permanent benchmark infrastructure without measured need.

## Completion

Modernization is complete only after:

1. both output findings are closed and architect-reviewed;
2. one complete PR semantic review is clean;
3. stable exact-head CI is healthy;
4. both mandatory benchmark metrics are recorded;
5. architect records the stop decision;
6. CI is healthy on the resulting final documentation head.
