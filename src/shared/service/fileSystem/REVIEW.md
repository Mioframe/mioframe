# Review

Verdict: blocked

## Scope reviewed

- Persisted remembered-directory replacement invariants in PR #211.

## Blockers

### B1 — Confirmed replacement can persist one physical directory under two mounted names

Owner: `src/shared/service/fileSystem`

Problem: `addDeviceDirectory()` already enforces the persisted-handle uniqueness invariant by finding an existing `isSameEntry()` record and reusing/replacing it. The new remembered-location replacement path does not check the selected handle against other persisted records before replacing the target record. Selecting a Mioframe directory already connected under another mounted name can therefore persist two records for the same physical directory.

Evidence:

- [File-system service](useFileSystemService.ts) — `addDeviceDirectory()` calls `findRecordByHandle()` while the replacement path only finds the target by `spaceName` and writes the selected handle into that record.
- [File-system service tests](useFileSystemService.test.ts) — existing add-directory proof explicitly verifies that the same handle is reused instead of duplicated; replacement proof contains no already-mounted-candidate scenario.

Basis:

- [File-system service rules](AGENTS.md) — persisted handles, provider registration and mount lifecycle are fileSystem-owned invariants.
- [Root architecture rules](../../../../AGENTS.md) — storage/service changes must preserve one source of truth and complete lifecycle behavior.
- [CRDT/storage workflow](../../../../.agents/skills/crdt-storage/SKILL.md) — storage/provider state and cache lifecycle are data-safety state.

Risk: two VFS paths can point at the same Automerge storage. They can acquire independent repository instances/caches and write the same physical files through different logical mounts. The current target-path repository lease does not protect an already-mounted sibling path.

Required final state: the revised replacement contract preserves the existing one-physical-directory/one-persisted-mount invariant. A selected candidate already represented by another mounted record is an expected rejection with zero mutation; do not silently merge, rename, disconnect, or alias the other mount.

Verification: add focused service proof for an already-mounted selected handle and confirm persisted records/runtime mounts remain unchanged.

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
