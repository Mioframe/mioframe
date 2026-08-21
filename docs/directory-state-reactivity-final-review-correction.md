# Directory state reactivity — final review correction handoff

Status: **ready for correction implementation**. This handoff consolidates the active findings discovered by the later full PR #215 re-review. It does not reopen or redesign the accepted directory/repository coordinator architecture.

## Authority

- `docs/directory-state-reactivity.md` remains the architecture source of truth.
- `docs/directory-state-reactivity-implementation-preflight.md` remains the completed implementation record.
- `docs/directory-state-reactivity-worker-boundary-correction.md` remains the accepted worker-publication correction record.
- Owner-local `REVIEW.md` files remain the detailed review source for each active finding.

Active review owners:

- `src/entities/repository/REVIEW.md` — blocker: required reactive visibility-toggle proof is missing.
- `src/entities/directory/REVIEW.md` — major: directory-entity ownership instructions and obsolete barrel cleanup are incomplete.
- `src/shared/service/repositories/REVIEW.md` — minor: repository internal-projection TSDoc points UI consumers at a forbidden raw Observable API.

## Goal

Close all three current review findings with the minimum complete correction so the full PR can return to semantic re-review and then exact-head GitHub CI.

## Non-goals

Do not change:

- either filesystem or repository coordinator;
- `RepositoryState`, `DirectoryState`, or worker-facing contracts;
- repository derivation, candidate classification, candidate concurrency, or canonical listing behavior;
- Repo identity/cache/lifetime;
- DocumentService behavior;
- #211 recovery or topology queue behavior;
- VFS/provider/Google/proxy transport behavior;
- Explorer behavior, branch ordering, or user-visible copy;
- unrelated legacy raw `$` service members.

No new abstraction, lifecycle state, query, cache, helper framework, compatibility API, or generic service/publication mechanism is required.

## Correction 1 — repository entity visibility proof

Owner: `src/entities/repository`.

Current production behavior is already the intended design: `useRepository()` has one `repositoryState` query keyed only by `path`, while `hideAutomergeFiles` synchronously filters the retained classified snapshot in the entity.

Required final state:

- keep production behavior unchanged unless the proof exposes an actual defect;
- extend `useRepository.test.ts` with a mounted reactive options transition;
- start from a ready snapshot containing both a regular entry and an `automergeStorageCandidate`;
- verify the default/hidden projection, then change the existing options ref so Automerge candidates become visible, and verify the visible entries update synchronously from the same snapshot;
- verify the visibility-only transition does not create a second `useObservableQuery` call or change repository query identity/arguments;
- do not add filesystem/service mocks merely to count calls the entity cannot make: at this owner boundary, unchanged single-query ownership plus local snapshot reprojection is the faithful proof that the presentation toggle cannot start new repository work.

The test should fail if visibility is later moved into query identity/refetch/re-subscription, and should remain local to the entity owner.

## Correction 2 — directory entity ownership cleanup

Owner: `src/entities/directory`.

Required final state:

- update `src/entities/directory/AGENTS.md` so it describes only responsibilities that remain in this owner after the refactor;
- it must not claim ownership of reactive directory listing lifecycle, filesystem reads, invalidation, or canonical directory state;
- preserve the remaining small directory-entry UI responsibility and the existing FSD rule that user actions/flows remain in features or higher composition;
- remove the empty obsolete `src/entities/directory/index.ts` barrel after confirming no current branch consumer requires it;
- do not remove or redesign `DirectoryContentEntry.vue` or unrelated owner-local tests.

This is ownership/documentation cleanup, not a new source-layer migration.

## Correction 3 — repository service TSDoc

Owner: `src/shared/service/repositories`.

Required final state:

- correct the `documentIds$` TSDoc in `repositoriesService.ts`;
- state clearly that `documentIds$` and `repositoryState$` are same-worker service internals;
- direct UI-facing consumers only to the public `repositoryState` query exposed through the worker client;
- do not change runtime exports, setupMainService publication, proxy behavior, or service contracts.

## Pass order

The corrections are independent and may be completed in one coding pass, but keep the changes conceptually separate:

1. add the missing repository-entity proof;
2. perform directory owner instruction/barrel cleanup;
3. correct repository-service TSDoc;
4. run only focused verification materially useful for these corrections.

If correction 1 exposes a production defect, stop broadening the patch: fix only the entity-owned cause necessary to restore synchronous local projection and one-query ownership, then rerun its focused proof. Do not alter service/coordinator architecture.

## TEST IMPACT

### Repository visibility setting

- Contract: visibility changes are synchronous projection of an accepted repository snapshot and do not restart repository work.
- Primary proof owner: `src/entities/repository/useRepository.test.ts`.
- New proof: mounted options-ref transition with immediate visible-entry change and unchanged single `repositoryState` query/subscription identity.
- Browser/E2E/visual proof: not required; no interaction or appearance behavior changes.

### Directory owner cleanup

- Contract: repository instructions match current ownership and obsolete public entry point is removed.
- Primary proof: repository instruction/static validation and type-check when materially useful.
- Runtime/browser proof: not required.

### Repository TSDoc

- Contract: nearest API documentation matches the already-correct worker/public boundary.
- Primary proof: static/type validation only if materially useful.
- Runtime proof: not required.

## Acceptance criteria

- all three active REVIEW findings are addressed;
- `useRepository()` still owns exactly one repository-state query and visibility remains local synchronous derivation;
- no filesystem/repository derivation is introduced for a visibility-only option change;
- `src/entities/directory/AGENTS.md` no longer assigns filesystem lifecycle ownership to the entity;
- the obsolete empty directory barrel is removed with no consumer breakage;
- repository service comments no longer direct UI consumers to `repositoryState$`;
- no coordinator, worker boundary, recovery, storage, DocumentService, Repo lifecycle, Explorer, or user-visible behavior changes;
- no unrelated cleanup.

## Verification

Use the smallest verifier-managed checks that materially prove the correction. The risk-specific proof should normally use:

```text
pnpm verify --only unit-tests --files src/entities/repository/useRepository.test.ts
```

A project type-check may be used if useful after the barrel removal:

```text
pnpm verify --only type-check
```

Do not mechanically run static labels for comment/AGENTS-only edits merely for handoff, and do not run broad `pnpm verify`, `--full`, or release verification solely for coding-agent completion. Exact-head GitHub CI remains architect-owned after semantic re-review.

## Forbidden

- no coordinator changes;
- no VFS/provider/Google/proxy production changes;
- no worker-publication redesign;
- no new query/refetch path for visibility;
- no equality cache, manager, scheduler, generation/token/lease, or compatibility layer;
- no browser/visual tests for these non-browser corrections;
- no arbitrary sleeps, retries, weakened assertions, or test-only production hooks;
- no edits to owner-local `REVIEW.md` files; the architect closes them after re-review;
- no PR metadata, merge, CI, or release-version work by the coding agent.
