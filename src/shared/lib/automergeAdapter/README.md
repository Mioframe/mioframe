# Automerge storage contract

## Owner

`shared/lib/automergeAdapter` owns physical Automerge storage formats and storage-format policy.

## Known consumers

- `createFSStorageAdapter`
- `createVFSAdapter`
- repository discovery / `repositoryStorageFiles`
- storage tests and fixtures

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
- Shared storage policy owns parsing, classification, selection, and invalid-data behavior.
- FS and VFS adapters should remain IO wrappers.

## Storage performance contract (slow and multi-client filesystems)

Mioframe targets mobile devices, slow filesystems (including Android SAF/cloud-backed
directories), and repository directories that may be shared by multiple clients. The storage
policy layer uses one strict **primary** v3 storage filename. v3 was not released before this PR,
so there is no shipped v3 compatibility filename family to keep supporting:

- The filesystem is always the source of truth. No persistent manifest, index file, or
  long-lived directory cache is ever written to storage or kept as a source of truth.
- The primary generated v3 filename is `<docPrefix>.<kindCode>.<fingerprint>.mf`, where
  `fingerprint` is a 12 lowercase hex character hash of the full logical `StorageKey`. It never
  contains a hash prefix; the filename is a routing hint only, and the wrapper's full `StorageKey`
  remains the source of truth. Normal writes always resolve to this one deterministic filename and
  never generate a numeric-suffix or copy-style fallback name.
- Exact `load`, `save`, and `remove` for a full chunk key resolve the primary filename directly,
  with no directory listing in the common case:
  - `load` reads the primary filename directly. A valid same-key wrapper there returns
    immediately. An invalid or different-key wrapper there is a storage conflict and fails safely
    (`undefined`) without falling back to v2 or legacy data for that key. Only when the primary
    filename is missing outright does `load` try the direct v2 filename next; only when v2 is also
    missing does it try the direct released legacy filename. All three steps are direct reads by
    deterministic filename; exact `load` never calls `listNames()`/`readDirectory()`/`entries()`,
    and a full chunk key that matches none of the three returns `undefined` without scanning.
  - `save` reads the primary filename directly and writes it when absent or already a valid
    wrapper for the same full key, with no directory listing. When the primary filename is
    occupied by invalid data or a valid wrapper for a different full key, `save` raises
    `V3StorageConflictError` instead of writing a numeric-suffix fallback file.
  - `remove` removes the primary filename only when it holds a valid same-key wrapper, and removes
    the exact v2/legacy filenames for the same key directly when present. It never removes an
    invalid primary file and never removes a valid wrapper for a different key.
  - When the IO provider supports direct read-by-name (e.g. `createFSStorageAdapter`'s optional
    `DirectoryForStorageAdapter.readFileByName`, or `createVFSAdapter`'s `vfs.readFile`), these
    direct primary-filename reads never trigger a directory-wide listing/scan on the underlying
    storage, even on slow browser/SAF/cloud-backed filesystems. Providers that only implement
    listing-based access (`entries()`) keep working through that fallback.
- Operations that need directory-wide state (`loadRange`, `removeRange`, and document discovery)
  fetch a fresh directory listing via at most one `listNames()` call; sequential operations never
  reuse a stale listing from a previous call. Exact full-key `load` never needs directory-wide
  state, so it never lists the directory.
- These scans consider only strict primary v3 `.mf` filenames as v3 candidates. Non-primary `.mf`
  names are ignored as unrelated or invalid storage candidates.
- Within one operation that does list the directory, the listing may be classified once into an
  operation-scoped, IO-free in-memory index (marker/v3-candidate/v2/legacy classification). That
  index is discarded when the operation finishes; it is never reused across operations or treated
  as a cache.
- Independent v3 wrapper reads and independent physical removals use bounded concurrency (a small
  local constant), never unbounded `Promise.all` over arbitrary file counts.
- Supported physical formats are:
  - strict primary v3 `.mf` files;
  - released v2 filenames;
  - released legacy filenames.
- No manifest, index file, or persistent directory cache is used as a source of truth.
