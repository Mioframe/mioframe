# Review

Verdict: blocked

## Scope reviewed

- Pass A agent-facing verifier output and failure-detail extraction in `scripts/verify.ts` against `docs/testing/verify-agent-output.md`.

## Blockers

### B1 — default failure reason is inferred from arbitrary child-output tail

Owner: `scripts/verify.ts`

Problem: when no verifier-owned invalid/timeout/blocking-log reason exists, `getFailureReason()` calls `getBoundedFailureExcerpt()`, which takes the last three non-empty child-output lines and presents them as `reason:`. Boundedness alone does not make an arbitrary tail a trustworthy or relevant failure summary.

Evidence:

- `getBoundedFailureExcerpt()` uses `trimmedLines.slice(-FAILURE_REASON_EXCERPT_MAX_LINES)` with no structured reporter contract or relevance criterion.
- `getFailureReason()` returns that excerpt ahead of the fallback `exit code N`.
- current proof accepts a one-line TypeScript error and only checks bounded size; it does not reject a real error followed by unrelated trailing output.

Basis:

- `docs/testing/verify-agent-output.md`, "Failure-detail extraction": prefer verifier-owned reason, then structured/stable reporter summary, then a small bounded relevant excerpt, otherwise do not infer a reason beyond exit failure with the exact log pointer.
- the same output contract forbids using arbitrary child output as the verifier control surface.

Risk: the default agent-facing summary can state irrelevant trailing tool chatter as the apparent cause, sending the next agent toward the wrong fix while the actual diagnostic remains earlier in the log.

Required final state:

- keep verifier-owned invalid/blocking/timeout reasons actionable;
- use a child-output summary only when it comes from a stable current reporter contract or another demonstrably relevant extraction seam;
- otherwise report the exit failure (`exit code N`) and exact log path instead of guessing from the output tail;
- do not add a broad regex catalogue or another logging framework.

Simplest viable correction: remove arbitrary tail inference from the normal failure-reason fallback. Preserve the detailed output in `.verify/logs/**` and verbose mode. Add a narrow verifier-owned timeout reason if needed so timeout remains actionable without tail inference.

Verification: fresh test-author proof must reject a failed command whose real error is followed by unrelated trailing lines; the normal summary must not present those trailing lines as the reason. Preserve the existing bounded blocking/invalid/timeout/log/rerun contracts.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- No generic reporter-extraction framework is required for this finish PR.
