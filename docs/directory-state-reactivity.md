# Directory state reactivity architecture

Status: **ready** on current `develop` (`9427fa4aea0b4fea0c72ea4ef4dd8d94711d6121`). PR #211 remains the foundational recovery/topology baseline at `b264c816fda35205459a24840d9dcf8412cd121f`; affected filesystem, repository, document, recovery, and dead-surface assumptions were re-checked after the branch was synchronized.

## Goal

One reliable reactive flow for directory-backed repository state, bounded on slow/mobile filesystems:

- no stale/mixed snapshots;
- no subscriber-multiplied reactive reads;
- one lifecycle owner per concern;
- narrow worker-safe contracts;
- no duplicated derived facts.

## Baseline facts used for the decision

At the approval baseline before this architecture was implemented:

- filesystem reactivity could overlap Promise-backed `vfs.readDirectory()` calls; unsubscribe did not physically cancel them;
- directory results were name-sorted;
- repository facts and visible entries had separate reactive lifecycles;
- repository v3 discovery was a second async phase and existing storage policy bounded candidate reads to `4`;
- expected candidate failures were tolerant: unreadable candidate -> skip + bounded diagnostic, `FileNotFound` race -> skip, malformed wrapper -> no fact;
- `DocumentService` and Repo gating depended on repository document IDs; Repo reuse and 60-second idle lifecycle were established behavior;
- #211 recovery identity was `{ spaceName, recoveryKey }`; starting a retry must not transiently erase the current recovery target;
- #211 topology queue owned topology-sensitive mutation/settlement only, not ordinary reads;
- provider `watch()` was invalidation, not arbitrary external filesystem observation; Google Drive convergence remained provider-specific;
- starter-example directory pre-inspection was best-effort; authoritative collision handling was `createDirectory` + `FileExists` retry;
- `entities/directory/useDirectory` and mounted root-directory read state had no confirmed production consumer after #211.

## Non-goals / unchanged

Do not redesign:

- #211 recovery, `recoveryKey`, or topology queue;
- `fsNodeStat`;
- Automerge Repo identity/cache/lifecycle;
- document mutations/persistence;
- delete/export/import operation-specific storage listings;
- provider convergence.

Do not add polling, global VFS scheduling, a generic reactive-resource manager, generation protocol, or new recoverable repository-error taxonomy.

## Scenarios and ownership

Affected scenarios: initial repository open, VFS/provider invalidation bursts, read error + recovery, #211 unavailable-root/permission recovery, coherent Explorer facts, DocumentService/Repo availability, and starter-example name pre-inspection.

| Owner                         | Final responsibility                                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `shared/service/fileSystem`   | canonical reactive directory lifecycle/order; stateless fresh one-shot listing                                   |
| `shared/service/repositories` | storage visibility classification; atomic repository derivation/lifecycle; internal document-id/Repo projections |
| `shared/service/document`     | document behavior only; consumes repository projection                                                           |
| `entities/repository`         | adapts one repository state and synchronous visibility projection                                                |
| Repository Explorer widget    | recovery > error > initial loading > content composition only                                                    |
| `exampleDocumentsCreate`      | best-effort name pre-read, bounded naming loop, `FileExists`, action loading/error                               |

Source of truth:

- reactive directory: latest clean sorted snapshot accepted by filesystem coordinator;
- one-shot listing: only that requested physical read; it is not reactive state/cache;
- repository: one complete derivation from one accepted directory snapshot plus bounded candidate reads;
- document contents: Automerge Repo/document service.

## State and public contracts

Public DTOs belong in contract-only `shared/service` modules.

```ts
type DirectoryEntry = readonly [name: string, stat: FSNodeStat];
type DirectoryEntries = readonly DirectoryEntry[];

type DirectoryState =
  | { status: 'reading' }
  | { status: 'ready'; entries: DirectoryEntries }
  | { status: 'error'; error: Error };
```

`DirectoryState` is service-internal. Once it leaves `ready`, old directory entries are not a second lifecycle payload; the repository owns any usable previous `RepositorySnapshot` through its own state.

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

`automergeStorageCandidate` is only the service-owned visibility fact used by current hide/show policy. It does not claim that a v3 wrapper decoded successfully. Marker files are never published as entries.

Expected repository lifecycle errors come from canonical directory/filesystem errors. Do **not** introduce a new terminal repository `DomainError`: current expected candidate failures already normalize to skip/diagnostic/no fact. Unexpected programmer/invariant failures are defects, not a new recoverable public contract.

Internal entry points:

```ts
directoryState$({ path }: { path: string }): Observable<DirectoryState>;
repositoryState$({ path }: { path: string }): Observable<RepositoryState>;
```

Worker-facing entry points:

```ts
readDirectoryFresh(path: string): Promise<DirectoryEntries>;
repositoryState: QueryDefinition<RepositoryState, { path: string }>;
```

Rules:

- raw `$` streams remain service-internal; no raw-Observable RPC/transformer;
- existing worker proxy pattern remains; no `setupMainService` redesign;
- public `repositoryState` uses existing `defineObservableQuery(repositoryState$)`;
- `readDirectoryFresh()` is one independent normalized + sorted physical read; no replay, cache, watcher, dirty bit, waiter registry, retry loop, or repository coupling;
- it may overlap reactive or operation-specific reads; no global same-path serialization is promised.

## Minimum design

### Filesystem reactive coordinator

One coordinator per active normalized path owns only current `DirectoryState`, one `dirty` bit, at most one coordinator-owned `readDirectory()`, one watcher while in-flight work may publish, and subscriber bookkeeping.

Transition contract:

1. first demand attaches watcher, publishes `reading`, starts one read;
2. `ready` + matching invalidation synchronously publishes `reading` before starting/queuing reread;
3. invalidation during read sets `dirty`; remain `reading`;
4. clear `dirty` immediately before each physical reactive read;
5. successful result is sorted once;
6. settle while dirty cannot publish; with demand, run one trailing read;
7. clean success -> `ready(entries)`;
8. failure while dirty with demand is superseded by trailing read;
9. clean failure -> `error(error)`;
10. while `error` is current, retry runs internally without clearing it; clean success -> `ready`, clean failure -> replacement `error`.

Lifetime/invariants:

- coordinator-owned same-path `readDirectory()` concurrency `<= 1`;
- same normalized path subscribers share the coordinator;
- if last subscriber leaves during uncancellable read, keep coordinator+watcher until settlement; quick resubscribe reuses it;
- with zero demand at settlement, discard result, start no trailing read, release coordinator/watch/state;
- inactive settled paths do no background I/O;
- different paths are not serialized;
- coordinator never acquires/extends #211 topology queue.

### Fresh one-shot read

`readDirectoryFresh()` performs exactly: normalize -> one `vfs.readDirectory()` -> same name sort -> resolve/reject. It is stateless and intentionally does not join the reactive coordinator.

### Repository coordinator

One coordinator per active normalized repository path owns current `RepositoryState`, at most one active derivation, latest pending accepted `ready` directory snapshot, and subscriptions.

Rules:

1. consume `directoryState$`; canonical repository derivation performs `0` additional `readDirectory()` calls;
2. directory `reading` or `error` immediately makes older active derivation non-publishable;
3. only directory `ready(entries)` starts discovery;
4. from that same snapshot, repository service classifies marker / storage candidate / regular entries; marker contributes to init but is not published;
5. document-ID discovery uses current tolerant storage policy, candidate concurrency `<= 4`;
6. only latest pending accepted `ready` input survives while derivation is active;
7. active derivation per normalized path `<= 1`; stale/abandoned completion never publishes;
8. publish only complete atomic snapshots.

Lifecycle:

| Directory/input                  | RepositoryState                                       |
| -------------------------------- | ----------------------------------------------------- |
| `reading`, no previous snapshot  | `loading`                                             |
| `reading`, previous snapshot     | `refreshing(previous)`                                |
| `ready(A)`, no previous snapshot | derive A; remain `loading`                            |
| `ready(A)`, previous snapshot    | derive A; remain `refreshing(previous)`               |
| `error(E)`                       | suppress active derivation; `error(E)`                |
| `ready(A)` after error           | derive A while keeping existing `error` until success |
| accepted derivation succeeds     | `ready(result)`                                       |

Error retry is therefore sticky across both filesystem retry and the first replacement repository derivation; #211 recovery target disappears only on replacement `ready` or a new terminal directory error.

Zero-demand derivation:

- mark active work non-publishable and release upstream directory demand;
- retain ownership of the uncancellable derivation only until settlement so another same-path derivation cannot overlap;
- resubscribe before settlement reattaches to directory state and stores only latest accepted input; old work is never revived;
- zero demand after settlement releases coordinator state.

No public generation/token/lease metadata.

## Consumer mapping

Entity visibility is synchronous and I/O-free:

```ts
visibleEntries = snapshot.entries
  .filter(({ classification }) => showAutomergeFiles || classification === 'regular')
  .map(({ entry }) => entry);
```

Entity/widget lifecycle mapping:

- before first service state arrives, query transport pending may represent initial loading only;
- after that, generic query `isLoading`/`refetch` is not repository lifecycle/freshness;
- `loading` -> loading branch;
- `ready` and `refreshing` -> content from snapshot; refreshing must not flicker to spinner;
- `error` -> one repository raw error for safe message/recovery parsing;
- remove split repository error aliases and entity `refetch` unless preflight finds a real current consumer;
- `fsNodeStat` / `directoryStatError` remains separate and unchanged.

Document-id/Repo internal projection:

- `ready`/`refreshing` -> `snapshot.documentIds`;
- `error` -> existing error path;
- `loading` -> no document-list value yet;
- transient error must not destroy reactive Repo stream;
- zero IDs do not create Repo only for discovery;
- later documents become available without remount;
- existing Repo reuse + 60-second idle cleanup remain exact.

Starter examples:

- use `readDirectoryFresh()` only for best-effort occupied-name pre-inspection;
- rejected read -> empty known-name set, then continue existing bounded create loop;
- `createDirectory`/`FileExists` remains authoritative.

Remove after migration:

- old filesystem `directoryContent` query / generic `hideAutomergeFiles` read identity once all consumers are gone;
- old `repositoryFacts` / `repositoryVisibleEntries` split queries;
- `entities/directory/useDirectory` + barrel export;
- mounted-directory `rootDirectory`, root-read `errorMessage`, root-read `isLoading`;
- preserve mounted `deviceFiles`, actions, and #211 recovery APIs.

## Minimum-complexity decision

Exactly **two** new stateful coordinators are required:

1. directory coordinator for uncancellable reactive reads/invalidation coalescing;
2. repository coordinator for separate uncancellable candidate derivation/stale suppression.

`readDirectoryFresh()` is a stateless command, not a third coordinator.

Rejected because unnecessary or incorrect: `switchMap` alone, global VFS scheduler, refresh waiters in coordinator, public `DirectoryState`, combined coordinator, entity filename parsing, confirmed-storage label for v3 candidates, separate visibility query, new terminal repository error, topology locking around reads, generic manager/generation/polling/equality cache, `fsNodeStat` redesign.

## Acceptance and proof

Deterministic service/unit proof is primary.

Filesystem must prove:

- canonical sorting;
- synchronous `ready -> reading` invalidation;
- coordinator-owned same-path read concurrency `<= 1`;
- burst/trailing coalescing and stale suppression;
- watcher-before-publish;
- normalized-equivalent path sharing;
- unsubscribe/resubscribe gap and zero-demand cleanup;
- sticky error retry;
- #211 invalidation without topology-queue extension;
- `readDirectoryFresh()` performs one independent sorted physical read and is never replay-backed.

Repository must prove:

- complete directory -> repository lifecycle matrix;
- `0` duplicate canonical listings;
- normalized-equivalent path sharing;
- derivation concurrency `<= 1`, latest-pending, stale/zero-demand suppression;
- atomic IDs/init/visibility classification;
- malformed/unreadable plausible v3 candidate: current hide/show behavior preserved, no false document/init fact, existing bounded diagnostics;
- visibility setting causes `0` FS reads and `0` derivations;
- candidate concurrency `<= 4`;
- directory/recovery error is the only expected repository lifecycle error source.

Consumers must prove:

- DocumentService and Repo gating preserve absent/present/error/recovery, zero-doc wait, later appearance, reuse, idle cleanup;
- entity/widget: initial loading only, `ready -> refreshing -> ready` content continuity, sticky error, one repository error fact, visibility projection;
- starter examples: successful fresh pre-read, rejected pre-read followed by successful create, `FileExists` race, safety limit, loading, final error;
- obsolete surfaces have no remaining production consumer.

Browser/visual proof is required only if implementation actually changes interaction/appearance. #211 browser recovery proof remains owned by #211. Provider-convergence proof remains provider-specific.

Implementation preflight resolves exact test/spec paths and impact metadata. Required task-specific proof must exist in the repository; coding agents may use focused verifier-managed checks when useful. Broad automatic local verification is not a coding-agent handoff gate. Exact-head GitHub CI is the architect-owned final automatic repository gate.

## Forbidden

- raw Observable public/RPC API;
- public directory lifecycle without consumer;
- upper-layer lifecycle or storage-filename reconstruction;
- global same-path read serialization/new scheduler;
- refresh-waiter coordination for the one-shot read;
- duplicate canonical repository listing;
- generic query refetch as freshness;
- clearing recovery/error on retry start;
- duplicate error-source/synchronization state;
- treating plausible v3 filename as confirmed decoded storage;
- new recoverable repository derivation error without a confirmed scenario;
- separate visibility lifecycle;
- reviving abandoned derivation or retaining upstream demand solely for it;
- topology queue around reads;
- `fsNodeStat`, polling, convergence policy, candidate-concurrency increase, or Repo lifecycle change.

## Readiness

- #211 dependency: resolved;
- ownership/source of truth/state/API/lifecycle/error/consumer contracts: resolved;
- reactive vs one-shot read responsibility: resolved;
- exactly two stateful coordinators justified; no third mechanism required;
- proof ownership and unchanged scope: resolved;
- unresolved architecture blockers: none;
- architecture verdict: **ready**;
- implementation semantic review: **ready**; no active owner-local `REVIEW.md` findings remain;
- final automatic acceptance gate: exact-head GitHub CI, architect-owned.
