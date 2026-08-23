# Review

Verdict: blocked

## Scope reviewed

- PR #217 feature-owned inline-edit session lifecycle after the mutation-proof correction.
- Public feature API, entity write dependency, identity/concurrency guards, success/failure settlement, and focused tests.
- The accepted mutation-proof correction contract in `docs/database-virtualization-mutation-proof-correction-handoff.md`.

## Blockers

### B1 — Focused lifecycle proof still misses cancel and successful-resolution cleanup

Owner: `src/features/databaseInlineValueEdit`

Problem: the expanded feature tests now prove identity, no-op/changed resolve, concurrent in-flight reuse, switching, failure recovery, wrong-cell guards, and resolving-state guards, but two required public lifecycle contracts remain unproved. There is no focused assertion that `cancel()` clears the exact active non-resolving session without persistence. Also, the test named `serializes concurrent resolves and releases the completed operation` only opens a later session after the first successful resolve; a stale already-resolved `activeInlineEditResolution` could remain and that request would still succeed. The test does not change and resolve the later session to prove that a fresh persistence operation is actually used.

Evidence:

- [`useDatabaseInlineEditSession.test.ts`](./useDatabaseInlineEditSession.test.ts) — exact-cell cancel is exercised only while `resolving` (where it must be ignored), and the post-success case stops after requesting the later session.
- [`useDatabaseInlineEditSession.ts`](./useDatabaseInlineEditSession.ts) — `cancel()` must clear the exact non-resolving session, and `activeInlineEditResolution` must be released after settlement so later edits can start a fresh resolve/write.
- [`../../../docs/database-virtualization-mutation-proof-correction-handoff.md`](../../../docs/database-virtualization-mutation-proof-correction-handoff.md) — explicitly requires exact non-resolving cancel and proves that a later resolve/request is not tied to a completed in-flight promise.

Basis:

- [`../../../docs/database-virtualization-mutation-proof-correction-handoff.md`](../../../docs/database-virtualization-mutation-proof-correction-handoff.md) — acceptance requires all listed feature lifecycle behavior represented by the current implementation to be protected by focused tests.
- [`../AGENTS.md`](../AGENTS.md) — the feature owns the user-action cancel/success/error lifecycle.
- [`../../../.agents/skills/project-review/SKILL.md`](../../../.agents/skills/project-review/SKILL.md) — missing required risk-specific proof remains a review finding even when another automated threshold is green.

Risk: the focused suite could stay green if exact cancel stopped clearing the session, or if a completed successful resolution remained cached and caused a later changed session to return the old result instead of persisting its own draft. The product E2E covers user Escape cancellation, but it does not replace the explicitly required owner-local lifecycle proof for this mutation target.

Required final state: focused feature tests must prove (1) exact active non-resolving cancel clears the session and performs no write, and (2) after one successful changed resolve completes, a newly requested session can be changed and resolved through a second distinct persistence call with its own identity/draft. Do not expose internals or change production behavior.

Verification: focused feature unit tests and the unchanged verifier-managed mutation target after the test correction.

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
