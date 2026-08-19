# Review

Verdict: blocked

## Scope reviewed

- Local-directory permission recovery, unavailable-root reconnect action ownership, and final browser proof for PR #211.

## Blockers

### B1 — Final real Chrome/PWA recovery proof is missing

Owner: final `src/features/localDirectoryReconnect` action

Problem: mocked File System Access handles cannot prove the browser behavior that motivated this PR. The final architecture is now resolved, but its implementation has not yet passed the required real Chrome/PWA scenarios.

Required final state: after the architecture reset is implemented, verify revoked permission, granted-but-unavailable root, picker/confirmation cancellation, proven same-entry reconnect, locator-different confirmed relocation to a new mounted identity, invalid marker, already-mounted candidate handling, and navigation to the recovered mount.

Verification: operator proof against the final implementation; any discrepancy is a product/architecture finding rather than a UI workaround.

## Major issues

### M1 — One feature module owns two independent user actions

Owner: `src/features/localDirectoryRecovery`

Problem: the module owns both browser-permission recovery and a separate reconnect action with picker, marker validation, confirmation, pending state, errors, and result handling.

Basis: `src/features/AGENTS.md` requires one feature to own one user action/orchestration.

Required final state:

- keep `src/features/localDirectoryRecovery` for permission recovery only;
- move reconnect orchestration into `src/features/localDirectoryReconnect`;
- each feature derives its own recovery state from supplied error candidates;
- do not introduce an umbrella recovery manager/shared feature state.

Verification: each feature has one action-oriented public API and focused cancel/pending/success/error tests; the widget composes them only through public feature contracts.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None. The ready ownership contract is in `docs/local-directory-access-recovery.md`.
