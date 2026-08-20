# Review

Verdict: blocked

## Scope reviewed

- Repository-state architecture, storage classification, public worker/query contract, failure semantics, entity adaptation, Repository Explorer behavior, DocumentService and Repo consumers.

## Blockers

None.

## Major issues

### M1 — a new terminal repository derivation error path is not justified by current failures

Owner: `src/shared/service/repositories`

Problem: [the architecture handoff](../../../../docs/directory-state-reactivity.md) adds a repository-owned terminal derivation failure that becomes `RepositoryState.error`, implying a new stable DomainError contract. Current accepted repository discovery has no confirmed expected terminal failure after a clean directory snapshot: candidate read failures are intentionally tolerated as skip + bounded diagnostic, malformed/invalid v3 wrappers decode to `undefined`, and filename/index classification is synchronous. The current repository facts error enum therefore contains only the tolerated diagnostic code. Adding a new terminal repository-domain error is stronger than current requirements.

Evidence:

- [Directory-state reactivity architecture](../../../../docs/directory-state-reactivity.md) — requires a repository-owned terminal derivation error and sticky retry semantics for it.
- [Current repository facts error codes](./repositoryFactsErrorCode.ts) — only `storageCandidateReadFailed` exists, for the tolerated diagnostic path.
- [Current repository discovery](./repositoryStorageFiles.ts) — `getRepositoryFacts()` supplies a fixed listing to storage discovery and tolerates candidate read failures.
- [Storage discovery policy](../../lib/automergeAdapter/storageFilePolicy.ts) and [v3 decoder](../../lib/automergeAdapter/v3StoragePolicy.ts) — bounded candidate reads return missing/invalid results rather than a domain failure; malformed wrappers are non-throwing invalid data.

Basis:

- [Root architecture rules](../../../../AGENTS.md) — additional error state/contracts and stronger recovery guarantees require a current requirement and the simpler complete design wins.
- [Architect handoff skill](../../../../.agents/skills/architect-handoff/SKILL.md) — do not add stronger guarantees, recovery paths, or public contracts without a current scenario/invariant.
- [Source error rules](../../../AGENTS.md) — expected boundary failures need stable DomainError contracts, while internal programmer/invariant failures are a distinct concern and do not justify inventing a domain failure scenario.

Risk: implementation creates a new public error enum/message, recovery branch, and tests for a failure class that current storage policy deliberately eliminates, increasing state/API complexity and future compatibility surface without protecting a confirmed user scenario.

Required final state: remove the repository-specific terminal derivation DomainError/retry path unless inspection identifies a concrete expected runtime failure that survives the accepted tolerant storage policy. `RepositoryState.error` may carry the canonical filesystem/directory failure already owned below. Unexpected programmer/invariant exceptions remain exceptional infrastructure failures rather than a newly invented recoverable repository domain state. If a real expected repository-boundary failure is identified during correction, then and only then define its exact contract.

Verification: repository tests prove tolerated candidate failures remain skip + bounded diagnostic and directory failures map into RepositoryState error/recovery. No new repository terminal error contract/test is added without a concrete failure source.

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

Required final state: define the entity migration explicitly. Canonical initial repository `loading` is the only lifecycle state that selects the loading branch; `ready` and `refreshing` both expose their snapshot to content; `error` exposes one raw canonical error/recovery fact plus only unavoidable query-transport failure handling; visibility is a synchronous projection. Remove obsolete split error aliases and entity `refetch` unless a confirmed consumer is found. Generic query transport state must not become a second repository refresh lifecycle.

Verification: entity/widget tests cover initial loading, `ready -> refreshing -> ready`, sticky directory-error retry, one canonical recovery/error candidate, removal of legacy split aliases/refetch consumers, and no spinner/content regression during `refreshing`.

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
- A repository-specific terminal DomainError can be added later if a concrete expected derivation failure is introduced.

## Unresolved questions

None.
