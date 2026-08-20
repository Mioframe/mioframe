# Review

Verdict: blocked

## Scope reviewed

- Directory-state reactivity architecture against current `develop`, merged #211 recovery/topology behavior, filesystem invalidation, concurrency, and cleanup contracts.

## Blockers

None.

## Major issues

### M1 — directory `refreshing` transition is not defined

Owner: `src/shared/service/fileSystem`

Problem: [the architecture handoff](../../../../docs/directory-state-reactivity.md) defines `DirectoryState.refreshing` and requires repository derivations to become non-publishable on a newer directory `refreshing` state, but the filesystem algorithm only says that invalidation/refresh sets `dirty`, starts a read, and later publishes `ready`/`error`. It never states exactly when `ready -> refreshing` is emitted. An implementation that delays or omits that transition can let an old repository derivation publish while a newer filesystem revalidation is already known to be required.

Evidence:

- [Directory-state reactivity architecture](../../../../docs/directory-state-reactivity.md) — `DirectoryState` includes `refreshing`; repository rule 9 depends on newer `refreshing`, but the filesystem transition algorithm does not define its publication point.
- [Current filesystem service](./useFileSystemService.ts) — current invalidations start a new physical read immediately, demonstrating that the redesign must explicitly replace this race-prone behavior rather than leave the lifecycle transition implicit.

Basis:

- [Root architecture rules](../../../../AGENTS.md) — require no stale-result races and a fully resolved ready handoff before implementation.
- [Architect handoff skill](../../../../.agents/skills/architect-handoff/SKILL.md) — unresolved lifecycle/state decisions block implementation readiness.

Risk: a repository snapshot derived from the previous directory state can publish during an already-known revalidation window, violating the central stale-result invariant.

Required final state: define the filesystem transition matrix explicitly. With no prior successful snapshot, active required work is `loading`. From `ready`, any invalidation or explicit refresh must synchronously make the canonical state `refreshing` before the resulting physical read can complete; repeated invalidations remain `refreshing` through required trailing reads. From `error`, retry work keeps the existing error sticky until the next terminal `ready` or `error`.

Verification: deterministic filesystem/repository tests prove `ready -> refreshing` occurs on invalidation/explicit refresh before stale repository derivation can publish, remains through trailing reads, and sticky-error retry does not emit `refreshing`.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
