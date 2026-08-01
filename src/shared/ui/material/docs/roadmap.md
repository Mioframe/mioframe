# Mioframe Material migration roadmap

This file is the only owner of current Material milestone status, family-stage status, technical blockers, and next operator action. Durable rules live in the other canonical documents.

## Current state

Last updated: 2026-08-01

Current milestone: `M0/M1 — prove the autonomous staged workflow through the Loading Indicator/Button pilot`

Status: `in-progress`

Runtime implementation status: current Loading Indicator and Button runtime corrections are implemented; no runtime redesign is presently identified.

Workflow-rule status: the durable workflow now defines:

- one operator invocation;
- fresh isolated workers for five reasoning stages;
- one state-machine owner;
- fixed control fields and required headings;
- separate design artifact and design contract revisions;
- one fixed 30-calendar-day documentation refresh interval;
- metadata-only source refresh without downstream invalidation;
- exact artifact revisions and invalidating upstream revision links;
- exact dependency review revisions in parent architecture;
- source-contract and renderer revision invalidation;
- exact return family plus stage;
- durable origin-family resume after cross-family correction;
- dependency families plus a gate-free dependency queue;
- full dependency pipelines through current independent review;
- active dependency-path cycle detection;
- parent architecture rerun after dependency completion or dependency review change;
- deterministic no-consumer standalone library scenario without speculative state APIs;
- implementation preflight before code and consumer edits;
- Git/PR-independent worker evidence;
- compact execution ledger instead of copied worker reports;
- one final post-review workflow verification;
- operator visual/motion feedback as a defect-reporting channel.

The workflow remains `implemented-unproven` until one real `material-component Button` invocation completes the pilot.

## Pilot artifact state

All existing pilot artifacts predate the final design-contract, dependency-cycle, correction-resume, revision-link, and heading contract.

The official design and runtime content remains useful, but both families must refresh from design once to normalize the new fields. Later metadata-only design refreshes must not cascade when contract revision remains unchanged.

### Loading Indicator

```text
DESIGN.md          refresh required for artifact/contract/source metadata
ARCHITECTURE.md    refresh required with exact design contract and renderer revisions
IMPLEMENTATION.md  refresh required with exact architecture revision
MIGRATION.md       refresh required with exact implementation revision
REVIEW.md          fresh independent review with design contract and downstream revisions
```

Expected renderer revision: `@m3e/web@2.6.3` from the lockfile.

Operator visual status: `no-reported-defect`.

### Button

```text
DESIGN.md          refresh required for artifact/contract/source metadata
ARCHITECTURE.md    refresh required with dependency families, queue, and review revisions
IMPLEMENTATION.md  refresh required with exact architecture revision
MIGRATION.md       refresh required with exact implementation revision
REVIEW.md          fresh independent review with design contract and downstream revisions
```

Button architecture must list `loadingIndicator` as a dependency, queue it only while its review is not current, and then record the exact Loading Indicator review revision.

Expected renderer revision: `@m3e/web@2.6.3` from the lockfile.

Operator visual status: `no-reported-defect`.

## Pilot scenarios that must be proven

The single invocation must prove:

1. both families receive normalized artifact revisions, design contract revisions, and source-refresh metadata;
2. refresh interval is exactly 30 calendar days;
3. a controlled metadata-only design refresh changes artifact revision and dates but preserves design contract revision and does not run downstream stages;
4. Button architecture emits `Dependency families: loadingIndicator` and a gate-free pending queue;
5. Loading Indicator runs through its complete pipeline to current independent review;
6. Button architecture reruns, clears the queue, and records the exact Loading Indicator review revision;
7. Button continues through implementation, migration, and independent review;
8. a cross-family correction records origin and target, completes the target family, then resumes the origin through durable validation and executes the origin stage fresh;
9. a dependency-review change that invalidates Button architecture forces Button architecture and downstream stages before Button review clears the route;
10. after an upstream artifact rewrite, invocation-local pending state is discarded and the next stage is reconstructed only from durable revision mismatches;
11. a controlled self- or ancestor-dependency entry is detected through the active path and routed to the emitting family architecture without recursive traversal;
12. the cycle check is performed without introducing a production dependency cycle;
13. implementation and migration run preflight where edits or revalidation require it;
14. no worker depends on Git, PR, commit, or external-check state;
15. the compact ledger records workers, revisions, origins, targets, dependency path, and correction routes without copying full reports;
16. one final `pnpm verify` runs after current reviews;
17. no second operator command is required.

## Exit criteria

The pilot is complete only when:

- Loading Indicator and Button satisfy every current artifact gate;
- metadata-only design refresh does not invalidate architecture or downstream work;
- design contract change still invalidates architecture correctly;
- dependencies complete through current review before parent implementation;
- parent architecture records and validates exact dependency review revisions;
- dependency cycles are detected and routed without recursive execution;
- cross-family correction resumes the origin through durable validation and refreshes the origin stage;
- durable revision links recover correctly after invocation-local state is discarded;
- source and renderer revision fields match current workspace facts;
- each reasoning stage uses a fresh isolated worker;
- preflight and focused verification are recorded where applicable;
- review uses `compliant-with-listed-risks` only for genuine bounded limitations;
- one final `pnpm verify` passes after current reviews;
- no operator-reported visual/motion defect remains unresolved.

## Milestones

| ID  | Milestone                           | Status                 | Exit gate                                                                                       |
| --- | ----------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------- |
| M0  | workflow architecture and rules     | `implemented-unproven` | pilot proves refresh, dependency, cycle, correction, durable resume, review, and final verifier |
| M1a | Loading Indicator dependency family | `refresh-required`     | five successful revision-linked artifacts and no unresolved reported defect                     |
| M1  | Button action family                | `refresh-required`     | dependency review linkage, cycle safety, five current artifacts, final verification              |
| M2  | Switch stateful pilot               | `planned`              | controlled state/event contract and no-consumer/default-scenario behavior through workflow      |
| M3  | sequential component migration      | `planned`              | dependency-first autonomous family migrations                                                   |

## Next operator action

Run once:

```text
material-component Button
```

The invocation must refresh Loading Indicator through current review, rerun Button architecture, record the dependency review revision, continue Button through review, prove metadata-only refresh, cycle protection, correction-origin durable resume, and finish with one final `pnpm verify` without another operator command.

No manual artifact patch, separate dependency command, positive visual acknowledgement, local `verify:release`, dependency pin, worker registry, artifact hash system, workflow database, or generic adapter framework is required.
