# Directory state reactivity — implementation preflight

Status: **ready for implementation**.

Architecture authority: [`directory-state-reactivity.md`](./directory-state-reactivity.md). This record only fixes implementation scope, pass order, proof ownership, and removals; it does not redefine the architecture.

## Authoring source

- Ready architecture handoff: `docs/directory-state-reactivity.md`.
- Baseline: merged PR #211 on `develop` at `b264c816fda35205459a24840d9dcf8412cd121f`.
- Applicable rules: root/src/service/entity/feature `AGENTS.md`, `implementation-preflight`, `crdt-storage`, `test-first`, `unit-testing`, and `docs/testing/architecture.md`.
- Branch was re-checked as ahead of and not behind `develop` before this preflight.

## Goal and non-goals

Implement the accepted two-coordinator design so reactive directory/repository state cannot publish stale or mixed results and does not multiply slow filesystem I/O.

Do not change VFS/provider semantics, #211 recovery/topology queue, `fsNodeStat`, Google Drive convergence policy, Automerge Repo identity/cache/60-second idle lifetime, document mutation semantics, or operation-scoped delete/import/export listings.

## Confirmed implementation facts

- Current `directoryContent$` starts a new uncancellable `vfs.readDirectory()` for every invalidation and can overlap physical reads.
- `defineCacheObservable()` releases its cache entry on last unsubscribe; it cannot own the required quick-resubscribe lifetime while uncancellable work is still settling. The new coordinators therefore need explicit owner-local per-normalized-path maps.
- Repository facts and visible entries currently derive through separate reactive queries and lifecycles.
- Existing `getRepositoryFacts(vfs, path, entries)` already accepts a pre-read listing and preserves tolerant candidate-read behavior and concurrency policy.
- `useObservableQuery()` treats a top-level `Error` emission as query error, but a discriminated `RepositoryState.error` object remains query data. Its own `error` ref therefore represents stream/transport failure only.
- Worker RPC serializes the complete value graph through SuperJSON and registers the existing error transformers; nested errors in `RepositoryState.error` do not require a second serialized-error DTO or proxy change.
- `exampleDocumentsCreate` intentionally treats preliminary directory listing failure as best-effort and lets `createDirectory`/`FileExists` decide the action result.
- `entities/directory/useDirectory` and mounted-directory root listing state have no current production consumer.

## Owners and entry points

### `shared/service/fileSystem`

Own:

- internal `directoryState$({ path })`;
- per-normalized-path reactive coordinator;
- public stateless `readDirectoryFresh(path)`;
- canonical name sorting for both paths.

Do not use `defineCacheObservable` for the new directory coordinator lifetime.

### `shared/service/repositories`

Own:

- public `repositoryState` / internal `repositoryState$`;
- per-normalized-path repository derivation coordinator;
- atomic `RepositorySnapshot` construction;
- storage-candidate visibility classification;
- internal document-id projection used by Repo gating and DocumentService.

Keep existing Repo cache, write-recovery settlement, import/export/delete behavior unchanged.

### Consumers

- `shared/service/document`: consume the internal document-id projection only.
- `entities/repository`: adapt one `repositoryState` query; synchronous visibility projection; existing create/delete actions.
- Repository Explorer: compose one repository lifecycle plus unchanged `fsNodeStat` recovery input.
- `exampleDocumentsCreate`: use `readDirectoryFresh()` for best-effort pre-inspection.

## State and contract placement

Use contract-only modules:

- `src/shared/service/fileSystem/fileSystemContracts.ts`
  - canonical `DirectoryEntry` / `DirectoryEntries`;
  - internal `DirectoryState` type may live here but must not become a public UI lifecycle API;
  - remove `ReadDirectoryOptions`.
- `src/shared/service/repositories/repositoryContracts.ts`
  - `RepositoryEntry`, `RepositorySnapshot`, `RepositoryState`;
  - remove duplicate `RepositoryDirectoryEntry` alias and use canonical `DirectoryEntry`.

Public `@shared/service` exports should expose only DTOs needed by UI-facing consumers and commands; do not export `DirectoryState` as a public lifecycle.

## Minimum implementation design

### Filesystem coordinator module

Add `src/shared/service/fileSystem/directoryState.ts` as the owner-local implementation of the accepted state machine. It may expose a narrowly scoped factory/closure used by `useFileSystemService`; do not create a generic resource/coordinator framework.

Requirements:

- key by `PathUtils.normalize(path)`;
- one coordinator-owned physical reactive read per normalized path at a time;
- watcher attached before first result may publish;
- synchronous `ready -> reading` on matching invalidation;
- one dirty bit and at most one necessary trailing read;
- dirty completion cannot publish authoritative `ready`/terminal error;
- sticky terminal error while retry work is in progress;
- last unsubscribe during uncancellable read keeps coordinator + watcher only until settlement;
- quick resubscribe reuses that in-flight coordinator;
- zero demand at settlement discards result, starts no trailing work, and releases state;
- `readDirectoryFresh()` is independent stateless physical I/O and may overlap coordinator/operation reads.

Wire it into `useFileSystemService.ts`; remove `directoryContent$`, public `directoryContent`, filename filtering, and their obsolete imports after all consumers migrate. Leave `fsNodeStat$`, recovery, topology queue, mounts, and provider wiring unchanged.

### Repository coordinator module

Add `src/shared/service/repositories/repositoryState.ts` as the owner-local repository state machine. It should use existing repository storage policy/helpers rather than duplicate parsing or candidate I/O.

Requirements:

- normalize coordinator keys;
- consume filesystem `directoryState$`; perform zero second canonical `readDirectory()`;
- directory `reading`/`error` immediately makes active derivation non-publishable;
- at most one physical derivation per normalized path;
- retain only newest pending accepted `ready` directory input;
- publish only atomic complete snapshots;
- preserve old snapshot only through public `refreshing(snapshot)`; do not add parallel booleans/generations;
- after repository `error`, keep it until the first replacement derivation succeeds or a newer directory error arrives;
- zero demand abandons publication and releases upstream directory demand, while retaining only physical ownership needed to prevent derivation overlap until settlement;
- equal listings must not skip candidate discovery.

Snapshot derivation:

- marker files affect initialization and are omitted from `entries`;
- plausible storage candidates are classified `automergeStorageCandidate` for visibility even if a v3 wrapper later proves malformed/unreadable;
- all other non-marker directory entries are `regular`;
- document IDs/init continue through existing storage policy and tolerant candidate-read behavior;
- do not introduce a repository terminal `DomainError` for derivation.

`repositoryStorageFiles.ts` remains the storage-policy/operation helper. Remove obsolete visibility helpers only when no remaining caller needs them; keep operation-scoped direct listings unchanged.

### Entity/query mapping

`entities/repository/useRepository.ts` uses exactly one `useObservableQuery(repositoryState, { path })`.

Mapping:

- generic query pending is initial loading only while no service state exists;
- service `loading` -> `isLoading = true`;
- `ready`/`refreshing` -> expose snapshot and `isLoading = false`;
- `error` -> no snapshot and one raw repository error;
- query/transport `error` takes precedence over `state.error` only as the unavoidable transport failure path;
- `errorMessage` resolves from that one effective raw error;
- visibility is synchronous from `snapshot.entries`, defaulting existing `hideAutomergeFiles` option to `true`;
- remove `repositoryFactsError`, `repositoryVisibleEntriesError`, and entity `refetch`;
- keep `documentIds`, `isInitialized`, visible entries, `createDocument`, and `deleteDocument` so non-Explorer consumers retain their existing narrow API.

Repository Explorer must no longer infer loading from missing split payloads. `ready` and `refreshing` both render content. `useRepositoryExplorerRecovery` continues combining the single repository error with unchanged `directoryStatError`.

## Consumer migration inventory

| Consumer | Migration |
| --- | --- |
| `shared/service/repositories/repositoriesService.ts` | split directory/repository queries -> coordinator-owned state + internal document-id projection |
| `shared/service/document/useDocumentService.ts` | `getDocumentIdList$` compatibility path -> new internal projection; preserve absent/error/later-recovery behavior |
| `entities/repository/useRepository.ts` | two public queries -> one `repositoryState` query |
| `widgets/RepositoryExplorerWidget/useRepositoryExplorerDirectoryState.ts` | split errors/loading -> single repository lifecycle; keep settings projection |
| `widgets/RepositoryExplorerWidget/RepositoryExplorerWidget.vue` | no behavior redesign expected; keep recovery > error > initial loading > content branch order |
| `features/exampleDocumentsCreate/useExampleDocumentsCreate.ts` | replay-based `directoryContent.fetch()` -> stateless `readDirectoryFresh()` with existing catch-to-empty fallback |
| `entities/mountedDirectories/useFileSystem.ts` | remove unused root `directoryContent` subscription/state; preserve `deviceFiles` and all actions/recovery |
| `entities/directory/useDirectory.ts` / barrel | remove dead read surface |
| `features/databaseRelationPropertyEdit/DatabaseRelationPropertyField.vue` | no semantic change expected; verify `documentIds` remains compatible |
| `features/documentCreate/DocumentCreationDialog.vue` | no semantic change expected; verify repository create action remains compatible |
| `features/documentRemove/DocumentRemoveDialog.vue` | no semantic change expected; verify repository delete action remains compatible |

Compatibility wrappers for removed service queries are not required because no current production consumer requires them.

## Expected files/modules

Expected production changes/additions:

- `src/shared/service/fileSystem/directoryState.ts` (new)
- `src/shared/service/fileSystem/fileSystemContracts.ts`
- `src/shared/service/fileSystem/index.ts`
- `src/shared/service/fileSystem/useFileSystemService.ts`
- `src/shared/service/repositories/repositoryState.ts` (new)
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
- removal of `src/entities/directory/useDirectory.ts` and its now-obsolete barrel export/file when no other export remains.

Do not edit VFS/provider/Google service/proxy transport production modules for this task.

Expected proof changes/additions:

- `src/shared/service/fileSystem/directoryState.test.ts` (new primary filesystem state-machine proof)
- `src/shared/service/fileSystem/useFileSystemService.test.ts` only for service wiring/contracts not already owned by `directoryState.test.ts`
- `src/shared/service/fileSystem/googleDriveDirectoryRefresh.test.ts` migrate old directory query usage while preserving provider-convergence evidence
- `src/shared/service/repositories/repositoryState.test.ts` (new primary repository lifecycle/concurrency proof)
- `src/shared/service/repositories/repositoriesService.test.ts` update service integration/Repo projection expectations
- `src/shared/service/repositories/repositoryStorageFiles.test.ts` update classification/helper coverage only where ownership remains there
- `src/shared/service/document/useDocumentService.test.ts`
- `src/entities/repository/useRepository.test.ts`
- `src/widgets/RepositoryExplorerWidget/useRepositoryExplorerDirectoryState.test.ts`
- `src/widgets/RepositoryExplorerWidget/RepositoryExplorerWidget.test.ts` only for narrow branch wiring if existing mocks/contracts require update
- `src/features/exampleDocumentsCreate/useExampleDocumentsCreate.test.ts`
- affected mounted-directory entity tests if present/required by existing coverage.

## Implementation passes

### Pass 1 — filesystem state owner

1. Add/update the filesystem contracts.
2. Test-first the highest-risk overlapping/stale reactive read case in `directoryState.test.ts`.
3. Implement `directoryState.ts` and stateless fresh read.
4. Wire `useFileSystemService` while retaining old public directory query only until consumer migration is complete inside this task.
5. Migrate Google Drive refresh proof.
6. Run focused verifier-managed filesystem/unit proof before continuing.

### Pass 2 — repository state owner

1. Add repository state DTOs and candidate classification.
2. Test-first stale derivation/`reading` suppression and `ready -> refreshing -> ready` behavior.
3. Implement `repositoryState.ts` and wire `repositoriesService`.
4. Add internal document-id projection without changing Repo cache/settlement.
5. Prove candidate tolerance/concurrency and zero duplicate canonical listing.
6. Run focused repository/unit proof before consumer migration.

### Pass 3 — consumers

1. Migrate DocumentService.
2. Migrate repository entity and Explorer state composition.
3. Migrate example creation; add the missing rejected-fresh-list -> successful-create case.
4. Remove mounted-directory root read state and dead `useDirectory` surface.
5. Verify narrow non-Explorer `useRepository` consumers retain document-id/create/delete behavior.
6. Run focused consumer/unit proof.

### Pass 4 — removal and contract cleanup

Remove all replaced paths after searches confirm no consumer remains:

- `directoryContent$` and public `directoryContent`;
- `ReadDirectoryOptions` / generic filesystem `hideAutomergeFiles` filtering;
- public `documentIdList`, `repositoryFacts`, `repositoryVisibleEntries` query wrappers and their replaced internal split observables;
- `RepositoryDirectoryEntry` duplicate alias;
- obsolete repository visible-entry filtering helpers/exports when unreferenced;
- split entity error aliases and entity `refetch`;
- dead directory/root-read exports, tests, imports, and comments tied only to removed behavior.

Do not remove unrelated `DirectoryContentEntry.vue` UI merely because the old `useDirectory` composable is dead.

## TEST IMPACT

### Reactive directory lifecycle / stale physical reads

- Primary proof owner: `src/shared/service/fileSystem/directoryState.test.ts`, deterministic unit/service behavior.
- Existing proof: filesystem service refresh tests and VFS/provider event tests.
- New/updated proof: sorting; synchronous invalidation; same-path coordinator read concurrency `<= 1`; dirty/trailing coalescing; stale suppression; normalized-path sharing; unsubscribe/resubscribe; zero-demand cleanup; sticky error retry; independent fresh read.
- Risk matrix: slow/uncancellable filesystem I/O; no browser-only semantics required.
- Durable impact update: ordinary colocated unit ownership only; no new registry.

### Repository derivation lifecycle / atomic snapshot

- Primary proof owner: `src/shared/service/repositories/repositoryState.test.ts`.
- Additional proof: existing `repositoriesService.test.ts` for Repo integration and `repositoryStorageFiles.test.ts` for storage policy/tolerant candidate behavior.
- New/updated proof: directory-to-repository transition matrix; one active derivation; latest pending input; stale/zero-demand suppression; zero second canonical directory read; atomic IDs/init/classification; candidate concurrency remains `<= 4`; malformed/unreadable plausible v3 remains candidate-for-visibility but no false repository fact.
- Risk matrix: async storage candidate reads and recoverable filesystem errors.
- Durable impact update: none beyond colocated unit ownership.

### Document/Repo availability

- Primary proof owner: existing `src/shared/service/document/useDocumentService.test.ts` plus repository service Repo tests for gating/cache.
- New/updated proof: absent/present/error/later recovery through new projection; zero-doc wait; transient-error stream survival; later document appearance; Repo reuse/idle behavior unchanged.
- Risk matrix: CRDT handle lifecycle only; no persistence format change.

### Repository entity and Explorer lifecycle

- Primary proof owner: `src/entities/repository/useRepository.test.ts` for service-state adaptation; Explorer composable test for screen composition seam.
- Additional proof: existing widget test only for declarative branch wiring.
- New/updated proof: initial loading; ready/refreshing content continuity; no spinner on refreshing; one effective repository error; safe message; settings-only visibility projection with zero I/O; recovery errors remain available alongside separate `fsNodeStat` error.
- Browser/visual proof: not required unless implementation changes actual interaction or appearance.

### Starter example fresh pre-inspection

- Primary proof owner: existing `src/features/exampleDocumentsCreate/useExampleDocumentsCreate.test.ts`.
- New/updated proof: fresh read is used; rejected fresh read falls back to empty set and successful create still succeeds; existing first-free, `FileExists`, safety limit, loading, final failure remain.
- Browser proof: not required.

### Removed dead/compatibility surfaces

- Primary proof: type-check/import graph and focused existing consumer tests.
- Required check: repository search leaves no production use of removed split queries, `ReadDirectoryOptions`, `RepositoryDirectoryEntry`, mounted root read state, or `useDirectory`.

## Verification

During passes, use only focused verifier-managed checks that give useful feedback, especially exact owning unit tests. Because public service contracts change, a focused type-check and oxlint run are appropriate once exports/consumers are migrated.

Final coding-agent handoff gate: run canonical `pnpm verify` once after implementation and cleanup are stable. Do not substitute a manually assembled full checklist. Exact-head GitHub CI and final semantic/project review remain architect-owned.

## Forbidden

- changing VFS/provider/Google/proxy transport production behavior;
- using `defineCacheObservable` as the new coordinator lifetime owner;
- a generic resource manager/coordinator base class/global scheduler;
- refresh waiter registry or coupling `readDirectoryFresh()` to reactive state;
- global same-path filesystem serialization;
- topology queue integration for reads;
- a public directory lifecycle API;
- a second canonical directory read during reactive repository derivation;
- generation/token/lease metadata for these coordinators;
- new repository terminal `DomainError` without a new confirmed failure contract;
- filename parsing/classification in entity/widget/feature code;
- separate repository facts/visibility lifecycles or split entity errors;
- mapping `refreshing` to generic query loading/spinner;
- changing tolerated candidate failures, candidate concurrency, Repo cache/lifetime, provider convergence, or #211 recovery behavior;
- keeping obsolete compatibility APIs without a confirmed current consumer;
- broad cleanup outside the listed replaced surfaces.

## Readiness

- architecture: ready;
- implementation state/API/ownership: resolved;
- worker transport for nested errors: resolved by existing recursive SuperJSON + registered error transformers; no proxy change required;
- consumer inventory/removals: resolved;
- TEST IMPACT: resolved;
- simpler alternative: inline state machines were rejected because both owning service files are already large/multi-responsibility; two small owner-local modules reduce complexity without creating a generic layer;
- implementation blockers: none;
- verdict: **implementation may begin**.
