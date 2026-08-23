# Review

Verdict: blocked

## Scope reviewed

- PR #217 feature-owned inline-edit session lifecycle after extraction from the Database widget.
- Public feature API, entity write dependency, failure recovery, concurrency/identity guards, and focused tests.
- Exact-head mutation verification for the feature source.

## Blockers

### B1 — Inline-edit session lifecycle is under-proved by mutation coverage

Owner: `src/features/databaseInlineValueEdit`

Problem: the feature implementation has the accepted single-session design, but its two focused rejection tests do not prove enough of the public lifecycle. Exact-head mutation verification reports 56.58% for `useDatabaseInlineEditSession.ts`, below the repository breaking threshold of 60%, with surviving mutants in behaviorally important guards such as cell identity, in-flight resolution reuse, request/update gating, and lifecycle cleanup.

Evidence:

- [`useDatabaseInlineEditSession.ts`](./useDatabaseInlineEditSession.ts) — one active session owns logical cell identity, serialized resolution, request/update/commit/cancel, and recoverable failure.
- [`useDatabaseInlineEditSession.test.ts`](./useDatabaseInlineEditSession.test.ts) — currently proves deferred rejection and exact-draft recovery, but does not exercise the full public lifecycle and identity/concurrency branches.
- [`../../../stryker.config.mjs`](../../../stryker.config.mjs) — mutation verification has `thresholds.break: 60`.
- [Exact-head verify run](https://github.com/Mioframe/mioframe/actions/runs/32644171094) — mutation output reports 56.58% for this feature and surviving mutations including removal/weakening of property identity, active-resolution reuse, failed prior-session resolution gating, draft-update gating, and resolution cleanup.

Basis:

- [`../AGENTS.md`](../AGENTS.md) — a feature must explicitly own and handle its user-action loading/cancel/success/error lifecycle.
- [`../../../docs/database-virtualization.md`](../../../docs/database-virtualization.md) — the accepted inline-edit contract requires one session, logical cell identity, serialized resolve/commit, exact draft recovery, previous-edit resolution before starting another editor, and no second state.
- [`../../../.agents/skills/project-review/SKILL.md`](../../../.agents/skills/project-review/SKILL.md) — missing required mutation proof is a review finding and cannot be substituted with other green checks.

Risk: regressions in cell identity, concurrent resolve behavior, switching between edited cells, update gating, commit, or cancel can survive the current focused tests even though these are correctness invariants of the newly feature-owned lifecycle.

Required final state: extend focused feature tests over the meaningful public lifecycle so cell identity, serialized/in-flight resolution, switching behavior, draft-update gating, commit/cancel, successful settlement, unchanged-draft behavior, and recoverable failure are adequately protected and the normal mutation gate passes. Do not expose internal state, add test-only production hooks, or change the session design merely to satisfy mutation tooling.

Verification: focused feature unit tests followed by the normal verifier-managed `pnpm verify --only mutation`; exact-head GitHub verification must pass with the existing mutation configuration and threshold.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
