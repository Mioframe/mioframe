# Directory state reactivity architecture

Status: architecture ready on current `develop`; PR #211 is merged at `b264c816fda35205459a24840d9dcf8412cd121f`, the affected filesystem/repository/document/recovery consumers were re-checked, and implementation may proceed through `implementation-preflight`.

## Goal

Provide one reliable reactive flow for directory-backed repository state that remains inexpensive on mobile devices and slow filesystems such as Google Drive and Android SAF.

Requirements:

- one canonical reactive state owner per concern;
- no stale-result races or mixed repository snapshots;
- no subscriber-multiplied or unbounded reactive filesystem I/O;
- explicit repository loading/refreshing/error semantics;
- narrow worker-safe public contracts with no duplicated facts.

## Confirmed current behavior

- `shared/service/fileSystem` currently starts a new `vfs.readDirectory()` for each matching VFS event; Promise-backed reads may overlap and are not physically cancelled by RxJS unsubscribe.
- current directory publication sorts entries by name.
- generic observable-query loading/fetch semantics describe transport subscription/replay, not completion of a new physical revalidation.
- repository facts and repository-visible entries currently use separate lifecycles and are recombined above the service layer.
- repository v3 discovery may read candidate files after listing; the storage policy bounds this I/O to 4 concurrent reads.
- expected candidate failures are already tolerant: unreadable candidates are skipped with bounded diagnostics, `FileNotFound` races are skipped, and malformed wrappers decode to no fact rather than a recoverable repository error.
- `DocumentService` and internal Repo gating consume repository document-id state; the existing Repo cache/reuse/60-second idle lifecycle must remain unchanged.
- merged PR #211 identifies unavailable-root recovery with transfer-safe `{ spaceName, recoveryKey }`; retry must not transiently erase that recovery target merely because a reread starts.
- #211's fileSystem topology mutation queue serializes topology-sensitive mutation/settlement, not general reads.
- provider `watch()` is an invalidation channel, not reliable observation of arbitrary external OS/rclone changes.
- Google Drive may return a stale listing immediately after mutation; generic serialization cannot guarantee provider convergence.
- `exampleDocumentsCreate` uses directory pre-inspection only as a best-effort optimization before authoritative `createDirectory`/`FileExists` handling.
- after #211, `entities/directory/useDirectory` and mounted root-directory read state still have no confirmed production consumer.

## Non-goals

- redesigning #211 recovery, `recoveryKey`, or the topology mutation queue;
- Automerge `Repo` identity/cache/lifecycle changes;
- `fsNodeStat` lifecycle/concurrency redesign;
- global same-path VFS read serialization across unrelated operations;
- polling, arbitrary sleeps, unconditional double reads, or provider-convergence infrastructure;
- a generic reactive-resource manager, scheduler, generation protocol, or new repository recovery-error taxonomy.

## Affected scenarios

- initial repository-backed directory open across OPFS, Web File System Access, SAF/device, and Google Drive;
- VFS/provider invalidation and invalidation bursts during slow reactive reads;
- filesystem read failure with later recovery;
- #211 permission/unavailable-root recovery while reread work runs;
- coherent Repository Explorer document/init/file facts;
- reactive document availability and Repo gating from repository document IDs;
- starter-example first-free-name pre-inspection with existing `FileExists` race fallback.

## Boundaries and ownership

Changes:

- one internal per-path reactive directory coordinator;
- one independent public one-shot fresh directory read for imperative callers;
- one coherent repository coordinator derived from canonical reactive directory state;
- one proxy-safe public repository query;
- service-owned repository visibility classification;
- removal of replaced split/replay-based APIs and confirmed dead directory-read surfaces.

Must remain unchanged: #211 recovery/identity/topology behavior, `fsNodeStat`, Automerge Repo lifecycle, document mutation/persistence semantics, Repository Explorer interaction hierarchy, provider convergence guarantees, and operation-specific storage reads used by delete/export/import.

| Owner | Responsibility |
| --- | --- |
| feature | `exampleDocumentsCreate` owns naming, best-effort pre-inspection, `FileExists` retry, action loading/error |
| entity | `repository` adapts one public `RepositoryState` and applies synchronous presentation-safe projection only |
| widget | recovery > error > initial loading > content branch composition; no repository lifecycle reconstruction |
| page/pane | routing/navigation/layout only |
| shared | existing VFS/provider/storage-policy primitives; no new generic manager |
| service/worker | filesystem owns reactive directory ordering/lifecycle; repositories own storage visibility classification and atomic repository derivation/lifecycle; document service consumes repository document-id projection |

## Source of truth

- reactive directory contents: latest clean name-sorted snapshot committed by the filesystem coordinator after `vfs.readDirectory(normalizedPath)`;
- one-shot imperative listing: the result of that one requested physical read, sorted identically, but not a second reactive cache and not a coordinator state transition;
- repository state: latest complete derivation from one accepted reactive directory snapshot plus required candidate reads;
- concrete documents: Automerge `Repo` / document service.

No upper layer owns a second directory/repository cache or lifecycle.

## Contracts and state shape

Public DTOs belong in contract-only `shared/service` modules, not `use*Service` implementation files.

Use one physical directory-entry contract:

```ts
type DirectoryEntry = readonly [name: string, stat: FSNodeStat];
type DirectoryEntries = readonly DirectoryEntry[];
```

Filesystem lifecycle is service-internal and intentionally minimal:

```ts
type DirectoryState =
  | { status: 'reading' }
  | { status: 'ready'; entries: DirectoryEntries }
  | { status: 'error'; error: Error };
```

`reading` means a clean reactive snapshot is not currently authoritative. The coordinator may privately retain its previous successful entries for internal bookkeeping, but does not publish them as a second state fact.

Repository public contracts:

```ts
type RepositoryEntry = {
  entry: DirectoryEntry;
  classification: 'regular' | 'automergeStorageCandidate';
};

type RepositorySnapshot = {
  documentIds: AMDocumentId[];
  isInitialized: boolean;
  entries: readonly RepositoryEntry[];
};

type RepositoryState =
  | { status: 'loading' }
  | { status: 'ready'; snapshot: RepositorySnapshot }
  | { status: 'refreshing'; snapshot: RepositorySnapshot }
  | { status: 'error'; error: Error };
```

`automergeStorageCandidate` is a visibility classification, not proof that a v3 candidate decoded to a valid Automerge storage key. It preserves the current filename-policy behavior needed to hide plausible storage candidates without leaking filename parsing upward. Marker files are protocol facts and are never published as `RepositoryEntry`.

Repository semantics:

- `loading`: no successful repository snapshot exists while required directory/derivation work is pending;
- `refreshing`: a previous successful repository snapshot remains usable while newer directory/derivation work is pending;
- `ready`: the latest accepted derivation completed;
- `error`: the canonical directory source is in error; previous repository data may remain private but is not duplicated into the error contract.

No new expected terminal repository-derivation error contract is introduced. Current repository discovery is tolerant for its expected candidate failures; malformed/unreadable candidates remain skip + bounded diagnostic/no fact. `RepositoryState.error` preserves the underlying filesystem/recovery error from `DirectoryState.error`. Unexpected programmer/invariant failures are defects, not a new recoverable public repository lifecycle invented by this work.

An existing repository error stays authoritative while filesystem retry/revalidation runs and while the first successful replacement repository snapshot is being derived. It changes only when that replacement snapshot becomes `ready` or a new directory terminal error replaces it. This preserves #211 recovery-target continuity without adding error-source metadata.

## Internal and public entry points

Service-internal raw observables:

```ts
directoryState$({ path }: { path: string }): Observable<DirectoryState>;
repositoryState$({ path }: { path: string }): Observable<RepositoryState>;
```

Worker-facing contracts:

```ts
readDirectoryFresh(path: string): Promise<DirectoryEntries>;
repositoryState: QueryDefinition<RepositoryState, { path: string }>;
```

Rules:

- raw `$` observables remain service-internal; do not introduce an RPC method returning a raw RxJS `Observable`;
- existing worker-proxy wiring may continue to keep internal service properties such as `$` streams and `vfs`; no `setupMainService` redesign is required;
- public `repositoryState` uses the existing proxy-safe `defineObservableQuery(repositoryState$)` shape;
- `readDirectoryFresh()` performs one requested `vfs.readDirectory(normalizedPath)`, applies the same canonical name sort, and resolves/rejects from that physical read;
- `readDirectoryFresh()` is not coordinator demand, does not replay/advance reactive `DirectoryState`, does not wait for repository derivation, and is not globally serialized with reactive or operation-specific reads;
- repository visibility changes are synchronous projection of service-classified entries and cause 0 filesystem reads and 0 repository derivations;
- remove generic filesystem `hideAutomergeFiles` and replaced split repository query APIs after migration;
- remove `entities/directory/useDirectory` and unused mounted-directory root read state rather than migrating them;
- `fsNodeStat` keeps its existing separate contract.

## Minimum sufficient design

### Filesystem reactive directory coordinator

One coordinator per active normalized path owns only:

- current `DirectoryState`;
- one `dirty` bit;
- at most one coordinator-owned in-flight `readDirectory()`;
- one VFS watcher while in-flight work can still publish;
- subscriber bookkeeping.

Reactive demand means at least one `directoryState$` subscriber.

Transition/algorithm contract:

1. normalize the path and attach the watcher before the initial physical read can publish;
2. first demand publishes `reading` and starts one read;
3. from `ready`, any matching invalidation synchronously publishes `reading` before starting/queuing the corresponding physical reread;
4. invalidation during an active read sets `dirty = true`; state remains `reading`;
5. clear `dirty` immediately before each coordinator-owned physical read;
6. sort a successful result once before commit;
7. a read settling with `dirty === true` cannot publish `ready`; if demand remains, start one trailing read and remain `reading`;
8. a clean successful settle publishes `ready(sortedEntries)`;
9. a failure settling while dirty and demand remains is superseded by the required trailing read and does not publish a terminal error;
10. a clean failure publishes `error(error)`;
11. from `error`, a later invalidation/retry starts physical work internally but keeps the current error published; a clean success transitions directly to `ready`, while a clean failure replaces it with the new terminal error.

Lifetime:

- same normalized path reactive subscribers share one coordinator and coordinator-owned physical work;
- coordinator-owned `readDirectory()` concurrency for one normalized path is `<= 1`;
- this is not a global same-path VFS guarantee: `readDirectoryFresh()` and delete/export/import/storage operations may independently read the same path;
- uncancellable in-flight reactive work keeps the coordinator and watcher until settlement after the last subscriber leaves so a quick resubscribe cannot lose invalidation knowledge;
- if demand returns before settlement, it reuses that coordinator;
- if no demand remains at settlement, discard the result, do not start trailing work, and release coordinator/watcher/state;
- inactive settled paths perform no background reads;
- different paths are never globally serialized.

The coordinator never acquires or extends #211's topology mutation queue. Topology changes invalidate through existing VFS/provider events; slow rereads never hold the topology queue.

### One-shot fresh directory read

`readDirectoryFresh()` is deliberately not a third stateful mechanism:

1. normalize path;
2. perform exactly one physical `vfs.readDirectory()` for the call;
3. sort using the same directory-entry ordering rule;
4. resolve entries or reject with the underlying canonical filesystem error.

It has no cache, watcher, dirty bit, waiter registry, retry loop, or repository coupling.

### Repository derivation coordinator

One coordinator per active normalized repository path owns only:

- latest complete repository snapshot;
- current repository lifecycle/error;
- at most one active derivation;
- latest pending accepted `ready` directory snapshot;
- subscription bookkeeping.

Repository demand means an active public repository-state subscription or a service-internal consumer such as document-id/Repo projection.

Rules:

1. consume internal `directoryState$`; canonical reactive repository derivation performs no second `readDirectory()`;
2. any directory `reading` or `error` immediately makes an older active repository derivation non-publishable;
3. only directory `ready(entries)` may start candidate discovery;
4. classify marker / storage-candidate / regular entries in repository service from that same accepted directory snapshot;
5. marker files contribute to initialization but are not published as entries;
6. derive document IDs using existing storage policy and keep candidate-read concurrency at `<= 4`;
7. current tolerated candidate failures remain skip + bounded diagnostic/no fact and do not create a repository error;
8. at most one derivation is physically active per normalized repository path;
9. retain at most the newest pending accepted `ready` snapshot while work is active;
10. stale/abandoned completions never publish;
11. publish only complete atomic repository snapshots.

Lifecycle mapping:

| Directory/input | RepositoryState |
| --- | --- |
| `reading`, no previous snapshot | `loading` |
| `reading`, previous snapshot | `refreshing(previous)` |
| `ready(A)`, no previous snapshot | derive A while staying `loading` |
| `ready(A)`, previous snapshot | derive A while staying `refreshing(previous)` |
| `error(E)` | invalidate active derivation; `error(E)` |
| `ready(A)` after repository error | derive A while keeping existing error until success |
| current accepted derivation succeeds | `ready(result)` |
| demand reaches zero during derivation | suppress completion and release upstream demand |

Structurally equal listings do not skip required candidate discovery: identical names/stats do not prove identical candidate bytes across supported providers.

Lifetime:

- while demand exists, subscribe to canonical `directoryState$`;
- when demand reaches zero during active derivation, mark it non-publishable and release upstream directory demand while retaining ownership of the uncancellable physical derivation until settlement;
- a consumer returning before settlement reattaches to `directoryState$`, keeps only the latest accepted `ready` input, and waits for the old physical derivation to settle before starting another;
- the abandoned completion is discarded; no second same-path derivation overlaps;
- with zero demand after settlement, discard pending state and release the coordinator.

This uses private stale-result suppression only; no public generation/token/lease metadata is added.

## Repository projections and consumer mapping

Visibility remains entity-side synchronous projection over a service-owned classification:

```ts
visibleEntries = snapshot.entries
  .filter(({ classification }) => showAutomergeFiles || classification === 'regular')
  .map(({ entry }) => entry);
```

The entity does not parse filenames or own lifecycle.

Public/entity mapping is explicit:

- before the first `RepositoryState` arrives, generic query transport pending may select the initial loading branch only;
- once state exists, repository lifecycle comes only from `RepositoryState`, not generic query `isLoading`;
- `loading` selects the spinner/loading branch;
- `ready(snapshot)` and `refreshing(snapshot)` both expose snapshot content; `refreshing` must not replace content with the spinner;
- `error(error)` exposes one repository raw error fact for safe message/recovery parsing;
- remove obsolete split `repositoryFactsError` / `repositoryVisibleEntriesError` and entity `refetch` unless implementation preflight finds a real current consumer;
- `fsNodeStat`/`directoryStatError` remains a separate unchanged contract and may still participate in widget recovery composition.

`DocumentService` and internal Repo gating consume an internal document-id projection:

- `ready(snapshot)` and `refreshing(snapshot)` expose `snapshot.documentIds`;
- `error(error)` exposes the existing error path;
- `loading` emits no document-list value yet;
- reactive Repo access continues to wait through transient errors rather than destroying the stream;
- zero document IDs do not instantiate a Repo solely for discovery;
- documents appearing later can make Repo/document access available without remounting;
- Repo instance reuse and the existing 60-second idle cache lifecycle remain unchanged.

Delete/export/import and other operation-specific storage flows may keep their own required listings. Only canonical reactive repository-state derivation is forbidden from doing a duplicate directory listing.

## Consumer migration/removal

- `shared/service/fileSystem`: add internal `directoryState$` coordinator and simple public `readDirectoryFresh`; remove replaced generic directory-content query only after all consumers migrate; leave `fsNodeStat` and topology/recovery APIs unchanged.
- `shared/service/repositories`: consume internal `directoryState$`; expose one public `repositoryState` query and internal document-id/Repo projections; remove split facts/visibility queries after migration.
- `shared/service/document`: migrate from split document-id query to the repository-state document-id projection while preserving availability/error behavior.
- `features/exampleDocumentsCreate`: use `readDirectoryFresh()` only for best-effort name pre-inspection. If it rejects, fall back to an empty known-name set and continue the existing bounded `createDirectory`/`FileExists` loop.
- `entities/repository` and Repository Explorer: consume one repository lifecycle using the mapping above; visibility is the synchronous candidate-classification projection.
- remove `entities/directory/useDirectory` and barrel export; remove unused mounted-directory `rootDirectory` / root-read `errorMessage` / `isLoading` while preserving `deviceFiles` and #211 recovery APIs.

## Minimum-complexity check

Exactly two new stateful coordination points are required:

1. directory coordinator: prevents overlapping/stale **reactive** Promise-backed rereads and coalesces invalidations;
2. repository coordinator: prevents stale/overlapping async candidate derivations.

`readDirectoryFresh()` is a stateless command, not a coordinator.

Rejected alternatives:

- `switchMap(readDirectory())`: unsubscribe does not physically cancel the Promise read;
- global/same-path VFS scheduler: broader than reactive correctness and conflicts with unrelated operation-specific reads;
- sharing imperative fresh reads through coordinator waiters: adds demand/waiter semantics for one best-effort consumer without improving its authoritative `FileExists` correctness;
- public `DirectoryState`: no confirmed UI consumer;
- combined filesystem/repository coordinator: mixes ownership and async phases;
- entity filename parsing: leaks storage protocol upward;
- confirmed-storage classification for v3 candidates: stronger than the current visibility fact and can change malformed/unreadable candidate behavior;
- separate visibility query: recreates split lifecycle;
- new terminal repository DomainError: no current expected derivation failure requires a new recoverable public contract;
- keeping upstream directory demand alive solely for an abandoned repository derivation: unnecessary background I/O;
- extending #211 topology locking across reads: couples independent concerns and can block topology mutation behind slow provider I/O;
- `fsNodeStat` coordinator, generic manager, polling, equal-listing cache, route identity/generation: unsupported extra scope.

## Shared UI blast radius

None. No Material/shared UI contract changes. Existing Repository Explorer interaction and appearance must be preserved.

## Acceptance matrix

| Contract | Required outcome |
| --- | --- |
| initial reactive directory work | one coordinator-owned sorted read; no stale completion publishes |
| invalidation | `ready -> reading` synchronously; burst coalesces into at most one required trailing reactive read |
| reactive same-path concurrency | coordinator-owned physical `readDirectory()` concurrency `<= 1`; no claim about unrelated one-shot/operation reads |
| directory error retry | existing error remains observable while retry runs; changes only on clean success/new terminal error |
| #211 recovery | retry never transiently erases current `{ spaceName, recoveryKey }`; topology queue never waits for reread |
| FS lifetime | watcher attached before first publish; unsubscribe/resubscribe cannot lose invalidation or overlap reactive work |
| cleanup | zero-demand settled paths retain no coordinator/watch/state and perform no background reads |
| fresh imperative listing | one independent sorted physical read; no replay/cache/waiter semantics |
| repository coherence | IDs, initialization, and visibility classification publish atomically from one accepted directory snapshot |
| repository concurrency | active derivations per normalized path `<= 1`; stale/abandoned completion suppressed; latest pending ready input wins |
| repository lifecycle | directory `reading` maps to loading/refreshing from repository-owned previous snapshot; directory error stays sticky through successful replacement derivation |
| visibility | setting changes cause 0 FS reads and 0 derivations; entity never parses storage filenames |
| candidate semantics | plausible storage candidates preserve current hide/show behavior; malformed/unreadable v3 candidates add no document/init fact and use existing tolerant diagnostics |
| documents/Repo | document availability/error behavior and existing Repo reuse/idle lifecycle unchanged |
| ordering | reactive and one-shot listings use existing name-sort semantics |
| starter examples | fresh pre-inspection failure is best-effort; `createDirectory`/`FileExists` loop remains authoritative |
| unchanged scope | `fsNodeStat`, Repo identity/cache, provider convergence, topology queue, delete/export/import listings unchanged |

## Required test proof

Primary proof: deterministic service/unit tests.

Filesystem:

- canonical name ordering from unsorted provider input;
- first demand and synchronous `ready -> reading` on invalidation;
- coordinator-owned same-path read concurrency `<= 1`;
- invalidation burst/trailing-read coalescing;
- watcher active before first result can publish;
- normalized-equivalent paths share one reactive coordinator;
- unsubscribe/resubscribe during uncancellable reactive read cannot overlap, lose invalidation, or publish stale completion;
- zero-demand settlement starts no trailing background read;
- error remains published through retry until terminal result;
- #211 provider/topology invalidations trigger reactive reread without extending topology queue ownership;
- `readDirectoryFresh()` performs one independent sorted physical read, resolves/rejects directly, and is not served from reactive replay.

Repository:

- complete `DirectoryState -> RepositoryState` transition matrix;
- canonical reactive repository derivation performs 0 additional `readDirectory()` calls;
- normalized-equivalent paths share one derivation coordinator;
- active derivation `<= 1`, stale suppression, latest-pending coalescing;
- zero-demand abandonment/resubscribe/no-overlap;
- marker initialization and storage-candidate visibility classification are service-owned and atomic;
- malformed/unreadable plausible v3 candidates preserve current hide/show behavior while adding no document/init fact unless independently established;
- visibility changes produce 0 filesystem I/O and 0 repository derivation;
- candidate concurrency remains `<= 4`;
- tolerated candidate failures preserve existing skip + bounded diagnostic behavior;
- directory/recovery error remains the single expected repository lifecycle error source.

Consumer/integration:

- `DocumentService` preserves document-id absent/present/error transitions and later recovery;
- Repo gating preserves zero-doc wait, transient-error survival, later document appearance, instance reuse, and idle cleanup;
- entity/widget prove initial loading only, `ready -> refreshing -> ready` without spinner flicker, sticky recovery/error, one repository error fact, and visibility projection;
- `exampleDocumentsCreate` proves successful fresh pre-inspection, rejected fresh read followed by successful creation, `FileExists` race, safety limit, loading, and final-error behavior;
- obsolete directory/split repository surfaces are removed with no production consumer left;
- existing Google Drive stale-listing proof remains provider-specific evidence and is not duplicated.

Browser/visual proof is required only if implementation changes actual interaction or appearance. #211 recovery proof remains owned by #211 and is not duplicated here.

## Required verification

Implementation preflight must resolve exact test/spec paths, impact metadata, and task-specific measurements from these contracts. Coding handoff uses normal `pnpm verify`; exact-head GitHub CI is the final repository execution gate.

## Forbidden

- public/RPC raw RxJS `Observable` return values;
- public directory lifecycle without a confirmed consumer;
- lifecycle reconstruction outside service owners;
- repository filename parsing/classification in entity/widget/feature code;
- global same-path read serialization or a new VFS scheduler;
- coordinator refresh-waiter machinery for the one-shot fresh-listing scenario;
- canonical reactive repository derivation performing a second `readDirectory()`;
- generic query fetch/refetch as a freshness guarantee;
- clearing terminal recovery/error merely because retry work started;
- duplicate refresh/error-source/public synchronization state;
- treating a plausible v3 filename candidate as confirmed decoded storage identity;
- a new recoverable repository derivation error contract without a confirmed failure scenario;
- separate visibility lifecycle/query;
- reviving a zero-demand-abandoned derivation or retaining upstream demand solely for it;
- extending #211 topology locking around directory reads;
- migrating confirmed dead directory-read surfaces instead of removing them;
- `fsNodeStat` redesign, polling, increased candidate concurrency, provider convergence policy, or Repo identity/cache/lifecycle changes.

## Implementation readiness

- #211 dependency: resolved and merged at `b264c816fda35205459a24840d9dcf8412cd121f`;
- post-#211 filesystem/repository/document/recovery consumers and dead-surface assumptions: re-checked;
- reactive and one-shot directory read responsibilities are separated; no global read-serialization guarantee remains;
- directory lifecycle, sticky error retry, repository lifecycle mapping, visibility classification, entity mapping, DocumentService/Repo preservation, starter-example failure behavior, worker boundary, topology interaction, I/O budgets, and proof ownership are resolved;
- exactly two stateful coordinators are required; the fresh imperative listing is stateless;
- `fsNodeStat`, provider convergence, Repo lifecycle, and operation-specific storage listings are explicitly out of scope;
- unresolved architecture blockers: none;
- architecture verdict: `ready`;
- implementation verdict: `ready for implementation-preflight`.
