# Database virtualization performance attribution preflight

Status: **ready**.

Authoring source: `docs/database-virtualization-performance-attribution-handoff.md` plus `src/entities/databaseData/REVIEW.md`, `docs/database-virtualization-profiling.md`, and `docs/database-virtualization-production-results.md`.

## Goal and non-goals

Produce reproducible same-environment attribution for the fresh S0/G1 slowdown. Do not change production code in this pass.

## Expected tracked changes

None.

Temporary diagnostic files/worktrees may be created locally and must be removed before handoff. Do not edit durable tests, ownership metadata, docs, review files, or PR metadata.

## Source of truth

- historical performance ref: `68a71e89d03713452946819cb52ba80a64157424`;
- candidate ref: current branch HEAD resolved at measurement start; record it exactly;
- dataset/protocol: `docs/database-virtualization-profiling.md` and retained method in `docs/database-virtualization-production-results.md`;
- active blocker: `src/entities/databaseData/REVIEW.md`.

## Pass order

### Pass 1 — establish identical runner and environment

1. Record candidate HEAD, Node/pnpm versions, Chromium version, platform, CPU/memory, viewport, worker count, retries, build/preview mode.
2. Recreate one temporary measurement spec/runner from the documented production protocol.
3. Use the exact same runner bytes/logic for historical and current refs. Record a hash or otherwise prove the runner did not differ between sides.
4. Use the same deterministic fixture seed `pr-217-production-v1`, all-string rectangular data, sparse persisted `Filter`/`Label` values, short view selecting ~20 rows, and the same real Full-view selection action.
5. Timing starts around the real switch only. Setup/import/build time is outside `switchToUsable`.

Temporary detached worktrees outside the active branch are allowed. Do not checkout/reset/rebase the active PR branch. Remove detached worktrees after diagnosis.

### Pass 2 — same-environment A/B

Collect, in one host/session where practical:

- historical S0 ×3;
- current S0 ×3;
- historical G1 ×3;
- current G1 ×3.

Prefer alternating pairs per case (`historical`, `current`) for each repetition. Use fresh browser contexts for every sample and do not run the two previews concurrently if that can introduce CPU contention.

For every sample record:

- MessageChannel yield;
- first requestAnimationFrame;
- switch-to-usable;
- Long Task count/max/total;
- mounted data rows / property headers / expensive cells;
- full logical metadata reached;
- deep final row/property/value sentinels.

### Pass 3 — classify A/B

Classify only from the paired evidence:

- `measurement mismatch`: historical ref is also far outside its retained envelope or develops repeated >100 ms Long Tasks under the new runner/environment;
- `production regression confirmed`: historical ref remains close to the retained fast/no-Long-Task behavior and current remains materially slower with repeated large Long Tasks;
- `ambiguous`: neither conclusion is stable enough across samples.

If `measurement mismatch` or `ambiguous`, stop. Report evidence and do not inspect/change production as though a regression were proven.

### Pass 4 — localize first production regression

Run only when Pass 3 is `production regression confirmed`.

1. Use local Git history/diffs from `68a71e89...` to candidate HEAD to enumerate **production** commits/files on the measured Database rendering/view-switch path. Ignore docs/tests/review-only commits.
2. Preserve the accepted architecture while diagnosing. Do not infer that geometry is guilty solely because it changed.
3. Use S0 for narrowing because the fresh regression already reproduces on S0.
4. Probe selected historical production states with identical runner/environment:
   - normally 2 S0 samples per state;
   - add a third only when classification is ambiguous;
   - prefer binary/ordered narrowing over measuring every commit.
5. Identify the first bad production state and the immediately previous good production state.
6. Inspect only that production delta and name the narrowest evidence-backed owner/root-cause candidate.
7. Optionally run one paired G1 check on the good/bad boundary only if needed to confirm that the same regression applies to the large case.
8. Stop before any production fix.

## TEST IMPACT

- Contract/scenario: performance attribution for Database short-view -> Full-view switch.
  - Primary proof owner: task-specific temporary production measurement.
  - Existing proof: retained `68a71e89...` S0/G1 evidence and fresh failed current-geometry S0/G1 evidence.
  - New proof: same-runner A/B results; first-good/first-bad localization only if regression is confirmed.
  - Risk matrix: Chromium/Linux production preview, 640×480, one worker; S0 and G1.
  - Durable ownership updates: none in this pass; architect updates canonical/performance review state after evaluating the report.

No unit/component/E2E/mutation source changes are expected, so no verifier-managed coding check is required solely for this diagnostic pass. If the agent edits any tracked file accidentally, revert that local edit before handoff rather than broadening verification scope.

## Stop conditions

Stop and report without production edits when:

- historical/current runner logic or environment cannot be made equivalent;
- historical ref cannot build/run faithfully with the same measurement setup;
- A/B classification is ambiguous;
- first-regression localization points outside the accepted measured render/view-switch path;
- correction would require changing ownership/API/geometry architecture;
- temporary tooling cannot be removed cleanly.

## Required report

Return exact commands used to create/inspect temporary worktrees and to run the measurements, but do not treat them as merge verification. Report all raw samples, runner identity/hash, refs, environment, classification, and — if applicable — first bad/previous good production states and changed runtime files.

Final exact-head GitHub CI remains architect-owned and is not the objective of this attribution pass.
