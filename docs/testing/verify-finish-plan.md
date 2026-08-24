# Verify modernization finish plan

Status: **PR #216 has closed Pass E; two verifier-output minor findings and the mandatory final benchmark remain**.

This document owns final integration order. Lane semantics remain in their architecture documents.

## Authority

- `docs/testing/architecture.md` — canonical testing policy;
- `docs/testing/verify-target-architecture.md` — target architecture and exit criteria;
- `docs/testing/verify-agent-output.md` — output contract;
- `docs/testing/verify-unit-impact-correction.md` — closed unit-impact correction;
- `docs/testing/verify-app-e2e-discovery-correction.md` — closed application-E2E discovery architecture;
- `docs/testing/verify-release-impact-correction.md` — closed Pass E architecture and review record;
- `docs/testing/verify-modernization.md` — implementation/benchmark status;
- `scripts/REVIEW.md` — two active output-contract minors;
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

- Pass A bounded-output architecture, except the two presentation minors below;
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

## Remaining blocker — mandatory benchmark

The target architecture requires a representative post-integration benchmark with both:

```text
1. critical-path / merge latency
2. aggregate expensive compute
```

Benchmark only after the two output minors and full semantic review are clean. Use bounded real CI evidence; do not build permanent benchmark infrastructure unless the measurements justify a separate architecture decision.

The final record must include source run/change class, both metrics, interpretation, and explicit stop/reopen decision.

## Output-contract minors

Tracked in `scripts/REVIEW.md`.

### M1 — release-impact progress indexing

```text
resolved runnable count > 1
→ [verify i/n]

resolved runnable count == 1
→ [verify]
```

Progress mode must depend on resolved runnable population, not merely whether `--only` is present.

### M2 — warning duplication

Normal mode must present a passed-with-warnings state once with actionable log/rerun information. Verbose mode may contain additional immediate diagnostics.

Neither minor changes proof selection.

## Current CI interpretation

CI on the Pass E implementation head had already passed format, oxlint, eslint, type-check and unit-test steps when Pass E semantic review closed. Release-impact, mutation and browser jobs were still running.

That run is useful intermediate evidence only. Architect-owned documentation changes made while closing Pass E moved the branch head, and the two output corrections will move it again. Final merge evidence must therefore come from a later exact-head run after all semantic corrections and final documentation are complete.

## Remaining order

```text
1. correct the two verifier-output minors with focused proof
2. architect review the output contract
3. perform one complete PR-level semantic review from scratch
4. remove resolved REVIEW.md artifacts
5. obtain a stable exact-head CI run for the corrected implementation
6. perform and record the mandatory representative benchmark:
   - critical path / merge latency
   - aggregate expensive compute
7. record stop vs separate-follow-up decision in architect-owned docs
8. require CI on the resulting final documentation head
9. re-check current develop ancestry and exact PR head
10. re-check unresolved review threads and all required CI lanes
11. give merge-readiness verdict
12. squash merge only after explicit user instruction and only when semantic review, benchmark and exact-head CI are all satisfied
```

## Stop rule

Stop verifier modernization only when:

- release-impact ownership remains closed over all confirmed current production-build mechanisms and release execution populations;
- output findings are closed;
- full PR semantic review has no unresolved findings;
- both benchmark metrics are recorded and do not justify more infrastructure;
- final exact-head CI is healthy.

Further sharding, generic dependency graphs/registries, task runners, retries or speculative optimization require a separate measured need and architecture decision.
