# Verify modernization finish plan

Status: **PR #216 is blocked by release-impact ownership completeness and the required final benchmark; two verifier-output minor findings also remain**.

This document owns verifier-modernization packaging and final integration order. It does not redefine lane semantics owned by the architecture documents.

## Authority

- `docs/testing/architecture.md` — canonical testing policy;
- `docs/testing/verify-target-architecture.md` — verifier target architecture and exit criteria;
- `docs/testing/verify-agent-output.md` — agent-facing output contract;
- `docs/testing/verify-change-classification.md` — repository metadata classification;
- `docs/testing/verify-unit-impact-correction.md` — closed unit-impact correction;
- `docs/testing/verify-app-e2e-discovery-correction.md` — closed application-E2E discovery architecture;
- `docs/testing/verify-release-impact-correction.md` — reopened/resolved architecture for the final release-impact ownership correction;
- `docs/testing/verify-modernization.md` — implementation/selection/benchmark status;
- `scripts/lib/REVIEW.md` — active release-impact blocker;
- `docs/testing/REVIEW.md` — active benchmark completion blocker;
- `scripts/REVIEW.md` — active verifier-output minor findings.

Architecture/status/benchmark documents are architect-owned. Coding/test-author contexts must not edit them unless explicitly assigned.

## Branch / PR

```text
branch: refactor/verify-modernization-finish
PR: #216
base: develop
release intent: version:patch
```

Any review, architecture, correction, documentation, or autofix commit changes the authoritative head. Require CI on the resulting exact head only.

## Closed areas

The following remain closed unless new repository evidence directly contradicts them:

- Pass A core bounded-output architecture;
- Pass B repository metadata classification;
- Pass C unit impact, exact Vitest discovery, real `vitest related`, file-as-data and bounded-scan ownership;
- single-owner application-E2E path architecture and independent real collector proof;
- Pass D explicit mutation registry shared with Stryker;
- Pass F parallel CI topology and independent `release-version` gate;
- artifact outer timeout correction (`artifact` now uses the shared derived Playwright outer deadline).

Do not reopen these areas to solve the remaining findings.

## Blocker 1 — release-impact ownership completeness

Pass E is reopened at the ownership boundary, not at CI placement or timeout behavior.

Confirmed gaps:

```text
config/plugins/pwa.ts
→ real production Vite/PWA build input
→ current releaseRisk.ts can skip
```

and the release Playwright spec population is not tied exhaustively to actual execution:

```text
new release spec
→ can be unowned / skipped

new managedUpdates*.spec.ts
→ can be claimed by filename
→ managedUpdatesProof.mjs may not execute it
```

The exact mapping validator also does not reject unknown release-check values.

The resolved correction architecture is in `verify-release-impact-correction.md`:

- one narrow `scripts/release/releaseSpecInventory.ts` shared by actual release runners and `releaseRisk.ts`;
- exhaustive bounded validation of `tests/e2e/release/**/*.spec.ts` against that execution inventory;
- removal of filename-based managed-update spec ownership;
- bounded production Vite configuration ownership for the actual current build-config surface (`config/plugins/**` plus its named support inputs), without broad `config/**` classification;
- runtime validation of release-check identity.

Do not implement this as another example-list patch.

## Blocker 2 — required benchmark

`verify-target-architecture.md` requires a representative post-integration benchmark and makes it part of the modernization exit criterion.

Required recorded metrics:

```text
1. critical-path / merge latency
2. aggregate expensive compute
```

The current semantic selection matrix is not a substitute for this measurement.

Benchmark only after the release-impact semantic correction and output minors are closed. Use bounded real CI/run evidence; do not build permanent benchmark infrastructure unless measurements separately justify it.

The resulting documentation must record:

- exact source run(s)/change class used;
- critical-path measurement;
- aggregate expensive-compute measurement;
- interpretation against the target architecture;
- explicit stop/reopen decision.

## Minor findings — agent-facing output

Two behavior-level output findings remain in `scripts/REVIEW.md`.

### M1 — release-impact progress indexing

`--only release-impact` is a multi-check grouping when more than one release check is runnable, but current progress suppresses index/total for every non-null `--only` label.

Final rule:

```text
resolved runnable count > 1
→ indexed progress [verify i/n]

resolved runnable count == 1
→ focused [verify]
```

The decision must depend on the resolved runnable population, not merely `onlyLabel !== null`.

### M2 — warning duplication

A passed-with-warnings command currently emits warning detail immediately and the compact final summary emits the same warning state again.

Final rule:

- normal mode: one compact warning presentation with actionable log/rerun pointer;
- verbose mode: additional immediate diagnostic detail is allowed.

Do not change proof selection or warning/failure semantics.

## Remaining order

```text
1. implement the resolved release-impact ownership architecture with fresh independent proof
2. architect review the complete release-impact population/execution boundary
3. correct the two verifier-output minor findings with focused proof
4. architect re-review the affected output contract
5. run one complete PR-level semantic review
6. remove resolved REVIEW.md artifacts
7. require a stable exact-head CI run
8. perform and record the mandatory representative benchmark:
   - critical path / merge latency
   - aggregate expensive compute
9. decide stop vs separate measured follow-up
10. re-check current develop ancestry and exact PR head
11. give merge-readiness verdict
12. squash merge only when review, benchmark, and exact-head gates are all satisfied
```

If benchmark evidence requires documentation updates, those updates create a new exact head. The final merge gate must therefore include CI after the final benchmark/status documentation commit as well.

## Version policy

PR #216 remains an ordinary internal tooling/refactor PR into `develop`:

```text
version:patch
```

Same-repository CI owns exact PATCH materialization.

## Stop rule

Stop verifier modernization only when all of the following are true:

- release-impact ownership is closed over the required current populations;
- output-contract findings are closed;
- full PR semantic review has no unresolved findings;
- the representative benchmark records both required metrics and does not justify more verifier infrastructure;
- the final exact-head GitHub CI is healthy.

Further sharding, cross-job artifacts, dependency graphs, generic registries, task runners, retries, worker changes, or speculative optimization require a separate measured need and architecture decision.
