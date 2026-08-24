# Verify modernization finish plan

Status: **full PR semantic review is blocked by two implementation corrections; benchmark remains deferred**.

This document owns final integration order. Lane semantics remain in their architecture documents.

## Authority

- `docs/testing/architecture.md` — canonical testing policy;
- `docs/testing/verify-target-architecture.md` — target architecture and exit criteria;
- `docs/testing/verify-agent-output.md` — canonical output contract;
- `docs/testing/verify-output-correction.md` — closed M1/M2 correction and review record;
- `docs/testing/verify-unit-impact-correction.md` — accepted unit-impact architecture;
- `docs/testing/verify-app-e2e-discovery-correction.md` — closed application-E2E discovery architecture;
- `docs/testing/verify-release-impact-correction.md` — current Pass E correction architecture;
- `docs/testing/verify-mutation-impact-correction.md` — current mutation correction architecture;
- `docs/testing/verify-modernization.md` — implementation/review/benchmark status;
- `scripts/lib/REVIEW.md` — active semantic blockers;
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

## Areas that remain accepted

Keep these closed unless new repository evidence directly contradicts them:

- Pass A bounded-output architecture and M1/M2 correction;
- Pass B metadata classification;
- core Pass C unit dependency selection: real `vitest related`, file-as-data, bounded scan ownership, and status-aware fallback;
- root-only application-E2E discovery and real collector proof;
- the seven audited high-risk mutation target entries and one Stryker/verifier registry;
- Pass E release-spec inventory and existing exact release mappings;
- Pass E production-build mechanism ownership;
- Pass F CI topology and independent `release-version`;
- artifact 17-minute outer timeout and current 120-minute release-job envelope.

The mutation correction changes the shared Vitest test-path source of truth and mutation orchestration, not the accepted seven-target population or unit dependency-selection model.

## Semantic blocker B1 — release shared execution support

The real release execution roots import shared repository-owned command/runtime support, but `releaseRisk.ts` does not currently classify that support.

Audited population:

```text
scripts/lib/commandLock.ts
scripts/lib/localCommandGuard.ts
scripts/lib/processResult.ts
scripts/lib/runLocalCommand.ts
scripts/lib/signalForward.ts
```

Truthful consumers:

```text
artifact
build
managed-updates
release-smoke
```

Architecture is resolved in `verify-release-impact-correction.md`:

- fresh independent test-author audit/proof first;
- complete current support population, not example-by-example patching;
- implementation local to `releaseRisk.ts`;
- unrelated `scripts/lib/**` remains negative;
- no generic runtime dependency graph.

## Semantic blocker B2 — mutation changed identity and Vitest ownership

The mutation lane currently has two linked ownership defects.

### Changed identity

`getChangedFileProjection()` already preserves deleted path identity and both rename sides. `buildCommands()` then incorrectly passes only `existingChangedFiles` to `resolveMutationPlan()`.

Accepted fix:

```text
canonical changedFiles projection
→ resolveMutationPlan(changedFiles)
```

Do not add another Git/status parser or a status-bearing mutation API. Current mutation semantics require identity, and the canonical projection already preserves it.

Required integration proof includes deletion and rename-old identity for `stryker.config.mjs` through the real changed-path-context/buildCommands boundary.

### Vitest test ownership

Mutation registry validation uses a suffix-only `.test.ts` heuristic that disagrees with `vitest.config.ts`. `unitRisk.ts` already has a separate, more accurate duplicate.

Accepted fix:

```text
scripts/lib/vitestTestPaths.ts
→ one narrow Vitest test-path/discovery contract
   ├─ vitest.config.ts
   ├─ unitRisk.ts
   └─ mutationTargets.ts
```

The shared owner must derive the Vitest include globs and path predicate from one local rule definition so they cannot drift independently.

Ownership consequences:

```text
scripts/lib/vitestTestPaths.ts
→ full unit infrastructure

stryker.config.mjs
scripts/lib/mutationTargets.ts
vitest.config.ts
scripts/lib/vitestTestPaths.ts
→ mutation all registered targets after registry validation
```

Required proof includes:

- real Vitest-owned `.test.mjs` positive, e.g. `scripts/agentEnvironment.test.mjs`;
- `.test.ts` outside real Vitest discovery negative;
- `vitest.config.ts` and the new shared path owner trigger mutation full;
- the shared path owner triggers full unit;
- real seven-target mutation registry remains valid and unchanged.

Detailed architecture: `verify-mutation-impact-correction.md`.

## Correction sequencing

The two semantic blockers are independent planner owners and should not be mixed into one coding implementation pass.

Recommended correction order:

```text
1. mutation correction
   a. fresh independent test-author pass
   b. separate implementation pass
   c. architect full mutation-boundary review

2. release shared-support correction
   a. fresh independent test-author bounded audit/proof
   b. separate releaseRisk implementation pass
   c. architect complete Pass E review

3. new complete PR-level semantic review from scratch
```

Mutation goes first because the external review identified a defect in the planner/source-of-truth layer and its correction also removes duplicated Vitest discovery ownership used by unit planning. Release correction remains fully specified and independent.

If either owner-level review finds a broader ownership problem, stop and return to architecture rather than starting the next pass.

## Workflow guards already in place

`implementation-preflight` now requires impact/selection work to record ownership mechanisms, status transitions, bounded populations, independent oracle, and real delegated-resolver semantics where applicable.

`verification/SKILL.md` additionally requires release-impact work to re-audit the complete bounded shared release-execution support closure when release execution roots change repository-relative runtime imports.

No further generic registry or dependency-graph infrastructure is justified by the current findings.

## Mandatory benchmark — deferred

The target architecture still requires:

```text
1. critical-path / merge latency
2. aggregate expensive compute
```

Do not perform the benchmark while either semantic blocker is open. Benchmark only after both corrections and a new complete PR semantic review are clean.

The final benchmark record must include source run/change class, both metrics, interpretation, and explicit stop/reopen decision. Permanent benchmark infrastructure remains out of scope unless measurement demonstrates a separate need.

## CI interpretation

CI on `32e33108ea91eb17c4d6960e97ede1c32e84dae7` is useful historical execution evidence but not final merge evidence. The current PR head has moved due architect-owned review/documentation commits, and semantic blockers are open.

After both implementations and the clean semantic re-review, obtain stable exact-head CI for the accepted implementation. Benchmark/completion documentation will move the head again and therefore requires final exact-head CI afterward.

## Remaining order

```text
1. fresh independent test-author pass for mutation correction
2. separate mutation implementation pass
3. architect review the complete mutation boundary and close B2 only if clean
4. fresh independent test-author pass for release shared-execution support
5. separate releaseRisk implementation pass
6. architect complete Pass E review and close B1 only if clean
7. perform a new complete PR-level semantic review from scratch
8. close or route any newly discovered findings
9. obtain stable exact-head CI for the semantically accepted implementation
10. perform and record the mandatory representative benchmark:
    - critical path / merge latency
    - aggregate expensive compute
11. record stop vs separate-follow-up decision
12. remove docs/testing/REVIEW.md only when the benchmark blocker is genuinely closed
13. update final completion docs and PR metadata
14. require CI on the resulting final documentation head
15. re-check current develop ancestry and exact PR head
16. re-check unresolved review threads and all required CI lanes
17. give merge-readiness verdict
18. squash merge only after explicit user instruction and only when semantic review, benchmark, and exact-head CI are all satisfied
```

## Stop rule

Stop verifier modernization only when:

- mutation ownership preserves canonical changed identity and uses the real shared Vitest test-path contract;
- release-impact ownership is closed over all confirmed current production-build, release-spec, release-runtime, and shared release-execution mechanisms;
- output findings remain closed;
- a complete PR semantic review has no unresolved findings;
- both benchmark metrics are recorded and do not justify more infrastructure;
- final exact-head CI is healthy.

Further sharding, generic dependency graphs/registries, task runners, retries, or speculative optimization require a separate measured need and architecture decision.
