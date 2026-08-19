# Review

Verdict: blocked

## Scope reviewed

- User-triggered local-directory permission/reconnect flows and final browser-level recovery proof for PR #211.

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

Required final state: after the revised architecture and implementation are stable, run the final operator matrix in real Chrome/PWA: revoked permission; granted-but-unavailable root; picker/confirmation cancellation; proven same-entry live reconnect; final locator-different recovery behavior from the revised handoff; invalid non-Mioframe candidate; already-mounted candidate handling; and retry/reopen behavior required by the final design.

Verification: operator proof against the final PR head/implementation, with any discrepancy treated as a product or architecture finding rather than patched around in the UI.

## Major issues

### M1 — One feature module now owns two distinct user actions

Owner: `src/features/localDirectoryRecovery`

Problem: before this PR the feature owned the browser-permission recovery action. The PR adds a separate reconnect action with its own picker, marker validation, confirmation, pending state, errors and result UX under the same feature module. These are independent user actions with different platform and service contracts, so the module has become an umbrella recovery domain instead of one replaceable feature action.

Evidence:

- [Feature barrel](index.ts) — exports both `useLocalDirectoryRecoveryAction` and `useLocalDirectoryReconnectAction`.
- [Permission recovery action](useLocalDirectoryRecoveryAction.ts) — owns browser permission request mode/pending/result flow.
- [Reconnect action](useLocalDirectoryReconnectAction.ts) — separately owns directory picker, candidate inspection, confirmation and remembered-location mutation flow.

Basis:

- [Feature rules](../AGENTS.md) — a feature owns one user action and its orchestration; feature modules should remain replaceable composition units.
- [Root architecture rules](../../../AGENTS.md) — keep behavior with explicit ownership rather than grouping responsibilities by broad topic.

Risk: future local-directory recovery variants accumulate in one generic feature, broadening state and dependencies and making widget composition depend on a hidden recovery subsystem rather than explicit actions.

Required final state: keep permission grant recovery as one feature and locator-unavailable reconnect/recovery as a separate feature action/module. Share only lower-layer domain/provider parsing where ownership justifies it; do not introduce a generic recovery manager or umbrella feature state.

Verification: each feature has one action-oriented public API and focused tests for its own cancel/pending/success/error flow; the widget composes them without importing their internals.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
