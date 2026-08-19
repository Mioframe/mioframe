# Review

Verdict: blocked

## Scope reviewed

- User-triggered local-directory permission/reconnect flow and final browser-level recovery proof for PR #211.

## Blockers

### B1 — Final real Chrome/PWA recovery proof is missing

Owner: `src/features/localDirectoryRecovery`

Problem: the browser behavior that motivated this PR cannot be proven by mocked `FileSystemDirectoryHandle` fixtures. The final implementation has not yet passed the required real Chrome/PWA scenarios, and the architecture is being revised again before that proof can be meaningful.

Evidence:

- [Local directory recovery handoff](../../../docs/local-directory-access-recovery.md) — real Chrome/PWA operator proof is a merge gate.
- [Reconnect action](useLocalDirectoryReconnectAction.ts) — picker identity, cancellation, marker validation, confirmation and reconnect result UX depend on browser File System Access behavior.

Basis:

- [Project review workflow](../../../.agents/skills/project-review/SKILL.md) — required but missing proof blocks acceptance.
- [Testing architecture](../../../docs/testing/architecture.md) — real browser behavior must use a faithful browser/product proof when mocks cannot model the platform semantics.

Risk: the final recovery semantics may still differ from persisted-handle and picker behavior in real Chrome/PWA, as already happened earlier in this PR.

Required final state: after the revised architecture and implementation are stable, run the final operator matrix in real Chrome/PWA: revoked permission; granted-but-unavailable root; picker/confirmation cancellation; proven same-entry live reconnect; locator-different confirmed replacement through the clean-runtime/reload boundary; invalid non-Mioframe candidate; already-mounted candidate rejection; and retry/reopen behavior after the replacement has been persisted.

Verification: operator proof against the final PR head/implementation, with any discrepancy treated as a product or architecture finding rather than patched around in the UI.

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
