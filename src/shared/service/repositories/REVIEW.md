# Review

Verdict: blocked

## Scope reviewed

- Repository-state architecture, public worker/query contract, repository derivation failures, entity adaptation, Repository Explorer behavior, DocumentService and Repo consumers.

## Blockers

None.

## Major issues

### M1 — terminal repository derivation error contract is unresolved

Owner: `src/shared/service/repositories`

Problem: [the architecture handoff](../../../../docs/directory-state-reactivity.md) requires a terminal repository derivation failure to become a repository-owned typed/code/cause error, but it does not define the stable public error code/message or its contract owner. The current repository facts error enum contains only the tolerated candidate-read diagnostic code, so the coding agent would have to invent a new public error contract.

Evidence:

- [Directory-state reactivity architecture](../../../../docs/directory-state-reactivity.md) — requires a repository-owned typed/code/cause terminal derivation error without naming its code/message contract.
- [Current repository facts error codes](./repositoryFactsErrorCode.ts) — only `storageCandidateReadFailed` exists, and that path is explicitly tolerated rather than terminal.
- [Current storage discovery](./repositoryStorageFiles.ts) — tolerated candidate read failures are captured once and skipped; unexpected derivation failures remain a distinct path.

Basis:

- [Source error rules](../../../AGENTS.md) — boundary failures must be wrapped in `DomainError` with a project-controlled safe message, stable enum code, and raw cause.
- [Service contract rules](../AGENTS.md) — public service DTO/error contracts belong in contract-only modules.
- [Architect handoff skill](../../../../.agents/skills/architect-handoff/SKILL.md) — public contracts and error behavior must be resolved before implementation.

Risk: different implementations can invent incompatible error codes/messages or accidentally reuse the tolerated diagnostic code for a terminal failure, making the public contract unstable and recovery/error handling harder to review.

Required final state: the handoff names one exact repository-owned terminal derivation `DomainError` contract, including stable enum code, safe message ownership, raw `cause` preservation, and contract-only location. The existing tolerated candidate-read diagnostic remains non-terminal and must not be reused as the terminal state error.

Verification: repository tests assert the exact terminal error code/message/cause contract and separately prove tolerated candidate failures still skip with bounded diagnostics.

### M2 — entity mapping can recreate the split lifecycle or change refresh UI behavior

Owner: `src/shared/service/repositories`

Problem: the handoff says the repository entity consumes one `RepositoryState`, but it does not define the replacement entity-facing lifecycle/error surface. `RepositoryState.loading` is delivered as ordinary query data, while generic `useObservableQuery.isLoading` becomes false on any emitted value; `refreshing` carries usable content; and generic `refetch()` is not a canonical revalidation. The current entity also exports two split error aliases plus `refetch`. Without an exact migration contract, implementation can either show empty content during initial `loading`, show a spinner/flicker during `refreshing`, or retain duplicate legacy error/refetch APIs.

Evidence:

- [Directory-state reactivity architecture](../../../../docs/directory-state-reactivity.md) — `refreshing` explicitly carries a usable previous snapshot and generic query refetch is forbidden as freshness, but the entity output mapping is not specified.
- [Observable query adapter](../../lib/useObservableQuery.ts) — transport `isLoading` is cleared by the first emitted value and `refetch()` resolves from the query's first value, so neither represents canonical repository refresh lifecycle.
- [Current repository entity](../../../entities/repository/useRepository.ts) — currently returns `repositoryFactsError`, `repositoryVisibleEntriesError`, combined `isLoading`, and `refetch` from the split queries.
- [Repository Explorer](../../../widgets/RepositoryExplorerWidget/RepositoryExplorerWidget.vue) — `isLoading` selects a spinner instead of content, so mapping `refreshing` to loading would visibly change existing behavior.

Basis:

- [Root architecture rules](../../../../AGENTS.md) — require narrow public APIs, removal of obsolete replacement paths, and preservation of existing user scenarios.
- [Source ownership rules](../../../AGENTS.md) — service owns canonical lifecycle; entity may adapt typed facts but must not reconstruct or duplicate service-owned state.
- [Architect handoff skill](../../../../.agents/skills/architect-handoff/SKILL.md) — final public contracts and affected consumer behavior must be resolved before implementation.

Risk: the migration can preserve the new service state machine internally while reintroducing duplicate lifecycle above it or causing loading flicker on every invalidation.

Required final state: define the entity migration explicitly: canonical initial `loading` is the only repository state that selects the loading branch; `ready` and `refreshing` both expose their snapshot to the content branch; `error` exposes one repository error fact; visibility remains a synchronous projection; obsolete split error aliases and the entity `refetch` surface are removed unless a confirmed consumer is found. Generic query transport state must not become a second repository refresh lifecycle.

Verification: entity/widget tests cover initial loading, `ready -> refreshing -> ready`, sticky error retry, one raw recovery/error candidate, no legacy split aliases/refetch consumer, and no spinner/content regression during `refreshing`.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Removing public `RepositoryState.refreshing` is not required: it is an independent service-owned lifecycle fact needed to distinguish a usable previous snapshot from a clean current snapshot without reconstructing lifecycle above the service.

## Unresolved questions

None.
