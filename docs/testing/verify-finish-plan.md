# Verify modernization finish plan

Status: **PR #216 has closed Pass E and the verifier-output correction; full PR semantic review, the mandatory final benchmark, and final exact-head CI remain**.

This document owns final integration order. Lane semantics remain in their architecture documents.

## Authority

- `docs/testing/architecture.md` — canonical testing policy;
- `docs/testing/verify-target-architecture.md` — target architecture and exit criteria;
- `docs/testing/verify-agent-output.md` — canonical output contract;
- `docs/testing/verify-output-correction.md` — closed M1/M2 correction and review record;
- `docs/testing/verify-unit-impact-correction.md` — closed unit-impact correction;
- `docs/testing/verify-app-e2e-discovery-correction.md` — closed application-E2E discovery architecture;
- `docs/testing/verify-release-impact-correction.md` — closed Pass E architecture and review record;
- `docs/testing/verify-modernization.md` — implementation/benchmark status;
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

- Pass A bounded-output architecture and its final M1/M2 presentation correction;
- Pass B metadata classification;
- Pass C unit impact / real `vitest related` / file-as-data / bounded scan ownership;
- root-only application-E2E discovery and real collector proof;
- Pass D explicit mutation registry shared with Stryker;
- Pass E production-build mechanism ownership and retained release-spec execution inventory;
- Pass F CI topology and independent `release-version`;
- artifact 17-minute outer timeout.

## Closed output correction

The final two output findings are implemented and architect-reviewed.

### M1 — progress indexing

Final rule:

```text
resolved runnable count > 1
→ [verify i/n]

resolved runnable count <= 1
→ [verify]
```

The rule is based on the resolved runnable population and does not special-case `release-impact`. Skipped checks are not counted.

### M2 — warning-detail ownership

Normal mode keeps the completion `passed with warnings` state but has one diagnostic owner in the compact final summary:

```text
<label>: passed with warnings
warnings: <bounded summary>
details: <exact per-check log>
rerun: <focused verify command>
```

Immediate warning detail is verbose-only. Warning detection and pass/fail semantics are unchanged.

Independent proof uses the real verify CLI with temporary `PATH` shims replacing only child `node`/`pnpm` processes. It covers a four-runnable release-impact invocation, a one-runnable case, normal warning non-duplication and verbose warning diagnostics without exporting private orchestration or running expensive child workloads.

No blocker, major issue, minor issue or accepted risk remains in the output owner. `scripts/REVIEW.md` is therefore removed.

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

Production Vite env exact paths remain focused when tracked/changed. The implementation remains local, retains the release-spec execution inventory, and introduces no generic graph/registry, loader-extension mirror, broad config fallback, timeout change, or CI topology change.

## Remaining blocker — mandatory benchmark

The target architecture requires a representative post-integration benchmark with both:

```text
1. critical-path / merge latency
2. aggregate expensive compute
```

Perform it only after one complete PR-level semantic review of the full resulting PR is clean. Use bounded real CI/run evidence; do not build permanent benchmark infrastructure unless measurements justify a separate architecture decision.

The final record must include source run/change class, both metrics, interpretation, and explicit stop/reopen decision.

## CI interpretation

Focused implementation feedback is useful local evidence, but GitHub CI on the exact PR head is the authoritative automatic gate. Architect-owned review/documentation updates change the head, so earlier runs cannot be final merge evidence.

Obtain a stable exact-head CI run after the complete semantic review and corrected implementation. Benchmark evidence may use appropriate real bounded runs. Final documentation/PR metadata updates then require CI again on the resulting exact head.

## Remaining order

```text
1. perform one complete PR-level semantic review from scratch against the full resulting PR
2. close or route any newly discovered findings
3. obtain a stable exact-head CI run for the semantically accepted implementation
4. perform and record the mandatory representative benchmark:
   - critical path / merge latency
   - aggregate expensive compute
5. record stop vs separate-follow-up decision in architect-owned docs
6. remove docs/testing/REVIEW.md once the benchmark blocker is genuinely closed
7. update final completion docs and PR metadata
8. require CI on the resulting final documentation head
9. re-check current develop ancestry and exact PR head
10. re-check unresolved review threads and all required CI lanes
11. give merge-readiness verdict
12. squash merge only after explicit user instruction and only when semantic review, benchmark and exact-head CI are all satisfied
```

## Stop rule

Stop verifier modernization only when:

- release-impact ownership remains closed over all confirmed current production-build mechanisms and release execution populations;
- output findings remain closed;
- full PR semantic review has no unresolved findings;
- both benchmark metrics are recorded and do not justify more infrastructure;
- final exact-head CI is healthy.

Further sharding, generic dependency graphs/registries, task runners, retries or speculative optimization require a separate measured need and architecture decision.
