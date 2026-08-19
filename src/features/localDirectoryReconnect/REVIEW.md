# Review

Verdict: blocked

## Scope reviewed

- Final unavailable-root reconnect UX and required real-browser proof for PR #211.

## Blockers

### B1 — Final real Chrome/PWA recovery proof is still missing

Owner: `src/features/localDirectoryReconnect`

Problem: mocked File System Access handles cannot prove the browser behavior that originally invalidated the strict `isSameEntry()` design. The final implementation has not yet been operator-verified in real Chrome/PWA.

Evidence:

- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) — final real Chrome/PWA proof is a merge gate.
- [Reconnect action](useLocalDirectoryReconnectAction.ts) — picker identity, unavailable-root recovery, and confirmed relocation depend on real File System Access behavior.

Basis:

- [Project review workflow](../../../.agents/skills/project-review/SKILL.md) — required but missing risk-specific proof blocks acceptance.

Risk: persisted-handle, permission, picker, or installed-PWA behavior can still differ from mocks in the scenario that motivated the PR.

Required final state: after code/architecture findings are resolved, verify the final head in real Chrome/PWA: revoked permission; granted-but-unavailable root; picker/confirmation cancellation; proven same-entry reconnect; locator-different confirmed relocation; invalid marker; already-mounted candidate; navigation to the recovered mount; and same-entry settlement warning behavior.

Verification: operator proof against the final implementation/head; any discrepancy is a product/architecture finding rather than a UI workaround.

## Major issues

### M1 — Production confirmation copy does not match the canonical handoff

Owner: `src/features/localDirectoryReconnect`

Problem: the implementation and its tests use a shorter confirmation sentence (`Mioframe will reconnect the selected space...`) instead of the exact copy now defined by the canonical handoff. The current text no longer falsely promises unconditional removal, but it omits the required safe-mounted-location explanation and conditional replacement behavior.

Evidence:

- [Reconnect action](useLocalDirectoryReconnectAction.ts) — current supporting text differs from the canonical contract.
- [Reconnect feature tests](useLocalDirectoryReconnectAction.test.ts) — assert the same noncanonical shorter text.

Basis:

- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) — defines the exact headline, supporting text, confirm label and cancel label for this explicit storage-recovery confirmation.

Risk: user-facing behavior and its proof diverge from the reviewed product contract, and the confirmation does not explain the conditional `alreadyMounted` versus relocation outcomes as specified.

Required final state: use the exact confirmation copy from the current handoff and keep `alreadyMounted` zero-mutation/non-diagnostic behavior unchanged.

Verification: focused feature test asserts the exact canonical copy and retains the `alreadyMounted` outcome proof.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
