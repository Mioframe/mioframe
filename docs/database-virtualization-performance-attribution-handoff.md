# Database virtualization performance attribution handoff

Status: **ready**.

This contract owns the next PR #217 step after the fresh current-geometry S0/G1 revalidation failed responsiveness acceptance while preserving bounded DOM and correctness.

## Goal

Determine whether the fresh slowdown is a real production regression or a measurement environment/protocol mismatch, and, only if the regression is confirmed, identify the first production change that introduced it.

## Confirmed current behavior and evidence

- Accepted historical comparison: `68a71e89d03713452946819cb52ba80a64157424` — S0 median usable 304.9 ms, G1 median 350.5 ms, zero Long Tasks in all six final samples.
- Fresh measured production state `8d62ba1f8adc66ebb82dd0734afc82824e112f6c` — S0 median usable 1603.3 ms, G1 median 2013.1 ms, repeated 291–429 ms Long Tasks.
- Both states preserve the structural target in their recorded proof: 12 mounted rows / 8 headers / 96 expensive cells and deep correctness.
- Tracked changes after `8d62ba1...` are test/docs only for this performance path; the current production geometry is equivalent to the fresh measured state.
- The cause is not established. Current geometry is a candidate only because it changed after the historical proof; it is not yet an accepted root cause.

## Non-goals

- no production correction in this attribution pass;
- no geometry redesign, worker/query/storage work, paging, indexes, caches, or generic benchmark infrastructure;
- no full matrix rerun;
- no CI or unrelated test cleanup.

## Affected scenario

Real Database short filtered view (~20 rows) -> explicit Full view switch on S0 (100×8) and G1 (30,000×300), using the same sparse deterministic dataset and deep correctness sentinels as the retained production proof.

## Boundaries and ownership

| Owner                         | This pass                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| `entities/databaseData`       | Performance review owner only until attribution identifies a concrete runtime owner. |
| Database widget/composition   | Inspect only if history/evidence places the first regression here.                   |
| `shared/ui/virtualization`    | Preserve; do not change without evidence.                                            |
| service/worker                | Preserve; no optimization without attribution.                                       |
| temporary measurement tooling | Diagnostic-only, untracked/temporary, removed before handoff.                        |

No public API, state shape, persistence contract, or source of truth changes in this pass.

## Minimum sufficient design

### Phase A — same-environment A/B

Use one identical temporary measurement runner/protocol for both:

- historical ref `68a71e89d03713452946819cb52ba80a64157424`;
- current production ref resolved from the branch when measurement starts.

Keep browser executable/version, Linux environment, Node/pnpm, viewport 640×480, one worker, retries off, production Vite build/preview, deterministic seed `pr-217-production-v1`, fresh context policy, in-page observer, timing boundaries, mounted-count checks, and deep sentinels identical.

Collect three S0 and three G1 samples for **each** ref. Prefer alternating baseline/current pairs so host drift cannot explain one side. Do not include import/setup time in switch timing.

Decision:

- if the historical ref is also materially slow under the identical runner/environment, stop: attribution is a measurement environment/protocol mismatch until corrected;
- if the historical ref reproduces the prior fast/no-Long-Task behavior while current remains materially slower, production regression is confirmed and Phase B is allowed;
- if evidence is ambiguous, stop and report raw results; do not choose a production owner by guess.

### Phase B — first-regression localization

Only after an unambiguous Phase A production regression:

1. inspect local Git history between `68a71e89...` and current for production files on the measured render/view-switch path;
2. exclude docs/tests/review-only commits from candidate runtime boundaries;
3. use S0 as the primary cheap discriminator because the slowdown reproduces in S0;
4. probe selected historical production states with the **same** runner/environment, normally two S0 samples per probe and a third only when results are ambiguous;
5. narrow to the first bad production state and its immediately preceding good production state;
6. compare that production delta and report the narrowest evidence-backed owner/root-cause candidate;
7. do not implement the correction in this pass.

Do not use a permanent benchmark framework. Temporary detached worktrees are allowed for measurement; do not move/reset/rebase the PR branch and remove temporary worktrees/tooling after use.

## Acceptance matrix

- Same-environment A/B has raw S0×3 and G1×3 results for both refs.
- Exact runner/protocol/environment identity is recorded.
- Mounted work remains bounded and deep correctness passes for measured refs.
- Result is classified as `measurement mismatch`, `production regression confirmed`, or `ambiguous` with evidence.
- If regression is confirmed, first bad / previous good production states and changed runtime files are identified.
- No production code is changed in this pass.

## Required proof

Task-specific performance evidence only. Persistent unit/E2E/mutation proof is unchanged because no durable behavior is modified. Existing exact-head CI remains architect-owned and does not substitute for this attribution.

## Forbidden

Production fixes; architecture changes; changing `useVirtualCollection` or geometry based on suspicion; worker/query/storage optimization; paging/cache/index work; permanent benchmark infrastructure; changing performance thresholds to accept the fresh result; timing based on Playwright command duration; retries as success; sleeps/force; moving the PR ref; editing `REVIEW.md`, canonical virtualization docs, performance-results docs, or PR metadata.

## Implementation readiness

Required decisions: **resolved**.  
Unresolved blocker: root cause intentionally remains an investigation output, not a coding choice.  
Verdict: **ready for attribution; not ready for production correction**.
