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
- fixed control fields and required artifact headings;
- mechanical orchestrator routing;
- exact return family plus return stage;
- parseable dependency queue entries;
- dependency processing before parent architecture retry;
- mandatory parent architecture rerun after dependency gates;
- lockfile-resolved renderer revision invalidation;
- periodic official-source refresh dates;
- implementation preflight before code and consumer edits;
- Git/PR-independent worker evidence;
- compact execution ledger instead of copied worker reports;
- one final post-review workflow verification;
- operator visual/motion feedback as a defect-reporting channel.

The workflow remains `implemented-unproven` until one real `material-component Button` invocation completes the pilot.

## Pilot artifact state

All existing pilot artifacts predate the expanded control-field and required-heading contract.

The existing design content remains useful, but design artifacts lack the normalized source revision/check dates and exact required structure. Existing architecture artifacts lack normalized renderer revision, parseable dependency queue, exact return family, and dependency readiness semantics. Downstream artifacts also lack exact return-family routing and required handoff headings.

Therefore the mechanical workflow must refresh both families from design. This is expected to normalize and revalidate existing work, not redesign runtime unless a stage worker finds a concrete discrepancy.

### Loading Indicator

```text
DESIGN.md          refresh required for source metadata and headings
ARCHITECTURE.md    refresh required after design
IMPLEMENTATION.md  refresh required after architecture
MIGRATION.md       refresh required after implementation
REVIEW.md          fresh independent review required
```

Expected renderer revision for the current architecture pass: `@m3e/web@2.6.3` from the lockfile.

Operator visual status: `no-reported-defect`.

### Button

```text
DESIGN.md          refresh required for source metadata and headings
ARCHITECTURE.md    refresh required after design
IMPLEMENTATION.md  refresh required after architecture
MIGRATION.md       refresh required after implementation
REVIEW.md          fresh independent review required
```

Button architecture must queue Loading Indicator using exact dependency grammar and allow the orchestrator to process that queue before rerunning Button architecture.

Expected renderer revision for the current architecture pass: `@m3e/web@2.6.3` from the lockfile.

Operator visual status: `no-reported-defect`.

## Pilot scenarios that must be proven

The single invocation must prove all of these mechanical paths:

1. source-refresh fields are normalized for both families;
2. Button architecture emits an exact pending dependency entry such as `loadingIndicator@architecture` or a stronger required gate;
3. Button pauses without entering an architecture retry loop;
4. Loading Indicator reaches the requested gate through fresh workers;
5. Button architecture reruns, consumes the completed dependency handoff, and clears or recomputes its queue;
6. implementation and migration run preflight where edits or revalidation require it;
7. every stage writes required headings and exact return-family/stage fields;
8. any dependency-owned finding routes to `loadingIndicator/<stage>` rather than Button;
9. the compact execution ledger records worker executions and correction routes without copying full reports;
10. one final `pnpm verify` runs after current independent reviews;
11. no second operator command is required.

## Exit criteria

The pilot is complete only when:

- Loading Indicator and Button reach successful current artifact gates;
- dependency queue order and parent resume are proven;
- exact cross-family correction routing is proven or exercised by a controlled workflow check;
- source refresh and renderer revision fields match current workspace facts;
- each reasoning stage used a fresh isolated worker;
- no worker depended on Git, PR, commit, or external check state;
- implementation and migration preflight are recorded where applicable;
- review uses `compliant-with-listed-risks` only for genuine bounded accepted risks;
- the orchestrator retained only a compact execution ledger;
- one final `pnpm verify` passes after current reviews;
- no operator-reported visual/motion defect remains unresolved.

## Milestones

| ID  | Milestone                           | Status                 | Exit gate                                                                                |
| --- | ----------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| M0  | workflow architecture and rules     | `implemented-unproven` | one pilot invocation proves dependency, routing, refresh, ledger, and final verification |
| M1a | Loading Indicator dependency family | `refresh-required`     | five successful current artifacts and no unresolved reported defect                      |
| M1  | Button action family                | `refresh-required`     | dependency closure, five successful current artifacts, final verification                |
| M2  | Switch stateful pilot               | `planned`              | controlled state/event contract through the proven workflow                              |
| M3  | sequential component migration      | `planned`              | dependency-first autonomous family migrations                                            |

## Next operator action

Run once:

```text
material-component Button
```

The invocation must refresh Loading Indicator from design through the required dependency gate and current review, rerun Button architecture after dependency completion, continue Button through review, and finish with one final `pnpm verify` without another operator command.

No manual artifact patch, separate dependency command, positive visual acknowledgement, local `verify:release`, dependency pin, worker registry, artifact hash system, workflow database, or generic adapter framework is required.
