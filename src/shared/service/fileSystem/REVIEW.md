# Review

Verdict: blocked

## Scope reviewed

- Directory-state reactivity handoff against merged #211, current VFS/filesystem invalidation semantics, imperative fresh-list consumers, repository storage reads, concurrency, cleanup, and minimum-complexity rules.

## Blockers

None.

## Major issues

### M1 — read serialization is broader than the owned coordinator and adds an unneeded refresh-waiter protocol

Owner: `src/shared/service/fileSystem`

Problem: [the architecture handoff](../../../../docs/directory-state-reactivity.md) states physical same-path `readDirectory()` concurrency `<= 1` and makes public `refreshDirectory()` part of coordinator demand through refresh-waiter bookkeeping, while the same handoff explicitly permits operation-specific storage reads outside canonical reactive derivation. Current [repository storage operations](../repositories/repositoryStorageFiles.ts) perform independent `vfs.readDirectory()` calls, so a global physical same-path `<= 1` guarantee would require the global scheduling that the handoff forbids. The only confirmed imperative freshness consumer, [starter-example creation](../../../features/exampleDocumentsCreate/useExampleDocumentsCreate.ts), needs one fresh OPFS listing to choose a free name and already has a `FileExists` race fallback; it has no requirement to update or join canonical reactive state.

Evidence:

- [Directory-state reactivity architecture](../../../../docs/directory-state-reactivity.md) — refresh waiters are coordinator demand; the acceptance matrix states physical same-path `readDirectory()` concurrency `<= 1`; operation-specific delete/export/import reads are separately allowed.
- [Repository storage operations](../repositories/repositoryStorageFiles.ts) — `getDocumentStorageFiles()` and cleanup paths perform direct operation-scoped directory listings.
- [Starter-example action](../../../features/exampleDocumentsCreate/useExampleDocumentsCreate.ts) — uses one listing only to skip occupied `Examples*` names and falls back to `FileExists` retry for races.

Basis:

- [Root architecture rules](../../../../AGENTS.md) — require the minimum complete design and the simpler viable alternative when it satisfies the same scenarios.
- [Architect handoff skill](../../../../.agents/skills/architect-handoff/SKILL.md) — stronger guarantees and extra coordination require a current consumer/invariant; a narrower sufficient contract must be preferred.

Risk: implementation must either violate its stated concurrency criterion, broaden scope into a global read scheduler, or retain refresh-waiter state/lifecycle complexity solely to enforce a cross-caller guarantee that no current scenario requires.

Required final state: scope `<= 1` to coordinator-owned canonical reactive revalidation only. The confirmed imperative fresh-list consumer uses a simple bounded one-shot, name-sorted filesystem read that cannot return observable replay; it does not join or mutate canonical reactive state unless a current consumer requiring that behavior is identified. Remove refresh-waiter ownership/sharing semantics from the coordinator when no such consumer exists. Operation-specific storage reads remain outside the coordinator.

Verification: deterministic filesystem tests prove coordinator-owned reactive reads never overlap and stale reactive completions cannot publish; the one-shot listing performs a real sorted read rather than replay. Starter-example tests preserve first-free-name selection and `FileExists` fallback. No test asserts global read serialization across unrelated storage operations.

### M2 — internal directory lifecycle is over-modeled and its invalidation transition is not explicit

Owner: `src/shared/service/fileSystem`

Problem: [the handoff](../../../../docs/directory-state-reactivity.md) gives service-internal `DirectoryState` separate `loading` and `refreshing` variants even though no public directory lifecycle consumer remains and the repository owner already determines public `loading` versus `refreshing` from whether it has a previous repository snapshot. At the same time, the filesystem algorithm never explicitly states that invalidating a previously `ready` directory must synchronously publish the in-progress/invalidation state before asynchronous revalidation can settle. Repository stale-derivation suppression depends on that timing.

Evidence:

- [Directory-state reactivity architecture](../../../../docs/directory-state-reactivity.md) — dead public directory surfaces are removed; repository lifecycle independently maps directory work to `loading`/`refreshing`; an active repository derivation becomes stale on a newer directory `refreshing` state, but the filesystem algorithm does not define the exact `ready -> refreshing` publication point.
- [VFS watch contract](../../lib/virtualFileSystem/VirtualFileSystem.ts) — matching invalidation events are delivered to the registered listener before any new asynchronous directory read completes, so the filesystem state owner can signal invalidation immediately.

Basis:

- [Root architecture rules](../../../../AGENTS.md) — require fewer concepts when they satisfy the same acceptance criteria and a fully resolved lifecycle before implementation.
- [Architect handoff skill](../../../../.agents/skills/architect-handoff/SKILL.md) — state shape/lifecycle decisions must be resolved and unnecessary state rejected before implementation.

Risk: implementation can either duplicate an unused filesystem distinction or delay invalidation publication until a read settles, allowing an older repository derivation to publish after newer filesystem work is already known to be required.

Required final state: use the minimum internal directory lifecycle required by its service consumer: one non-error in-progress/invalidation state plus `ready(entries)` and `error(error)` is sufficient unless an independent consumer of separate filesystem `loading` versus `refreshing` is identified. Initial demand and invalidation of `ready` enter that in-progress state synchronously before asynchronous read work can settle; repository state maps it to public `loading` or `refreshing` using its own previous snapshot. While terminal directory `error` is current, retry work keeps that error sticky until the next terminal success/error.

Verification: deterministic transition tests prove initial in-progress work, immediate `ready -> in-progress` on invalidation, burst/trailing revalidation, sticky-error retry, and immediate suppression of an older active repository derivation.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- A global VFS read scheduler or generic reactive-resource manager remains unnecessary.

## Unresolved questions

None.
