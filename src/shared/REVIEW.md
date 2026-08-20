# Review

Verdict: blocked

## Scope reviewed

- Shared storage/repository changes in PR #211 against the simplified local-directory recovery handoff.

## Blockers

### B1 — Repository retirement subsystem is outside the required recovery design

Owner: `src/shared/service/repositories`

Problem: the PR currently adds `repositoryLifecycle.ts`, a silent no-op retirement adapter, VFS `DELETE`/`RENAME`-driven Repo retirement, shutdown handling, and lifecycle tests. The current handoff no longer requires or permits this subsystem. Locator-different recovery mounts the selected storage only at a different path, while proven same-entry reconnect intentionally preserves the existing path/Repo.

Evidence:

- [Repository lifecycle gate](service/repositories/repositoryLifecycle.ts) turns stale storage operations into successful no-ops.
- [Repositories service](service/repositories/repositoriesService.ts) adds VFS event-driven cache retirement on top of the pre-PR path cache.
- [File-system relocation](service/fileSystem/useFileSystemService.ts) already allocates a new name before removing the unavailable mount, so the selected candidate is not exposed through the old path.

Basis:

- [Local-directory recovery handoff](../../docs/local-directory-access-recovery.md) explicitly keeps the existing directory/Repo lifecycle model and forbids repository retirement infrastructure in this PR.
- [Root architecture rules](../../AGENTS.md) require the minimum complete design and removal of abstractions not justified by the current requirement.

Risk: retaining this subsystem introduces a second lifecycle model before the planned directory-reactivity redesign, adds unsafe silent-success behavior for stale writes, and expands the PR across VFS/Repo resource semantics without a product requirement.

Required final state:

- delete `repositoryLifecycle.ts` and its dedicated tests;
- remove VFS `DELETE`/`RENAME` repository retirement logic and lifecycle-only tests;
- restore the pre-PR Repo cache/idle lifecycle semantics;
- keep the PR's required write-settlement correction, including mapping a rejecting `repo.flush()` to a non-flushed `WriteAccessRecoveryResult` after committed same-entry reconnect;
- do not add replacement route identity, generation, lease, tombstone, shutdown, or document-lifecycle mechanisms.

Verification:

- existing same-identity 60-second Repo reuse tests remain green;
- same-entry real fileSystem/repositories settlement integration remains green;
- rejecting `repo.flush()` still returns `reconnectedWithWriteRecoveryFailure` without rollback;
- relocation service proof continues to show selected storage reachable only at the new path.

## Major issues

None in this owner scope.

## Minor issues

None.

## Accepted risks / deferred work

- Generic stale-Repo behavior if an unrelated future mount later reuses the same textual VFS path is a pre-existing lifecycle concern and belongs to the separate directory/storage-reactivity redesign, not PR #211.
- External filesystem observation and directory refresh/loading semantics are also deferred.

## Unresolved questions

None.
