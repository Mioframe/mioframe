# Verify modernization finish plan

Status: **PR #216 has closed Pass E; the verifier-output correction is agent-ready; the mandatory final benchmark remains after semantic closure**.

This document owns final integration order. Lane semantics remain in their architecture documents.

## Authority

- `docs/testing/architecture.md` — canonical testing policy;
- `docs/testing/verify-target-architecture.md` — target architecture and exit criteria;
- `docs/testing/verify-agent-output.md` — canonical output contract;
- `docs/testing/verify-output-correction.md` — ready M1/M2 correction handoff;
- `docs/testing/verify-unit-impact-correction.md` — closed unit-impact correction;
- `docs/testing/verify-app-e2e-discovery-correction.md` — closed application-E2E discovery architecture;
- `docs/testing/verify-release-impact-correction.md` — closed Pass E architecture and review record;
- `docs/testing/verify-modernization.md` — implementation/benchmark status;
- `scripts/REVIEW.md` — two active output-contract minors and selected correction handoff;
- `docs/testing/REVIEW.md` — mandatory benchmark blocker.

Documentation, review state, PR metadata, CI interpretation and merge readiness are architect-owned.

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

- Pass A bounded-output architecture, except the two selected presentation corrections below;
- Pass B metadata classification;
- Pass C unit impact / real `vitest related` / file-as-data / bounded scan ownership;
- root-only application-E2E discovery and real collector proof;
- Pass D explicit mutation registry shared with Stryker;
- Pass E production-build mechanism ownership and retained release-spec execution inventory;
- Pass F CI topology and independent `release-version`;
- artifact 17-minute outer timeout.

## Closed Pass E — release impact

The production-build correction is implemented and architect-reviewed.

Accepted model:

```text
current positively-known production-build input
→ focused artifact + build + managed-updates + release-smoke

public/**
→ same focused consumers

non-current path inside a confirmed Browserslist/PostCSS/PWA-assets/tsconfig family
→ full six until audited

known non-production member
→ no release ownership from that family

pnpm-workspace.yaml
→ full six
```

Production Vite env exact paths remain focused when tracked/changed.

Implementation stayed local to:

```text
scripts/lib/releaseRisk.ts
scripts/lib/releaseRisk.test.ts
```

The fresh test-author proof covered the accepted mechanism matrix before production implementation. Architect re-review then independently rechecked the resulting planner, proof oracle, current source-side build inputs, retained `releaseSpecInventory` ownership and real managed-update/release runners.

No blocker or major issue remains in Pass E. The correction introduced no generic registry/module, loader-extension mirror, broad `config/**`, generic `*.config.*`, all-root fallback, release-spec redesign, timeout change or CI topology change.

## Agent-ready output correction

The two remaining output findings are fully resolved architecturally in `verify-output-correction.md`; no further design choice is delegated to the coding agent.

### M1 — release-impact progress indexing

Required rule:

```text
resolved runnable count > 1
→ [verify i/n]

resolved runnable count <= 1
→ [verify]
```

Progress mode depends on the resolved runnable population, not on whether `--only` is present. Skipped checks do not count. Do not special-case `release-impact` when the runnable-count rule is sufficient.

### M2 — warning-detail ownership

Required normal-mode ownership:

```text
completion line
→ may report passed with warnings

compact final warning block
→ owns bounded warning summary exactly once
→ exact per-check .verify/logs/<label>.log pointer
→ canonical focused rerun
```

Immediate warning summary/log diagnostics in `runCommand()` are verbose-only. Warning detection and pass/fail semantics do not change.

### Proof/implementation order

Use a fresh independent test-author context first. Primary proof is deterministic real-CLI subprocess behavior in `scripts/verify.test.ts`, with temporary `PATH` shims replacing only child `node`/`pnpm` processes. This proves the actual `selectOnlyCommands()` → `main()` → `runCommand()` → summary path without exporting private orchestration or running expensive real release/lint work.

Then use a separate implementation context for `scripts/verify.ts` only, treating accepted proof assertions as read-only.

The correction must not touch release planning/execution, command selection/order, heartbeat cadence, timeout/lock/fail-fast behavior, warning detection, CI workflows, benchmark logic, or another closed verifier pass.

## Remaining blocker — mandatory benchmark

The target architecture requires a representative post-integration benchmark with both:

```text
1. critical-path / merge latency
2. aggregate expensive compute
```

Benchmark only after the output correction and full semantic review are clean. Use bounded real CI evidence; do not build permanent benchmark infrastructure unless the measurements justify a separate architecture decision.

The final record must include source run/change class, both metrics, interpretation, and explicit stop/reopen decision.

## Current CI interpretation

CI from earlier implementation/documentation heads is useful intermediate evidence only. Architect-owned documentation changes and the pending M1/M2 implementation move the branch head again. Final merge evidence must come from a later exact-head run after all semantic corrections and final documentation are complete.

## Remaining order

```text
1. fresh independent M1/M2 test-author pass in scripts/verify.test.ts
2. separate M1/M2 implementation pass in scripts/verify.ts against accepted proof
3. architect re-review the complete verifier output contract and close scripts/REVIEW.md when clean
4. perform one complete PR-level semantic review from scratch
5. remove any remaining resolved REVIEW.md artifacts
6. obtain a stable exact-head CI run for the corrected implementation
7. perform and record the mandatory representative benchmark:
   - critical path / merge latency
   - aggregate expensive compute
8. record stop vs separate-follow-up decision in architect-owned docs
9. require CI on the resulting final documentation head
10. re-check current develop ancestry and exact PR head
11. re-check unresolved review threads and all required CI lanes
12. give merge-readiness verdict
13. squash merge only after explicit user instruction and only when semantic review, benchmark and exact-head CI are all satisfied
```

## Stop rule

Stop verifier modernization only when:

- release-impact ownership remains closed over all confirmed current production-build mechanisms and release execution populations;
- output findings are closed;
- full PR semantic review has no unresolved findings;
- both benchmark metrics are recorded and do not justify more infrastructure;
- final exact-head CI is healthy.

Further sharding, generic dependency graphs/registries, task runners, retries or speculative optimization require a separate measured need and architecture decision.
