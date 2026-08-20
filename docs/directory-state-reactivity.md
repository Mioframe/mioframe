# Directory state reactivity architecture

Status: architecture ready; PR #211 is merged into `develop` at `b264c816fda35205459a24840d9dcf8412cd121f`, the affected contracts were re-checked against that result, and implementation may proceed through `implementation-preflight`.

## Goal

Provide one reliable reactive flow for directory-backed repository state that remains inexpensive on mobile devices and slow filesystems such as Google Drive and Android SAF.

Requirements:

- one canonical state owner per concern;
- no stale-result races or mixed repository snapshots;
- no subscriber-multiplied or unbounded filesystem I/O;
- explicit repository loading/refreshing/error semantics;
- narrow worker-safe public contracts with no duplicated facts.

## Confirmed current behavior and evidence

- `shared/service/fileSystem` starts a new `vfs.readDirectory()` for each matching VFS event; Promise-backed reads may overlap and are not physically cancelled by RxJS unsubscribe.
- current directory publication sorts entries by name before exposing them.
- generic observable-query loading/fetch semantics describe subscription startup/replay, not completion of a new physical revalidation.
- repository facts and repository-visible entries currently use separate lifecycles and are recombined above the service layer.
- v3 document discovery may read storage-candidate files after the listing; existing storage policy limits that I/O to 4 concurrent reads.
- repository candidate failures already classified as tolerable are skipped with bounded diagnostics rather than failing the whole repository read.
- `DocumentService` and internal Repo gating consume repository document-id state, so replacing split repository queries must preserve document availability/error behavior and the existing Repo cache lifecycle.
- merged PR #211 identifies unavailable-root recovery with transfer-safe `{ spaceName, recoveryKey }`; `recoveryKey` identifies the mounted provider instance and must not disappear merely because a reread starts.
- PR #211 also introduced the existing fileSystem topology mutation queue. It serializes topology-sensitive mutations/settlement, not general directory reads.
- Google Drive may return a stale listing immediately after mutation; serialization cannot guarantee provider convergence.
- provider `watch()` is an invalidation channel, not reliable observation of arbitrary external OS/rclone changes.
- `exampleDocumentsCreate` uses `directoryContent.fetch()` to choose the first free `Examples` directory and therefore requires a true fresh-read command.
- after #211, `entities/directory/useDirectory` and the root-directory read state exposed from `entities/mountedDirectories` still have no confirmed production consumer.

## Non-goals

- redesigning PR #211 recovery, `recoveryKey`, or the fileSystem topology queue;
- Automerge `Repo` identity/cache/lifecycle changes;
- `fsNodeStat` lifecycle/concurrency redesign;
- polling, arbitrary sleeps, unconditional double reads, or mandatory experimental observation;
- global VFS scheduling/serialization;
- provider-specific convergence or new large-directory cache/index infrastructure.

## Affected user scenarios

- initial repository-backed directory open across OPFS, Web File System Access, SAF/device, and Google Drive;
- provider/VFS invalidation and invalidation bursts during slow I/O;
- refresh failure with later recovery;
- #211 permission/unavailable-root recovery while revalidation runs;
- coherent Repository Explorer document/init/file facts;
- reactive document availability and Repo gating based on repository document IDs;
- explicit fresh listing for imperative callers;
- starter-example first-free-name selection with existing `FileExists` race fallback.

## Boundaries

Changes:

- one internal per-path directory lifecycle plus one public fresh-read command;
- one coherent repository lifecycle derived from canonical directory state;
- one proxy-safe public repository query;
- service-owned repository entry classification with zero-I/O visibility projection;
- migration/removal of old split/replay-based consumer paths and confirmed dead directory-read surfaces.

Must remain unchanged: #211 recovery/identity/topology-queue behavior, `fsNodeStat`, Automerge Repo cache/identity/lifecycle, document mutation semantics, persistence semantics, Repository Explorer interaction hierarchy, and provider convergence guarantees.

## Ownership matrix

| Owner | Responsibility |
| --- | --- |
| feature | `exampleDocumentsCreate` owns the create-example action, naming loop, action loading/error, and `FileExists` race fallback; it only consumes a fresh listing |
| entity | `repository` adapts the public repository query and applies presentation-safe synchronous projections; no storage classification, I/O, scans, or lifecycle reconstruction |
| widget | declarative recovery > error > loading > content composition only |
| page/pane | routing/navigation/layout only |
| shared | existing VFS/provider/storage-policy primitives; no generic reactive-resource manager |
| service/worker | filesystem service owns canonical directory ordering/lifecycle/refresh; repository service owns storage classification and repository derivation/lifecycle; document service consumes the repository document-id projection without owning it |

## Source of truth

- directory contents: latest clean, name-sorted snapshot committed by `shared/service/fileSystem` after `vfs.readDirectory(normalizedPath)`;
- repository state: latest complete derivation from one accepted directory snapshot plus required candidate reads;
- concrete documents: Automerge `Repo` / document service.

No upper layer owns a second directory/repository cache or lifecycle.

## Contracts and state shape

Public DTOs belong in contract-only `shared/service` modules. Do not define public DTO aliases in `use*Service` implementation files.

Use one canonical physical directory-entry contract:

```ts
type DirectoryEntry = readonly [name: string, stat: FSNodeStat];
type DirectoryEntries = readonly DirectoryEntry[];
```

Filesystem lifecycle is service-internal:

```ts
type DirectoryState =
  | { status: 'loading' }
  | { status: 'ready'; entries: DirectoryEntries }
  | { status: 'refreshing' }
  | { status: 'error'; error: Error };
```

The filesystem coordinator privately retains the latest successful entries only while needed. Do not duplicate that payload into `refreshing` or `error`.

Repository public contracts:

```ts
type RepositoryEntry = {
  entry: DirectoryEntry;
  kind: 'regular' | 'automergeStorage';
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

Repository marker files are protocol facts and are never published as `RepositoryEntry`. Automerge storage files are classified by the repository service; entity/widget code must not infer that classification from filenames.

Semantics:

- `loading`: no successful repository payload exists and required work is active/needed;
- `refreshing`: the previous successful repository snapshot remains usable while newer work is active/queued;
- `ready`: latest accepted work is complete with no newer known invalidation;
- `error`: latest required work failed; any previous successful payload may remain private for a later `refreshing` transition but is not duplicated into the error contract.

An existing error stays authoritative while retry/revalidation runs. Starting new I/O does not replace `error` with `loading`/`refreshing`; state changes only when the retry reaches a new terminal success or error. This preserves #211 recovery target continuity while rereads are in progress.

Error ownership stays in existing typed/code/cause contracts. Do not add a parallel error-source discriminator or public synchronization metadata.

## Internal and public entry points

Service-internal raw observables:

```ts
directoryState$({ path }: { path: string }): Observable<DirectoryState>;
repositoryState$({ path }: { path: string }): Observable<RepositoryState>;
```

Worker-facing contracts:

```ts
refreshDirectory(path: string): Promise<DirectoryEntries>;
repositoryState: QueryDefinition<RepositoryState, { path: string }>;
```

Rules:

- raw `$` observables remain service-internal implementation capabilities; do not introduce an RPC method whose return value is a raw RxJS `Observable`;
- the existing worker proxy pattern may continue to keep internal properties on service implementation objects, as it already does for `directoryContent$`, `fsNodeStat$`, and `vfs`; no `setupMainService` projection redesign is required by this work;
- public `repositoryState` uses the existing proxy-safe `defineObservableQuery(repositoryState$)` shape; no Observable transport abstraction is added;
- `refreshDirectory()` always requests canonical revalidation, resolves with the name-sorted clean entries satisfying that request, and rejects with the canonical filesystem error on terminal failure;
- replayed current state alone can never satisfy `refreshDirectory()`;
- refresh callers share the same coordinator/physical work and do not wait for repository derivation;
- repository visibility changes are synchronous projection of service-classified entries and cause no filesystem or repository-derivation work;
- remove generic filesystem `hideAutomergeFiles` and replaced split repository query APIs after consumers migrate;
- remove `entities/directory/useDirectory` and unused mounted-directory root read state rather than migrating them;
- `fsNodeStat` keeps its existing separate contract.

## Minimum sufficient design

### Filesystem directory coordinator

One coordinator per active normalized path owns only:

- latest successful sorted entries;
- current lifecycle/error;
- one `dirty` bit;
- one in-flight `readDirectory()`;
- one VFS watcher while work can still publish;
- subscriber and refresh-waiter bookkeeping.

Demand means at least one directory-state subscriber or unresolved `refreshDirectory()` waiter.

Algorithm:

1. normalize the path and attach the watcher before the first physical read can publish;
2. initial demand, invalidation, or explicit refresh sets `dirty = true`;
3. if demand exists and no read is active, clear `dirty` immediately before starting one `readDirectory()`;
4. sort a successful provider result once before it can become canonical;
5. invalidations during the read only set `dirty = true`;
6. a read that settles while dirty cannot publish authoritative `ready`; when demand remains, run one trailing read;
7. publish `ready` only when a successful read settles with `dirty === false`;
8. if a read fails while dirty and demand remains, continue with the trailing read; otherwise publish terminal `error` and reject affected refresh waiters;
9. while current state is `error`, later retry work runs internally without clearing that error; publish only the next terminal `ready` or `error`;
10. refresh waiters resolve only from the clean committed snapshot satisfying their request.

Lifetime:

- same-path subscribers/callers share one coordinator and physical work;
- uncancellable in-flight work keeps the coordinator and watcher until settlement even after the last subscriber leaves, so a quick resubscribe cannot lose invalidation knowledge;
- if demand returns before settlement, it reuses that coordinator;
- if no demand remains at settlement, do not publish the result or start trailing work; release coordinator, watcher, and retained snapshot;
- inactive settled paths perform no background reads;
- different paths are not globally serialized.

The coordinator does not acquire or extend #211's topology mutation queue. Topology mutations remain serialized by that queue; their VFS/provider events only invalidate this coordinator. Slow directory revalidation must never keep the topology queue held.

### Repository derivation coordinator

One coordinator per active normalized repository path owns only:

- latest complete snapshot;
- current lifecycle/error;
- at most one active derivation;
- latest pending accepted directory snapshot;
- subscription bookkeeping.

Repository demand means an active public repository-state subscription or a service-internal consumer such as the document-id/Repo projection.

Rules:

1. consume internal `directoryState$`; canonical repository-state derivation performs no second `readDirectory()`;
2. only directory `ready` may start candidate discovery;
3. classify marker/Automerge-storage/regular entries in the repository service from that same accepted directory snapshot;
4. marker files contribute to initialization but are not published as entries;
5. derive document IDs and keep candidate-read concurrency at the existing limit `4`;
6. candidate failures already treated as tolerable remain skip + bounded diagnostic and do not become `RepositoryState.error`;
7. only a real terminal repository-boundary derivation failure produces a repository-owned typed/code/cause error;
8. at most one derivation is physically active per normalized path;
9. any newer directory `refreshing`, `error`, or `ready` state makes an older active derivation non-publishable;
10. retain at most the newest pending accepted `ready` snapshot and derive it after active work settles;
11. while repository state is `error`, retry derivation does not clear that error until the next terminal success/error;
12. publish only complete atomic repository snapshots.

Lifetime:

- while demand exists, subscribe to canonical `directoryState$`;
- when demand reaches zero during an active derivation, mark that derivation non-publishable, release upstream directory demand, and retain only ownership of the uncancellable physical work until settlement;
- a consumer returning before settlement reattaches to canonical directory state and queues only the latest accepted `ready` input; it does not revive the abandoned derivation or start a second one;
- when the abandoned derivation settles, discard it and derive the latest queued accepted input only if demand still exists;
- with zero demand after settlement, discard pending input/state and release the coordinator.

This reuses private stale-result suppression already required for invalidated inputs; it adds no public generation, token, lease, or lifecycle metadata.

Lifecycle mapping:

| Input | RepositoryState |
| --- | --- |
| directory `loading`, no previous snapshot | `loading` |
| directory `ready(A)`, no active repository error | derive A; `loading` without previous payload, otherwise `refreshing(previous)` |
| directory `refreshing`, no active repository error | invalidate active derivation; `refreshing(previous)` or `loading` if none exists |
| directory `error(E)` | invalidate active derivation; `error(E)` preserving filesystem error semantics |
| current repository derivation succeeds | `ready(result)` |
| current repository derivation fails terminally | `error(repositoryError)` |
| repository/directory error retry starts | keep existing `error` until next terminal success/error |
| demand reaches zero during derivation | suppress completion and release upstream demand |

Structurally equal listings are not a trustworthy cross-provider identity for candidate contents, so equality alone does not skip required repository discovery.

### Repository projections and consumers

Service-owned storage classification must not leak into entity code. The repository entity may only project already-classified entries:

```ts
visibleEntries = snapshot.entries
  .filter(({ kind }) => showAutomergeFiles || kind === 'regular')
  .map(({ entry }) => entry);
```

This projection owns no lifecycle and performs zero I/O.

`DocumentService` and internal Repo gating consume a service-internal document-id projection of `repositoryState$`:

- `ready(snapshot)` and `refreshing(snapshot)` expose `snapshot.documentIds`;
- `error(error)` exposes the error through the existing internal error path;
- `loading` emits no document-list value yet.

Preserve existing behavior:

- zero document IDs do not instantiate a Repo solely for discovery;
- a transient filesystem/repository error does not destroy the reactive Repo stream;
- documents appearing later can make Repo/document access available without remounting;
- existing Repo instance reuse and 60-second idle cache lifecycle remain unchanged;
- concrete document reads/changes remain owned by Repo/document service.

Delete/export/import and other operation-specific storage flows may still perform their own required directory reads. The no-duplicate-listing invariant applies only to canonical reactive repository-state derivation.

### Consumer migration/removal

- `shared/service/repositories`: consume internal `directoryState$`; expose one public `repositoryState` query and internal projections required by Repo/document service.
- `shared/service/document`: migrate from the split document-id query to the repository-state document-id projection while preserving document availability/error behavior.
- `features/exampleDocumentsCreate`: replace `directoryContent.fetch()` with `refreshDirectory()`; preserve naming/race/action behavior.
- `entities/repository` and Repository Explorer: consume one repository lifecycle; entity applies only the service-classified visibility projection.
- remove old `repositoryFacts`, `repositoryVisibleEntries`, and generic filesystem Automerge-visibility resource identity after all consumers migrate.
- remove `entities/directory/useDirectory` and its barrel export; remove unused mounted-directory `rootDirectory`/root-read `errorMessage`/`isLoading` state while preserving the separate `deviceFiles` facade and #211 recovery APIs.

## Minimum-complexity check

Exactly two new stateful coordination points are necessary:

1. directory coordinator because Promise-backed reads cannot be cancelled reliably;
2. repository coordinator because candidate discovery is a separate async phase whose stale completion must be suppressed.

No third coordinator, generation protocol, topology integration, global manager, route identity, or Observable transport abstraction is required.

Rejected alternatives:

- `switchMap(readDirectory())`: still permits physical overlap;
- public `DirectoryState`: no confirmed UI consumer and unnecessarily widens the client contract;
- UI/entity `isRefreshing`: duplicates service lifecycle;
- `Promise<ready|error>` refresh result: duplicates Promise success/failure;
- combined filesystem/repository coordinator: mixes ownership;
- entity filename classification: leaks repository storage protocol upward;
- separate visibility query: recreates split lifecycle/state;
- keeping upstream directory demand alive only to protect an abandoned repository derivation: creates unnecessary background I/O;
- extending #211 topology locking across directory reads: couples independent concerns and can hold topology mutation behind slow provider I/O;
- directory+stat state or `fsNodeStat` coordinator: unrelated scope;
- generic manager/global scheduler/equal-listing cache/polling: broader or less reliable than required.

## Shared UI blast radius

None. No Material/shared UI contract changes. Existing Repository Explorer interaction and appearance must be preserved.

## Acceptance matrix

| Contract | Required outcome |
| --- | --- |
| initial directory work | one canonical sorted read; no stale completion publishes |
| refresh | cannot complete from replay alone; resolves/rejects from the satisfying canonical revalidation |
| error retry | existing error remains observable while retry runs; changes only on terminal success/new error |
| #211 recovery | retry does not transiently erase current `{ spaceName, recoveryKey }`; topology queue behavior is unchanged and never waits for directory revalidation |
| same-path FS concurrency | physical `readDirectory()` concurrency `<= 1`; burst collapses to one dirty/trailing read |
| FS lifetime | watcher exists before first publish; unsubscribe/resubscribe cannot lose invalidation or create overlap |
| cleanup | zero-demand settled paths retain no coordinator/watch/snapshot and perform no background reads |
| repository coherence | IDs, initialization, and classified entry facts publish atomically from one directory snapshot |
| repository concurrency | active derivations per normalized path `<= 1`; stale/abandoned completion suppressed; latest pending wins |
| repository zero-demand | last unsubscribe abandons publication and releases upstream demand; resubscribe cannot overlap or revive old work |
| visibility | setting changes cause `0` FS reads and `0` repository derivations; entity never parses storage filenames |
| candidate failures | existing tolerable failures remain skip + bounded diagnostic; real terminal failures use repository-owned errors |
| documents/Repo | document availability/error behavior and existing Repo reuse/idle lifecycle remain unchanged |
| ordering | provider order is normalized to existing name-sorted canonical order before publication/refresh return |
| starter examples | fresh listing selects first free name; `FileExists` fallback remains |
| unchanged scope | `fsNodeStat`, Repo identity/cache policy, provider convergence, topology queue, and unrelated storage operations remain unchanged |

## Risk matrix

| Risk | Treatment |
| --- | --- |
| slow/cloud/SAF I/O | per-path serialization, dirty coalescing, bounded candidate concurrency |
| stale completion | commit suppression at both async boundaries; filesystem watcher retained while in-flight work can still publish |
| zero-demand derivation gap | abandoned derivation becomes non-publishable while physical ownership prevents overlap |
| recovery target flicker | sticky terminal error until new terminal outcome |
| topology coupling | coordinator consumes invalidation only; never holds #211 topology queue |
| worker boundary drift | only existing query/command shapes are public; no raw-Observable RPC |
| protocol leakage | repository service classifies storage entries before publication |
| document regression | explicit DocumentService/Repo projection and preservation proof |
| provider eventual consistency | explicitly unsolved; no generic retry/polling |
| stale imperative listing | `refreshDirectory()` replaces replay-based fetch where freshness is required |

## Required test proof

Primary proof: deterministic service/unit tests.

Filesystem:

- canonical name ordering from unsorted provider input;
- same-path physical read concurrency `<= 1`;
- burst coalescing and subscriber/refresh sharing;
- watcher active before first result may publish;
- explicit refresh cannot resolve from replay and returns the satisfying clean sorted snapshot or canonical terminal error;
- normalized-equivalent paths share one coordinator;
- unsubscribe/resubscribe during uncancellable read cannot overlap, lose invalidation, or publish stale completion;
- zero-demand settlement starts no trailing background read;
- error stays published through retry until terminal result;
- #211 provider/topology invalidations cause revalidation without extending topology queue ownership;
- inactive cleanup.

Repository:

- complete directory-to-repository transition matrix including sticky error retry;
- canonical repository derivation performs zero additional `readDirectory()` calls;
- normalized-equivalent paths share one derivation coordinator;
- active derivation `<= 1`, stale suppression, latest-pending coalescing;
- zero-demand abandonment/resubscribe behavior and no-overlap;
- marker initialization and Automerge-storage classification are service-owned and atomic;
- visibility changes produce no filesystem I/O or repository derivation;
- candidate concurrency bound remains `<= 4`;
- existing tolerable candidate-read failure/diagnostic behavior is preserved;
- filesystem/repository errors remain recoverable/distinguishable through existing error contracts without source metadata.

Consumer/integration:

- `DocumentService` preserves document-id absent/present/error transitions and later recovery through the new internal projection;
- repositories preserve zero-doc Repo gating, transient-error survival, later document appearance, instance reuse, and idle cleanup;
- `exampleDocumentsCreate` preserves first-free-name, `FileExists` race, loading, and error behavior;
- repository entity/widget tests prove single-state adaptation, visibility projection, and declarative branch wiring only;
- obsolete `useDirectory` and mounted root-read surfaces are removed with no production consumer left;
- existing Google Drive stale-listing test remains evidence that convergence is provider-specific.

Browser/visual proof is required only if implementation changes actual interaction or appearance. #211 recovery proof is already owned by #211 and is not duplicated here.

## Required verification

Implementation preflight must resolve exact test/spec paths, impact metadata, and any task-specific measurement from the contracts above. Coding handoff uses normal `pnpm verify`; exact-head GitHub CI is the final repository execution gate.

## Forbidden

- an RPC/public method returning a raw RxJS `Observable`;
- public directory lifecycle without a confirmed consumer;
- lifecycle reconstruction outside service owners;
- repository storage classification or filename parsing in entity/widget/feature code;
- filesystem refresh waiting for repository derivation;
- parallel same-path directory reads or repository derivations;
- canonical repository-state derivation performing a second `readDirectory()`;
- generic query fetch/refetch as a freshness guarantee;
- clearing terminal recovery/error merely because retry work started;
- duplicate refresh/error-source state, duplicate physical-entry aliases, or public synchronization metadata;
- separate visibility lifecycle/query;
- reviving a zero-demand-abandoned repository derivation or keeping upstream directory demand alive solely for it;
- extending #211 topology locking around directory revalidation;
- migrating confirmed dead directory-read surfaces instead of removing them;
- `fsNodeStat` redesign, polling, global scheduler, increased candidate concurrency, provider convergence policy, or Repo identity/cache/lifecycle changes in this scope.

## Implementation readiness

- #211 dependency: resolved and merged into `develop` at `b264c816fda35205459a24840d9dcf8412cd121f`;
- post-#211 filesystem/repository/document/recovery consumers and dead-surface assumptions: re-checked;
- goal, scenarios, boundaries, ownership, source of truth, state/API contracts, retry/lifetime transitions, worker boundary, topology interaction, service classification, document/Repo consumers, I/O budgets, and proof ownership: resolved;
- exactly two stateful coordinators are required; no additional architecture mechanism is unresolved;
- `fsNodeStat` and provider convergence: explicitly out of scope;
- unresolved architecture blockers: none;
- architecture verdict: `ready`;
- implementation verdict: `ready for implementation-preflight`.
