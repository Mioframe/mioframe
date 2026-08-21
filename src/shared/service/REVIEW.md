# Review

Verdict: blocked

## Scope reviewed

- Full PR #215 directory-state-reactivity implementation, including filesystem/repository coordinators, service assembly and worker boundary, repository/document consumers, recovery interaction, proof, removals, and canonical handoff/preflight.

## Blockers

### B1 — New service-internal raw Observable entry points are exposed through the worker RPC surface

Owner: `src/shared/service`

Problem: The accepted architecture defines `directoryState$` and `repositoryState$` as service-internal entry points and exposes only `readDirectoryFresh()` plus the `repositoryState` query across the worker boundary. The implementation returns `directoryState$` from `useFileSystemService()` and returns `repositoryState$` plus the new internal `documentIds$` projection from `useRepositoriesService()`. `setupMainService()` publishes those service objects unchanged, and the path-based proxy can invoke any function property by string path. Therefore these raw Observable functions are part of the generated `useMainServiceClient()` RPC surface even though no Observable transport contract exists and the handoff explicitly forbids raw-Observable RPC.

Evidence:

- [fileSystem/useFileSystemService.ts](./fileSystem/useFileSystemService.ts) — the returned service object includes `directoryState$` alongside the intended public `readDirectoryFresh`/query APIs.
- [repositories/repositoriesService.ts](./repositories/repositoriesService.ts) — the returned service object includes `repositoryState$` and `documentIds$` alongside public `repositoryState`.
- [setupMainService.ts](./setupMainService.ts) — publishes `useFileSystemService()` and `useRepositoriesService()` objects directly as the main worker service surface.
- [../lib/proxyService/proxyService.ts](../lib/proxyService/proxyService.ts) — `callPath` resolves arbitrary string paths and invokes any function found there; there is no member whitelist that would make returned `$` functions private.
- [../../../docs/directory-state-reactivity.md](../../../docs/directory-state-reactivity.md) — defines raw `$` streams as service-internal and the worker-facing entry points as `readDirectoryFresh` and `repositoryState`; explicitly forbids raw Observable public/RPC API.
- [../../../docs/directory-state-reactivity-worker-boundary-correction.md](../../../docs/directory-state-reactivity-worker-boundary-correction.md) — resolves the correction architecture at the worker assembly boundary without changing coordinator ownership.

Basis:

- [../../../docs/directory-state-reactivity.md](../../../docs/directory-state-reactivity.md) — accepted API boundary requires raw `$` streams to remain service-internal and forbids raw-Observable RPC.
- [../../../docs/directory-state-reactivity-worker-boundary-correction.md](../../../docs/directory-state-reactivity-worker-boundary-correction.md) — correction contract selects `setupMainService` publication curation as the minimum complete design and preserves same-worker service access.
- [../../../AGENTS.md](../../../AGENTS.md) — UI-facing background access must use explicit public proxy/client APIs and public service contracts must remain narrow.
- [AGENTS.md](./AGENTS.md) — `@shared/service` and service proxy contracts must stay narrow and deterministic.

Risk: Internal lifecycle/coordinator APIs become callable from the main-thread client despite having no supported wire representation or public semantics. That widens and destabilizes the worker contract, allows accidental misuse of service-owned lifecycle state, and contradicts the source-of-truth/API boundary the refactor was designed to establish.

Required final state: Preserve the current two-coordinator implementation and existing internal service-to-service consumption, but ensure the new raw Observable internals (`directoryState$`, `repositoryState$`, and the new internal document-id projection) are not reachable through `useMainServiceClient()`/the main worker RPC surface. Keep `readDirectoryFresh()` and `repositoryState` as the intended worker-facing APIs. Do not broaden this correction into an unrelated redesign of legacy service internals unless required to make the new boundary explicit and type-safe.

Verification: Add the lowest faithful service/worker-boundary contract proof showing the new internal `$` entry points are absent from the main client surface while public `repositoryState` and `readDirectoryFresh` remain available; run focused type-check/unit proof for the changed service assembly/boundary.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- General cleanup of pre-existing legacy raw `$` service members outside the new directory-state-reactivity contract is not required by this PR unless the minimal boundary correction necessarily touches that shared mechanism.

## Unresolved questions

None.
