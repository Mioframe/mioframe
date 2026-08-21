# Review

Verdict: blocked

## Scope reviewed

- Repository entity adaptation of the unified `RepositoryState`, including loading/error mapping, synchronous storage-file visibility projection, reactive visibility settings, and proof ownership for PR #215.

## Blockers

### B1 — Required reactive visibility proof is missing

Owner: `src/entities/repository`

Problem: The accepted directory-state-reactivity contract requires changing the storage-file visibility setting to remain a synchronous projection of the already accepted repository snapshot, causing `0` filesystem reads and `0` repository derivations. `useRepository()` is implemented that way, but its tests only prove the initial visibility option and the initial single-query setup. They never change the visibility option while the composable is mounted, so the required reactive no-I/O/no-rederivation contract is not protected.

Evidence:

- [useRepository.ts](./useRepository.ts) — repository query arguments depend only on `path`; `hideAutomergeFiles` is currently applied synchronously to `snapshot.entries`.
- [useRepository.test.ts](./useRepository.test.ts) — tests one initial `hideAutomergeFiles: false` value and separately checks one query on mount, but has no mounted option transition proving the same repository query/derivation remains in use.

Basis:

- [directory-state-reactivity.md](../../../docs/directory-state-reactivity.md) — repository acceptance explicitly requires that the visibility setting causes `0` FS reads and `0` derivations.
- [directory-state-reactivity-implementation-preflight.md](../../../docs/directory-state-reactivity-implementation-preflight.md) — assigns the Entity/Explorer primary proof to `useRepository.test.ts` and requires a synchronous visibility setting.
- [project-review](../../../.agents/skills/project-review/SKILL.md) — required proof absent is a merge-blocking finding; green unrelated checks do not substitute for the missing contract proof.

Risk: A future change could make the visibility option part of service query identity, refetch/restart repository state, or otherwise trigger filesystem/repository work on a presentation-only toggle while the current test suite remains green. That would violate the accepted ownership and performance contract.

Required final state: Deterministic entity proof shows that changing the visibility option on an already mounted repository view immediately reprojects the retained snapshot while keeping the same repository-state subscription/query and starting no new service-owned repository work. Production code should remain unchanged unless that proof exposes a defect.

Verification: Extend the owner-local deterministic unit proof for `useRepository` to exercise a reactive visibility-option transition and demonstrate both the changed visible entries and unchanged single repository-state query/subscription identity; run focused unit/type verification for that owner.

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
