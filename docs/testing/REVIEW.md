# Review

Verdict: blocked

## Scope reviewed

- PR #216 verifier-modernization completion criteria and final integration evidence under `docs/testing/verify-target-architecture.md`, `verify-modernization.md`, and `verify-finish-plan.md`.
- Required benchmark/stop criteria versus the evidence currently recorded in the repository.

## Blockers

### B1 — Required verifier-modernization benchmark is still missing

Owner: `docs/testing` verifier-modernization completion state / architect integration

Problem: the accepted target architecture requires a representative benchmark after release-impact/CI integration, recording both CI critical-path/merge latency and aggregate expensive compute, and makes that benchmark part of the verifier-modernization exit criterion. The current completion documents do not contain that evidence: `verify-modernization.md` explicitly says CI critical path/merge latency is pending and records no aggregate-compute result, while `verify-finish-plan.md` weakens the required benchmark into recording the actual CI result/critical path only "if useful".

Evidence:

- [`verify-target-architecture.md`](./verify-target-architecture.md) — "Benchmark — then stop" requires representative real change classes and both critical-path/merge latency and aggregate expensive compute; exit criterion 13 requires a representative benchmark showing no remaining critical-path problem that justifies more verifier infrastructure.
- [`verify-modernization.md`](./verify-modernization.md) — the representative matrix is explicitly semantic, not CI wall-clock evidence, and "CI critical path / merge latency" remains `Pending exact-head PR CI`; no aggregate expensive-compute benchmark is recorded.
- [`verify-finish-plan.md`](./verify-finish-plan.md) — remaining order says to record the actual CI result / critical path only "if useful", which is weaker than the binding target-architecture completion criterion and omits the required aggregate-compute metric.

Basis:

- [`verify-target-architecture.md`](./verify-target-architecture.md) — accepted end-state/exit criterion for this verifier-modernization program.
- [`../../AGENTS.md`](../../AGENTS.md) — repository architecture/docs are the source of truth; required verification and accepted architecture criteria must be satisfied before merge readiness.

Risk: the PR can be declared complete without proving the central modernization outcome against real execution cost. In particular, the new release lane may become the CI critical-path bottleneck or materially increase aggregate expensive compute without the required evidence/decision being recorded. This is a missing acceptance criterion, not a request for permanent benchmarking infrastructure.

Required final state: after semantic corrections are complete, run a bounded representative benchmark of the accepted real change classes sufficient to evaluate the new verifier topology; record both critical-path/merge latency and aggregate expensive compute, compare the result with the accepted stop criterion, and record whether any measured bottleneck justifies reopening infrastructure work. Keep this as evidence/decision documentation only; do not add permanent benchmark infrastructure unless measurement demonstrates a separate need.

Verification: repository completion documentation contains the actual representative measurements, their source/run scope, both required metrics, and the resulting stop/reopen decision consistent with `verify-target-architecture.md`.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Permanent benchmark tooling or another CI job is not required unless the measured result separately justifies it.

## Unresolved questions

None.
