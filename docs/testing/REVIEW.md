# Review

Verdict: blocked

## Scope reviewed

- `docs/testing/migration-plan.md` changes made with Verify Redesign Pass A.

## Blockers

None.

## Major issues

### M1 — Operational migration plan claims Pass A is complete while review blockers remain

Owner: `docs/testing`

Problem: the operational migration plan says Pass A has landed and Pass B is the next implementation boundary, but the architect review has unresolved Pass A blockers. The same edit also malformed the public-type comparison table because the unescaped `|` separators inside the verification-type value are now parsed as additional table columns.

Evidence:

- [`migration-plan.md`](migration-plan.md) — Phase 0 status currently says Pass A has landed and Pass B is next.
- [`migration-plan.md`](migration-plan.md) — the `Public-contract mismatch during migration` table has a separator row with extra columns and splits the target `static | unit | ... | e2e` value across table cells.
- [`../../scripts/REVIEW.md`](../../scripts/REVIEW.md) — active Pass A review records unresolved ownership/orchestration findings.

Basis:

- [`../../AGENTS.md`](../../AGENTS.md) — `docs/testing/migration-plan.md` records the currently executable migration state, and implementation must not proceed while required preflight/pass proof is unresolved.
- [`verify-redesign-implementation-preflight.md`](verify-redesign-implementation-preflight.md) — do not start the next risky pass while the previous pass has known failing focused proof; repository state must remain internally consistent at pass boundaries.

Risk: coding agents following repository source of truth can incorrectly start Pass B before Pass A is accepted, and the malformed table obscures the canonical eight-type target contract.

Required final state: while Pass A findings remain unresolved, the migration plan must not advertise Pass B as the current implementation boundary. After the correction is accepted, it may mark Pass A complete. Restore the comparison table to valid Markdown with the eight-type value represented as one cell.

Verification: inspect rendered/source Markdown and confirm the status matches the actual accepted pass boundary after the Pass A correction review.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
