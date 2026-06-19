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
- Operations that need directory-wide state (`loadRange`, `removeRange`, document discovery, and
  the exceptional save/remove fallback paths below) fetch a fresh directory listing via at most one
  `listNames()` call; sequential operations never reuse a stale listing from a previous call.
- Exact `load` and normal deterministic `save` avoid directory listing entirely in the common case,
  and a valid v3 candidate always outranks v2/legacy for the same full logical key:
  - `load` reads the deterministic preferred v3 filename directly. A valid same-key wrapper there
    returns immediately, with no directory listing.
  - When the preferred filename is missing outright, `load` has no evidence that another v3
    candidate exists, so it tries the direct v2 filename next as a safe fast path before falling
    back to a directory-wide scan for manual/suffixed v3 or legacy candidates.
  - When the preferred filename instead holds invalid data or a valid wrapper for a different full
    key, that is evidence that another v3 candidate may exist for this key. `load` scans the v3
    candidate family for a valid same-key match _before_ trying v2, so a valid v2 file can never
    hide a valid same-key v3 fallback candidate.
  - Normal `save` reads the deterministic preferred v3 filename directly and writes it when it is
    absent or already a valid wrapper for the same full key, without listing the directory. A
    directory listing is only fetched as an exceptional fallback when the preferred filename is
    occupied by invalid data or by a valid wrapper for a different full key.
  - When the IO provider supports direct read-by-name (e.g. `createFSStorageAdapter`'s optional
    `DirectoryForStorageAdapter.readFileByName`, or `createVFSAdapter`'s `vfs.readFile`), these
    direct preferred-filename reads never trigger a directory-wide listing/scan on the underlying
    storage, even on slow browser/SAF/cloud-backed filesystems. Providers that only implement
    listing-based access (`entries()`) keep working through that fallback.
- Within one operation that does list the directory, the listing may be classified once into an
  operation-scoped, IO-free in-memory index (marker/v3-candidate/v2/legacy classification). That
  index is discarded when the operation finishes; it is never reused across operations or treated
  as a cache.
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
