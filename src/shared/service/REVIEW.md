# Review

Verdict: blocked

## Scope reviewed

- Cross-service portion of PR #211: file-system persisted/runtime mount transition, repository lifecycle, worker/service contracts, and deterministic multi-service proof.

## Blockers

### B1 — Locator-different recovery still live-rebinds a different storage under the old VFS path

Owner: `src/shared/service`

Problem: current production code still uses `ConfirmedReplacementLeaseProvider`, repository reservation state, `repositoryStateActive`, a lease-specific file-system error, and worker-surface filtering so locator-different recovery can replace backing storage under the same live path.

Basis:

- [Ready recovery handoff](../../../docs/local-directory-access-recovery.md) now rejects that design. Only `isSameEntry() === true` may keep the existing path. Locator-different confirmed recovery must relocate the remembered record to a different unique mounted name/path.
- fileSystem owns persisted handles and mount identity; repositories owns Repo/cache/retrying-storage state and must not own local-directory relocation protocol.

Risk: old path-keyed intent can resume against different physical storage and cross service ownership remains coupled around one feature scenario.

Required final state:

- remove confirmed-replacement lease/provider/reservation/guard behavior from fileSystem and repositories;
- remove `repositoryStateActive`, lease-specific file-system errors, and PR-specific worker projection machinery that exists only for the lease design;
- keep the existing generic write-recovery registration only for permission recovery and proven same-entry reconnect;
- implement locator-different relocation entirely in fileSystem under a new unique mounted identity/path.

Verification: old VFS path cannot route to selected locator-different storage after relocation; repository service contains no local-directory relocation behavior.

### B2 — Same-entry repository settlement proof is timing-dependent and status-only

Owner: `src/shared/service`

Problem: `fileSystemRepositoriesReplacement.integration.test.ts` uses fixed `20 ms`/`250 ms` waits and the same-entry success case does not directly prove the queued write reached storage through the rebound handle.

Basis:

- [Testing architecture](../../../docs/testing/architecture.md) forbids arbitrary sleeps as lifecycle synchronization.
- [Ready recovery handoff](../../../docs/local-directory-access-recovery.md) requires deterministic, effect-based proof for actual fileSystem/repositories write-recovery registration.

Required final state: retain only the same-entry cross-service integration proof required by the new architecture; replace sleeps with explicit deterministic barriers/awaitable effects and assert a direct storage effect through the rebound handle.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Do not broaden this PR into a general worker-client API redesign. Remove PR-specific projection machinery once the lease design is gone unless an independent current requirement still needs it.

## Unresolved questions

None. Architecture is resolved and implementation-ready in `docs/local-directory-access-recovery.md`.
