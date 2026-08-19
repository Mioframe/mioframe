# Review

Verdict: blocked

## Scope reviewed

- Remembered local-directory unavailable-root detection, worker transport, persisted-handle replacement, reconnect action, Repository Explorer recovery precedence, diagnostics, focused proof, and real Chrome/PWA operator recovery behavior.

## Blockers

### B1 — Reconnect identity contract rejects the required real-browser recovery path

Owner: `src/shared/service/fileSystem`

Problem: `reconnectDeviceDirectory()` requires the newly selected directory handle to satisfy `existingRecord.handle.isSameEntry(handle)`. Real Chrome/PWA operator verification selected the intended recovery directory but the service returned `mismatch`, so the required reconnect flow cannot complete. The current architecture assumes `isSameEntry()` can prove identity after the remembered handle becomes unusable, but the File System specification defines equality in terms of the same filesystem locator; locator-based equality is not a stable identity mechanism for recovery scenarios where the remembered location can change.

Evidence:

- [File-system service](../../../shared/service/fileSystem/useFileSystemService.ts) — `reconnectDeviceDirectory()` returns `mismatch` unless `existingRecord.handle.isSameEntry(handle)` resolves `true`.
- [Local directory access recovery](../../../docs/local-directory-access-recovery.md) — the accepted architecture requires real-browser reconnect of an unavailable remembered root and currently requires `isSameEntry()` confirmation.
- [Mioframe space inspection](../../mioframeSpacePick/mioframeSpacePick.helpers.ts) — Mioframe already recognizes an existing space through its Automerge storage marker, but the reconnect identity contract does not use storage identity.

Basis:

- [File System Standard — `isSameEntry()`](https://fs.spec.whatwg.org/#api-filesystemhandle-issameentry) — the method resolves `true` only when the two handles have the same filesystem locator.
- [Project architecture rules](../../../AGENTS.md) — a ready architecture is an implementation contract; when new facts invalidate it, the architecture must be updated explicitly rather than patched around.
- [Project review skill](../../../.agents/skills/project-review/SKILL.md) — a required scenario that fails real proof is a blocker, and repeated correction rounds exposing a missing scenario/invalid assumption require returning to architecture.

Risk: Mioframe can correctly detect an unavailable remembered local space but then refuse the directory the user intentionally selects to restore it, leaving the primary recovery scenario unusable. Weakening the service check without redefining the source of truth could instead allow an unrelated space to replace the remembered mount.

Required final state: Redefine the reconnect identity/source-of-truth contract so an unavailable remembered local space can be restored in the real browser without depending on stale-locator equality, while keeping replacement explicit and preventing accidental silent substitution of an unrelated directory. The architecture must state how existing remembered records without any newly persisted identity metadata recover.

Verification: Add focused proof for the revised identity contract and repeat the real Chrome/PWA scenario that currently returns `mismatch`, including successful intentional reconnect, cancellation, and rejection or explicit handling of an unrelated selected Mioframe space.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

- The exact filesystem change that made the operator's remembered handle unusable was not independently inspected. This does not remove the blocker: the required real-browser reconnect scenario returned `mismatch` under the current identity contract.
