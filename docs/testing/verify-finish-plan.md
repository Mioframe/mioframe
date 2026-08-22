# Verify modernization finish plan

Status: **PR publication blocked by one architecture-redone application-E2E correction and final source/comment cleanup**.

This document owns verifier-modernization packaging, correction order, and final integration state. It does not redefine lane semantics owned by the architecture documents.

## Authority

- `docs/testing/architecture.md` — project-wide testing policy;
- `docs/testing/verify-target-architecture.md` — verifier impact/planning architecture;
- `docs/testing/verify-agent-output.md` — implemented agent-facing verifier output;
- `docs/testing/verify-change-classification.md` — repository metadata classification;
- `docs/testing/verify-unit-impact-correction.md` — closed unit-impact ownership amendment;
- `docs/testing/verify-app-e2e-discovery-correction.md` — **ready redesigned application-E2E path-ownership handoff**;
- `docs/testing/verify-release-impact-correction.md` — closed Pass E release-impact correction;
- `docs/testing/verify-modernization.md` — implementation/selection progress record;
- `scripts/lib/REVIEW.md` — active final PR-level findings;
- `.agents/skills/verification/SKILL.md`, `architect-handoff`, `implementation-preflight`, `test-first`, and `test-authoring` — workflow/proof rules.

Architecture/status/benchmark documents are architect-owned. Coding and test-author agents must not edit them unless explicitly assigned.

## Branch state

Finish branch:

```text
refactor/verify-modernization-finish
```

Last synchronized `develop` merge-base:

```text
13ae220900a2a724c867b01b5eb1f045c2a1d857
```

Re-check against current `develop` immediately before PR publication.

## Closed areas

- Pass A — bounded agent-facing output;
- Pass B — repository metadata classification;
- Pass C — unit impact, including exact Vitest direct-test discovery;
- Pass D — explicit mutation ownership;
- Pass E — closed release-impact consumer model;
- Pass F — accepted CI topology.

Do not reopen those areas without new repository evidence. Pass C is touched only mechanically where `unitRisk.ts` must consume the new shared root-app path predicate; its unit-impact semantics remain unchanged.

## Architecture redo — application-E2E root-spec ownership

Repeated correction drift triggered the root `AGENTS.md` stop rule. The next pass is no longer a local `e2eRisk.ts` patch.

The ready architecture in `docs/testing/verify-app-e2e-discovery-correction.md` introduces one narrow pure owner:

```text
scripts/lib/appE2EPaths.ts
```

It owns exactly:

```text
APP_E2E_SPEC_DIR
APP_E2E_TEST_MATCH
isRootAppE2ESpecPath()
```

Consumers:

```text
appE2EPaths.ts
├─ playwright.config.ts
├─ e2eRisk.ts
├─ e2eProjectApplicability.ts
└─ unitRisk.ts
```

This is not a generic discovery framework and does not own product scenario mappings.

Required final behavior:

```text
tests/e2e/appSmoke.spec.ts
→ app spec

tests/e2e/other/example.spec.ts
→ not app spec/support

tests/e2e/other/helper.ts
→ conservative app support

tests/e2e/example.test.ts
→ not app support
```

Scenario and standalone registry metadata must reject non-root app specs. `scripts/lib/appE2EPaths.ts` itself is full application-E2E infrastructure.

The real Playwright collector remains an independent oracle and must use collision-safe proof-owned temporary paths.

## Remaining source/comment cleanup

After the behavioral architecture correction is reviewed, clean only remaining stale source/test comments recorded in `scripts/lib/REVIEW.md`:

- old ordinary-source prefix wording in `unitRisk.test.ts`;
- release-spec wording in `e2eRisk.ts`;
- obsolete rolling-buffer/getFailureReason wording in `verify.ts`.

No executable behavior or assertions change solely for this cleanup.

## Remaining order

```text
1. implement shared application-E2E path owner + migrate all named consumers
2. fresh test-author proof + meaningful nested-spec RED + safe real-collector proof
3. architect re-review of complete application-E2E owner scope
4. final source/comment cleanup
5. architect refreshes affected status/selection documentation
6. full final semantic PR-level diff review
7. remove resolved REVIEW.md artifacts
8. compare branch with current develop and integrate if needed
9. publish PR to develop
10. apply release-intent/version label
11. inspect exact-head CI
12. if CI/autofix changes head, review the new exact head and its CI
13. record actual CI critical path / merge latency
14. merge-readiness verdict
```

## Proof discipline

For the architecture correction:

```text
ready architecture handoff
→ implementation-preflight
→ fresh test-author context
→ root-positive / nested-negative planner + metadata proof
→ meaningful RED for current nested-spec drift
→ collision-safe real Playwright collector/filter proof
→ separate implementation context
→ remove duplicate production predicates
→ focused GREEN
→ architect semantic review
```

The real collector proof must not use the shared predicate as its expected-value oracle.

## Final review boundary

Before PR publication, review the complete `develop...refactor/verify-modernization-finish` result for:

- ownership and dependency direction;
- single production source of truth for application-E2E root paths;
- physical proof discovery vs planner/registry/applicability inventories;
- fail-closed/status behavior;
- unit/release/mutation source of truth;
- removal of replaced inference/duplicate predicates;
- proof independence and mutable test-state isolation;
- verifier output boundedness/actionability;
- release-version separation;
- CI topology;
- selection/benchmark consistency.

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
