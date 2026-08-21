# Review

Verdict: blocked

## Scope reviewed

- Repository derivation coordinator, repository service integration, storage-policy reuse, Repo/document-id projections, and deterministic proof required by the directory-state-reactivity handoff.

## Blockers

### B1 — Real-boundary zero-listing proof uses wall-clock polling instead of deterministic fixture setup

Owner: `src/shared/service/repositories`

Problem: The previously missing normalized-path sharing, sticky-error recovery, superseding-error suppression, and value-equal rediscovery proofs are now present and accepted. The remaining real-boundary proof correctly exercises the real `repositoryState` -> `getRepositoryFacts` path and asserts zero additional `vfs.readDirectory()` calls, but its fixture waits for asynchronous Automerge persistence with a bounded `setTimeout(25)` polling loop. The handoff requires deterministic service/unit proof for this invariant; wall-clock storage polling makes this proof scheduler/timing-dependent even though the invariant itself does not require asynchronous Repo persistence.

Evidence:

- [repositoryState.test.ts](./repositoryState.test.ts) — now proves normalized-equivalent path sharing, sticky error through replacement derivation, newer-error stale suppression, and value-equal ready rediscovery.
- [repositoryState.integration.test.ts](./repositoryState.integration.test.ts) — correctly keeps `getRepositoryFacts` real and spies on `vfs.readDirectory`, but prepares the storage fixture by polling up to 20 times with a 25 ms `setTimeout` delay while waiting for Automerge writes.
- [repositoryStorageFiles.ts](./repositoryStorageFiles.ts) — `getRepositoryFacts` only needs an accepted `DirectoryEntries` snapshot plus readable storage candidate bytes; the zero-listing contract does not require the fixture to be produced through asynchronous Repo persistence.

Basis:

- [directory-state-reactivity.md](../../../../docs/directory-state-reactivity.md) — deterministic service/unit proof is the primary proof, and repository derivation must prove `0` duplicate canonical listings.
- [AGENTS.md](../../../../AGENTS.md) — required risk-specific proof must be reliable; green automated checks do not replace a missing or unstable contract proof.

Risk: The proof can become flaky or slow under CI scheduling/load and can fail for fixture-timing reasons unrelated to the `0`-listing invariant, weakening exact-head verification without increasing contract fidelity.

Required final state: Keep the real `createRepositoryStateCoordinator` -> real `getRepositoryFacts` -> real `VirtualFileSystem` boundary and the `readDirectory` spy, but prepare a valid repository storage candidate deterministically without wall-clock polling/sleeps. The test must still prove that supplied accepted directory entries are sufficient to discover a document ID with zero additional canonical `readDirectory()` calls. Production code must remain unchanged unless a deterministic proof exposes a real defect.

Verification: Run the focused verifier-managed unit/type/lint checks for the repository-state proof files. No browser proof or broad local handoff gate is required.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
