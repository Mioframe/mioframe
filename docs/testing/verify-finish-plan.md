# Verify modernization finish plan

Status: **PR publication blocked by one reopened application-E2E alignment correction and final documentation/comment cleanup**.

This document owns verifier-modernization packaging, correction order, and final integration state. It does not redefine lane semantics owned by the architecture documents.

## Authority

- `docs/testing/architecture.md` — project-wide testing policy;
- `docs/testing/verify-target-architecture.md` — verifier impact/planning architecture;
- `docs/testing/verify-agent-output.md` — agent-facing verifier output;
- `docs/testing/verify-change-classification.md` — repository metadata classification;
- `docs/testing/verify-unit-impact-correction.md` — unit-impact ownership amendment;
- `docs/testing/verify-app-e2e-discovery-correction.md` — application-E2E physical/planner discovery contract, currently reopened for final alignment;
- `docs/testing/verify-release-impact-correction.md` — closed Pass E release-impact correction;
- `docs/testing/verify-modernization.md` — implementation/benchmark progress record;
- `scripts/lib/REVIEW.md` — active final PR-level findings;
- `.agents/skills/verification/SKILL.md`, `test-first`, and `test-authoring` — execution/proof workflow.

Architecture/status/benchmark documents are architect-owned. Coding and test-author agents must not edit them unless explicitly assigned.

## Branch state

Finish branch:

```text
refactor/verify-modernization-finish
```

Current synchronized `develop` merge-base:

```text
13ae220900a2a724c867b01b5eb1f045c2a1d857
```

The branch was last compared as ahead of, and not behind, that `develop` head. Re-check immediately before PR publication.

## Closed corrections

### Pass A — agent-facing output

Behavior remains accepted: default output is bounded, detailed diagnostics stay in `.verify/logs/**`, heartbeats carry verifier-owned liveness only, and failure reasons fall back to exact exit status plus log/rerun pointers when no trustworthy semantic extractor exists.

One canonical wording mismatch in `verify-agent-output.md` remains architect-owned cleanup; verifier behavior is not reopened.

### Pass B — repository metadata classification

Closed. `isNonRuntimeRepositoryMetadataPath()` remains a narrow positive fact rather than a global Markdown/document classifier.

### Pass C — unit impact

Closed, including the exact direct Vitest discovery follow-up.

`isTestShapedPath()` now mirrors `vitest.config.ts`:

```text
src/**/*.test.ts
config/**/*.test.ts
scripts/**/*.test.ts
scripts/**/*.test.mjs
tests/e2e/**/*.test.mjs
playwright.*.test.ts
eslint.config.test.ts
```

Unsupported `src/config *.test.mjs` shapes remain eligible as ordinary module/support inputs for `vitest related`; they are simply not direct Vitest tests.

### Pass D — mutation ownership

Closed. Mutation remains explicit high-risk opt-in through one registry shared with Stryker; adjacency is not ownership.

### Pass E — release-impact consumer model

Closed and architect-reviewed against `docs/testing/verify-release-impact-correction.md`.

The release planner uses real six-command consumer ownership, excludes proof/type-only paths before broad runtime fallbacks, validates malformed exact mappings, preserves unknown significant runtime fail-closed behavior, and keeps `release-version` independent.

### Pass F — CI topology

Closed. Implementation proof lanes remain parallel after autofix, `verification-release` runs source-impact release proof independently, aggregate verification requires it, and release-version remains separate.

## Reopened final correction — application-E2E selection and collector-proof safety

The physical Playwright config is already correctly root-only:

```text
application E2E
→ direct tests/e2e/*.spec.ts only
```

Final full-diff review found two remaining mismatches owned by the same application-E2E discovery/selection boundary:

1. `scripts/lib/e2eRisk.ts:isAppE2ESpecPath()` still recognizes arbitrary nested non-reserved `tests/e2e/**/*.spec.ts` files as application specs, even though `playwright.config.ts`, scenario-registry discovery, applicability discovery, and unit inventory ownership are root-only.
2. `playwright.lanes.test.ts` creates fixed probe paths and recursively removes a fixed nested directory, which can overwrite/delete otherwise valid future repository content.

The resolved architecture and proof requirements are in `docs/testing/verify-app-e2e-discovery-correction.md`.

This correction is next. Do not broaden it into another application-E2E redesign.

## Final documentation/comment cleanup after behavioral correction

Once the application-E2E correction is green and reviewed, the architect completes remaining final-state wording cleanup:

- align `docs/testing/verify-agent-output.md` with the accepted exit-code + log-pointer fallback;
- remove the stale old-prefix wording in `unitRisk.test.ts`;
- correct release-lane wording in `e2eRisk.ts` if not already touched by the correction;
- correct the rolling-buffer comment in `verify.ts`;
- refresh affected benchmark/status rows in `verify-modernization.md`, including the shared `scripts/playwrightContainer.ts` browser-lane ownership.

No executable behavior or assertions should change solely for this cleanup.

## Remaining order

```text
1. application-E2E root-only planner + collision-safe collector correction
2. architect semantic review of that complete owner scope
3. final documentation/comment cleanup
4. architect refreshes benchmark/status
5. full final semantic PR-level diff review
6. remove resolved REVIEW.md artifacts
7. compare branch with current develop and integrate if needed
8. publish PR to develop
9. apply release-intent/version label
10. inspect exact-head CI
11. if CI/autofix changes head, review the new exact head and its CI
12. record actual CI critical path / merge latency
13. merge-readiness verdict
```

## Proof discipline for the remaining behavioral correction

```text
accepted contract
→ fresh test-author context
→ root-positive / nested-negative planner proof
→ meaningful RED for broad nested spec classification
→ collision-safe real collector proof
→ separate implementation context
→ focused GREEN
→ architect semantic review
```

The implementation agent treats accepted assertions as read-only. Proof-harness safety itself does not need a ceremonial RED when the old proof already exercises the right external behavior; its setup/cleanup semantics must instead be reviewed directly for isolation.

## Final review boundary

Before PR publication, review the complete `develop...refactor/verify-modernization-finish` result for:

- ownership and dependency direction;
- physical proof discovery vs planner/registry/applicability inventories;
- fail-closed/status behavior;
- unit/release/mutation source of truth;
- removal of replaced inference;
- proof independence and test-state isolation;
- verifier output boundedness/actionability;
- release-version separation;
- CI topology;
- benchmark consistency.

No active `REVIEW.md` may remain in the final PR diff.

## PR / CI sequence

Only after semantic findings are closed:

```text
final full-diff review
→ remove resolved REVIEW.md artifacts
→ compare with current develop
→ publish PR
→ apply required release-intent label
→ inspect exact-head CI
→ if autofix/materialization changes head, review the new head and new CI
→ record real CI critical path / merge latency
→ merge-readiness decision
```

Exact-head GitHub CI is the authoritative automatic repository gate.

## Stop rule

After exact-head CI is healthy and final review has no findings, stop verifier infrastructure modernization. Further jobs, sharding, cross-job artifacts, generic dependency graphs, task runners, universal registries, or speculative optimization require a separate measured need and architecture decision.