# Verify modernization finish plan

Status: **PR #216 is blocked by reopened Pass E production-build input ownership and the mandatory final benchmark; two verifier-output minor findings also remain**.

This document owns final integration order. Lane semantics remain in their architecture documents.

## Authority

- `docs/testing/architecture.md` — canonical testing policy;
- `docs/testing/verify-target-architecture.md` — target architecture and exit criteria;
- `docs/testing/verify-agent-output.md` — output contract;
- `docs/testing/verify-unit-impact-correction.md` — closed unit-impact correction;
- `docs/testing/verify-app-e2e-discovery-correction.md` — closed application-E2E discovery architecture;
- `docs/testing/verify-release-impact-correction.md` — current Pass E architecture handoff;
- `docs/testing/verify-modernization.md` — implementation/benchmark status;
- `scripts/lib/REVIEW.md` — active Pass E production-build ownership finding;
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
- Pass F CI topology and independent `release-version`;
- artifact 17-minute outer timeout;
- release-spec execution inventory, exhaustive release-spec validation and unknown release-check validation.

## Blocker 1 — Pass E production-build input ownership

The latest full review found a repeated ownership-completeness failure. The release-spec execution correction is sound, but production-build ownership still covered only static Vite/config imports.

The real production `vite build` also consumes repository inputs through:

```text
tool-discovered root configuration
TypeScript/build metadata
public artifact/file inputs
dependency-install control
```

Current representative missed inputs include:

```text
.browserslistrc
postcss.config.js
pwa-assets.config.ts
public/favicon.svg
```

The architecture has therefore been redone at the mechanism boundary in `verify-release-impact-correction.md`.

The resolved model keeps ownership local to `scripts/lib/releaseRisk.ts` and covers:

- existing static Vite support inputs;
- complete current Browserslist/PostCSS/PWA-assets config filename families;
- production Vite env filenames when tracked;
- current production TypeScript config chain, with unknown root `tsconfig*.json` fail-closed;
- the complete `public/**` artifact population;
- current `pnpm-workspace.yaml` install-control input.

Do not implement this as four exact mappings, a broad `config/**` fallback, an all-root fallback, or a generic registry/graph.

## Blocker 2 — mandatory benchmark

The target architecture requires a representative post-integration benchmark with both:

```text
1. critical-path / merge latency
2. aggregate expensive compute
```

Benchmark only after Pass E, the two output minors and full semantic review are clean. Use bounded real CI evidence; do not build permanent benchmark infrastructure unless the measurements justify a separate architecture decision.

The final record must include source run/change class, both metrics, interpretation, and explicit stop/reopen decision.

## Output-contract minors

Tracked separately in `scripts/REVIEW.md`.

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

## Remaining order

```text
1. implement the ready Pass E production-build mechanism correction with fresh independent proof
2. architect review the complete Pass E boundary, including retained release-spec inventory
3. correct the two verifier-output minors with focused proof
4. architect review the output contract
5. perform one complete PR-level semantic review
6. remove resolved REVIEW.md artifacts
7. obtain a stable exact-head CI run for the corrected implementation
8. perform and record the mandatory representative benchmark:
   - critical path / merge latency
   - aggregate expensive compute
9. record stop vs separate-follow-up decision in architect-owned docs
10. require CI on the resulting final documentation head
11. re-check current develop ancestry and exact PR head
12. give merge-readiness verdict
13. squash merge only when semantic review, benchmark and exact-head CI are all satisfied
```

## Stop rule

Stop verifier modernization only when:

- release-impact ownership is closed over all confirmed current production-build mechanisms and release execution populations;
- output findings are closed;
- full PR semantic review has no unresolved findings;
- both benchmark metrics are recorded and do not justify more infrastructure;
- final exact-head CI is healthy.

Further sharding, generic dependency graphs/registries, task runners, retries or speculative optimization require a separate measured need and architecture decision.
