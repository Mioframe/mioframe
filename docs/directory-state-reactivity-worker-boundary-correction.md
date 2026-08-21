# Directory state reactivity — worker boundary correction

Status: **completed; correction passed semantic re-review**. This addendum records the worker-publication correction that closed the final PR #215 review blocker without reopening the accepted directory/repository coordinator architecture.

The directory/repository architecture and implementation are **ready**. No active owner-local `REVIEW.md` findings remain; exact-head GitHub CI is the remaining automatic acceptance gate.

Authority:

- `docs/directory-state-reactivity.md` remains the architecture source for directory/repository lifecycle and state ownership.
- `docs/directory-state-reactivity-implementation-preflight.md` remains the completed implementation record for the two-coordinator migration.
- This document records only the worker-surface correction discovered during final PR review.

## Problem

`directoryState$`, `repositoryState$`, and the repository `documentIds$` projection are worker-local service internals. They were returned by `useFileSystemService()` / `useRepositoriesService()`, while `setupMainService()` published those complete service objects through the reflective worker proxy. That made the three raw Observable functions reachable from `useMainServiceClient()` even though the accepted contract forbids raw Observable RPC.

The coordinator implementations were not defective. The defect was publication ownership at `setupMainService()`.

## Goal

Keep the three new raw Observable entry points available to background service modules that need direct same-worker composition, while removing them from the main worker RPC/client surface.

Required worker-facing contracts remain:

- `fileSystem.readDirectoryFresh(path)`;
- `repositories.repositoryState`;
- all other existing worker-facing members unaffected by this feature.

## Non-goals

Do not:

- redesign `proxyService`, `defineWorkerClient`, or `defineWorkerService`;
- move or rewrite either coordinator;
- change `useFileSystemService()` or `useRepositoriesService()` internal singleton ownership solely to hide these members;
- clean up pre-existing legacy raw `$` members outside this feature;
- introduce a generic public/private service framework, registry, decorator, whitelist protocol, or new service layer;
- change repository/document/entity/widget behavior or tests except where required by the worker-boundary contract.

## Ownership

- `src/shared/service/fileSystem`: keeps `directoryState$` as a background-service internal dependency.
- `src/shared/service/repositories`: keeps `repositoryState$` and `documentIds$` as background-service internal dependencies.
- `src/shared/service/setupMainService.ts`: owns the explicit object published through the main worker proxy and therefore owns exclusion of those internal members.
- `src/shared/service/setupMainService.test.ts`: primary deterministic proof of the publication boundary.

## Minimum sufficient design

Keep the existing service singleton objects unchanged for direct service-to-service imports. At the worker assembly boundary, derive the published file-system and repository objects by omitting only the three feature-internal members:

```ts
const fileSystem = omit(useFileSystemService(), ['directoryState$']);
const repositories = omit(useRepositoriesService(), ['repositoryState$', 'documentIds$']);
```

`setupMainService()` publishes those curated objects while continuing to publish the other services as today.

Use the existing `es-toolkit` `omit` helper rather than adding a project abstraction. The returned type must also omit those keys so `useMainServiceClient()` cannot expose them through TypeScript.

Why this is the minimum design:

- moving internals out of the service singleton would complicate current same-worker dependency wiring;
- changing the reflective proxy would have repository-wide blast radius unrelated to this feature;
- an explicit public-key allowlist for every current service would unnecessarily turn this correction into a broad API migration;
- omitting only the three newly introduced internal members fixes the accepted contract with one assembly-owned boundary decision.

## Files changed

- `src/shared/service/setupMainService.ts`
- `src/shared/service/setupMainService.test.ts`

No production changes were required elsewhere.

## TEST IMPACT

Contract: new directory-state-reactivity raw Observable internals are not part of the main worker surface.

Primary proof owner: `src/shared/service/setupMainService.test.ts`.

Required proof:

1. deterministically construct/mimic service objects containing both the internal and intended public members;
2. call `setupMainService()`;
3. prove `fileSystem.directoryState$` is absent;
4. prove `repositories.repositoryState$` and `repositories.documentIds$` are absent;
5. prove `fileSystem.readDirectoryFresh` remains present;
6. prove `repositories.repositoryState` remains present;
7. preserve the existing proof that `setupMainService` does not import the main-thread permission broker;
8. type-check proves the omitted members are not keys of the published `setupMainService()` result/client type.

The assembly test uses stand-in service factories to avoid initializing browser/storage services; coordinator behavior remains owned by its existing tests.

No browser, E2E, visual, storage, or coordinator proof is required for this correction.

## Acceptance criteria

- `directoryState$`, `repositoryState$`, and `documentIds$` remain available to their current same-worker service consumers.
- They are absent at runtime from the object returned by `setupMainService()`.
- They are absent from the inferred public worker/client type.
- `readDirectoryFresh` and `repositoryState` remain worker-facing.
- No coordinator, repository lifecycle, DocumentService, UI lifecycle, #211 recovery, VFS/provider, or proxy behavior changes.
- No legacy service-surface cleanup is bundled into this correction.

## Verification

Focused coding-agent verification passed:

```text
pnpm verify --only unit-tests --files src/shared/service/setupMainService.test.ts
pnpm verify --only type-check --files src/shared/service/setupMainService.ts src/shared/service/setupMainService.test.ts
pnpm verify --only oxlint --files src/shared/service/setupMainService.ts src/shared/service/setupMainService.test.ts
```

Exact-head GitHub CI remains architect-owned after semantic re-review.

## Forbidden

- no coordinator changes;
- no `useFileSystemService` / `useRepositoriesService` lifecycle redesign;
- no proxy/serializer/transformer changes;
- no new generic facade/public-service abstraction;
- no repository-wide raw `$` cleanup;
- no hiding unrelated existing worker members;
- no compatibility alias for the three internal functions;
- no test-only production hook;
- no sleeps, polling, or browser proof.
