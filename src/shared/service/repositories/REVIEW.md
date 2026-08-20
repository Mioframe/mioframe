# Review

Verdict: blocked

## Scope reviewed

- Repository-state architecture, storage classification, public worker/query contract, terminal failures, entity adaptation, Repository Explorer behavior, DocumentService and Repo consumers.

## Blockers

None.

## Major issues

### M1 — terminal repository derivation error contract is unresolved

Owner: `src/shared/service/repositories`

Problem: [the architecture handoff](../../../../docs/directory-state-reactivity.md) requires a terminal repository derivation failure to become a repository-owned typed/code/cause error, but it does not define the stable public error code/message or its contract owner. The current repository facts error enum contains only the tolerated candidate-read diagnostic code, so implementation would have to invent a public error contract.

Evidence:

- [Directory-state reactivity architecture](../../../../docs/directory-state-reactivity.md) — requires a repository-owned typed/code/cause terminal derivation error without naming its exact code/message contract.
- [Current repository facts error codes](./repositoryFactsErrorCode.ts) — only `storageCandidateReadFailed` exists, and that path is explicitly tolerated rather than terminal.
- [Current storage discovery](./repositoryStorageFiles.ts) — tolerated candidate read failures are captured once and skipped; unexpected derivation failures remain a distinct path.

Basis:

- [Source error rules](../../../AGENTS.md) — boundary failures must use a project-controlled safe message, stable enum code, and raw cause.
- [Service contract rules](../AGENTS.md) — public service error contracts belong in contract-only modules.
- [Architect handoff skill](../../../../.agents/skills/architect-handoff/SKILL.md) — public contracts and error behavior must be resolved before implementation.

Risk: implementations can invent incompatible codes/messages or reuse the tolerated diagnostic code for a terminal failure, leaving the public RepositoryState error contract unstable.

Required final state: name one exact repository-owned terminal derivation `DomainError` contract in a contract-only repository module, including stable enum code, safe project-controlled message, and raw `cause` preservation. The existing tolerated candidate-read diagnostic remains non-terminal and is not reused as the terminal state error.

Verification: repository tests assert the exact terminal error code/message/cause and separately prove tolerated candidate failures still skip with bounded diagnostics.

### M2 — entity mapping can recreate split lifecycle or change refresh UI behavior

Owner: `src/shared/service/repositories`

Problem: the handoff says the repository entity consumes one `RepositoryState`, but it does not define the replacement entity-facing lifecycle/error surface. `RepositoryState.loading` is query data, while generic `useObservableQuery.isLoading` becomes false on any emitted value; `refreshing` carries usable content; and generic query `refetch()` is not canonical revalidation. The current entity exports split errors plus `refetch`. Without an exact migration contract, implementation can show empty content during initial loading, spinner/flicker during refreshing, or retain duplicate legacy lifecycle/error/refetch APIs.

Evidence:

- [Directory-state reactivity architecture](../../../../docs/directory-state-reactivity.md) — `refreshing` carries a usable previous snapshot and generic query refetch is forbidden as a freshness guarantee, but the entity output mapping is not specified.
- [Observable query adapter](../../lib/useObservableQuery.ts) — transport `isLoading` is cleared by the first emitted value and `refetch()` resolves through generic query semantics, so neither represents canonical repository refresh lifecycle.
- [Current repository entity](../../../entities/repository/useRepository.ts) — returns `repositoryFactsError`, `repositoryVisibleEntriesError`, combined `isLoading`, and `refetch` from split queries.
- [Repository Explorer](../../../widgets/RepositoryExplorerWidget/RepositoryExplorerWidget.vue) — `isLoading` selects a spinner instead of content, so mapping `refreshing` to loading visibly changes existing behavior.

Basis:

- [Root architecture rules](../../../../AGENTS.md) — require narrow public APIs, removal of obsolete replacement paths, and preservation of existing scenarios.
- [Source ownership rules](../../../AGENTS.md) — service owns canonical lifecycle; entity may adapt facts but must not reconstruct or duplicate service lifecycle.
- [Architect handoff skill](../../../../.agents/skills/architect-handoff/SKILL.md) — final consumer-visible contract must be resolved before implementation.

Risk: the new service state machine can be correct internally while upper layers recreate a second lifecycle or introduce loading flicker on every invalidation.

Required final state: define the entity migration explicitly. Canonical initial repository `loading` is the only lifecycle state that selects the loading branch; `ready` and `refreshing` both expose their snapshot to content; `error` exposes one raw repository/recovery error fact; visibility is a synchronous projection. Remove obsolete split error aliases and entity `refetch` unless a confirmed consumer is found. Generic query transport state must not become a second repository refresh lifecycle.

Verification: entity/widget tests cover initial loading, `ready -> refreshing -> ready`, sticky error retry, one raw recovery/error candidate, removal of legacy split aliases/refetch consumers, and no spinner/content regression during `refreshing`.

### M3 — `automergeStorage` classification overstates a filename-only candidate fact

Owner: `src/shared/service/repositories`

Problem: [the proposed public snapshot](../../../../docs/directory-state-reactivity.md) labels an entry `kind: 'automergeStorage'`, but current visibility behavior intentionally classifies some files only as plausible storage candidates by filename. In particular, v3 `.mf` filenames remain candidates until wrapper bytes are decoded. Repository facts may therefore reject or skip a malformed/unreadable v3 candidate while visibility still hides that candidate when Automerge files are hidden. Calling this public classification confirmed `automergeStorage` either changes current visibility behavior if implementation waits for successful decode, or makes the DTO claim stronger knowledge than the service actually has if it remains filename-based.

Evidence:

- [Directory-state reactivity architecture](../../../../docs/directory-state-reactivity.md) — public `RepositoryEntry.kind` is `regular | automergeStorage` and entity visibility projects directly from it.
- [Repository storage classifiers](./repositoryStorageFiles.ts) — visibility uses `isRepositoryStorageCandidateFileName`, which is explicitly a plausible-candidate classifier.
- [Storage file policy](../../lib/automergeAdapter/storageFilePolicy.ts) — v3 `.mf` filename matching remains only a candidate until wrapper payload decoding confirms the logical storage key.
- [Repository storage tests](./repositoryStorageFiles.test.ts) — malformed/unreadable v3 candidates are skipped by repository-facts discovery, while visibility filtering is separately filename/candidate based.

Basis:

- [Source ownership rules](../../../AGENTS.md) — service must expose canonical storage facts rather than misleading upper-layer inference.
- [Service contract rules](../AGENTS.md) — public DTOs must be stable, narrow service contracts.
- [Architect handoff skill](../../../../.agents/skills/architect-handoff/SKILL.md) — public fields must have an independently required, accurately defined meaning and may not introduce a second drifting fact.

Risk: malformed/unreadable v3-looking files can unexpectedly become visible after migration, or the public DTO can falsely represent unconfirmed candidate files as confirmed Automerge storage. Either outcome changes or weakens an existing repository contract.

Required final state: expose only the service-owned classification actually needed for zero-I/O visibility. The non-regular classification must mean repository/Automerge **storage candidate for visibility**, not confirmed decoded storage identity. Marker files remain excluded. Facts discovery stays independent: a hidden plausible v3 candidate does not produce a document ID or initialization fact unless existing marker/decoded-storage rules establish those facts.

Verification: deterministic repository tests prove plausible malformed/unreadable v3 candidates preserve current hidden/visible behavior under the setting while still producing no document/init facts unless independently established; valid legacy/v2/v3 storage and marker behavior remains unchanged.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Removing public `RepositoryState.refreshing` is not required: it is an independent service-owned lifecycle fact needed to distinguish a usable previous snapshot from a clean current snapshot without reconstructing lifecycle above the service.

## Unresolved questions

None.
