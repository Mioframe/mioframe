# Directory state reactivity

Status: **architecture ready; implementation present; final semantic acceptance blocked by active owner-local review findings**.

This document is the architecture source of truth for the directory-state-reactivity refactor. The current implementation preflight is recorded in `docs/directory-state-reactivity-implementation-preflight.md`. The worker-publication correction is recorded in `docs/directory-state-reactivity-worker-boundary-correction.md`. The active final-review correction handoff is recorded in `docs/directory-state-reactivity-final-review-correction.md`.

## Goal

Replace subscriber-driven directory reads and split repository facts with one coherent reactive directory lifecycle and one atomic repository lifecycle, while preserving current recovery, Repo, storage, provider, and UI behavior.

The user-visible result must be:

- directory/repository state updates after provider/VFS invalidation without stale or mixed snapshots;
- refreshing retained repository content does not flicker back to a spinner;
- recoverable filesystem errors remain recoverable state instead of terminating streams;
- a folder with no documents can later become a repository without reopening the view;
- filesystem/repository work is not multiplied by subscribers;
- storage-file visibility is a synchronous presentation choice, not another lifecycle/read path.

## Non-goals

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

## Minimum-complexity decision

Exactly **two** new stateful coordinators are required:

1. directory coordinator for uncancellable reactive reads/invalidation coalescing;
2. repository coordinator for separate uncancellable candidate derivation/stale suppression.

`readDirectoryFresh()` is a stateless command, not a third coordinator.

Rejected because unnecessary or incorrect: `switchMap` alone, global VFS scheduler, refresh waiters in coordinator, public `DirectoryState`, combined coordinator, entity filename parsing, confirmed-storage label for v3 candidates, separate visibility query, new terminal repository error, topology locking around reads, generic manager/generation/polling/equality cache, `fsNodeStat` redesign.

## Filesystem coordinator

One coordinator per normalized active path owns:

- current `DirectoryState`;
- demand/subscriber count;
- dirty bit;
- at most one coordinator-owned physical read;
- one path watcher while demanded or while an uncancellable read still owns settlement.

Lifecycle:

1. first demand registers watcher before starting read and publishes `reading`;
2. a matching invalidation while `ready` synchronously publishes `reading` and marks the path dirty;
3. invalidation during a read only marks dirty; it never starts a second concurrent coordinator read;
4. before every physical read, clear dirty;
5. if the read settles while dirty, discard that settlement and, if demand remains, perform exactly one trailing read;
6. a clean success publishes sorted `ready`;
7. a clean failure publishes `error`;
8. retry from `error` keeps the existing error visible until a replacement clean result is accepted;
9. last unsubscribe during an uncancellable read does not abandon ownership early: retain coordinator/watcher until that read settles;
10. if demand is still zero at settlement, discard the result, do not start a trailing read, and fully release the coordinator;
11. a quick resubscribe before that settlement reuses the same coordinator and current in-flight read.

Different normalized paths are independent. The #211 topology mutation queue is not extended around reads or invalidation.

## Fresh one-shot read

`readDirectoryFresh(path)`:

1. normalizes the path;
2. performs exactly one `vfs.readDirectory(normalizedPath)`;
3. sorts entries by name;
4. resolves or rejects with that read result.

It has no watcher, coordinator demand, retry state, replay/cache, or coupling to `directoryState$`. It may overlap any reactive read or operation-specific listing.

## Repository coordinator

One coordinator per normalized repository path owns:

- current `RepositoryState`;
- at most one active derivation;
- latest pending accepted directory `ready` input;
- upstream directory-state demand while repository demand exists;
- zero-demand abandonment semantics for uncancellable derivation.

Directory input handling:

- directory `reading` immediately makes any active derivation non-publishable;
- directory `error` immediately makes any active derivation non-publishable and publishes that canonical error;
- every newly accepted directory `ready`, even when value-equal to the previous listing, schedules a fresh repository derivation;
- if a derivation is already active, replace the pending input with the newest accepted ready snapshot;
- never run more than one derivation concurrently.

Public state while deriving:

- before first successful snapshot: `loading`;
- after a successful snapshot: `refreshing` with that retained snapshot;
- after directory `error`: keep that error visible while the first replacement derivation is pending; do not clear recovery/error merely because retry began.

Derivation settlement:

- accepted success publishes one atomic `ready` snapshot;
- stale/invalidated completion never publishes;
- after settlement, process only the newest pending accepted ready input;
- unexpected programmer/invariant failures are diagnostic defects, not a new public lifecycle state;
- with zero demand, release upstream immediately; an already-running uncancellable derivation remains owned until settlement but cannot publish or retain upstream demand solely for itself;
- a resubscribe before settlement may queue the latest accepted input, but must not revive an abandoned result.

No generation counter/token/lease is required. Ownership is expressed directly by current active derivation, pending input, demand, and invalidation state.

## Repository derivation

Repository derivation receives the already accepted `DirectoryEntries` snapshot. It must not perform another canonical `vfs.readDirectory(path)`.

From that one listing plus bounded candidate reads, produce one atomic `RepositorySnapshot`:

- `documentIds` — unique discoverable Automerge document ids;
- `isInitialized` — repository marker/storage initialization fact;
- `entries` — all non-marker directory entries plus service-owned visibility classification.

Classification:

- ordinary file/directory -> `regular`;
- plausible repository storage filename -> `automergeStorageCandidate`;
- marker files are omitted from published entries.

For v3 candidate filenames, plausibility is not successful decoding. Unreadable/malformed plausible candidates remain hidden/shown according to current storage-file visibility policy, but contribute no false document id or initialization fact. Candidate read failures keep existing bounded diagnostics/tolerance behavior.

Candidate-specific storage reads use the existing shared storage policy concurrency bound (`<= 4`). Do not increase it.

## Repository service projections

`repositoriesService` owns one repository coordinator instance and may expose internal projections to other same-worker services.

`documentIds$` is an internal projection:

- `ready` / `refreshing` -> current snapshot ids;
- `error` -> existing error-as-value path so DocumentService and Repo gating remain recoverable;
- `loading` -> no value;
- zero ids does not create a Repo for ordinary `getRepo$(path)` access;
- if ids later appear, the existing subscriber can receive/create the Repo;
- current Repo reuse and 60-second idle cleanup remain unchanged.

`documentIds$` is not worker/UI public API.

## Entity contract

`entities/repository/useRepository` owns exactly one `repositoryState` query.

Mapping:

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
- implementation semantic review: **blocked by active owner-local PR findings**; correction scope is fixed in `docs/directory-state-reactivity-final-review-correction.md` and the architecture itself remains unchanged;
- final automatic acceptance gate: exact-head GitHub CI, architect-owned after those findings are closed.
