# Directory state reactivity — final review correction handoff

Status: **completed; correction passed semantic re-review**.

This record closes the three findings discovered by the later full PR #215 re-review without reopening the accepted directory/repository coordinator architecture.

## Authority

- `docs/directory-state-reactivity.md` remains the architecture source of truth.
- `docs/directory-state-reactivity-implementation-preflight.md` remains the completed implementation record.
- `docs/directory-state-reactivity-worker-boundary-correction.md` remains the accepted worker-publication correction record.

No owner-local `REVIEW.md` findings remain for this correction.

## Resolved findings

### Repository entity visibility proof

Owner: `src/entities/repository`.

`useRepository.test.ts` now proves a mounted reactive `hideAutomergeFiles` transition against one retained `RepositorySnapshot`: visible entries update synchronously while the same single `repositoryState` query remains in use. Production `useRepository.ts` required no change.

### Directory entity ownership cleanup

Owner: `src/entities/directory`.

`src/entities/directory/AGENTS.md` now describes only the remaining directory-entry UI responsibility and explicitly leaves reactive directory lifecycle, filesystem reads, invalidation, and canonical directory state to `shared/service/fileSystem`.

The obsolete empty `src/entities/directory/index.ts` barrel was removed. `DirectoryContentEntry.vue` and its behavior remain unchanged.

### Repository service TSDoc

Owner: `src/shared/service/repositories`.

The `documentIds$` TSDoc now states that both `documentIds$` and `repositoryState$` are same-worker service internals and directs UI-facing consumers only to the public `repositoryState` query.

## Architecture impact

None.

The accepted design remains:

- exactly one filesystem directory-state coordinator per normalized demanded path;
- exactly one repository derivation coordinator per normalized demanded repository path;
- `readDirectoryFresh()` remains stateless;
- repository visibility remains a synchronous entity projection over service-classified entries;
- raw `directoryState$`, `repositoryState$`, and `documentIds$` remain same-worker service internals;
- worker-facing repository reads use the public `repositoryState` query;
- #211 recovery/topology, VFS/providers, candidate discovery/concurrency, Repo identity/cache/lifetime, DocumentService, Explorer behavior, and user-visible behavior remain unchanged.

## Verification

Coding-agent focused verification passed:

```text
pnpm verify --only unit-tests --files src/entities/repository/useRepository.test.ts
pnpm verify --only type-check
```

Semantic re-review confirmed the correction was limited to the intended proof, ownership cleanup, obsolete barrel removal, and TSDoc fix. No production coordinator/runtime behavior changed.

Exact-head GitHub CI remains the architect-owned final automatic merge gate.
