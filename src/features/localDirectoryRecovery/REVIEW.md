# Review

Verdict: blocked

## Scope reviewed

- Remembered local-directory unavailable-root detection, worker transport, persisted-handle replacement, reconnect action, Repository Explorer recovery precedence, diagnostics, and focused proof.

## Blockers

### B1 — Required real Chrome/PWA recovery proof is still missing

Owner: `src/features/localDirectoryRecovery`

Problem: The implementation and automated proof cover the designed recovery flow, but the required real-browser operator verification for permission persistence and reconnect behavior has not been provided yet.

Evidence:

- [Local directory access recovery](../../../docs/local-directory-access-recovery.md) — `Required proof` explicitly states that real Chrome/PWA operator verification remains required because mocked handles do not prove browser permission persistence behavior.
- [Reconnect action](useLocalDirectoryReconnectAction.ts) — the feature owns the user-activated picker/reconnect flow that must be exercised in the real browser.

Basis:

- [Local directory access recovery](../../../docs/local-directory-access-recovery.md) — the architecture contract makes this browser/PWA verification mandatory before acceptance.
- [Project review skill](../../../.agents/skills/project-review/SKILL.md) — missing required proof is an active finding and a required unknown prevents a `ready` verdict.

Risk: A browser-specific permission persistence or picker/reconnect behavior difference could leave the shipped recovery path unverified even though mocked/unit/service proof is green.

Required final state: Real Chrome/PWA operator verification confirms the required user scenarios without changing the accepted architecture.

Verification: In a real Chrome/PWA environment, verify that revoking site access still produces the existing permission-recovery UI; a granted-but-unavailable remembered root produces `Folder unavailable` with `Reconnect folder`; cancelling the picker leaves the remembered mount unchanged; choosing the same directory restores access under the same mounted space; and choosing a different directory is rejected without replacing the remembered handle.

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
