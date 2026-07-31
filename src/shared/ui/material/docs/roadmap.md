# Mioframe Material migration roadmap

This file is the only owner of current Material milestone status, family-stage status, technical blockers, and next operator action. Durable rules live in the other canonical documents.

## Current state

Last updated: 2026-07-31

Current milestone: `M0/M1 — prove the autonomous staged workflow through the Loading Indicator/Button pilot`

Status: `in-progress`

Runtime implementation status: the current Loading Indicator and Button runtime corrections are implemented; no runtime redesign is presently identified.

Workflow-rule status: the durable workflow has been corrected to use:

- one operator invocation;
- fresh isolated workers for five reasoning stages;
- fixed artifact control fields;
- mechanical orchestrator routing;
- explicit dependency queues;
- implementation preflight before coding and consumer edits;
- Git/PR-independent worker evidence;
- one final post-review workflow verification;
- operator visual/motion feedback as a defect-reporting channel.

The workflow is not considered proven until the pilot completes through one `material-component Button` invocation.

## Pilot artifact state

All existing pilot artifacts predate the fixed control-field contract. The design files contain valid official source content but do not yet expose every required standalone field; Button also formats its status as inline code rather than an exact enum value.

Therefore the mechanical workflow must refresh each family from its design stage. A design refresh is expected to normalize metadata and revalidate the existing official source ledger, not change the official contract unless newer evidence is found.

### Loading Indicator

```text
DESIGN.md          refresh required for fixed control fields
ARCHITECTURE.md    refresh required after design
IMPLEMENTATION.md  refresh required after architecture
MIGRATION.md       refresh required after implementation
REVIEW.md          fresh independent review required
```

Expected runtime change: none unless a stage worker finds a concrete discrepancy.

Operator visual status: `no-reported-defect`.

### Button

```text
DESIGN.md          refresh required for fixed control fields
ARCHITECTURE.md    refresh required after design
IMPLEMENTATION.md  refresh required after architecture
MIGRATION.md       refresh required after implementation
REVIEW.md          fresh independent review required
```

The existing review also predates the final test-wrapper warning correction.

Expected runtime change: none unless a stage worker finds a concrete discrepancy.

Operator visual status: `no-reported-defect`.

## Exit criteria

The pilot is complete only when:

- the Loading Indicator dependency reaches successful fixed artifact gates;
- Button reaches successful fixed artifact gates;
- each reasoning stage used a fresh isolated worker;
- orchestrator routing used fixed fields rather than semantic re-review;
- no worker depended on Git, PR, commit, or external check state;
- implementation and migration preflight were recorded where edits or revalidation required them;
- review uses `compliant-with-listed-risks` only for genuine bounded accepted risks;
- one final `pnpm verify` passes after the current reviews;
- no operator-reported visual/motion defect remains unresolved.

## Milestones

| ID  | Milestone                           | Status                 | Exit gate                                                                  |
| --- | ----------------------------------- | ---------------------- | -------------------------------------------------------------------------- |
| M0  | workflow architecture and rules     | `implemented-unproven` | one pilot invocation completes through fixed fields and final verification |
| M1a | Loading Indicator dependency family | `refresh-required`     | five successful current artifacts and no unresolved reported defect        |
| M1  | Button action family                | `refresh-required`     | dependency closure, five successful current artifacts, final verification  |
| M2  | Switch stateful pilot               | `planned`              | controlled state/event contract through the proven workflow                |
| M3  | sequential component migration      | `planned`              | dependency-first autonomous family migrations                              |

## Next operator action

Run once:

```text
material-component Button
```

The invocation must refresh the Loading Indicator dependency from design through independent review, resume Button from design through independent review, and finish with one final `pnpm verify` without another operator command.

No manual family-artifact patch, separate dependency command, positive visual acknowledgement, local `verify:release`, dependency pin, worker registry, artifact hash system, or generic adapter framework is required.
