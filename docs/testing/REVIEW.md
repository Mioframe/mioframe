# Review

Verdict: blocked

## Scope reviewed

- PR #216 verifier-modernization completion criteria and final integration evidence under `docs/testing/verify-target-architecture.md`, `verify-modernization.md`, and `verify-finish-plan.md`.
- Required benchmark/stop criteria versus the evidence currently recorded in the repository.

## Blockers

### B1 — Required verifier-modernization benchmark is still missing

Owner: `docs/testing` verifier-modernization completion state / architect integration

Problem: the accepted target architecture requires a representative benchmark after release-impact/CI integration, recording both CI critical-path/merge latency and aggregate expensive compute, and makes that benchmark part of the verifier-modernization exit criterion. The current completion documents correctly keep that work pending, but contain no actual measurements yet.

Evidence:

- [`verify-target-architecture.md`](./verify-target-architecture.md) — "Benchmark — then stop" requires representative real change classes and both critical-path/merge latency and aggregate expensive compute; the exit criterion requires representative benchmark evidence showing whether any remaining critical-path problem justifies more verifier infrastructure.
- [`verify-modernization.md`](./verify-modernization.md) — "Mandatory benchmark — pending" explicitly records both required metrics but contains no measured run evidence, and "CI critical path / merge latency" remains pending.
- [`verify-finish-plan.md`](./verify-finish-plan.md) — the current remaining order correctly schedules the mandatory benchmark after semantic corrections and requires both metrics plus a stop/reopen decision; that step has not yet been completed.

Basis:

- [`verify-target-architecture.md`](./verify-target-architecture.md) — accepted end-state/exit criterion for this verifier-modernization program.
- [`../../AGENTS.md`](../../AGENTS.md) — repository architecture/docs are the source of truth; required verification and accepted architecture criteria must be satisfied before merge readiness.

Risk: the PR can otherwise be declared complete without proving the modernization outcome against real execution cost. In particular, the release lane could become the CI critical-path bottleneck or materially increase aggregate expensive compute without the required evidence/decision being recorded. This is a missing acceptance criterion, not a request for permanent benchmarking infrastructure.

Required final state: after semantic corrections are complete, run a bounded representative benchmark of the accepted real change classes sufficient to evaluate the final verifier topology; record both critical-path/merge latency and aggregate expensive compute, compare the result with the accepted stop criterion, and record whether any measured bottleneck justifies reopening infrastructure work. Keep this as evidence/decision documentation only; do not add permanent benchmark infrastructure unless measurement demonstrates a separate need.

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
