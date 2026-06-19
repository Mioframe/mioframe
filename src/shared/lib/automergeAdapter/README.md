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
- V3 `.mf` filenames are candidate filters only.
- The full Automerge `StorageKey` for v3 lives inside the wrapper.
- Do not infer the full `documentId` from a v3 filename prefix.
- Repository discovery must decode valid v3 wrappers to discover full document ids.
- V2 and legacy formats remain compatibility inputs.
- Marker file behavior is separate and must remain stable.
- Empty chunks are invalid.
- Malformed or truncated files are skipped, not fatal.
- Shared storage policy owns parsing, classification, selection, compatibility, and invalid-data behavior.
- FS and VFS adapters should remain IO wrappers.
