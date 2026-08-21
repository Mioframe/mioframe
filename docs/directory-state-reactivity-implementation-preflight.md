# Directory state reactivity — implementation preflight

Status: **completed; implementation is under semantic review**.

Architecture authority: [`directory-state-reactivity.md`](./directory-state-reactivity.md). This record documents the implementation scope, pass order, removals, and proof ownership used for the current branch; it does not redefine the architecture or active review findings.

## Source and readiness

- Ready handoff: `docs/directory-state-reactivity.md`.
- Current synchronized `develop` baseline: `9427fa4aea0b4fea0c72ea4ef4dd8d94711d6121`; PR #211 remains the foundational recovery/topology baseline at `b264c816fda35205459a24840d9dcf8412cd121f`.
- Applicable workflows: `implementation-preflight`, `crdt-storage`, `test-first`, `unit-testing`, `docs/testing/architecture.md`.
- Branch is ahead of and not behind `develop`.
- Existing RPC uses recursive SuperJSON serialization with registered error transformers, so nested `RepositoryState.error` needs no new transport DTO or proxy change.

## Goal / unchanged scope

Implement the accepted two-coordinator design and migrate all current consumers.

Unchanged: VFS/providers, #211 recovery/topology queue, `fsNodeStat`, Google Drive convergence, Automerge Repo identity/cache/60-second idle lifetime, document mutations, and operation-scoped delete/import/export listings.

## Implementation decisions

### Filesystem

Add `src/shared/service/fileSystem/directoryState.ts` as the owner-local per-normalized-path coordinator. Do not use `defineCacheObservable`: its ref-count cleanup releases the cache immediately on last unsubscribe and cannot preserve ownership of uncancellable in-flight work through quick resubscribe.

`useFileSystemService` exposes:

- internal `directoryState$({ path })`;
- public stateless `readDirectoryFresh(path)`.

`readDirectoryFresh()` is one normalized, sorted physical read with no replay/cache/watcher/retry/coordinator demand.

Contracts belong in `fileSystemContracts.ts`: canonical `DirectoryEntry` / `DirectoryEntries`; remove `ReadDirectoryOptions`. `DirectoryState` remains service-internal and is not a public UI lifecycle.

### Repository

Add `src/shared/service/repositories/repositoryState.ts` as the owner-local per-normalized-path derivation coordinator.

It consumes `directoryState$`, performs zero second canonical `readDirectory()`, reuses existing repository storage policy/discovery, keeps candidate concurrency/tolerance unchanged, and publishes atomic `RepositorySnapshot` only.

Contracts belong in `repositoryContracts.ts`: `RepositoryEntry`, `RepositorySnapshot`, `RepositoryState`; remove duplicate `RepositoryDirectoryEntry` alias.

Visibility classification is service-owned:

- marker: initialization fact, not a published entry;
- plausible storage filename: `automergeStorageCandidate` even when v3 decode later yields no document fact;
- otherwise: `regular`.

Do not add a repository terminal `DomainError`; current expected candidate failures remain skip + bounded diagnostic/no fact.

### Query/entity mapping

`useRepository` uses one public `repositoryState` query.

- query pending before first service state may represent initial loading;
- service `loading` -> loading;
- `ready` / `refreshing` -> expose snapshot/content, never spinner for `refreshing`;
- service `error` -> one raw repository error;
- query transport error may override it only as the unavoidable transport failure path;
- visibility is synchronous from classified entries, with existing `hideAutomergeFiles` option defaulting to `true`;
- remove split errors and entity `refetch`;
- preserve `documentIds`, `isInitialized`, visible entries, create/delete actions.

DocumentService and Repo gating consume one internal document-id projection of `RepositoryState`; preserve existing absent/error/later-recovery and Repo cache behavior.

## Consumer migration

- `repositoriesService.ts`: split facts/visible/document-id reactive paths -> `repositoryState$` + internal document-id projection.
- `useDocumentService.ts`: consume the new projection.
- `entities/repository/useRepository.ts`: two queries -> one query.
- `RepositoryExplorerWidget/useRepositoryExplorerDirectoryState.ts`: one lifecycle/error; no loading inference from missing split payloads.
- `RepositoryExplorerWidget.vue`: no expected behavior/layout change; retain recovery > error > initial loading > content.
- `exampleDocumentsCreate`: `directoryContent.fetch()` -> `readDirectoryFresh()`; rejected pre-read still falls back to empty known names.
- `entities/mountedDirectories/useFileSystem.ts`: remove unused root directory query/state; preserve `deviceFiles` and all actions/recovery.
- remove dead `entities/directory/useDirectory.ts` and its obsolete barrel export/file; do not remove unrelated `DirectoryContentEntry.vue`.
- verify unchanged narrow `useRepository` consumers: database relation selector (`documentIds`), document create, document remove.

No compatibility wrapper is required for removed split service queries because no current production consumer requires one.

## Expected production files

Add:

- `src/shared/service/fileSystem/directoryState.ts`
- `src/shared/service/repositories/repositoryState.ts`

Change:

- `src/shared/service/fileSystem/fileSystemContracts.ts`
- `src/shared/service/fileSystem/index.ts`
- `src/shared/service/fileSystem/useFileSystemService.ts`
- `src/shared/service/repositories/repositoryContracts.ts`
- `src/shared/service/repositories/repositoryStorageFiles.ts`
- `src/shared/service/repositories/repositoriesService.ts`
- `src/shared/service/repositories/index.ts`
- `src/shared/service/document/useDocumentService.ts`
- `src/shared/service/index.ts`
- `src/entities/repository/useRepository.ts`
- `src/widgets/RepositoryExplorerWidget/useRepositoryExplorerDirectoryState.ts`
- `src/features/exampleDocumentsCreate/useExampleDocumentsCreate.ts`
- `src/entities/mountedDirectories/useFileSystem.ts`

Remove replaced dead files/exports as described above.

Do not edit VFS/provider/Google/proxy transport production modules.

## Pass order

### 1. Filesystem owner

- Add contracts and `directoryState.ts`.
- Test-first the overlapping/stale reactive read case.
- Wire `directoryState$` and `readDirectoryFresh()`.
- Migrate `googleDriveDirectoryRefresh.test.ts` to the new internal state while preserving its provider-convergence evidence.
- Focused filesystem/unit verification.

### 2. Repository owner

- Add repository state DTOs/classification and `repositoryState.ts`.
- Test-first stale derivation suppression and `ready -> refreshing -> ready`.
- Wire `repositoriesService`; add internal document-id projection.
- Prove zero duplicate canonical listing and unchanged candidate tolerance/concurrency.
- Focused repository/unit verification.

### 3. Consumers

- Migrate DocumentService, repository entity, Explorer state, example creation.
- Remove mounted-root query state and dead `useDirectory`.
- Add rejected-fresh-list -> successful example creation proof.
- Verify unchanged narrow `useRepository` consumers.
- Focused consumer/unit verification.

### 4. Cleanup

After repository search confirms no consumer remains, remove:

- `directoryContent$` / public `directoryContent`;
- `ReadDirectoryOptions` / filesystem `hideAutomergeFiles` filtering;
- public `documentIdList`, `repositoryFacts`, `repositoryVisibleEntries` wrappers and replaced split observables;
- `RepositoryDirectoryEntry`;
- obsolete visibility helpers/exports if now unreferenced;
- split entity errors/refetch;
- dead directory/root-read imports, exports, tests, comments.

Then run focused type-check/oxlint only when useful to validate the public contract migration.

## TEST IMPACT

### Filesystem reactive lifecycle

Primary: new `src/shared/service/fileSystem/directoryState.test.ts`.

Prove sorting, synchronous invalidation, coordinator-owned same-path read `<= 1`, dirty/trailing coalescing, stale suppression, normalized-path sharing, unsubscribe/resubscribe lifetime, zero-demand cleanup, sticky retry, and independent fresh read.

### Repository lifecycle/snapshot

Primary: new `src/shared/service/repositories/repositoryState.test.ts`.

Additional: existing `repositoriesService.test.ts` and `repositoryStorageFiles.test.ts` only for their owned Repo/storage-policy seams.

Prove transition matrix, derivation `<= 1`, latest pending input, stale/zero-demand suppression, zero second canonical listing, atomic IDs/init/classification, candidate concurrency `<= 4`, and tolerant malformed/unreadable candidate behavior.

### Document/Repo availability

Primary: existing `useDocumentService.test.ts` plus repository service Repo tests.

Preserve absent/present/error/recovery, zero-doc wait, later appearance, transient-error survival, Repo reuse/idle cleanup.

### Entity/Explorer

Primary: `useRepository.test.ts`; Explorer composable test owns its composition seam. Widget test remains narrow branch wiring only.

Prove initial loading, ready/refreshing content continuity, one effective repository error/safe message, synchronous visibility setting, and unchanged recovery composition with separate `fsNodeStat` error.

No browser/visual proof is required unless implementation actually changes interaction or appearance.

### Starter examples

Primary: existing `useExampleDocumentsCreate.test.ts`.

Add rejected fresh read -> successful creation; retain first-free naming, `FileExists`, safety limit, loading, final failure.

### Removals

Type-check/import graph plus repository search must show no remaining production use of removed split queries, `ReadDirectoryOptions`, `RepositoryDirectoryEntry`, mounted root-read state, or `useDirectory`.

## Verification

Required contract proof must exist in the repository. During implementation or correction, use focused verifier-managed checks only when they materially help diagnose or prove the changed risk; focused type-check/oxlint are appropriate when public contracts are touched.

Do not require a broad final local `pnpm verify` solely for coding-agent handoff. Exact-head GitHub CI is the architect-owned final automatic repository gate, followed by semantic/project review for merge readiness.

## Forbidden

- VFS/provider/Google/proxy production changes;
- `defineCacheObservable` as coordinator lifetime owner;
- generic coordinator/resource manager/base class/global scheduler;
- refresh waiter registry or reactive coupling of `readDirectoryFresh()`;
- global same-path read serialization or topology queue around reads;
- public `DirectoryState` lifecycle;
- second canonical repository `readDirectory()`;
- generation/token/lease metadata;
- new repository terminal error taxonomy;
- filename classification above repository service;
- split repository facts/visibility lifecycle or split entity errors;
- `refreshing` -> generic loading/spinner;
- candidate concurrency/tolerance, Repo cache/lifetime, provider convergence, #211 recovery changes;
- obsolete compatibility APIs without a confirmed current consumer;
- cleanup outside the replaced surfaces.

## Result

Preflight: **completed**. The initial implementation is present on `refactor/directory-state-reactivity`. Remaining acceptance/correction work is owned by the active owner-local `REVIEW.md` findings; those corrections must preserve this implementation contract unless new evidence proves a runtime defect.
