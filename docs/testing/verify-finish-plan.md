# Verify modernization finish plan

Status: **full PR semantic review completed but blocked; Pass E shared release-execution support is architecturally resolved and pending implementation; benchmark remains deferred**.

This document owns final integration order. Lane semantics remain in their architecture documents.

## Authority

- `docs/testing/architecture.md` — canonical testing policy;
- `docs/testing/verify-target-architecture.md` — target architecture and exit criteria;
- `docs/testing/verify-agent-output.md` — canonical output contract;
- `docs/testing/verify-output-correction.md` — closed M1/M2 correction and review record;
- `docs/testing/verify-unit-impact-correction.md` — closed unit-impact correction;
- `docs/testing/verify-app-e2e-discovery-correction.md` — closed application-E2E discovery architecture;
- `docs/testing/verify-release-impact-correction.md` — current Pass E architecture including the reopened shared execution-support boundary;
- `docs/testing/verify-modernization.md` — implementation/review/benchmark status;
- `scripts/lib/REVIEW.md` — active semantic blocker;
- `docs/testing/REVIEW.md` — mandatory benchmark blocker.

Documentation, review state, PR metadata, CI interpretation, benchmark record, and merge readiness are architect-owned.

## Branch / PR

```text
branch: refactor/verify-modernization-finish
PR: #216
base: develop
release intent: version:patch
```

Any architect-owned documentation/review commit changes the authoritative head. Final CI evidence must match the resulting exact head.

## Closed areas

Keep closed unless new repository evidence directly contradicts them:

- Pass A bounded-output architecture and M1/M2 correction;
- Pass B metadata classification;
- Pass C unit impact / real `vitest related` / file-as-data / bounded scan ownership;
- root-only application-E2E discovery and real collector proof;
- Pass D explicit mutation registry shared with Stryker;
- Pass E release-spec inventory and existing exact release mappings;
- Pass E production-build mechanism ownership;
- Pass F CI topology and independent `release-version`;
- artifact 17-minute outer timeout and current 120-minute release-job envelope.

## Full PR semantic review

A complete review from scratch was performed after the previously known implementation corrections closed.

No new blocker/major/minor findings were found in:

- repository metadata classification;
- unit selection and status-aware fallback;
- application-E2E discovery/scenario ownership;
- Storybook behavior/visual ownership;
- mutation ownership/Stryker agreement;
- verifier invocation, bounded output, warning/progress behavior, locks and timeouts;
- release-spec execution inventory;
- production-build input ownership;
- CI lane placement/aggregation.

The review found one semantic blocker in release-impact ownership and therefore ended `blocked`, not `ready`. After that blocker is corrected, perform a new complete PR-level semantic review rather than treating this blocked review as final acceptance.

## Reopened Pass E boundary

### Problem

The real release execution roots import shared repository-owned command/runtime support, but `releaseRisk.ts` does not currently classify that support. Those changes can therefore resolve `skip` while affecting real release checks.

Current audited support population:

```text
scripts/lib/commandLock.ts
scripts/lib/localCommandGuard.ts
scripts/lib/processResult.ts
scripts/lib/runLocalCommand.ts
scripts/lib/signalForward.ts
```

Truthful current consumers:

```text
artifact
build
managed-updates
release-smoke
```

The detailed root/import audit and architecture are in `verify-release-impact-correction.md`; the active finding is `scripts/lib/REVIEW.md` B1.

### Architecture decision

Keep the mechanism explicit and local to `scripts/lib/releaseRisk.ts`.

Do **not**:

- add only the newly noticed paths without proving the current support population is exhausted;
- broaden release ownership to `scripts/lib/**`;
- add a runtime import graph or generic registry;
- change release execution/grouping, timeouts, artifact reuse, CI topology, or `release-version` policy.

Before implementation, a fresh independent test-author context must perform the bounded transitive runtime-import audit from the accepted release execution roots and author meaningful RED proof in `scripts/lib/releaseRisk.test.ts`.

Required proof includes:

```text
runLocalCommand.ts
→ focused artifact + build + managed-updates + release-smoke

commandLock.ts OR signalForward.ts
→ same focused four
```

Then prove the complete current five-file population and at least one unrelated nearby `scripts/lib/**` negative.

The implementation pass is separate and changes only the planner owner unless new repository evidence invalidates the accepted architecture.

## Workflow improvement

`.agents/skills/verification/SKILL.md` now requires release-impact work to re-audit the complete bounded shared release-execution support closure whenever a release execution root changes repository-relative runtime imports. This converts the repeated omission into a durable workflow guard without adding production dependency-graph infrastructure.

## Mandatory benchmark — deferred

The target architecture still requires:

```text
1. critical-path / merge latency
2. aggregate expensive compute
```

Do not perform the benchmark while the semantic blocker is open. Benchmark only after the correction and a new complete PR semantic review are clean.

The final benchmark record must include source run/change class, both metrics, interpretation, and explicit stop/reopen decision. Permanent benchmark infrastructure remains out of scope unless measurement demonstrates a separate need.

## CI interpretation

CI runs on heads before the reopened correction are intermediate evidence only. Do not spend time treating the current documentation head as a merge candidate while B1 is open.

After implementation and clean semantic re-review, obtain stable exact-head CI for the accepted implementation. Final benchmark/completion documentation will move the head again and require final exact-head CI afterward.

## Remaining order

```text
1. fresh independent test-author pass for shared release-execution support in scripts/lib/releaseRisk.test.ts
2. separate implementation pass in scripts/lib/releaseRisk.ts against accepted proof
3. architect complete Pass E re-review and close scripts/lib/REVIEW.md only if the full support boundary is clean
4. perform a new complete PR-level semantic review from scratch
5. close or route any newly discovered findings
6. obtain stable exact-head CI for the semantically accepted implementation
7. perform and record the mandatory representative benchmark:
   - critical path / merge latency
   - aggregate expensive compute
8. record stop vs separate-follow-up decision
9. remove docs/testing/REVIEW.md only when the benchmark blocker is genuinely closed
10. update final completion docs and PR metadata
11. require CI on the resulting final documentation head
12. re-check current develop ancestry and exact PR head
13. re-check unresolved review threads and all required CI lanes
14. give merge-readiness verdict
15. squash merge only after explicit user instruction and only when semantic review, benchmark, and exact-head CI are all satisfied
```

## Stop rule

Stop verifier modernization only when:

- release-impact ownership is closed over all confirmed current production-build, release-spec, release-runtime, and shared release-execution mechanisms;
- output findings remain closed;
- a complete PR semantic review has no unresolved findings;
- both benchmark metrics are recorded and do not justify more infrastructure;
- final exact-head CI is healthy.

Further sharding, generic dependency graphs/registries, task runners, retries, or speculative optimization require a separate measured need and architecture decision.
