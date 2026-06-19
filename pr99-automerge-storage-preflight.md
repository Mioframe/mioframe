# Goal

Finish PR #99 as a clean persisted storage contract refactor where `src/shared/lib/automergeAdapter` is the single owner of Automerge physical storage policy for v3 `.mf`, v2, and legacy files.

# Non-goals

Do not change logical `StorageKey` semantics, v3 filename shape, marker-file behavior, UI/service behavior outside repository storage discovery, or add new storage manifests/directories.

# Change classification

Primary: storage/data contract
Secondary: worker/provider boundary, cross-layer behavior

# Ownership matrix

- Source of truth: `src/shared/lib/automergeAdapter/storageFilePolicy.ts` plus its v3 domain helpers/codecs
- Runtime owner: `shared/lib/automergeAdapter`
- User-action owner: none; storage is consumed indirectly by repo/service code
- UI composition owner: none
- Error owner: existing adapter/VFS boundaries; invalid storage data remains policy-skipped, not fatal
- Retry/navigation owner: unchanged repository/service callers
- Verification owner: focused storage/repository tests plus final `pnpm verify`

# Affected consumers

`createFSStorageAdapter`, `createVFSAdapter`, `repositoryStorageFiles`, `repositoriesService` indirect discovery paths, `storageFilePolicy.test.ts`, adapter tests, and repository storage tests/integration tests.

# Expected final architecture

`storageFilePolicy` owns complete load, loadRange, save, remove, removeRange, discovery, and candidate-classification operations through a full IO boundary (`list`, `read`, `write`, `remove`). FS/VFS adapters stay thin IO wrappers with operation-scoped directory/path caching only. `repositoryStorageFiles` uses policy APIs and must not parse v3/v2/legacy names directly.

# Implementation constraints

Keep v3 wrapper decode robust, keep invalid/empty/truncated files skipped, keep invalid existing `.mf` candidates occupied on save, avoid long-lived directory caches, and prefer a light rename/split of `v3StorageHelpers` into a clearer domain module instead of wider abstraction.

# Tests

Focused pass: storage policy unit tests for save/remove/discovery/classification edge cases; FS/VFS adapter tests for thin behavior and one-operation scan caching; repository storage tests for policy-backed discovery and filename classification. Final gate: read-only `pnpm verify`.

# Forbidden

No UI/pane/widget changes, no repository-service reimplementation of filename parsing, no adapter-side wrapper encoding or write-target selection, no duplicated discovery rules, and no broad workflow/doc churn outside directly affected instructions.
