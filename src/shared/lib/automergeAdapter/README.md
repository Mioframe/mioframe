# Automerge storage contract

## Owner

`shared/lib/automergeAdapter` owns physical Automerge storage formats and storage-format policy.

## Known consumers

- `createFSStorageAdapter`
- `createVFSAdapter`
- repository discovery / `repositoryStorageFiles`
- compatibility tests and storage fixtures

## Core rules

- Physical filenames are not always the full logical identity.
- New Automerge chunk writes use the current v3 `.mf` format only.
- V3 `.mf` filenames are candidate filters only.
- The full Automerge `StorageKey` for v3 lives inside the wrapper.
- Do not infer the full `documentId` from a v3 filename prefix.
- Repository discovery must decode valid v3 wrappers to discover full document ids.
- V2 and legacy formats remain compatibility inputs.
- Marker file behavior is separate from chunk storage; `storage-adapter-id.automerge` must remain stable.
- Empty chunks are invalid.
- Malformed or truncated files are skipped, not fatal.
- Shared storage policy owns parsing, classification, selection, compatibility, and invalid-data behavior.
- FS and VFS adapters should remain IO wrappers.

## Storage performance contract (slow and multi-client filesystems)

Mioframe targets mobile devices, slow filesystems (including Android SAF/cloud-backed
directories), and repository directories that may be shared by multiple clients. The storage
policy layer follows this contract:

- The filesystem is always the source of truth. No persistent manifest, index file, or
  long-lived directory cache is ever written to storage or kept as a source of truth.
- Each top-level operation (`load`, `save`, `remove`, `loadRange`, `removeRange`) fetches a fresh
  directory listing via exactly one `listNames()` call; sequential operations never reuse a stale
  listing from a previous call.
- Within one operation, a directory listing may be classified once into an operation-scoped,
  IO-free in-memory index (marker/v3-candidate/v2/legacy classification). That index is discarded
  when the operation finishes; it is never reused across operations or treated as a cache.
- Independent v3 wrapper reads and independent physical removals use bounded concurrency (a small
  local constant), never unbounded `Promise.all` over arbitrary file counts.
- Generated v3 filenames are deterministic: `<docPrefix>.<kindCode>.<hashPrefix>.<fingerprint>.mf`,
  where `fingerprint` is a short deterministic hash of the full logical `StorageKey`. This lets
  normal saves resolve the write target without scanning for a free numeric suffix, and lets
  different logical keys avoid competing for the same generated filename even when their truncated
  documentId/hash prefixes collide. A bounded numeric-suffix fallback remains only for the
  exceptional case where the deterministic name is occupied by unrelated or invalid content.
- Existing manual, copied, and pre-fingerprint numeric-suffix v3 files remain readable for
  compatibility; the short `<docPrefix>.<kindCode>.<hashPrefix>` family prefix (without the
  fingerprint) is still used to recognize and clean up those legacy variants on delete.
